# Milestone 54: Hearthold, the town of the High Snow (release 81)

Asked for: the first part of the third region (docs/NORTH-PLAN.md, decided 2026-11-20). It is **hidden**: nothing sends a save up
into the snow yet. The climb comes with milestone 57.

## The region frame takes a third region
- `REGIONS.north` beside the Reach and the coast, read through `js/region.js` as before. It names only what differs.
- **Where a thing belongs:** a material or pattern is the coast's (`coast: true`), the High Snow's (`north: true`) or the Reach's
  (`Rg.homeOf`, `Rg.matHome`). Each region's runners and pedlar keep to their own, and to the other regions' rare things only where
  their pedlar sells them. The coast's patterns are found only on the coast (before, anywhere but the Reach).
- **Hidden** (`hidden: true`): the Reach and the coast aren't told where the snow's things are sold or dug.
- **Nothing in the Reach or on the coast changes.** The Reach with the luck on and off (seed 1, 120 days) and the coast (seed 3,
  90 days) give byte-identical output to release 80.

## Hearthold
- **What can be bought.** Everything the Reach sells, and the hold's own:
  - **the Hold Stores:** iron and steel cheap (×0.8, ×0.85), coal, soapstone, bars and forged parts;
  - **Sigrun's Furs:** elk hide, bear fat, antler, deer and goat, horn, bone, wraps, straps, wool, silk, gut, feathers;
  - **the Woodcutters' Hut:** ash, rowan, birch and oak, all **dear** (×1.3), and pine pitch;
  - **the Meltwater Pit:** sands, potash, lime, cobalt;
  - **Old Gudrun's Shelves:** herbs, honey, wax, tallow, spring water, bottles;
  - **the Snow Carrier:** what the hold lacks, up from the Reach at half as dear again (yew, old yew, linen, black sand, sea-glass
    sand, shark hide, heartwood);
  - **the Herders' Caravan**, the pedlar: white bear fur, ice-amber, frost iron and glacier glass, with the Reach's rare things and
    ambergris and pearl from the coast;
  - **the Crown's Factor**, as everywhere.
- **New materials**, each after the coast's in its parts, so no pick moves:

  | Material | Where it goes |
  |---|---|
  | elk hide | a hide at the stretcher |
  | antler | a bow's nocks |
  | bear fat | a brew's binder |
  | soapstone | a glass's flux |
  | pine pitch | an oilskin's proofing, pitch-proofing's base |
  | white bear fur (rare) | a lining |
  | ice-amber (rare) | a ring's stone, a brew's binder |
  | frost iron (rare) | a blade's guard |
  | glacier glass (rare) | a glass's colour |
  | coal | no part: the fire that clears a frozen gallery |

  Up in the snow, the coast's options in a part (sealskin, whalebone and the like, not sold there) are left off the screen, and the
  picks after them keep their places.
- **Who comes in:** the same purse ladder; herders, the hold's guard, travellers on the mule track, miners and thaw-pickers, elk- and
  bear-hunters, pilgrims to the Hearth, and thanes. More lanterns, cloaks, hoods and spears; no longbows or panes.
- **The runner's roads:** up to the high pasture; the herders' camps; up to the glacier; the old halls at the thaw; below the old
  halls (from RENOWNED); down through Aud's Delving. Same hours, fees and dangers; the hold's commons and rare things.
- **Dangers:** raiders from the passes (Hrolf Ice-Beard's band and others); a white bear (its hunt brings back white bear fur);
  **the frozen dead**, whom fire keeps off: the hold's guard asks for lanterns, and a runner carrying a lantern hunts them as well as a
  silver blade hunts the grave-wight (silver does nothing up there); something from the old halls.
- **The town:** its board (raiders in the passes, the cold come early, the elk moving), its events (the herders come down, the
  Thanes' Moot, the Hearth-feast, **deep winter**: snow to the eaves and fewer customers), its seasons (the thaw, the long dark), gossip,
  news and rivals. The top rung is OF THE SNOW.
- **The second shop** is at the Landing in the Reach, as for the coast.

## Aud's Delving, the hold's mine
- The old halls' upper workings, opened from KNOWN as the other mines: iron and **coal** near the top, soapstone and silver below,
  darkclay and cobalt in the frozen level, **frost iron** and a fallen star deeper, and at the bottom it breaks into the lost halls.
- **Ice, not water.** The deep galleries freeze over on a hard night (their own nights, not the Reach's rain). The ice goes of itself
  in 60 hours, or **SET A FIRE** clears it for coal (6, 10, 16 by gallery), never coin. The shoring, falls and miners work as everywhere.

## Until milestones 55–57
The hold has no families, patterns, Relics or Nine of its own yet: the Reach's stand in, as the coast's did in milestone 39. (A region
with no Nine of its own no longer counts its maker as a Maker of the Nine for having none.) Deep winter doesn't make the roads longer
yet; it only keeps customers away.

## The pace (sim: `REGION=north`)
| 60 days | earned |
|---|---|
| Hearthold, seeds 1 and 2 | 932,000 and 913,000 c |
| the Reach, seed 2 | 945,000 c |
| the coast, seed 2 | 886,000 c |

With the mine worked (`MINE=0.5`, 90 days, seed 1), the bot opened all five galleries and cleared 14 frozen ones with 166 coal.
Over 90 days (seed 1) a shop up there makes seven of the Reach's standing-in Nine (the sim's Relic chase now follows the region's
Relics, stand-ins included; for the Reach and the coast nothing changes). The hold's own Nine and shard sources come in milestone
57; its pace is milestone 58's.

## Tests
`tests/m54.test.mjs` (9 tests): hidden, the suppliers and prices, the materials' places, every pattern makeable up there, the customers,
the roads and finds, the dangers and the lantern, the mine's ice and fire, and the Reach's Nine standing in. Four older tests now
read a material's home rather than "not the coast's means the Reach's".

## Checked in the browser
A Hearthold save loads with no errors; its suppliers' tabs, the mine (Iced over… SET A FIRE · 6 coal) and the falchion's parts
(frost iron offered, the coast's drowned silver left off).
