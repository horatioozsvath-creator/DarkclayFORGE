# Milestone 10: Visit a friend's shop

Status: built in release 19 with the recommended choices (the shop front in 3D and the workshop's stations as a list; prices
on the stands; the wall's cards whole). The biggest shop the rules allow (8 display cases, 48 cards on show, every kind of decor, a
full wall of 5) packs into a 2,112-character link. A link opened while the game is already open in the tab now reloads into it.

Builds on release 18. The game spreads by sharing a link: a card link already opens one piece on anyone's
phone (`js/share.js`, `#card=`). This does the same for a whole shop front.

## What a visitor sees

A **VISIT MY SHOP** button makes a link. Opened on any phone or computer, it shows:

- **The shop front in 3D**, as it stood when the link was made: the room's size, its floor and walls, the counter, every shelf at its
  level (shelf, display shelf, display case) and every piece of decor where the owner put it.
- **The shelves' card stands**, each piece's card on its place with its price, as in the owner's own shop. Tap one to see its card.
- **The wall**: the owner's best pieces as full cards (stats, affixes, THE MAKING, lore), to look through.
- **A sign over it all**: the maker's name, the shop's renown (*SOUGHT*), its size and charm, pieces made and sold, the stations
  in the workshop behind (shown as a row of small icons, not in 3D), and the date the link was made.
- A couple of townsfolk wandering in and out, so it looks open.

It's **a snapshot, to look at**: nothing can be bought, moved or changed. A visit never touches the visitor's own game, which waits
behind a **BACK TO MY FORGE** button. A visitor with no game yet gets **START YOUR OWN FORGE**.

## Making the link

- The button sits in the shop's 3D bar beside ARRANGE, and on the WALL tab. It uses the phone's share sheet where there is one
  (WhatsApp, Messages, email), or copies the link.
- **Nothing is sent anywhere.** The whole shop rides in the part of the address after `#`, which browsers never send to the server,
  as card links do now.
- **Size, measured** with the real game's data (packed, then compressed with the browser's own deflate):

| | Link length |
|---|---|
| One card link (today) | about 770 characters |
| A starting shop: 2 shelves, a few pieces, a few decor | about 1,200 |
| A big late-game shop: 8 shelves and cases, 40 cards on show, 15 decor, a full wall of 6 | about 2,450 |

  That fits messaging apps and email. To keep it there, shelf pieces travel as what their stand shows (tier, picture, colour,
  name, price, batch count), not their whole card. Only the wall's pieces travel in full.

## Safety

The link comes from someone else's browser, so everything in it is checked and rebuilt before it's shown, as card links are now:
- every piece of furniture must be a known kind on a valid tile of a valid room size;
- every card is checked field by field;
- text is length-limited and escaped;
- a link that won't read shows *"This shop link won't open: it may be cut short"* and the visitor's own game.

## What the build touches

- **New module `js/visit.js`** (no page access, tested):
  - pack a save's shop front into the compact form;
  - unpack and check one, rebuilding a room the rules accept (`room.js valid`) and a list of stands;
  - wall cards through `share.js`'s card checks.
- **share.js:** the compress and expand step (the browser's `CompressionStream('deflate-raw')`, in every current browser),
  shared by both kinds of link.
- **diorama.js:** a look-only mode: no arranging, no counter queue, a few wandering walkers, taps open cards.
- **index.html and main.js:**
  - a visit screen (the sign, the 3D shop, the wall);
  - the VISIT MY SHOP button and share sheet;
  - opening `#shop=` links, as `#card=` links open now.
- **Tests:**
  - pack and unpack round trip for small and big shops;
  - a damaged, cut-short or hostile link is refused (unknown furniture, tiles off the room, overlong text, a script in a name);
  - the link stays under 3,000 characters for the biggest shop the rules allow.

About one session, one release.

## To decide

1. **What travels:** the shop front in 3D with the workshop's stations as a list (recommended: the shop front is what's arranged
   and decorated), or both rooms in 3D (a longer link).
2. **Prices on the stands:** shown (recommended: comparing prices is half the fun), or hidden.
3. **The wall:** whole cards (recommended), or stands only, for the shortest link.
