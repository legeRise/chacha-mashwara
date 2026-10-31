#!/usr/bin/env python3
"""On-demand script writer for Chacha Mashwara.

The UI posts a rule ID to /api/generate. This server builds a quality-gated
prompt, asks the local `opencode` agent to write the full episode script, saves
the result under scripts/generated/, and returns it to the browser.

Run:
    python3 tools/writer_server.py

Environment:
    PORT=8787
    WRITER_MODEL=opencode-go/claude-haiku-5-5
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

ROOT = Path(__file__).resolve().parent.parent
RULES_FILE = ROOT / "rules" / "rules.json"
OUT_DIR = ROOT / "scripts" / "generated"
PORT = int(os.environ.get("PORT", "8787"))
MODEL = os.environ.get("WRITER_MODEL", "opencode-go/claude-haiku-5-5")
OPENCODE = os.environ.get(
    "OPENCODE_BIN",
    "/home/ubuntu/.opencode/bin/opencode",
)
MAX_SCRIPT_SECONDS = 300
MAX_PER_HOUR = 12
MAX_ACTIVE = 1

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
    return f"""You are the head writer for "Chacha Mashwara", a Pakistani Urdu short horror series for YouTube Shorts.

Write ONE complete episode script in Markdown, 55-65 seconds when read aloud, based on the seed below.

THE SHOW
- Chacha Mashwara is the host. He appears only in the cold open and the return.
- The story is fully dramatized with 2-4 speaking characters. No narrator.
- Chacha never appears inside the story.
- Dialogue in natural Roman Urdu. Stage directions in English.
- The rule is the title. The final image is silent and held for two seconds.
- No gore, no religious disrespect, no real names, no children harmed on screen.
- Never show or explain the entity. The horror is in an ordinary object and a human choice.

QUALITY GATE — the script must pass all of this
1. The protagonist has a specific want and a concrete object/motif that carries subtext.
2. The breach is sympathetic: love, guilt, fear, politeness, need, pride, or hope. Never mere curiosity.
3. The twist is caused by the protagonist's choice, not a random event.
4. Fix any logic problem in the seed. Characters know only what they can know.
5. The verdict is one sentence and names the mistake, not the monster.
6. The final image pays off the object/motif.
7. No narrator, no Chacha inside the story.
8. 55-65 seconds, 10-12 shots.

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
- 10-12 shot list
- Sound and thumbnail notes

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
    if re.search(r"rule yaad rakhna|rule yaad", script, re.I):
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


def generate(rule: dict) -> tuple[str, Path]:
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
    return script, path, issues


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
            self._json(200, {"id": m.group(1), "script": script})
            return
        self._json(404, {"error": "not found"})

    def do_POST(self) -> None:
        global _active
        path = urlparse(self.path).path
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

            if not body.get("force"):
                files = sorted(OUT_DIR.glob(f"{rule_id}-*.md"))
                if files:
                    cached = files[-1].read_text(encoding="utf-8")
                    cached = re.sub(r"^<!--[\s\S]*?-->\s*", "", cached).strip()
                    self._json(
                        200,
                        {
                            "id": rule_id,
                            "script": cached,
                            "path": str(files[-1].relative_to(ROOT)),
                            "model": MODEL,
                            "cached": True,
                            "warnings": [],
                        },
                    )
                    return

            script, path, warnings = generate(rule)
            self._json(
                200,
                {
                    "id": rule_id,
                    "script": script,
                    "path": str(path.relative_to(ROOT)),
                    "model": MODEL,
                    "warnings": warnings,
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
