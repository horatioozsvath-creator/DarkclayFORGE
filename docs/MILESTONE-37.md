# Milestone 37: handing on the forge (release 62)

Asked for: the second part of the legacy (docs/LEGACY-PLAN.md). A Maker of the Nine hands the forge to their apprentice and plays on as
them, a generation later.

## When
- **A Maker of the Nine**, with an apprentice who has been with them **14 days** (`LEGACY.days`). Hiring now stamps `hiredAt`.
  Apprentices hired in release 61 count from the hour in their id.
- The ending has a second button, **HAND ON THE FORGE**, and the trail (THE FORGE › WORKSHOP) keeps it. Until it can be done, the
  ending says what it waits on: an apprentice, or so many more days.

## The handing-on
- The dialog names the heir and says what the line keeps and what starts over. You choose the heirloom, and the dialog offers this
  shop's save code to copy. It's asked twice ("This can't be undone").
- The heir's shop is built from a fresh save with only what the line keeps (`js/legacy.js`, `handOn`). The old save object is left
  as it was until the new one is stored.
- If the browser won't hold the old shop's code in the record, you're asked whether to hand on without the code. If it won't store
  even that, nothing changes.
- The page then reloads straight into the new shop, with the heir's opening ("SECOND OF THE LINE").

## What the line keeps
- **The book:** patterns found, tries and clues. **The blueprints**, known but not made. **The found tiles** and the picks.
- **The heir's trades:** their own, as they learned them at the bench (up to trade 5), and **trade 2 in every other pattern**.
- **The heir's trait**, for good. Each is small (`LEGACY.trait`):
  - Careful: the heat band 6 % wider.
  - Swift: the work cools 8 % slower.
  - Thrifty: the staff's wages a tenth lower.
  - Bright: trades learned 15 % faster.
- **The heirloom:** one Old-Blood piece, Relic or Mythic of the maker's own (no flyer copies). With none in the shop, the forge
  goes on without one.
- **The line's name:** the sign reads "OF THE LINE OF <old maker>".
- **The player's own settings:** the shop's id (its links), the gentler Reach, hints, the kept shops.

## What starts over
- Coin (a purse of 300 c), renown and the room.
- The stations (the forge only), the tools and the skills, the haggling.
- The staff, the shelves and the back room, the materials.
- The Bank, the Hall, the wall, the trophies.
- The trail of the Nine: shards, parts, Relics and Mythics made.
- The regulars and the second shop.

## Decided while building (differs from the plan)
- **The heirloom hangs over the shop door, not in the Hall.** The new shop has no Hall until RENOWNED, and a Mythic in the Hall adds
  200 renown, which would make the heir SOUGHT on day one (rule 3: "a fresh climb, not a free one").
  - It's kept outside the cards (`save.heirloom`), so no shelf, order, rework or runner can reach it.
  - It brings the charm it would bring in the Hall (Mythic +6, Relic +3, Old-Blood +1) and **no renown**.
  - It shows under THE LINE on the trail page, not in the 3D shop yet.
- **The head start doesn't count toward the maker's level.** Trade 2 everywhere and five at trade 5 would have made the heir maker
  level 8: seven of the nine skill points on day one. `save.inheritedXp` is taken off the practice, so the heir earns the skills back
  by working in their own shop. Trade levels themselves are kept.
- **The record is on the trail page (THE LINE)**, a first version of milestone 38's. It shows:
  - each generation's maker, renown, pieces made and sold, the heirloom passed on and the Hall's pieces;
  - the days from start to the Nine, for generations that began after this release;
  - a button to copy each old shop's save code, to load into another slot.
- **The record's codes don't nest:** each old save is coded without its own record. A code is about 180 KB for a big shop, so a slot
  holds a few generations before the browser's room runs short. When it's full, the game asks whether to hand on without the old
  shop's code, and changes nothing if even that won't store.

Tests: tests/m37.test.mjs (5). 256 in all.
