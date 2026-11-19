# Milestone 42: the Nine of the Tide, and the crossing (release 67)

Asked for: the last part of the new region (docs/REGION-PLAN.md). **The pass is open.** From this release, a Maker of the Nine who
hands on the forge chooses where the heir sets up: the Reach, or over the pass on the Greyshore. Milestones 39–41 built the coast
unseen; this one lets players reach it.

## The Nine of the Tide
Isel, the Tide-Queen, held Saltby before the sea came. Nine pieces were sworn to her, and they went down with the old town. Each is
one of milestone 41's coastal Relics, reforged with its shard and three parts from three other stations, as the Reach's Nine are.

| Mythic | From | Its shard |
|---|---|---|
| **The Sea-Gate Sword** | the Tidewarden | an order from the Harbour Guild |
| **Isel's Ring** | the Drowned Ring | the strand, when the tide gives back |
| **The Whale-King's Barb** | Hobb's Barb | below the drowned town |
| **The Cup of the Tide** | the Tide Cup | an order from the Harbour Guild |
| **The Chapel Balm** | Penhale's Balm | the strand |
| **The Tide-Queen's Mantle** | the Drowned Captain's Coat | below the drowned town |
| **Isel's Trident** | the Breakwater | an order from the Harbour Guild |
| **The Lighthouse Glass** | the Far Glass | the strand |
| **The Seal of the Tide** | the Black Caulk | below the drowned town |

- **Where the shards are**, three from each place, as in the Reach:
  - **below the drowned town**, on a runner's trip (as below the deep doors);
  - **the Harbour Guild's orders** (as the Court's): a Rare or better piece of the Relic's kind, and a shard with the pay. The Guild
    also asks, once, to buy a Mythic, as the Court does;
  - **the strand**, on the day **the tide gives back** after a storm. It's the coast's own town event, in place of the fallen star:
    GO DOWN TO THE STRAND, and up to two shards lie in the wrack. Now and then a runner finds one below the drowned town instead.
- A generation on, the shards are scattered again, to the same count of each place, among the region's own Nine.
- **The ending.** All Nine of the Tide made: the maker's mark is **MAKER OF THE TIDE**, with the Reach's ending in the coast's words.
  The Hall's charm doubles, the title is on the forge's sign, the flyer and the link, and the forge can be handed on.
- **Each region's Nine count apart.** On the coast only the Tide's make the ending (`Rg.nineOf`); in the Reach only Veric's. Heirlooms
  over the door never count toward either.

## The crossing
- **At the handing on**, the dialog asks WHERE: **THE REACH** (the Nine of Veric) or **OVER THE PASS** (the Nine of the Tide, in
  Saltby). It starts on the region the maker works in. Every handing on asks again, so a line can go back.
- **A new game always starts in the Reach.** Only an heir crosses.
- **The heir keeps everything the line keeps**, in either direction: the book, the blueprints, the found tiles, the trades, the trait
  and the heirlooms.
- **Saltby's opening.** The first heir over the pass gets their own first morning: three days over the pass, the grey sea, and a town
  where nobody has heard of the line or of the Nine of Veric. An heir who goes back over the pass is told the line "has come back to" the Reach.
- **The town's welcome** (the shop starts KNOWN from the third generation) counts, on the coast, only the generations that worked
  there. The Reach counts every generation, as before, so a Reach line's welcome is unchanged.

## The line's record, the link and the flyer
- **Each generation's record keeps where it worked** (`region`). The line reads "SECOND OF THE LINE · NAME · OF THE GREYSHORE", and a
  coastal maker who made the Nine reads "Maker of the Tide". Old records read as the Reach.
- **The visit link** carries the region (`rg`, only for a shop off the Reach). The visitor sees "· OF THE GREYSHORE", the coast's top
  rung (OF THE SHORE) and MAKER OF THE TIDE. An older link, or a region it can't read, is the Reach.
- **The flyer** reads "forge & shop · second of the line · of the Greyshore".
- **The save slots** on the title screen show the coast's title and top rung.

## The coast's bench, and the sim
**The pace target:** a second-generation heir on the coast should make all Nine of the Tide in about two and a half months. That's a
little longer than a Reach heir, because the coast's five patterns and its blueprints aren't known yet.

**The sim's bot, changed** (`tools/sim.mjs`). Milestone 41 found the coast's bench never got good enough for the Breakwater. The bot
stopped making a piece once six were unsold, and tridents barely sell. A player chasing a Relic would keep making it. So the bot now
keeps making a piece it's chasing a Relic for, past six unsold, while the station is short of trade 7 or the pattern of trade 5.
- **The game doesn't change.** With the old bot, milestone 42's code gives byte-identical Reach output to before milestone 39, on all
  five runs.
- **The Reach's sim numbers do change**, because the bot plays differently. Over six 120-day first generations, the Reach's Nine
  come about 12 days sooner (day 74–97, about 84, against 76–109, about 96), for about 1 % less earned.
- **Six first-generation coasts** (every pattern known from day one) now make the Breakwater on most seeds. Three of the six make all
  Nine of the Tide by day 120 (days 80, 82, 96). The other three make eight. The Breakwater still sometimes isn't made.

**Second generations** (six finished Reach makers from milestone 38's runs, handed on):

| The heir sets up | all Nine made by | median |
|---|---|---|
| in the Reach | day 59, 67, 68, 77, 82, 93 | about 72 days |
| over the pass, first run | day 85, 86, 87, 96, 113; one seed eight of nine by day 120 | about 87 days |
| over the pass, the bot chasing only the coast's Relics | day 59, 75, 104; three seeds eight of nine by day 120 | |

- **Finding the coast's patterns.** The bot can't try things at a station, so for a coastal heir it finds the coast's five patterns
  one every three days (`FINDGAP`), as a player trying with the clues might. Without that, a coastal heir made only four of the Tide's
  Nine, because the other five grow from Relics of patterns it never learned.
- **About two weeks slower than the Reach**, a little past the plan's two and a half months. The one seed short of the Nine had all
  eight others by day 74. It never made Isel's Trident, because its Breakwater never came: the coast's bench is still the slowest
  station.
- **The second run.** The bot first chased the Reach's carried blueprints on the coast too, spending Old-Blood pieces and relic
  materials on Reach Relics. It now chases only the region's own (this is the sim's choice; a player can still make a Reach Relic on
  the coast). That didn't settle the pace: across the twelve runs, eight finished, from day 59 to 113 (about 86 in the middle). The
  other four made eight of the nine, each missing the one from the Breakwater or the Black Caulk, which came late or not at all.
- **Earnings** of a coastal heir are about the Reach heir's (1.75–1.89 million in 120 days, against 1.80–1.93).

## What didn't change
- **The Reach, in the game.** With milestone 42's code, the old sim bot gives byte-identical output to before milestone 39 on all five
  runs. The Reach's Nine, its shards, the Court, the fallen star, the ending's words and the handing on (when the heir stays) are as
  they were.
- The craft. The coast's Relics and Mythics use the same workings, at the same stations and trades.
