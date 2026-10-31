# Chacha Mashwara UI

A local review and production tool for the rulebook.

**Live:** https://chacha.ez-clip.ovh/

## Run it locally

```bash
cd ui
npm install
npm run dev
```

Open `http://localhost:5173`.

The dev script copies `../rules/rules.json` into `ui/public/` before starting, so
the UI always reads the current catalog.

## Build

```bash
npm run build
```

Output lives in `ui/dist`. It is a static site; serve it with any static host.

## Deploy on this server

```bash
./tools/deploy_ui.sh
```

That builds the UI, copies it to `/var/www/chacha`, and reloads nginx. The public
URL is `https://chacha.ez-clip.ovh/`.

## What it does

- **Overview** — catalog stats, volume progress, quality gate counts, review data export.
- **Rules** — search, filter by volume/family/tone/status/gate, open any seed.
- **Review** — one rule at a time, keyboard shortcuts (A/M/R/S/U), notes.
- **Script builder** — click **Write full script** to have the server writer turn a seed into a complete episode script.
- **Launch plan** — the first 28 episodes over 14 days.
- **Guide** — in-app instructions.

## The writer

The **Write full script** button calls `tools/writer_server.py` through `/api/`.
The server asks DeepSeek V4.1 Flash (via the local `opencode` CLI) to write a quality-gated script using the full flash-fiction + endings gate and
saves it to `scripts/generated/`. It takes roughly 2–5 minutes.

Run it locally:

```bash
python3 tools/writer_server.py
```

On this server it runs as `chacha-writer.service` and is proxied by nginx.

Generated scripts are **AI drafts**. Review them against the script gate before
production.

## Local review data

Approvals, notes, and script drafts are stored in the browser's `localStorage`
under `cm.reviews.v1`, `cm.notes.v1`, and `cm.scripts.v1`. They are not written to
the repo. Export review data from **Overview → Review data** and apply it to
`rules/rules.csv` (or send the export back to be merged).

The catalog itself is read-only in this UI. Edit `rules/source/*.psv` and rebuild
with `python3 tools/build_catalog.py` to change it.

## Keyboard

On the Review page:

- `A` approve
- `M` maybe
- `R` kill
- `S` skip
- `U` undo

## Tech

React + Vite, no backend. The catalog is a static JSON snapshot generated from
`rules/rules.json`.
