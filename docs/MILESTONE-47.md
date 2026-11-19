# Milestone 47: miners (release 72)

Asked for: the mine's third milestone (docs/MINE-PLAN.md, "47: miners"). A staff role that digs at the face while you serve and
while you're away, the hurt the mine can do them, and the gear that keeps them safer.

## The miner
- **A new role, MINER** (wage 4 c an hour at level 1, as the clerk's). No one looks for the work till the trapdoor's open; from then a
  miner can turn up among the three looking for work each hour, as a guard or an apprentice does.
- **One miner, a second once the third gallery is open.**
- **Traits:** Strong (a haul a quarter sooner), Steady (half as many rockfalls), Canny (more Fine hauls), Quick learner.

## At the face
- **A haul every 90 minutes of the shop's clock**, open or away (up to the away cap), as the apprentice works at the bench. A miner
  is much slower than your own hand: a working of yours takes a minute or two.
- **Common, or Fine now and then** (8 % at level 1, more with each level, at most 35 %; Canny more). **Never Rare**, so a miner never
  breaks into a pocket and never brings up a rough gem.
- **Where they dig:** STAFF › the miner's card › AT THE FACE: THE DEAREST OPEN (the seam whose Common haul is worth most, of those that
  can be worked now), REST, or any open seam. The shop's own mining trade opens the seams for them, as it does for you.
- **What they dig goes to the store room as ore**, for you to smelt. A miner doesn't smelt.
- **A fallen or flooded gallery stops them.** Set to a seam there, they wait; on THE DEAREST OPEN, they go to the dearest seam still open.
- **Unpaid, they stop**, as the apprentice does.

## The danger
- **Their workings wear the shoring as yours do:** 4 a working, and a rockfall 4 workings in 10 (Steady: 2 in 10), 3 more each. Worn,
  the roof can come in after one of theirs.
- **The roof coming in on them hurts them** 60 % of the time, bare.
- **The old workings are not empty.** In the fourth gallery, something comes up out of the dark about one haul in 12 (a pale thing in
  the Reach; on the coast, something out of the drowned level). **A night guard on the staff keeps half of them off.** It hurts the
  miner 70 % of the time, bare, and a hurt miner drops the haul.
- **Hurt, as a runner is:** off their feet 2 to 4 days, the healer paid as for a runner. A salve they carry heals it; a poultice halves
  the days and the bill.
- **Gear:** a miner carries what a runner does (STAFF › their card). Armour and a weapon bring the hurt down as on the road, and a
  lantern in the LIGHT slot a little more. The card says how much.
- **None of it on the gentler Reach, or in the week of grace**: no wear, no falls, nothing out of the dark.
- A miner is never killed. (The beasts that come up stay down there: the hunts are still the roads'.)

## Where it shows
- STAFF › ON THE BOOKS: the miner's card (where they're digging, the next haul, the danger as they're kitted, the seam picker, their gear).
- A toast when the roof comes in on a miner's working, when they're hurt, when something comes up, or when the timbers start creaking.
- WHILE YOU WERE AWAY: what the miners dug, and anything that went wrong.

## The sim
**A shop that never opens the trapdoor is unchanged:** byte-identical to release 71 (a Reach run of 120 days and a coastal one of 90).
A shop with the mine open now sees miners among those looking for work, so its hiring draws change even with no miner hired; the
miners are measured against this release with none hired (`MINERS=0`).

**The bot** (`MINE=0.1 MINERS=2`) hires up to two miners once it can, sends them to THE DEAREST OPEN, bare (no gear), and keeps the
galleries shored for them. Against the same seeds with no miner (the Reach 120 days, the coast 90):

| | earnings | the ninth of the Nine (no miner → two miners) |
|---|---|---|
| the Reach, seeds 1–6 | −3.6, −0.9, +0.2, +0.9, −1.7, −1.1 % (middle −1.0 %) | 74→77, 83→75, 93→80, 109→87, 108→76, 99→84 |
| the coast, seeds 3, 6 | −6.8, −7.2 % | 71→not by day 90, 88→80 |

- **Two miners dig 450–760 hauls a run**, nearly all silver ore from the second gallery (the dearest Common haul): 1,750–3,400 ore.
  Most of it waits in the store room: the bot only smelts in its tenth of the workings, and a miner doesn't smelt. That's the mine's
  rule 2 at work: it feeds the stations, slowly, through your own hands.
- **The danger is real but bounded:** 13–22 roofs came in on them a run (the bot shores when it next tends the mine, not overnight) and
  5–13 hurts (2–4 days each, a healer's bill). Never in the fourth gallery, so nothing came up out of the dark.
- **The Nine's pace:** with two miners the Reach seeds finished on days 75–87 (middle 78.5), without them 74–109 (middle 96). The runs
  without a miner are slower than milestone 46's (middle 81) most likely because the hiring draws moved: one seed's day moves 30 days with
  the dice order alone. Six seeds can't tell a few days' shift from that noise; the miners don't make it later.
- **On the coast earnings fell about 7 %** with two miners: their wages, the healer, and a mine that brings up more silver ore than the
  bot ever smelts.

**A bot fix on the way:** since milestone 46, the line that counted a roof coming in on the bot's own working had slipped into the
comment before it, so the falls went uncounted (and the "no roof came in" of milestone 46 may have missed some). It counts them now.

## Tests
`tests/m47.test.mjs` (6 tests).
