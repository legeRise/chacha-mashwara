#!/usr/bin/env python3
"""Turn a finished Chacha story into Ezclip's multi-speaker story format.

The production packet's 12-shot plan is deliberately ignored. This reads the
story itself — cold open, story scenes, return — keeps the stage directions as
the visual description, and emits each spoken turn with a speaker.

Usage:
    python3 tools/ezclip_export.py scripts/generated/R-0001-*.md
    python3 tools/ezclip_export.py R-0001
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "scripts" / "generated"

_HEADING_RE = re.compile(r"^(#{2,3})\s+(.+?)\s*$")
# A speaker name is uppercase. A lowercase parenthetical is a performance
# note: "AMIT (V.O., phone)" or "SHANTI (half a laugh)". An action line such as
# "At her feet: the shoes" is mixed case and must stay visual.
_NAME_PATTERN = r"([A-Z][A-Z0-9 '.,_\-]{1,60}?(?:\s*\([A-Za-z0-9 .,'_\-]*\))?)"
_INLINE_RE = re.compile(
    rf"^\*{{0,2}}\s*{_NAME_PATTERN}\s*\*{{0,2}}"
    r"\s*(?:\*\([^)]*\)\*)?\s*:\s*(.+)$"
)
_SPEAKER_ONLY_RE = re.compile(
    rf"^\*{{0,2}}\s*{_NAME_PATTERN}\s*\*{{0,2}}\s*$"
)
_CAST_RE = re.compile(r"^CAST\s*:\s*(.+)$", re.IGNORECASE)
_DIRECTION_RE = re.compile(r"^(?:INT|EXT)\.", re.IGNORECASE)

_STOP_NAMES = {
    "COLD OPEN", "THE STORY", "RETURN", "FINAL IMAGE", "TITLE CARD",
    "PRODUCTION NOTES", "NO NARRATOR", "STORY CAST", "RUNTIME TARGET",
    "CHACHA LOCATION", "NO CHACHA INSIDE THE STORY",
}
_FEMALE_HINTS = (
    "SISTER", "AYESHA", "NUSRAT", "APA", "WOMAN", "MOTHER", "GIRL",
    "AUNT", "BIBI", "BEGUM", "SHANTI", "SAROJ",
)
_MALE_HINTS = (
    "CHACHA", "HAMZA", "IMRAN", "BHAI", "MAN", "FATHER", "BOY", "EYE",
    "UNCLE", "BABA", "AMIT", "SON",
)


def _clean(text: str) -> str:
    text = (text or "").replace("**", "").replace("__", "").replace('\\"', '"')
    text = text.replace("“", '"').replace("”", '"')
    text = re.sub(r"^\[\s*", "", text)
    text = re.sub(r"\s*\]$", "", text)
    return re.sub(r"\s+", " ", text).strip()


def _speaker_name(raw: str) -> str:
    name = _clean(raw).upper()
    name = re.sub(r"\s*\([^)]*\)\s*$", "", name).strip()
    if name == "CH":
        return "CHACHA"
    # The entity mimics the protagonist's voice; resolve against the cast in
    # _parse_block (HAMZA in one variant, YOUNG MAN in the other).
    return name


def _unquote(text: str) -> str:
    cleaned = _clean(text).strip()
    if len(cleaned) >= 2 and cleaned[0] in "\"'" and cleaned[-1] in "\"'":
        cleaned = cleaned[1:-1].strip()
    # A trailing italic stage direction is not spoken. `*(goes)*` was reaching
    # the TTS because the line was otherwise a valid speaker turn.
    cleaned = re.sub(r"\s*\*\([^)]*\)\*\s*$", "", cleaned).strip()
    return cleaned


def _gender(name: str, cast: list[str] | None = None) -> str:
    words = set(re.findall(r"[A-Z]+", name.upper()))
    if name == "HIS VOICE":
        return "male"
    if words & set(_FEMALE_HINTS):
        return "female"
    if words & set(_MALE_HINTS):
        return "male"
    # "THE VOICE" usually mimics the loved one in the story; if the cast has a
    # sister/female relative, cast it female. The creator can override it.
    if "VOICE" in words and cast:
        joined = " ".join(cast).upper()
        if any(hint in joined for hint in ("SISTER", "AYESHA", "NUSRAT", "APA", "WOMAN")):
            return "female"
    return ""


def _split_cast(raw: str) -> list[str]:
    """Split a cast line on ; · newline or a comma outside parentheses.

    `SHANTI (mother, 50s)` must stay one part; the comma inside the
    parenthetical is a description, not another cast member.
    """
    parts: list[str] = []
    buf: list[str] = []
    depth = 0
    for char in raw:
        if char == "(":
            depth += 1
        elif char == ")":
            depth = max(0, depth - 1)
        if char in ";·\n" or (char == "," and depth == 0):
            parts.append("".join(buf))
            buf = []
        else:
            buf.append(char)
    parts.append("".join(buf))
    return [part.strip() for part in parts if part.strip()]


def _cast_names(text: str) -> list[str]:
    match = re.search(r"\*\*Story cast:\*\*\s*(.+)", text, re.IGNORECASE)
    if not match:
        return []
    names = []
    for part in _split_cast(match.group(1)):
        name = _speaker_name(part)
        if name and name not in _STOP_NAMES and name not in names:
            names.append(name)
    return names


def _title_from_heading(heading: str) -> str:
    value = _clean(heading)
    upper = value.upper()
    if "COLD OPEN" in upper:
        return "Cold Open"
    if "FINAL IMAGE" in upper:
        return "Final Image"
    if re.search(r"\bRETURN\b", upper):
        return "Return"
    value = re.sub(r"^[\d:–—\-\s]+", "", value)
    value = re.sub(r"^THE STORY\b", "", value, flags=re.I)
    value = re.sub(r"\s*\([\d:–—\-\s]+\)\s*$", "", value)
    value = value.strip(" —-:")
    if not value:
        return ""
    return value


def _looks_like_speaker(name: str, known: set[str]) -> bool:
    name = name.strip().upper()
    if not name or name in _STOP_NAMES:
        return False
    if name in {"INT", "EXT", "TITLE", "SCENE"}:
        return False
    if name in known:
        return True
    # A new uppercase name is accepted only when it is short and has no
    # sentence punctuation; this keeps stage directions out of the cast.
    return len(name.split()) <= 5 and not name.endswith(".")


def _parse_block(lines: list[str], known: set[str]):
    """Return (visual, dialogue, new_speakers, cast) for one heading block."""
    visual: list[str] = []
    dialogue: list[dict] = []
    new_speakers: list[str] = []
    cast: list[str] = []
    current: str | None = None

    for raw in lines:
        line = raw.strip()
        if not line:
            current = None
            continue
        cast_match = _CAST_RE.match(_clean(line))
        if cast_match:
            for tag in re.findall(r"@([a-z0-9_]+)", cast_match.group(1).lower()):
                if tag not in cast:
                    cast.append(tag)
            current = None
            continue
        if re.match(r"^##\s+Production notes", line, re.IGNORECASE):
            break
        if line.startswith("```") or line.startswith("<!--"):
            continue
        if re.match(r"^TITLE CARD", line, re.IGNORECASE):
            continue
        if re.match(r"^\*\*(Runtime|Chacha location|Story cast|No narrator)", line, re.IGNORECASE):
            continue
        if line.startswith("## ") or line.startswith("# "):
            continue

        inline = _INLINE_RE.match(_clean(line))
        if inline:
            name = _speaker_name(inline.group(1))
            if name == "HIS VOICE":
                name = "HAMZA" if "HAMZA" in known else ("YOUNG MAN" if "YOUNG MAN" in known else name)
            if name in {"VOICE", "THE VOICE"} and "THE EYE" in known:
                name = "THE EYE"
            if _looks_like_speaker(name, known):
                text = _unquote(inline.group(2))
                if text:
                    dialogue.append({"speaker": name, "text": text})
                    if name not in known:
                        known.add(name)
                        new_speakers.append(name)
                current = None
                continue

        speaker_only = _SPEAKER_ONLY_RE.match(_clean(line))
        if speaker_only:
            name = _speaker_name(speaker_only.group(1))
            if name == "HIS VOICE":
                name = "HAMZA" if "HAMZA" in known else ("YOUNG MAN" if "YOUNG MAN" in known else name)
            if name in {"VOICE", "THE VOICE"} and "THE EYE" in known:
                name = "THE EYE"
            if _looks_like_speaker(name, known):
                current = name
                if name not in known:
                    known.add(name)
                    new_speakers.append(name)
                continue
            # A bold setting such as **INT. FLAT** is visual, not a speaker.
            if _DIRECTION_RE.match(_clean(line)):
                visual.append(_clean(line))
                current = None
                continue

        if current:
            if line.startswith("(") and line.endswith(")"):
                continue
            text = _unquote(line)
            if text and not _DIRECTION_RE.match(text) and not text.startswith("["):
                dialogue.append({"speaker": current, "text": text})
                continue
            current = None

        if _DIRECTION_RE.match(_clean(line)) or line.startswith("["):
            visual.append(_clean(line))
            continue
        if line.startswith("(") and line.endswith(")"):
            continue
        # Plain action prose belongs in the visual description.
        visual.append(_clean(line))

    return _clean(" ".join(visual)), dialogue, new_speakers, cast


def script_to_ezclip(script: str) -> str:
    """Convert a full Chacha Markdown script to Ezclip's dialogue format."""
    text = script.replace("\r\n", "\n")
    body = re.split(r"(?im)^##\s+Production notes\s*$", text, maxsplit=1)[0]
    title_line = next(
        (line for line in body.splitlines() if line.strip().startswith("# ")),
        "",
    )
    title = _clean(title_line.lstrip("# ").strip()) or "Chacha episode"
    cast = _cast_names(body)
    if "CHACHA" not in cast:
        cast.insert(0, "CHACHA")
    known = set(cast)
    known.update({"CHACHA"})

    # Collect heading blocks. The parent "THE STORY" heading may be empty; the
    # ### Scene blocks under it carry the content.
    blocks: list[dict] = []
    current: dict | None = None
    for raw in body.split("\n"):
        heading = _HEADING_RE.match(raw.strip())
        if heading:
            if current and (current["lines"] or current["title"]):
                blocks.append(current)
            current = {
                "level": len(heading.group(1)),
                "title": _title_from_heading(heading.group(2)),
                "lines": [],
            }
            continue
        if current is not None:
            current["lines"].append(raw)
    if current:
        blocks.append(current)

    scenes = []
    final_visual = ""
    for block in blocks:
        visual, dialogue, new_speakers, cast_tags = _parse_block(block["lines"], known)
        for name in new_speakers:
            if name not in cast:
                cast.append(name)
        if not block["title"] and not dialogue:
            continue
        if block["title"].lower() == "final image" and not dialogue:
            final_visual = visual
            continue
        if not dialogue and not visual:
            continue
        scenes.append(
            {
                "title": block["title"] or f"Scene {len(scenes) + 1}",
                "visual": visual,
                "dialogue": dialogue,
                "cast": cast_tags,
            }
        )

    if final_visual:
        if scenes:
            scenes[-1]["visual"] = _clean(f"{scenes[-1]['visual']} {final_visual}")
        else:
            scenes.append({"title": "Final Image", "visual": final_visual, "dialogue": []})

    # Drop the parent "THE STORY" heading: it has no dialogue of its own.
    scenes = [scene for scene in scenes if scene["dialogue"] or scene["visual"]]

    lines = [f"# {title}", "SPEAKERS:"]
    for name in cast:
        gender = _gender(name, cast)
        parts = [part for part in (gender, "hi") if part]
        lines.append(f"{name} = {' | '.join(parts)}")
    lines.append("")

    for scene in scenes:
        lines.append(f"SCENE — {scene['title']}")
        cast_tags = scene.get("cast") or []
        if not cast_tags and (
            scene["title"].lower().startswith("cold open")
            or scene["title"].lower().startswith("return")
        ):
            cast_tags = ["chacha_mashwara"]
        if cast_tags:
            lines.append("CAST: " + " ".join(f"@{tag}" for tag in cast_tags))
        if scene["visual"]:
            lines.append(f"VISUAL: {scene['visual']}")
        if scene["dialogue"]:
            lines.append("DIALOGUE:")
            for turn in scene["dialogue"]:
                lines.append(f"{turn['speaker']}: \"{turn['text']}\"")
        lines.append("PAUSE: 0.7")
        lines.append("")

    return "\n".join(lines).strip() + "\n"


def main() -> None:
    arg = sys.argv[1] if len(sys.argv) > 1 else ""
    if not arg:
        raise SystemExit("usage: ezclip_export.py <script.md | R-0001>")
    path = Path(arg)
    if not path.exists():
        matches = sorted(OUT_DIR.glob(f"{arg}-*.md"))
        if not matches:
            raise SystemExit(f"No generated script for {arg}")
        path = matches[-1]
    print(script_to_ezclip(path.read_text(encoding="utf-8")))


if __name__ == "__main__":
    main()
