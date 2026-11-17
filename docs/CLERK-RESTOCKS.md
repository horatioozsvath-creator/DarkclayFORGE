# The clerk restocks (release 53)

Asked for: the counter clerk doing more when the shop is quiet, such as stocking the shelves.

- **When the clerk sells a piece, they fill its place from the back room**: away, and while minding the shop as you work at the forge.
  The same kind as the piece that sold first, then the one worth least, at the tag the sold piece had (`Sh.restock`).
- **Never put out by the clerk:** a Rare or better, a Relic or Mythic, a piece ready to become a Relic, a flyer's copy, or a piece marked
  **KEEP** (`Sh.restockable`). A batch that still has bottles keeps its place, so there's nothing to fill.
- **KEEP IT** on a back-room piece (shown once a clerk is hired): a KEEP badge in the back room. FILL THE SHELVES leaves kept pieces
  in the back too.
- **RESTOCKS THE SHELF · ON / OFF** on the clerk's card (staff); on by default (`p.restock === false` turns it off).
- The ledger line says it ("Sold by Wenna. Wenna put out a dagger."), and WHILE YOU WERE AWAY lists what was put out.
- Only the clerk at the first shop restocks; the second shop's keeper doesn't (yet).
- Not done: a Tidy trait. Tests: tests/restock.test.mjs (220 in all).
