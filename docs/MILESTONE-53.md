# Milestone 53: who opens the shop (release 80)

Asked for: a character creator for a new game: the maker's people, their background, and the kind of shop they open, with the
title following the shop (docs/CREATOR-PLAN.md, decided 2026-11-20).

## The creator
A new game's LIGHT THE FORGE (an empty slot, or one nothing has been made or sold in) opens it: three steps, BACK and NEXT.

1. **Who opens the shop?** The maker's mark, and the **people**, each with a portrait (the counter's folk pictures) and a small gift:

   | People | Gift |
   |---|---|
   | Human | every trade rises 5 % faster |
   | Dwarf | the forge's band 5 % wider |
   | Horned | the stretcher's band 5 % wider |
   | Halfling | the bench's band 5 % wider |
   | Lizardfolk | the kettle's band 5 % wider |
   | Shiril | the glass's band 5 % wider |
   | Goblin | the suppliers' prices 5 % lower |
   | Orc | runners and miners hurt a sixth less often |

   Humans and Dwarves have more than one look to choose from.
2. **What did you do before?** A small head start, never tied to the shop:

   | Background | Head start |
   |---|---|
   | A smith's hand | the forge's first patterns at trade 2; two iron |
   | A tanner's child | the stretcher's first patterns at trade 2; hides and gut |
   | A woodcutter | the bench's first patterns at trade 2; yew |
   | A herb-gatherer | the kettle's first brews at trade 2; herbs and honey |
   | A glassblower's hand | the glass's first patterns at trade 2; sand and potash |
   | A miner | when the trapdoor opens, mining and smelting at trade 3; six ironstone |
   | A pedlar | 60 c more; haggling at trade 2 |
   | A soldier | the first runner hired goes out with your old sword; the night guard's wage a fifth lower |

   The head start isn't counted toward the maker's level.
3. **What shop will you open?** The forge, the stretcher, the bench, the kettle or the glass. Its station is set up free and stands
   in the workshop beside the forge; the store room starts with what it needs; its patterns come first; the first hint is its own.
   **Until the shop is KNOWN, half the town's customers come in for what its sign says** (a brew, something of glass, a bow,
   something to wear). The gentler Reach checkbox is here too.

## The name
OPEN DARKCLAY ALCHEMY, and the title screen comes back: **"Forge" falls out of "Darkclay Forge" and the shop's own word drops in**,
with its station's puff (sparks, steam, sawdust, bubbles, a glow). A tap skips it; reduced motion shows the name at once.

| Shop | The game's name | The first room |
|---|---|---|
| forge | Darkclay Forge | THE FORGE |
| stretcher | Darkclay Tannery | THE STRETCHER |
| bench | Darkclay Bowyer | THE BENCH |
| kettle | Darkclay Alchemy | THE KETTLE |
| glass | Darkclay Glassworks | THE GLASS |

It shows on the title while that slot is played, on the slot's card, in the shop's heading, the first nav button and the browser
tab.

## THE MAKER
SKILLS › THE MAKER shows the portrait, the people, the background and the shop, with what each brings. **A save from before**
stays a forge shop and can choose its people once (CHOOSE YOUR PEOPLE: a portrait and the gift; no background after the start).

## The heir
At the handing on, after the heirlooms and the confirmations, the creator opens for the heir (their name is the apprentice's):
their people, their background, and the kind of shop, any kind. The title drops to the heir's shop's name, then the heir's welcome.

## The sim
**With no choice (every run before), the game is release 78's to the byte**: the Reach with the luck on and off, and the coast.
`SHOP=kettle BACKGROUND=miner PEOPLE=orc` plays any start; a shop of another kind levels its own station first until KNOWN, as a
player would. All five kinds climb alike over 30 days (seed 1, a pedlar): earnings 398,000–418,000 c. The kettle starts slowest
(about 2,000 c its first day, against the forge's 11,000) and catches up by day 3.

## Also
- **A guard against today's bug coming back:** `tests/load.test.mjs` walks everything the page's load-time catch-up and first
  `toHome()` reach, and fails on a `const` or `let` defined after that point. It caught one more in this milestone before it shipped.

## Tests
`tests/m53.test.mjs` (7 tests): a save without a choice, each kind of shop, the backgrounds (a miner's potion shop), the soldier's
sword and guard, the peoples' gifts, the sign's customers, and the heir.

## Not checked
The heir's creator wasn't played through in the browser (the hand-on needs a Maker of the Nine); a test covers it.
