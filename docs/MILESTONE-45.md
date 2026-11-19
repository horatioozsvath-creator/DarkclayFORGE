# Milestone 45: the trapdoor (release 70)

Asked for: the first milestone of the mine (docs/MINE-PLAN.md, every choice as recommended). From KNOWN, a trapdoor in the shop's
floor opens on a mine: dug at the face like a working at the forge, its ore smelted to bars at the forge.

## The trapdoor
- **From KNOWN** (50 renown), the top bar shows **THE MINE**, with a dot until it's opened, and the first time a word says a loose
  board behind the counter hides a trapdoor. Opening it is free; the first gallery is already open.
- **Each region has its own:** in the Reach, **Veric's old workings** (the old men say Veric's smiths dug their darkclay there); on the
  coast, an arm of **Wheal Isel**, the old tin mine under Saltby.
- **A shop that never opens it plays exactly as before.** Nothing about the mine runs until the trapdoor is opened (`save.mine`).

## THE FACE: digging is a working
The mine's working uses the same strip, tiles and screens as the stations. It's **fire-setting**, as old miners broke hard rock:

| | the forge | the face |
|---|---|---|
| tool, meter | HAMMER, HEAT | PICK, THE ROCK |
| the fire | INTO THE FIRE | SET THE FIRE: the rock heats toward brittle |
| the band | the gold band | the brittle band (40–80) |
| too low | struck cold: a CRACK slips in | the pick glances off: nothing turns over (no harm) |
| too high | it scales | the face spalls: a rockfall, a CRACK slips in (from trade 3) |
| done | QUENCH | HAUL IT |

- Fill SHAPE (the seam broken out), then every swing after it pushes the odds of a Fine or Rare **haul**, as a piece's. The rock takes
  nothing from the store room.
- **A haul** is 4 of the ore (Common), 6 (Fine) or 8 (Rare). A Rare haul from a silver vein brings a rough gem too. A clean working
  turns up a found tile, as at the forge.
- **MINING is one trade** between the two regions' mines. It opens the harder seams.
- The stage draws the gallery: timbers, a lamp, the rock with its seam running through it, the fire at its foot, the hollow the pick
  opens with the ore lying in it, and the pick.

## The seams

| | the Reach | Wheal Isel (the coast) |
|---|---|---|
| gallery 1 | **Ironstone seam** (ironstone), **Sand bed** (clear sand) | **Wheal tin** (tinstone), **Black sand bed** (black sand) |
| gallery 2, trade 3 | **Tin lode** (tinstone), **Silver vein** (silver ore, gems) | **Calamine lode** (calamine), **Silver vein** (silver ore, gems) |

Each seam sets the strip as a metal does: the sand beds are soft and forgiving, the silver veins narrow (more GREATs, more falls).

**The second gallery** opens from trade 3 in mining, for 300 c and 4 oak staves to shore it.

## Smelting
- **SMELTING** is a new working at the forge, shown with the forge's patterns once the mine is open: 3 ore in, 4 (Common), 5 (Fine) or 6
  (Rare) bars out. It's a trade of its own, and it doesn't count toward the forge's station level for a Relic.
- Ironstone smelts to **iron**, tinstone to **bronze**, silver ore to **silver**, calamine to **brass** (calamine is offered at the forge on
  the coast, or in the Reach to a maker who carried some back).
- **Ore is sold by no one** and no runner brings it. WHERE IT COMES FROM says it's dug at the face; iron, bronze, silver and brass list
  smelting after their sellers, and the rough gem lists the silver vein.

## The mine screen
THE MINE has the face (each seam: what it brings, how many a working, DIG), the ore (each with SMELT AT THE FORGE once there are 3)
and FURTHER DOWN (the next gallery, what it takes and what's still short). From the face, the back arrow and the result go back to the
mine.

**In the browser** (wide, and at 375 px with no sideways scroll), on a KNOWN test save: the trapdoor's word and THE MINE's dot; opening
it; a whole working at the face (fire, swings, SHAPE filled, WORKED pushed, HAUL IT: a Common haul of ironstone, back TO THE MINE); a
spall slipping CRACKs in; a smelt at the forge (the bloom on the anvil, a Fine smelt of iron bars); opening gallery 2; and a coastal
save's Wheal Isel, with calamine offered to smelt.

## Not in this milestone
- The heir doesn't inherit the mine or the mining trade yet; the line's mine is milestone 48. An heir starts at the trapdoor again.
- Shoring wear, collapse and water (milestone 46), miners (47), the bottom and the deep (48).
- **A change from the plan:** its "a session at the face, then the face needs clearing" is left out, and so are the hours of digging to
  open a gallery. In the sim (below), time in the mine earns no more than time at the stations, so there's nothing to limit yet.
  Milestone 46's shoring wear is the mine's cost from then on.

## A fix on the way: five forge patterns froze the working
**Since release 50**, the forge's stage had shapes for only five pieces (the falchion, dagger, axe, helm and ring). Working a
**spear, mace, shortsword or warhammer** (found by trying, milestone 31) or the coast's **harpoon** threw on every frame: the stage
stopped drawing, the heat stopped moving and the working couldn't go on. Found while adding smelting, and checked against release 69's
code: those five threw, every other pattern drew.
- Each now has a shape of its own: a long spear head, a straight short blade, a flanged mace head, a hammer's block, a barbed harpoon.
- A forge pattern with no shape now borrows the dagger's instead of throwing.
- A new test draws every pattern's working, wide and tall, in and out of the fire.

**And one more, found the same way:** a working that makes materials, not a piece (the glass's bottles, and now the mine's), offered
the affix pick after WHITE HEAT or a TRUE, with no affixes to pick from, and the result couldn't go on. Such a working now goes
straight to its result. (Bottles get there only from trade 5 at the glass.)

## The sim
**A shop that never opens the trapdoor is unchanged.** With the mining bot left off, the sim's output is byte-identical to release
69's on five runs (two Reach first generations of 120 days, a coastal one of 90, a Reach heir and a coastal heir).

**The mining bot** (`tools/sim.mjs`, `MINE=share`) opens the trapdoor at KNOWN and spends that share of its workings in the mine:
smelting when it has 3 ore (the dearest first), else digging its best open seam. It opens the second gallery when it can, buying the
oak. While it's chasing a Relic it stays out of the mine, as a player on the trail would.

**The haul was raised once.** At first a haul was 3/4/6 ore and a smelt 3/4/5 bars. With a fifth of its workings in the mine the bot
earned 3–14 % less. Now a haul is 4/6/8 ore and a smelt 4/5/6 bars.

**With the final bot**, against the same seeds without the mine (the Reach 120 days, the coast 90):

| | the mine a tenth of the time | a fifth |
|---|---|---|
| the Reach, seeds 1, 2 | −4.7 %, +5.1 % | −5.6 %, +0.2 % |
| the coast, seeds 3, 6–12 | −3.4, −1.5, −2.2, +1.6, −2.2, −3.8, −2.2, −1.8 % (middle −2.2 %) | −11.2 %, −6.4 % (seeds 3, 6) |

- **Time in the mine earns a little less than time at the stations:** about 2 % less at a tenth of the workings, up to a tenth less
  at a fifth. By the end of the run the silver vein is the only seam worth the bot's time: about 850–1,600 silver bars at a tenth,
  1,700–3,300 at a fifth.
- **The Nine's pace doesn't move.** In the Reach the mining runs make all Nine on days 74–82 (without: 76 and 101). On the coast, eight
  seeds without the mine make all Nine by day 90 in six (days 74–87); with the mine a tenth of the time, also in six (days 72–90).
- **So there's no limit on digging yet** (see "Not in this milestone"): it isn't a better use of a maker's time, and it's no shortcut.

## Tests
`tests/m45.test.mjs` (9 tests, the last the stage's). Three older tests changed: the two materials-sold tests skip ores (sold by no
one), and the heir's trades count leaves out the mine's.
