# Milestone 9: the kettle's road to Old-Blood

Status: built in release 18 with the recommended choices (no boil-over and WHITE HEAT; falling short makes an ordinary brew;
a second measure of herb and one more moonwell water). The sim's bot never takes up brewing (it sticks to the forge's best pieces),
so the economy check below wasn't run: a master's batch is worth at most about 800 c more than a Rare one, a small sale.

Builds on release 17. Release 15 made Old-Blood a master's last rework of a Rare piece and left brews and
bottles at Rare, because a brew can't go back on the fire: a batch is three bottles, sold one by one.

## The idea: a master's brew, chosen before the working

Instead of a rework, the kettle's Old-Blood is **a master's brew**: a working the player sets out to make as Old-Blood from the
start, on the prepare screen.

**Who can try it, and with what:**
- **Trade 6** in that brew (draughts, salves, oils or tonics, each its own trade, as now).
- **Moonwell water (✶)** chosen as the water.
- It costs **a second measure of the herb and one more moonwell water** on top of the batch's usual stuff and its three bottles.
- A **MASTER'S BREW** switch appears on the prepare screen once all of that is true. Until then the same place says what's
  missing ("trade 6 in tonics", "moonwell water in the pot").

**The working:**
- The simmer is **narrower** (the band ×0.8, like the forge's last rework: 40–75 becomes about 44–71).
- **WHITE HEAT** (the kettle's "rolling true") comes after **12 clean stirs** instead of 8.
- To come out Old-Blood it must finish with **not one boil-over** and **WHITE HEAT reached** at least once. A brew can't be
  reworked later, so it asks for both in one go.

**If it doesn't make it**, the batch is **an ordinary brew**, rolled as usual from how it was worked (Common, Fine or Rare). Nothing is
lost but the extra herb and water. That's gentler than the forge (where a failed attempt keeps a Rare piece unchanged), because
here there's no finished piece to fall back on.

**What it makes:** a batch of three, Old-Blood: the violet foil card with ×3, three affixes, the fourth lore line (already
written for every brew), worth twice a Rare batch.

| A bottle at FAIR | Rare | Old-Blood |
|---|---|---|
| Mending draught | 63 c | 126 c |
| Ghostcap draught | 173 c | 347 c |
| Ghostcap blade oil | 198 c | 396 c |
| Ghostcap tonic | 272 c | 545 c |

These sit within delvers', factors' and the wealthy buyers' purses, so unlike a top Old-Blood blade they sell readily, a bottle
at a time.

**Bottles from the glass stay at Rare:** they're stock for the kettle, not pieces to sell.

## Around the shop

- **Marrow the herbalist** (the regular who orders brews) can ask a famed shop for an Old-Blood brew, like the other regulars do for
  pieces. The famed-shop orders that leave out brews today take them in.
- **The wall:** an Old-Blood batch can hang like any piece (30 renown, 4 charm).
- **The 3D shelf:** its card stand shows the foil and ×3.
- **The notice board:** a fever in the lanes (draughts, salves, tonics in demand) is the day a master's brew pays best.

## The economy check (tools/sim.mjs)

The bot with a kettle tries a master's brew once it qualifies and can afford the moonwell water. It finishes with no boil-over and
WHITE HEAT about 40 % of the time at trade 6, more after.

Targets:
- The first Old-Blood batch no sooner than the forge's first Old-Blood.
- Income no more than about **5 %** above the same runs without it (brews are small sales).

## What the build touches

- **rules.js:**
  - the gate (trade, moonwell water);
  - the master's brew flag on a working: the narrower band, WHITE HEAT at 12;
  - the finish: Old-Blood with no boil-over and WHITE HEAT, else the ordinary roll.
- **shop.js:** the master's brew recipe (the extra herb and water), the famed regular's brew order.
- **main.js:** the MASTER'S BREW switch and what's missing, the prepare screen's words for it, the result's violet flourish (as the
  forge's), and the line when it falls short.
- **sim.mjs:** the bot's attempts, and a switch to run without them.
- **Tests:**
  - an ordinary brew never comes out Old-Blood;
  - the gate;
  - the narrower band and later WHITE HEAT;
  - success needs both no boil-over and WHITE HEAT;
  - falling short gives an ordinary roll;
  - the recipe's extra stuff;
  - bottles never Old-Blood;
  - a famed order for an Old-Blood brew that a master's batch fills.

About one session, one release.

## To decide

1. **What it takes to succeed:** no boil-over **and** WHITE HEAT (recommended: a brew gets one try), or no boil-over only, like the
   forge.
2. **Falling short:** an ordinary brew, rolled as usual (recommended), or nothing (the stuff spent and the batch spoiled).
3. **The extra cost:** a second measure of herb and one more moonwell water (recommended), or more bottles (a master's brew of two
   bottles, stronger, from the same pot).
