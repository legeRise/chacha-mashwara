# Review Process

## The pipeline

```
source rules (10 volumes × 100)
        ↓
build_catalog.py
        ↓
rules.csv / rules.json / index.md / volume pages
        ↓
validate_catalog.py
        ↓
volume review gate
        ↓
approved for scripting
        ↓
episode scripts
        ↓
ledger/episodes.csv
```

## Volume review gate

Review one volume at a time. Do not approve 1,000 rules in one sitting.

For each volume:

1. Read the 100 rules. Mark any that sound familiar.
2. Read the consequences. Mark any that feel like the same bill.
3. Read the twists. Mark any that land the same way.
4. Approve / kill / request change by ID.
5. Update `status` in `rules/rules.csv`: `approved`, `candidate`, `rejected`.
6. Move kills to `ledger/rejected.csv` with a one-line reason.

## Change request format

> **R-0042** — change requested.
> **Problem:** twist is too close to R-0017; both are "the voice is already inside."
> **Direction:** make the consequence about the guest's shoes, not the voice.

The change is made in the source file, the catalog is rebuilt, and the changelog is
updated. The ID stays.

## Script approval

A script is approved when:

- the rule is stated in the first 10 seconds,
- the breach is sympathetic,
- the consequence fits the breach,
- there is no narrator,
- Chacha never enters the story,
- the twist pays off the rule,
- the final image is silent and specific,
- the verdict is one sentence,
- the read-through is 50–65 seconds.

## Publishing

After publishing, log in `ledger/episodes.csv`:

- episode ID,
- rule ID,
- publish date,
- URL,
- views at 48 hours,
- views at 7 days,
- average view duration,
- subscribers gained,
- comments naming the rule,
- notes.

## Monthly review

Every 30 days:

1. Which volume had the best retention?
2. Which rule family over-performed?
3. Which breach reason got the most comments?
4. Which Chacha location felt stale?
5. Which thumbnail composition under-performed?
6. Adjust quotas — not plots. Do not copy a winning story; copy its *promise*.

## Kill criteria

Kill a rule if:

- the breach is stupid,
- the consequence is random,
- the twist needs an explanation,
- the story needs more than 65 seconds,
- the rule is a theme, not an action,
- the final image is the same as an earlier episode,
- the rule cannot be a thumbnail.

## The 20-rule sanity read

Before a batch is approved, read 20 rules in a row out loud. If three or more sound
like the same warning, the batch fails. Fix the source, not the wording.
