# A true heat (release 51)

Asked for in play: "I can't get through the tiles because it cools too fast. It's easier to just make a plain item, as skill has no
impact on crafting." At a phone's pace (a strike a second) the forge gave 4–5 strikes a heat (the band 45–86; each strike draws 8, and
it cools 3 a second), and every trip back to the fire turns the whole strip face down again.

- **The zone:** the top 10 of the band, never closer than 6 under where it scales (the forge with iron: 76–86). Drawn on the meter as a
  bright TRUE HEAT mark; HELD while one holds.
- **Taken out in it** (INTO THE FIRE again, or a strike straight from the fire, or at the kettle a stoke that lands in it): A TRUE HEAT.
  Till it goes back in, it cools at two fifths the speed and each strike draws half as much: about 8–9 strikes a heat at a phone's pace
  instead of 4–5. From trade 5 it also counts toward WHITE HEAT.
- **A run of them:** each true heat in a row widens the next zone by 3 (twice at most); a miss starts the run again.
- **Missed:** as before. Left in past white: it scales, as before.
- `TRUE_HEAT` in `js/data.js`; `trueZone(S)` and the judging in `js/rules.js`; the mark in `js/stage.js`; the hint and the pop in
  `js/main.js`. Every station has it (the soak, the steam, the stoke, the gather).
- Tests: 215. Checked in the browser at 430 wide: the mark, the hint ("Now: the true heat"), the pop. Not checked on a real phone.

## A clean blow (release 52)

Asked for in play: a random bonus on good hits, to finish a piece faster. While it's being shaped, a GOOD or GREAT now and then lands
clean and shapes it twice as far: one in five, and about one in three in a true heat (`CLEAN_BLOW` in `js/data.js`). Not once it's made
(WORKED is unchanged), and never on a HOLD, a CRACK or a TRUE. The pop says "+13 SHAPE · CLEAN — A CLEAN BLOW · TWICE THE SHAPE".
Shaping takes about a fifth fewer strikes on average, a third fewer in true heats. Tests: 216. Checked in the browser at 430 wide.
