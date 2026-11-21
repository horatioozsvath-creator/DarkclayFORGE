# Milestone 55: the hold's folk and finds (release 82)

Asked for: the second part of the third region (docs/NORTH-PLAN.md). Like milestone 54, it is **hidden** until the climb in
milestone 57.

## Five new patterns, one per station
Each is found only up in the snow, and can be made anywhere once found.

| Pattern | Station | Found with | Worth | On the runner |
|---|---|---|---|---|
| **Ice axe** (a pick and an adze in one) | forge | iron or steel, an ash haft, an **antler** grip | 52 | WEAPON |
| **Fur hood** | stretcher | deer or goat hide, **elk fur** (elk hide), gut or cord | 30 | HEAD |
| **Snowshoes** (bent frames, laced) | bench | birch or yew, an **elk-hide** harness, gut | 40 | FEET |
| **Warming draught** (a batch of three) | kettle | emberroot, spring water, **bear fat** | 18 a bottle | a POTION |
| **Snow-goggles** (smoked glass) | glass | clear or river sand, **soapstone** flux, a bronze or iron rim | 38 | none |

- **Found only up in the snow.** Each pattern is marked `north: true`. Its tries, the customers' asks, the regulars' clues and
  the board's posts come only in Hearthold (`Rg.findsHere`). Every try needs something only Hearthold sells (antler, elk hide,
  bear fat or soapstone), so no try in the Reach or on the coast can come near one.
- **Made anywhere.** Every part's first option is sold in the Reach. The hold's own materials come last in each part, after
  the coast's, so no saved pick moves.
- **The warming draught keeps the cold out.** Carried in a potion slot, it takes a quarter off the road's hurt and is used up
  on any hard road, like a tonic or an oil (`GEAR.warm`).
- **Snow-goggles have no slot.** They are for the customers: pilgrims, guides, thanes and the Deep Shift. A new EYES slot would
  have shown on every runner's card in the Reach too, with nothing to put in it.
- **Art.** Each has its own card picture (SVG, `js/card.js`). The ice axe has its own shape on the anvil, snowshoes bend into
  their frame at the bench, the fur hood is cut as a hood and the goggles are blown into their own shape (`js/stage.js`). All of it is
  drawn new, not taken from Zero.
- **Who wants them.** Hearthold's customers ask for them: hunters want snowshoes, miners want ice axes
  and goggles, guards want ice axes and fur hoods. The seasons and the town's hot days ask for them too, with a new hot day,
  "Sun on the new snow", for goggles.

## Hearthold's six families
None of them has heard of the line (`REGIONS.north.regulars`):
- Sergeant Ragna Stenhus of the hold's guard;
- Lady Asa Hallvard, a thane's widow;
- Orm Fellsson, a herder;
- Hild Vik, a miner's widow;
- Yrsa Bakke, the herbwife;
- Leif Tarn, a goat-boy.

They place their own orders and give clues to patterns still to find, the hold's among them. At the counter they borrow the
Reach families' looks: Stenhus as Vance, Vik as Ketty, Fellsson as Bram, Hallvard as Lady Corrow and Bakke as Marrow. Leif
Tarn, like Tib and Kit Rook, has none.

## Their stories
There are ten stories in the hold's words (`REGIONS.north.stories`).
- **Five first stories, each ending in a gift.** Each gift uses one of the Reach gifts' 3D models and paintings:
  - Hild Vik's lamps (Ketty's candles);
  - the hold guard's banner (the watch's banner);
  - Orm Fellsson's cheeses (Bram's barrels);
  - the Hallvard hearth-stone (the Corrow king);
  - Yrsa Bakke's lichen (Marrow's herbs).
- **Five great stories.** Each ends in a blueprint for one of the hold's Relics: `frostwarden` (Stenhus), `vikhood` (Vik),
  `fellstride` (Fellsson), `thanering` (Hallvard) and `bakkesember` (Bakke). The Relics come in milestone 56. Until then a
  great story doesn't come in, as the coast's waited for milestone 41.
- **A generation on in the snow,** the families' grandchildren come in (Sigrid Stenhus, Arne Fellsson and so on), counting only
  the generations that worked up there (`Rg.localGen`). They ask what their grandparents asked and remember the old maker once.

## The board and the shop
- **The board's posts** for the Reach's sixteen hidden patterns have the hold's words up there. For example, the Deep Shift wants
  lanterns for the frozen level, and the thaw-pickers want satchels.
- **The shop's look.** The 3D shop front up in the snow has grey flagstones and stone walls. Snow shows through the street door
  and a window, a fur hangs over the door, and the hearth's glow is brighter (`js/diorama.js`).
- **Fixed from milestone 54:** the painted counter view counted any region but the Reach as the coast, so Hearthold showed Saltby's
  sea through the door. It now shows the Reach's backdrops until milestone 58 renders the hold's own (`dirOf`, `js/counter.js`).

## Town life
The hold's seasons (the thaw, summer, the herders' return, the long dark), its events (the herders come down, raiders in the
passes, the Hearth-feast, the Thanes' Moot, the Deep Shift comes up, deep winter) and its news and gossip came in milestone 54.
This milestone adds the new patterns to them.

## The sim (`REGION=north`, every hidden pattern found from day one)
- **The hold's patterns get made.** All five were made on both seeds. Of the five, ice axes pile up most in the back room (18
  and 7 at day 60, seeds 1 and 2).
- **All five first stories were told** by day 60 on both seeds. The great stories waited, as they should.
- **Earnings over 60 days:** 862,000 and 882,000 coins (seeds 1 and 2), against 932,000 and 913,000 in milestone 54. That puts
  the hold at 91–93 % of the Reach (945,000), the coast's level after its own new patterns (milestone 40: about 92–96 %). The
  pace is tuned in milestone 58.
- **The Reach and the coast are unchanged.** Their sim runs (the Reach 120 days with luck on and off, the coast 90 days) are
  byte-identical to release 80.

## Not done yet
- **The hold's Relics** (milestone 56). Until they exist, the blueprints list up in the snow shows the Reach's Relics standing in,
  as milestone 54 set up.
- **The Nine of the Hearth, the climb and Hearthold's opening** (milestone 57). The handing-on dialog still offers only the Reach
  and over the pass.
- **Deep winter** still keeps customers away without making the roads longer.
- **Hearthold's own painted counter view** (milestone 58).
