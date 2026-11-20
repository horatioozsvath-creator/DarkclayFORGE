# Milestone 51: grown pieces (release 77)

Asked for: the third milestone of the luck plan (docs/JACKPOT-PLAN.md, "51: grown pieces"). A piece comes out alive, and grows with
the one who carries it.

## A piece comes out alive
- **About one working in 150** of the gear the staff can carry (a weapon, a shield, a helm or hood, a body, gloves, boots, a ring,
  a satchel, a lantern), leaning as a mark's odds do: more for a clean working and a higher trade, fewer for a cracked one. **Twice
  as often with a mark.** Any tier; never a flawed piece, a brew, a bottle, a window glass, or MAKE IT AT ONCE.
- **The result says so:** IT CAME OUT ALIVE · IT GROWS, with a chime, and a line on how it grows. THE BANK'S BOOK writes it down.
- **On the card:** a green sprig in the corner of the picture, a green glow round the frame, and a line under the name:
  "❦ IT GROWS · QUICK · not carried yet".

## It grows as it's carried
Carried by your runner on the roads, or by a miner at the face. Its growth is counted in **trips**, a Reach trip's worth each: a road
counts its hours over three (a Reach trip is one, the ford a third, the deep doors 2⅔, below them 4), and a miner's haul a quarter
(about four a day at the face). A trip to the yard counts next to nothing, so it can't be farmed.

| Stage | At | What it does |
|---|---|---|
| **QUICK** | as made | nothing yet |
| **GROWN** | 10 trips | every affix up to its very best (gilded) |
| **NAMED** | 25 | one more affix, at its best, over the tier's count; and a name from the one who carried it ("Pell's Thornbite") |
| **FULL-GROWN** | 50 | a tier up, Old-Blood at most; an Old-Blood piece (or a Relic, a Mythic) takes one more affix instead |

- **Each stage is a moment:** a toast and a chime, the book's line, and the away summary if it happened while you were gone.
- **The card's line** tells who carried it and how far: "❦ IT GROWS · NAMED carried by Pell, 26 of 50 trips".
- **A grown piece is often FLAWLESS.** GROWN gilds every affix, so a Rare piece that's NAMED has three gilded, and so does any
  Old-Blood one that's GROWN: worth twice. That's the reward for carrying it; FLAWLESS from the anvil alone stays as
  rare as it was.
- **Reworked, it stays grown:** its stage, its name and its extra affixes go through the fire with it. Worked into a Relic or a
  Mythic, the Relic's name wins.
- **A hard blow on the road never breaks a grown piece or an heirloom**, as it never breaks a Relic: luck takes nothing away.
- **On the wall or over the door** it draws one charm more for each stage past QUICK.

## The heir can be handed it
- **A grown piece of any tier can be an heirloom** (before, only Old-Blood, Relics and Mythics).
- **Over the new shop's door it can be taken down and carried** (STAFF › the gear slot shows it, TAKE IT DOWN), and it **keeps
  growing in the next generation's hands**. Taken back, or brought home by the Watch, it goes back over the door, never to the
  back room or a shelf: it's never for sale. While it's carried it isn't over the door, so it doesn't draw customers then.

## The share link
A grown card's link carries its stage, how far it's been carried and by whom. A link with anything else in it reads without it.
Links now take up to eight affixes (a grown Old-Blood piece can carry seven).

## The sim
**With the luck off (`LUCK=0`) the game is still release 74's to the byte** (the Reach, 120 days): no dice thrown for growth.

**With it on**, against release 76 on the same seeds (the Reach 120 days, the coast 90):

| | earnings | the ninth of the Nine: release 76 → 77 | pieces that came out alive | reached GROWN / NAMED / FULL-GROWN | rose a tier |
|---|---|---|---|---|---|
| the Reach, seed 1 | −4.0 % | day 81 → 84 | 55 | 4 / 4 / 4 | 4 |
| the Reach, seed 3 | −1.4 % | day 84 → 77 | 56 | 4 / 4 / 4 | 4 |
| the Reach, seed 4 | +0.8 % | day 74 → 98 | 60 | 5 / 5 / 5 | 5 |
| the coast, seed 3 | −2.9 % | day 66 → 82 | 33 | 2 / 2 / 2 | 2 |
| the coast, seed 4 | +1.8 % | day 72 → 72 | 40 | 4 / 3 / 3 | 3 |
| the coast, seed 5 | +3.8 % | day 80 → 69 | 49 | 5 / 5 / 5 | 5 |
| the coast, seed 6 | +0.4 % | day 76 → 8 of 9 by day 90 | 44 | 5 / 3 / 3 | 3 |

- **Pieces come out alive about as planned:** 33–60 a run, from the bot's thousands of workings.
- **Few of them grow:** the bot shelves most of what it makes and its runner has one piece to a slot, so only 2–5 a run are
  carried far enough to grow, and those go all the way. The bot's miners carry nothing. A player who keeps them back and kits the
  staff with them will grow far more.
- **Earnings move −4 % to +4 %** and the Nine's pace both ways (11 days sooner to 24 later, and one coastal seed short by day 90):
  the same spread as milestones 49 and 50. One more die thrown for every piece of gear shuffles every later roll, and with 2–5
  grown pieces a run there's too little growth to move the pace. Rule 4 holds: growth stops at Old-Blood, and never stands in for a
  blueprint or a shard.

## Tests
`tests/m51.test.mjs` (5 tests): the odds and the luck switch, the four stages, a rework, the staff carrying it (and the
heirloom's way down and back), and the link.
