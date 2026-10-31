# How to use the Rulebook UI

**Live:** https://chacha.ez-clip.ovh/

The UI is a review and production tool for the 1,000-rule catalog. It does not
write to the repo directly; approvals, notes, and script drafts stay in your
browser until you export them.

## 1. Overview

- See how many rules are approved, still to review, or killed.
- Track progress by volume.
- **Review data** → export JSON or CSV when you want changes merged into the repo.
- **Reset** clears local review data only. The catalog is untouched.

## 2. Rules

- Search by rule, cast, place, twist, or ID.
- Filter by volume, rule family, tone, or status.
- Click any row to open the full seed.
- The drawer shows cast, place, breach reason, twist, final image, Chacha's
  location, and a reviewer note.
- **Copy change request** copies the rule plus your note so you can paste it into
  chat.

## 3. Review

One rule at a time. This is the fastest way to clear a volume.

| Key | Action |
|---|---|
| `A` | Approve |
| `M` | Maybe |
| `R` | Kill |
| `S` | Skip |
| `U` | Undo |

- **Approve** — you would make it.
- **Maybe** — needs a change first.
- **Kill** — off-brand.
- Use the volume selector to review one volume at a time.
- The counter shows how many are left in the current queue.

## 4. Script builder

- Pick a rule from the left list.
- The template fills in the cold open, story beats, cast, final image, and return.
- Write the dialogue in Urdu.
- Chacha appears only in the cold open and the return. No narrator inside the story.
- **Save draft** keeps the script in this browser.
- **Copy** or **Download .md** to move it out.

## 5. Launch plan

The first 28 episodes over 14 days, two a day. Each card shows the rule, Chacha's
location, thumbnail direction, and status. Click a card to open the seed.

## 6. Saving changes

1. Review and annotate rules.
2. Open **Overview → Review data**.
3. Export **JSON** or **CSV**.
4. Send the file back to be merged into `rules/rules.csv` / the source files.

Script drafts are exported individually from the Script builder.

## 7. Editing the catalog

The catalog is read-only in the UI.

- Rules live in `rules/source/volume-*.psv`.
- Rebuild with `python3 tools/build_catalog.py`.
- Validate with `python3 tools/validate_catalog.py`.
- Build and deploy the UI with `./tools/deploy_ui.sh`.

## Keyboard shortcuts (Review)

`A` approve · `M` maybe · `R` kill · `S` skip · `U` undo
