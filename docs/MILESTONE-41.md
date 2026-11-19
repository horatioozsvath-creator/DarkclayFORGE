# Milestone 41: the Greyshore's Relics (release 66)

Asked for: the third part of the new region (docs/REGION-PLAN.md). Like milestones 39 and 40, it is **hidden** until the crossing
in milestone 42.

## Nine Relics of the coast
Each new pattern has one, and every station has at least one. Five blueprints end Saltby's families' great stories (milestone
40). The other four come from below the drowned town.

| Relic | Pattern | Station | Relic material | Its blueprint |
|---|---|---|---|---|
| **The Tidewarden** | falchion | forge | heartstone | Captain Crane's great story |
| **The Drowned Ring** | ring | forge | moonsilver | Nan Tregear's great story |
| **Hobb's Barb** | harpoon | forge | heartstone | Gil Hobb's great story |
| **The Tide Cup** | goblet | glass | moonsilver | Dame Penrose's great story |
| **Penhale's Balm** | salve | kettle | moon-mead | Ama Penhale's great story |
| **The Drowned Captain's Coat** | oilskin | stretcher | wyrm-hide | below the drowned town |
| **The Breakwater** | trident | bench | ghost-yew | below the drowned town |
| **The Far Glass** | spyglass | glass | starglass core | below the drowned town |
| **The Black Caulk** | pitch-proofing | kettle | moon-mead | below the drowned town |

- Each has its own power and lore line, in the same form as the Reach's: "The harbour holds: no one boards a ship it guards".
- The working is the Reach's Relic working, unchanged: the blueprint, a Rare or Old-Blood piece, trade 7 at the station and 5 in
  the pattern, the bars and the relic material. A relic batch of pitch boils down to one bottle, as the Reach's brews do.
- The relic materials are the six the Reach already has. On the coast they come from below the drowned town and from the Crown's
  Factor.
- **The great stories now come in.** Milestone 40 held them back while their blueprints weren't Relics yet. From RENOWNED, after
  each family's first story, the great one comes as the Reach's do.

## Two Relics for one pattern
Four of the coast's Relics share a pattern with a Reach Relic: the falchion, the ring, the goblet and the salve. Blueprints travel
with the line, so a maker can hold both. Which one a piece can become (`Rg.relicOf`):
1. a Relic whose blueprint the maker holds and hasn't made yet, this region's first;
2. otherwise this region's own.

So an Old-Blood falchion on the coast becomes the Tidewarden, or Gatewarden if that's the only falchion blueprint the maker holds.
In the Reach it becomes Gatewarden first, and the Tidewarden once Gatewarden is made.

## Where blueprints are found
- **Below the drowned town** a runner finds only the coast's blueprints. Below the deep doors, only the Reach's, as before
  (`Rg.relicsIn`).
- **The blueprints list** (THE FORGE › WORKSHOP) shows this region's Relics, and after them any of the other region's whose
  blueprint the maker holds or has made. A Relic still to find says where to look in the coast's words ("below the drowned town, now
  and then").

## The sim (`REGION=greyshore`, every hidden pattern found from day one)
- **Earnings against the Reach, over six seeds:**

  | | day 30 | day 60 |
  |---|---|---|
  | the coast's earnings, against the Reach's | 88–97 %, about 92 % | 89–101 %, about 95 % |

  That's milestone 40's level (92 % and 96 %), within the seeds' spread.
- **The Relics, over six 120-day runs:**
  - **Seven of the nine get made on every seed.** The first comes between day 26 and day 39, and the Coat and the Balm come last,
    around days 76–111.
  - **The Black Caulk** was made on two seeds (day 96) and not on the other four.
  - **The Breakwater was never made.** The coast's bench stays at trade 4–5 by day 120, against 10 in the Reach. The bot keeps
    tridents, bows and staffs unsold up to its stock cap, so the bench is never worked enough. This comes from milestone 39's
    customer mix, which wants few bench pieces. Widening the coast's wants for bench pieces was tried. It didn't raise the bench,
    and it was taken back.
  - The Reach, for comparison: all eleven by day 76 (seed 4).
- **For milestone 42:** each of the Tide's Nine grows from one of these Relics, and the pace target is about two and a half months.
  The coast's bench has to work before then: more bench buyers on the coast, or a Tide Mythic that doesn't grow from the Breakwater.
- **The Reach is unchanged.** Its five sim runs are byte-identical to before milestone 39.

## What didn't change
- The Reach: its eleven Relics, their order, where their blueprints come from, the working, its sims (byte-identical to before
  milestone 39) and its screens.
- The Nine. The Reach's Mythics still grow from the Reach's Relics. The Nine of the Tide, their shards and the crossing come in
  milestone 42.
