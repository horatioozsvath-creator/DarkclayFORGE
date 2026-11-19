# Milestone 43: the coast's pace, and Saltby's own counter view (release 68)

Asked for: fix the coast's pace (milestone 42 left a third of the heirs over the pass one short of the Nine of the Tide), and give
Saltby its own painted backdrops in the counter view.

## The coast's pace
**What held it up.** In every short run, the heir had the Breakwater's or the Black Caulk's blueprint, the trade (7 in the trident or
pitch, the bench or kettle mastered) and the relic material. But no Rare or Old-Blood trident or pitch ever turned up to work the
Relic from. The sim's bot stops making a piece once six are unsold. Tridents and pitch sell slowly on the coast, so it stopped too
soon for a Rare to come out of the fire.

**The change** is to the sim's bot, not the game (`tools/sim.mjs`). While it's chasing a Relic, the bot keeps making the piece past
six unsold until it has a Rare or Old-Blood one to work from, as a player chasing a Relic would.

| | all Nine made by | median |
|---|---|---|
| a second generation over the pass, milestone 42 (12 runs) | 8 of 12, day 59–113; 4 one short at day 120 | about 86 days |
| **a second generation over the pass, now (6 runs)** | **all 6, day 74, 77, 83, 87, 87, 88** | **about 85 days** |
| a first generation in the Reach, now (6 runs) | all 6, day 64–102 | about 76 days |

- **No heir is left one short now.** The pace is about two weeks past the plan's two and a half months, the time the coast's five
  patterns take to find (the sim finds one every three days).
- **The Reach's numbers move a little again**, because of the bot. A first generation's Nine come about 8 days sooner than in
  milestone 42's runs (about 76 against 84 in the middle), and it earns about the same (1.87–2.00 million in 120 days).
- **The game is unchanged.** On the coast a player still has to make tridents and pitch that sell slowly, to get the Rare a Relic is
  worked from.

## Saltby's counter view
- **New pictures.** The counter view's painted backdrops now have a coastal set, rendered in Blender from the same shop models as the
  Reach's (`tools/backdrops.py`, with `SEA=1`). It has:
  - whitewashed boards, the floor scrubbed pale and grey beams (the 3D shop's sea palette, so the two views match);
  - through the door, the quay's edge, a grey sea and a pale sky;
  - a cooler daylight and a darker exposure, since the pale walls throw the light back;
  - the forge still glowing in the workshop behind.
- **The full set.** All three shop sizes, four views and two shapes, with every shelf place, the boards and mended wall, the cold
  forge, and the gifts. The coast's gifts already borrow the Reach gifts' models, so they use the same overlays. The pictures are in
  `assets/backdrops/sea/` (1.9 MB).
- **Who sees them.** A coastal save's counter view draws them (`js/counter.js` `dirOf`). A Reach save, and the second shop at Osk's
  Landing (always in the Reach), draw the Reach's as before.
- **In the browser:** the counter view of a Saltby shop drew the coastal room, its shelves and the figurehead gift by the door.
- **On the art:** these are new renders of Zero's private models, and they're published with this release, as you asked.

## Tests
`tests/m43.test.mjs`:
- the coastal set has every view, shape, shelf place and overlay the Reach's has, and every picture is on disk;
- a coastal save picks `sea/`; a Reach save and a save with no region pick the Reach's.
