# Milestone 30: where things come from (a plan)

Status: planned (2026-11-17), nothing built. Builds on release 47.

## What prompted it

"I don't know how to make arrowheads." Every material a pattern needs can already be had: nothing is a dead end. But some of the routes
are hidden:

| Needed by | What | Where it comes from today | Where you'd look |
|---|---|---|---|
| Arrows (bench) | Arrowheads | forged at once from 1 iron (makes 2), or bought dearer from Hollin's Timber | a button at the *bottom of the bench's list*, under "Parts from the forge" |
| A staff (bench) | A ferrule | forged at once from 1 iron, or bought from Hollin's Timber | the same |
| Every brew (kettle) | Bottles | blown at the glass (BOTTLES, 6–10 a working), or bought from the herb seller | nowhere says so |
| The ✶ parts | Moonwell water, Starmetal, Wyvern sinew, Winter fox, Silver thread, Starglass, Blackwater iron, Bog oak | only from a runner's longer roads (rare things) | nowhere says so |

On the arrows' prepare screen, short of heads, the only offer is BUY WHAT'S SHORT, and when Hollin isn't in the pedlar's pack that hour
it just says they're not in the pack: a dead end on screen, though one bar of iron would do.

## What it holds

1. **Short of something? The way to get it, right there.** On the prepare screen, beside each material you're short of:
   - **arrowheads, a ferrule:** FORGE THEM · 1 IRON (at once, no working), then back to the same screen ready to work;
   - **bottles:** BLOW BOTTLES AT THE GLASS (opens the glass's BOTTLES pattern), or the herb seller when they're in;
   - **a ✶ part:** "a runner brings these from the Reach and the deep doors" with a link to the runners;
   - **anything sold:** which seller, and when they're next in, instead of only "not in the pack this hour".
2. **The forge shows what it makes for the others.** A FOR THE OTHER STATIONS row under the forge's patterns (arrowheads, the
   ferrule), not only at the bottom of the bench. Shown once the bench is set up (the forge's list stays short before then).
3. **Every material says where it comes from.** Tap one in the store room (or on a prepare screen): who sells it and at what, which
   station makes it, which roads a runner finds it on, the Deep for relic things. One table in the code drives all of it, and a test
   makes sure every material any pattern needs has at least one route.
4. **The likely worth at the forge** (optional, see below). Beside WORTH AT LEAST and UP TO, what it's *likely* worth: the worth at
   each tier weighed by your Common/Fine/Rare odds. It climbs on most strikes once the piece is made, a coin or several at a time, as
   the Fine and Rare odds rise.
5. **The release:** checked upright and on its side; the real-phone check for releases 45–47 as well.

## To decide

1. **Item 4, the likely worth:** add it (recommended: it's the figure that visibly rises each hit), or keep the forge's panel as it is.
2. **The forge's FOR THE OTHER STATIONS row:** once the bench is set up (recommended), or always (a hint of what the bench needs).
3. **Anything else for milestone 30** from play (balance after the Relics, more for the runners, sounds and hints): or keep this one
   small and quick.

## Decided (2026-11-17)

Built as planned with the likely worth; the forge's row once the bench is set up.

## Milestone 30, as built (release 48)

- **A correction to the plan:** Hollin's Timber always has arrowheads and ferrules (they're staple lines), so the arrows' prepare screen
  was never a dead end; it only offered the dearer way. And Nell Quarry's Pack has two of the ✶ things each hour, so they aren't only a
  runner's.
- **Where things come from** (`js/sources.js`): `sourcesOf(mat)` lists every way to get a material (forged at once, made at a station,
  a seller, the pedlar some hours, a runner's roads, below the deep doors); `nextSold(mat, hour)` says when a seller next has it;
  `neededMats()` is every material a pattern can call for. A test makes sure each has a way.
- **Short on the prepare screen:** under BUY WHAT'S SHORT, each short material with its ways: FORGE 2 ARROWHEADS · 1 IRON BAR (at
  once, then back to the same screen, ready to work); MAKE BOTTLES AT THE GLASS (opens the glass's BOTTLES, or "set up the glass
  first"); when a seller doesn't have it this hour, when they will; for a ✶ thing, the roads, and SEND (or HIRE) A RUNNER.
- **The forge's FOR THE OTHER STATIONS:** the arrowheads and ferrule buttons under the forge's own patterns once the bench is set up
  (and still under the bench).
- **The store room:** tap any material: what you have, its price this hour, where it comes from, what it goes into.
- **The likely worth:** the forge's panel now leads with LIKELY WORTH (each tier's worth weighed by the odds as they stand), with AT
  LEAST and UP TO beneath. It climbs a few coins on most strikes once the piece is made (a dagger: 30 c to 40 c in ten strikes).
  A rework and a master's brew have no roll, so they keep WORTH AT LEAST.
- Tests: 205. Checked in the browser at phone size: forging heads from the arrows' screen, MAKE BOTTLES from a salve, a material's
  page, the likely worth climbing. Not checked on a real phone.
