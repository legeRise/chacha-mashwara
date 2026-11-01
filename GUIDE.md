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
- **Only a passed seed can be written.** A needs-fix or ungated seed disables
  the button and shows exactly what is missing (want, object/motif, theme,
  verdict, or a generic breach). The writer returns 409 if called directly.
- Click **Write full script**.
- The server writer (DeepSeek V4.1 Flash, using the flash-fiction + endings gate)
  reads the seed and writes the whole episode: cold open,
  dialogue, twist, verdict, shot list.
- Wait about 2–5 minutes.
- The script appears immediately. A second reader then checks it against the
  flash-fiction/endings gate in the background; the panel shows passed, failed
  with evidence, or not verified. The writer button stays locked until that
  check finishes.
- Review the draft. Edit it if needed.
- Chacha appears only in the cold open and the return. No narrator inside the story.

### The Chacha frame

Every episode opens with the same three-beat cold open:

1. `लोग ऐसे ही नहीं कहते... <rule>।`
2. `<Name> ने भी यह सुन रखा था। लेकिन उसने नज़रअंदाज़ कर दिया।`
3. `फिर क्या हुआ? खुद ही देख लो।`

The return closes it in four beats: what he did, what the thing understood,
the haunting outcome, then the tag `रूल याद रखना।`

Chacha plays it straight — an uncle stating a fact, not a trailer voice. No
growl, no rhyme, no explaining the entity. This frame is the show; the story
changes, the frame does not.

### Ezclip edit

Use a **3-second Swirl** into the story and a **3-second RotateScaleVanish**
back to Chacha. Use a **1.2-second dissolve** between ordinary scenes. Do not
spiral every cut; the spiral is the move into another world, so it only works
at the frame boundary and the wedding cross-cut.
- **Save draft** keeps the script in this browser.
- New drafts write dialogue in **Hindi Devanagari**, not Roman transliteration.
  For an older Roman draft, click **Hindi script** first; it converts only the
  dialogue and leaves the English stage directions and structure intact.
- **Copy for Ezclip** converts the story — cold open, story scenes, return —
  into Ezclip's multi-speaker format. It keeps the stage directions and speaker
  turns and deliberately ignores the 12-shot production packet. Paste it into
  Ezclip's Create form; Ezclip shows each speaker and picks a voice by language
  and gender.
- **Copy dialogue** copies the older labeled dialogue script. It excludes shot
  lists and production notes.
- **Copy full** copies the whole production document.
- **Download .md** saves the whole document.

The writer saves a copy to `scripts/generated/`. It is an AI draft; the gate
panel is the record of what the second reader found.

## 5. Quality gate

Every seed has a gate status:

- **Passed** — has a specific want, object/motif, theme, verdict, and a score ≥ 7.
- **Needs fix** — flagged for a generic breach, a twist trope, or a weak final image.
- **Ungated** — not reviewed yet.

The writer now refuses a seed that has not passed. After writing, a second reader
applies the flash-fiction/endings checklist and writes a gate verdict beside the
script. A human still reviews the result; the verdict is evidence, not a
publish button.

## 6. Launch plan

The first 28 episodes over 14 days, two a day. Each card shows the rule, Chacha's
location, thumbnail direction, and status. Click a card to open the seed.

## 7. Saving changes

1. Review and annotate rules.
2. Open **Overview → Review data**.
3. Export **JSON** or **CSV**.
4. Send the file back to be merged into `rules/rules.csv` / the source files.

Script drafts are exported individually from the Script builder.

## 8. Editing the catalog

The catalog is read-only in the UI.

- Rules live in `rules/source/volume-*.psv`.
- Rebuild with `python3 tools/build_catalog.py`.
- Validate with `python3 tools/validate_catalog.py`.
- Build and deploy the UI with `./tools/deploy_ui.sh`.

## Keyboard shortcuts (Review)

`A` approve · `M` maybe · `R` kill · `S` skip · `U` undo
