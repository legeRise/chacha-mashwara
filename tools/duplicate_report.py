#!/usr/bin/env python3
"""Print near-duplicate rules and twists for manual review.

Usage:
    python3 tools/duplicate_report.py
    python3 tools/duplicate_report.py --threshold 0.6
"""

from __future__ import annotations

import argparse
import csv
import itertools
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV = ROOT / "rules" / "rules.csv"

STOP = {
    "a", "an", "the", "to", "of", "in", "on", "at", "for", "and", "or", "with",
    "your", "you", "never", "dont", "don", "t", "is", "it", "that", "this",
    "be", "by", "from", "as", "if", "not", "do", "does", "did", "was", "were",
}


def tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-z]+", text.lower())) - STOP


def jaccard(a: str, b: str) -> float:
    ta, tb = tokens(a), tokens(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--threshold", type=float, default=0.7)
    parser.add_argument("--limit", type=int, default=40)
    args = parser.parse_args()

    rows = list(csv.DictReader(CSV.open(encoding="utf-8")))

    for field in ("rule", "twist"):
        pairs = []
        for a, b in itertools.combinations(rows, 2):
            score = jaccard(a[field], b[field])
            if score >= args.threshold:
                pairs.append((score, a["id"], b["id"], a[field], b[field]))
        pairs.sort(reverse=True)
        print(f"\n{field}: {len(pairs)} pairs >= {args.threshold}")
        for score, aid, bid, atext, btext in pairs[: args.limit]:
            print(f"  {score:.2f}  {aid} <> {bid}")
            print(f"        {atext}")
            print(f"        {btext}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
