# Milestone 34: the loose ends (release 58)

Asked for: finish what the earlier milestones left out, and the targets not met. The brews stay cards, like everything else.

## The Court's orders for found patterns
- From **FAMED**, now and then (15 % of the orders that reach it, after a story, the Court's asks for the Nine and its shard orders) the
  Court asks for **a pattern you found yourself**: never one still to find, never a bottle-maker. Fine or better; Rare or better once
  the shop is OF THE REACH. It pays half again an order's pay (three times what such a piece is worth) and **+10 renown** when filled.
- Its own words for some (ink for the scribes, a mirror for a lady of the Court, a shield for the feast day, a crossbow for the
  huntsman, a lantern for the halls, a war hammer for the champion); a plain line for the rest (`COURT_FOUND` in js/data.js).

## The Tidy clerk
- A new clerk trait, **Tidy**: fills **every** empty place on the shelf from the back room, not only the one a sale left, by the
  restock's rules (the least worth first, at FAIR; never a Rare or better, a one-of-a-kind piece or one marked KEEP). Away, after each
  customer; in the open shop, as someone comes in. RESTOCKS THE SHELF · OFF turns it off. Clerks hired before keep their trait.

## The monster hunt and its trophies
- **HUNT THE BEAST**, a runner's road (6 h, 50 c), open from the sightings until a day after the monster is done, whether it came, was
  kept off, or not yet. One runner at a time. The board's notice says it can be hunted.
- **The odds:** the wolves 55 %, the wight 40 %, the deep thing 25 %, plus the weapon (4 % a point of fight), the runner's level, a
  tonic (+15 %) and, against the wight, a silver weapon (+20 %); at most 90 %. Shown on the road's button.
- **The danger** is the kind's own, worse for each (hurt 8 %, 14 %, 20 %; killed 0.3 %, 0.7 %, 1.2 %): DEADLY bare for all three.
  Not doubled by its being about; good gear brings it down (a well-kitted runner faces HIGH against the wight). Gear, a lantern and the potions work as on any road; a HIGH or DEADLY road asks first.
- **Brought down:** if it hadn't come yet, it never comes (the roads safe again); a bounty (150, 400, 1,200 c × (1 + rung)), renown
  (+15, +25, +40), its rare material (wolves: winter fox ×2; the wight: moonsilver; the deep thing: heartstone) and **its trophy**, on
  the wall under STAFF (The Pack-Leader's Pelt, The Wight's Grave-Crown, A Plate of the Deep Thing's Hide). The word in town says it.
- **Got away:** nothing more; the night still comes if it was coming. Killed on the hunt: as on any road.

## The Nine's pace
- **A Relic from a Rare piece** (or Old-Blood, as before). From a Rare it takes the station's rare thing too. The Court's shard orders
  ask a Rare or better (was Old-Blood).
- **The mastery asked:** a Relic and a Mythic at **trade 7** in something at the station (was 9), still trade 5 in the piece's own
  pattern; a part of the Nine at **trade 4** in its station (was 6). The workings themselves are as narrow as before.
- **The Crown's Factor** (SUPPLIERS › THE FACTOR, from RENOWNED): two of the six relic materials each hour, 2,500–4,000 c: the late
  game's coin sink. Relic materials still come from below the deep doors, and now from the hunt.
- **The sim** puts out only what the game's FILL THE SHELVES would (it had been shelving, and selling, its Relics by hand), keeps a
  Relic from a regular's order while its Mythic waits, buys the relic material for a Mythic working, and hunts a monster when the odds are
  even or better.
- **Sim (120 days, seeds 1–6):** the first Relic on day 21–48; **all Nine in three runs (days 99, 112, 120)**, 7–8 in two, 5 in one
  (it neglects the kettle). By day 90, 7–8 of the Nine in four runs. All Nine in about three months: close, not met. The steps, lever
  by lever, are in docs/RARITY-PLAN.md (release 58).

## Brews
- They stay cards in the 3D shop, like every other piece (decided; no bottles).

## A correction
- The list of what was left included "the last two rarity tiers". They were built in milestones 12–17 (Relic and Mythic); the line in
  docs/RARITY-PLAN.md that said otherwise was out of date and is fixed.

Tests: tests/m34.test.mjs (8); older tests updated for the new rules (Relic from a Rare, trade 7, parts at 4, the Factor, the Court's
shard orders at Rare). 240 in all.
