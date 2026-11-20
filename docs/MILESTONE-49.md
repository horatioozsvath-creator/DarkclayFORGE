# Milestone 49: the reveal, and marks (release 75)

Asked for: the first milestone of the luck plan (docs/JACKPOT-PLAN.md, "49: the reveal, and marks"). The piece that comes out of the
fire better than it had any right to.

## The reveal
- **A working's card turns over.** As a working ends, the odds bar it earned (Common, Fine, Rare) is shown, a needle sweeps it once
  and lands in the tier's stretch, and the card turns over. A Rare lands with a chime and a ring round the card.
- **A tap skips it.** About a second and a half in all; with less motion asked for, there's no movement at all.
- **Not for** MAKE IT AT ONCE (no working), a rework (no roll), a haul, a batch of bottles, or a part of the Nine.

## Marks
- **About one working in 60 comes out marked:** one clean working in 40 (no crack, or WHITE HEAT earned), one cracked working in
  120, and a little more for each trade over 3 (5 % a trade). Any tier, never a flawed piece, never a haul or a batch of bottles.
- **Four marks,** each with its own words at each station:

  | Mark | How often | At the forge / the stretcher / the bench / the kettle / the glass | What it does |
  |---|---|---|---|
  | **Veined** | 4 in 10 | Veined / Dark-veined / Dark-grained / Clouded / Veined | worth ×2 |
  | **Starfall** | 3 in 10 | Starfall / Star-flecked / Star-flecked / Starlit / Starred | worth ×2, one affix at its very best (gilded) |
  | **Ghost-tempered** | 2 in 10 | Ghost-tempered / Ghost-pale / Ghost-pale / Ghost-clear / Ghost-pale | worth ×2, Hallowed (or Graveward) added over the tier's count; if it has it already, at its best |
  | **Ember-hearted** | 1 in 10 | Ember-hearted / Ember-warm / Ember-hearted / Ember-bright / Ember-hearted | worth ×3 |

- **On the card:** the mark's name under the piece's, something in the metal over the picture (dark veins, bright points, a pale
  wash, a low glow), and a glow of the mark's colour round the frame.
- **It stays with the piece** through every rework, up to a Relic and a Mythic. Its gift is given once: a Common piece's Starfall
  waits for its first affix, when it's reworked into Fine.
- **THE BANK'S BOOK** writes each mark down; the result says when it's the first of its kind at that station.

## Gilded, and FLAWLESS
- **An affix rolled in the top twelfth of its range comes out at its very best: GILDED**, in gold on the card. About one affix in 12.
- **Three gilded on one piece: FLAWLESS**, written by the tier, worth twice. An Old-Blood piece can be one; it's rare.

## The Collector
- **A new customer, from FAMED, once the shop has made a marked piece.** They buy **only marked pieces**, and pay **half as much
  again** for them. Each comes in after a mark by name ("Anything Ember-hearted?"); shown that mark, they're a step keener.
- **They remember:** the last piece you sold them, and they say so when they come in.
- Nothing marked on the shelf, they go ("Nothing marked on the shelf for them").

## THE MAKER'S BOOK › MARKS
- **MARKS IN THE METAL:** each station you have, its four marks, and which you've made. Before the first, the book only has the old
  makers' tales; after it, the odds.

## The sim
**With the luck off (`LUCK=0`) the game is release 74's to the byte** (a Reach run of 120 days and a coastal one of 90): no marks,
no gilded affixes, no Collector, and no dice thrown for any of them.

**With it on**, against the same seeds with it off (the Reach 120 days, the coast 90):

| | earnings | the ninth of the Nine: luck off → on | marks (veined / starfall / ghost / ember) | sold to the Collector |
|---|---|---|---|---|
| the Reach, seed 1 | −1.4 % | day 76 → 86 | 61 / 60 / 34 / 16 | 84, for 42,400 c |
| the Reach, seed 3 | +1.9 % | day 75 → 82 | 42 / 48 / 21 / 15 | 62, for 25,300 c |
| the Reach, seed 4 | +0.1 % | day 74 → 73 | 63 / 49 / 29 / 10 | 76, for 37,900 c |
| the coast, seed 3 | +2.5 % | day 87 → 87 | 36 / 27 / 22 / 9 | 40, for 19,800 c |
| the coast, seed 4 | +3.5 % | 6 of 9 by day 90 → day 75 | 49 / 41 / 17 / 9 | 68, for 37,400 c |
| the coast, seed 5 | +2.4 % | day 83 → 72 | 41 / 35 / 23 / 9 | 62, for 26,800 c |
| the coast, seed 6 | −5.2 % | day 74 → 4 of 9 by day 90 | 32 / 26 / 22 / 17 | 50, for 25,400 c |

- **Marks come about as planned:** 100–170 a run, from the bot's thousands of workings, in the four's proportions.
- **Earnings move −5 % to +3.5 %** (the middle +1.9 %): the marks' worth, less the dice's other turns.
- **The Nine's pace is within the noise, as far as seven seeds can tell.** On the coast one seed finished 11 days sooner, one
  finished on day 75 where it hadn't by day 90, and one didn't finish where it had: the same stall happens with the luck off. In
  the Reach two seeds came 7 and 10 days later and one a day sooner. The plan's rule 4 holds (luck never skips a blueprint or a
  shard); the Reach's two later seeds are worth watching when milestone 50 (the blood wakes) adds its own luck.
- **The Collector is a small trade:** 40–84 pieces a run, 1–3 % of the earnings. The bot shelves every marked piece and doesn't
  keep them for the Collector; a player who does will do better.
- **No FLAWLESS piece in any run.** Three gilded affixes on one piece needs three in a twelfth on an Old-Blood piece: about 1 in
  1,700, and the bot makes few Old-Blood pieces from fresh workings. It's meant to be the rarest thing here.

## Tests
`tests/m49.test.mjs` (6 tests). The page has a `?debug` hook for the result screen (`forge.result(pattern, res)`), used to check
the reveal in the browser.
