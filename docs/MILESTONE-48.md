# Milestone 48: the bottom and the line (release 73)

Asked for: the mine's last milestone (docs/MINE-PLAN.md, "48: the bottom and the line"). Breaking into the deep (and the drowned town),
the runners' way down, relic materials at the face, the heir keeping the galleries, and the line's record.

## The bottom
- **Gallery 5, the bottom** (on the coast, **Under the drowned town**): trade 7 in mining, a shop **RENOWNED**, 8,000 c and 16 oak.
  Opening it breaks through: in the Reach into the deep below the doors, on the coast into the drowned town from below.
- **Its face has a seam of its own:** the Reach's **deep floor** (the richest darkclay ore, 4, 6 or 8 a working), the coast's **drowned
  town's floor** (drowned silver, 2, 3 or 4). The narrow band, as darkclay's.
- **It's a deep gallery:** its shoring wears (8 oak a full shoring, 1,000 c to clear a fall) and it takes water (200 c to pump).

## A relic material at the face
- **A working of your own at the bottom's face turns up a relic material one time in 20**, whatever the haul's tier, and **never twice
  within 10 days**: any of the relic materials, as a runner's trip below brings. It goes in the store room, and THE BANK'S BOOK says where it came from.
- **A miner never brings one up** (they don't know it for what it is): the bottom's relic materials are for your own hand.
- WHERE IT COMES FROM lists the bottom of the mine for each relic material, once the mine is down there.

## Down through the mine
- **A new road for a runner, DOWN THROUGH THE MINE** (on the coast, Down through Wheal Isel), once the bottom is open. It goes where
  the road below the deep doors goes and brings back what that road does (relic materials, maybe; it can come back empty), but it's
  **9 hours, not 12**, and **half as dangerous** (hurt 6 %, killed 0.3 %, bare), for **300 c** of lamps and winding, not 400.
- **No shard of the Nine is found that way.** The plan's rule: the mine doesn't change the trail. The road below the doors still
  finds the shards that lie below, and the button says so.

## The line keeps the mine
- **The heir keeps the galleries** the line opened, in each region, with **the shoring gone old** (10 % left of 100, worn: the roof
  can come in at the first working), nothing fallen and nothing flooded. The first job is to shore them again. Each generation starts
  as deep as the last one got.
- **The trapdoor's open from the start**, whatever the heir's renown.
- **The heir has the face and the smelting at trade 2**, as every other trade the line hands on. A line that never opened the trapdoor
  hands on nothing of the mine, as before.
- **The miners don't come with it** (the heir hires their own staff).
- The hand-on page says what the line keeps of the mine, and **the line's record says how deep each generation's mine went**.

## The sim
**A shop that never opens the trapdoor is unchanged:** byte-identical to release 72 (a Reach run of 120 days, a coastal one of 90).
**Held to the fourth gallery** (`DEEPEST=4 NOSHAFT=1`), the mining bot's run is release 72's to the byte, but for the new counters.

**The bot** (`MINE=0.1`, no miners) opens the bottom when it can (days 29–74), digs there when its seam is the best, and sends its
runner down through the mine when no shard lies below (`NOSHAFT=1` keeps it on the road). The counts below are with the 10-day gap:

| | earnings vs release 72 | the ninth of the Nine: release 72 → with the bottom → the bottom, the road only | relic materials: found at the face / bought |
|---|---|---|---|
| the Reach, seed 3 | −0.3 % | day 93 → 84 → 84 | 3 / 23 |
| the Reach, seed 4 | −1.3 % | day 109 → 85 → 87 | 1 / 41 |
| the Reach, seed 6 | +1.2 % | day 99 → 110 → 88 | 3 / 34 |
| the coast, seed 6 | −3.8 % | day 88 → 76 → 89 | 4 / 31 |

- **The Crown's Factor is still where the relic materials come from:** 1–4 found at the face a run, against 23–41 bought.
- **The first runs had no gap:** a coastal seed found 17 at the face in about 60 days (drowned silver comes up ready, so the bot dug
  there a great deal), more than it bought. The gap holds it to one in a few weeks of digging, as the plan asked.
- **The Nine's pace is within the noise.** With the bottom the seeds finished on days 76–110, without it 88–109; the road down through
  the mine moved them both ways (84/84, 85/87, 110/88, 76/89). Four seeds can't tell a shift of a few days from that noise. Earnings
  move −4 % to +1 %.
- **Runners went down through the mine 40–47 times a run** once it was open, instead of the long road.

## A fix on the way
Since release 71, an heir's smelting pick could be moved once more by the old-save fix (darkclay ore picked → calamine). The heir's
save now carries the fix's mark, so its picks stay as they were.

## Tests
`tests/m48.test.mjs` (4 tests). Three older tests changed: milestone 45's heir now keeps the mine and the face at trade 2, and
milestone 46's take the first eight seams and the bottom as the gallery after the fourth.
