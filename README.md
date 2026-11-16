# Darkclay Forge

A crafting and shop-running web game set in the Darkclay world. Work a piece at the forge tile by tile, keep it as a collector card, and (in later milestones) sell it from your own shop.

Plain HTML, CSS and JavaScript modules. No build step: GitHub Pages serves the repository as it is.

## Play it locally

ES modules need a web server, so opening `index.html` from the file system won't work.

```bash
python3 -m http.server 8417
```

Then open http://localhost:8417.

## Tests

The rules have no page access and run under Node.

```bash
npm test
```

## Layout

- `index.html` — the page and its screens: the forge, the shop, suppliers, PREPARE, THE WORKING, THE RESULT
- `js/data.js` — patterns, metals, affixes, found tiles, tiers
- `js/rules.js` — the strip, the working, the result, the card's numbers, trades by practice
- `js/shop.js` — materials, suppliers and prices, the shelf and its tags, customers and sales
- `js/staff.js` — hiring, wages, the runner's trips, and the shop while the page is closed
- `js/growth.js` — tools, the maker's level and skills, renown, the display wall
- `js/share.js` — a card as a link (`#card=`), checked before it's shown
- `js/sound.js` — the sounds, made with WebAudio
- `js/room.js` — the shop front and the workshop: grids, furniture, moving, buying, selling back, growing
- `js/diorama.js` — the shop in 3D (Three.js, loaded when the shop opens)
- `assets/models/` — Darkclay Zero's props and townsfolk as GLB, rebuilt by `tools/models.sh` (needs Blender and the DarkclayZERO folder)
- `tools/station_props.py` — the bending bench and glass furnace, built in Blender with Zero's own kit so they match its props
- `vendor/three/` — Three.js 0.170 (MIT)
- `tools/sim.mjs` — the economy played by a bot (`node tools/sim.mjs 14 1 45`: 14 days, seed 1, 45-minute sessions)
- `manifest.webmanifest`, `assets/icons/` — so the game can be added to a phone's home screen
- `js/main.js` — the screens and the controls
- `js/stage.js` — the canvas: fire, anvil, piece, hammer, heat meter
- `js/tiles.js`, `js/card.js`, `js/save.js` — clay tiles, collector cards, the browser save
- `css/working.css` — the working's styles, from the Darkclay Zero mockup
- `css/game.css` — the home screen, the card, and the game's own changes
- `docs/PLAN.md` — the build plan and milestones
- `docs/the-working-mockup.html` — the original mockup the crafting follows

## Releasing

Browsers and GitHub Pages cache files for a few minutes. Each release bumps the `?v=` number on every script import and stylesheet link (in `index.html` and `js/*.js`), so a player never runs a new file against an old one:

```bash
sed -i '' -E 's/\?v=[0-9]+/?v=14/g' index.html js/*.js
```

## Status

All seven milestones and five stations: the forge, the stretcher, the bench, the kettle and glass (`docs/STATIONS-PLAN.md`). See `docs/PLAN.md`.

Open the game with `?debug` on the address to reach the save from the browser console as `forge.save`; `forge.wipe()` starts a fresh save.

Fonts: Alegreya and Alegreya Sans, SIL Open Font License.
