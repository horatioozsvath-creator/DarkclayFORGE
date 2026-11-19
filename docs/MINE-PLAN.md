# Under the shop: a plan for a mine (milestones 45–48)

Status: planned and decided (2026-11-19): every choice at the end was taken as recommended (option 1 in each). Milestone 45 (the trapdoor) built in release 70 (docs/MILESTONE-45.md); milestone 46 (going down) in release 71 (docs/MILESTONE-46.md); milestone 47 (miners) in release 72 (docs/MILESTONE-47.md).

## What it's for

Every material in the game is bought: from the suppliers, from Nell Quarry's pack, from the Crown's Factor, or brought back by a
runner. The maker never gets one by their own hand. This plan puts a mine under the shop: a trapdoor in the floor, a shaft and
galleries that go deeper as the shop grows. It gives the maker:

- a way to get materials by their own skill, worked like the craft;
- a place that goes down, step by step, toward the deep that the runners already visit;
- something the line hands on, deeper each generation.

## Rules for the mine

1. **It's worked like the craft.** Digging is a working on the same strip as the stations: a band, GOOD and GREAT, a CRACK for
   overreaching. Anyone who can forge can dig.
2. **It feeds the stations; it doesn't replace the suppliers.** Ore comes up raw and has to be smelted. Digging common ore is slower
   than buying it. The mine pays off on the dear things (silver, darkclay, the rare seams), and it pays slowly.
3. **Nothing old changes.** A save that never opens the trapdoor plays exactly as before: a Reach sim that doesn't dig gives
   byte-identical output, as the region frame did.
4. **Each region has its own mine,** with its own seams, dangers and bottom.
5. **The line keeps it.** The galleries stay when the forge is handed on.

## The mine

### The trapdoor
From a renown rung (choice E), the shop's floor has a trapdoor. Under it, the first gallery is already open: an old working the last
tenant boarded over. The mine is a new screen, reached from the shop like the town and the workshop.

### Working the face
A new working, **THE FACE**, built like the stations (`MINE` beside `FORGE` and the rest in `data.js`):

| | the forge | the face |
|---|---|---|
| tool | HAMMER | PICK |
| meter | HEAT | SWING (draw the pick back; the band is where it bites) |
| too little | struck cold: a CRACK slips in | a glancing blow: nothing comes away |
| too much | scales past white | a rockfall: the stroke is lost, and the gallery's shoring wears |
| GREAT | a better piece | a rich lump: more ore, and now and then a rough gem |
| TRUE | the clean blow | a clean break into a pocket (a gem, an old coin, a found tile) |

- **Seams are like metals.** Each has its own strip, as iron, bronze and darkclay do: ironstone is forgiving, a silver vein is
  quick, a darkclay seam is narrow (more GREATs and more rockfalls).
- **A trade of its own.** Mining has levels, like each station's. The level opens harder seams and widens the band, as the forge's
  trade does.
- **A session at the face** is a set number of strokes, then the face needs clearing (an hour of the shop's clock), so digging
  can't be ground endlessly.

### Smelting (choice B)
Ore comes up as ore: ironstone, copper ore, silver ore, darkclay ore. At the forge, **SMELT** is a short working (heat only, no
striking): hold it in the band and the ore becomes bars. A GREAT gives an extra bar. This gives the forge a second job and makes the
mine part of the crafting chain, not a way around it.

### The galleries
The mine goes down a gallery at a time. Opening the next one costs coin, timber for shoring and hours of digging (by the maker or
the miners).

| Gallery | Opens | Seams and finds |
|---|---|---|
| 1. The old working | with the trapdoor | ironstone, copper, clear and black sand for the glass |
| 2. The second level | trade 3 | tin (for bronze), silver, rough gems |
| 3. The darkclay seam | trade 5, SOUGHT | darkclay ore, the odd old piece (like a seller's) |
| 4. The old workings | trade 6, FAMED | blackwater iron, starmetal, a blueprint now and then |
| 5. The bottom | trade 7, RENOWNED | it breaks through into the deep (choice D) |

### The dangers
- **Shoring wears,** as tools do (`WEAR`). Each rockfall wears it more. A worn gallery can collapse and stays shut until it's shored
  again.
- **Water** rises in the deep galleries after rain (on the coast, at the spring tides). A flooded gallery can't be worked until it's
  pumped (a fee, or a few hours).
- **The old workings are not empty.** The beasts already on the roads (`MONSTERS`) can come up from gallery 4 and below. A guard,
  or gear on a miner, keeps them off.

### Miners (choice C)
A new staff role, **MINER**, hired like the others. A miner digs the gallery you set them to, while you serve at the counter and
while you're away (up to the cap, as the apprentice works). They dig slower than your own hand and get fewer GREATs. They have
levels and traits like the other staff, and they can be hurt like a runner.

## The bottom, and the deep (choice D)
The lore fits already: the deep doors were always the bottom of something. In the Reach, **the mine breaks through into the deep
below the doors.** Once it does:
- runners can go down through your mine: a shorter, safer trip than the road to the deep doors;
- the face at the bottom gives a relic material now and then (rare: about one in a few weeks of digging, so the Crown's Factor
  stays the main source and the late game's coin sink holds);
- the Nine's shards stay where they are. The mine doesn't change the trail.

## The line
At the handing on, the heir keeps the galleries that were opened (choice F), with the shoring gone old: the first job is to shore
them again. Each generation starts deeper than the last. The line's record keeps how deep each generation got.

## The two mines
- **The Reach:** Veric's old darkclay workings. The town has forgotten them; the shop was built over the shaft. Darkclay is the
  Reach's seam.
- **The Greyshore:** Wheal Isel, a flooded tin and copper mine under Saltby (brass is the coast's metal). It floods at the spring
  tides, and its bottom opens into the drowned town from below, as the Reach's opens into the deep.

## The sim, and the numbers to hold
`tools/sim.mjs` gets a mining bot, as it got one for the coast. Before each release:
- a shop that never digs: byte-identical to before;
- a shop that digs: earns about the same over 120 days (within a few per cent). The mine saves on materials but takes the maker's
  time from the stations;
- the Nine's pace moves no more than a few days. The mine must not become a shortcut to the relic materials;
- the Crown's Factor is still where most relic materials come from.

## The art (choice H)
The mine needs a screen: the gallery, the face, a lamp, the shoring. The trapdoor needs to show in the shop.

## The milestones
- **45: the trapdoor.** The mine screen, THE FACE working and its trade, the first two galleries, smelting, and the sim's mining
  bot. Both regions' first galleries, if choice G says so.
- **46: going down.** Galleries 3 and 4, shoring and collapse, water, the rare seams, pockets and old pieces.
- **47: miners.** The staff role, digging while you're away, hurts and gear.
- **48: the bottom and the line.** Breaking into the deep (and the drowned town), the runners' way down, relic materials at the
  face, the heir keeping the galleries, the line's record.

## The choices (decided: option 1 in each)

**A. How the face is worked**
1. **The strip, a working like the stations; the galleries are a list of seams.** *(recommended: it reuses the engine, so it's the
   smallest build and feels like the same game)*
2. A dig map: a grid of rock under the shop; you pick which tile to dig and see what's behind it. No strip.
3. Both: a map of each gallery, and each tile you dig is a short strip. The richest, and the biggest build.

**B. What comes up**
1. **Raw ore, smelted at the forge as a short working.** *(recommended)*
2. Bars straight from the face, no smelting.
3. Raw ore, smelted by hand or at Dougal's Yard for a fee.

**C. Who digs**
1. **You at the face, and hired miners while you're away, slower than you.** *(recommended)*
2. Only you. The mine is worked only while you play.
3. Only you, but the mine yields a little ore each day on its own.

**D. The bottom**
1. **It breaks into the deep: runners can go down through your mine, and the face gives a relic material now and then.**
   *(recommended)*
2. The mine never reaches the deep; it stays a source of ordinary and rare ores.
3. The mine becomes the main way to the deep, in place of the runners' road.

**E. When the trapdoor opens**
1. **At KNOWN (50 renown), once the shop has found its feet.** *(recommended)*
2. From the first day.
3. At FAMED (400 renown), as a mid-game feature.

**F. What the heir keeps**
1. **The galleries, with the shoring gone old (it needs shoring again).** *(recommended)*
2. Everything as it was left.
3. Nothing: each generation digs from the old working down.

**G. The regions**
1. **Both, each with its own mine, from milestone 45.** *(recommended)*
2. The Reach first; Wheal Isel in a later milestone.

**H. The art**
1. **A drawn mine screen in the game's own style (the card and tile look, CSS and SVG), no new renders.** *(recommended: no
   question of Zero's models)*
2. Rendered galleries and a trapdoor from Zero's private models, like the counter backdrops (it needs your say-so to publish).
