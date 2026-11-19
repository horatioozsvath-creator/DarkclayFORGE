# Milestone 46: going down (release 71)

Asked for: the mine's second milestone (docs/MINE-PLAN.md, "46: going down"). The third and fourth galleries, the shoring that wears
and the roof that can come in, water in the deep galleries, the rare seams, and pockets with old pieces in them.

## The deep galleries

| | opens with | the Reach | Wheal Isel (the coast) |
|---|---|---|---|
| gallery 3 | trade 5 in mining, a shop **SOUGHT**, 1,200 c, 8 oak | **The darkclay seam**: Veric's **darkclay seam** (darkclay ore), a **cobalt bed** | **Under the harbour**: a **sea-glass sand bed**, a thin **darkclay vein** |
| gallery 4 | trade 6, a shop **FAMED**, 3,000 c, 12 oak | **The old workings**: a **blackwater lode**, a **fallen star** (starmetal) | **The drowned level**: **drowned silver**, a **fallen star** |

- **Darkclay ore** smelts at the forge to darkclay steel (3 ore, 4 to 6 bars, as the other ores). A darkclay seam's band is the
  darkclay's own: narrow, GREATs and falls both. A haul is 3, 4 or 6 ore (the coast's thinner vein 2, 3 or 5).
- **The fourth gallery's seams come up ready to work**, a little at a time: blackwater iron and drowned silver 1, 2 or 3 a working,
  starmetal 1, 1 or 2. Starmetal's is the narrowest band in the mine.
- The mine screen lists the open galleries' seams and the next gallery's (dimmed), so a player sees what's below.
- WHERE IT COMES FROM lists each of them as dug at the face, with the gallery and the trade it takes.

## The shoring
Each gallery has its timbers, out of 100 (THE MINE › **THE GALLERIES**, with a bar like a station's wear).
- **Every working at the face wears them 4**, and 3 more for each **rockfall**: a swing while the rock is too hot (the same
  moment that slips a CRACK in from trade 3, but counted at any trade). The strip's own cracks don't wear the timbers.
- **Worn (30 or less), the roof can come in** after a working: the odds grow from nothing at 30 to one in two at 0, and it always
  comes in at 0. You get out with the haul. When a gallery's shoring drops to worn, a word says the timbers are creaking.
- **A fallen gallery is shut** till the fall's cleared: its seams can't be dug, and DIG AGAIN on one sends you back to the mine with
  the reason.
- **SHORE IT** takes oak for what's worn (a full shoring is 2, 3, 5 or 6 staves by the gallery; at least one). **CLEAR AND SHORE
  IT** after a fall takes the full oak and coin (40, 80, 250 or 500 c).
- Each region's mine keeps its own timbers.
- **On the gentler Reach, or in the week of grace, nothing wears** and the water stays out, as with the stations' wear.

## The water
- **The deep galleries (3 and 4) take water**: in the Reach after a night's rain (about one day in six), on the coast at the spring
  tides (two days in every fifteen). The days are the same for every shop, as the star's are.
- **A flooded gallery can't be dug.** It drains of itself 36 hours after the water came in, or **PUMP IT OUT** for 60 c (gallery
  3) or 120 c (gallery 4). Each gallery is pumped on its own.

## Pockets
**A Rare haul in a deep gallery breaks into a pocket half the time**: old coin (30–90 c), or an old piece left in the rock (Common or
Fine, by "an old maker", into the back room, as a seller's). **In the fourth gallery, now and then a blueprint**: one still to be found
below the deep doors (never a great story's), about one pocket in eight while any are left. It goes in the drawer, and THE BANK'S BOOK
says where it came from. The result shows what the pocket held.

## Changes from the plan
- **Pockets come from a Rare haul, not a TRUE blow.** The face has no TRUE: a Rare haul is what a working well done gets there.
- **The beasts from below gallery 4 wait for milestone 47**, with the miners they'd hurt, and their gear.
- **The plan's "a session at the face, then clearing"** is still left out (see milestone 45): the shoring is the mine's cost now.

## A fix on the way
A haul or a smelt that drops a tier no longer says it's "flawed, and worth less" (words for a piece): it says what it came out as.

## An old save's smelting pick
Darkclay ore comes before calamine in the smelting list (a coastal option has to be last, so the Reach can leave it off). A release-70
save that last picked calamine has its pick moved to match, once.

## The sim
**A shop that never opens the trapdoor is unchanged.** With the mining bot off, the sim's output is byte-identical to release 70's on
five runs (two Reach first generations of 120 days, a coastal one of 90, two Reach heirs). And with the shoring off and the bot held to
the second gallery (`NOSHORE=1 DEEPEST=2`), the mining bot's run is release 70's to the byte.

**The mining bot** (`MINE=share`) now opens the third and fourth galleries when it can, shores a gallery when it's worn (or clears a
fall), and pumps out its best seam when it's flooded. It picks a seam by what a working there is worth with the smelting it takes after,
and a seam that brings up something the bot can't use (sand without a glass) isn't worth digging. It takes a rockfall 4 workings in 10.

**Against the same seeds without the mine** (the Reach 120 days, the coast 90; the mine a tenth of the workings):

| | earnings | the ninth of the Nine |
|---|---|---|
| the Reach, seeds 1–12 | −4.1 % to +4.0 %, middle −1.8 % (release 70: middle −2.4 %) | middle day 81; without the mine 76, release 70's mine 77.5. Seed 7 not by day 120 |
| the coast, seeds 3, 6–12 | −3.8 % to −0.5 %, middle −3.4 % (release 70: −2.2 %) | by day 90 in 6 of 8, as without the mine and as release 70 |
| a fifth: Reach seeds 1, 2; coast 3, 6 | −6.5 %, −1.1 %; +0.8 %, −5.4 % | days 84, 85; 69, 86 |

- **Time in the mine still earns about what time at the stations does**, a little less. By the end the bot's best seam is the
  darkclay (the Reach) or the sea-glass sand bed (the coast, for its glass).
- **The shoring costs little and is no danger to a player who keeps it up:** 11–15 shorings in a Reach run (41–56 oak and
  1,200–1,850 c, with the pumping), and no roof came in, since the bot shores at worn. The Reach's deep galleries flooded under the bot
  10–17 times a run.
- **Pockets:** 7–18 a run (old pieces and coin); one blueprint in twelve Reach runs.
- **The Nine in the Reach comes about four days later with the mine than without** (middle day 81 against 76), and one seed in twelve
  didn't finish by day 120. The pace is noisy (one seed lands anywhere from day 74 to day 110 with only the order of its dice changed),
  and on the coast it doesn't move. It's later, not sooner: the mine isn't a shortcut to the Nine.

**A bot fix on the way.** The first runs of this milestone put the Nine 8 days later. Comparing the bot to release 70's byte for byte found
why: the new seam scoring had the bot digging sand it couldn't use instead of ironstone. With that fixed, the runs above.

## Tests
`tests/m46.test.mjs` (7 tests). Three milestone-45 tests changed: the seams and the smelting list now have the deep galleries' after
the first four, and the gallery after the second is the third.
