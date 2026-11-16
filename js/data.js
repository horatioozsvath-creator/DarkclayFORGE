// DarkclayFORGE content. Names, tiers, affixes and found tiles follow Darkclay Zero (data/zero/*.json, docs/THE-WORKING.md).
// Numbers are first guesses for the balance pass.

export const KINDS = ['GOOD', 'GREAT', 'HOLD', 'CRACK', 'TRUE', 'FOUND'];
export const KC = { GOOD: '#8fc46a', GREAT: '#f0a35c', HOLD: '#8e9bb0', CRACK: '#c4483a', TRUE: '#fff2c4', FOUND: '#e8c464' };

// worth multiplies what a piece sells for; mult multiplies damage and armour; affixes is how many a piece of the tier carries
export const TIERS = [
  { id: 'common', name: 'Common', c: '#b8b0a2', glow: 0, mult: 1.00, worth: 1, affixes: 0 },
  { id: 'fine', name: 'Fine', c: '#8fc46a', glow: .35, mult: 1.10, worth: 3, affixes: 1 },
  { id: 'rare', name: 'Rare', c: '#6fb1ec', glow: .45, mult: 1.22, worth: 8, affixes: 2 },
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
  steel: { name: 'Steel', strip: [9, 4, 5, 2], band: [55, 92], line: 'a hotter heat: the band sits higher', dmg: 1.15, val: 1.6, tint: '#dfe4ea', level: 2 },
  silver: { name: 'Silver', strip: [7, 5, 6, 2], coolX: 1.7, line: 'it cools fast: strike quickly; +25 % on the dead', dmg: .95, val: 2.5, tint: '#eef0f4', level: 3, affix: ['Silvered', '+25 % on the dead'] },
  darkclay: { name: 'Darkclay steel', strip: [7, 6, 6, 1], widen: .7, line: 'a narrow band, for more: GREATs and cracks both', dmg: 1.3, val: 4, tint: '#8a6a78', level: 4 },
};
const BLADE_METALS = ['iron', 'bronze', 'steel', 'silver', 'darkclay'];
const RARE_LEVEL = 5;   // the trade level that opens a pattern's rare part

const weaponAffixes = ['keen', 'biting', 'balanced', 'parrying', 'crushing', 'steady', 'hallowed', 'deepborn', 'sundering'];
const helmAffixes = ['warmlined', 'turning', 'quiet', 'lightstrapped', 'weatherproof', 'graveward', 'unyielding'];
const ringAffixes = ['coinsense', 'learned', 'startouched', 'moonlit', 'spiritsighted'];

// parts[0] takes a metal and sets the strip; the others are named options, a rare one turning a GOOD into a TRUE
export const PATTERNS = {
  falchion: { name: 'Falchion', trade: 'Falchions', kind: 'SWORD · ONE HAND', art: 'falchion', dice: [1, 8], dmg: [4, 9], speed: 1.4, reach: 1.6, skill: 'SWORDPLAY', value: 80,
    parts: [{ part: 'Blade', metals: BLADE_METALS },
      { part: 'Guard', opts: [{ name: 'Iron' }, { name: 'Bronze' }, { name: 'Blackwater iron', rare: true }] },
      { part: 'Grip', opts: [{ name: 'Leather wrap' }, { name: 'Shark hide' }, { name: 'Cord' }] }],
    affixes: weaponAffixes, lore: ['Sound work. It does what a blade does.', 'Sound work, and a little more. It does what a blade does, and it does it first.', 'The curve runs true from guard to point. Folk will ask who made it.'] },
  dagger: { name: 'Dagger', trade: 'Daggers', kind: 'DAGGER · ONE HAND', art: 'dagger', dice: [1, 4], dmg: [1, 4], speed: 2.0, reach: 1.0, skill: 'DAGGERS', value: 12,
    parts: [{ part: 'Blade', metals: BLADE_METALS },
      { part: 'Guard', opts: [{ name: 'Iron' }, { name: 'Bronze' }, { name: 'Blackwater iron', rare: true }] },
      { part: 'Grip', opts: [{ name: 'Cord' }, { name: 'Leather wrap' }, { name: 'Horn' }] }],
    affixes: weaponAffixes, lore: ['A plain knife for plain work.', 'It sits in the hand as if it grew there.', 'Thin as a reed and twice as patient.'] },
  axe: { name: 'Axe', trade: 'Axe heads', kind: 'AXE · ONE HAND', art: 'axe', dice: [1, 8], dmg: [3, 10], speed: 1.0, reach: 1.5, skill: 'AXEWORK', value: 36,
    parts: [{ part: 'Head', metals: BLADE_METALS },
      { part: 'Haft', opts: [{ name: 'Ash' }, { name: 'Rowan' }, { name: 'Bog oak', rare: true }] },
      { part: 'Wrap', opts: [{ name: 'Leather wrap' }, { name: 'Cord' }] }],
    affixes: weaponAffixes.concat('bleeding'), lore: ['It splits wood and it splits shields.', 'The beard hooks, the edge bites, the haft forgives.', 'A head like this outlives three hafts and two owners.'] },
  helm: { name: 'Helm', trade: 'Helms', kind: 'HELM', art: 'helm', armour: 4, weight: 3, value: 40,
    parts: [{ part: 'Plate', metals: BLADE_METALS },
      { part: 'Lining', opts: [{ name: 'Wool' }, { name: 'Silk' }, { name: 'Winter fox', rare: true }] },
      { part: 'Strap', opts: [{ name: 'Leather' }, { name: 'Cord' }] }],
    affixes: helmAffixes, lore: ['It keeps the rain off and most of the rest.', 'Raised true: no seam for a blade to find.', 'The dome rings like a bell when struck, and the wearer stands.'] },
  ring: { name: 'Ring', trade: 'Rings', kind: 'RING', art: 'ring', value: 30,
    parts: [{ part: 'Band', metals: ['bronze', 'iron', 'silver', 'darkclay'] },
      { part: 'Stone', opts: [{ name: 'None' }, { name: 'Rough gem' }, { name: 'Starglass', rare: true }] },
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
