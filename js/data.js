// DarkclayFORGE content. Names, tiers, affixes and found tiles follow Darkclay Zero (data/zero/*.json, docs/THE-WORKING.md).
// Numbers are first guesses for the balance pass.

export const KINDS = ['GOOD', 'GREAT', 'HOLD', 'CRACK', 'TRUE', 'FOUND'];
export const KC = { GOOD: '#8fc46a', GREAT: '#f0a35c', HOLD: '#8e9bb0', CRACK: '#c4483a', TRUE: '#fff2c4', FOUND: '#e8c464' };

// worth multiplies what a piece sells for; mult multiplies damage and armour; affixes is how many a piece of the tier carries
export const TIERS = [
  { id: 'common', name: 'Common', c: '#b8b0a2', glow: 0, mult: 1.00, worth: 1, affixes: 0 },
  { id: 'fine', name: 'Fine', c: '#8fc46a', glow: .35, mult: 1.10, worth: 2, affixes: 1 },
  { id: 'rare', name: 'Rare', c: '#6fb1ec', glow: .45, mult: 1.22, worth: 4, affixes: 2 },
];

export const FORGE = {
  name: 'FORGE', tool: 'HAMMER', meter: 'HEAT', fire: 'INTO THE FIRE', out: 'OUT OF THE FIRE', close: 'QUENCH', place: 'the fire',
  band: [45, 86], drain: 8, cool: 3, rise: 36, over: 95,
  colours: ['#3a3634', '#7a1e10', '#c8401a', '#f08a2a', '#ffd25a', '#fff6dc'],
  labels: [[0, 'BLACK'], [30, 'DULL RED'], [45, 'CHERRY'], [70, 'YELLOW'], [86, 'WHITE']],
  cold: 'STRUCK COLD',
  twist: 'Strike it hot: yellow to cherry. Struck cold, a CRACK slips in. Left in past white, it scales.',
};

// strip: [GOOD, GREAT, CRACK, HOLD]. level: the trade level that opens the metal (a stand-in until suppliers sell it, milestone 2).
export const METALS = {
  iron: { name: 'Iron', strip: [10, 3, 4, 3], line: 'the baseline: strike it yellow to cherry', dmg: 1, val: 1, tint: '#c9c5be', level: 1 },
  bronze: { name: 'Bronze', strip: [11, 2, 2, 5], widen: 1.3, line: 'forgiving: a wider band, fewer cracks', dmg: .9, val: .9, tint: '#c99a5a', level: 1 },
  steel: { name: 'Steel', strip: [9, 4, 5, 2], band: [55, 92], line: 'a hotter heat: the band sits higher', dmg: 1.15, val: 1.4, tint: '#dfe4ea', level: 2 },
  silver: { name: 'Silver', strip: [7, 5, 6, 2], coolX: 1.7, line: 'it cools fast: strike quickly; +25 % on the dead', dmg: .95, val: 2, tint: '#eef0f4', level: 3, affix: ['Silvered', '+25 % on the dead'] },
  darkclay: { name: 'Darkclay steel', strip: [7, 6, 6, 1], widen: .7, line: 'a narrow band, for more: GREATs and cracks both', dmg: 1.3, val: 2.8, tint: '#8a6a78', level: 4 },
};
const BLADE_METALS = ['iron', 'bronze', 'steel', 'silver', 'darkclay'];
const RARE_LEVEL = 5;   // the trade level that opens a pattern's rare part

const weaponAffixes = ['keen', 'biting', 'balanced', 'parrying', 'crushing', 'steady', 'hallowed', 'deepborn', 'sundering'];
const helmAffixes = ['warmlined', 'turning', 'quiet', 'lightstrapped', 'weatherproof', 'graveward', 'unyielding'];
const ringAffixes = ['coinsense', 'learned', 'startouched', 'moonlit', 'spiritsighted'];

// parts[0] takes a metal and sets the strip; the others are named options, a rare one turning a GOOD into a TRUE
export const PATTERNS = {
  falchion: { name: 'Falchion', trade: 'Falchions', kind: 'SWORD · ONE HAND', art: 'falchion', dice: [1, 8], dmg: [4, 9], speed: 1.4, reach: 1.6, skill: 'SWORDPLAY', value: 80, bars: 3, want: 'weapon',
    parts: [{ part: 'Blade', metals: BLADE_METALS },
      { part: 'Guard', opts: [{ name: 'Iron', mat: 'iron' }, { name: 'Bronze', mat: 'bronze' }, { name: 'Blackwater iron', mat: 'blackwater', rare: true }] },
      { part: 'Grip', opts: [{ name: 'Leather wrap', mat: 'wrap' }, { name: 'Shark hide', mat: 'sharkhide', val: 1.1 }, { name: 'Cord', mat: 'cord' }] }],
    affixes: weaponAffixes, lore: ['Sound work. It does what a blade does.', 'Sound work, and a little more. It does what a blade does, and it does it first.', 'The curve runs true from guard to point. Folk will ask who made it.'] },
  dagger: { name: 'Dagger', trade: 'Daggers', kind: 'DAGGER · ONE HAND', art: 'dagger', dice: [1, 4], dmg: [1, 4], speed: 2.0, reach: 1.0, skill: 'DAGGERS', value: 24, bars: 1, want: 'weapon',
    parts: [{ part: 'Blade', metals: BLADE_METALS },
      { part: 'Guard', opts: [{ name: 'None' }, { name: 'Iron', mat: 'iron', val: 1.15 }, { name: 'Blackwater iron', mat: 'blackwater', rare: true }] },
      { part: 'Grip', opts: [{ name: 'Cord', mat: 'cord' }, { name: 'Leather wrap', mat: 'wrap' }, { name: 'Horn', mat: 'horn', val: 1.1 }] }],
    affixes: weaponAffixes, lore: ['A plain knife for plain work.', 'It sits in the hand as if it grew there.', 'Thin as a reed and twice as patient.'] },
  axe: { name: 'Axe', trade: 'Axe heads', kind: 'AXE · ONE HAND', art: 'axe', dice: [1, 8], dmg: [3, 10], speed: 1.0, reach: 1.5, skill: 'AXEWORK', value: 44, bars: 2, want: 'weapon',
    parts: [{ part: 'Head', metals: BLADE_METALS },
      { part: 'Haft', opts: [{ name: 'Ash', mat: 'ash' }, { name: 'Rowan', mat: 'rowan', val: 1.05 }, { name: 'Bog oak', mat: 'bogoak', rare: true }] },
      { part: 'Wrap', opts: [{ name: 'Leather wrap', mat: 'wrap' }, { name: 'Cord', mat: 'cord' }] }],
    affixes: weaponAffixes.concat('bleeding'), lore: ['It splits wood and it splits shields.', 'The beard hooks, the edge bites, the haft forgives.', 'A head like this outlives three hafts and two owners.'] },
  helm: { name: 'Helm', trade: 'Helms', kind: 'HELM', art: 'helm', armour: 4, weight: 3, value: 56, bars: 3, want: 'helm',
    parts: [{ part: 'Plate', metals: BLADE_METALS },
      { part: 'Lining', opts: [{ name: 'Wool', mat: 'wool' }, { name: 'Silk', mat: 'silk', val: 1.15 }, { name: 'Winter fox', mat: 'winterfox', rare: true }] },
      { part: 'Strap', opts: [{ name: 'Leather', mat: 'strap' }, { name: 'Cord', mat: 'cord' }] }],
    affixes: helmAffixes, lore: ['It keeps the rain off and most of the rest.', 'Raised true: no seam for a blade to find.', 'The dome rings like a bell when struck, and the wearer stands.'] },
  ring: { name: 'Ring', trade: 'Rings', kind: 'RING', art: 'ring', value: 20, bars: 1, want: 'ring',
    parts: [{ part: 'Band', metals: ['bronze', 'iron', 'silver', 'darkclay'] },
      { part: 'Stone', opts: [{ name: 'None' }, { name: 'Rough gem', mat: 'gem', val: 1.6 }, { name: 'Starglass', mat: 'starglass', rare: true }] },
      { part: 'Setting', opts: [{ name: 'Plain' }, { name: 'Claw' }] }],
    affixes: ringAffixes, lore: ['A plain band, honestly round.', 'It catches the light and a little luck.', 'Small work is the hardest work. This is small work done right.'] },
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
  wrap: { name: 'Leather wrap', price: 3 }, cord: { name: 'Cord', price: 1 }, sharkhide: { name: 'Shark hide', price: 9 }, horn: { name: 'Horn', price: 4 },
  ash: { name: 'Ash haft', price: 2 }, rowan: { name: 'Rowan haft', price: 4 }, wool: { name: 'Wool', price: 2 }, silk: { name: 'Silk', price: 10 }, strap: { name: 'Leather strap', price: 2 },
  gem: { name: 'Rough gem', price: 14 },
  blackwater: { name: 'Blackwater iron', price: 45, rare: true }, bogoak: { name: 'Bog oak', price: 35, rare: true },
  winterfox: { name: 'Winter fox pelt', price: 55, rare: true }, starglass: { name: 'Starglass', price: 70, rare: true },
};
// pick: how many of its rare lines a pack carries in an hour (0: all of them, always)
export const SUPPLIERS = [
  { id: 'yard', name: 'Dougal\'s Yard', kind: 'THE SMELTER', line: 'Bars from the smelter, iron to darkclay steel.', lines: ['iron', 'bronze', 'steel', 'silver', 'darkclay'] },
  { id: 'tannery', name: 'The Tannery on the Ford', kind: 'HIDES, HAFTS AND CLOTH', line: 'Wraps, cord, hafts, linings and straps.', lines: ['wrap', 'cord', 'sharkhide', 'horn', 'ash', 'rowan', 'wool', 'silk', 'strap'] },
  { id: 'pack', name: 'Nell Quarry\'s Pack', kind: 'A PEDLAR', line: 'Gems always; rare things, two at a time, changing on the hour.', lines: ['gem'], rare: ['blackwater', 'bogoak', 'winterfox', 'starglass'], pick: 2 },
];

// ---------- the shop ----------
// Zero's counter.json: a tag multiplies the price and the odds a customer takes it
export const TAGS = { cheap: { word: 'CHEAP', mult: 0.7, odds: 1.5 }, fair: { word: 'FAIR', mult: 1.0, odds: 1.0 }, dear: { word: 'DEAR', mult: 1.3, odds: 0.6 } };
export const SLOT_COSTS = [120, 250, 500, 900];   // the 5th to the 8th shelf
export const START_SLOTS = 4;
// who comes in (Darkclay Zero, docs/CRAFT-AAA.md §5.2): a want, a purse, a mood. wants: a pattern id, 'weapon', 'helm', 'ring' or 'any'.
// least: the lowest tier they'll look at. moods: weights for EAGER, WARY, PINCHED.
export const CUSTOMERS = [
  { id: 'folk', weight: 30, purse: [6, 45], wants: ['dagger', 'ring', 'any', 'dagger', 'axe'], moods: [15, 35, 50], fig: '#a08a6a',
    names: ['a miner off the shift', 'a carter', 'a farmer\'s wife', 'a ferryman', 'a charcoal burner', 'a boy with his savings', 'a widow from the lane'] },
  { id: 'guard', weight: 25, purse: [40, 170], wants: ['falchion', 'axe', 'helm', 'weapon', 'dagger'], moods: [35, 50, 15], fig: '#7a8aa0',
    names: ['a warden\'s man', 'a gate guard', 'a sergeant of the pikes', 'a drover riding out armed', 'a watchman'] },
  { id: 'traveller', weight: 20, purse: [30, 240], wants: ['any', 'ring', 'weapon', 'dagger'], moods: [30, 45, 25], fig: '#8a9a6a',
    names: ['a caravan master', 'a pilgrim to the abbey', 'a tinker', 'a hedge-knight\'s squire', 'a ferry-bound merchant'] },
  { id: 'delver', weight: 15, purse: [80, 420], wants: ['weapon', 'helm', 'axe', 'falchion', 'any'], moods: [50, 40, 10], fig: '#9a6a5a',
    names: ['a delver of the Reach', 'one of Osk\'s Four', 'a door-breaker', 'a lamp-carrier back from the deep'] },
  { id: 'factor', weight: 7, purse: [200, 750], wants: ['ring', 'helm', 'any'], least: 1, moods: [30, 55, 15], fig: '#b89a5a',
    names: ['a guild factor', 'a reeve\'s steward', 'a lord\'s buyer'] },
  { id: 'collector', weight: 3, purse: [500, 1600], wants: ['any'], least: 1, moods: [55, 40, 5], fig: '#a07ab8',
    names: ['a collector of maker\'s marks', 'Lady Ysmay Corrow\'s man'] },
];
export const MOODS = ['EAGER', 'WARY', 'PINCHED'];
export const MOOD_ODDS = { EAGER: 0.9, WARY: 0.6, PINCHED: 0.45 };   // the odds they take a piece at FAIR they can afford
