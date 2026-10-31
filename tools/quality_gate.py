#!/usr/bin/env python3
"""Seed quality gate for the Chacha Mashwara catalog.

Every seed must pass the gate before it can become a script. This tool audits
all 1,000 seeds, flags weak or incomplete ones, and writes a report.

Usage:
    python3 tools/quality_gate.py              # report only
    python3 tools/quality_gate.py --apply      # update quality.csv
    python3 tools/quality_gate.py --strict     # fail if approved/scripted rows are ungated

A seed is "passed" only when a human/AI has filled in:
    want, object_motif, theme, verdict, seed_score, gate_status=passed
"""

from __future__ import annotations

import argparse
import csv
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RULES = ROOT / "rules" / "rules.csv"
QUALITY = ROOT / "rules" / "quality.csv"
REPORT = ROOT / "rules" / "quality-report.md"

GATE_FIELDS = ["want", "object_motif", "theme", "verdict"]

GENERIC_BREACH = [
    "curious",
    "bored",
    "wanted to know",
    "wanted to see",
    "didn't think",
    "did not think",
    "was tired",
    "in a hurry",
    "forgot",
    "didn't want to be rude",
    "didn't want to seem rude",
    "was angry",
    "was lonely",
    "was desperate",
    "wanted to prove",
    "wanted to help",
    "wanted a souvenir",
    "wanted to remember",
]

TWIST_TROPES = [
    "future self",
    "already inside",
    "is the dead",
    "dead brother",
    "dead sister",
    "dead mother",
    "dead father",
    "dead wife",
    "dead husband",
    "is the house",
    "is the room",
    "is the tree",
    "is the reflection",
    "is the family name",
    "is the secret",
    "is the voice",
    "is the child",
    "is the stranger",
    "is the guest",
    "is the bag",
    "is the photo",
    "is the phone",
]


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def load_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise SystemExit(f"Missing {path}")
    with path.open(encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh))


def audit(rules: list[dict[str, str]], quality: dict[str, dict[str, str]]) -> list[dict]:
    final_images = defaultdict(list)
    for rule in rules:
        final_images[normalize(rule["final_image"])].append(rule["id"])

    results = []
    for rule in rules:
        rid = rule["id"]
        q = quality.get(rid, {})
        flags = []

        for field in GATE_FIELDS:
            if not q.get(field, "").strip():
                flags.append(f"missing-{field.replace('_', '-')}")

        breach = rule["breach_reason"].lower()
        if any(phrase in breach for phrase in GENERIC_BREACH):
            flags.append("generic-breach")

        twist = rule["twist"].lower()
        if any(phrase in twist for phrase in TWIST_TROPES):
            flags.append("twist-trope")

        if len(final_images[normalize(rule["final_image"])]) > 1:
            flags.append("duplicate-final-image")

        if len(rule["rule"].split()) > 10:
            flags.append("long-title")

        gate_status = q.get("gate_status", "ungated") or "ungated"
        passed = gate_status == "passed"
        if passed:
            # Passed seeds keep only missing-field flags; their curated quality
            # fields are the source of truth, not the heuristic flags.
            flags = [flag for flag in flags if flag.startswith("missing-")]

        if passed:
            score = int(q.get("seed_score") or 0)
        elif any(flag for flag in flags if not flag.startswith("missing-")):
            score = max(1, 10 - 2 * len(flags))
        else:
            score = 0

        if not passed and gate_status != "killed":
            if any(flag for flag in flags if not flag.startswith("missing-")):
                gate_status = "needs-fix"
            else:
                gate_status = "ungated"

        results.append(
            {
                **rule,
                **q,
                "gate_status": gate_status,
                "seed_score": str(score),
                "flags": ";".join(sorted(set(flags))),
            }
        )
    return results


def write_quality(results: list[dict]) -> None:
    fields = [
        "id",
        "want",
        "object_motif",
        "theme",
        "verdict",
        "seed_score",
        "gate_status",
        "flags",
        "notes",
    ]
    with QUALITY.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        for row in sorted(results, key=lambda r: r["id"]):
            writer.writerow({field: row.get(field, "") for field in fields})
    print(f"Updated {QUALITY}")


def report(results: list[dict]) -> None:
    statuses = Counter(row["gate_status"] for row in results)
    flags = Counter()
    for row in results:
        for flag in row["flags"].split(";"):
            if flag:
                flags[flag] += 1

    by_volume = defaultdict(lambda: Counter())
    for row in results:
        by_volume[row["volume"]]["total"] += 1
        by_volume[row["volume"]][row["gate_status"]] += 1

    lines = [
        "# Seed Quality Report",
        "",
        f"**Total seeds:** {len(results)}",
        "",
        "| Gate status | Count |",
        "|---|---:|",
        f"| Passed | {statuses.get('passed', 0)} |",
        f"| Needs fix | {statuses.get('needs-fix', 0)} |",
        f"| Ungated | {statuses.get('ungated', 0)} |",
        f"| Killed | {statuses.get('killed', 0)} |",
        "",
        "## Flags",
        "",
        "| Flag | Count |",
        "|---|---:|",
    ]
    for flag, count in flags.most_common():
        lines.append(f"| {flag} | {count} |")

    lines += [
        "",
        "## By volume",
        "",
        "| Volume | Total | Passed | Needs fix | Ungated | Killed |",
        "|---|---:|---:|---:|---:|---:|",
    ]
    for volume in sorted(by_volume):
        c = by_volume[volume]
        lines.append(
            f"| {volume} | {c['total']} | {c.get('passed', 0)} | "
            f"{c.get('needs-fix', 0)} | {c.get('ungated', 0)} | {c.get('killed', 0)} |"
        )

    lines += [
        "",
        "## What this means",
        "",
        "A seed cannot become a script until `gate_status` is `passed`. The gate asks:",
        "",
        "- Is the protagonist's want specific?",
        "- Is there a concrete object/motif that carries subtext?",
        "- Is the breach sympathetic, not generic?",
        "- Is the twist causal, not a trope?",
        "- Is there a one-line verdict that names the mistake?",
        "",
        "## Next",
        "",
        "1. Fix `needs-fix` seeds volume by volume.",
        "2. Gate the `ungated` seeds.",
        "3. Only then write scripts, in batches of 14.",
        "4. Every script passes the script quality gate before production.",
        "",
        "R-0001 is the worked example: it was rewritten with the flash-fiction and",
        "endings diagnostics and is the only passed seed right now.",
        "",
    ]
    REPORT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {REPORT}")
    print(f"Passed: {statuses.get('passed', 0)}")
    print(f"Needs fix: {statuses.get('needs-fix', 0)}")
    print(f"Ungated: {statuses.get('ungated', 0)}")
    print(f"Killed: {statuses.get('killed', 0)}")


def strict_check(rules: list[dict], quality: dict[str, dict[str, str]]) -> int:
    bad = []
    for rule in rules:
        if rule.get("status") in {"approved", "scripted"}:
            q = quality.get(rule["id"], {})
            if q.get("gate_status") != "passed":
                bad.append(rule["id"])
    if bad:
        print("Approved/scripted without a passed seed gate:")
        for rid in bad:
            print(f"  - {rid}")
        return 1
    print("Strict check: OK")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="update quality.csv")
    parser.add_argument("--strict", action="store_true", help="fail on ungated approved rows")
    args = parser.parse_args()

    rules = load_csv(RULES)
    qrows = load_csv(QUALITY)
    quality = {row["id"]: row for row in qrows}
    results = audit(rules, quality)

    report(results)
    if args.apply:
        write_quality(results)
    if args.strict:
        return strict_check(rules, quality)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
