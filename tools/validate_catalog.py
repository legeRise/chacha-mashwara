#!/usr/bin/env python3
"""Validate the built catalog without rewriting it."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_catalog import build, validate  # noqa: E402


def main() -> int:
    records = build()
    errors = validate(records)
    print(f"Loaded {len(records)} rules.")
    if errors:
        print(f"{len(errors)} error(s):")
        for err in errors:
            print(f"  - {err}")
        return 1
    print("Validation: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
