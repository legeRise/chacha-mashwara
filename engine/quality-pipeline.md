# Quality Pipeline

The catalog is a quarry, not a finished building. This pipeline makes it
impossible for an ungated story to become a script or a video.

```
1000 seeds
    ↓
Seed gate  (rules/quality.csv)
    ↓ passed
Script writer  (UI “Write full script” or batch)
    ↓
Script gate  (engine/script-quality.md)
    ↓ passed
Production
```

## Stage 1 — Seed gate

Every seed must have:

| Field | Question |
|---|---|
| **Want** | What does the protagonist specifically want in the first five seconds? |
| **Object / motif** | What concrete object carries the subtext? |
| **Theme** | What is the story actually about, without stating it? |
| **Verdict** | What is Chacha’s one-sentence judgment? |
| **Score** | 0–10. A passed seed must score 7 or higher. |
| **Gate status** | `passed`, `needs-fix`, `ungated`, or `killed`. |

The seed gate also flags:

- generic breach reasons (`curious`, `bored`, `in a hurry`, etc.)
- twist tropes (`future self`, `already inside`, `the house is…`)
- duplicate final images
- missing gate fields

**Rule:** no seed becomes a script until `gate_status` is `passed`.

## Stage 2 — Script gate

A full script must pass `engine/script-quality.md`:

- **FF1–FF9** — structure, character compression, frame, subtext, imagery,
  setting, theme, language, logic.
- **E1–E6** — endings: not arbitrary, predictable, unearned, expanding,
  overexplained, or badly paced.
- One rule, one sympathetic breach, one causal twist, one verdict, one final
  image.
- No narrator. No Chacha inside the story.
- 55–65 seconds.

**Rule:** no script goes to production until it passes the script gate.

## Stage 3 — Production gate

- Voice track locked.
- Animatic timed to the voice.
- 10–12 shots generated.
- Sound, thumbnail, title, description.
- Logged in `ledger/episodes.csv`.

## The writer button

The UI has a **Write full script** button. It calls `tools/writer_server.py`,
which asks the local `opencode` writer model to turn the seed into a full
quality-gated script and saves it to `scripts/generated/`.

This is an **AI draft**. It still goes through the script gate before production.

## Batching

Do not try to write 1,000 scripts in one pass.

1. **Seed pass:** one volume (100 seeds) at a time.
2. **Script pass:** 14 scripts per batch (one week at 2/day).
3. **Production:** 2 videos/day, 2-week buffer.
4. **Kill rate:** if fewer than 40% of a volume passes the seed gate, stop and
   redesign that volume before writing scripts.

## Commands

```bash
python3 tools/quality_gate.py            # report
python3 tools/quality_gate.py --apply    # update quality.csv
python3 tools/quality_gate.py --strict   # fail if approved/scripted rows are ungated
python3 tools/writer_server.py           # local writer API
python3 tools/build_catalog.py           # rebuild catalog with quality fields
```

## The principle

**Quality is a gate, not a hope.**

A hundred excellent episodes are worth more than a thousand mediocre ones. The
catalog can wait. The gate cannot.
