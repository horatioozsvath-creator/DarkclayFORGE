# Struck lucky: a plan for the jackpot in the working (milestones 49–51)

Status: draft (2026-11-19), nothing decided and nothing built. Builds on release 74. If it's taken, the third region
(docs/NORTH-PLAN.md) moves to milestones 52–56.
The choices are at the end; the plan below is written with the first option of each.

## What it's for

Every working ends in a roll: Common, Fine or Rare, at odds the working earned (Rare at most 40 %). Everything above Rare is
**earned, never rolled**: Old-Blood is a master's last rework, a Relic needs a blueprint, a Mythic a shard. That's good for the climb,
but it means the end of a working can never truly surprise you. You know the best it can be before you start.

This plan adds the other feeling: **the piece that comes out of the fire better than it had any right to**. Three kinds of luck,
rare enough to remember, each with its own moment on screen:

1. **Marks:** a piece comes out with something in the metal no one put there (milestone 49).
2. **The blood wakes:** a Rare piece comes out of a great working already Old-Blood (milestone 50).
3. **Grown pieces:** a piece comes out alive, and grows with the one who carries it (milestone 51).

## Rules for luck

1. **Luck rides on the working.** Every chance here is bigger for a cleaner working (WHITE HEAT, no crack, a true heat) and for a
   higher trade. A sloppy working can still be lucky, just less often. It's never a bought roll: nothing here costs coin to try.
2. **A miss takes nothing away.** No luck roll ever lowers a piece, breaks it or spends anything.
3. **It's rare enough to matter.** Each kind should come a few times a generation, not every hour. The sim checks it.
4. **The climb isn't skipped.** Relics and the Nine stay earned as now. Luck can lift a piece to Old-Blood at most, and it
   never stands in for a blueprint or a shard.
5. **You see it happen.** Each kind has its own reveal: a sound, a flash on the card, a line in the book. Once you've had one, the
   book shows its odds.

## Milestone 49: the reveal, and marks

- **The reveal.** Today the tier just appears. Now the card turns over as the working ends: the odds bar sweeps once and lands on
  the tier, and the frame lights in the tier's colour. A Rare lands with a ring and a chime. A few seconds at most, and a tap skips it.
- **Marks.** About **1 working in 60** (more for a clean working, fewer for a cracked one), the piece comes out with a **mark**, a
  mark of the metal that sits on the card beside the tier:

  | Mark | What it looks like | What it does |
  |---|---|---|
  | **Veined** | dark darkclay veins through the metal | worth ×2 |
  | **Starfall** | a scatter of bright points in the metal | worth ×2, one affix rolled at its best |
  | **Ghost-tempered** | pale, almost white | worth ×2, Hallowed added if the pattern can take it |
  | **Ember-hearted** | a low glow that never cools | worth ×3, the rarest |

  Each station has its own words for them (a hide is "veined", a brew "clouded", glass "starred"), and the card draws the mark as a
  foil overlay. A mark goes with the piece through every rework, up to a Relic and a Mythic.
- **Gilded affixes.** An affix rolled at its very best shows **gilded** on the card. Three gilded on one piece: **FLAWLESS**, worth ×2.
  No new odds: the affixes roll as now; this just shows when one came out at the top.
- **The Collector.** A new customer from FAMED: pays half as much again for a marked piece, asks for marks by name, and remembers
  the ones you've sold them. **THE BOOK › MARKS** keeps which marks you've made at each station: a set to fill.

## Milestone 50: the blood wakes

- **A Rare roll can wake.** When a working rolls Rare with **WHITE HEAT and no crack**, at trade 4 or more in that pattern, there's
  a small chance (about **1 in 20** of those) that the blood wakes: the piece comes out **Old-Blood**, no master's rework needed.
  Its card says so: "Woke in the fire".
- **The moment:** the reveal lands on Rare, holds, and the frame turns violet with the foil, and a different sound.
- **It's a gift, not the road.** A woken piece is Old-Blood like any other: a Relic can be worked from it with a blueprint, as now.
  The master's rework stays the sure way to Old-Blood; waking is the lucky way.
- **The sim** checks the Nine's pace doesn't move more than the noise (a few woken pieces a generation is the aim). If it does, the
  odds come down.

## Milestone 51: grown pieces

- **A piece can come out alive.** About **1 working in 150**, at any tier, and twice as often with a mark: the piece is **grown**.
  It has something in it that wasn't put there: a seed of the old blood, the old makers said. The card shows a small living mark and
  the words "It grows".
- **It grows with use, not on the shelf.** Carried by your staff (a runner on the roads, a miner at the face: the two who wear
  gear today), it grows through four stages, by the trips or hauls it's carried through:
  1. **Woken** (as made).
  2. **Grown** (about 10 trips): every affix up to its best.
  3. **Named** (about 25): a new affix, and a name from the one who carried it ("Pell's Ironbite").
  4. **Full-grown** (about 50): it **rises a tier, up to Old-Blood at most**. A grown Old-Blood piece instead takes a fourth affix.
- **Its own line on the card:** who carried it and how far. A grown piece sold goes with its story; one hung on the wall counts its
  charm with its stage.
- **For a piece with no use at the shop** (a brew, a window glass): it doesn't come out grown. Only gear the staff can carry.
- **The heir can be handed it.** A grown piece can be one of the heirlooms, and keeps growing in the next generation's hands.

## How it fits the save

- A piece gets optional fields: `mark`, `gilded`, `woke`, `grown: { stage, uses, by }`. Old pieces have none and read as before.
- The book gets `marks` (what's been made, by station).
- A run with the luck turned off (`LUCK=0` in the sim) must match release 74 to the byte, so the change can be measured.

## Order and size

| Milestone | What | Size |
|---|---|---|
| **49** | the reveal; four marks with their art; gilded affixes; the Collector; the book's marks | medium: the card art is the work |
| **50** | the blood wakes | small |
| **51** | grown pieces, their four stages, the staff's trips counting | medium |

Smaller than the region plans: one milestone is mostly rules, and the art is overlays on the existing card, not new models.

## The choices

1. **What "grown" means:** (1) a piece that grows with use, as above. (2) A piece grown, not forged: planted from a living
   material (heartwood, bone, coral) and tended for days in a new grow-bed, coming up as whatever it becomes. (3) Both.
2. **The blood wakes:** (1) yes, Rare to Old-Blood, about 1 in 20 of the cleanest Rare rolls. (2) No: Old-Blood stays a master's work only.
3. **How rare:** (1) as above (a mark in about 60 workings, a grown piece in about 150). (2) Twice as rare. (3) Twice as common.
4. **What a mark does:** (1) worth and a small gift (as the table). (2) Looks and worth only.
5. **The Collector and the book's marks:** (1) yes. (2) No.
6. **The reveal:** (1) the card turns over and the odds bar sweeps, a tap skips it. (2) No change: the tier appears as now.
7. **Order:** (1) this plan first, then the third region. (2) The region first.
