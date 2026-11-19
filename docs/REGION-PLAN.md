# Over the pass: a plan for a new region (milestones 39–42)

Status: planned and decided (2026-11-18). Milestone 39 (Saltby, hidden) built in release 64 (docs/MILESTONE-39.md: the coast earns about what the Reach does in the sim). Milestone 40 (the folk and finds, hidden) in release 65 (docs/MILESTONE-40.md). Milestone 41 (the coast's Relics, hidden) in release 66 (docs/MILESTONE-41.md). Builds on release 63 (the legacy).

## What it's for

The legacy turned the ending into a loop, but every generation climbs the same Reach. It has the same suppliers, the same roads,
the same kinds of customer and the same Nine. Only the shard sources and the regulars' names change. By the third heir the climb is
familiar. This plan adds a second region, **the Greyshore**: a coast over the pass, with its own town, wants, roads, dangers and
legend. At each handing on, the heir chooses where to set up the forge: the Reach, as now, or over the pass.

The working names are placeholders: the Greyshore (the region), **Saltby** (the town) and **the Nine of the Tide** (its legend). They were kept as decided.

## Rules for the new region

1. **The craft doesn't change.** It has the same stations, workings, trades, tiers and rungs. A region changes what people want,
   what can be bought and what's out there. It never changes how a piece is made.
2. **A different place, not a harder level.** The coast is no tougher than the Reach. It is different: other customers want other
   pieces, other materials are cheap and other things are dear.
3. **Everything learned travels.** The book, the blueprints and the trades go with the heir in either direction. A pattern found on
   the coast can be made in the Reach, and the other way round.
4. **Nothing is lost.** The Reach stays open. The next heir can go back, and the line's record shows where each generation worked.
5. **Told as a story.** The crossing is a scene, Saltby has its own opening, and its people have never heard of your master.

## The Greyshore

The lore hook is already in the game: the Mantle of the Reach's second power is "the Reach opens its passes". Over the pass is a
grey coast. Saltby is a harbour town of fishers, sailors and salvagers. Out past the bar lies a drowned town that the sea took a
hundred years ago, and the tide still gives things back.

### Milestone 39: Saltby, the town

This milestone builds the region frame and the town. Players can't see it yet.

- **The region frame.** Each save gets `region` ('reach' by default). Every Reach-specific table is read through one place
  (`regionOf(save)`): suppliers, customers, sellers, the branch, roads, monsters, thieves' words, seasons, town events, hot and cold
  lines, and the renown words. The Reach's data moves under `REGIONS.reach` unchanged. A Reach sim run with the same seed must give
  exactly the same result as before.
- **What can be bought.** These are Saltby's own suppliers. Most of the Reach's materials still come, but some come over the pass
  and are dearer.
  - **The Ropewalk:** cord, linen, sailcloth, tar and gut.
  - **The Fish Quay:** shark hide (cheap here), sealskin, whalebone and fish glue.
  - **The Saltpans:** salt, kelp ash (a glass flux, cheaper than potash) and sea-glass sand (cheap here).
  - **The Chandler:** brass bars, iron, bottles, lantern frames and oil.
  - **Kell's Boatyard:** yew, birch and oak (the bench's staves).
  - **A smuggler's boat**, the coast's pedlar: its rare lines are ambergris, pearl, drowned silver, coral and the Reach's rare things.
  - **The Pass Carrier** brings what the coast doesn't have over the pass: old yew, black sand and winter fox at half as dear again,
    and darkclay steel at ×1.15 (as built in milestone 39: more than that made the coast's forge earn less than the Reach's).
- **New materials.** Roughly sealskin, whalebone, sailcloth, tar, brass, kelp ash and salt (common), plus ambergris, pearl, coral and
  drowned silver (rare). Each fits a slot in existing patterns. For example, whalebone takes a haft or grip slot and brass a frame
  slot, so the Reach's patterns all have a coastal way to be made.
- **Who comes in.** The same purse ladder, with other people and other wants:
  - sailors (boots, cloaks, knives, salves);
  - fishers (spears, gloves, oils);
  - the harbour watch (the guards' place);
  - wreck-divers (the delvers' place: lanterns, helms, brews);
  - shipping factors (the factors' place: glass, lenses, rings);
  - the rich, as in the Reach.

  Fewer axes, war hammers and longbows are wanted. More cloaks, lanterns, oils and spears.
- **The runner's roads:**
  - the harbour (short);
  - the fishing villages;
  - out to the islands (rare things);
  - the drowned town at low tide (long, with old pieces and tiles);
  - below the drowned town, from RENOWNED (relic materials; it stands in for below the deep doors).
- **Dangers.** These are the same systems in coastal dress:
  - wreckers and smugglers in place of the marsh-road gangs;
  - the drowned (a wight-like kind; silver still matters);
  - a sea-wolf pack on the dunes;
  - something from the drowned town.

  Storms come more often and keep customers in.
- **The second shop** for a coastal maker is in the Reach, at Osk's Landing, so the line has a shop at home.

### Milestone 40: the coast's folk and finds

This milestone is still hidden from players.

- **Six regular families**, with first names for later generations as in milestone 38. They have their own stories, which ask for
  pieces in coastal words. Their stories and the drowned town give the blueprints for the coast's Relics.
- **Five new patterns**, one per station, found only on the coast and makeable anywhere once found:
  - **a harpoon** at the forge (barbed head, shaft and line);
  - **an oilskin** at the stretcher (sailcloth or sealskin, proofed with tar);
  - **a trident** at the bench (a long shaft with forged tines, as the bench takes forged parts);
  - **a pitch-proofing** at the kettle (a tar brew that weatherproofs gear);
  - **a spyglass** at the glass (two lenses in a brass tube).

  Each can be found by trying, the same way as the hidden patterns, and each needs its own icon and 3D piece. Customers' wants and
  the runner's gear slots take them in.
- **The shop's look:** whitewashed walls, a net and a ship's lantern by the door, and grey sea through the window. These follow the
  diorama's existing layouts and only change the look.
- **Town life:** the coast's seasons (the herring run, the winter storms), its events and its news.

### Milestone 41: the coast's Relics

This milestone is still hidden from players.

- **Nine new Relics**, one for each of the Tide's Nine, spread across the stations and the new patterns as well as the old. Each
  has a power, a lore line and a relic material (the six existing ones, from below the drowned town and the Crown's factor).
- **Their blueprints** come as the Reach's do: some from the six families' stories, the rest from below the drowned town.

### Milestone 42: the Nine of the Tide, and the crossing

- **The legend.** Isel, the Tide-Queen, held Saltby before the sea came. Nine pieces were sworn to her, and they went down with the
  old town. Each is one of milestone 41's Relics reforged with its shard and three parts from other stations, as the Reach's Nine
  are. The shards come from three places, three each, as in the Reach, shuffled each generation:
  - below the drowned town (as below the deep doors);
  - orders from the Harbour Guild (as the Court's);
  - **washed up**, the tide's gift after a great storm (as a fallen star).
- **The ending:** all Nine of the Tide made means MAKER OF THE TIDE, the coast's version of the Nine's ending. It brings the same Hall charm and
  the same option to hand on.
- **The crossing.** At the handing on, the dialog asks where the heir will work: THE REACH or OVER THE PASS. The choice is offered
  from the first handing on, and again at every handing on after, so a line can go back. Only heirs reach the coast: a new game
  always starts in the Reach. The heir keeps everything the legacy carries (the book, the blueprints, a head start, the trait and the
  heirlooms). The heirlooms hang over the door in either region.
- **Saltby's opening.** The heir arrives over the pass with the purse, and nobody in town knows the line. The town's welcome
  (renown from the third generation) counts only generations that worked on the coast.
- **The line's record** shows the region for each generation. The visit link and the flyer carry the region too ("SECOND OF THE
  LINE · OF THE GREYSHORE"), and old links still read as the Reach.
- **Pace target:** a second-generation heir on the coast makes all Nine of the Tide in about two and a half months. That is a
  little longer than a second generation in the Reach (about 68 days in the sim), because none of the coast's blueprints or five
  patterns are known yet. The next coastal heir keeps them and climbs faster. The sim gets a `REGION=` option and runs both regions.

## How it fits the save

- `region` is a new field. A missing value reads as 'reach', so old saves need nothing.
- Each generation's line record adds `region`. `shardWhere` is drawn from the region's own sources.
- `found`, `blueprints` and `trades` are shared across regions, since the book is one book. The Reach's Nine and the Nine of the Tide
  are counted separately: Reach heirlooms over a coastal maker's door don't count toward the Tide's.
- Nothing about the Reach's numbers changes. Milestone 39 is checked by running the old sim seeds and getting the same results.

## Order and size

| Milestone | What | Seen by players |
|---|---|---|
| **39** | the region frame; Saltby's suppliers, materials, customers, roads, dangers and branch | no (tests and the sim only) |
| **40** | six families and their stories; five new patterns with art; the shop's look; coastal seasons and events | no |
| **41** | nine coastal Relics, their blueprints and lore | no |
| **42** | the Nine of the Tide, the shards, the ending; the crossing at the handing on; the record, link and flyer | **yes: the pass opens** |

This is the biggest plan yet, about twice the legacy. Most of the work is writing and data (people, stories, eighteen new legendary
pieces and their lore), and the art for five patterns is the slowest part. Each milestone ends in a release as before: rules and tests first, then the screens, a sim run and a phone check.
39 to 41 ship hidden, so the live game never shows a half-built coast.

## Decided (2026-11-18)

1. **Where:** a coast over the pass (the Greyshore).
2. **Who goes:** only an heir, at the handing on. A new game always starts in the Reach.
3. **The legend:** a full new Nine, the Nine of the Tide (nine new Relics and nine Mythics), so the plan grows to four milestones.
4. **New patterns:** five, one per station: a harpoon, an oilskin, a trident, a pitch-proofing and a spyglass.
5. **Going back:** yes. Every handing on chooses again.
6. **Names:** the Greyshore, Saltby, Isel the Tide-Queen and the Nine of the Tide.
