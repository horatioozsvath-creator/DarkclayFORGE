# Milestone 40: the Greyshore's folk and finds (release 65)

Asked for: the second part of the new region (docs/REGION-PLAN.md). Like milestone 39, it is **hidden** until the crossing in
milestone 42.

## Five new patterns, one per station
Each is found only on the coast, and can be made anywhere once found.

| Pattern | Station | Found with |
|---|---|---|
| **Harpoon** (a thrown weapon on a line) | forge | a metal head, a **whalebone** shaft, a cord or gut line |
| **Oilskin** (body armour) | stretcher | deer or goat hide, **pine tar**, waxed cord |
| **Trident** (two hands; needs the forge's parts) | bench | a yew or oak shaft, **forged tines** (arrowheads), a cord or gut binding |
| **Pitch-proofing** (a batch of three) | kettle | emberroot, spring water, **pine tar** |
| **Spyglass** | glass | clear or sea-glass sand, **kelp ash**, a **brass** tube |

- **Found only on the coast.** Each pattern is marked `coast: true`. Its tries, the customers' asks, the regulars' clues and the
  board's posts come only on the coast (`Rg.findsHere`). In the Reach, the book doesn't count or list them until they're found.
- **No Reach try can come near one.** Each is found with something only the coast sells, except the trident. The trident's
  combination (forged tines at the bench) isn't one any Reach pattern uses.
- **Made anywhere.** Every pattern's first options are sold in the Reach (beeswax before pine tar, bronze before brass), so a
  maker who goes back over the pass can make them there.
- **Art and gear.** Each has its own card picture (SVG, `js/card.js`). The harpoon and trident are runner weapons, and the oilskin
  is body armour.
- **Who wants them.** The coast's customers ask for them: fishers want harpoons and tridents, sailors and divers want oilskins, and
  factors want spyglasses. The board's squall, fleet and whale days ask for them too.
- **What they're worth** sits inside the "never a money machine" band:
  - harpoon 58;
  - oilskin 40;
  - trident 64;
  - pitch 20 a bottle;
  - spyglass 54.

## Saltby's six families
These families have never heard of the line (`REGIONS.greyshore.regulars`):
- Sergeant Hessa Crane of the harbour watch;
- Dame Isolde Penrose, a shipowner;
- Gil Hobb, a skipper;
- Nan Tregear, a fisherman's widow;
- Ama Penhale, the herbwife;
- Kit Rook, a ship's boy.

They place their own orders and give clues to patterns still to find, the coast's among them. At the counter they borrow the Reach
families' looks (Crane as Vance, Tregear as Ketty, and so on). Kit Rook, like Tib, has none.

## Their stories
There are ten stories in the coast's words (`REGIONS.greyshore.stories`).
- **Five first stories, each ending in a gift.** Each gift uses one of the Reach gifts' 3D models and paintings:
  - Nan Tregear's lights (Ketty's candles);
  - the harbour watch's pennant (the watch's banner);
  - Gil Hobb's herring (Bram's barrels);
  - the Penrose figurehead (the Corrow king);
  - Ama Penhale's kelp (Marrow's herbs).

  The counter view draws each one with the Reach gift's picture (`look`).
- **Five great stories.** Each ends in a blueprint for one of the coast's Relics: `tidewarden`, `drownedring`, `hobbsbarb`,
  `tidecup` and `penhalebalm`. The Relics come in milestone 41. Until then a great story doesn't come in and isn't listed.

## A coastal generation on
- The coast counts only the generations that worked there (`Rg.localGen`). The first maker to cross meets the founders.
- The next one on the coast meets their grandchildren (Tegen Crane, Davey Hobb and so on). They ask what their grandparents asked,
  and each family remembers the old maker once.
- The Reach counts every generation, as milestone 38 did.

## The board and the shop
- **The board's posts** for the Reach's sixteen hidden patterns have coastal words on the coast. For example, the harbour watch wants
  boarding spears and the fleet wants ship's lanterns. This fixes milestone 39's note about the delvers' hall and the deep doors.
- **The shop's look.** The 3D shop front on the coast has scrubbed boards and whitewashed walls, grey sea through the street door,
  and a ship's lantern hung by it (`js/diorama.js`).
- **The counter view's painted backdrops** are still the Reach's. They're rendered in Blender from Zero's models, and new ones would
  be art derived from Zero's private repo, so they wait for your say-so.

## The sim (`REGION=greyshore`, every hidden pattern found from day one)
- **The coast's patterns get made.** In a 60-day run they made 10 harpoons, 8 spyglasses, 4 oilskins, 2 tridents and 2 batches of
  pitch. All five first stories were told. The great stories waited, as they should.
- **Earnings against the Reach, over six seeds:**

  | | day 30 | day 60 |
  |---|---|---|
  | the coast's earnings, against the Reach's | 89–97 %, about 92 % | 90–105 %, about 96 % |

  That's a couple of points under milestone 39's results (94 % and 99 %). The coast still has no Nine of its own.
- **The Reach is unchanged.** Its five sim runs are byte-identical to before milestone 39.

## What didn't change
- The Reach: its patterns, tries, board, regulars, stories, sims and screens. The coast's patterns are left out of the Reach's
  old-piece pools, so its random rolls are the same as before.
- The coast's Relics and the Nine of the Tide (milestones 41 and 42).
- **For milestone 42:** the line's record doesn't carry a region yet (`Leg.recordOf`). The crossing must write it, or a second
  coastal heir counts as the coast's first (`Rg.localGen`) and meets the founders again, not their grandchildren.
