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
  { who: 'Sergeant Ollo Vance', wants: ['falchion', 'axe', 'helm'], line: 'For the gate. The pikes need better than they\'ve got.', fig: '#7a8aa0' },
  { who: 'Lady Ysmay Corrow', wants: ['ring', 'falchion', 'helm'], least: 1, line: 'Something with a maker\'s mark worth the name.', fig: '#a07ab8' },
  { who: 'Bram Oakes, a drover', wants: ['dagger', 'axe'], line: 'Knives for my drovers. Good ones, mind.', fig: '#8a9a6a' },
  { who: 'Ketty Moss, a widow', wants: ['ring'], metal: 'silver', line: 'A silver ring, for his grave.', fig: '#a08a6a' },
  { who: 'Tib Harrow', wants: ['dagger'], line: 'A knife. My own. I\'ve saved for it.', fig: '#a08a6a' },
];
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
