import test from 'node:test';
import assert from 'node:assert/strict';
import * as St from '../js/staff.js';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import { ROUTES, AWAY_CAP_H, TIERS, MATS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const H = 3600000, T0 = 1.8e12;
const blank = (o = {}) => { const s = { coins: 500, mats: {}, cards: [], shelf: [], slots: 4, ledger: [], queue: [], clock: 0, found: ['ember'], staff: [], ...o }; Sh.fixShelf(s); return s; };
const clerk = (o = {}) => ({ id: 'c1', role: 'clerk', name: 'Wenna Tolley', trait: 'quick', xp: 0, trip: null, ...o });
const runner = (o = {}) => ({ id: 'r1', role: 'runner', name: 'Pell', trait: 'keen', xp: 0, trip: null, ...o });
const piece = (id, pattern = 'dagger', worth = 24) => ({ id, pattern, tier: 'common', name: 'Test ' + pattern, worth, metal: 'iron', affixes: [], made: [] });
function stocked(n = 4, o = {}) {
  const cards = []; for (let i = 0; i < n; i++) cards.push(piece('p' + i, ['dagger', 'ring', 'falchion', 'helm'][i % 4], [24, 20, 80, 56][i % 4]));
  const s = blank({ cards, ...o }); cards.forEach(c => Sh.place(s, c.id)); return s;
}

test('a save from before milestone 4 was away no time at all', () => {
  const s = stocked(4, { staff: [clerk()] });
  assert.equal(St.catchUp(s, T0, seeded(1)), null);
  assert.equal(s.lastSeen, T0); assert.equal(s.cards.length, 4); assert.equal(s.coins, 500);
  assert.equal(St.catchUp(s, T0 - 5000, seeded(1)), null, 'a clock moved back counts no time');
});

test('away with no clerk: nothing sells, customers are only counted', () => {
  const s = stocked(4, { lastSeen: T0 });
  const r = St.catchUp(s, T0 + 4 * H, seeded(2));
  assert.equal(r.sold.length, 0); assert.ok(r.missed > 10); assert.equal(s.cards.length, 4);
  assert.equal(s.ledger.length, 0, 'the ledger keeps only sales from away');
});

test('away with a clerk: sales at the tag, less the clerk\'s cut, stamped with their time', () => {
  const s = stocked(4, { lastSeen: T0, staff: [clerk()] });
  const r = St.catchUp(s, T0 + 8 * H, seeded(3));
  assert.ok(r.sold.length >= 1);
  for (const e of r.sold) { assert.ok(e.sold.price < e.sold.full); assert.ok(e.at > T0 && e.at <= T0 + 8 * H); }
  assert.equal(s.coins, 500 + r.coins - r.wages);
  assert.ok(r.cut > 0); assert.ok(s.staff[0].xp > 0);
});

test('a full shelf lasts a good part of the away cap', () => {
  const hours = [];
  for (let seed = 1; seed <= 30; seed++) {
    const s = stocked(4, { lastSeen: T0, staff: [clerk()], coins: 1000 });
    let t = T0;
    while (s.shelf.some(Boolean) && t < T0 + 24 * H) { t += 0.25 * H; St.catchUp(s, t, seeded(seed * 100 + t / H)); }
    hours.push((t - T0) / H);
  }
  hours.sort((a, b) => a - b);
  assert.ok(hours[15] >= 2, 'median ' + hours[15] + ' h to sell four pieces');
});

test('away counts no more than the cap, wages included', () => {
  const s = stocked(4, { lastSeen: T0, staff: [clerk()], coins: 1000 });
  const r = St.catchUp(s, T0 + 7 * 24 * H, seeded(4));
  assert.equal(r.counted, AWAY_CAP_H * 3600); assert.ok(r.capped);
  assert.ok(r.wages <= St.wages(s) * AWAY_CAP_H + 1, 'a week away pays the cap\'s wages, not a week\'s');
  const e = stocked(4, { lastSeen: T0, staff: [clerk({ trait: 'early' })] });
  assert.equal(St.catchUp(e, T0 + 99 * H, seeded(4)).counted, (AWAY_CAP_H + 2) * 3600);
});

test('away time doesn\'t run the order clock', () => {
  const s = stocked(0, { lastSeen: T0, staff: [clerk()], clock: 100, orderNext: 0 });
  Sh.postOrder(s, seeded(1), 1);
  St.catchUp(s, T0 + 8 * H, seeded(5));
  assert.ok(s.order); assert.equal(s.clock, 100);
});

test('wages: paid as the purse allows; an hour behind, the staff are unpaid', () => {
  const s = blank({ coins: 3, staff: [clerk()] });
  assert.equal(St.wages(s), 4);
  assert.equal(St.payWages(s, 1800), 2); assert.equal(s.coins, 1); assert.ok(!s.unpaid);
  St.payWages(s, 7200); assert.equal(s.coins, 0); assert.ok(s.unpaid, 'over an hour behind');
  s.coins = 50; St.payWages(s, 1); assert.ok(!s.unpaid); assert.ok(s.coins < 50);
  const t = blank({ coins: 0, staff: [clerk()] }); St.payWages(t, 30 * 24 * 3600);
  assert.ok(t.owed <= St.wages(t) * St.awayCap(t), 'what is owed stops at the cap\'s worth');
});

test('a broke shop with stock: the clerk still sells while away, and is paid from the takings', () => {
  let sold = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const s = stocked(4, { lastSeen: T0, staff: [clerk(), runner()], coins: 0 });
    const r = St.catchUp(s, T0 + 8 * H, seeded(seed));
    if (r.sold.length) { sold++; assert.ok(r.wages > 0); }
    assert.ok(s.coins >= 0);
  }
  assert.ok(sold >= 25, sold + ' of 30 nights sold something');
});

test('hiring: three candidates, one of each role at least; fees; none hired twice', () => {
  const s = blank({ coins: 1000 });
  const c = St.candidates(s, 500);
  assert.equal(c.length, 3); assert.ok(c.some(x => x.role === 'clerk')); assert.ok(c.some(x => x.role === 'runner'));
  assert.deepEqual(St.candidates(s, 500), c, 'the same hour, the same people');
  const cl = c.find(x => x.role === 'clerk');
  assert.ok(St.hire(s, cl)); assert.equal(s.coins, 1000 - St.hireFee(cl));
  assert.ok(!St.hire(s, cl), 'not twice');
  assert.ok(!St.candidates(s, 500).some(x => x.id === cl.id));
  const other = { ...cl, id: 'x', name: 'Someone' }; assert.ok(!St.hire(s, other), 'one clerk');
  St.letGo(s, cl.id); assert.equal(s.staff.length, 0);
  const poor = blank({ coins: 0 }); assert.ok(!St.hire(poor, St.candidates(poor, 3)[0]));
});

test('the runner: provisions paid, home on the real clock, a haul put away', () => {
  const s = blank({ coins: 100, staff: [runner()] });
  assert.ok(St.sendRunner(s, 'reach', T0)); assert.equal(s.coins, 100 - ROUTES.reach.fee);
  assert.ok(!St.sendRunner(s, 'yard', T0), 'one trip at a time');
  assert.deepEqual(St.resolveTrips(s, T0 + 2 * H, seeded(1)), []);
  const [t] = St.resolveTrips(s, T0 + 3 * H, seeded(1));
  assert.equal(t.route, 'reach'); assert.ok(Object.values(t.mats).reduce((a, b) => a + b, 0) >= 5);
  assert.ok(Object.keys(t.mats).some(m => ['blackwater', 'bogoak', 'winterfox', 'starglass'].includes(m)));
  assert.equal(s.staff[0].trip, null); assert.ok(s.staff[0].xp > 0);
  const u = blank({ coins: 100, staff: [runner()], unpaid: true }); assert.ok(!St.sendRunner(u, 'yard', T0), 'not unpaid');
});

test('a trip comes home during the catch-up, even past the cap', () => {
  const s = blank({ coins: 500, staff: [runner()], lastSeen: T0 });
  St.sendRunner(s, 'deep', T0);
  const r = St.catchUp(s, T0 + 20 * H, seeded(2));
  assert.equal(r.trips.length, 1); assert.equal(s.staff[0].trip, null);
});

test('a runner\'s haul is worth more than the road costs, over many trips', () => {
  for (const route of Object.keys(ROUTES).filter(r => !ROUTES[r].hunt)) {   // the hunt brings back the stolen pieces, not a haul
    let worth = 0, n = 200;
    for (let i = 0; i < n; i++) {
      const s = blank({ staff: [runner({ trait: 'quick' })] });
      const h = St.haul(s, s.staff[0], route, seeded(i), T0);
      worth += Object.entries(h.mats).reduce((a, [m, k]) => a + k * MATS[m].price, 0) + (h.piece ? h.piece.worth * 0.5 : 0);
    }
    const wage = 3 * ROUTES[route].h;
    assert.ok(worth / n > ROUTES[route].fee + wage, route + ': ' + (worth / n).toFixed(1) + ' against ' + (ROUTES[route].fee + wage));
  }
});

test('a clerk minding the shop while you work sells more readily, at the full price', () => {
  let a = 0, b = 0;
  for (let seed = 0; seed < 200; seed++) {
    const s1 = stocked(4), s2 = stocked(4);
    Sh.shopStep(s1, 240, seeded(seed), 1, false, null);
    Sh.shopStep(s2, 240, seeded(seed), 1, false, St.clerkTerms(clerk()));
    a += s1.sold || 0; b += s2.sold || 0;
    if (s2.ledger.find(e => e.sold)) assert.equal(s2.ledger.find(e => e.sold).sold.price, s2.ledger.find(e => e.sold).sold.full);
  }
  assert.ok(b > a, b + ' against ' + a);
});
