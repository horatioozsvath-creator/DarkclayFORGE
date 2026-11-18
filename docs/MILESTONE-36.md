# Milestone 36: the apprentice (release 61)

The first of the legacy's three milestones (docs/LEGACY-PLAN.md): an apprentice at the bench, useful to any shop from FAMED, and in
milestone 37 the one you hand the forge to.

## The apprentice
- **A new kind of staff** (STAFF › HIRE), from FAMED, one at a time. Wage 4 c an hour to start, like the clerk's.
- **At the bench:** a piece every 30 minutes of the shop's clock, here or while you're away (up to the away cap, as the clerk). Common,
  or Fine now and then; flawed more often while they're learning. Into the back room; the clerk's restocking puts them out.
- **What they make:** a pattern you know, at a station you've set up and that isn't broken, from common things (never a rare thing,
  never a relic material). **WHAT'S SHORT** (the default): the pattern fewest of in the back. Or set to one pattern, or to **REST**.
  **Never more than two of a kind waiting in the back**: they don't make what won't sell.
- **BUYS WHAT'S SHORT · ON** (the default): short of something common, they buy it from a supplier selling it that hour, while 300 c
  stays in the purse. OFF: only what's in the back.
- **They learn:** each piece adds to their own trade in its pattern, **twice as fast while you've worked a piece in the last 20
  minutes**, never past trade 5. Better hands: more Fine pieces, fewer flawed. Their trades show on their card.
- **Their pieces carry their name** ("Forged by Pip Hollis"), and a sale of one brings a quarter of the renown one of yours does.
- **Their work wears the station** as yours does (the gentler Reach spares it). Unpaid, they stop.
- **Traits:** Careful (half as many flawed pieces), Swift (a piece a quarter sooner), Thrifty (one piece in four costs nothing),
  Bright (learns half as fast again). The trait goes with them into the next generation (milestone 37).
- While the shop is open, a toast says what they made; the welcome back says how many while you were away.

## The pace (sim, 120 days, seeds 1–6, each starting on a different date)
- **A player of 15 minutes a day:** earnings **5–22 % more** with an apprentice (hired on day 19–24); renown a third to a half more,
  so the trail opens sooner (2–5 of the Nine by day 120, against 0–2).
- **The bot's 45 minutes a day** (its shelves always full of its own pieces): about 2 % less on average (−7 % to +7 % by seed), and
  two runs of six made 7 and 8 of the Nine instead of 9. The apprentice's own pieces earn about 130,000 c over the run against about
  35,000 c of materials and 20,000 c of wages, but they take shelf places and customers from the maker's better pieces. For a shop
  that's always full, REST (or no apprentice) is the better choice; the card says what they cost so far.
- On the way, two first tries were set aside: buying with no limit flooded the back room (26 pieces a day, earnings down 5–20 %), and
  a full share of renown for their sales doubled a light player's renown; hence two of a kind at most, and a quarter of the renown.

Tests: tests/m36.test.mjs (7). 251 in all.
