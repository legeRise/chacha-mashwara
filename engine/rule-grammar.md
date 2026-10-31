# Rule Grammar

## The anatomy of a rule

A rule must be:

1. **Imperative** — it tells you what to do or not do.
2. **Specific** — a named action, object, place, or time.
3. **Visual** — it can be a thumbnail.
4. **Breachable** — a sympathetic person could break it in 10 seconds.
5. **Consequential** — breaking it has a bill that fits the breach.
6. **Culturally rooted** — it belongs in a Pakistani everyday world.
7. **Self-contained** — it needs no lore to understand.

## The six patterns

| # | Pattern | Template | Example |
|---:|---|---|---|
| 1 | Never + action + condition | Never [action] [condition]. | Never answer the door after midnight. |
| 2 | Don't + action + place | Don't [action] [place]. | Don't look in the mirror at 3 AM. |
| 3 | If + trigger, don't + action | If [trigger], don't [action]. | If the bell rings twice, don't open. |
| 4 | Always + action + before/after | Always [action] before [event]. | Always check the back seat before you drive. |
| 5 | Never + action + with + person/object | Never [action] with [person/object]. | Never take a photo of a sleeping person. |
| 6 | Don't + action + on + time/day | Don't [action] on [time/day]. | Don't sweep the floor after sunset. |

## The consequence

One sentence. It must be:

- **Specific** — not "something bad happens."
- **Shaped like the breach** — the cost mirrors the choice.
- **Showable in 10 seconds** — no complex mythology.
- **Not a punishment fantasy** — the character is not being "taught a lesson" by a
  moral universe; they are paying a bill.

**Good:** "The voice outside learns yours."
**Bad:** "You will be cursed forever."

## The quality tests

### The thumbnail test
Can you picture the thumbnail in one second? If not, the rule is too abstract.

### The sympathy test
Would a reasonable person break this rule for love, fear, politeness, need, or
pride? If only an idiot would break it, the story fails.

### The 50-second test
Can the breach, escalation, twist, and final image fit in 40 seconds of dialogue?
If not, the rule is too big.

### The "one rule" test
Does the story prove exactly one rule? If a second rule is needed, split it into
two episodes.

### The "no explanation" test
Can the consequence be shown without explaining what the entity is? If not, cut
the entity and keep the cost.

## Bad rules and why

| Bad rule | Problem | Fix |
|---|---|---|
| Never go into the dark. | Not specific; no thumbnail. | Never enter a room where the light switch is warm. |
| Don't trust strangers. | A theme, not a rule. | Don't tell a stranger your mother's name. |
| Never open the door. | No condition; no story. | Never open the door if the knock comes from inside. |
| Don't use a haunted object. | Explains the supernatural. | Don't wind a clock that stopped at 3. |
| Always be careful. | Not actionable. | Always check the back seat before you drive. |

## Rule families

Each rule belongs to one family. Families help the dedup check and the volume
balance.

- **Threshold** — doors, gates, windows, stairs.
- **Reflection** — mirrors, water, screens, photos.
- **Invitation** — names, guests, chairs, food, welcomes.
- **Counting** — stairs, guests, seats, knocks, days.
- **Mimicry** — voices, faces, footsteps, handwriting.
- **Debt** — gifts, promises, loans, favors, inheritances.
- **Contamination** — clothes, objects, food, water, air.
- **Departure** — last buses, final calls, goodbyes, returns.
- **Witness** — seeing something you shouldn't, and being seen.
- **Routine** — chores, walks, prayers, meals, sleep.

No rule family may appear more than 3 times in any 10 consecutive episodes.

## The title is the rule

Do not write a title and then a rule. The rule is the title. If the title needs a
subtitle to make sense, the rule is weak.

## The catalog contract

Every row in `rules/rules.csv` must have:

- a unique rule,
- a consequence,
- a story core,
- a cast,
- a place,
- a breach reason,
- a twist,
- a final image.

If any field is generic, the row is a candidate, not approved.
