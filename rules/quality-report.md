# Seed Quality Report

**Total seeds:** 1000

| Gate status | Count |
|---|---:|
| Passed | 1 |
| Needs fix | 238 |
| Ungated | 761 |
| Killed | 0 |

## Flags

| Flag | Count |
|---|---:|
| missing-object-motif | 999 |
| missing-theme | 999 |
| missing-verdict | 999 |
| missing-want | 999 |
| generic-breach | 166 |
| twist-trope | 76 |
| duplicate-final-image | 12 |

## By volume

| Volume | Total | Passed | Needs fix | Ungated | Killed |
|---|---:|---:|---:|---:|---:|
| Bachpan | 100 | 0 | 23 | 77 | 0 |
| Ghar | 100 | 1 | 16 | 83 | 0 |
| Khandan | 100 | 0 | 20 | 80 | 0 |
| Mausam | 100 | 0 | 17 | 83 | 0 |
| Mohalla | 100 | 0 | 21 | 79 | 0 |
| Purani Cheezein | 100 | 0 | 25 | 75 | 0 |
| Raaste | 100 | 0 | 27 | 73 | 0 |
| Rishtey | 100 | 0 | 24 | 76 | 0 |
| Safar | 100 | 0 | 33 | 67 | 0 |
| Shadi | 100 | 0 | 32 | 68 | 0 |

## What this means

A seed cannot become a script until `gate_status` is `passed`. The gate asks:

- Is the protagonist's want specific?
- Is there a concrete object/motif that carries subtext?
- Is the breach sympathetic, not generic?
- Is the twist causal, not a trope?
- Is there a one-line verdict that names the mistake?

## Next

1. Fix `needs-fix` seeds volume by volume.
2. Gate the `ungated` seeds.
3. Only then write scripts, in batches of 14.
4. Every script passes the script quality gate before production.

R-0001 is the worked example: it was rewritten with the flash-fiction and
endings diagnostics and is the only passed seed right now.
