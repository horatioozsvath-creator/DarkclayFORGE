# Up into the snow: a plan for a third region (milestones 53–57)

Status: draft (2026-11-19), nothing decided and nothing built. Comes after the jackpot plan (docs/JACKPOT-PLAN.md, milestones 49–52), as decided. Builds on release 74 (the mine, with its own galleries in each region).
The choices are at the end; the plan below is written with the first option of each.

## What it's for

The Greyshore gave the line somewhere else to go, but a line that has made both Nines has seen the whole map: two towns, two
legends, two mines. This plan adds a third region, **the High Snow**: a hold above the Reach's snowline, with its own town, wants,
roads, dangers, mine and legend. At each handing on the heir chooses from three places instead of two.

The lore hook is already in the game. The Mantle of the Reach was "worn by the first who crossed the Reach, and the last who came
back", and a Relic cloak is "stitched from a hide that walked the high snow longer than the town has stood". Someone went up into the snow and didn't come
down. This is where they went.

The working names are placeholders: **the High Snow** (the region), **Hearthold** (the town) and **the Nine of the Hearth** (its legend).

## Rules for the new region

The Greyshore's five rules hold as they were (docs/REGION-PLAN.md):

1. **The craft doesn't change.** The same stations, workings, trades, tiers and rungs.
2. **A different place, not a harder level.** The High Snow is no tougher than the Reach or the coast. Other things are cheap,
   other things dear, other people want other pieces.
3. **Everything learned travels.** The book, the blueprints and the trades go with the heir to any region.
4. **Nothing is lost.** The Reach and the coast stay open; the next heir can go anywhere.
5. **Told as a story.** The climb is a scene, Hearthold has its own opening, and nobody there knows the line.

And one more, for the third region:

6. **It has to feel unlike both.** The Reach is a market town on a river; the coast is a harbour. Hearthold is a hold cut into a
   mountain round one great hearth, where iron is cheap and wood is dear, and winter shuts the roads.

## The High Snow

Hearthold is a hold of herders, hunters, miners and the thanes who rule them, built round a hearth in the rock that has never gone
out. Below the hold are the old halls, lost in the Long Winter when the ice came in. The thaw gives things back each spring.

### Milestone 53: Hearthold, the town (hidden)

- **The region frame takes a third region.** `REGIONS.north` beside `reach` and `greyshore`, read through `regionOf(save)` as now.
  A Reach run and a coastal run with the same seed must give exactly the same results as release 74.
- **What can be bought.** Hearthold's own suppliers:
  - **The Hold Stores:** iron and steel bars cheap (it's mining country), coal, soapstone.
  - **The Furrier:** elk hide and bear fat (cheap here), wolf pelt, antler.
  - **The Woodcutters' Hut:** ash, birch and pine, **dear** (few trees above the line): the bench costs more to feed here.
  - **The Herders' caravan**, the region's pedlar: its rare lines are white bear fur, ice-amber, frost iron and glacier glass, with
    the other regions' rare things now and then.
  - **The Snow Carrier** brings up what the hold lacks from the Reach (yew, linen, black sand) at half as dear again, as the Pass
    Carrier does for the coast.
- **New materials.** Roughly elk hide, bear fat, antler, soapstone and pine pitch (common), and white bear fur, ice-amber, frost iron
  and glacier glass (rare). Each fits a slot in existing patterns (antler a grip, elk hide a body, soapstone a mould), so every
  pattern has a way to be made up here.
- **Who comes in.** The same purse ladder, other people:
  - herders (boots, cloaks, knives);
  - hunters (spears, bows, salves);
  - the hold's guard (the guards' place);
  - miners (the delvers' place: picks, lanterns, helms);
  - pilgrims to the Hearth (the factors' place: glass, rings, brews);
  - the thanes (the rich).

  More furs, lanterns, spears and warming brews wanted; fewer longbows and glass for windows.
- **The runner's roads:** the high pasture (short); the herders' camps; up to the glacier (rare things); the old halls at the
  thaw (long, old pieces and tiles); below the old halls, from RENOWNED (relic materials, in place of below the deep doors).
- **Dangers,** the same systems in snow dress: raiders from the passes (the gangs' place); **the frozen dead**, whom fire keeps off
  (a lantern matters as silver does against the drowned); a white bear (the pack's place); something from the old halls.
  **Deep winter** shuts the high road some days: fewer customers, longer roads, as the coast's storms.
- **Hearthold's mine.** The region's own galleries (the mine already keeps galleries per region). The hold's mine is the old halls'
  upper workings: iron and coal seams near the top, frost iron deeper, and at the bottom it breaks through into the lost halls.
  **Ice, not water:** the deep galleries freeze over instead of flooding, and you clear them by setting a fire, not by paying for a
  pump. The shoring, the falls and the miners work as everywhere.
- **The second shop** for a maker up here is in the Reach, as for the coast.

### Milestone 54: the hold's folk and finds (hidden)

- **Six regular families**, with first names for later generations, their own stories in the hold's words, and blueprints for the
  region's Relics.
- **Five new patterns**, one per working station, found only here and makeable anywhere once found:
  - **an ice axe** at the forge (a pick and an adze in one);
  - **a fur hood** at the stretcher (hide, lined with fur);
  - **snowshoes** at the bench (bent ash frames, laced with gut);
  - **a warming draught** at the kettle (keeps the cold out on the road; a runner's potion slot takes it);
  - **snow-goggles** at the glass (smoked glass, to keep the snow-blindness off).

  Each needs its icon and its 3D piece. Customers' wants and the runner's gear take them in.
- **The shop's look:** stone walls, a fur over the door, the hearth's glow, and snow through the window.
- **Town life:** the hold's seasons (the thaw, the long dark, the herders' return), its events and its news.

### Milestone 55: the hold's Relics (hidden)

- **Nine new Relics**, one for each of the Hearth's Nine, across the stations and the five new patterns. Each with a power, a lore
  line and a relic material.
- **Their blueprints** from the six families' stories and from below the old halls.

### Milestone 56: the Nine of the Hearth, and the climb (players see it)

- **The legend.** Aud the Hearthkeeper kept the fire alight through the Long Winter, when the ice took the lower halls. Nine pieces
  were sworn to her hearth, and they went down into the ice with the halls. Each is one of milestone 55's Relics reforged with its
  shard and three parts, as the other Nines are. The shards come from three places, three each, shuffled each generation:
  - below the old halls (as below the deep doors);
  - orders from the Thanes' Moot (as the Court's);
  - **the thaw**: given back by the glacier in spring (as the fallen star and the tide's gift).
- **The ending:** all Nine of the Hearth made: MAKER OF THE HEARTH, with the same Hall charm and the same handing on.
- **The climb.** At the handing on the dialog asks where the heir works: THE REACH, OVER THE PASS or UP INTO THE SNOW. Offered at
  every handing on from the first; a new game always starts in the Reach.
- **Hearthold's opening,** the welcome counting only generations that worked in the snow, the line's record, the visit link and the
  flyer carrying the region ("THIRD OF THE LINE · OF THE HIGH SNOW"). Old links read as before.

### Milestone 57: the hold's pace, the counter view and the phone

- **The sim** gets `REGION=north` and runs all three regions. Pace target: a second-generation heir makes all Nine of the Hearth in
  about two and a half months, as the coast's target was.
- **Hearthold's counter view:** painted backdrops for the hold (see choice 6).
- **The phone check** at 375 px, as milestone 44 did for the coast.

## How it fits the save

- `region` takes a third value, `'north'`. A missing value still reads as `'reach'`; old saves need nothing.
- The mine's galleries are already kept per region, so a line that dug in all three keeps all three.
- The three Nines are counted apart, as the two are now.
- Nothing about the Reach's or the coast's numbers changes. Milestone 53 is checked by running the old seeds in both regions and
  getting the same results.

## Order and size

| Milestone | What | Seen by players |
|---|---|---|
| **53** | the third region in the frame; Hearthold's suppliers, materials, customers, roads, dangers, branch and mine | no |
| **54** | six families and their stories; five new patterns with art; the shop's look; seasons and events | no |
| **55** | nine Relics, their blueprints and lore | no |
| **56** | the Nine of the Hearth, the shards, the ending; the climb at the handing on; record, link and flyer | **yes** |
| **57** | the pace in the sim; the counter view; the phone | yes |

About the size of the Greyshore plan, plus the mine's frozen galleries. Most of it is writing and data (people, stories, eighteen
legendary pieces). The art for five patterns and the counter view's backdrops is the slowest part. 53 to 55 ship hidden, so the
live game never shows a half-built hold.

## The choices

1. **Where:** (1) the High Snow, a hold above the snowline. (2) The Crown's city, where the Factor and the Court come from: guilds,
   nobles and rivals, the most unlike a village of the three. (3) Down the river to Osk's mouth: river country, marsh and the old
   abbey's lands.
2. **Who goes:** (1) any heir at any handing on, as the coast. (2) Only a line that has made one of the Nines. (3) A new game can also
   start there.
3. **The legend:** (1) a full new Nine (nine Relics, nine Mythics: five milestones). (2) Relics only, no third Nine (three milestones).
4. **New patterns:** (1) five, one per station: an ice axe, a fur hood, snowshoes, a warming draught and snow-goggles. (2) Three.
   (3) None: the region only uses the old patterns.
5. **The mine:** (1) the hold has its own mine, with ice instead of water. (2) No mine up here.
6. **The art:** (1) render Hearthold's counter view from Zero's private models and publish it with the release, as was done for
   Saltby (this needs your yes). (2) Reuse the Reach's backdrops, recoloured cold.
7. **Names:** keep the High Snow, Hearthold, Aud the Hearthkeeper and the Nine of the Hearth, or give your own.
