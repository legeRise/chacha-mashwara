#!/usr/bin/env python3
"""Build the Chacha Mashwara rule catalog from the source .psv files.

Source format (10 fields, pipe-separated):
rule|consequence|story_core|cast|place|breach_reason|twist|final_image|family|tone

Usage:
    python3 tools/build_catalog.py
    python3 tools/build_catalog.py --check
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "rules" / "source"
RULES_DIR = ROOT / "rules"
VOLUMES_DIR = RULES_DIR / "volumes"
LOCATIONS_FILE = ROOT / "series" / "chacha-mashwara" / "locations.md"
QUALITY_FILE = RULES_DIR / "quality.csv"

VOLUMES = [
    ("Ghar", "Home", "The house knows you."),
    ("Raaste", "Roads", "The road remembers."),
    ("Rishtey", "Relationships", "What we owe each other."),
    ("Purani Cheezein", "Old Things", "Objects keep receipts."),
    ("Mohalla", "Neighborhood", "Everyone is watching."),
    ("Shadi", "Weddings", "A house full of witnesses."),
    ("Safar", "Travel", "You are a guest everywhere."),
    ("Bachpan", "Childhood", "Children see first."),
    ("Khandan", "Family", "Blood keeps a ledger."),
    ("Mausam", "Weather", "The sky has a memory."),
]

REQUIRED = [
    "rule",
    "consequence",
    "story_core",
    "cast",
    "place",
    "breach_reason",
    "twist",
    "final_image",
    "family",
    "tone",
]

BANNED = [
    "gore",
    "rape",
    "sex",
    "nude",
    "torture",
    "dismember",
    "decapitat",
]


def load_locations() -> list[str]:
    locations: list[str] = []
    if LOCATIONS_FILE.exists():
        for line in LOCATIONS_FILE.read_text(encoding="utf-8").splitlines():
            m = re.match(r"^\|\s*\d{2}\s*\|\s*(.+?)\s*\|", line)
            if m:
                locations.append(m.group(1).strip())
    if not locations:
        raise SystemExit(f"No locations found in {LOCATIONS_FILE}")
    return locations


def load_quality() -> dict[str, dict[str, str]]:
    if not QUALITY_FILE.exists():
        return {}
    with QUALITY_FILE.open(encoding="utf-8", newline="") as fh:
        return {row["id"]: row for row in csv.DictReader(fh)}


def source_files() -> list[Path]:
    files = sorted(SOURCE_DIR.glob("volume-*.psv"))
    if len(files) != len(VOLUMES):
        print(
            f"WARNING: found {len(files)} volume files, expected {len(VOLUMES)}",
            file=sys.stderr,
        )
    return files


def parse_source(path: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for lineno, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) != len(REQUIRED):
            raise SystemExit(
                f"{path.name}:{lineno}: expected {len(REQUIRED)} fields, "
                f"got {len(parts)}"
            )
        row = dict(zip(REQUIRED, parts))
        row["_source"] = f"{path.name}:{lineno}"
        rows.append(row)
    return rows


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def build() -> list[dict[str, str]]:
    locations = load_locations()
    quality = load_quality()
    records: list[dict[str, str]] = []
    idx = 0

    for volume_no, path in enumerate(source_files(), 1):
        name, english, tagline = VOLUMES[volume_no - 1]
        rows = parse_source(path)
        for row in rows:
            idx += 1
            rule_id = f"R-{idx:04d}"
            location = locations[(idx - 1) % len(locations)]
            record = {
                "id": rule_id,
                "volume_no": str(volume_no),
                "volume": name,
                "volume_english": english,
                "rule": row["rule"],
                "consequence": row["consequence"],
                "story_core": row["story_core"],
                "cast": row["cast"],
                "place": row["place"],
                "breach_reason": row["breach_reason"],
                "twist": row["twist"],
                "final_image": row["final_image"],
                "family": row["family"],
                "tone": row["tone"],
                "chacha_location": location,
                "status": "candidate",
                "gate_status": quality.get(rule_id, {}).get("gate_status", "ungated"),
                "seed_score": quality.get(rule_id, {}).get("seed_score", "0"),
                "want": quality.get(rule_id, {}).get("want", ""),
                "object_motif": quality.get(rule_id, {}).get("object_motif", ""),
                "theme": quality.get(rule_id, {}).get("theme", ""),
                "verdict": quality.get(rule_id, {}).get("verdict", ""),
                "gate_flags": quality.get(rule_id, {}).get("flags", ""),
                "gate_notes": quality.get(rule_id, {}).get("notes", ""),
                "notes": "",
                "source": row["_source"],
            }
            records.append(record)

    return records


def validate(records: list[dict[str, str]]) -> list[str]:
    errors: list[str] = []
    seen_rules: dict[str, str] = {}
    seen_pairs: dict[tuple[str, str], str] = {}
    seen_twists: dict[str, str] = {}

    for rec in records:
        rid = rec["id"]
        for field in REQUIRED:
            if not rec.get(field, "").strip():
                errors.append(f"{rid}: empty field '{field}'")

        norm_rule = normalize(rec["rule"])
        if norm_rule in seen_rules:
            errors.append(
                f"{rid}: duplicate rule with {seen_rules[norm_rule]}: {rec['rule']}"
            )
        else:
            seen_rules[norm_rule] = rid

        pair = (normalize(rec["breach_reason"]), normalize(rec["twist"]))
        if pair in seen_pairs:
            errors.append(
                f"{rid}: duplicate breach+twist with {seen_pairs[pair]}"
            )
        else:
            seen_pairs[pair] = rid

        norm_twist = normalize(rec["twist"])
        if norm_twist in seen_twists:
            errors.append(
                f"{rid}: duplicate twist with {seen_twists[norm_twist]}"
            )
        else:
            seen_twists[norm_twist] = rid

        words = rec["rule"].split()
        if len(words) > 10:            errors.append(f"{rid}: rule too long ({len(words)} words)")

        if rec["status"] in {"approved", "scripted"} and rec["gate_status"] != "passed":
            errors.append(f"{rid}: status '{rec['status']}' requires a passed seed gate")

        if rec["gate_status"] == "passed":
            for field in ("want", "object_motif", "theme", "verdict"):
                if not rec.get(field, "").strip():
                    errors.append(f"{rid}: passed gate but missing '{field}'")
            if int(rec.get("seed_score", "0") or 0) < 7:
                errors.append(f"{rid}: passed gate but seed_score < 7")

        blob = " ".join(rec.values()).lower()
        for word in BANNED:
            if word in blob:
                errors.append(f"{rid}: banned word '{word}'")

    # Chacha location must not repeat within 20 episodes.
    locs = [r["chacha_location"] for r in records]
    for i, loc in enumerate(locs):
        window = locs[max(0, i - 19) : i]
        if loc in window:
            errors.append(f"{records[i]['id']}: location repeats within 20 rows: {loc}")

    return errors


def write_outputs(records: list[dict[str, str]]) -> None:
    RULES_DIR.mkdir(parents=True, exist_ok=True)
    VOLUMES_DIR.mkdir(parents=True, exist_ok=True)

    columns = [
        "id",
        "volume_no",
        "volume",
        "volume_english",
        "rule",
        "consequence",
        "story_core",
        "cast",
        "place",
        "breach_reason",
        "twist",
        "final_image",
        "family",
        "tone",
        "chacha_location",
        "status",
        "gate_status",
        "seed_score",
        "want",
        "object_motif",
        "theme",
        "verdict",
        "gate_flags",
        "gate_notes",
        "notes",
        "source",
    ]

    with (RULES_DIR / "rules.csv").open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(records)

    (RULES_DIR / "rules.json").write_text(
        json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # Index
    lines = [
        "# Rule Catalog",
        "",
        f"**{len(records)} rules** across {len(VOLUMES)} volumes.",
        "",
        "| Volume | Rules | Range | Theme |",
        "|---|---:|---|---|",
    ]
    for i, (name, english, tagline) in enumerate(VOLUMES, 1):
        vol_records = [r for r in records if r["volume_no"] == str(i)]
        if not vol_records:
            continue
        first, last = vol_records[0]["id"], vol_records[-1]["id"]
        lines.append(f"| {i}. {name} ({english}) | {len(vol_records)} | {first}–{last} | {tagline} |")
    gate_counts = {"passed": 0, "needs-fix": 0, "ungated": 0, "killed": 0}
    for rec in records:
        gate_counts[rec["gate_status"]] = gate_counts.get(rec["gate_status"], 0) + 1
    lines += [
        "",
        "## Quality gate",
        "",
        f"- Passed: **{gate_counts.get('passed', 0)}**",
        f"- Needs fix: **{gate_counts.get('needs-fix', 0)}**",
        f"- Ungated: **{gate_counts.get('ungated', 0)}**",
        f"- Killed: **{gate_counts.get('killed', 0)}**",
        "",
        "No seed becomes a script until its gate status is `passed`.",
        "",
        "## How to review",
        "",
        "Open a volume page, mark any rule you want changed, and send the IDs. "
        "IDs never change. Status starts as `candidate`.",
        "",
        "Each row is a **story seed**, not a full script. Use "
        "`templates/episode-script.md` to turn it into dialogue.",
        "",
    ]
    (RULES_DIR / "index.md").write_text("\n".join(lines), encoding="utf-8")

    # Volume pages
    for i, (name, english, tagline) in enumerate(VOLUMES, 1):
        vol_records = [r for r in records if r["volume_no"] == str(i)]
        if not vol_records:
            continue
        slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
        page = [
            f"# Volume {i:02d} — {name} ({english})",
            "",
            f"*{tagline}*",
            "",
            f"**{len(vol_records)} rules.** Status: candidate.",
            "",
            "| ID | Rule | Consequence | Cast | Place | Twist | Gate |",
            "|---|---|---|---|---|---|---|",
        ]
        for r in vol_records:
            page.append(
                f"| {r['id']} | {r['rule']} | {r['consequence']} | "
                f"{r['cast']} | {r['place']} | {r['twist']} | "
                f"{r['gate_status']} ({r['seed_score']}) |"
            )
        page.append("")
        (VOLUMES_DIR / f"{i:02d}-{slug}.md").write_text(
            "\n".join(page), encoding="utf-8"
        )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="validate only")
    args = parser.parse_args()

    records = build()
    errors = validate(records)

    print(f"Loaded {len(records)} rules from {len(source_files())} volume files.")
    if errors:
        print(f"\n{len(errors)} error(s):", file=sys.stderr)
        for err in errors[:80]:
            print(f"  - {err}", file=sys.stderr)
        if len(errors) > 80:
            print(f"  ... and {len(errors) - 80} more", file=sys.stderr)
    else:
        print("Validation: OK")

    if not args.check:
        write_outputs(records)
        print(f"Wrote {RULES_DIR / 'rules.csv'}")
        print(f"Wrote {RULES_DIR / 'rules.json'}")
        print(f"Wrote {RULES_DIR / 'index.md'}")
        print(f"Wrote {len(VOLUMES)} volume pages")

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
