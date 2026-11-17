// Release 53: the clerk restocks. A place they sell from is filled from the back: the same kind first, then the least worth; never a
// Rare or better, a one-of-a-kind piece or one marked KEEP; at the tag the sold piece had. A switch on the clerk turns it off.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as St from '../js/staff.js';
import * as Sh from '../js/shop.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const H = 3600000, T0 = 1.8e12;
const piece = (id, pattern = 'dagger', worth = 24, o = {}) => ({ id, pattern, tier: 'common', name: 'Test ' + pattern, worth, metal: 'iron', affixes: [], made: [], ...o });
const clerk = (o = {}) => ({ id: 'c1', role: 'clerk', name: 'Wenna Tolley', trait: 'quick', xp: 0, trip: null, ...o });
function shop(back, o = {}) {
  const front = [piece('f0', 'dagger', 24), piece('f1', 'ring', 20)];
  const s = { coins: 500, mats: {}, cards: front.concat(back), shelf: [], slots: 2, ledger: [], queue: [], clock: 0, found: ['ember'], staff: [], made: 1, ...o };
  Sh.fixShelf(s); front.forEach(c => Sh.place(s, c.id, null, 'dear')); return s;
}

test('restock: the same kind first, then the least worth, at the sold piece\'s tag', () => {
  const s = shop([piece('b1', 'ring', 15), piece('b2', 'dagger', 40), piece('b3', 'dagger', 30)]);
  Sh.takeOne(s, s.cards[0]);   // the dagger sold
  const put = Sh.restock(s, 0, 'dagger', 'dear');
  assert.equal(put.id, 'b3'); assert.deepEqual(s.shelf[0], { id: 'b3', tag: 'dear' });
  Sh.takeOne(s, s.cards.find(c => c.id === 'f1'));
  assert.equal(Sh.restock(s, 1, 'helm', 'fair').id, 'b1', 'no helm in the back: the cheapest');
  assert.equal(Sh.restock(s, 1, 'dagger'), null, 'a place already filled is left alone');
});

test('never a Rare or better, a piece marked KEEP, or a flyer\'s copy before the first piece', () => {
  const s = shop([piece('r', 'dagger', 90, { tier: 'rare' }), piece('k', 'dagger', 10, { keep: true }), piece('m', 'dagger', 5, { tier: 'mythic' })]);
  Sh.takeOne(s, s.cards[0]);
  assert.equal(Sh.restock(s, 0, 'dagger'), null);
  assert.ok(Sh.restockable(s, piece('x', 'dagger', 1, { tier: 'fine' })));
  assert.ok(!Sh.fillShelf(s).some(c => c.id === 'k'), 'FILL THE SHELVES leaves a kept piece in the back too');
});

test('away: the clerk refills what they sell, and the summary says what they put out; switched off, they don\'t', () => {
  const back = () => Array.from({ length: 12 }, (_, i) => piece('b' + i, ['dagger', 'ring'][i % 2], 20 + i));
  const on = shop(back(), { lastSeen: T0, staff: [clerk()] });
  const r = St.catchUp(on, T0 + 8 * H, seeded(5));
  assert.ok(r.sold.length >= 2, 'sold ' + r.sold.length);
  assert.equal(r.restocked.length, Math.min(12, r.sold.length), 'every sale refilled while the back had pieces');
  if (r.sold.length <= 12) assert.equal(on.shelf.filter(Boolean).length, 2, 'the two places stay stocked'); assert.match(r.sold[0].line, /Wenna put out a Test (dagger|ring)\./);
  const off = shop(back(), { lastSeen: T0, staff: [clerk({ restock: false })] });
  const r2 = St.catchUp(off, T0 + 8 * H, seeded(5));
  assert.ok(r2.sold.length >= 1); assert.equal(r2.restocked.length, 0); assert.ok(off.shelf.filter(Boolean).length < 2, 'what sold stays empty');
});

test('at the forge: the clerk minding the shop restocks after a sale too', () => {
  const s = shop(Array.from({ length: 30 }, (_, i) => piece('b' + i, 'dagger', 20 + i)));
  const terms = St.clerkTerms(clerk()); let sold = 0;
  for (let i = 0; i < 400 && !sold; i++) {
    const e = Sh.shopStep(s, 30, seeded(i), T0 + i * 30000, false, terms).find(x => x.sold);
    if (e) { sold++; assert.ok(e.restocked); }
  }
  assert.ok(sold); assert.equal(s.shelf.filter(Boolean).length, 2);
  assert.equal(St.clerkTerms(clerk({ restock: false })).restock, false);
});
