# Milestone 50: the blood wakes (release 76)

Asked for: the second milestone of the luck plan (docs/JACKPOT-PLAN.md, "50: the blood wakes"). Old-Blood the lucky way.

## The blood wakes
- **A Rare roll from a working with WHITE HEAT and not one crack, at trade 4 or more in that pattern, comes out Old-Blood one time
  in 20.** No master's rework, no rare material, no trade 6. (WHITE HEAT itself comes from trade 5, or a TRUE tile.)
- **Not a brew:** a brew's Old-Blood stays the master's brew's (moonwell water, trade 6). Not a haul or a batch of bottles.
- **A woken piece is Old-Blood like any other:** three affixes, the violet frame and its foil, and a Relic can be worked from it
  with a blueprint, as now. Its card says **woke in the fire**, through every rework after.
- **The master's rework stays the sure way to Old-Blood;** waking is the lucky way. A mark can still come with it (the mark's dice
  come after).

## The moment
- **The reveal lands on Rare, with Rare's chime, holds, and then the frame turns violet** with a flare and a different sound:
  THE BLOOD WOKE · OLD-BLOOD. A tap skips straight to it.
- **The pick doesn't give it away:** WHITE HEAT earns a pick of affixes first, and there it says only "It came out Rare, and
  something stirred in the metal."
- **THE BANK'S BOOK** writes it down.

## The sim
**With the luck off (`LUCK=0`) the game is still release 74's to the byte** (a Reach run of 120 days): the waking throws its dice
only when the luck is on and a working can wake.

**Against release 75** (the same seeds, the luck on in both; the Reach 120 days, the coast 90):

| | pieces woken | earnings | the ninth of the Nine: release 75 → 76 |
|---|---|---|---|
| the Reach, seed 1 | 9 | +1.2 % | day 86 → 81 |
| the Reach, seed 3 | 9 | −0.7 % | day 82 → 84 |
| the Reach, seed 4 | 12 | +1.3 % | day 73 → 74 |
| the coast, seed 3 | 6 | +1.6 % | day 87 → 66 |
| the coast, seed 4 | 5 | −4.3 % | day 75 → 72 |
| the coast, seed 5 | 5 | −1.1 % | day 72 → 80 |
| the coast, seed 6 | 2 | +5.4 % | 4 of 9 by day 90 → day 76 |

- **2 to 12 woken pieces a run,** as the plan asked (a few a generation). The bot reaches WHITE HEAT about a working in three from
  trade 5, more often than many players will, so a player's count is likely lower.
- **The Nine's pace moves both ways** (21 days sooner to 8 later), the same noise as milestone 49's; the stalled coastal seed of
  release 75 finishes on day 76 now. Nothing here says the waking hurries the Nine past a blueprint or a shard (rule 4).
- **Earnings move −4 % to +5 %,** the middle +1.2 %.

## Tests
`tests/m50.test.mjs` (2 tests). One older test changed: Old-Blood is "never rolled by a working" with the luck off; with it on, only
a woken piece is.
