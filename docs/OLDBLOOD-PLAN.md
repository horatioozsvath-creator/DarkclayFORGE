# A fourth tier: Old-Blood

Status: built in release 15, with the four recommended choices (Old-Blood; rework only; a failure stays Rare and the piece is untouched; brews and bottles stop at Rare).

Sim (21 days, seeds 1–3, `OLD=0 node tools/sim.mjs 21 <seed>` to compare): the first Old-Blood on day 6–12, about one an hour of play
after that, 21-day income −9 %, +1 %, +6 % against the same runs without it.

## Where it comes from

Darkclay Zero already has the ladder: Common, Fine, Rare, **Old-Blood** (the top tier a maker can craft), then Relic and Mythic
(found only, never made). Its numbers are in `data/zero/tiers.json`; its card is framed in **violet `#b48cf0`** with a foil sheen
(`docs/THE-CARD.md`). The Forge takes Old-Blood as its fourth tier, so a card made here looks like one from Zero.

| | Common | Fine | Rare | **Old-Blood** |
|---|---|---|---|---|
| Frame | bone | green | blue | **violet, with foil** |
| Stats (mult) | ×1.00 | ×1.10 | ×1.22 | **×1.36** *(Zero)* |
| Affixes | 0 | 1 | 2 | **3** *(Zero)* |
| Worth | ×1 | ×2 | ×4 | **×8** (the Forge's doubling; Zero's is ×20 on its own scale) |
| On the wall | 2 renown | 5 | 12 | **30** renown, charm 4 |

## How it's made: earned, never rolled

A working's roll still tops out at Rare. Old-Blood is a **last rework** of a Rare piece, open only to a master of that trade:

1. **The piece:** Rare, not flawed, and it must carry something special: **a rare part (✶)** in its making (blackwater iron,
   starmetal, starglass, wyvern sinew, moonwell water…) **or WHITE HEAT** written on the card.
2. **The maker:** **trade 6** in that pattern.
3. **The cost:** three times the plain rework's material, **plus one rare material** of that station (the forge: blackwater
   iron; the stretcher: winter fox; the bench: wyvern sinew; glass: starglass). Bought, found by the runner, or salvaged.
4. **The working:** the rework strip, but **narrower**: the meter's band at ×0.8 and WHITE HEAT after 12 clean instead of 8.
   It must finish with **no crack at all**.
5. **If it fails** (a crack, or dropped), the piece **stays Rare**, and the materials are spent. It never drops a tier on this
   attempt: a master's gamble costs coin, not the piece.

On the rework screen, a Rare piece that qualifies shows **TOWARD OLD-BLOOD** and what it needs. One that doesn't shows what's
missing ("needs trade 6", "needs a ✶ part or WHITE HEAT").

**Not in the first release:** brews (they can't be reworked today) and the glass's bottles stay at Rare at most.

## The card, the shelf, the moment

- **The card:** a violet frame, a slow foil sheen across it (still when the player has asked for less motion), and
  "OLD-BLOOD" across the top. Its third affix is listed like the other two.
- **The 3D shelf:** the card's face gets the sheen baked in, and a faint violet glow at its foot, so it stands out in the case.
- **When it takes:** the result screen's flourish in violet, *OLD-BLOOD · STEEL FALCHION*, a deeper ring than WHITE HEAT, and
  its own sound.
- **Each card's lore:** every pattern gets a fourth line (there are 21 patterns; brews and bottles get theirs for later).

## The shop

- **Who buys:** Old-Blood prices sit above most purses. **Collectors** (purse 500–1,600) are the buyers, and factors at their
  richest; the rest look and leave. Renown already grows purses, so a renowned shop sells them more often.
- **The wall:** worth keeping. 30 renown and 4 charm each, so one Old-Blood on the wall moves the shop's renown more than
  two Rares.
- **Special orders:** at the top renown rung, a regular may ask for an Old-Blood piece. Orders pay twice the worth, so it's the
  best single sale in the game.
- **Breaking down:** an Old-Blood piece gives back its rare part too, like a Rare.

## The economy check (tools/sim.mjs)

The bot tries for Old-Blood once it can: a qualifying Rare in the back, trade 6, and the rare material affordable. Targets,
after Zero's own (`docs/BALANCE.md`: a smith's Old-Blood about 0.6–1.6 an hour, late):

- None before day 5 of steady play. **About one every one to two play-hours** after trade 6.
- Daily income in the last week rises **no more than about 15 %** over the same run without Old-Blood. Collectors are few, so
  most Old-Blood pieces go on the wall or wait.
- If either is off, the knobs are the rare material's cost, trade 6, and the band ×0.8.

## What the build touches

- **data.js:** the fourth tier, wall renown, each pattern's fourth lore line, each station's rare material for the attempt.
- **rules.js:**
  - rework past Rare with the gate;
  - the narrower strip;
  - "stays Rare" on failure;
  - three affixes, which the affix code already handles by count.
- **shop.js:** `canRework` with the gate, the Old-Blood cost, salvage, collectors' want, the special order.
- **card.js and CSS:** the violet tier colour and the foil (with reduced motion respected).
- **diorama.js:** the card face's sheen and its glow.
- **main.js:** the rework screen's TOWARD OLD-BLOOD, what's missing, the result flourish, tier colours.
- **share.js:** nothing; it already accepts any tier in the list, so a shared Old-Blood card opens anywhere.
- **Tests:**
  - no working ever rolls Old-Blood;
  - the gate (trade, ✶ or WHITE HEAT, not flawed, not a brew);
  - failure stays Rare;
  - three affixes;
  - an older save loads unchanged;
  - a shared Old-Blood card decodes.
- **Sim:** the bot's attempts and the two targets above.

About one session, one release.

## To decide

1. **The name:** *Old-Blood* (Zero's, recommended: the cards match across the two games) or something of the Forge's own,
   like *Masterwork*.
2. **Earned only by rework** (recommended), or also a very small chance on an ordinary working at trade 8 with WHITE HEAT and a
   TRUE.
3. **On failure:** stays Rare and the materials are lost (recommended), or Zero's usual rule (a second crack drops a tier).
4. **Brews and bottles:** leave them at Rare for now (recommended), or give the kettle its own route later (a batch brewed in
   WHITE HEAT with moonwell water).
