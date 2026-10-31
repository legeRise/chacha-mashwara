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
rules/              1,000-rule catalog + volume indexes + source data
engine/             Rule grammar, story formula, dedup, review process
ledger/             Production + publishing status, rejected rules
batches/            Monthly generation batches
templates/          Episode script template
analytics/          Monthly reviews
tools/              Build + validation scripts
ui/                 Local review + production UI (React + Vite)
```

## Start here

1. Read `channel/channel.md` and `channel/format.md`.
2. Read `series/chacha-mashwara/bible.md` and `voice-cast.md`.
3. Open `rules/rules.csv` — the master catalog.
4. Review Volume 1 in `rules/volumes/01-ghar.md` and `batches/2026-11-volume-01.md`.
5. Use `templates/episode-script.md` to turn a rule into a script.

## Build & validate

```bash
python3 tools/build_catalog.py        # rebuild rules.csv, rules.json, volume pages
python3 tools/validate_catalog.py     # validate only
python3 tools/duplicate_report.py     # near-duplicate report for review
```

Source of truth: `rules/source/volume-*.psv`. Edit there, then rebuild. Do not edit
`rules.csv` directly.

## Run the UI

```bash
cd ui
npm install
npm run dev
```

Open `http://localhost:5173`. See `ui/README.md` for the screens and shortcuts.

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
