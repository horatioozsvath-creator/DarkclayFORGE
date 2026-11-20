# Who opens the shop: a plan for a character creator (milestone 53)

Status: built in release 80 (docs/MILESTONE-53.md), decided 2026-11-20. Asked for before the third region (docs/NORTH-PLAN.md), which moves to milestones 54–58. Every
choice was taken as recommended but the first: each people brings a small gift (the table under step 1).

## What it's for

Today every new game is the same person: "the Maker", at a forge, with iron in the store room. This plan lets a player say **who**
opens the shop and **what kind of shop** it is. A miner who's had enough of the dark can open a potion shop. A glassblower's hand
can open a forge. The station they choose is the one they level through first; the others are there to set up later, as now.

And the game's own name follows the shop: open at the kettle, and the title reads **Darkclay Alchemy**.

## The new game

An empty slot's LIGHT THE FORGE opens the creator: one screen, three steps, every choice shown with what it means.

1. **Who you are.** Your maker's mark (the name; it can be changed later, as now) and your **people**, each with a portrait:
   Human, Dwarf, Halfling, Goblin, Orc, Lizardfolk, Horned, Shiril: the portrait on your slot and in the book. Each brings **a
   small gift**, none worth more than the others, and none that locks a shop to a people:

   | People | The gift |
   |---|---|
   | **Human** | every trade rises 5 % faster |
   | **Dwarf** | the forge's band 5 % wider |
   | **Horned** | the stretcher's band 5 % wider |
   | **Halfling** | the bench's band 5 % wider |
   | **Lizardfolk** | the kettle's band 5 % wider |
   | **Shiril** | the glass's band 5 % wider |
   | **Goblin** | the suppliers' prices 5 % lower |
   | **Orc** | your runners and miners hurt a sixth less often |
2. **What you were.** A **background**, and the small head start it brings:

   | Background | The head start |
   |---|---|
   | **A smith's hand** | the forge's first patterns at trade 2; two more iron |
   | **A tanner's child** | the stretcher's first patterns at trade 2; hides and cord |
   | **A woodcutter** | the bench's first patterns at trade 2; staves |
   | **A herb-gatherer** | the kettle's first brews at trade 2; herbs and spring water |
   | **A glassblower's hand** | the glass's first patterns at trade 2; sand and potash |
   | **A miner** | when the trapdoor opens, mining and smelting start at trade 3; some ironstone |
   | **A pedlar** | 60 c more to start; the first customers haggle more kindly |
   | **A soldier** | your first runner comes with a sword; the night watch costs less |

   A background is never tied to the shop: the miner can open a potion shop, as asked.
3. **The shop you open.** **The forge, the stretcher, the bench, the kettle, or the glass.** It comes set up and free (not the
   1,200–3,500 c it costs now). What's in the store room to start is for it. Its patterns are first on the bench list, the hints
   teach it, and the town's first customers come for what your sign says. The forge stands in the workshop either way (the other
   stations need its forged parts), but in a kettle shop it's the second room, not the first.
   - The gentler Reach checkbox moves into this step.

Then the title screen comes back, and the name **drops**: "Darkclay Forge", and **Forge** falls out of the title and the shop's
own word drops in, with a bang and a puff of the station's own (sparks, steam, sawdust, a boil's bubbles, a glass's glow). A tap
skips it. Then OPEN THE SHOP.

| The shop | The game's name | The first room |
|---|---|---|
| the forge | Darkclay **Forge** | THE FORGE |
| the stretcher | Darkclay **Tannery** | THE STRETCHER |
| the bench | Darkclay **Bowyer** | THE BENCH |
| the kettle | Darkclay **Alchemy** | THE KETTLE |
| the glass | Darkclay **Glassworks** | THE GLASS |

The name shows on the title screen while that slot is the one being played, in the shop's heading, on the slot's card, on the
share flyer and in the line's record. The nav's first button is named for your station.

## Saves already made

Nothing changes for them: they're forge shops, made by a person with no people or background set. Their slot reads as now. The
maker can choose a people and a portrait later in THE MAKER (looks only; no background after the start).

## The heir

At the handing on, the heir is a new person: they choose their people and background, and the heir's shop can be a different kind
(the line's trades and book go with them as now).

## How it fits the save

- `save.who = { people, look, background }` and `save.shop = 'forge' | 'stretcher' | 'bowbench' | 'kettle' | 'glass'`; none: a
  forge shop, as every save before.
- The starting station is in `save.stations` from the start (bought for nothing).
- The sim gets `SHOP=kettle` and `BACKGROUND=miner` to play any start; with neither, it plays today's game to the byte.

## Order and size

One milestone, medium: the creator screen and the title drop are most of it. Starting a kettle or glass shop needs its own first
materials, first customers and first hints, and the sim checks each kind of shop can climb from nothing (a potion shop shouldn't
starve in its first week).

## The choices

1. **People:** (1) looks only. (2) Each with a small gift (a dwarf's forge band a little wider, and so on).
2. **Their pictures:** (1) the portraits already in the game (the counter's folk: one or two looks a people, not every people in
   both a man and a woman). (2) New portraits, a man and a woman of each people in a maker's clothes, rendered from Darkclay Zero's
   private models and published with the release (this needs your yes, as Saltby's art did).
3. **Backgrounds:** (1) the eight above, a small head start each. (2) Looks and story only, no head start.
4. **The first station:** (1) the forge always stands in the workshop too (needed for forged parts and the mine's smelting); your
   station is set up free and comes first. (2) Only your station: the forge is bought later like any other (a much bigger change:
   forged parts are bought dear until then).
5. **The names:** Forge, Tannery, Bowyer, Alchemy, Glassworks, or give your own (the bench's could be Woodworks or Fletcher).
6. **The heir:** (1) a new person each handing on, who can open a different kind of shop. (2) Same kind of shop as the line's first.
7. **Order:** (1) this first, then the third region (54–58). (2) The other way round.
