# Milestone 35: the Nine in three months (release 60)

Asked for: make the Nine come a little faster. The target from the rarity plan, all Nine in about three months, had been close but
not met.

## The rules
- **A fallen star brings two shards** (was one): the first two of the star's shards still waiting, then the last. The toast names
  both. `TRAIL.star` in js/data.js.
- **A star's shard below the deep doors, now and then** (8 % a trip, `TRAIL.starBelow`): the star falls on the same days in every shop
  and can go weeks without falling. The trail's clue says so.
- **Below the deep doors, on the trail of the Nine,** a blueprint comes for a Relic one of the Nine grows from first; the Roadwalkers
  and Brannoc's Salve (no Mythic grows from them) come once those are all found. Before the trail opens, any blueprint, as before. Still
  one for a station the maker is good at first.
- **A Relic tonic given to a runner** (Wenna's Last Draught while its Mythic waits): the game asks first, as it does for a shelf or
  an order (release 59). A tonic carried is drunk on the road, and then it's gone. Gear isn't asked about: a Relic never breaks on the
  road, and a runner's gear comes home even if they don't.
- Nothing about the Relic or the Mythic working changed.

## The sim
- **A correction:** release 58's sim tried its Mythics without paying for them (the line that takes the materials had slipped into a
  comment). Fixed; release 58's figures were a little rosy for it.
- It buys a Relic's rare material from the Crown's Factor, keeps making a pattern whose Relic is still to make (for a Rare to work it
  from), fills an order from the shelf as well as the back room (it missed most of the Court's shard orders that way), and never kits
  its runner out with a Relic, nor sells a Mythic to the Court's offer.
- `START=n` begins the run n calendar days later. Every run had started on one date, so all met the fallen star on the same days.

## The pace (120 days, seeds 1–10, each starting on a different date)
- Old rules: all Nine in 6 runs of 10, days 79–119.
- New rules: **all Nine in all 10, days 72–109, median about day 87** of play; 6 by day 90, 9 by day 95. **Met.**
- Details in docs/RARITY-PLAN.md (release 60).

Tests: tests/m35.test.mjs (3); tests/trail.test.mjs allows a star's shard below. 244 in all.
