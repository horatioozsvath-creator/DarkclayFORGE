// DarkclayFORGE content. Names, tiers, affixes and found tiles follow Darkclay Zero (data/zero/*.json, docs/THE-WORKING.md).
// Numbers are first guesses for the balance pass.

export const KINDS = ['GOOD', 'GREAT', 'HOLD', 'CRACK', 'TRUE', 'FOUND'];
export const KC = { GOOD: '#8fc46a', GREAT: '#f0a35c', HOLD: '#8e9bb0', CRACK: '#c4483a', TRUE: '#fff2c4', FOUND: '#e8c464' };

// worth multiplies what a piece sells for; mult multiplies damage and armour; affixes is how many a piece of the tier carries
export const TIERS = [
  { id: 'common', name: 'Common', c: '#b8b0a2', glow: 0, mult: 1.00, worth: 1, affixes: 0 },
  { id: 'fine', name: 'Fine', c: '#8fc46a', glow: .35, mult: 1.10, worth: 2, affixes: 1 },
  { id: 'rare', name: 'Rare', c: '#6fb1ec', glow: .45, mult: 1.22, worth: 4, affixes: 2 },
  // Darkclay Zero's Old-Blood (data/zero/tiers.json: violet, foil, ×1.36, three affixes): never rolled, only a master's last rework
  { id: 'oldblood', name: 'Old-Blood', c: '#b48cf0', glow: .55, mult: 1.36, worth: 8, affixes: 3, foil: true },
];
// the last rework, Rare to Old-Blood: a master of the trade, a piece with a rare part or WHITE HEAT in its making, three times the
// rework's bars and one rare thing of the station's; a narrower band, WHITE HEAT later, and not one crack (a crack: it stays Rare)
export const OLD_BLOOD = { tier: 3, level: 6, costX: 3, band: 0.8, whiteStreak: 12,
  rare: { forge: 'blackwater', stretcher: 'winterfox', bowbench: 'sinew', glass: 'starglass', kettle: 'moonwater' } };

export const FORGE = {
  id: 'forge', name: 'FORGE', word: 'THE FORGE', tool: 'HAMMER', meter: 'HEAT', fire: 'INTO THE FIRE', out: 'OUT OF THE FIRE', close: 'QUENCH', place: 'the fire',
  heatIt: 'HEAT IT', band_: 'gold band', strike: 'STRIKE', again: 'BACK IN THE FIRE', made: ['strike', 'heat'],
  band: [45, 86], drain: 8, cool: 3, rise: 36, over: 95,
  colours: ['#3a3634', '#7a1e10', '#c8401a', '#f08a2a', '#ffd25a', '#fff6dc'],
  labels: [[0, 'BLACK'], [30, 'DULL RED'], [45, 'CHERRY'], [70, 'YELLOW'], [86, 'WHITE']],
  cold: 'STRUCK COLD',
  twist: 'Strike it hot: yellow to cherry. Struck cold, a CRACK slips in. Left in past white, it scales.',
};
// the stretcher (Darkclay Zero's THE-WORKING §4, tuned there: drain 8, cool 3): keep the hide supple. Too dry, a stitch turns
// nothing over; too wet, a stitch tears (a CRACK slips in, from trade 3). Nothing scales: a hide can soak as long as it likes.
export const STRETCHER = {
  id: 'stretcher', name: 'STRETCHER', word: 'THE STRETCHER', tool: 'AWL', meter: 'DAMP', fire: 'SOAK IT', out: 'OUT OF THE SOAK', close: 'SET', place: 'the soak',
  heatIt: 'SOAK IT', band_: 'supple band', strike: 'STITCH', again: 'BACK ON THE FRAME', made: ['stitch', 'soak'],
  band: [35, 80], drain: 8, cool: 3, rise: 32, over: 101, dryDead: true, wetTear: true, cost: 1200,
  colours: ['#d8c098', '#b89060', '#8a6a44', '#6a5a4a', '#4a5a6a', '#2a4a6a'],
  labels: [[0, 'DRY'], [35, 'SUPPLE'], [80, 'SOAKED']],
  cold: 'TOO DRY · IT STIFFENS',
  twist: 'Keep it supple. Too dry: a stitch turns nothing over. Too wet: a stitch tears (a CRACK slips in, from trade 3). It dries as you work: SOAK IT again.',
};
// the bench (Zero: STEAM 40–100, drain 5 · cool 3 · rise 30; a cold bend splits; the grain 2.6 s with, 1.4 s across, and a bend
// across it turns nothing over). Its id is 'bowbench': 'bench' is the seat you can buy for the shop.
export const BENCH = {
  id: 'bowbench', name: 'BENCH', word: 'THE BENCH', tool: 'DRAWKNIFE', meter: 'STEAM', fire: 'INTO THE STEAM', out: 'OUT OF THE STEAM', close: 'STRING', place: 'the steam',
  heatIt: 'STEAM IT', band_: 'pliant band', strike: 'BEND', again: 'BACK ON THE BENCH', made: ['bend', 'steaming'],
  band: [40, 100], drain: 5, cool: 3, rise: 30, over: 101, grain: { with: 2.6, across: 1.4 }, cost: 2000,
  colours: ['#5a4630', '#6a5236', '#8a6a42', '#a8844e', '#c8a060', '#e0c088'],
  labels: [[0, 'SET'], [40, 'PLIANT']],
  cold: 'IT SPLITS',
  twist: 'Bend it pliant, with the grain. Bent cold, it splits (a CRACK slips in, from trade 3). Across the grain, a bend turns nothing over: wait for it to turn.',
};
// the kettle (Zero: THE BOIL 40–75; no drain a stir; it settles 7 a second once the first stir is made; STOKE adds 22 at once and
// deals the strip again; under the band a stir doesn't take; over it the pot boils over, a CRACK slips in from trade 3 and the boil
// drops 30). It makes a batch: three bottles to one shelf place, sold one at a time.
export const KETTLE = {
  id: 'kettle', name: 'KETTLE', word: 'THE KETTLE', tool: 'SPOON', meter: 'THE BOIL', fire: 'STOKE', out: 'STOKE', close: 'STOP', place: 'the fire',
  heatIt: 'STOKE IT', band_: 'simmer', strike: 'STIR', again: 'BACK ON THE FIRE', made: ['stir', 'stoking'],
  band: [40, 75], drain: 0, cool: 7, rise: 0, over: 101, start: 55, stoke: 22, noTake: true, boilOver: 30, cost: 1500,
  colours: ['#2a3a2a', '#3a5a3a', '#5a7a3a', '#9a8a3a', '#c86a2a', '#e04a2a'],
  labels: [[0, 'COOL'], [40, 'SIMMER'], [75, 'ROLLING']],
  cold: 'TOO COOL · IT DOESN\'T TAKE',
  twist: 'Hold a simmer. Stirring doesn\'t cool it: it settles by itself, and STOKE raises it. Too cool, a stir doesn\'t take; too hot, it boils over (a CRACK, from trade 3, and the boil drops).',
};
// glass (Zero: THE GATHER 40–80, drain 5 · cool 5 · rise 30; too stiff it shatters, and the very next tile turned is a CRACK; too
// soft it sags, SHAPE slipping back 4 a blow while shaping; WHITE HEAT after 10 clean blows, not 8)
export const GLASS = {
  id: 'glass', name: 'GLASS', word: 'THE GLASS', tool: 'BLOWPIPE', meter: 'THE GATHER', fire: 'BACK TO THE GLORY HOLE', out: 'OUT OF THE GLORY HOLE', close: 'SET', place: 'the glory hole',
  heatIt: 'GATHER IT', band_: 'soft band', strike: 'BLOW', again: 'BACK TO THE GLORY HOLE', made: ['blow', 'gather'],
  band: [40, 80], drain: 5, cool: 5, rise: 30, over: 101, shatter: true, sag: 4, whiteStreak: 10, cost: 3500,
  colours: ['#2a3a3a', '#3a6a6a', '#c8702a', '#f0a040', '#ffd27a', '#fff2c0'],
  labels: [[0, 'STIFF'], [40, 'SOFT'], [80, 'RUNNING']],
  cold: 'TOO STIFF · IT SHATTERS',
  twist: 'Keep it soft. Too stiff, it shatters: the very next tile is a CRACK (from trade 3). Too hot, it sags: SHAPE slips back. It cools fastest of all.',
};
export const STATIONS = { forge: FORGE, stretcher: STRETCHER, bowbench: BENCH, kettle: KETTLE, glass: GLASS };

// strip: [GOOD, GREAT, CRACK, HOLD]. level: the trade level that opens the metal (a stand-in until suppliers sell it, milestone 2).
export const METALS = {
  iron: { name: 'Iron', strip: [10, 3, 4, 3], line: 'the baseline: strike it yellow to cherry', dmg: 1, val: 1, tint: '#c9c5be', level: 1 },
  bronze: { name: 'Bronze', strip: [11, 2, 2, 5], widen: 1.3, line: 'forgiving: a wider band, fewer cracks', dmg: .9, val: .9, tint: '#c99a5a', level: 1 },
  steel: { name: 'Steel', strip: [9, 4, 5, 2], band: [55, 92], line: 'a hotter heat: the band sits higher', dmg: 1.15, val: 1.4, tint: '#dfe4ea', level: 2 },
  silver: { name: 'Silver', strip: [7, 5, 6, 2], coolX: 1.7, line: 'it cools fast: strike quickly; +25 % on the dead', dmg: .95, val: 2, tint: '#eef0f4', level: 3, affix: ['Silvered', '+25 % on the dead'] },
  darkclay: { name: 'Darkclay steel', strip: [7, 6, 6, 1], widen: .7, line: 'a narrow band, for more: GREATs and cracks both', dmg: 1.3, val: 2.8, tint: '#8a6a78', level: 4 },
  // the stretcher's hides (Zero's working.json stuffs: deer the baseline, goat easy, shark hard)
  deer: { name: 'Deer hide', adj: 'Deerskin', strip: [10, 3, 4, 3], line: 'the baseline: keep it supple', dmg: 1, val: 1, tint: '#a07850', level: 1 },
  goat: { name: 'Goat hide', adj: 'Goatskin', strip: [11, 2, 2, 5], widen: 1.15, line: 'easy: a wider supple band, few tears', dmg: .9, val: .9, tint: '#c8a878', level: 1 },
  // the glass's sands (Zero's glass strip the baseline)
  clearsand: { name: 'Clear sand', adj: 'Clear', strip: [9, 4, 5, 2], line: 'the baseline: keep it soft', dmg: 1, val: 1, tint: '#cfe8e8', level: 1 },
  riversand: { name: 'River sand', adj: 'Greenglass', strip: [10, 3, 4, 3], widen: 1.15, line: 'forgiving: a wider soft band, a green cast', dmg: .9, val: .85, tint: '#9ac8a0', level: 1 },
  blacksand: { name: 'Black sand', adj: 'Smoke', strip: [9, 4, 5, 2], widen: .85, line: 'darker glass, a narrower soft band', dmg: 1.2, val: 1.4, tint: '#6a6a78', level: 3 },
  seasand: { name: 'Sea-glass sand', adj: 'Sea-glass', strip: [8, 5, 5, 2], widen: 1.2, line: 'drowned sand: more GREATs, and a kinder band', dmg: 1.35, val: 2.2, tint: '#7ad0d8', level: 5 },
  // the kettle's herbs (the first part: it sets the strip)
  mending: { name: 'Mending herbs', adj: 'Mending', strip: [10, 3, 4, 3], line: 'the baseline: hold a simmer', dmg: 1, val: 1, tint: '#7ac46a', level: 1 },
  sleepmoss: { name: 'Sleepmoss', adj: 'Sleepmoss', strip: [11, 2, 2, 5], widen: 1.15, line: 'gentle: a wider simmer, few boil-overs', dmg: .9, val: .9, tint: '#8a9ad8', level: 1 },
  emberroot: { name: 'Emberroot', adj: 'Emberroot', strip: [9, 4, 5, 2], widen: .85, line: 'fierce: a narrower simmer, more GREATs and more boil-overs', dmg: 1.2, val: 1.4, tint: '#e8813a', level: 3 },
  ghostcap: { name: 'Ghostcap', adj: 'Ghostcap', strip: [9, 4, 5, 2], widen: .85, line: 'a touchy boil for a pale, strong brew', dmg: 1.35, val: 2.2, tint: '#d8d0f0', level: 5 },
  // the bench's woods (Zero's stuffs: birch easy, yew the baseline, oak hard, old yew rare and wide)
  birch: { name: 'Birch', adj: 'Birch', strip: [11, 2, 2, 5], widen: 1.15, line: 'springy: a wider pliant band, few splits', dmg: .9, val: .9, tint: '#d8c49a', level: 1 },
  yew: { name: 'Yew', adj: 'Yew', strip: [10, 3, 4, 3], line: 'the baseline: bend it pliant, with the grain', dmg: 1, val: 1, tint: '#b0723c', level: 1 },
  oak: { name: 'Oak', adj: 'Oak', strip: [9, 4, 5, 2], widen: .85, line: 'dense: a narrower band, more GREATs and more splits', dmg: 1.2, val: 1.4, tint: '#8a6238', level: 3 },
  oldyew: { name: 'Old yew', adj: 'Old-yew', strip: [9, 4, 5, 2], widen: 1.15, line: 'centuries in the grain: more GREATs, and a forgiving band', dmg: 1.35, val: 2.2, tint: '#6a3a1e', level: 5 },
  sharkhide: { name: 'Shark hide', adj: 'Sharkskin', strip: [9, 4, 5, 2], widen: .85, line: 'tough: a narrower band, more GREATs and more tears', dmg: 1.3, val: 1.6, tint: '#6a7a80', level: 3 },
};
const BLADE_METALS = ['iron', 'bronze', 'steel', 'silver', 'darkclay'];
const HIDES = ['deer', 'goat', 'sharkhide'];
const WOODS = ['yew', 'birch', 'oak', 'oldyew'];
const HERBS = ['mending', 'sleepmoss', 'emberroot', 'ghostcap'];
const SANDS = ['clearsand', 'riversand', 'blacksand', 'seasand'];
const FLUX = [{ name: 'Potash', mat: 'potash' }, { name: 'Lime', mat: 'lime' }];
const COLOUR = [{ name: 'Clear' }, { name: 'Cobalt', mat: 'cobalt', val: 1.2 }, { name: 'Starglass', mat: 'starglass', rare: true }];
const glassAffixes = ['moonlit', 'spiritsighted', 'startouched', 'learned', 'coinsense', 'hallowed'];
const WATER = [{ name: 'Well water' }, { name: 'Spring water', mat: 'springwater', val: 1.05 }, { name: 'Moonwell water', mat: 'moonwater', rare: true }];
const BINDER = [{ name: 'Honey', mat: 'honey' }, { name: 'Beeswax', mat: 'wax' }, { name: 'Tallow', mat: 'tallow' }];
const brewAffixes = ['learned', 'startouched', 'warmlined', 'weatherproof', 'graveward', 'steady', 'quiet'];
const STRINGS = [{ name: 'Gut', mat: 'gut' }, { name: 'Silk', mat: 'silk', val: 1.1 }, { name: 'Wyvern sinew', mat: 'sinew', rare: true }];
const NOCKS = [{ name: 'Horn', mat: 'horn' }, { name: 'Bone', mat: 'bone' }, { name: 'Starmetal', mat: 'starmetal', rare: true }];
const bowAffixes = ['strongdrawn', 'quicknocked', 'farflying', 'balanced', 'keen', 'quiet', 'hallowed', 'deepborn'];
const RARE_LEVEL = 5;   // the trade level that opens a pattern's rare part

const weaponAffixes = ['keen', 'biting', 'balanced', 'parrying', 'crushing', 'steady', 'hallowed', 'deepborn', 'sundering'];
const helmAffixes = ['warmlined', 'turning', 'quiet', 'lightstrapped', 'weatherproof', 'graveward', 'unyielding'];
const ringAffixes = ['coinsense', 'learned', 'startouched', 'moonlit', 'spiritsighted'];
const wearAffixes = ['warmlined', 'turning', 'quiet', 'lightstrapped', 'weatherproof', 'graveward', 'unyielding', 'steady'];
const LINING = [{ name: 'Wool', mat: 'wool' }, { name: 'Linen', mat: 'linen', val: 1.05 }, { name: 'Winter fox', mat: 'winterfox', rare: true }];
const THREAD = [{ name: 'Gut', mat: 'gut' }, { name: 'Waxed cord', mat: 'cord' }, { name: 'Silver thread', mat: 'silverthread', rare: true }];

// parts[0] takes a metal and sets the strip; the others are named options, a rare one turning a GOOD into a TRUE
export const PATTERNS = {
  falchion: { name: 'Falchion', trade: 'Falchions', kind: 'SWORD · ONE HAND', art: 'falchion', dice: [1, 8], dmg: [4, 9], speed: 1.4, reach: 1.6, skill: 'SWORDPLAY', value: 80, bars: 3, want: 'weapon',
    parts: [{ part: 'Blade', metals: BLADE_METALS },
      { part: 'Guard', opts: [{ name: 'Iron', mat: 'iron' }, { name: 'Bronze', mat: 'bronze' }, { name: 'Blackwater iron', mat: 'blackwater', rare: true }] },
      { part: 'Grip', opts: [{ name: 'Leather wrap', mat: 'wrap' }, { name: 'Shark hide', mat: 'sharkhide', val: 1.1 }, { name: 'Cord', mat: 'cord' }] }],
    affixes: weaponAffixes, lore: ['Sound work. It does what a blade does.', 'Sound work, and a little more. It does what a blade does, and it does it first.', 'The curve runs true from guard to point. Folk will ask who made it.', 'Old blood in the steel: it remembers every hand that ever held a sword.'] },
  dagger: { name: 'Dagger', trade: 'Daggers', kind: 'DAGGER · ONE HAND', art: 'dagger', dice: [1, 4], dmg: [1, 4], speed: 2.0, reach: 1.0, skill: 'DAGGERS', value: 24, bars: 1, want: 'weapon',
    parts: [{ part: 'Blade', metals: BLADE_METALS },
      { part: 'Guard', opts: [{ name: 'None' }, { name: 'Iron', mat: 'iron', val: 1.15 }, { name: 'Blackwater iron', mat: 'blackwater', rare: true }] },
      { part: 'Grip', opts: [{ name: 'Cord', mat: 'cord' }, { name: 'Leather wrap', mat: 'wrap' }, { name: 'Horn', mat: 'horn', val: 1.1 }] }],
    affixes: weaponAffixes, lore: ['A plain knife for plain work.', 'It sits in the hand as if it grew there.', 'Thin as a reed and twice as patient.', 'It was a knife once. Now it is the knife, and it knows it.'] },
  axe: { name: 'Axe', trade: 'Axe heads', kind: 'AXE · ONE HAND', art: 'axe', dice: [1, 8], dmg: [3, 10], speed: 1.0, reach: 1.5, skill: 'AXEWORK', value: 44, bars: 2, want: 'weapon',
    parts: [{ part: 'Head', metals: BLADE_METALS },
      { part: 'Haft', opts: [{ name: 'Ash', mat: 'ash' }, { name: 'Rowan', mat: 'rowan', val: 1.05 }, { name: 'Bog oak', mat: 'bogoak', rare: true }] },
      { part: 'Wrap', opts: [{ name: 'Leather wrap', mat: 'wrap' }, { name: 'Cord', mat: 'cord' }] }],
    affixes: weaponAffixes.concat('bleeding'), lore: ['It splits wood and it splits shields.', 'The beard hooks, the edge bites, the haft forgives.', 'A head like this outlives three hafts and two owners.', 'Kings have been crowned for less than the stroke this was made for.'] },
  helm: { name: 'Helm', trade: 'Helms', kind: 'HELM', art: 'helm', armour: 4, weight: 3, value: 56, bars: 3, want: 'helm',
    parts: [{ part: 'Plate', metals: BLADE_METALS },
      { part: 'Lining', opts: [{ name: 'Wool', mat: 'wool' }, { name: 'Silk', mat: 'silk', val: 1.15 }, { name: 'Winter fox', mat: 'winterfox', rare: true }] },
      { part: 'Strap', opts: [{ name: 'Leather', mat: 'strap' }, { name: 'Cord', mat: 'cord' }] }],
    affixes: helmAffixes, lore: ['It keeps the rain off and most of the rest.', 'Raised true: no seam for a blade to find.', 'The dome rings like a bell when struck, and the wearer stands.', 'Struck once, it sings; struck twice, the striker thinks again.'] },
  ring: { name: 'Ring', trade: 'Rings', kind: 'RING', art: 'ring', value: 20, bars: 1, want: 'ring',
    parts: [{ part: 'Band', metals: ['bronze', 'iron', 'silver', 'darkclay'] },
      { part: 'Stone', opts: [{ name: 'None' }, { name: 'Rough gem', mat: 'gem', val: 1.6 }, { name: 'Starglass', mat: 'starglass', rare: true }] },
      { part: 'Setting', opts: [{ name: 'Plain' }, { name: 'Claw' }] }],
    affixes: ringAffixes, lore: ['A plain band, honestly round.', 'It catches the light and a little luck.', 'Small work is the hardest work. This is small work done right.', 'It fits whoever it chooses, and it does not choose often.'] },
  // the stretcher's
  jerkin: { name: 'Jerkin', trade: 'Jerkins', kind: 'COAT · CHEST', art: 'jerkin', armour: 3, weight: 4, value: 55, bars: 3, want: 'armour', station: 'stretcher',
    parts: [{ part: 'Hide', metals: HIDES }, { part: 'Lining', opts: LINING }, { part: 'Thread', opts: THREAD }],
    affixes: wearAffixes, lore: ['It keeps the wind out and the shape in.', 'Stitched close: it moves when you move.', 'The seams are the work: not one of them will give.', 'Leather like this was a beast that never lost a fight.'] },
  hood: { name: 'Hood', trade: 'Hoods', kind: 'HOOD · HEAD', art: 'hood', armour: 1, weight: 1, value: 22, bars: 1, want: 'helm', station: 'stretcher',
    parts: [{ part: 'Hide', metals: HIDES }, { part: 'Lining', opts: LINING }, { part: 'Thread', opts: THREAD }],
    affixes: wearAffixes, lore: ['Rain off, ears warm.', 'It sits close and keeps out more than weather.', 'A hood a scout would trade a horse for.', 'Pull it up and the road forgets your face.'] },
  // the glass's: lenses, goblets and panes are pieces; bottles go to the store room for the kettle (makes: what a working yields)
  lens: { name: 'Lens', trade: 'Lenses', kind: 'LENS', art: 'lens', clarity: 10, value: 40, bars: 2, want: 'glass', station: 'glass',
    parts: [{ part: 'Sand', metals: SANDS }, { part: 'Flux', opts: FLUX }, { part: 'Colour', opts: COLOUR }],
    affixes: glassAffixes, lore: ['It brings the far thing near.', 'Ground true: not a ripple in it.', 'Through it a scholar reads what the page forgot.', 'It shows what is there, and a little of what was.'] },
  goblet: { name: 'Goblet', trade: 'Goblets', kind: 'GOBLET', art: 'goblet', clarity: 8, value: 34, bars: 2, want: 'glass', station: 'glass',
    parts: [{ part: 'Sand', metals: SANDS }, { part: 'Flux', opts: FLUX }, { part: 'Colour', opts: COLOUR }],
    affixes: glassAffixes, lore: ['It holds wine and catches the fire.', 'A stem as thin as a reed, and it stands.', 'Lords drink from worse.', 'Wine poured in it tastes of the year the vine was planted.'] },
  pane: { name: 'Pane', trade: 'Panes', kind: 'PANE · A WINDOW', art: 'pane', clarity: 6, value: 34, bars: 2, want: 'glass', station: 'glass', windowed: true,
    parts: [{ part: 'Sand', metals: SANDS }, { part: 'Flux', opts: FLUX }, { part: 'Colour', opts: COLOUR }],
    affixes: glassAffixes, lore: ['Daylight, let in.', 'Flat as still water.', 'The light through it looks like it\'s been somewhere better.', 'Look through it at dusk and the street is the way it was a hundred years ago.'] },
  bottles: { name: 'Bottles', trade: 'Bottles', kind: 'BOTTLES · FOR THE KETTLE', art: 'draught', value: 4, bars: 1, station: 'glass', makes: { mat: 'bottle', n: [6, 8, 10] },
    parts: [{ part: 'Sand', metals: SANDS }, { part: 'Flux', opts: FLUX }, { part: 'Colour', opts: [{ name: 'Clear' }] }],
    affixes: [], lore: ['', '', '', ''] },
  // the kettle's: a batch of three, each bottle sold on its own (every batch takes three bottles: bought, or blown at the glass)
  draught: { name: 'Draught', trade: 'Draughts', kind: 'DRAUGHT · A BATCH', art: 'draught', potency: 10, value: 14, bars: 2, batch: 3, want: 'brew', station: 'kettle',
    parts: [{ part: 'Herb', metals: HERBS }, { part: 'Water', opts: WATER }, { part: 'Binder', opts: BINDER }],
    affixes: brewAffixes, lore: ['It tastes of the hedge and works anyway.', 'Clear as a stream, and it mends like one.', 'A dram of this and the road looks shorter.', 'One swallow, and the wound forgets it was ever there.'] },
  salve: { name: 'Salve', trade: 'Salves', kind: 'SALVE · A BATCH', art: 'salve', potency: 8, value: 12, bars: 2, batch: 3, want: 'brew', station: 'kettle',
    parts: [{ part: 'Herb', metals: HERBS }, { part: 'Water', opts: WATER }, { part: 'Binder', opts: BINDER }],
    affixes: brewAffixes, lore: ['For cuts, scrapes and the things you don\'t mention.', 'It smells of honey and it stings for a moment.', 'A wound dressed with this closes by morning.', 'Old scars fade under it, and some of the stories with them.'] },
  oil: { name: 'Blade oil', trade: 'Oils', kind: 'OIL · A BATCH', art: 'oil', potency: 6, value: 16, bars: 2, batch: 3, want: 'brew', station: 'kettle',
    parts: [{ part: 'Herb', metals: HERBS }, { part: 'Water', opts: WATER }, { part: 'Binder', opts: BINDER }],
    affixes: ['keen', 'biting', 'hallowed', 'weatherproof', 'balanced'], lore: ['Keeps an edge from going to rust.', 'A wipe of this and the blade sings.', 'Whatever it\'s rubbed on bites deeper.', 'An edge oiled with this has never once been sorry.'] },
  tonic: { name: 'Tonic', trade: 'Tonics', kind: 'TONIC · A BATCH', art: 'tonic', potency: 14, value: 22, bars: 3, batch: 3, want: 'brew', station: 'kettle',
    parts: [{ part: 'Herb', metals: HERBS }, { part: 'Water', opts: WATER }, { part: 'Binder', opts: BINDER }],
    affixes: brewAffixes, lore: ['Bitter, and worth it.', 'Two sips and the night is shorter.', 'They\'ll sing of the night they drank this.', 'Drink it and sleep like the hills do.'] },
  // the bench's (arrows need forged heads, a staff a forged ferrule: made at the forge, or bought dearer)
  shortbow: { name: 'Shortbow', trade: 'Shortbows', kind: 'BOW · TWO HANDS', art: 'shortbow', dice: [1, 6], dmg: [3, 8], speed: 1.5, range: 30, skill: 'ARCHERY', value: 45, bars: 2, want: 'bow', station: 'bowbench',
    parts: [{ part: 'Stave', metals: WOODS }, { part: 'String', opts: STRINGS }, { part: 'Nocks', opts: NOCKS }],
    affixes: bowAffixes, lore: ['It draws, it looses, it flies true enough.', 'Quick to the string and quicker to the mark.', 'It bends like it remembers the tree.', 'The string hums before the arrow leaves, as if it already knows.'] },
  longbow: { name: 'Longbow', trade: 'Longbows', kind: 'BOW · TWO HANDS', art: 'longbow', dice: [1, 8], dmg: [5, 12], speed: 1.0, range: 60, skill: 'ARCHERY', value: 90, bars: 3, want: 'bow', station: 'bowbench',
    parts: [{ part: 'Stave', metals: WOODS }, { part: 'String', opts: STRINGS }, { part: 'Nocks', opts: NOCKS }],
    affixes: bowAffixes, lore: ['A long pull and a long way.', 'The kind of bow that wins a field.', 'Heartwood and sapwood, and the arrow goes where it\'s told.', 'Old yew and old blood: the arrow arrives before the sound.'] },
  staff: { name: 'Staff', trade: 'Staves', kind: 'STAFF · FOCUS', art: 'staff', dice: [1, 6], dmg: [2, 6], speed: 1.2, reach: 2.0, skill: 'STAVES', value: 60, bars: 2, want: 'weapon', station: 'bowbench',
    parts: [{ part: 'Stave', metals: WOODS }, { part: 'Ferrule', opts: [{ name: 'Forged ferrule', mat: 'ferrule' }] }, { part: 'Head', opts: [{ name: 'Plain' }, { name: 'Rough gem', mat: 'gem', val: 1.5 }, { name: 'Starglass', mat: 'starglass', rare: true }] }],
    affixes: ['startouched', 'learned', 'moonlit', 'spiritsighted', 'hallowed', 'balanced', 'steady'], lore: ['A walking stick with ambitions.', 'It hums a little in the hand.', 'The grain spirals, and so does whatever passes through it.', 'It was a branch of something older than the forest.'] },
  arrows: { name: 'Arrows', trade: 'Arrows', kind: 'ARROWS · A SHEAF OF 20', art: 'arrows', dice: [1, 6], dmg: [2, 5], speed: 1.8, range: 40, skill: 'ARCHERY', value: 24, bars: 1, want: 'arrows', station: 'bowbench',
    parts: [{ part: 'Shafts', metals: WOODS }, { part: 'Heads', opts: [{ name: 'Forged heads', mat: 'arrowheads' }] }, { part: 'Fletching', opts: [{ name: 'Goose', mat: 'goose' }, { name: 'Raven', mat: 'raven', val: 1.1 }] }],
    affixes: ['strongdrawn', 'farflying', 'biting', 'hallowed', 'bleeding'], lore: ['Twenty of them, all alike, which is the point.', 'Straight shafts and honest heads.', 'Each one fletched as if it were the only one.', 'Twenty arrows, and every one of them comes home.'] },
  gloves: { name: 'Gloves', trade: 'Gloves', kind: 'GLOVES · HANDS', art: 'gloves', armour: 1, weight: 1, value: 24, bars: 1, want: 'armour', station: 'stretcher',
    parts: [{ part: 'Hide', metals: HIDES }, { part: 'Lining', opts: LINING }, { part: 'Thread', opts: THREAD }],
    affixes: wearAffixes, lore: ['Work gloves: the work is yours.', 'They fit like they were measured. They were.', 'Ten fingers of good leather and not a seam that rubs.', 'Put them on and your hands remember a craft you never learned.'] },
  boots: { name: 'Boots', trade: 'Boots', kind: 'BOOTS · FEET', art: 'boots', armour: 2, weight: 2, value: 40, bars: 2, want: 'armour', station: 'stretcher',
    parts: [{ part: 'Hide', metals: HIDES }, { part: 'Lining', opts: LINING }, { part: 'Thread', opts: THREAD }],
    affixes: wearAffixes, lore: ['Dry feet are half of any road.', 'Broken in before they leave the shop.', 'They\'ll outlast the roads they walk.', 'They have walked to the edge of the map and come back with stories.'] },
};
for (const p of Object.values(PATTERNS)) for (const part of p.parts) for (const o of part.opts || []) if (o.rare) { o.level = RARE_LEVEL; o.line = 'rare: a GOOD becomes a TRUE'; }

// from Darkclay Zero's affixes.json: {0} is rolled between min and max (scale divides it)
export const AFFIXES = {
  keen: { word: 'Keen', min: 20, max: 50, line: 'a whet lasts {0}% longer' },
  biting: { word: 'Biting', min: 10, max: 25, line: 'telling blows strike {0}% harder' },
  bleeding: { word: 'Bleeding', min: 1, max: 2, line: 'one blow in four bleeds the foe {0} a second for 4 s' },
  balanced: { word: 'Balanced', min: 3, max: 6, line: 'swings {0}% quicker' },
  parrying: { word: 'Parrying', min: 5, max: 12, line: 'the parry {0}% stronger' },
  crushing: { word: 'Crushing', min: 10, max: 25, line: 'staggers {0}% more' },
  sundering: { word: 'Sundering', min: 1, max: 2, line: 'a blow strips {0} of the foe\'s armour for 6 s' },
  steady: { word: 'Steady', min: 10, max: 25, line: 'poise taken {0}% less' },
  unyielding: { word: 'Unyielding', min: 15, max: 30, line: 'knocked back {0}% less' },
  hallowed: { word: 'Hallowed', min: 5, max: 15, line: '+{0}% on the dead' },
  graveward: { word: 'Graveward', min: 5, max: 12, line: 'the dead hit {0}% softer' },
  moonlit: { word: 'Moonlit', min: 15, max: 30, scale: 10, line: 'a pale light {0} m round the holder' },
  spiritsighted: { word: 'Spirit-sighted', min: 6, max: 10, line: 'spirits and the unseen shown within {0} m' },
  deepborn: { word: 'Deepborn', min: 3, max: 6, line: 'under the ground: {0}% more on every blow, {0}% less taken' },
  startouched: { word: 'Star-touched', min: 5, max: 12, line: 'arts back {0}% sooner' },
  warmlined: { word: 'Warm-lined', min: 1, max: 2, line: '+{0} warmth' },
  turning: { word: 'Turning', min: 10, max: 25, line: 'arrows and bolts land {0}% softer' },
  quiet: { word: 'Quiet', min: 10, max: 20, line: 'creatures notice you {0}% later' },
  lightstrapped: { word: 'Light-strapped', min: 8, max: 15, line: '{0}% lighter' },
  weatherproof: { word: 'Weatherproof', min: 15, max: 30, line: 'wet and cold come on {0}% slower' },
  coinsense: { word: 'Coin-sense', min: 5, max: 12, line: '+{0}% coins found' },
  strongdrawn: { word: 'Strong-drawn', min: 1, max: 2, line: '+{0} on every arrow' },
  quicknocked: { word: 'Quick-nocked', min: 10, max: 20, line: 'draws {0}% quicker' },
  farflying: { word: 'Far-flying', min: 10, max: 20, line: 'arrows fly {0}% further' },
  learned: { word: 'Learned', min: 5, max: 12, line: '+{0}% trade XP' },
};

// found tiles: old makers' tiles, kept for good; each counts as a GOOD and does its trick
export const FOUND = {
  ember: { name: 'Ember Tile', short: 'EMBER', glaze: '#ff7a2a', line: 'the heat jumps back up a band' },
  warden: { name: 'Warden\'s Tile', short: 'WARDEN', glaze: '#8fb8d8', line: 'the next CRACK is a HOLD' },
  twin: { name: 'Twin Tile', short: 'TWIN', glaze: '#f0a35c', line: 'the next tile counts twice' },
  mender: { name: 'Mender\'s Tile', short: 'MENDER', glaze: '#8fc46a', line: 'clears one crack\'s mark' },
  seer: { name: 'Seer\'s Tile', short: 'SEER', glaze: '#c08ae8', line: 'shows the next two face-down tiles' },
  echo: { name: 'Echo Tile', short: 'ECHO', glaze: '#b8b0a2', line: 'your last GOOD goes back face down' },
  hollow: { name: 'The Hollow King\'s Tile', short: 'HOLLOW', glaze: '#c4483a', line: 'counts as a GREAT, but slips a CRACK in' },
  frost: { name: 'Frost-kiss', short: 'FROST', glaze: '#cfe8ff', line: 'rare: the piece takes a small frost side' },
};

export const SPEED_WORDS = [[0, 'slow'], [0.9, 'steady'], [1.3, 'quick'], [1.8, 'fleet']];
export const BARS = { damage: 16, speed: 2.3, reach: 3.0, armour: 12, weight: 8 };

// ---------- materials and who sells them ----------
// price: the base in coins, before the hour's drift. A metal's bars share the metal's id.
export const MATS = {
  iron: { name: 'Iron bar', price: 8, unit: 'bar' }, bronze: { name: 'Bronze bar', price: 7, unit: 'bar' }, steel: { name: 'Steel bar', price: 14, unit: 'bar' },
  silver: { name: 'Silver bar', price: 30, unit: 'bar' }, darkclay: { name: 'Darkclay steel bar', price: 40, unit: 'bar' },
  clearsand: { name: 'Clear sand', price: 6 }, riversand: { name: 'River sand', price: 5 }, blacksand: { name: 'Black sand', price: 12 }, seasand: { name: 'Sea-glass sand', price: 30 },
  potash: { name: 'Potash', price: 1 }, lime: { name: 'Lime', price: 1 }, cobalt: { name: 'Cobalt', price: 8 },
  mending: { name: 'Mending herbs', price: 3 }, sleepmoss: { name: 'Sleepmoss', price: 3 }, emberroot: { name: 'Emberroot', price: 6 }, ghostcap: { name: 'Ghostcap', price: 16 },
  springwater: { name: 'Spring water', price: 1 }, honey: { name: 'Honey', price: 2 }, wax: { name: 'Beeswax', price: 2 }, tallow: { name: 'Tallow', price: 1 },
  bottle: { name: 'Bottle', price: 4, blown: true }, moonwater: { name: 'Moonwell water', price: 40, rare: true },
  birch: { name: 'Birch stave', price: 7 }, yew: { name: 'Yew stave', price: 8 }, oak: { name: 'Oak stave', price: 12 }, oldyew: { name: 'Old yew stave', price: 35 },
  bone: { name: 'Bone', price: 2 }, goose: { name: 'Goose feathers', price: 1 }, raven: { name: 'Raven feathers', price: 3 },
  arrowheads: { name: 'Arrowheads', price: 8, forged: true }, ferrule: { name: 'Ferrule', price: 14, forged: true },
  sinew: { name: 'Wyvern sinew', price: 50, rare: true }, starmetal: { name: 'Starmetal', price: 60, rare: true },
  deer: { name: 'Deer hide', price: 6 }, goat: { name: 'Goat hide', price: 5 }, linen: { name: 'Linen', price: 3 }, gut: { name: 'Gut', price: 1 },
  silverthread: { name: 'Silver thread', price: 40, rare: true },
  wrap: { name: 'Leather wrap', price: 3 }, cord: { name: 'Cord', price: 1 }, sharkhide: { name: 'Shark hide', price: 9 }, horn: { name: 'Horn', price: 4 },
  ash: { name: 'Ash haft', price: 2 }, rowan: { name: 'Rowan haft', price: 4 }, wool: { name: 'Wool', price: 2 }, silk: { name: 'Silk', price: 10 }, strap: { name: 'Leather strap', price: 2 },
  gem: { name: 'Rough gem', price: 14 },
  blackwater: { name: 'Blackwater iron', price: 45, rare: true }, bogoak: { name: 'Bog oak', price: 35, rare: true },
  winterfox: { name: 'Winter fox pelt', price: 55, rare: true }, starglass: { name: 'Starglass', price: 70, rare: true },
};
// pick: how many of its rare lines a pack carries in an hour (0: all of them, always)
export const SUPPLIERS = [
  { id: 'yard', name: 'Dougal\'s Yard', kind: 'THE SMELTER', line: 'Bars from the smelter, iron to darkclay steel.', lines: ['iron', 'bronze', 'steel', 'silver', 'darkclay'] },
  { id: 'tannery', name: 'The Tannery on the Ford', kind: 'HIDES, HAFTS AND CLOTH', line: 'Wraps, cord, hafts, linings and straps.', lines: ['deer', 'goat', 'sharkhide', 'wrap', 'cord', 'gut', 'horn', 'ash', 'rowan', 'wool', 'linen', 'silk', 'strap'] },
  { id: 'timber', name: 'Hollin\'s Timber', kind: 'STAVES AND FEATHERS', line: 'Staves seasoned for the bench, feathers, bone; forged heads and ferrules, dear.', lines: ['birch', 'yew', 'oak', 'oldyew', 'bone', 'goose', 'raven', 'arrowheads', 'ferrule'] },
  { id: 'sandpit', name: 'The Sandpit', kind: 'SAND AND FLUX', line: 'Sands for the glass, potash and lime, cobalt for blue.', lines: ['clearsand', 'riversand', 'blacksand', 'seasand', 'potash', 'lime', 'cobalt'] },
  { id: 'herbs', name: 'Marrow\'s Herbs', kind: 'THE HERBALIST', line: 'Herbs, honey, wax, spring water; bottles too, though the glassworks\' are dearer here.', lines: ['mending', 'sleepmoss', 'emberroot', 'ghostcap', 'springwater', 'honey', 'wax', 'tallow', 'bottle'] },
  { id: 'pack', name: 'Nell Quarry\'s Pack', kind: 'A PEDLAR', line: 'Gems always; rare things, two at a time, changing on the hour.', lines: ['gem'], rare: ['blackwater', 'bogoak', 'winterfox', 'starglass', 'silverthread', 'sinew', 'starmetal', 'moonwater'], pick: 2 },
];

// ---------- the shop ----------
// Zero's counter.json: a tag multiplies the price and the odds a customer takes it
export const TAGS = { cheap: { word: 'CHEAP', mult: 0.7, odds: 1.5 }, fair: { word: 'FAIR', mult: 1.0, odds: 1.0 }, dear: { word: 'DEAR', mult: 1.3, odds: 0.6 } };
export const SLOT_COSTS = [120, 250, 500, 900];   // the 5th to the 8th shelf
export const START_SLOTS = 4;
// who comes in (Darkclay Zero, docs/CRAFT-AAA.md §5.2): a want, a purse, a mood. wants: a pattern id, 'weapon', 'helm', 'ring' or 'any'.
// least: the lowest tier they'll look at. moods: weights for EAGER, WARY, PINCHED.
export const CUSTOMERS = [
  { id: 'folk', weight: 30, purse: [6, 45], wants: ['dagger', 'ring', 'any', 'dagger', 'axe', 'armour', 'gloves', 'brew', 'salve', 'brew'], moods: [15, 35, 50], fig: '#a08a6a',
    names: ['a miner off the shift', 'a carter', 'a farmer\'s wife', 'a ferryman', 'a charcoal burner', 'a boy with his savings', 'a widow from the lane'] },
  { id: 'guard', weight: 25, purse: [40, 170], wants: ['falchion', 'axe', 'helm', 'weapon', 'dagger', 'armour', 'jerkin', 'bow', 'arrows', 'oil', 'brew'], moods: [35, 50, 15], fig: '#7a8aa0',
    names: ['a warden\'s man', 'a gate guard', 'a sergeant of the pikes', 'a drover riding out armed', 'a watchman'] },
  { id: 'traveller', weight: 20, purse: [30, 240], wants: ['any', 'ring', 'weapon', 'dagger', 'boots', 'armour', 'brew', 'tonic', 'glass', 'goblet'], moods: [30, 45, 25], fig: '#8a9a6a',
    names: ['a caravan master', 'a pilgrim to the abbey', 'a tinker', 'a hedge-knight\'s squire', 'a ferry-bound merchant'] },
  { id: 'delver', weight: 15, purse: [80, 420], wants: ['weapon', 'helm', 'axe', 'falchion', 'any', 'armour', 'boots', 'arrows', 'staff', 'draught', 'brew', 'lens'], moods: [50, 40, 10], fig: '#9a6a5a',
    names: ['a delver of the Reach', 'one of Osk\'s Four', 'a door-breaker', 'a lamp-carrier back from the deep'] },
  { id: 'hunter', weight: 12, purse: [20, 180], wants: ['bow', 'arrows', 'shortbow', 'longbow', 'arrows', 'boots', 'any', 'salve'], moods: [35, 45, 20], fig: '#6a7a4a',
    names: ['a hunter from the Reach', 'a trapper', 'a fowler', 'a poacher, quietly', 'a deer-stalker'] },
  { id: 'factor', weight: 7, purse: [200, 750], wants: ['ring', 'helm', 'any', 'glass', 'lens', 'goblet'], least: 1, moods: [30, 55, 15], fig: '#b89a5a',
    names: ['a guild factor', 'a reeve\'s steward', 'a lord\'s buyer'] },
  { id: 'collector', weight: 3, purse: [500, 1600], wants: ['any'], least: 1, moods: [55, 40, 5], fig: '#a07ab8',
    names: ['a collector of maker\'s marks', 'Lady Ysmay Corrow\'s man'] },
  // the wealthy: none come to an unknown shop. rich: { from: the renown rung they start at, step: weight added a rung from there,
  // oldBlood: weight added for each Old-Blood piece on the shelf or the wall (two at most), counted from the rung before `from` }
  { id: 'steward', weight: 0, rich: { from: 2, step: 3 }, purse: [1500, 4000], wants: ['any', 'falchion', 'helm', 'ring', 'longbow', 'goblet', 'lens', 'staff', 'jerkin'],
    least: 1, moods: [35, 50, 15], fig: '#c9a24a', names: ['a lord\'s steward', 'a merchant prince', 'a guildmaster', 'a bishop\'s chamberlain'] },
  { id: 'master', weight: 0, rich: { from: 3, step: 1, oldBlood: 1.5 }, purse: [3000, 8000], wants: ['any'], least: 2, moods: [50, 45, 5], fig: '#b48cf0',
    names: ['a master collector', 'a duke\'s cabinet-keeper', 'a collector from over the sea'] },
];
export const MOODS = ['EAGER', 'WARY', 'PINCHED'];
export const MOOD_ODDS = { EAGER: 0.9, WARY: 0.6, PINCHED: 0.45 };
// over their purse, a buyer names a price: this share of it, by mood (EAGER all of it, WARY 90 %, PINCHED 80 %)
export const OPENING = { EAGER: 1, WARY: 0.9, PINCHED: 0.8 };
// the town's wants (js/town.js): each real day, two things in demand and one out of favour, the same for every player that day.
// In demand: buyers who want it come half as often again, are a step keener and carry a quarter more for it; out of favour: no one
// asks for it and purses for it are thinner.
export const DEMAND = { want: 0.35, purse: 1.25, cold: 0.85 };
export const TOWN_HOT = [
  { id: 'watch', line: 'The watch is buying helms for the new men.', patterns: ['helm'] },
  { id: 'muster', line: 'The muster is called: blades and axes.', patterns: ['falchion', 'axe', 'dagger'] },
  { id: 'frost', line: 'A frost is coming down off the Reach.', patterns: ['hood', 'gloves', 'boots'] },
  { id: 'fair', line: 'The fair\'s on in the square.', patterns: ['ring', 'goblet'] },
  { id: 'hunt', line: 'The autumn hunt rides out.', patterns: ['shortbow', 'longbow', 'arrows'] },
  { id: 'fever', line: 'A fever in the low lanes.', patterns: ['draught', 'salve', 'tonic'] },
  { id: 'abbey', line: 'Scholars have come to the abbey.', patterns: ['lens', 'pane', 'staff'] },
  { id: 'caravan', line: 'The caravans are setting out.', patterns: ['boots', 'jerkin', 'hood'] },
  { id: 'wet', line: 'A wet month: every edge is rusting.', patterns: ['oil'] },
  { id: 'delve', line: 'A new door found in the deep: the delvers are buying.', patterns: ['axe', 'helm', 'jerkin', 'draught'] },
];
// town events: about one day in four, something happens in town for the whole day (the same in every shop). gap: how much sooner or
// later customers come (×), weights: more of some kinds of buyer (×), purse: what they carry (×), keen: everyone a step keener
export const EVENT_ODDS = 0.25;
export const TOWN_EVENTS = [
  { id: 'fair', name: 'The midsummer fair', line: 'Stalls fill the square and the lanes are full of strangers.', effect: 'More customers, more travellers and folk.', gap: 0.7, weights: { folk: 2, traveller: 2 } },
  { id: 'muster', name: 'The muster', line: 'The watch is called up and every man wants to be armed by morning.', effect: 'Guards and delvers crowd in, carrying more.', gap: 0.9, weights: { guard: 3, delver: 2 }, purse: 1.15 },
  { id: 'feast', name: 'Saint Brannoc\'s feast', line: 'Bells, bread and an open hand: it\'s a day for spending.', effect: 'Every buyer a step keener, purses fuller.', purse: 1.2, keen: true },
  { id: 'caravan', name: 'A spice caravan', line: 'A caravan from the south camps by the river for the night.', effect: 'Factors and travellers with deep purses.', gap: 0.85, weights: { factor: 3, traveller: 2, steward: 2 }, purse: 1.1 },
  { id: 'siege', name: 'Raiders on the high road', line: 'The gates are shut at noon. Fewer come in, and those who do want steel.', effect: 'Half the customers, but they carry a third more.', gap: 1.8, weights: { guard: 3 }, purse: 1.35 },
  { id: 'storm', name: 'A three-day storm', line: 'Rain off the Reach. Only the desperate are out.', effect: 'Fewer customers.', gap: 1.4 },
];
export const TOWN_COLD = [
  { id: 'barges', line: 'Arrows are cheap off the river barges.', patterns: ['arrows'] },
  { id: 'pedlar', line: 'A pedlar is selling tin rings at the gate.', patterns: ['ring'] },
  { id: 'armoury', line: 'The armoury sold off its old helms.', patterns: ['helm'] },
  { id: 'almoner', line: 'The almoner is handing out draughts.', patterns: ['draught'] },
  { id: 'glut', line: 'A glut of knives from the coast.', patterns: ['dagger'] },
  { id: 'cobbler', line: 'A new cobbler on the bridge.', patterns: ['boots'] },
];   // the odds they take a piece at FAIR they can afford

// ---------- the counter (milestone 3) ----------
// Darkclay Zero's OPEN THE SHOP (docs/CRAFT-AAA.md §5.3): what each choice asks of the shelf's price
export const HAGGLE = { meet: { word: 'MEET THEM', mult: 0.9 }, hold: { word: 'HOLD', mult: 1 }, ask: { word: 'ASK MORE', mult: 1.15 } };
// what each mood does with each choice: sold, a counter-offer (at HOLD's or MEET's price), or gone
export const HAGGLE_TABLE = {
  EAGER: { meet: 'sold', hold: 'sold', ask: 'sold' },
  WARY: { meet: 'sold', hold: 'sold', ask: 'counter:hold' },
  PINCHED: { meet: 'sold', hold: 'counter:meet', ask: 'gone' },
};
// the tell in their words: read it before the haggle
export const TELLS = {
  EAGER: ['"Before the week\'s out, if it\'s any good."', '"Show me the best you\'ve got."', '"I\'ve heard about your work."'],
  WARY: ['"I\'ve bought ones that bent."', '"Let me see it in the light first."', '"Your sign says maker. We\'ll see."'],
  PINCHED: ['"It\'s all I have."', '"What\'s the least you\'d take?"', '"I can\'t go far on this purse."'],
};
export const PATIENCE = 45;    // seconds a customer waits at the counter to be served before they look for themselves
export const QUEUE_MAX = 3;    // one at the counter, two waiting
export const SELLER_ODDS = 0.14;   // of those who come in while you're at the counter, how many have something to sell
// the named regulars who leave special orders (Darkclay Zero's regulars, §5.2): wants, a least tier, a metal they insist on
export const REGULARS = [
  { who: 'Sergeant Ollo Vance', wants: ['falchion', 'axe', 'helm', 'jerkin'], line: 'For the gate. The pikes need better than they\'ve got.', fig: '#7a8aa0' },
  { who: 'Lady Ysmay Corrow', wants: ['ring', 'falchion', 'helm', 'longbow', 'staff', 'lens', 'goblet'], least: 1, line: 'Something with a maker\'s mark worth the name.', fig: '#a07ab8' },
  { who: 'Bram Oakes, a drover', wants: ['dagger', 'axe', 'boots', 'arrows'], line: 'For my drovers. Good ones, mind.', fig: '#8a9a6a' },
  { who: 'Ketty Moss, a widow', wants: ['ring'], metal: 'silver', line: 'A silver ring, for his grave.', fig: '#a08a6a' },
  { who: 'Marrow, the herbalist', wants: ['tonic', 'draught', 'salve'], line: 'My own kettle\'s cracked. Brew for me this once.', fig: '#8a9a6a' },
  { who: 'Tib Harrow', wants: ['dagger'], line: 'A knife. My own. I\'ve saved for it.', fig: '#a08a6a' },
];
// regulars with stories: three orders over days (the next comes back STORY_GAP hours after the last was filled), a gift for the shop
// at the end. A step names the patterns it can ask for, first the shop can make; it waits while the shop can make none of them.
export const STORY_GAP = 18, STORY_PAYS = 2.5, STORY_ODDS = 0.6;
export const STORIES = [
  { id: 'ketty', who: 'Ketty Moss, a widow', fig: '#a08a6a', gift: 'kettycandles', renown: 10, steps: [
    { patterns: ['ring'], metal: 'silver', least: 0, line: 'A silver ring, for his grave.', thanks: 'It shines on the stone. He\'d have liked that.' },
    { patterns: ['dagger'], least: 0, line: 'My boy\'s going out with the drovers. A knife he can trust.', thanks: 'He wears it on his belt like a soldier.' },
    { patterns: ['helm'], least: 1, line: 'He\'s joined the watch now. Keep his head, would you?', thanks: 'Take these. They burned for his father; let them burn for your shop.' } ] },
  { id: 'vance', who: 'Sergeant Ollo Vance', fig: '#7a8aa0', gift: 'watchbanner', renown: 15, steps: [
    { patterns: ['falchion'], least: 0, line: 'For the gate. The pikes need better than they\'ve got.', thanks: 'Held the gate with it twice this week.' },
    { patterns: ['helm', 'jerkin'], least: 1, line: 'The new men need covering. Good work, not pretty.', thanks: 'Not a scratch on them after the raid.' },
    { patterns: ['axe', 'falchion'], least: 2, line: 'The captain wants one from you. Your best.', thanks: 'The watch flies your mark now. Hang this where they\'ll see it.' } ] },
  { id: 'bram', who: 'Bram Oakes, a drover', fig: '#8a9a6a', gift: 'bramsbarrels', renown: 10, steps: [
    { patterns: ['dagger'], least: 0, line: 'For my drovers. Good ones, mind.', thanks: 'They argue over who gets to carry it.' },
    { patterns: ['boots', 'axe'], least: 0, line: 'The road\'s long this season.', thanks: 'Not one of them lame by the river.' },
    { patterns: ['arrows', 'axe', 'longbow'], least: 1, line: 'Wolves on the high road. Something for them.', thanks: 'A barrel of the best from the far valley. Yours.' } ] },
  { id: 'corrow', who: 'Lady Ysmay Corrow', fig: '#a07ab8', gift: 'corrowstatue', renown: 25, steps: [
    { patterns: ['ring'], least: 1, line: 'Something with a maker\'s mark worth the name.', thanks: 'It was admired. I said where it came from.' },
    { patterns: ['falchion', 'longbow', 'staff'], least: 2, line: 'A gift for the duke. It must not shame me.', thanks: 'The duke asked your name.' },
    { patterns: ['ring', 'goblet', 'lens'], least: 2, line: 'My daughter marries in spring. The finest thing you can make.', thanks: 'My grandmother\'s king, in stone. He belongs in a maker\'s shop.' } ] },
  { id: 'marrow', who: 'Marrow, the herbalist', fig: '#8a9a6a', gift: 'marrowrail', renown: 10, steps: [
    { patterns: ['draught'], least: 0, line: 'My own kettle\'s cracked. Brew for me this once.', thanks: 'The lane\'s fever broke on it.' },
    { patterns: ['salve'], least: 1, line: 'The tannery boys burn their hands. Something kind.', thanks: 'They come to me singing now. Unheard of.' },
    { patterns: ['tonic'], least: 2, line: 'Old Wenna can\'t sleep. A tonic worth her last nights.', thanks: 'Hang my herbs in your shop. They\'ll do better with you.' } ] },
];
// a second shop, in another town: bought once the shop is SOUGHT. A keeper runs it (open or away, up to the away cap), paid by the
// hour and keeping a share of each sale; its own shop front, shelves and customers (more delvers, travellers and hunters off the river), its own notice board.
export const BRANCH = { town: 'Osk\'s Landing', keeper: 'Wenna Osk', line: 'A river town at the foot of the Reach: delvers going up, merchants coming down.',
  // a smaller town: customers come less often (gap); the keeper keeps a fifth of each sale (cut)
  cost: 30000, rung: 3, wage: 12, cut: 0.2, gap: 1.6, boost: 1, salt: 1, weights: { delver: 2.5, traveller: 1.6, hunter: 1.6, factor: 1.4, folk: 0.6, guard: 0.7 } };
export const ORDER_TIME = [900, 1500];   // seconds of open shop to fill an order in
export const ORDER_PAYS = 2;             // times the worth of the piece it asks for
// who comes in with something to sell
export const SELLERS = [
  { who: 'Nell Quarry, a pedlar', fig: '#b89a5a', kind: 'mats' },
  { who: 'a delver back from the deep', fig: '#9a6a5a', kind: 'mats' },
  { who: 'Hask of Dunmere', fig: '#7a6a5a', kind: 'piece' },
  { who: 'a widow clearing a forge', fig: '#a08a6a', kind: 'piece' },
];

// ---------- the staff and the clock (milestone 4) ----------
export const AWAY_CAP_H = 8;   // hours of away time the staff keep the shop for
// roles: wage in coins an hour at level 1 (+1 a level); clerk: the share of the tag price that reaches the till away (the rest is
// their cut, shrinking as they learn), and how much more readily walk-ins buy while they mind the shop and you're at the forge
export const ROLES = {
  clerk: { word: 'COUNTER CLERK', wage: 4, line: 'Minds the shop while you work and while you\'re away.' },
  runner: { word: 'RUNNER', wage: 3, line: 'Goes out on the roads for materials, old pieces and now and then a found tile.' },
};
export const TRAITS = {
  clerk: [
    { id: 'silver', word: 'Silver-tongued', line: 'keeps a smaller cut' },
    { id: 'early', word: 'Early riser', line: 'keeps the shop two hours longer while you\'re away' },
    { id: 'quick', word: 'Quick learner', line: 'learns half as fast again' },
  ],
  runner: [
    { id: 'surefoot', word: 'Sure-footed', line: 'trips take a fifth less time' },
    { id: 'keen', word: 'Keen-eyed', line: 'brings back a little more' },
    { id: 'lucky', word: 'Lucky', line: 'twice the chance of a found tile' },
    { id: 'quick', word: 'Quick learner', line: 'learns half as fast again' },
  ],
};
export const NAMES = ['Wenna Tolley', 'Pell', 'Pip', 'Corwen Ashe', 'Hollin', 'Mira Fenn', 'Oswy Brack', 'Tamsin Reed', 'Garrow', 'Effa Lind', 'Duncy Holt', 'Brisa Coombe'];
// the runner's roads: hours, provisions (paid when they set out), what they bring (n commons, rare materials, the odds of an old
// piece and of a found tile)
export const ROUTES = {
  yard: { name: 'Down to the yard', from: 'the yard', h: 0.25, fee: 4, commons: [3, 5], rare: 0, piece: 0, tile: 0 },
  ford: { name: 'The ford villages', from: 'the ford villages', h: 1, fee: 12, commons: [6, 9], rare: 0, gem: 0.5, piece: 0.15, tile: 0 },
  reach: { name: 'Out to the Reach', from: 'the Reach', h: 3, fee: 35, commons: [5, 8], rare: 1, piece: 0.25, tile: 0.12 },
  deep: { name: 'Into the deep doors', from: 'the deep doors', h: 8, fee: 80, commons: [6, 10], rare: 2, piece: 0.5, tile: 0.3 },
};

// ---------- the diorama (milestone 5) ----------
// The shop is a grid of one-metre tiles, the back wall at z = 0, the left wall at x = 0, open to the front (the camera's side).
// The door is in the left wall at DOOR_Z; that tile and the tiles in front of the counter are kept clear for customers.
export const DOOR_Z = 3;
export const WORK_DOOR_X = 1;   // the way through to the workshop, in the shop front's back wall
// the workshop behind the shop front: its own size, grown on its own (it doesn't change the away cap)
export const WORK_SIZES = [
  { w: 6, d: 5, cost: 0, word: 'A SMALL WORKSHOP' },
  { w: 8, d: 6, cost: 2000, word: 'A GOOD WORKSHOP' },
  { w: 10, d: 7, cost: 6000, word: 'A GREAT WORKSHOP' },
];
export const ROOM_SIZES = [
  { w: 6, d: 5, cost: 0, capH: 0, word: 'A SMALL SHOP' },
  { w: 8, d: 6, cost: 3000, capH: 1, word: 'A GOOD SHOP' },
  { w: 10, d: 7, cost: 9000, capH: 2, word: 'A FINE SHOP' },
];
// fp: the footprint in tiles [x, z] before turning; fixed: can be moved, never sold; slots: shelf places; charm: draws customers
export const FURNITURE = {
  forge: { name: 'Forge', fp: [2, 2], fixed: true, model: 'forge', room: 'work' },
  anvil: { name: 'Anvil', fp: [1, 1], fixed: true, model: 'anvil', room: 'work' },
  counter: { name: 'Counter', fp: [2, 1], fixed: true, model: 'counter', room: 'shop' },
  stretcher: { name: 'Stretcher', fp: [2, 1], fixed: true, model: 'stretcher', station: 'stretcher', room: 'work' },
  bowbench: { name: 'Bending bench', fp: [2, 1], fixed: true, model: 'bowbench', station: 'bowbench', room: 'work' },
  kettle: { name: 'Kettle', fp: [2, 1], fixed: true, model: 'kettle', station: 'kettle', room: 'work' },
  glass: { name: 'Glass furnace', fp: [2, 2], fixed: true, model: 'glass', station: 'glass', room: 'work' },
  shelf: { name: 'Shelf', fp: [2, 1], slots: 2, model: 'cardshelf', room: 'shop', line: 'Two places for pieces to sell.' },
  rug: { name: 'Rug', fp: [2, 2], charm: 2, cost: 180, model: 'rug', line: 'Warm underfoot.' },
  barrels: { name: 'Barrels', fp: [1, 1], charm: 1, cost: 90, model: 'barrels' },
  crates: { name: 'Crates', fp: [2, 1], charm: 1, cost: 105, model: 'crates' },
  lamp: { name: 'Lamp', fp: [1, 1], charm: 2, cost: 150, model: 'lamp', line: 'A light in the window draws folk in.' },
  chest: { name: 'Chest', fp: [1, 1], charm: 1, cost: 105, model: 'chest' },
  bench: { name: 'Bench', fp: [2, 1], charm: 2, cost: 135, model: 'bench', line: 'Somewhere to wait.' },
  table: { name: 'Table', fp: [2, 2], charm: 3, cost: 270, model: 'table' },
  rack: { name: 'Pelt rack', fp: [2, 1], charm: 3, cost: 360, model: 'rack' },
  workbench: { name: 'Workbench', fp: [2, 1], charm: 3, cost: 330, model: 'workbench', line: 'Folk like to see the work.' },
  // more decor (Darkclay Zero's props); scale: drawn smaller than Zero's own, for a room with a low ceiling
  banner: { name: 'Banner', fp: [1, 1], charm: 2, cost: 150, model: 'banner', scale: 0.6, line: 'Your mark, hung high.' },
  armorstand: { name: 'Armour stand', fp: [1, 1], charm: 3, cost: 300, model: 'armorstand', line: 'A coat of mail on show.' },
  bookshelf: { name: 'Bookshelf', fp: [2, 1], charm: 2, cost: 210, model: 'bookshelf', line: 'Ledgers, patterns and a few old tales.' },
  candlestand: { name: 'Candle stand', fp: [1, 1], charm: 2, cost: 120, model: 'candlestand' },
  candles: { name: 'Candle shelf', fp: [2, 1], charm: 2, cost: 120, model: 'candles' },
  brazier: { name: 'Brazier', fp: [1, 1], charm: 2, cost: 180, model: 'brazier', line: 'Warm hands come back.' },
  statue: { name: 'Statue', fp: [1, 1], charm: 4, cost: 600, model: 'statue', scale: 0.5, line: 'An old king in stone. Folk stop to look.' },
  urn: { name: 'Urn', fp: [1, 1], charm: 1, cost: 80, model: 'urn' },
  basket: { name: 'Basket', fp: [1, 1], charm: 1, cost: 60, model: 'basket' },
  flowers: { name: 'Flowers', fp: [1, 1], charm: 2, cost: 90, model: 'flowers', line: 'Something growing, for once.' },
  sacks: { name: 'Sacks', fp: [1, 1], charm: 1, cost: 60, model: 'sacks' },
  herbrail: { name: 'Herb rail', fp: [2, 1], charm: 2, cost: 150, model: 'herbrail', line: 'Herbs drying: the shop smells of summer.' },
  // gifts from the regulars' stories: never for sale, never sold back (fixed), charm a little over the shop's own
  kettycandles: { name: 'Ketty\'s candles', fp: [1, 1], charm: 4, model: 'candlestand', room: 'shop', fixed: true, gift: true, line: 'They burned for her husband.' },
  watchbanner: { name: 'The watch\'s banner', fp: [1, 1], charm: 4, model: 'banner', scale: 0.6, room: 'shop', fixed: true, gift: true, line: 'The watch flies your mark.' },
  bramsbarrels: { name: 'Bram\'s barrels', fp: [1, 1], charm: 3, model: 'barrels', room: 'shop', fixed: true, gift: true, line: 'The best from the far valley.' },
  corrowstatue: { name: 'The Corrow king', fp: [1, 1], charm: 6, model: 'statue', scale: 0.5, room: 'shop', fixed: true, gift: true, line: 'Lady Corrow\'s grandmother\'s king, in stone.' },
  marrowrail: { name: 'Marrow\'s herbs', fp: [2, 1], charm: 4, model: 'herbrail', room: 'shop', fixed: true, gift: true, line: 'They do better with you.' },
};
export const SHELF_COSTS = [800, 1800, 3600, 6400, 10000, 14400];   // the 3rd shelf to the 8th
export const MAX_SHELVES = 8;
// a shelf made better where it stands: more places on the same floor. Each level's model and how its cards are laid out
// (js/diorama.js LAYOUTS); cost: to reach that level from the one before
export const SHELF_LEVELS = [
  { name: 'Shelf', places: 2, model: 'cardshelf' },
  { name: 'Display shelf', places: 3, cost: 700, model: 'cardshelf', line: 'Three cards across the baize.' },
  { name: 'Display case', places: 6, cost: 2600, charm: 1, model: 'cardcase', line: 'A second row on a raised step: six places, and a little charm.' },
];
export const MAX_PLACES = MAX_SHELVES * SHELF_LEVELS[SHELF_LEVELS.length - 1].places;
export const CHARM_MAX = 20;          // charm counted, at most
export const CHARM_STEP = 0.025;      // each point of charm: customers come that much sooner (20 points: half as many again)

// ---------- growth (milestone 6) ----------
// tools for the forge: each changes the strip or the heat. needs: the tool it replaces.
export const TOOLS = {
  hammer1: { name: 'A Fine hammer', cost: 600, line: 'one GOOD in the strip becomes a GREAT', kit: { hammer: 1 } },
  hammer2: { name: 'An Old-Blood hammer', cost: 2400, needs: 'hammer1', line: 'two GOODs become GREATs', kit: { hammer: 2 } },
  gloves: { name: 'Worn gloves', cost: 480, line: 'from trade 3, one CRACK becomes a GOOD', kit: { gloves: 1 } },
  anvil: { name: 'A good anvil', cost: 1000, line: 'one more GOOD in the strip', kit: { good: 1 } },
  bellows: { name: 'Bellows', cost: 1200, line: 'the heat band a seventh wider', kit: { widen: 1.15 } },
  firebrick: { name: 'A firebrick hearth', cost: 800, line: 'the work cools a fifth slower', kit: { coolX: 0.8 } },
};
// the maker's renown: earned by selling at a fair price and filling orders; the wall adds to it. Each rung brings richer purses.
export const RENOWN = [
  { at: 0, word: 'UNKNOWN' }, { at: 15, word: 'NOTED' }, { at: 50, word: 'KNOWN' }, { at: 150, word: 'SOUGHT' }, { at: 400, word: 'FAMED' },
];
export const PURSE_STEP = 0.2;   // purses grow this much a rung
export const WALL_RENOWN = { common: 2, fine: 5, rare: 12, oldblood: 30 };
export const WALL_SLOTS = 3;     // +1 for each bigger room
// the maker's skills: a point each maker level; each branch's perks in order
export const PERKS = {
  craft: { word: 'THE CRAFT', perks: [
    { id: 'steady', word: 'Steady hand', line: 'one more GOOD in every strip', kit: { good: 1 } },
    { id: 'heat', word: 'Heat sense', line: 'the heat band a tenth wider', kit: { widen: 1.1 } },
    { id: 'eye', word: 'An eye for quality', line: 'Fine odds +5 % before the cap', kit: { fine: 5 } },
  ] },
  counter: { word: 'THE COUNTER', perks: [
    { id: 'read', word: 'Read the room', line: 'their mood shows from the start, their purse from Haggling 2' },
    { id: 'patient', word: 'A patient counter', line: 'customers wait 20 s longer to be served' },
    { id: 'tongue', word: 'Silver tongue', line: 'haggled prices 5 % higher (never past the purse)' },
  ] },
  house: { word: 'THE HOUSE', perks: [
    { id: 'wages', word: 'Fair dealing', line: 'wages a fifth lower' },
    { id: 'word', word: 'Good word', line: 'renown comes half as fast again' },
    { id: 'hours', word: 'Long hours', line: 'the shop kept two hours longer while you\'re away' },
  ] },
};

// parts for the bench, forged at once from iron (no working): a strong link between the stations, never a dead end (they're also
// sold, dearer, at Hollin's Timber)
export const FORGED_PARTS = {
  arrowheads: { name: 'Arrowheads', from: { iron: 1 }, makes: 2, line: 'a bar of iron makes heads for two sheaves' },
  ferrule: { name: 'A ferrule', from: { iron: 1 }, makes: 1, line: 'an iron cap for a staff\'s foot' },
};
