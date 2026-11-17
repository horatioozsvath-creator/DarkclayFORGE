# Milestone 29: more hands, and the worth at the forge (release 47)

No milestone was planned past 28; this one is the two things asked for in play.

## More than one runner

- **How many:** one at first, a second when the shop is KNOWN, a third from FAMED (`RUNNER_CAP` in `js/data.js`). Only hiring is held to
  it: a shop that slips a rung (renown counts the wall and the Hall) keeps the runners it has. A clerk and a night guard stay one each.
- **Each their own:** each runner has their own gear and potions, is sent on their own road (`St.sendRunner(save, route, now, id)`), and
  comes home on their own clock. Wages add up as before.
- **The hunt:** only one runner goes after a gang at a time; the road is hidden for the others while one is on it.
- **The books:** the tab's badge counts runners home and ready; the hire list says when the next runner opens ("a third when the shop is
  FAMED"); ON THE BOOKS counts against the cap.

## The worth at the forge

- Over the stage's top left: **WORTH AT LEAST** what the piece is worth at the least it can come out as (Common, or for a rework the tier
  it drops to), and **UP TO** what it's worth at the best it can still come out as (Rare once Rare has odds; for a rework the tier it
  takes to; for a master's brew Old-Blood). A brew's is a bottle's.
- **While shaping** a hit doesn't change the worth; a crack takes it down (a red drop). **Once it's made**, every strike that works it puts
  it up (a gold "+1 c"), till WORKED reaches +50 % (past that the odds still rise, the worth no more).
- One sum for the figure and the finished card (`R.worthOf`, used by `makePiece`; `R.worthNow(S)` for the working), tested to agree for
  every pattern. Hidden for a working that makes no card (a part of the Nine, a Relic or Mythic working, a bottle-maker).

## Checked

Tests: 201. In the browser at phone size, upright and on its side: two runners sent separately, each one's gear; a dagger from 24 c up to
30 c as it was worked, finishing Rare at the 120 c the figure showed. Not checked on a real phone.
