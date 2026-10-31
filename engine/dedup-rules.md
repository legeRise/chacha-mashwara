# Dedup Rules

## The fingerprint

Every idea is fingerprinted by four fields:

1. **Rule** — the title / promise.
2. **Consequence** — the bill.
3. **Breach reason** — why a sympathetic person broke it.
4. **Twist** — how the consequence reveals itself.

Two ideas are "the same" if their fingerprint is the same in meaning, not just in
wording. The dedup check is semantic first, automated second.

## Hard rules

1. **No rule repeats semantically.** Rewording does not make it new.
2. **No consequence family repeats within 20 rows.** Families: mimicry, replacement,
   forgetting, following, debt, reflection, invitation, counting, naming, threshold,
   contamination, departure.
3. **No twist repeats within 50 rows.**
4. **No (breach reason + consequence) pair repeats, ever.**
5. **No (protagonist role + place) pair repeats within 30 rows.**
6. **No Chacha location repeats within 20 episodes.**
7. **No rule family more than 3 times in 10 consecutive episodes.**
8. **No title pattern more than 3 times in a row.**
9. **No episode may prove two rules.** Split it.
10. **Rejected ideas stay rejected.** They live in `ledger/rejected.csv` with the
    reason. They never resurface in a batch.

## Automated checks

`tools/validate_catalog.py` checks:

- exactly 1,000 rows,
- unique IDs,
- unique normalized rules,
- no empty required fields,
- no duplicate (rule + consequence) pairs,
- no duplicate (breach reason + twist) pairs,
- no Chacha location within 20 rows,
- no more than 3 same rule families in any 10 rows,
- title length ≤ 8 words,
- no banned words.

## Semantic checks (manual)

For every batch of 20:

- Read the rules aloud. Do any two sound like the same warning?
- Read the consequences. Do any two feel like the same bill?
- Read the twists. Do any two land the same way?
- Check the breach reasons. Are any two "they were curious"?
- Check the final images. Are any two the same shot?

If two ideas are too close, keep the stronger one and send the other to
`ledger/rejected.csv` with a note.

## Similarity scoring

Use token Jaccard similarity on the combined fingerprint:

- **> 0.60** — reject.
- **0.45–0.60** — manual review.
- **< 0.45** — pass, if the manual read agrees.

Do not rely on the score alone. Two different sentences can promise the same story.

## Change requests

The user can request changes by ID:

> "Change R-0042 — the twist is too similar to R-0017. Make the consequence about
> the guest's shoes, not the voice."

The change is made in `rules/source/*.psv`, the catalog is rebuilt, and the change
is logged in `rules/CHANGELOG.md`. The ID never changes.

## What counts as "new"

A new idea needs **at least three** of the four fingerprint fields to be meaningfully
different:

- a different rule (different action/object/condition),
- a different consequence (different bill),
- a different breach reason (different human failing),
- a different twist (different reveal).

If only the setting changes, it is the same story in a new room. Reject it.

## The 1,000-video problem

Monsters run out. Human reasons do not. The catalog is built on **breach reasons**
and **consequences**, not on creatures. That is why it can scale without becoming
"the same ghost in different houses."

The ledger is the memory. If it is not in the ledger, it does not exist.
