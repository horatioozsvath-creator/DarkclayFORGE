# Finding new patterns: a plan (milestones 31–33)

Status: proposed (2026-11-17), nothing built. Builds on release 48.

## What it's for

Today every pattern is known from the start: setting up a station hands you its four or five. This plan hides a second set of patterns
(about 16) that you find by **trying things**: putting materials together at a station and seeing what comes of it, guided by clues the
world drops (what customers ask for, old pieces you can take apart, the regulars' talk). Finding one is a moment: a new card in your
patterns, a page in your book, a little renown, and a new thing to sell.

## How it would play

### TRY SOMETHING NEW

At each station you've set up, beside its patterns, a **TRY SOMETHING NEW** slot:

1. Choose **two or three things** from the store room. Each station names the roles, for example at the forge a **head** (a metal), a
   **haft or grip** (wood, leather, cord) and a **binding**.
2. **TRY IT.** The materials are spent, and you get one of three results:
   - **Found:** "You've found the SPEAR." The pattern joins the station's list at trade 1, and the try leaves you a Common one.
   - **Close:** a clue for each choice, written down in your book. *"The iron took. The shape wants a longer haft than leather gives.
     The binding was right."* Each choice is marked right, right family but the wrong one, or wrong, so a few tries close in on it.
   - **Nothing came of it:** the materials are spent and a little practice is gained. The book keeps the try so you never pay for it
     twice.
3. **Not yet:** a pattern can need a trade level in a related pattern (a spear: trade 3 in daggers or axes). Then the try says *"You
   haven't the hand for it yet: daggers or axes, trade 3,"* and costs nothing.

### Clues, so it's never blind guessing

- **Customers ask for what you don't make yet.** "Got a spear? Ash and iron, like my father's." Their words go into the book.
- **Old pieces you can study.** A runner or a seller sometimes brings an old piece of a pattern you don't know (an old mace). **STUDY
  IT** breaks it down and teaches you the pattern outright. This is the second way to find one.
- **The regulars and the town board** drop a line now and then: Bram on a crossbow from the far valley, Marrow on a poultice.
- **The book shows the shape of what's missing:** each station's page has a silhouette with a "?" for every pattern still to find, and
  its kind (WEAPON · TWO HANDS, CLOAK).

### THE MAKER'S BOOK

A new page under THE FORGE: the patterns found at each station, the silhouettes still to find, every clue gathered, and every try you've
made with what it taught you.

## The new patterns (proposed: about 16)

Each is a full pattern, the same as the ones you have: its parts, trade, worth, affixes, four lore lines, card art, customers who want it,
a gear slot for runners where it fits, and the road to Old-Blood. Zero has 3D models for most of them, which can guide the card art.

| Station | Pattern | Found by | Kind |
|---|---|---|---|
| Forge | **Spear** | iron head, ash or yew haft, cord binding; trade 3 in daggers or axes | weapon, reach |
| Forge | **Mace** | iron head, a haft, leather grip; trade 3 in axes | weapon |
| Forge | **Shortsword** | steel, a leather grip; trade 5 in daggers | weapon |
| Forge | **War hammer** | iron, a long haft; trade 5 in axes | weapon, two hands |
| Stretcher | **Cloak** | wool, a hide, thread | body |
| Stretcher | **Satchel** | hide, strap, cord | pack: a runner carries more home |
| Stretcher | **Sling** | cord, a leather cup | weapon, ranged |
| Bench | **Club** | a heavy wood, a grip | weapon |
| Bench | **Wand** | rowan, a rough gem | a charm piece |
| Kettle | **Poultice** | herbs, honey, linen | potion: heals on the road |
| Kettle | **Ink** | a dark root, gum, a bottle | sold to scholars, the Court |
| Glass | **Mirror** | glass, silver | a ward |
| Glass | **Beads** | coloured glass, cord | a charm, cheap and quick |
| Two stations | **Shield** | a forged boss, a stretched hide, a bentwood rim | armour, off hand |
| Two stations | **Lantern** | a forged frame, a pane from the glass | a light for the shop, a runner's road |
| Two stations | **Crossbow** | a bench stock, a forged lath and trigger, cord | weapon, ranged |

The "found by" recipes are a first draft, to be tuned so each takes a few tries with the clues and is never a pure guess.

## The milestones

| # | Milestone | What it holds |
|---|---|---|
| **31** | **Trying something new** | TRY SOMETHING NEW at the forge; THE MAKER'S BOOK; the clue for each choice; trade gates; customers asking for what you don't make; STUDY IT on old pieces; the forge's four (spear, mace, shortsword, war hammer) with their cards |
| **32** | **Finds at every station** | the stretcher, bench, kettle and glass slots and their nine patterns; the regulars' and the town board's clues; the new runner gear (satchel, cloak, sling, poultice) |
| **33** | **Two hands to make it** | the three two-station pieces (shield, lantern, crossbow): a part made at one station brought to another; a lantern lit in the shop; a balance run of the game simulator with everything found; orders and Court asks for found patterns |

Each ends in a release, checked upright and on its side, as before.

## To decide before building

1. **What a try costs.** (a) Recommended: the materials only, with an instant result. (b) A short working with the strip, more
   ceremony and more time. (c) Free, which makes it guessing.
2. **How much help.** Recommended: a clue for each choice after every try, plus the world's clues. The alternative is plain
   trial and error: harder, and easy to get stuck.
3. **STUDY IT, learning a pattern from an old piece.** Recommended: yes, as a second way to find one. It needs old pieces of the
   unknown patterns to start turning up from runners and sellers.
4. **The list.** The 16 above, fewer, or others you'd like (a flail, a halberd, an amulet, boots of a new kind).
5. **What existing saves get.** Recommended: the same hidden patterns as a new game. Nothing is found for you.

## Decided (2026-11-17)

As recommended: a try costs only its materials and answers at once; a clue for each choice; STUDY IT teaches the pattern; the 16; existing
saves get the same hidden patterns as a new game.

## Milestone 31, as built (release 49)

- **The forge's four, hidden** (`PATTERNS.spear`, `mace`, `shortsword`, `warhammer` with `hidden`): full patterns (parts, stats, affixes,
  four lore lines, card art, a runner's weapon slot, customers who want them once they're known). `Sh.knows(save, id)` is the one test:
  the patterns list, orders, the regulars, customers' wants and BACK IN THE FIRE all go by it.
  - Spear: a metal head, an ash or yew haft, cord or gut binding; daggers or axe heads, trade 3.
  - Mace: a metal head, a rowan or birch haft, a leather strap; axe heads, trade 3.
  - Shortsword: steel or darkclay, a horn or bone grip, a leather wrap; daggers, trade 5.
  - War hammer: iron or harder, an oak haft, a strap or wrap; axe heads, trade 5.
- **TRY SOMETHING NEW** (`js/discover.js`, under THE FORGE › PATTERNS while there's something to find): a head (a metal), a haft or grip
  and a binding from the store room; one of each is spent. Found: the pattern, a Common one, +5 renown. Close (more than the head alone
  right, against the nearest pattern still to find): a clue for each choice, right, near (the right kind of thing) or wrong with what it
  wants, and its outline. Nothing: practice for the next try. The same try twice costs nothing and gives back what it taught; a full
  recipe whose trade isn't there yet says what's needed and costs nothing; a recipe already known says so.
- **STUDY IT** on an old piece of a pattern you don't know (a runner's or a seller's): taken apart (its salvage kept), the pattern learned,
  +3 renown.
- **Customers asking:** about one buyer in eight asks for a pattern still to find at a station you have; their words show at the counter
  and go in the book (a badge on BOOK).
- **THE MAKER'S BOOK** (THE FORGE › BOOK): each station's hidden patterns as outlines with a vague look ("A WEAPON · TWO HANDS") and the
  trade each needs; what folk have asked for; your tries and what each taught.
- Tests: 210. Checked in the browser at phone size: a close try and its clues, not yet, found (the spear), studying an old mace, the book.
  Not checked on a real phone.
