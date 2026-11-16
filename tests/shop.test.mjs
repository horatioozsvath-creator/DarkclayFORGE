import test from 'node:test';
import assert from 'node:assert/strict';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import { PATTERNS, CUSTOMERS, MATS, SUPPLIERS, TIERS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const blank = (o = {}) => ({ coins: 100, mats: {}, cards: [], shelf: [], slots: 4, ledger: [], ...o });
const piece = (id, pattern = 'falchion', tier = 0, worth = 80) => ({ id, pattern, tier: TIERS[tier].id, name: 'Test ' + pattern, worth });

test('recipes take the metal\'s bars and one of each named part', () => {
  assert.deepEqual(Sh.recipe('falchion', [0, 0, 0]), [{ mat: 'iron', n: 4 }, { mat: 'wrap', n: 1 }]);   // 3 bars and an iron guard
  assert.deepEqual(Sh.recipe('dagger', [0, 0, 0]), [{ mat: 'iron', n: 1 }, { mat: 'cord', n: 1 }]);
  assert.deepEqual(Sh.recipe('ring', [0, 0, 0]), [{ mat: 'bronze', n: 1 }]);
  for (const id of Object.keys(PATTERNS)) for (const r of Sh.recipe(id, [0, 0, 0])) assert.ok(MATS[r.mat], id + ' ' + r.mat);
});

test('making takes the materials, and only when there are enough', () => {
  const s = blank({ mats: { iron: 4, wrap: 1 } }), rec = Sh.recipe('falchion', [0, 0, 0]);
  assert.ok(Sh.takeMats(s, rec)); assert.deepEqual(s.mats, {});
  assert.ok(!Sh.takeMats(s, rec));
  assert.deepEqual(Sh.short({ iron: 1 }, rec), [{ mat: 'iron', n: 4, have: 1 }, { mat: 'wrap', n: 1, have: 0 }]);
});

test('every material is sold somewhere, and prices drift within bounds', () => {
  for (const id of Object.keys(MATS)) {
    const where = [];
    for (let h = 0; h < 48; h++) if (Sh.sells(id, h)) where.push(h);
    assert.ok(where.length > 0, id + ' is sold within two days');
    for (let h = 0; h < 48; h++) { const p = Sh.priceOf(id, h); assert.ok(p >= Math.floor(MATS[id].price * 0.85) && p <= Math.ceil(MATS[id].price * 1.2) + 1, id); }
  }
  assert.equal(Sh.priceOf('iron', 5), Sh.priceOf('iron', 5));
  const pack = SUPPLIERS.find(s => s.id === 'pack');
  assert.equal(Sh.linesOf(pack, 7).length, 3);
});

test('buying spends coin and fails when short', () => {
  const s = blank({ coins: 20 });
  assert.ok(Sh.buy(s, 'cord', 3, 1)); assert.equal(s.mats.cord, 3); assert.equal(s.coins, 20 - Sh.priceOf('cord', 1) * 3);
  assert.ok(!Sh.buy(s, 'darkclay', 1, 1)); assert.equal(s.mats.darkclay, undefined);
});

test('the shelf: place, tag, take down, more slots', () => {
  const s = blank({ cards: [piece('a'), piece('b')], coins: 130 }); Sh.fixShelf(s);
  assert.equal(s.shelf.length, 4);
  assert.equal(Sh.place(s, 'a'), 0); assert.equal(Sh.place(s, 'a'), -1);
  assert.equal(Sh.inBack(s).length, 1);
  Sh.setTag(s, 0, 'dear'); assert.equal(Sh.priceAt(s.cards[0], 'dear'), 104);
  Sh.takeDown(s, 0); assert.equal(Sh.inBack(s).length, 2);
  assert.ok(Sh.buySlot(s)); assert.equal(s.slots, 5); assert.equal(s.shelf.length, 5); assert.equal(s.coins, 10);
  assert.ok(!Sh.buySlot(s));
  s.shelf[1] = { id: 'gone', tag: 'fair' }; Sh.fixShelf(s); assert.equal(s.shelf[1], null);
});

test('a customer buys what they want and can afford, best first', () => {
  const s = blank({ coins: 0, cards: [piece('cheap', 'falchion', 0, 80), piece('good', 'falchion', 1, 200), piece('ring', 'ring', 0, 20)] }); Sh.fixShelf(s);
  Sh.place(s, 'cheap'); Sh.place(s, 'good'); Sh.place(s, 'ring');
  const e = Sh.visit(s, () => 0, 1, { who: 'x', type: 'guard', want: 'weapon', purse: 300, mood: 'EAGER', least: 0 });
  assert.equal(e.sold.id, 'good'); assert.equal(s.coins, 200); assert.equal(s.cards.length, 2); assert.equal(Sh.onShelf(s, 'good'), -1);
  const poor = Sh.visit(s, () => 0, 2, { who: 'y', type: 'folk', want: 'weapon', purse: 30, mood: 'EAGER', least: 0 });
  assert.equal(poor.sold, null); assert.match(poor.line, /carried 30/);
  const none = Sh.visit(s, () => 0, 3, { who: 'z', type: 'folk', want: 'helm', purse: 300, mood: 'EAGER', least: 0 });
  assert.equal(none.sold, null); assert.match(none.line, /Nothing on the shelf/);
  s.shelf[2].tag = 'dear';
  const pinched = Sh.visit(s, () => 0, 4, { who: 'p', type: 'folk', want: 'ring', purse: 300, mood: 'PINCHED', least: 0 });
  assert.equal(pinched.sold, null, 'pinched never pays DEAR');
  assert.equal(s.ledger.length, 4);
});

test('the clock brings customers at about one every 18 to 40 seconds', () => {
  const s = blank({ cards: [], shopNext: 5 }); Sh.fixShelf(s);
  const rng = seeded(4);
  let n = 0; for (let i = 0; i < 600; i++) n += Sh.shopStep(s, 1, rng, i).length;
  assert.ok(n >= 15 && n <= 33, 'ten minutes, ' + n + ' customers');
  assert.ok(s.ledger.length <= Sh.LEDGER_MAX);
});

test('a full shelf sells over an hour', () => {
  const rng = seeded(9), cards = [];
  for (let i = 0; i < 8; i++) cards.push(piece('p' + i, ['falchion', 'dagger', 'helm', 'ring'][i % 4], i % 2, [80, 24, 56, 20][i % 4] * (1 + i % 2)));
  const s = blank({ cards, slots: 8, coins: 0 }); Sh.fixShelf(s);
  cards.forEach(c => Sh.place(s, c.id));
  for (let i = 0; i < 3600; i++) Sh.shopStep(s, 1, rng, i);
  assert.ok(s.sold >= 6, 'sold ' + s.sold);
});

test('every piece the forge makes has someone who can afford it at FAIR', () => {
  const best = id => Math.max(...CUSTOMERS.filter(c => c.wants.some(w => w === 'any' || w === id || w === PATTERNS[id].want)).map(c => c.purse[1]));
  for (const id of Object.keys(PATTERNS)) {
    const metals = R.partOptions(id)[0].opts.length, n = R.partOptions(id).map(p => p.opts.length);
    for (let m = 0; m < metals; m++) for (let tier = 0; tier < 3; tier++) for (let g = 0; g < n[1]; g++) for (let h = 0; h < n[2]; h++) {
      const result = { tier, flawed: false, worked: 400, strikes: 90, heats: 6, cracks: 0 };   // past any cap
      const p = R.makePiece({ patternId: id, picks: [m, g, h], result, maker: 'T', rng: seeded(1), now: 1 });
      assert.ok(p.worth <= best(id), id + ' ' + p.name + ' tier ' + tier + ': ' + p.worth + ' over ' + best(id));
    }
  }
});

test('a common piece is worth more than its materials, never a money machine', () => {
  for (const id of Object.keys(PATTERNS)) {
    if (PATTERNS[id].makes) continue;   // bottles: materials, not a piece
    const metals = R.partOptions(id)[0].opts.length;
    for (let m = 0; m < metals; m++) {
      const p = R.makePiece({ patternId: id, picks: [m, 0, 0], result: { tier: 0, worked: 0, strikes: 16, heats: 1, cracks: 0 }, maker: 'T', rng: seeded(1), now: 1 });
      const cost = Sh.recipe(id, [m, 0, 0]).reduce((c, r) => c + MATS[r.mat].price * r.n, 0);
      const x = p.worth * (PATTERNS[id].batch || 1) / cost;   // a batch sells a bottle at a time
      assert.ok(x >= 1.1 && x <= 3.2, id + ' ' + p.name + ': worth ' + p.worth + ' over materials ' + cost + ' = ' + x.toFixed(2));
    }
  }
});

test('never stuck: broke with nothing made, the scrap bin gives a dagger\'s worth', () => {
  const s = blank({ coins: 0 });
  assert.ok(Sh.rescue(s, 3)); assert.ok(Sh.canMake(s.mats, Sh.recipe('dagger', [0, 0, 0])));
  assert.ok(!Sh.rescue(s, 3), 'once is enough while the materials are there');
  assert.ok(!Sh.rescue(blank({ coins: 50 }), 3), 'not while there is coin');
  assert.ok(!Sh.rescue(blank({ coins: 0, cards: [piece('a')] }), 3), 'not while there is something to sell');
});
