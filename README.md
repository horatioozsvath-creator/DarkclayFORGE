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
sed -i '' -E 's/\?v=[0-9]+/?v=3/g' index.html js/*.js
```

## Status

Milestones 1 and 2 of 7: the forge, and the shelf and the till. See `docs/PLAN.md`.

Fonts: Alegreya and Alegreya Sans, SIL Open Font License.
