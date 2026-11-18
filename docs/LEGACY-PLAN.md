# The legacy: a plan (milestones 36–38)

Status: planned and decided (2026-11-18). Milestone 36 (the apprentice) built in release 61 (docs/MILESTONE-36.md); 37 and 38 to come.

## What it's for

Making all Nine is the end of the game today: the ending plays, the forge stays warm, and there's nothing left to chase. The legacy
turns that ending into a loop. A Maker of the Nine can hand the forge to an apprentice they trained, and play on as that apprentice,
a generation later, in a Reach where the Nine have been scattered again. One heirloom and what the line has learned carry over, so
each generation climbs a little faster, and the line itself becomes something to be proud of.

## Rules for the legacy

1. **Never forced.** Handing on is a choice, offered only to a Maker of the Nine. Playing on as before stays open for good.
2. **Nothing lost.** The old shop is kept as it was, readable in the line's record, and its save code is offered before anything
   changes. Handing on can't be undone, so it's asked twice.
3. **A fresh climb, not a free one.** The new shop starts small and earns its renown again. What carries over saves time on the
   slow parts (finding patterns, the first trade levels) and never skips the workings: every Relic and Mythic is made again by hand.
4. **Told as a story.** The handing-on is a scene, the new generation has its own opening, and the regulars remember the old maker.

## The systems

### Milestone 36: the apprentice
- **A new kind of staff** (STAFF › HIRE), from FAMED: an apprentice who works at the bench while you're away, and in the open shop
  between your own workings.
- **What they make:** Common and Fine pieces of patterns you know, at a station you own, from the back room's materials (never a rare
  thing, never a relic material). One piece every so often, by their skill; the pieces go to the back room (or the shelf, with the
  clerk's restocking).
- **They learn:** each piece raises their own trade in its pattern, slowly; working beside you (you making pieces while they're there)
  teaches faster. Their level shows on their card, pattern by pattern. They never pass trade 5: a master is made, not trained.
- **A trait** each, like the clerk's and the runner's: Careful (fewer flawed pieces), Quick (more pieces), Thrifty (fewer materials),
  Bright (learns faster). The trait carries into the next generation if they inherit (milestone 37).
- **Wages** like any staff; unpaid, they stop working. One apprentice at a time.
- A sim run measures what they add to earnings (aimed at a modest share, not a second shop).

### Milestone 37: handing on the forge
- **When:** once you're MAKER OF THE NINE, with an apprentice who's been with you at least two weeks. The ending gets a second button,
  HAND ON THE FORGE, and the trail tab keeps it.
- **The heir:** your apprentice, by name. If you've none, the ending says so and the button waits.
- **The heirloom:** you choose **one** piece to pass on: a Mythic, a Relic or an Old-Blood piece. It hangs in the new shop's Hall from
  day one (it can't be sold, and it draws customers as the Hall does). The other eight Mythics stay with the old shop.
- **What the line keeps:**
  - **the book:** every pattern found stays found, and every blueprint stays known (not made);
  - **a head start:** the heir begins at their own trade levels (up to 5) in the patterns they learned, trade 2 in the rest;
  - **the line's name:** the shop's sign says "<new maker>, of the line of <old maker>";
  - **the heir's trait**, for good (Careful: a little wider band, and so on).
- **What starts over:** coin (a small purse to begin with: 300 c), renown, the room, the stations (the forge only), the staff, the
  shelves and the back room, the Bank, the trail and its shards, the regulars' stories, the second shop.
- **The old shop:** kept, read-only, in the line's record (below), with its save code offered once more before the handing on.

### Milestone 38: the next generation's Reach
- **A generation later.** The town is the same, the faces aren't: the regulars' children and grandchildren come in, with their own
  lines that remember the old maker ("my grandmother had a ring from your master"). Their stories ask the same kinds of piece in new
  words, so the blueprints come the same way.
- **The Nine, scattered again.** The Nine of Veric were lost after the old maker's day (a fire at the Court, a theft, the river); the
  trail reopens OF THE REACH as before. Their shards lie in new places: which shards are deep, Court or star is shuffled each
  generation (three of each still).
- **The line's record** (a new page under the trail, or the Hall): each generation's maker, how many days to MAKER OF THE NINE, the
  heirloom passed, and a link to read the old shop. The visit link and the flyer show the generation ("THIRD OF THE LINE").
- **Each generation, a little more:** from the third generation on, the heirloom choice grows to two pieces, and the town's welcome
  starts the shop at KNOWN's charm. Capped at the fifth: the climb must stay a climb.
- **Pace target:** the second generation makes all Nine in about two months of play (the first takes about three, release 60).

## How it fits the save
- A handing-on writes the new generation into **the same slot**; the old shop goes into the save as `line: [...]`, trimmed to what
  the record shows (name, days, the Nine, the heirloom, the Hall's pieces), so the save doesn't grow without end.
- The full old save is kept as a code in the record, to load into another slot if the player ever wants to play it again.
- Old saves need nothing: no apprentice and no `line` reads as the first generation.

## Decided (2026-11-18)
1. **Where the new generation plays:** the same Reach, a generation on. A new region is kept for later.
2. **What the line keeps:** the book, the blueprints, a head start in trade and the heir's trait.
3. **The heirloom:** one piece; two from the third generation.
4. **The old shop:** kept read-only in the line's record, with its save code.
5. **The apprentice:** built first as its own milestone, for every shop from FAMED.
6. **Order:** the apprentice (36), handing on (37), the next generation's Reach (38).
