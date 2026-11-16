import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../js/rules.js';
import * as Sh from '../js/shop.js';
import * as Rm from '../js/room.js';
import { KETTLE, PATTERNS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const cfg = (o = {}) => ({ patternId: 'draught', picks: [0, 0, 0], level: 3, found: [], kit: {}, ...o });
const brew = (count = 3) => { const p = R.makePiece({ patternId: 'draught', picks: [0, 0, 0], result: { tier: 0, worked: 0, strikes: 16, heats: 1, cracks: 0 }, maker: 'T', rng: seeded(1), now: 1 }); p.count = count; return p; };
const blank = (o = {}) => { const s = { coins: 0, mats: {}, cards: [], shelf: [], slots: 4, ledger: [], queue: [], clock: 0, stations: ['kettle'], ...o }; Sh.fixShelf(s); return s; };

test('the kettle starts at a simmer and holds until the first stir; then it settles', () => {
  const S = R.newWorking(cfg(), seeded(1)); R.begin(S);
  assert.equal(S.meter, KETTLE.start);
  for (let i = 0; i < 20; i++) R.tick(S, 0.1);
  assert.equal(S.meter, KETTLE.start, 'a fresh pot holds');
  R.strike(S); const m = S.meter; assert.equal(m, KETTLE.start, 'a stir doesn\'t cool it');
  R.tick(S, 1); assert.equal(S.meter, m - KETTLE.cool);
});

test('STOKE raises the boil at once and deals the strip again; it never goes in a fire', () => {
  const S = R.newWorking(cfg(), seeded(2)); R.begin(S); S.meter = 30;
  const r = R.toggleFire(S); assert.ok(r.stoked); assert.equal(S.meter, 30 + KETTLE.stoke); assert.ok(!S.inFire);
  R.strike(S); const r2 = R.toggleFire(S); assert.ok(r2.shuffled); assert.equal(S.heats, 2);
  S.meter = 95; R.toggleFire(S); assert.equal(S.meter, 100);
});

test('too cool: a stir doesn\'t take; too hot: it boils over, a CRACK from trade 3, the boil drops', () => {
  const a = R.newWorking(cfg(), seeded(3)); R.begin(a); a.meter = 20; assert.ok(R.strike(a).dead); assert.equal(a.rack.length, 20);
  const b = R.newWorking(cfg({ level: 1 }), seeded(3)); R.begin(b); b.meter = 90; R.strike(b); assert.equal(b.rack.length, 20); assert.equal(b.meter, 60);
  const c = R.newWorking(cfg({ level: 3 }), seeded(3)); R.begin(c); c.meter = 90; R.strike(c); assert.equal(c.rack.length, 21); assert.equal(c.meter, 60);
});

test('a brew: its herb in its name, potency on its card, a batch of three; a bottle each', () => {
  const p = R.makePiece({ patternId: 'tonic', picks: [2, 1, 0], result: { tier: 1, worked: 10, strikes: 20, heats: 2, cracks: 0 }, maker: 'T', rng: seeded(1), now: 1 });
  assert.equal(p.name, 'Emberroot Tonic'); assert.equal(p.count, 3); assert.ok(p.stats.some(s => s[0] === 'Potency')); assert.ok(p.made[0].startsWith('Brewed by'));
  assert.deepEqual(Sh.recipe('draught', [0, 0, 0]), [{ mat: 'mending', n: 2 }, { mat: 'honey', n: 1 }, { mat: 'bottle', n: 3 }]);
});

test('a batch sells a bottle at a time and stays on the shelf until the last', () => {
  const b = brew(3), s = blank({ cards: [b] }); Sh.place(s, b.id);
  for (let i = 0; i < 3; i++) {
    const e = Sh.visit(s, () => 0, i, { who: 'x', type: 'folk', want: 'brew', purse: 999, mood: 'EAGER', least: 0 });
    assert.ok(e.sold, 'sale ' + i);
  }
  assert.equal(s.cards.length, 0); assert.equal(s.shelf[0], null); assert.equal(s.coins, Sh.priceAt(b, 'fair') * 3);
  const c = brew(2), t = blank({ cards: [c] }); Sh.place(t, c.id);
  t.queue = [{ kind: 'buyer', who: 'x', want: 'brew', purse: 999, mood: 'EAGER', least: 0, wait: 45, shows: 0 }];
  assert.equal(Sh.haggle(t, c.id, 'hold', 1).outcome, 'sold'); assert.equal(c.count, 1); assert.equal(Sh.onShelf(t, c.id), 0);
});

test('a brew can\'t be broken down or sent back to the fire', () => {
  const b = brew(), s = blank({ cards: [b] });
  assert.deepEqual(Sh.salvageOf(b), []); assert.ok(!Sh.canRework(s, b));
});

test('setting up the kettle; brews wanted only where a kettle stands; a regular asks for one', () => {
  const s = { coins: 5000, room: Rm.defaultRoom(), slots: 4, shelf: [null, null, null, null], cards: [], stations: [], ledger: [], clock: 0 };
  for (let i = 0; i < 80; i++) { const c = Sh.richer(s, Sh.newCustomer(seeded(i))); assert.ok(c.want !== 'brew' && !(PATTERNS[c.want] && PATTERNS[c.want].batch), c.want); }
  assert.ok(Rm.buyStation(s, 'kettle').item); assert.ok(Rm.valid(s.room));
  let brews = 0; for (let i = 0; i < 400; i++) { const c = Sh.richer(s, Sh.newCustomer(seeded(i))); if (c.want === 'brew' || (PATTERNS[c.want] && PATTERNS[c.want].batch)) brews++; }
  assert.ok(brews > 30, brews + ' brew customers in 400');
  let asked = 0; for (let i = 0; i < 300; i++) { Sh.postOrder(s, seeded(i), 1); if (PATTERNS[s.order.pattern].batch) asked++; }
  assert.ok(asked > 0);
  assert.equal(Sh.wantWord('brew'), 'something from the kettle');
});
