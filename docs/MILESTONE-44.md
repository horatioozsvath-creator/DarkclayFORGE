# Milestone 44: the coast on a phone (release 69)

Asked for: a phone-width check of what the region added, and a look at the coastal screens no one had seen yet.

## Checked at phone width (375 px), in the browser pane
- **The Tide's ending** (MAKER OF THE TIDE, the nine names): fits.
- **The hand-on dialog** (WHERE · THE REACH / OVER THE PASS): **didn't fit.** It's fixed (below).
- **Saltby's opening** for the first heir over the pass: fits.
- **A second heir on the coast:** "THIRD OF THE LINE", the Nine of the Tide "lost again", and the shop not yet KNOWN in Saltby (its
  second generation there).
- **An heir going back to the Reach:** "The line has come back to the Reach", and the shop opens KNOWN, since the Reach counts every
  generation.
- **The day the tide gives back:** the notice and GO DOWN TO THE STRAND. Two shards of the Tide were found, and the button went.
- **The flyer:** "NOW OPEN · OF THE SHORE" and "forge & shop · second of the line · of the Greyshore".
- **The coastal counter view:** the tall pictures, a customer at the counter, the shop's piece held up.
- **The title screen's save slots** show MAKER OF THE TIDE for a coastal maker.

## Fixed
- **The crossing's choice no longer pushes the dialog off a phone's screen.** The OVER THE PASS button didn't wrap (buttons never do
  on a phone, `css/working.css`), so the dialog grew to 444 px on a 375 px screen and its text ran off the right. Now the two choices
  wrap (`.ending [data-to]`, `css/game.css`), and the coast's reads "Saltby, and the Nine of the Tide".
- **The hand-on dialog's words when going back.** A coastal maker handing on to the Reach was told "The Nine are lost again after
  your day", but they'd made the Tide's, not Veric's. It now says the forge goes "back over the pass in the Reach", where "the Nine of
  Veric lie scattered".

## Not checked
- A real phone. These checks were the browser pane's phone size, not a device.
