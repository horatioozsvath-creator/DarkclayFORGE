# Milestone 52: the grow-bed (release 78)

Asked for: the last milestone of the luck plan (docs/JACKPOT-PLAN.md, "52: the grow-bed"). A piece grown, not forged: a living
cutting planted toward a pattern, and what comes up is never quite known.

## The bed
- **WORKSHOP › THE GROW-BED**, shown from SOUGHT, **set up from FAMED for 3,000 c**. It stands in the workshop (a raised bed of
  planks, black earth and three cuttings on their stakes), fixed like a station: never sold back. No room in the workshop, no bed.
- **A second bed from RENOWNED, 4,000 c**: two cuttings growing at once (one bed in the room for both).
- **No working, no strip.** Choose a cutting and the pattern to grow it toward, PLANT IT, and it comes up **three days later** on
  the shop's clock, open or away.

## The cuttings
| Cutting | Where it's from | Grows toward |
|---|---|---|
| **Heartwood cutting** (new) | Hollin's Timber, about 90 c (over the pass on the coast, half as dear again); a runner turns one up on the ford, Reach and deep-door roads once there's a bed | a staff, a shortbow, a longbow, a crossbow, a club, a wand, an axe, a spear, a mace, a war hammer |
| **Old bone** (new) | only below the deep doors (or down through the mine): a runner turns one up there once there's a bed. Never sold | a dagger, a shortsword, a falchion, a shortbow, a longbow, a studded club |
| **Red coral** (the coast's rare) | the coast, as now | a trident, a ring, glass beads |

Only patterns the shop knows, at a station it has. On the card the cutting stands for the part it grew: heartwood the stave or haft
(old yew), old bone the grip or nocks (bone), coral the colour or stone where the pattern takes it; the rest are the pattern's first
choice. The bed's line on the card tells the story.

## Tending
- **Once a day** (each of the three days from planting): TEND IT, water, light, turning it on its stake. Three leaves on the bed's
  row fill as it's tended; a missed day shows dashed.
- **Missed, it still comes up**, plainer. Never dead: a miss takes nothing away.

## What comes up
Rolled as you **LIFT IT OUT**, never while you're away (it only becomes ready; a toast, the book and the away summary say so).

| Days tended | Common | Fine | Rare | a mark |
|---|---|---|---|---|
| 0 | 40 % | 45 % | 15 % | 1 in 20 |
| 1 | 30 % | 48 % | 22 % | 1 in 15 |
| 2 | 20 % | 50 % | 30 % | 1 in 12 |
| 3 | 10 % | 50 % | 40 % | **1 in 10** (at the anvil, about 1 in 60) |

- **A Rare tended every day can wake**: 1 in 10 of them come up **Old-Blood** ("woke in the earth"). Old-Blood is the most the bed
  gives: rule 4 holds.
- **Every piece from the bed is grown** (milestone 51): it comes up QUICK and grows as the staff carry it.
- **The card says so**: "Grown in the bed by <you>" in its making (no strikes or heats: it wasn't worked), and under IT GROWS,
  "Grown in the bed at <you>'s, in the Reach, tended N days of 3". A share link carries it.
- **The reveal**, the biggest of the four: the earth parts and the card rises out of it, then the words (THE BLOOD WOKE IN THE
  EARTH, A MARK IN IT, GROWN, NOT FORGED). Its mark goes in the book's marks, for the Collector too.

## Not handed on
The bed belongs to the shop: an heir sets up their own. The second shop's keeper never tends it.

## The sim
**With the luck off (`LUCK=0`) the game is still release 74's to the byte**: no bed is set up and no die is thrown for a cutting.

**With it on**, against release 77 on the same seeds (the Reach 120 days, the coast 90). The bot sets the bed up when it has the cost
and 4,000 c to spare (the second with 8,000 to spare), buys heartwood when it has no cutting, plants the dearest pattern it can,
tends whenever it looks in and lifts out what's come up.

| | earnings | the ninth of the Nine: release 77 → 78 | bed from day (second) | pieces from the bed: C / F / R / Old-Blood | marks |
|---|---|---|---|---|---|
| the Reach, seed 1 | +3.3 % | day 84 → 89 | 12 (18) | 9 / 17 / 15 / 0 | 4 |
| the Reach, seed 3 | −1.1 % | day 77 → 84 | 12 (16) | 5 / 20 / 14 / 2 | 1 |
| the Reach, seed 4 | −0.7 % | day 98 → 70 | 13 (18) | 2 / 20 / 18 / 1 | 4 |
| the coast, seed 3 | +1.4 % | day 82 → 89 | 14 (21) | 3 / 14 / 10 / 1 | 1 |
| the coast, seed 4 | −4.1 % | day 72 → 76 | 14 (21) | 4 / 14 / 10 / 0 | 3 |
| the coast, seed 5 | −4.0 % | day 69 → 8 of 9 by day 90 | 13 (20) | 5 / 17 / 6 / 1 | 2 |
| the coast, seed 6 | −0.8 % | 8 of 9 by day 90 → day 82 | 12 (18) | 1 / 19 / 7 / 2 | 4 |

- **The bed's odds come out as set**: 237 pieces in all, 12 % Common, 51 % Fine, 34 % Rare, 3 % Old-Blood (the bot tends every
  day), and 8 % marked.
- **28–41 grown pieces a run** from the bed, on top of milestone 51's 38–63 from the anvil.
- **Earnings move −4 % to +3 %**, the same spread as milestones 49–51. **The Nine's pace leans later this time** (five seeds later
  by 4–7 days, one 28 days sooner, the coast's short seed swapped), but by no more than milestone 51 moved it both ways: read as
  dice noise, not proven. The bed costs the bot 7,000 c early on (FAMED comes about day 12) and pays it back in pieces it sells.

## Tests
`tests/m52.test.mjs` (6 tests): setting up (FAMED, RENOWNED, room in the workshop, the luck switch), what a cutting grows toward,
tending and the three days, the odds (tending, waking, marks, Old-Blood at most), a runner's finds, and the link. The two "every
material is sold somewhere" tests leave old bone out (found only below the doors, like a relic material).
