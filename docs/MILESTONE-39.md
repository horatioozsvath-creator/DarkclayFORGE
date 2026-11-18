# Milestone 39: Saltby, the town on the Greyshore (release 64)

Asked for: the first part of the new region (docs/REGION-PLAN.md). This milestone builds the region frame and the coast's town. It is
**hidden**: nothing in the game sends a save over the pass yet. That comes with the crossing, in milestone 42.

## The region frame
- Each save works in one region: `save.region`. A save without one is in the Reach, so old saves need nothing.
- Every table that belongs to the Reach is now read through `js/region.js`:
  - suppliers, prices and the rescue line;
  - customers and sellers;
  - the runner's roads and what they bring back;
  - gangs and monsters;
  - the notice board, town events and seasons;
  - the news, gossip and the guild fair's rivals;
  - the top rung's word.
- The Reach's tables are data.js's own, unchanged. The coast's (`REGIONS.greyshore`) names only what differs.
- **Nothing in the Reach changes.** Five sim runs (seeds 1–3 for 60 days, seed 4 for 120, and seed 5 for 40 with only the first
  patterns) give byte-identical output before and after.
- One small change a Reach player can see: "where it comes from" now counts the Crown's Factor when it says when a material is next on
  sale, for a shop that buys from the Factor (RENOWNED). Before, it left the Factor out.
- A pick of a material that isn't offered here (another region's, not held) goes back to the first option when the part is shown.
- The second shop is at Osk's Landing, in the Reach, wherever the maker works. Its view of the save has no region, so its board and
  customers are the Reach's.

## Saltby
- **What can be bought.** Saltby's suppliers carry everything the Reach sells, and the coast's own things:
  - **Merrin's Chandlery:** bars, brass and forged parts;
  - **the Ropewalk:** cord, sailcloth, linen and tar;
  - **the Fish Quay:** sealskin, shark hide, whalebone and gut;
  - **the Saltpans:** sea-glass sand, kelp ash and salt;
  - **Ama Penhale's Garden:** herbs;
  - **Kell's Boatyard:** yew, birch and oak;
  - **the Pass Carrier:** what the coast doesn't have, carted over the pass (old yew, black sand, darkclay steel, winter fox);
  - **Jory Cask's boat**, a smuggler in the pedlar's place: ambergris, pearl, coral, drowned silver and the Reach's rare things;
  - **the Crown's Factor**, as in the Reach.

  What comes over the pass is dearer: darkclay steel ×1.15; old yew, black sand and winter fox ×1.5. The suppliers screen draws
  the coast's tab bar from its suppliers.
- **New materials:** brass and sealskin (station materials, at the forge and the stretcher), whalebone, sailcloth, kelp ash, tar and
  salt, and four rare ones (ambergris, pearl, red coral, drowned silver).
  - Each comes **last** in the parts it fits, so no old save's picks move.
  - Tar and salt fit no part yet; they're for milestone 40's oilskin and pitch-proofing.
  - Brass and sealskin aren't in the "try" lists, so the coast finds no new patterns yet.
  - A screen in the Reach doesn't offer the coast's materials, unless the maker has some.
  - "Where it comes from" says "Sold in the Greyshore, over the pass".
- **Who comes in.** These are the same kinds of buyer, with the same purses, in the coast's names and leanings:
  - fishers and sealers in the hunters' place;
  - wreck-divers in the delvers' place;
  - the harbour watch and Crown marines in the guards' place;
  - sailors, packet passengers and fishwives.

  They ask for fewer longbows and axes, and more spears, cloaks, lanterns and oils. Sellers are a smuggler, divers, beachcombers and
  a drowned man's widow.
- **The runner's roads** are the same roads in the coast's words, with the same hours, fees and dangers:
  - down to the harbour;
  - the fishing villages;
  - out to the islands;
  - the drowned town at low tide;
  - below the drowned town.

  Runners bring back the coast's commons and rare things. A Reach runner never finds a coastal thing.
- **Threats** are the same systems in coastal dress:
  - the gangs are the Wreckers of Gull Point, the False Lights and others;
  - the monsters are sea-wolves on the dunes, the drowned on the causeway, and something out of the drowned town. The Watch asks for
    the same pieces, silver still matters, and the hunts bring back the coast's trophies.
- **The town.** Saltby has its own notice board (the press-gang, the fleet fitting out, the lighthouse's glass) and its own events
  (the regatta, the herring run, a three-day gale). No star falls on the coast. It also has its own seasons, gossip and news, and
  the guild fair's rivals.
- **The top rung** is OF THE SHORE.

## The pace (sim: `REGION=greyshore`)
The bot played the coast and the Reach on six seeds:

| | day 30 | day 60 |
|---|---|---|
| the coast's earnings, against the Reach's | 89–100 %, about 94 % | 92–106 %, about 99 % |

The first draft earned 30–40 % less. Three fixes closed the gap:
- **The bench's staves were all dearer, over the pass.** Saltby now has a boatyard.
- **Divers and travellers asked almost only for glass and kettle pieces.** They now want as widely as the Reach's delvers and
  travellers.
- **The seasons held few forge pieces.** Spring and autumn now each have one.

The rest of the gap at day 30 is the darkclay mark-up. By day 60 there is none, even though the coast has no trail of its own yet.

## What didn't change
- The Reach in any way: its tables, its sims and its screens.
- The Nine and the trail. A coastal shop in this milestone still has the Reach's trail, but no star falls there. The Nine of the Tide
  and the coast's shard sources come in milestones 41–42.
- The regulars, their stories and the blueprints (milestone 40). Nor, yet, the board's hints for the hidden patterns ("the delvers'
  hall wants war hammers… for the deep doors"), which still speak of the Reach on the coast: they go with milestone 40's patterns.
- The handing on. An heir still stays in the Reach until the crossing (milestone 42).
