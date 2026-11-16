# The next stations: bench, kettle, glass

Status: plan only. Builds on the forge and the stretcher (milestones 1–7). Numbers marked *Zero* come from Darkclay Zero's
`docs/THE-WORKING.md` and `data/zero/working.json`, where they were already tuned with a sim; the rest are first guesses for the
balance pass (`tools/sim.mjs`).

## What every station shares (already built)

The strip of clay tiles, SHAPE then PUSH, found tiles, the pick, practice by trade, tiers, affixes, rework, breaking down, the card,
the shelf, orders, the 3D room, sounds, hints. A new station is: its meter and its two twists, its stuff (the first part, which sets
the strip), its patterns and parts, its materials and who sells them, its customers' wants, its stage drawing, its model in the
room, and its cost to set up. The stretcher showed the pattern; each of these is about the stretcher's size of work.

## 1. The bench: bows, staves and arrows

| | |
|---|---|
| Meter | **STEAM**: SET / PLIANT, band 40–100, drain 5 · cool 3 · rise 30 *(Zero)* |
| Under the band | **splits**: a CRACK slips in face down (from trade 3) |
| Over the band | nothing (the band reaches 100) |
| Its own twist | **the grain**: 2.6 s with the grain, 1.4 s across it; a bend across the grain turns nothing over *(Zero, tuned)* |
| Words | INTO THE STEAM · BEND · STRING |
| Stuff (sets the strip) | birch (easy, band ×1.15), yew (the baseline), oak (hard, ×0.85), old yew (rare-ish, trade 4) *(Zero's strips)* |
| Parts | String: gut, silk, wyvern sinew ✶ · Nocks: horn, bone, starmetal ✶ |
| Patterns | **Shortbow** (60), **Longbow** (160, trade 3), **Staff** (a focus, 90), **Arrows** (a sheaf, 18: cheap and quick) |
| Customers | a new **hunter** type (purse 20–150, wants bows and arrows); guards and delvers want bows too |
| Model | Zero's `Prop_bench_meshy` or `Stage_bench` (a bending bench with its steam box) |
| Set up | 2,000 c |

The grain is the one new rule: a drawn arrow on the stage shows WITH THE GRAIN or ACROSS · WAIT, and the hint teaches it.

## 2. The kettle: draughts, salves, oils

| | |
|---|---|
| Meter | **THE BOIL**: COOL / SIMMER / ROLLING, band 40–75 *(Zero)* |
| How it moves | different from every other station: **no drain a stir**; the boil **settles 7 a second**; **STOKE** adds 22 at once (it never goes "in" anything) *(Zero)* |
| Under the band | **doesn't take**: a stir turns nothing over |
| Over the band | **boils over**: a CRACK slips in and the boil drops 30 |
| Words | STOKE · STIR · STOP |
| Stuff | mending herbs (the baseline), ghostcap ✶ (a TRUE, a touchier boil), emberroot, sleepmoss |
| Parts | Water: well, spring (a gentler simmer) · Binder: honey, wax, tallow |
| Patterns | **Draught of mending**, **Salve**, **Blade oil**, **Night tonic** (trade 4) |
| Customers | every kind buys these; folk and delvers most; cheap, quick sales |
| Model | Zero's `Prop_hearth_kettle` (cel-built) |
| Set up | 1,500 c |

Brews in Zero have no tiers. Here the choice is open (question 2 below). The kettle is also where **bottles from the glass**
come in, if the glass is built (question 4).

## 3. Glass: panes, lenses, bottles

| | |
|---|---|
| Meter | **THE GATHER**: STIFF / SOFT / RUNNING, band 40–80, drain 5 · cool 5 · rise 30 *(Zero)* |
| Under the band | **shatters**: the very next tile turned is a CRACK (not a random one) *(Zero)* |
| Over the band | **sags**: SHAPE slips back 4 a strike while shaping *(Zero)* |
| Its own rule | WHITE HEAT comes after 10 clean in a row instead of 8 *(Zero's glass streak)* |
| Words | BACK TO THE GLORY HOLE · BLOW · SET |
| Stuff | clear sand (baseline), black sand (darker, narrower), sea-glass sand ✶ |
| Parts | Flux: ash, lime · Colour: none, cobalt, starglass ✶ |
| Patterns | **Lens** (sold to scholars and delvers), **Bottle** (sold, and used by the kettle), **Pane** (sold, or set in your own shop's window for charm) |
| Model | Zero's `Prop_glass_meshy` (a furnace with its glowing mouth) |
| Set up | 3,500 c |

Glass is the station that feeds the others: bottles for the kettle, panes for the shop.

## Order, and what each release holds

1. **The bench** (the closest to the forge: a bend is a strike; the grain is one new rule).
2. **The kettle** (the most different meter; cheap goods change how the shop sells).
3. **Glass** (most valuable once the kettle wants bottles).

Each is one release: rules and tests first, then the stage and screens, the sim re-run with the new station in the bot's hands, a
check on a phone, then the push on your say-so. About one session each.

## Things that change across the game

- **The forge screen** grows a fourth and fifth heading; past three stations it may want tabs (THE FORGE · THE STRETCHER · …).
- **Customers' wants** widen with each station (they already only ask for what your shop can make).
- **Orders** from regulars: Lady Corrow wants a lens; Bram Oakes wants arrows for his drovers; Ketty Moss a tonic.
- **The runner** brings back wood and herbs from the roads.
- **The 3D room** fills: four stations, the counter, shelves and furniture in a 6×5 room will be tight, which makes the bigger rooms
  matter.
- **Sound**: the bench's creak and twang, the kettle's bubble and hiss, the glass's ring and the shatter.

## Models

Zero's `Prop_hearth_kettle` is built in the same cel style as the forge's props and converts like them. The bench and glass props
Zero uses are **Meshy models with a painted texture**: `tools/fbx2glb.py` takes colours from the palette by material name and would
drop the texture. Either keep the texture for those two (a small change to the converter and the page's materials), or use the
cel-built `Prop_hearth_workbench` and a simple furnace drawn from boxes until a cel model exists (question 5).

## Decided (2026-11-15)

1. **Order:** the bench, then the kettle, then glass. One release each.
2. **The kettle's brews have tiers and are made in batches:** Common, Fine and Rare as everywhere else; one working makes a batch of
   three that takes one shelf place and sells one at a time. The card shows the batch (×3, ×2, ×1).
3. **Strong links between stations.** Some workings need things made at another station:
   - **Arrows need arrowheads**: a new forge pattern (a sheaf's heads from one iron bar). Until the bench has them in the store
     room, a sheaf of arrows can't be made.
   - **Draughts, salves and oils need bottles** (a batch of three takes three). Glass comes last, so until a glass furnace is set up
     bottles are **bought** from a new supplier line at a premium; blowing your own is cheaper and a Fine bottle lifts the batch.
   - **The bench's staff takes a forged ferrule** (any forge piece's offcut: a new small forge pattern).
   - **Panes** from the glass can be set in the shop's window (charm), and **lenses** sold or fitted to a staff (a focus).
   - Nothing is ever a dead end: whatever another station makes can also be bought, dearer, so a missing station slows a player
     but never stops them. The sim checks this.
4. **Models:** the bench and the glass furnace keep their Meshy textures (the converter learns to keep a texture where a model has
   one); the kettle is Zero's cel-built `Prop_hearth_kettle`.
