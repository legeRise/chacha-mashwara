# Chacha Mashwara — The Rulebook

A production repo for a short-form Urdu horror series built on one engine:

> **One rule. One story. One verdict.**

Chacha Mashwara is the only recurring character. Each episode opens with him in a
new location. He states a rule and its consequence, opens his rulebook, and we
enter a fully dramatized story with its own characters and voices. Chacha does not
narrate the story and does not appear inside it. At the end, he returns for the
verdict and closes the book.

## Format at a glance

| Part | Time | What happens |
|---|---:|---|
| Cold open | 0:00–0:10 | Chacha, one location, states the rule and the consequence. |
| Transition | 0:10–0:12 | He opens the rulebook; camera enters the page. |
| Story | 0:12–0:50 | 2–4 characters, dialogue only, no Chacha. |
| Return | 0:50–0:58 | Chacha delivers the verdict. |
| Final image | 0:58–1:00 | The story's last shot, silent. |

Target runtime: **50–65 seconds**.

## Repo map

```
channel/            The promise, format, titles, thumbnails
series/             Chacha's bible, locations, lore, catchphrases
rules/              1,000-rule catalog + quality gate + volume indexes
engine/             Rule grammar, story formula, dedup, quality gate
ledger/             Production + publishing status, rejected rules
batches/            Monthly generation batches
templates/          Episode script template
analytics/          Monthly reviews
tools/              Build, validation, quality gate, writer service
deploy/             nginx + systemd snippets for the hosted UI
scripts/generated/  AI-written full scripts
ui/                 Local review + production UI (React + Vite)
```

## Start here

1. Read `channel/channel.md` and `channel/format.md`.
2. Read `series/chacha-mashwara/bible.md` and `voice-cast.md`.
3. Open `rules/rules.csv` — the master catalog.
4. Review Volume 1 in `rules/volumes/01-ghar.md` and `batches/2026-11-volume-01.md`.
5. Use `templates/episode-script.md` to turn a rule into a script.
6. For the UI, see `GUIDE.md` or the in-app **Guide** page.

## Build & validate

```bash
python3 tools/build_catalog.py        # rebuild rules.csv, rules.json, volume pages
python3 tools/validate_catalog.py     # validate only
python3 tools/duplicate_report.py     # near-duplicate report for review
```

Source of truth: `rules/source/volume-*.psv`. Edit there, then rebuild. Do not edit
`rules.csv` directly.

## Quality gate

The catalog is a backlog, not a finished product. No seed can become a script
until it passes the seed gate.

- `rules/quality.csv` — the gate status and gate fields for all 1,000 seeds.
- `rules/quality-report.md` — the current audit.
- `engine/quality-pipeline.md` — the full pipeline.
- `engine/script-quality.md` — the FF1–FF9 / E1–E6 script gate.

Current state: **1 passed, 238 needs fix, 761 ungated.** The first pass is R-0001.

```bash
python3 tools/quality_gate.py            # audit
python3 tools/quality_gate.py --apply    # write flags/status back
python3 tools/build_catalog.py           # merge quality fields into rules.json
```

The UI has a **Write full script** button. It calls the local writer service and
saves a draft to `scripts/generated/`. Generated drafts still need review before
production.

## Run the UI

**Live:** https://chacha.ez-clip.ovh/

```bash
cd ui
npm install
npm run dev
```

Open `http://localhost:5173`. See `ui/README.md` for the screens and shortcuts.
To publish changes on this server: `./tools/deploy_ui.sh`.

The writer service runs separately:

```bash
python3 tools/writer_server.py
```

In production it is proxied by nginx at `/api/` and managed by
`chacha-writer.service`.

## Status

- [x] Show format locked
- [x] Chacha bible + voice cast
- [x] Rule grammar + story formula
- [x] 1,000-rule catalog (candidate status)
- [x] Duplicate-twist cleanup pass
- [x] First sample script (R-0001)
- [x] Local review + production UI
- [ ] Volume 1 review
- [ ] First 14 scripts
- [ ] Launch

## The hard boundaries

No gore. No religious disrespect. No real names. No sexual content. No harm to
children on screen. The supernatural is implied, never explained. The joke is
never on the victim.
