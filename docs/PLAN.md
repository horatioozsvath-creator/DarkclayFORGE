# DarkclayFORGE — build plan

Status: plan only. Nothing is built. Numbers here are first guesses for a balance pass.

## 1. What the game is

A crafting and shop-running web game set in the Darkclay Zero world. You work pieces
at a station using the tile-strip system from The Working, each finished piece becomes
a collector card, cards go on shop shelves, and customers buy them. Coin pays for
better tools, staff and a bigger shop, which raise the price of what you make.

- Played from a link, hosted on GitHub Pages, no server.
- Solo. Progress saves in the browser. Cards can be shared as view-only links.
- Phone (portrait) and desktop (landscape) get equally tuned layouts.
- 2D screens for crafting, cards and menus, over a 3D shop diorama you arrange.

## 2. The loop

1. **Stock up.** Buy materials from suppliers, buy loot and old gear from customers,
   collect what runners brought back, salvage pieces you don't want.
2. **Prepare.** Pick a pattern and the material for each part. The first part's
   material sets the strip. Choose found tiles to bring. The strip is shown face up.
3. **Work it.** Heat into the band, strike to turn tiles (GOOD, GREAT, HOLD, CRACK,
   TRUE, found tiles), fill SHAPE, push for Fine and Rare odds, quench when you choose.
4. **The card.** The result is a collector card with stats, affixes and its making.
5. **Shelve and price.** Place the card on a shelf, tag it CHEAP, FAIR or DEAR, or
   keep it on the display wall.
6. **Sell.** Haggle at the counter yourself, fill special orders, or leave it to the clerk.
7. **Improve.** Spend coin on tools, station upgrades, shelves, floor space and staff.
8. **Away.** Clerks sell and runners travel on the real clock, up to a cap. You return
   to a ledger of what happened.

## 3. Crafting (forge only in the first version)

Carried over from The Working mockup and Darkclay Zero's `THE-WORKING.md`:

- Strip of about 20 tiles built from the blade metal (iron, steel, bronze, silver,
  darkclay steel), then stacked by trade level, hammer, gloves and found tiles.
  Every change to the strip is listed so nothing is hidden.
- Heat meter with a gold band. Cools while waiting and per strike. Struck cold slips
  a CRACK in. Back in the fire reshuffles every tile.
- SHAPE fills in about 16 good strikes. After that each strike raises WORKED.
- WHITE HEAT or a TRUE earns a pick of one of two affixes.
- A clean, fine working can turn up a new found tile.
- **Rework:** a finished piece can go back in the fire toward the next tier.
- **Failure:** a bad working makes a worse piece (lower tier, cracks recorded on the
  card, lower worth). Materials are never lost outright.
- First patterns: falchion, dagger, axe head, helm, ring. More patterns unlock by renown.

## 4. Cards

Layout follows Darkclay Zero's `THE-CARD.md` and `mockups/cards302.js`.

- Top: tier word, kind, name, picture, dice.
- Body: stats with bars, affixes in the tier colour, THE MAKING (maker's mark, WORKED %,
  strikes, heats, cracks, WHITE HEAT, metal), lore line, worth.
- Small form (top only, price on a corner) for shelves and lists.
- Tiers: Common, Fine, Rare, Old-Blood, Relic, Mythic, with Zero's colours and glows.
- **Sharing:** the card's data is packed into the link itself. The receiver sees the
  card, view only. No account, no server.
- **Display wall:** kept pieces hang in the shop and add to renown.

## 5. The shop

- **Diorama:** an angled cutaway room in Zero's toon style. Shelves, the forge, the
  counter and decorations sit on a grid and can be moved. Tapping one opens its 2D screen.
- **Customers** arrive with a want, a purse and a mood (EAGER, WARY, PINCHED).
  - Price tags: they buy on their own if the tag suits their purse and mood.
  - Haggle: when you serve them, offer a piece and play a three-choice haggle.
  - Special orders: regulars ask for a specific piece by a deadline for a bonus.
  - Some customers sell materials, loot or old gear to you.
- **Suppliers** sell materials at changing prices. Better suppliers unlock with renown.
- **Expansion:** more floor tiles, more shelves, better shelves (raise what customers
  will pay), a longer away cap, later the other stations.
- **Money:** wages are the only running cost. If you can't pay, staff stop working
  until you can. The shop can't be lost.

## 6. Employees

Each hire is a named person with a trait, a wage and a skill that grows with practice.

- **Counter clerk:** sells shelf stock at the tag price, less a margin that shrinks
  as their skill grows. Works while you craft and while you're away.
- **Runner:** goes out for materials, old gear and the occasional found tile. Trips
  take real time; longer trips bring rarer goods.

No apprentice crafter. All crafting is the player's.

## 7. Progression

- **Trades by practice:** each kind of piece levels from making it. Levels turn CRACKs
  into GOODs and open found-tile slots (0, 1, 2, 3 at levels 1, 3, 5, 7).
- **Tools and station upgrades:** hammers, gloves, anvil, fire. Each stacks the strip
  or changes the heat band.
- **Maker's renown:** grows from fine work, filled orders and the display wall. Brings
  richer customers and unlocks suppliers, patterns and regulars.
- **Skill tree:** character levels give points for three branches: crafting, haggling
  and management.

## 8. Away time

- Runs on the real clock while the tab is closed, capped at 8 hours to start.
- On return, the game works out sales and trips in one pass and shows a ledger.
- Sales stop when shelves are empty, so stocking before leaving matters.

## 9. Tech

- Plain HTML, CSS and JavaScript modules. No build step, so GitHub Pages serves the
  repo as is.
- 2D screens in HTML/CSS/SVG, adapted from Zero's mockups (cards, clay tiles, palette,
  Alegreya fonts vendored locally).
- 3D shop in Three.js (vendored in the repo), models as compressed GLB.
- Game rules in plain JS modules with no page access, so they can be tested alone.
- Content in JSON, trimmed from Zero's `data/zero/*.json` (tiers, materials, recipes,
  affixes, finds, values).
- Save in the browser's local storage, versioned, with an export/import code as backup.
- Sound: simple effects (strike, hiss, coin, door bell). No music in the first version.

## 10. Art

- Reuse Darkclay Zero's Blender models, trimmed and re-exported as GLB for phone
  loading: forge, anvil, shelves, counter, a few customers, decorations.
- Item pictures on cards reuse Zero's item icons where they exist.
- Meshy and Godot aren't needed for the first version.

## 11. Milestones

1. **The forge.** Prepare, the working, the result card. Trades level by practice.
   Playable on phone and desktop. Saved locally.
2. **The shelf and the till.** Inventory, shelves, price tags, customers buying, coin,
   suppliers. A flat 2D shop view stands in for the diorama.
3. **The counter.** Haggling, special orders, customers who sell to you, salvage, rework.
4. **The staff and the clock.** Clerks, runners, wages, away time and the ledger.
5. **The diorama.** 3D shop with grid placement, Blender models, expansion.
6. **Growth.** Tools and station upgrades, renown, skill tree, display wall, shared
   card links, sound.
7. **Balance and polish.** Tuning pass, onboarding, then the next station.

Each milestone ends in something playable from the GitHub Pages link.

## 12. GitHub

- Repo: `horatioozsvath-creator/DarkclayFORGE`. Pages serves the main branch.
- Game at `https://horatioozsvath-creator.github.io/DarkclayFORGE/`.
- Updates go out by pushing to main. Pushes happen only on your say-so.
