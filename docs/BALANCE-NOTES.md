# Balance notes (release 21)

The sim (`tools/sim.mjs`) plays 45 minutes a day and is away 14 hours a night. Now it also fills special orders (stories too) from
the back room, saves up for the second shop once it's SOUGHT, and keeps that shop stocked. Runs: 28 days, seeds 1–8. Compare
without the second shop with `BRANCH=0 node tools/sim.mjs 28 <seed>`.

## What changed in this pass

| | Before | After | Why |
|---|---|---|---|
| The second shop, away | the keeper sold at the open-shop pace all night | at the first shop's clerk pace (one customer every 8–16 min) | it doubled income (+86 % to +110 %) |
| The second shop's town | as busy as the first | customers come 1.6× less often (a smaller town) | still +46 % to +69 % |
| The keeper | wage only | wage and a fifth of each sale | as above |
| The second shop's price | 20,000 c | 30,000 c | it paid back in about a day |

After: **the second shop adds 25–38 % over 28 days** (it opens on day 7–10), paying back its price in about six days. The bot keeps a
large back room of good pieces to send there, so a real player's gain should be lower.

## What the sim shows (unchanged, for the next plans)

- **Renown runs out early.** NOTED on day 1, KNOWN on day 2–4, SOUGHT on day 5–6, **FAMED on day 9–10** (about seven hours of play).
  After that nothing grows with renown. The rarity plan (docs/RARITY-PLAN.md) adds rungs above FAMED for Relics and Mythics.
- **Late-game coin piles up.** By the fourth week the bot earns 5,000–13,000 c a day and has bought every shelf, size and tool.
  Relics, the Hall and the Mythic workings are the sinks the plan adds.
- **Wealthy buyers** (release 17) are steady: 8–18 sales over 1,000 c in 28 days, Old-Blood selling 1–8 times.
- **Stories** reach their end in a few weeks: the bot fills 4–11 orders, 2–5 of them story steps, so most players see one or two gifts
  in the first month.
- **Town events** run in every sim day now; their effect wasn't measured on its own (there's no switch for them yet).

## Limits of the sim

It makes a piece every 50 seconds with no working to play, so its early game is far faster than a person's. It never haggles at the
counter (its sales are the shelf's), and it doesn't brew. Read its numbers as relative (with or without a feature), not as how fast a
player goes.

## Release 36: the long balance (milestone 18)

The sim now runs to 150–180 days, works the Mythic parts and workings, and chases the trail (from RENOWNED it practises the patterns it
holds blueprints for and keeps their Old-Blood back; `CHASE=0` for the old bot). Numbers before this aren't comparable.

| | Result (150 days, seeds 1–6) |
|---|---|
| First Relic | day 30–71, median about 40 |
| Relics by day 150 | 5–8 of 11 |
| First Mythic | day 52–91 |
| Mythics by day 150 | 3–5 of 9 (4–7 by day 180) |
| Renown by day 150 | 12,000–13,400 |

The plan's target (the first Relic in about four weeks, all Nine in about three months) is met for the first Relic in some runs and
not for the Nine. See docs/RARITY-PLAN.md, milestone 18, for why and what would change it.

## Release 37: every clue at OF THE REACH

All 9 shards and 27 parts by day 150 in every run (seeds 1–6); 3–6 of the Nine by day 150, the first on day 52–101. The Relics (5–8 of
11 by day 150) are what's slow now.
