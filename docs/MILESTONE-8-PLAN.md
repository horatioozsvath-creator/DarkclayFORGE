# Milestone 8: The market

Status: built in release 16 with the recommended choices (one counter and one split; the same board for everyone each day; SAVE on the
forge screen). Two changes from the plan, found with the sim:

- **A buyer who comes in for what's in demand settles for what they meant to buy** when there's none on the shelf. Without this, the
  board cost every shop sales it couldn't make.
- **DEAR doesn't put buyers off an in-demand piece** (they take it as readily as at FAIR). Without this, pricing up for demand
  didn't pay.

Sim, 21 days, 8 seeds (`TOWN=0` for a bot that ignores the board): following the board (in-demand pieces swapped onto the shelf at
DEAR) earns about 5 % more than ignoring it on average (−6 % to +24 %). The board itself lifts income about 4–14 % over release
15, from the deeper purses for what's in demand.

The crafting side has grown a lot since milestone 3; the shop side hasn't caught up. This milestone makes selling a game of its
own: haggling that is a real back-and-forth, a town whose wants change so there's a reason to plan what to make, and a backup for
the save, which the plan promised in section 9 and was never built.

## 1. Haggling, done properly (fixes a dead end)

**What's wrong now.** A buyer whose purse is below your price says *"That's more than I carry"* and nothing else. MEET THEM is only
10 % off, so when the purse is lower than that too, there is no price you can sell at: the only choices are another piece or sending
them away. Checked with the rules: a Fine iron falchion at 168 c, a buyer with 134 c: HOLD and MEET both come back "over", every time.
A counter-offer can also be one they can't pay, and then they simply leave.

**The new haggle.** Still quick, still no dice: what happens follows from their mood and purse, as now.

1. You show a piece and choose **MEET (−10 %) · HOLD · ASK MORE (+15 %)**, as now. Within their purse, their mood decides, as now.
2. **Over their purse, they name a price** instead of a dead end: *"I can do 120 c. No more."* What they open with depends on
   mood: EAGER their whole purse, WARY 90 % of it, PINCHED 80 %.
3. You answer: **TAKE IT** · **SPLIT THE DIFFERENCE** (halfway between their offer and your price) · **NO** (they look at another
   piece, or go).
4. A split is accepted when it's within their purse, except that a PINCHED buyer goes to their whole purse once (*"That's
   everything I've got."*) and then holds there.
5. A counter-offer never goes above their purse.

Reading them still pays off. At Haggling 3 you see their mood, and so where their opening offer will be. At Haggling 4 you see their
purse, so you can show the right piece first. Splitting gives practice like asking more.

## 2. The town's wants (a reason to plan)

- **A notice board** in the shop (a tab next to THE LEDGER): **this week in town**. Two or three things in demand, changing every
  real day.
  - *"The watch is buying helms: helms sell for 25 % more and customers ask for them twice as often."*
  - *"A frost is coming: hoods, gloves and boots."*
  - *"The fair's on: rings and goblets."*
- **One thing out of favour**, for a while: *"Arrows are cheap off the river barges this week."*
- Customers' wants and the special orders lean toward what's in demand. Shown on the forge's pattern list as a small **IN DEMAND**
  badge.
- It runs on the real date, the same for every player that day, so friends can compare notes.
- Away time uses the week's wants as well.

## 3. A backup for the save

Everything lives in this browser's storage: clearing the site's data, or another phone, loses the game.

- **SAVE CODE:** a button that copies the whole save as text (and offers it as a file to keep).
- **LOAD CODE:** paste it, or open the file, on any browser. It checks the code first and asks before replacing a game.
- A quiet reminder once a week of play: *"Keep a save code somewhere safe."*

## 4. The balance check

- The sim (`tools/sim.mjs`) learns to haggle like a steady player (holds, splits when the offer is close) and follows the week's
  wants, so the balance check covers both.

## Not in this milestone (next ones)

- **Visit a friend's shop:** a link, like the card links, that opens someone's shop front in 3D: their layout, decor and wall, to look
  at, not to touch. Its own milestone: it needs a compact encoding of a room and the wall's cards.
- **The kettle's route to Old-Blood** (left at Rare in release 15).
- **Music.**

## What the build touches

- **shop.js:** the haggle's offer, split and final word, with tests: never over the purse, no dead end, every mood.
- **data.js:** each mood's opening offer; the town's wants (a list the week is drawn from); the reminder.
- **New wants module:** the week's wants from the date (no page access, tested): which, and how they shift prices and wants.
- **main.js and index.html:**
  - the counter's offer and split buttons;
  - the notice board tab;
  - IN DEMAND badges;
  - SAVE CODE and LOAD CODE (a small SAVE tab on the home screen).
- **save.js:** the code (packed, checked, versioned like the save itself).
- **sim.mjs:** haggling and wants.

About two sessions: haggling and the backup first (one release, since haggling is broken now), then the town's wants (a second).

## To decide

1. **Haggle rounds:** one counter and one split (recommended: quick at a busy counter), or as many rounds as you like until someone
   walks.
2. **The town's wants:** the same for every player each day (recommended), or each save's own.
3. **Where SAVE CODE lives:** on the home screen (recommended), or under the shop's ledger.
