import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../js/rules.js';
import * as Sh from '../js/shop.js';
import * as Rm from '../js/room.js';
import * as G from '../js/growth.js';
import { GLASS, PATTERNS, MATS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const cfg = (o = {}) => ({ patternId: 'lens', picks: [0, 0, 0], level: 3, found: [], kit: {}, ...o });

test('the glass\'s working: the gather, its band, Zero\'s glass strip', () => {
  const S = R.newWorking(cfg(), seeded(1));
  assert.equal(S.station.id, 'glass'); assert.deepEqual(S.band, GLASS.band); assert.equal(S.cool, GLASS.cool);
  assert.deepEqual(R.counts(S.rack), { GOOD: 9, GREAT: 4, HOLD: 2, CRACK: 5, TRUE: 0, FOUND: 0 });
});

test('too stiff: it shatters, and the very next tile is a CRACK (from trade 3)', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const S = R.newWorking(cfg(), seeded(seed)); R.begin(S); S.meter = 20;
    const ev = R.strike(S); assert.equal(ev.k, 'CRACK', 'seed ' + seed); assert.equal(S.rack.length, 20, 'never longer');
  }
  const a = R.newWorking(cfg({ level: 1 }), seeded(1)); R.begin(a); a.meter = 20; assert.ok(R.strike(a).dead);
});

test('too soft: it sags, SHAPE slipping back while shaping', () => {
  const S = R.newWorking(cfg(), seeded(3)); R.begin(S); S.shape = 50; S.meter = 95;
  const i = S.rack.findIndex(x => x.k === 'HOLD'); const j = S.rack.findIndex(x => !x.up); [S.rack[i], S.rack[j]] = [S.rack[j], S.rack[i]];
  R.strike(S); assert.equal(S.shape, 50 - GLASS.sag);
  const T = R.newWorking(cfg(), seeded(3)); R.begin(T); T.shape = 100; T.meter = 95; R.strike(T); assert.equal(T.shape, 100, 'not once it\'s made');
});

test('WHITE HEAT comes after ten clean blows here, not eight', () => {
  const S = R.newWorking(cfg({ level: 5 }), seeded(4)); R.begin(S);
  S.rack.forEach(x => { if (!x.up) { x.k = 'GOOD'; x.f = undefined; } });
  for (let i = 0; i < 9; i++) { S.meter = 60; R.strike(S); } assert.ok(S.white <= 0);
  S.meter = 60; R.strike(S); assert.ok(S.white > 0);
});

test('bottles go to the store room, more for a better blowing; cheaper than buying them', () => {
  assert.deepEqual(R.yieldOf('bottles', 0), { mat: 'bottle', n: 6 }); assert.deepEqual(R.yieldOf('bottles', 2), { mat: 'bottle', n: 10 });
  assert.equal(R.yieldOf('lens', 1), null);
  const cost = Sh.recipe('bottles', [0, 0, 0]).reduce((c, r) => c + MATS[r.mat].price * r.n, 0);
  assert.ok(cost / 6 < MATS.bottle.price, 'blown bottles cost ' + (cost / 6).toFixed(1) + ' each');
});

test('glass pieces: clarity on the card, blown by their maker; a pane in the window is twice the charm', () => {
  const p = R.makePiece({ patternId: 'goblet', picks: [2, 1, 1], result: { tier: 1, worked: 10, strikes: 20, heats: 2, cracks: 0 }, maker: 'T', rng: seeded(1), now: 1 });
  assert.equal(p.name, 'Smoke Goblet'); assert.ok(p.stats.some(s => s[0] === 'Clarity')); assert.ok(p.made[0].startsWith('Blown by'));
  const pane = R.makePiece({ patternId: 'pane', picks: [0, 0, 0], result: { tier: 1, worked: 0, strikes: 16, heats: 1, cracks: 0 }, maker: 'T', rng: seeded(1), now: 2 });
  const lens = R.makePiece({ patternId: 'lens', picks: [0, 0, 0], result: { tier: 1, worked: 0, strikes: 16, heats: 1, cracks: 0 }, maker: 'T', rng: seeded(2), now: 3 });
  const s = { cards: [pane, lens], shelf: [], room: Rm.defaultRoom() };
  G.hang(s, pane.id); const withPane = G.wallCharm(s); G.unhang(s, pane.id); G.hang(s, lens.id);
  assert.equal(withPane, 2 * G.wallCharm(s));
});

test('setting up the glass; customers want glass only where it stands', () => {
  const s = { coins: 9000, room: Rm.defaultRoom(), slots: 4, shelf: [null, null, null, null], cards: [], stations: [], ledger: [], clock: 0 };
  for (let i = 0; i < 200; i++) { const c = Sh.richer(s, Sh.newCustomer(seeded(i))); assert.ok(c.want !== 'glass' && !(PATTERNS[c.want] && PATTERNS[c.want].station === 'glass'), c.want); }
  assert.ok(Rm.buyStation(s, 'glass').item); assert.ok(Rm.valid(s.room));
  let g = 0; for (let i = 0; i < 400; i++) { const c = Sh.richer(s, Sh.newCustomer(seeded(i))); if (c.want === 'glass' || (PATTERNS[c.want] && PATTERNS[c.want].station === 'glass')) g++; }
  assert.ok(g > 15, g + ' glass customers in 400');
  assert.equal(Sh.wantWord('glass'), 'something of glass');
});
