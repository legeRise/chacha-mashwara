# Catalog Changelog

Every change to the rule catalog is logged here. IDs never change.

## 2026-10-31 — Initial build

- Generated **1,000 rules** across 10 volumes (100 per volume).
- Source files: `rules/source/volume-01-ghar.psv` … `volume-10-mausam.psv`.
- Built `rules/rules.csv`, `rules/rules.json`, `rules/index.md`, and 10 volume pages.
- Validation: 1,000 rows, unique IDs, unique rules, unique twists, no empty
  required fields, no banned words, no Chacha location repeat within 20 rows.

## 2026-10-31 — Dedup cleanup pass

Fixed duplicate twists and near-duplicate rules identified by the first dedup
report. Changed rows:

- R-0171 — last bus twist now "passengers who missed their stop."
- R-0617 — bus rule now "Never take a bus that waits for you."
- R-0638 — child-directions twist now "the traveler's own childhood."
- R-0533 — wedding gift now "a set of glasses," new consequence and story.
- R-0253 — secret-on-paper twist now "the man's abandoned son."
- R-0291 — favor twist now "the man's dead father."
- R-0649 — suitcase-key twist now "the man's reflection."
- R-0660 — ticket twist now "the man's younger self."
- R-0854 — family-photo twist now "the family is rearranging itself."
- R-0712 — hide-and-seek twist now "the girl's own voice."
- R-0679 — room 13 twist now "the previous guest's last night."
- R-0849 — family-name twist now "the house is the family name."
- R-0945 — tree twist now "the tree is the storm's hand."
- R-0465 — park bench rule now "Never sit on a bench that's still warm."
- R-0692 — platform bench rule now "Never sit on a bench facing the tracks."
- R-0536 — wedding gift now "a bedding set," new consequence and story.
- R-0736 — school drawing rule now "Never let a child take a drawing home."
- R-0715 — stranger game rule now "Never join a stranger's game."
- R-0855 — grave photo rule now "Never develop a photo from a grave."
- R-0733 — school bag rule now "Never let a school bag ride alone."
- R-0892 — dead relative's chair rule now "Never move a dead relative's chair."
- R-0882 — heirloom rule now "Never pawn an heirloom."
- R-0816 — family secret rule now "Never leave a secret at a grave."
- R-0957 — eclipse rule now "Never open a window during an eclipse."
- R-0963 — first-rain rule now "Never comb your hair in the first rain."
- R-0785 — hide-and-seek rule now "Never play hide and seek after sunset."
- R-0616 — bag twist now "the bag is still on the bus, and he is the one who got off."

Fixed a tone typo (`eerier` → `eerie`) and a location typo ("A alley" →
"An alley").

## Change request format

> **R-0042** — change requested.
> **Problem:** twist is too close to R-0017.
> **Direction:** make the consequence about the guest's shoes, not the voice.

The source row is edited, the catalog is rebuilt, and this file is updated.
