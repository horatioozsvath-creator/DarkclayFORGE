# Milestone 38: the next generation's Reach (release 63)

Asked for: the last part of the legacy (docs/LEGACY-PLAN.md). The heir plays a generation later, in a Reach where the Nine are lost
again.

## The Nine, scattered again
- A handing-on scatters the shards: each of the Nine's shard sources (below the deep doors, the Court, the fallen star) is shuffled.
  There are still three of each. The shuffle is fixed for the shop and the generation (`save.shardWhere`, `Trail.scatter`).
- The trail's clues, the runners' finds, the Court's shard orders and the starfall all look where the shards lie now
  (`Trail.sourceOf`). A first generation is as before.
- **The line's lore** (`LEGACY.lore`), from the second generation: an heir knows a little of where to look.
  - A star shard turns up below the deep doors twice as often.
  - The Court offers its shard orders half again as often.

## The regulars' grandchildren
- A generation on, each regular's family sends a grandchild:
  - Tamsin Vance of the watch, Lady Ysolde Corrow, Cob Oakes the drover, Nell Moss, Sorrel Marrow the herbalist, Wat Harrow.
  - The first names change with each generation, up to the fifth (`LINE_FOLK`).
- They want the same kinds of piece, in their own words.
- Each family says its word about the old maker once, with its first plain order, by name: "My grandmother had a ring from your
  master, Old Hand. She was buried with it."
- **Their stories:** all ten (the five first stories and the five great ones) are told again in new words (`LINE_STORIES`).
  - The patterns, tiers, gifts and blueprints are the same.
  - The thanks remember the old maker by name.
  - The great stories still end in a blueprint. The line knows it already, so its thanks say so.
- In the 3D shop, each family keeps its look (js/folk.js now matches by family name).

## Each generation, a little more
- **The third generation on:**
  - **two heirlooms** (`LEGACY.heirlooms`);
  - **the town's welcome:** the shop starts KNOWN (50 renown).
- Nothing more past that, so the fifth generation starts as the third. The climb stays a climb.
- The dialog lets you choose one or two heirlooms, as the generation allows. The best are chosen to begin with.

## The line's record
- The record shows each generation and what it passed on (one or two heirlooms). It was built in release 62, under the trail page's
  THE LINE.
- **The visit link** carries the generation (`g`), and the shared shop's heading says "SECOND OF THE LINE". An older link reads as
  the first.
- **The flyer** reads "forge & shop · second of the line".

## The pace (sim)
- `tools/sim.mjs` can play an heir:
  - `SAVEOUT=file` writes a run's save at its end.
  - `FROM=file` hands that save on (the best heirlooms) and plays the next generation.
- **The bot now reworks a Fine piece up to Rare for the Court's shard order.** It had kept its Relic back from the order and waited
  for a plain working to come out Rare, so the order lapsed again and again. This changes the first generation's runs too.
- **Results (seeds 1–6, varied starts, 45 minutes a day):**
  - **The first generation** made all Nine on days 72–115 (median about 98).
    - That's slower than release 60's figure (about 87, ten seeds). The apprentice is now on by default, which release 61 measured
      costing a heavy player about 2 %. This is six seeds, not ten, and the bot now reworks for the Court.
  - **The second generation**, from those saves, made all Nine on days 56–100 (median about 68). Four of six were done by day 72.
  - It reaches OF THE REACH about a week sooner (the book, the blueprints and the trades), and its Relics come by about day 30.
- **About two months: close in most runs, not met in all.**
  - The slow runs wait on stars that fall on the calendar's own days, and on a Court order for a Rare brew.
  - The bot can't rework a brew up to Rare as it does a Fine piece, so that last wait is partly the sim's.
- Earlier runs, before the line's lore, were 56–90 (median about 75). Runs this short are noisy.

## Not changed
- A second-generation save made under release 62 has no `shardWhere`, so its shards stay where they were. No one can have handed on
  under release 62 yet (the apprentice came in release 61, and the gate is 14 days).
- "KNOWN's charm" in the plan is read as the starting renown (50), not charm.

Tests: tests/m38.test.mjs (5); m37's updated for the list of heirlooms. 261 in all.
