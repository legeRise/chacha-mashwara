#!/usr/bin/env python3
"""On-demand script writer for Chacha Mashwara.

The UI posts a rule ID to /api/generate. This server builds a quality-gated
prompt, asks the local `opencode` agent to write the full episode script, saves
the result under scripts/generated/, and returns it to the browser.

Run:
    python3 tools/writer_server.py

Environment:
    PORT=8787
    WRITER_MODEL=opencode-go/deepseek-v4.1-flash
    OPENCODE_BIN=/home/ubuntu/.opencode/bin/opencode
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import tempfile
import threading
import time
from collections import defaultdict, deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from ezclip_export import script_to_ezclip

ROOT = Path(__file__).resolve().parent.parent
RULES_FILE = ROOT / "rules" / "rules.json"
OUT_DIR = ROOT / "scripts" / "generated"
PORT = int(os.environ.get("PORT", "8787"))
MODEL = os.environ.get("WRITER_MODEL", "opencode-go/deepseek-v4.1-flash")
OPENCODE = os.environ.get(
    "OPENCODE_BIN",
    "/home/ubuntu/.opencode/bin/opencode",
)
MAX_SCRIPT_SECONDS = 360
MAX_CRITIC_SECONDS = 300
MAX_TRANSLIT_SECONDS = 300
MAX_PER_HOUR = 12
MAX_ACTIVE = 1
QUALITY_GATE_FILE = ROOT / "engine" / "script-quality.md"

_lock = threading.Lock()
_active = 0
_rate: dict[str, deque[float]] = defaultdict(deque)
_rules_cache: dict[str, dict] = {}
_rules_mtime = 0.0


def load_rules() -> dict[str, dict]:
    global _rules_cache, _rules_mtime
    mtime = RULES_FILE.stat().st_mtime
    if mtime != _rules_mtime:
        data = json.loads(RULES_FILE.read_text(encoding="utf-8"))
        _rules_cache = {row["id"]: row for row in data}
        _rules_mtime = mtime
    return _rules_cache


def slugify(text: str) -> str:
    text = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return text[:60] or "script"


def prompt_for(rule: dict) -> str:
    gate = ""
    if QUALITY_GATE_FILE.exists():
        gate = QUALITY_GATE_FILE.read_text(encoding="utf-8")
    return f"""You are the head writer for "Chacha Mashwara", a Pakistani Urdu short horror series for YouTube Shorts.

Write ONE complete episode script in Markdown, 55-65 seconds when read aloud, based on the seed below.

MANDATORY CRAFT SKILLS
You must write this script through the project's `flash-fiction` and `endings`
diagnostics. Apply FF1-FF9 and E1-E6 as hard requirements, not suggestions. The
full script quality gate is included below. Every checkbox is mandatory.

BEGIN SCRIPT QUALITY GATE
{gate}
END SCRIPT QUALITY GATE

THE SHOW
- Chacha Mashwara is the host. He appears only in the cold open and the return.
- The story is fully dramatized with 2-4 speaking characters. No narrator.
- Chacha never appears inside the story.
- Dialogue in natural Hindi using Devanagari script. Stage directions and speaker names in English. Never write Roman transliteration; Hindi/Urdu words must be written in Devanagari.
- The rule is the title. The final image is silent and held for two seconds.
- No gore, no religious disrespect, no real names, no children harmed on screen.
- Never show or explain the entity. The horror is in an ordinary object and a human choice.

ADDITIONAL SHOW RULES
- The protagonist has a specific want and a concrete object/motif that carries subtext.
- The breach is sympathetic: love, guilt, fear, politeness, need, pride, or hope. Never mere curiosity.
- The twist is caused by the protagonist's choice, not a random event.
- Fix any logic problem in the seed. Characters know only what they can know.
- The verdict is one sentence and names the mistake, not the monster.
- The final image pays off the object/motif.
- No narrator, no Chacha inside the story.
- 55-65 seconds.
- Every scene must contain at least one spoken line. Ezclip drops a scene with no DIALOGUE; if a beat is silent, give the character a whispered full sentence.
- No one-word or two-word spoken turns. Every line must be a complete short sentence, at least four words, with a verb. The TTS has no sentence context for a bare "हाँ", "नहीं", "कौन" or "चल". The fixed tag "रूल याद रखना।" is the only exception.
- One scene, one location. Split at the door instead of putting the flat and the corridor in the same scene.

CHACHA FRAME (MANDATORY — this is the show's signature)
The cold open is Chacha talking straight to the viewer, not a trailer voice.
He is an uncle stating an obvious fact, with no drama and no growl.

Cold open, in this exact order:
1. A flat, common-sense warning:
   "लोग ऐसे ही नहीं कहते... <the rule in one short sentence>।"
2. Name the protagonist and say he had already heard it:
   "<Name> ने भी यह सुन रखा था। लेकिन उसने नज़रअंदाज़ कर दिया।"
3. Hand the story to the viewer:
   "फिर क्या हुआ? खुद ही देख लो।"

The return, in this order:
1. What the protagonist did, in one plain line.
2. What the thing understood it as, in one plain line.
3. The haunting outcome, one line.
4. A direct question to the viewer, then the tag "रूल याद रखना।"

Do not make Chacha poetic. Do not explain the entity. The frame is a man
telling you what happened, not a narrator performing a legend.

THE SEED
- ID: {rule.get('id','')}
- Rule: {rule.get('rule','')}
- Consequence: {rule.get('consequence','')}
- Story core: {rule.get('story_core','')}
- Cast: {rule.get('cast','')}
- Place: {rule.get('place','')}
- Breach reason: {rule.get('breach_reason','')}
- Twist: {rule.get('twist','')}
- Final image: {rule.get('final_image','')}
- Chacha location: {rule.get('chacha_location','')}
- Family: {rule.get('family','')}
- Tone: {rule.get('tone','')}
- Gate status: {rule.get('gate_status','ungated')} ({rule.get('seed_score','0')}/10)
- Existing quality flags: {rule.get('gate_flags','') or 'none'}
- Seed want: {rule.get('want','') or 'not filled'}
- Seed object/motif: {rule.get('object_motif','') or 'not filled'}
- Seed theme: {rule.get('theme','') or 'not filled'}
- Seed verdict: {rule.get('verdict','') or 'not filled'}

If the seed is generic or logically broken, improve it while writing. Do not preserve a weak breach or a random twist just because it is in the seed.

OUTPUT FORMAT — follow exactly, but write the actual script, never placeholders
# {rule.get('id','')} — {rule.get('rule','')}

**Runtime target:** 55-65 seconds
**Chacha location:** {rule.get('chacha_location','')}
**Story cast:** ...
**No narrator. No Chacha inside the story.**

## 0:00-0:09 — COLD OPEN
...
## 0:09-0:48 — THE STORY
### Scene 1 — Normal
...
### Scene 2 — The breach
...
### Scene 3 — Escalation
...
### Scene 4 — The twist
...
## 0:48-0:58 — RETURN
...
## FINAL IMAGE
...
## Production notes
- Voice direction for each character
- Sound and thumbnail notes
- No shot list; the scenes are the shots.

Write only the finished Markdown script. No preamble, no explanation, no code fences."""


def parse_opencode_output(raw: str) -> str:
    texts: list[str] = []
    for line in raw.splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        if event.get("type") == "text":
            part = event.get("part") or {}
            if part.get("text"):
                texts.append(part["text"])
    text = "\n".join(texts).strip()
    text = re.sub(r"^```(?:markdown|md)?\s*", "", text, flags=re.I)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def ensure_closing(script: str) -> str:
    # New drafts end on the Devanagari tag. Do not append the old English line
    # on top of it; that produced a duplicate CHACHA turn.
    if re.search(r"rule yaad rakhna|rule yaad|रूल याद रखना|रूल याद", script, re.I):
        return script
    marker = "## FINAL IMAGE"
    line = '**CHACHA**\n"Rule yaad rakhna."\n\n'
    if marker in script:
        return script.replace(marker, line + marker, 1)
    return script.rstrip() + "\n\n" + line


def validate(script: str) -> list[str]:
    issues = []
    if len(script) < 1200:
        issues.append("script is too short")
    for marker in ("COLD OPEN", "THE STORY", "RETURN", "FINAL IMAGE"):
        if marker not in script.upper():
            issues.append(f"missing {marker.lower()}")
    if not re.search(r"suno meri baat|chacha", script, re.I):
        issues.append("missing Chacha frame")
    if re.search(r"\[write|\(line\s*[—-]|todo|placeholder", script, re.I):
        issues.append("contains placeholders")
    return issues


def seed_gate_error(rule: dict) -> str:
    """The hard rule: an unfinished seed never becomes a script."""
    status = (rule.get("gate_status") or "ungated").strip().lower()
    if status == "passed":
        return ""
    flags = (rule.get("gate_flags") or "").strip()
    return (
        f"Seed {rule.get('id', '')} has not passed the seed gate "
        f"(status: {status}). {flags or 'Fix the missing want, object, theme and verdict first.'}"
    )


CRITIC_PROMPT = """You are the story gate for "Chacha Mashwara", a 55-65 second Pakistani Urdu horror series.

Judge the SCRIPT below against this checklist. Be strict and evidence-based.
Return JSON only, no prose, no code fences:

{{
  "pass": true,
  "issues": [
    {{"code": "FF9", "severity": "critical", "evidence": "exact line or event", "fix": "what must change"}}
  ],
  "summary": "one sentence"
}}

CHECKLIST
FF1 structure/pacing: opening hooks, clear turn, every beat does more than one job, scope fits 55-65s.
FF2 character: one specific want in the first 5 seconds; sympathetic breach; concrete object; relationship shown, not explained.
FF3 frame: cold open promises the story; final image answers it; first/last images rhyme.
FF4 subtext: at least one important thing is implied; an object carries the unspoken; the entity offers what the protagonist wants.
FF5 imagery: one recurring motif that changes meaning; no cliché horror language.
FF6 setting: specific place; at least two senses; setting reveals character state.
FF7 theme: embodied in the choice, not stated; verdict complicates rather than explains.
FF8 language: precise verbs; natural spoken dialogue; varied rhythm; no line repeats information.
FF9 logic: characters know only what they can know; timeline works; doors, phones and locks behave consistently; the twist does not depend on stupidity.
E1 ending grows from the character's choice and the established rule; not random.
E2 the what may be familiar, but the how must surprise.
E3 the protagonist's choice causes the consequence; no luck, no new power, no rescue.
E4 the central dramatic question is answered; no new mystery in the last five seconds.
E5 no theme speech, no epilogue; end on image.
E6 climax, verdict, final image; nothing after.

SHOW RULES
- Chacha appears only in the cold open and the return. He is never inside the story.
- No narrator. The story is dramatized with 2-4 voices.
- One rule, one breach, one twist, one verdict. The verdict is one sentence.
- The final image is a silent shot, held for two seconds.
- Never show or explain the entity.

SEED
ID: {rule_id}
Rule: {rule}
Consequence: {consequence}
Want: {want}
Object/motif: {object_motif}
Theme: {theme}
Verdict: {verdict}

SCRIPT
{script}
"""


def _parse_critic(text: str) -> dict:
    cleaned = re.sub(r"^```(?:json)?\s*", "", (text or "").strip(), flags=re.I)
    cleaned = re.sub(r"\s*```$", "", cleaned).strip()
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start < 0 or end <= start:
            return {"pass": None, "issues": [], "summary": "Critic returned no JSON."}
        try:
            data = json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError:
            return {"pass": None, "issues": [], "summary": "Critic returned invalid JSON."}
    if not isinstance(data, dict):
        return {"pass": None, "issues": [], "summary": "Critic returned no object."}
    issues = data.get("issues") or []
    if not isinstance(issues, list):
        issues = []
    return {
        "pass": data.get("pass") if isinstance(data.get("pass"), bool) else None,
        "issues": issues[:12],
        "summary": str(data.get("summary") or "")[:500],
        "checked_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }


def critique(rule: dict, script: str) -> dict:
    """A second reader. The writer prompt is not a verifier."""
    prompt = CRITIC_PROMPT.format(
        rule_id=rule.get("id", ""),
        rule=rule.get("rule", ""),
        consequence=rule.get("consequence", ""),
        want=rule.get("want") or "(missing)",
        object_motif=rule.get("object_motif") or "(missing)",
        theme=rule.get("theme") or "(missing)",
        verdict=rule.get("verdict") or "(missing)",
        script=script,
    )
    with tempfile.TemporaryDirectory(prefix="chacha-critic-") as workdir:
        try:
            proc = subprocess.run(
                [
                    OPENCODE,
                    "run",
                    "--format",
                    "json",
                    "--auto",
                    "-m",
                    MODEL,
                    prompt,
                ],
                cwd=workdir,
                capture_output=True,
                text=True,
                timeout=MAX_CRITIC_SECONDS,
                env={**os.environ, "HOME": os.environ.get("HOME", "/home/ubuntu")},
            )
        except subprocess.TimeoutExpired:
            return {"pass": None, "issues": [], "summary": "Critic timed out; gate not verified."}
    if proc.returncode != 0:
        return {
            "pass": None,
            "issues": [],
            "summary": f"Critic failed: {(proc.stderr or proc.stdout or '')[-300:]}",
        }
    return _parse_critic(parse_opencode_output(proc.stdout))


TRANSLIT_PROMPT = """You are a Hindi/Urdu script editor.

Transliterate every Roman-script Hindi/Urdu line in the Markdown script below
into Devanagari. Do not translate, summarize, rewrite, or change the story.
Keep every heading, speaker name, English stage direction, Markdown marker,
shot list, production note and number exactly as it is. Only Roman Hindi/Urdu
dialogue becomes Devanagari.

Return only the Markdown script, with no preamble and no code fences.

SCRIPT
{script}
"""


def transliterate(script: str) -> str:
    """Convert a Roman-script Chacha script to Devanagari, preserving structure."""
    prompt = TRANSLIT_PROMPT.format(script=script)
    with tempfile.TemporaryDirectory(prefix="chacha-translit-") as workdir:
        proc = subprocess.run(
            [
                OPENCODE,
                "run",
                "--format",
                "json",
                "--auto",
                "-m",
                MODEL,
                prompt,
            ],
            cwd=workdir,
            capture_output=True,
            text=True,
            timeout=MAX_TRANSLIT_SECONDS,
            env={**os.environ, "HOME": os.environ.get("HOME", "/home/ubuntu")},
        )
    if proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout or "transliteration failed")[-800:])
    result = parse_opencode_output(proc.stdout)
    if not result.strip():
        raise RuntimeError("transliteration returned an empty script")
    return result.strip()


def generate(rule: dict) -> tuple[str, Path, list[str], dict]:
    prompt = prompt_for(rule)
    started = time.time()
    with tempfile.TemporaryDirectory(prefix="chacha-writer-") as workdir:
        proc = subprocess.run(
            [
                OPENCODE,
                "run",
                "--format",
                "json",
                "--auto",
                "-m",
                MODEL,
                prompt,
            ],
            cwd=workdir,
            capture_output=True,
            text=True,
            timeout=MAX_SCRIPT_SECONDS,
            env={**os.environ, "HOME": os.environ.get("HOME", "/home/ubuntu")},
        )
    if proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout or "writer failed")[-800:])
    script = ensure_closing(parse_opencode_output(proc.stdout))
    issues = validate(script)
    if issues:
        # Keep the raw attempt for debugging without exposing it to the browser.
        debug_path = OUT_DIR / f"{rule['id']}-failed.md"
        debug_path.write_text(script + "\n", encoding="utf-8")
        raise RuntimeError("generated script failed checks: " + ", ".join(issues))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / f"{rule['id']}-{slugify(rule['rule'])}.md"
    header = (
        f"<!-- generated {time.strftime('%Y-%m-%d %H:%M:%S')} · {MODEL} · "
        f"{rule['id']} · {time.time()-started:.1f}s -->\n\n"
    )
    path.write_text(header + script + "\n", encoding="utf-8")
    sidecar = path.with_suffix(".gate.json")

    def _write_gate(payload: dict) -> None:
        tmp = sidecar.with_name(sidecar.name + ".tmp")
        tmp.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        os.replace(tmp, sidecar)

    pending = {
        "id": rule.get("id"),
        "seed_gate": rule.get("gate_status"),
        "pass": None,
        "issues": [],
        "summary": "Gate check running…",
        "checking": True,
    }
    _write_gate(pending)

    def _finish() -> None:
        try:
            result = critique(rule, script)
        except Exception as exc:  # noqa: BLE001 - the script is already saved
            result = {
                "pass": None,
                "issues": [],
                "summary": f"Critic failed: {str(exc)[-300:]}",
            }
        _write_gate(
            {
                "id": rule.get("id"),
                "seed_gate": rule.get("gate_status"),
                **result,
                "checking": False,
            }
        )

    threading.Thread(target=_finish, daemon=True).start()
    return script, path, issues, pending


class Handler(BaseHTTPRequestHandler):
    server_version = "ChachaWriter/1.0"

    def log_message(self, fmt: str, *args) -> None:
        print(f"{self.address_string()} - {fmt % args}")

    def _json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("content-type", "application/json; charset=utf-8")
        self.send_header("content-length", str(len(body)))
        self.send_header("cache-control", "no-store")
        self.send_header("access-control-allow-origin", "*")
        self.send_header("access-control-allow-headers", "content-type")
        self.send_header("access-control-allow-methods", "GET,POST,OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self._json(204, {})

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/health":
            self._json(
                200,
                {"ok": True, "model": MODEL, "active": _active, "out": str(OUT_DIR)},
            )
            return
        m = re.match(r"^/api/script/(R-\d{4})$", path)
        if m:
            files = sorted(OUT_DIR.glob(f"{m.group(1)}-*.md"))
            if not files:
                self._json(404, {"error": "not generated yet"})
                return
            script = files[-1].read_text(encoding="utf-8")
            script = re.sub(r"^<!--[\s\S]*?-->\s*", "", script)
            quality = {}
            sidecar = files[-1].with_suffix(".gate.json")
            if sidecar.exists():
                try:
                    quality = json.loads(sidecar.read_text(encoding="utf-8"))
                except json.JSONDecodeError:
                    quality = {}
            self._json(200, {"id": m.group(1), "script": script, "quality": quality})
            return
        m = re.match(r"^/api/quality/(R-\d{4})$", path)
        if m:
            files = sorted(OUT_DIR.glob(f"{m.group(1)}-*.md"))
            if not files:
                self._json(404, {"error": "not generated yet"})
                return
            sidecar = files[-1].with_suffix(".gate.json")
            if not sidecar.exists():
                self._json(
                    200,
                    {
                        "id": m.group(1),
                        "pass": None,
                        "issues": [],
                        "summary": "No gate check saved for this script.",
                        "checking": False,
                    },
                )
                return
            try:
                quality = json.loads(sidecar.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                quality = {
                    "pass": None,
                    "issues": [],
                    "summary": "Gate check is being written…",
                    "checking": True,
                }
            quality.setdefault("id", m.group(1))
            self._json(200, quality)
            return
        self._json(404, {"error": "not found"})

    def do_POST(self) -> None:
        global _active
        path = urlparse(self.path).path
        if path == "/api/ezclip":
            try:
                length = int(self.headers.get("content-length", "0"))
                if length > 30_000:
                    self._json(413, {"error": "script too large"})
                    return
                body = json.loads(self.rfile.read(length) or b"{}")
                script = str(body.get("script") or "")
                if not script.strip():
                    self._json(400, {"error": "script required"})
                    return
                self._json(200, {"script": script_to_ezclip(script)})
            except Exception as exc:  # noqa: BLE001
                self._json(400, {"error": f"could not convert the script: {exc}"})
            return
        if path == "/api/transliterate":
            try:
                length = int(self.headers.get("content-length", "0"))
                if length > 30_000:
                    self._json(413, {"error": "script too large"})
                    return
                body = json.loads(self.rfile.read(length) or b"{}")
                script = str(body.get("script") or "")
                if not script.strip():
                    self._json(400, {"error": "script required"})
                    return
                self._json(200, {"script": transliterate(script)})
            except subprocess.TimeoutExpired:
                self._json(504, {"error": "transliteration timed out; try again"})
            except Exception as exc:  # noqa: BLE001
                self._json(502, {"error": str(exc)})
            return
        if path != "/api/generate":
            self._json(404, {"error": "not found"})
            return
        ip = (
            self.headers.get("cf-connecting-ip")
            or self.headers.get("x-forwarded-for", "").split(",")[0].strip()
            or self.client_address[0]
        )
        now = time.time()
        with _lock:
            bucket = _rate[ip]
            while bucket and now - bucket[0] > 3600:
                bucket.popleft()
            if len(bucket) >= MAX_PER_HOUR:
                self._json(429, {"error": "rate limit; try again later"})
                return
            if _active >= MAX_ACTIVE:
                self._json(429, {"error": "writer is busy; try again in a minute"})
                return
            bucket.append(now)
            _active += 1

        try:
            length = int(self.headers.get("content-length", "0"))
            if length > 20_000:
                self._json(413, {"error": "body too large"})
                return
            body = json.loads(self.rfile.read(length) or b"{}")
            rule_id = body.get("ruleId") or body.get("id")
            if not rule_id:
                self._json(400, {"error": "ruleId required"})
                return
            rules = load_rules()
            rule = rules.get(rule_id)
            if not rule:
                self._json(404, {"error": "rule not found"})
                return

            gate_error = seed_gate_error(rule)
            if gate_error:
                self._json(
                    409,
                    {
                        "error": gate_error,
                        "gate_status": rule.get("gate_status"),
                        "gate_flags": rule.get("gate_flags", ""),
                    },
                )
                return

            if not body.get("force"):
                files = sorted(OUT_DIR.glob(f"{rule_id}-*.md"))
                if files:
                    cached = files[-1].read_text(encoding="utf-8")
                    cached = re.sub(r"^<!--[\s\S]*?-->\s*", "", cached).strip()
                    quality = {}
                    sidecar = files[-1].with_suffix(".gate.json")
                    if sidecar.exists():
                        try:
                            quality = json.loads(sidecar.read_text(encoding="utf-8"))
                        except json.JSONDecodeError:
                            quality = {}
                    self._json(
                        200,
                        {
                            "id": rule_id,
                            "script": cached,
                            "path": str(files[-1].relative_to(ROOT)),
                            "model": MODEL,
                            "cached": True,
                            "warnings": [],
                            "quality": quality,
                        },
                    )
                    return

            script, path, warnings, quality = generate(rule)
            self._json(
                200,
                {
                    "id": rule_id,
                    "script": script,
                    "path": str(path.relative_to(ROOT)),
                    "model": MODEL,
                    "warnings": warnings,
                    "quality": quality,
                },
            )
        except subprocess.TimeoutExpired:
            self._json(504, {"error": "writer timed out; try again"})
        except Exception as exc:  # noqa: BLE001
            self._json(502, {"error": str(exc)})
        finally:
            with _lock:
                _active = max(0, _active - 1)


def main() -> None:
    if not RULES_FILE.exists():
        raise SystemExit(f"Missing {RULES_FILE}. Run tools/build_catalog.py first.")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Chacha writer on http://127.0.0.1:{PORT} · {MODEL}")
    print(f"Saving to {OUT_DIR}")
    server.serve_forever()


if __name__ == "__main__":
    main()
