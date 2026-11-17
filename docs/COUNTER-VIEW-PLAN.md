# Behind the Counter: a plan (milestones 25–28)

Status: planned and decided (2026-11-17), nothing built in the game. Builds on release 43. The mockup is `looktest/plan.html` (drawn live from the game's models,
card faces and the look test's customer sprites; run the local server and open it); the look tests that led here are `looktest/counter.html`
and `looktest/sprites.html`, made with `tools/looktest_sprite.py`.

## What it's for

Today the shop is a small isometric room: good for arranging, too far away to feel. The counter view puts you behind your own counter,
looking at the person in front of you, with the piece they want held up as your forged card. The haggle, special orders, the Court and the
regulars all happen there. The isometric shop stays for arranging, the Hall and the second shop.

## What the look tests settled

- **Customers as pictures, not 3D figures** (Eye of the Beholder): rendered once in Blender from Zero's detailed stylized bodies in their
  outfits (Zero's gear textures: linen, leather, mail), with Zero's hair and beards fitted by Zero's own per-body fits. About 20–30 KB a
  pose as WebP, lighter than one of the kit's 3D figures (about 170 KB) and far more detailed. Zero's 3D bodies themselves (3.4 MB each,
  realistic) don't suit the shop's toy look; the kit's 3D figures are too simple up close.
- **The room stays 3D**, built from the same layout as the isometric shop, so what you arrange is what you see.
- **The held card is the game's own forged card**, laid over the view (not painted into the 3D): crisp, readable, the same object as
  everywhere else. On the left of the customer, a slight tilt, the card's own proportions.
- **The wider view** on a phone on its side and on a desktop; upright on a phone, a tighter frame.
- **Customers further back are darker and softer.**

## The milestones

| # | Milestone | What it holds |
|---|---|---|
| **25** | **Behind the counter** | the counter view: a first-person 3D view built from the shop's room (furniture, shelves, cards, the wall); four fixed views (the counter facing the door, the left wall, the right wall, turned round to the back-room doorway) with a short smooth pan between them (swipe, the tabs, the arrows); SEE THE SHOP / BEHIND THE COUNTER; upright and on its side; tapping a card on a shelf to price it or take it down; the back-room doorway to the workshop and the back room. Customers as today's figures until 26 |
| **26** | **The folk as pictures** | the sprite pipeline made a tool (`tools/sprites.sh`, from the look test's script): each customer kind (delver, guard, traveller, factor, collector, steward, master), the regulars (Vance, Ketty, Bram, Lady Corrow, Marrow), the Court's herald, a bandit, your staff; several peoples and looks each (human, dwarf, goblin, orc, and Zero's others as wanted); four poses (waiting, holding out, pleased, offended); walking in and out by sliding with a bob; further back darker and softer. About 40 pictures, about 1 MB, loaded only with the counter view |
| **27** | **The haggle at the counter** | the customer steps up; the piece they want rises from their hand to the forged card beside them; their mood and words; the choices along the bottom (meet them, hold, ask more, their offer, split the difference, nothing for them) by today's rules; the pose swaps as they react; a sale's coins; the next in the queue steps up. Special orders, the Court, sellers and the regulars' stories at the counter the same way |
| **28** | **The room dressed and lit** | one look: the room re-lit to sit with the pictures (warm lamps, the door's dusk, a soft glow), the counter tidied; dressing (your brews' bottles, wall pieces hung, wards, banners, the shelves as full as the shop); the world in it (a forced door after a robbery, a cold forge through the doorway, a monster's damage mended); a phone budget for the whole view, checked on a real phone |

Each ends in a release, as before: the views and controls checked upright and on its side, on a phone.

## Questions to decide before building

1. **Which view opens the shop?** Recommended: BEHIND THE COUNTER when there's a customer at the counter or a queue, SEE THE SHOP
   otherwise, and the player's last choice remembered. The alternatives: always the counter view, or always the isometric (the counter view
   a button).
2. **The room: live 3D or painted backdrops?** Recommended: live 3D from the shop's own layout (it follows what you arrange), re-lit in 28.
   The alternative: a rendered backdrop per view (prettier, closer to the concept, but it can't follow your arrangement: a fixed front of
   house).
3. **Where the customer pictures come from.** Recommended: rendered from Zero's bodies, outfits, hair and beards (no Meshy credits, the
   look test's pipeline). The alternative: new Meshy customers with real facial expressions (credits, a new look).
4. **Expressions.** Recommended: by the body (four poses) for now. Faces that change need either new renders per face or Meshy.
5. **The regulars.** Recommended: each regular a fixed look (the same Vance every time), drawn from the folk pipeline in 26.

## Decided (2026-11-17)

1. **Which view opens, by the screen:** a phone held upright opens the isometric shop; a phone turned on its side, a tablet or a
   desktop window opens the counter view (it has the room for the detail). Turning the phone switches between them. The switch stays,
   and an override is remembered per screen shape (so someone who wants the counter view upright can have it).
2. **The room: painted backdrops.** Each of the four views is a picture rendered in Blender (the room, its light, the counter), not
   the live 3D. What changes is laid over it: your cards on the shelves (at the backdrop's shelf places), the glowing bottles, the
   customers, the card held up, the controls. The backdrop can't follow furniture you move in the isometric shop: the counter view is a
   fixed front of house. A few backdrops per shop size (and the shelves' levels) keep it close to your shop.
3. **The customers: Zero's bodies, the waiting pose only.** No arms moving: one picture per look, at the counter and further back.
   Hair and beards follow Zero's own rules for each people (a beard only for a man of a people that grows one; the bald peoples their
   crest or fan; the scaled and the insect-like peoples none).
4. **Reactions: comic marks** by the customer's head, popping in and moving, each with a sound (mockup: `looktest/reactions.html`):
   OFFENDED red "!!" and an anger mark that shake; PLEASED gold sparkles and a tune; WARY a thought bubble filling with dots and a "?";
   EAGER a gold "!" with lines bursting out. The mood word and their line stay in the box. Still when less motion is asked for.

So milestone 25 becomes the backdrops (rendered in Blender from the shop's models, lit as the look test's customers) with the overlays,
and 26 needs one pose a look (fewer pictures: about 20–25 for the same variety). 27 gains the reaction marks; 28's lighting is the
backdrops' own.
5. **The regulars: fixed looks.** Each regular (Vance, Ketty Moss, Bram Oakes, Lady Corrow, Marrow, the Court's herald) always looks
   the same: their own people, outfit, hair and beard, rendered once in milestone 26. Other customers are drawn from the folk pictures.

All five decided: the plan is ready to build, starting with milestone 25 (the backdrops and the overlays).

## Changed (2026-11-17): the counter view is the shop, everywhere

Decision 1 above is replaced: **the counter view is the shop on every screen**, a phone upright included (`looktest/phone.html`: the
counter view above, the panel of choices under it where thumbs reach, turning the phone widens the same view). **The isometric shop is
only for arranging**: ARRANGE THE SHOP opens it, empty (no customers while you arrange), for furniture, shelves, the workshop and the
Hall. So customers are only ever the detailed pictures: one look for people everywhere, not toy figures in one view and pictures in
another. The "At the counter" panel's silhouette goes; the panel is the counter view's own.
Confirmed (2026-11-17): **customers are the detailed pictures, everywhere.** The toy 3D figures leave the shop; they stay only where
no customer is shown (none, once the isometric shop is for arranging).

## Milestone 25, as built (release 44)

- **The counter view is the shop** on every screen (js/counter.js, no WebGL): four painted views, the counter facing the door, the
  left wall, the right wall, and turned round to the workshop doorway; the tabs under it or a swipe across it turn, with a short fade.
  Each view is composited in 2D: the painted room, your cards on its places, the customers, the counter's cut-out in front, the places
  and the doorway to tap. Upright on a phone the upright pictures, on its side and on a desktop the wide ones (scaled to cover).
- **The backdrops** (tools/backdrops.py, Blender): the shop front built from the shop's own models, lit warm (the lamp by the door,
  candles on the counter, the street's dusk, the forge's glow beyond the back doorway), rendered for the four views at two shapes,
  with the counter cut out (it hides the customers' legs and stands in front of the walls' cards), and `backdrops.json`: each card
  place's four corners, the customers' spots, the doorway. Eight pictures and three cut-outs, about 330 KB in all.
- **Your cards on the painted places:** the left wall's two display cases hold 12 of your shelf's places (each card's face, from
  js/cardface.js, skewed onto its place); the right wall holds 6 of the wall's pieces. Tapping a place opens it as the SHELF and THE
  WALL tabs do; an empty place is outlined. Places beyond the painted ones stay in the tabs under the view.
- **The customers:** the queue at the counter, the front of it at the counter, up to four behind, darker and softer. **Stand-ins until
  milestone 26:** the four look-test pictures (human, dwarf, goblin, orc in assets/folk/), chosen by the customer's kind and name.
- **ARRANGE THE SHOP** opens the 3D shop, with no customers (the diorama's `folk: false`), for arranging, the workshop and the Hall;
  BACK TO THE COUNTER returns. VISIT MY SHOP · SHARE sits under the counter view. Other players' shops are still seen in 3D.
- The haggle stays in the AT THE COUNTER panel under the view (milestone 27 brings it into the view).
- Not yet: a backdrop per shop size and shelf level (one shop front for every shop for now), the brews' glowing bottles over the
  backdrop, the card held up, the reaction marks.
