import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../js/rules.js';
import * as Sh from '../js/shop.js';
import * as Rm from '../js/room.js';
import { PATTERNS, STRETCHER } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const cfg = (o = {}) => ({ patternId: 'jerkin', picks: [0, 0, 0], level: 3, found: [], kit: {}, ...o });

test('the stretcher\'s working: its own meter, band and strip', () => {
  const S = R.newWorking(cfg(), seeded(1));
  assert.equal(S.station.id, 'stretcher'); assert.deepEqual(S.band, STRETCHER.band);
  assert.equal(S.rack.length, 20); assert.deepEqual(R.counts(S.rack), { GOOD: 10, GREAT: 3, HOLD: 3, CRACK: 4, TRUE: 0, FOUND: 0 });
  const goat = R.newWorking(cfg({ picks: [1, 0, 0] }), seeded(1)); assert.ok(goat.band[1] - goat.band[0] > S.band[1] - S.band[0]);
});

test('too dry: a stitch does nothing, at any trade, and nothing slips in', () => {
  for (const level of [1, 3, 7]) {
    const S = R.newWorking(cfg({ level }), seeded(2)); R.begin(S); S.meter = 10;
    const ev = R.strike(S); assert.ok(ev.dead); assert.equal(S.rack.length, 20); assert.equal(S.shape, 0);
  }
});

test('too wet: a stitch tears from trade 3, not before', () => {
  const a = R.newWorking(cfg({ level: 1 }), seeded(3)); R.begin(a); a.meter = 95; R.strike(a); assert.equal(a.rack.length, 20);
  const b = R.newWorking(cfg({ level: 3 }), seeded(3)); R.begin(b); b.meter = 95; R.strike(b); assert.equal(b.rack.length, 21);
});

test('soaking never scales the hide', () => {
  const S = R.newWorking(cfg(), seeded(4)); R.begin(S); R.toggleFire(S);
  for (let i = 0; i < 200; i++) assert.ok(!R.tick(S, 0.1).scaled);
  assert.equal(S.meter, 100);
});

test('a stretcher\'s piece: its hide in its name, armour on its card', () => {
  const p = R.makePiece({ patternId: 'boots', picks: [2, 1, 0], result: { tier: 1, worked: 10, strikes: 20, heats: 2, cracks: 0 }, maker: 'T', rng: seeded(1), now: 1 });
  assert.equal(p.name, 'Sharkskin Boots'); assert.ok(p.stats.some(s => s[0] === 'Armour')); assert.equal(p.affixes.length, 1);
  assert.deepEqual(Sh.recipe('jerkin', [0, 0, 0]), [{ mat: 'deer', n: 3 }, { mat: 'wool', n: 1 }, { mat: 'gut', n: 1 }]);
});

test('setting up the stretcher: paid, placed, owned; orders follow it', () => {
  const s = { coins: 5000, room: Rm.defaultRoom(), slots: 4, shelf: [null, null, null, null], cards: [], ledger: [], clock: 0 };
  for (let i = 0; i < 60; i++) { Sh.postOrder(s, seeded(i), 1); assert.ok(!PATTERNS[s.order.pattern].station, 'no stretcher orders before it\'s set up'); }
  assert.ok(Rm.buyStation(s, 'stretcher').item); assert.equal(s.coins, 5000 - STRETCHER.cost); assert.ok(Rm.owns(s, 'stretcher'));
  assert.equal(Rm.buyStation(s, 'stretcher').why, 'yours already'); assert.ok(Rm.valid(s.room));
  assert.equal(Rm.sellBack(s, 'stretcher').why, 'it stays');
  let leather = 0; for (let i = 0; i < 200; i++) { Sh.postOrder(s, seeded(i), 1); if (PATTERNS[s.order.pattern].station) leather++; }
  assert.ok(leather > 0);
  const t = { slots: 4, stations: ['stretcher'], room: null }; Rm.fixRoom(t); assert.ok(t.room.items.some(i => i.kind === 'stretcher'), 'a rebuilt room keeps it');
});

test('customers want leather too', () => {
  const card = R.makePiece({ patternId: 'gloves', picks: [0, 0, 0], result: { tier: 0, worked: 0, strikes: 16, heats: 1, cracks: 0 }, maker: 'T', rng: seeded(1), now: 1 });
  assert.ok(Sh.wants('armour', card)); assert.ok(Sh.wants('gloves', card)); assert.ok(!Sh.wants('weapon', card));
  assert.equal(Sh.wantWord('armour'), 'something to wear');
});

test('a shop without a stretcher: no one walks in wanting what it can\'t make', () => {
  const s = { stations: [], renown: 0 };
  for (let i = 0; i < 400; i++) {
    const c = Sh.richer(s, Sh.newCustomer(seeded(i)));
    assert.ok(c.want === 'any' || c.want === 'weapon' || c.want === 'helm' || c.want === 'ring' || (PATTERNS[c.want] && !PATTERNS[c.want].station), c.want);
  }
  const t = { stations: ['stretcher'], renown: 0 }; let leather = 0;
  for (let i = 0; i < 400; i++) { const c = Sh.richer(t, Sh.newCustomer(seeded(i))); if (c.want === 'armour' || (PATTERNS[c.want] && PATTERNS[c.want].station)) leather++; }
  assert.ok(leather > 40);
  assert.equal(Sh.wantWord('gloves'), 'a pair of gloves');
});
