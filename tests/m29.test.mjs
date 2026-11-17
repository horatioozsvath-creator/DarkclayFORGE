// Milestone 29: more than one runner, and the worth rising at the forge.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as St from '../js/staff.js';
import * as R from '../js/rules.js';
import { PATTERNS, ROUTES, RENOWN, TIERS, MYTHICS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const H = 3600000, D = 24 * H;
const runner = (id, o = {}) => ({ id, role: 'runner', name: 'Runner ' + id, trait: 'keen', xp: 0, trip: null, ...o });
const shop = (renown, o = {}) => ({ coins: 5000, renown, wall: [], threatsFrom: 0, cards: [], mats: {}, found: ['ember'], staff: [], hiredIds: [], ...o });
const cand = (id, role = 'runner') => ({ id, role, name: 'Cand ' + id, trait: role === 'clerk' ? 'quick' : 'keen', xp: 0 });

test('runners: one at first, a second from KNOWN, a third from FAMED; clerks and guards one each', () => {
  const at = word => RENOWN.find(r => r.word === word).at;
  assert.equal(St.runnerCap(shop(0)), 1); assert.equal(St.runnerCap(shop(at('NOTED'))), 1);
  assert.equal(St.runnerCap(shop(at('KNOWN'))), 2); assert.equal(St.runnerCap(shop(at('FAMED'))), 3); assert.equal(St.runnerCap(shop(at('OF THE REACH'))), 3);
  assert.deepEqual(St.nextRunner(shop(0)), { n: 2, word: 'KNOWN' }); assert.equal(St.nextRunner(shop(at('FAMED'))), null);
  const s = shop(0);
  assert.ok(St.hire(s, cand('a'))); assert.ok(!St.hire(s, cand('b')), 'one runner while UNKNOWN');
  s.renown = at('KNOWN'); assert.ok(St.hire(s, cand('b'))); assert.ok(!St.hire(s, cand('c')), 'two while KNOWN');
  s.renown = at('FAMED'); assert.ok(St.hire(s, cand('c'))); assert.ok(!St.hire(s, cand('d')));
  assert.equal(St.runners(s).length, 3);
  assert.ok(St.hire(s, cand('k', 'clerk'))); assert.ok(!St.hire(s, cand('k2', 'clerk')), 'still one clerk');
  s.renown = 0; assert.equal(St.runners(s).length, 3, 'a shop that slips a rung keeps its runners');
  assert.ok(!St.hire(s, { ...cand('e'), name: 'Cand a' }), 'not the same person twice');
});

test('each runner sent on their own road; ready runners counted; only one after the gang', () => {
  const s = shop(600, { staff: [runner('r1'), runner('r2'), runner('r3', { hurt: 5 * H })] });
  assert.equal(St.readyRunners(s, 0).length, 2, 'the hurt one stays home');
  assert.ok(St.sendRunner(s, 'reach', 0, 'r2')); assert.equal(s.staff[1].trip.route, 'reach'); assert.equal(s.staff[0].trip, null);
  assert.ok(!St.sendRunner(s, 'yard', 0, 'r2'), 'one trip at a time each');
  assert.ok(!St.sendRunner(s, 'yard', 0, 'nobody'));
  assert.equal(St.readyRunners(s, 0).length, 1);
  assert.ok(St.sendRunner(s, 'yard', 0, 'r1'));
  const home = St.resolveTrips(s, 3 * H, seeded(4)); assert.equal(home.length, 2); assert.ok(St.runners(s).every(p => !p.trip));
  assert.ok(St.sendRunner(s, 'ford', 4 * H), 'no id: the first runner, as before');
  s.unpaid = true; assert.equal(St.readyRunners(s, 0).length, 0, 'unpaid: none set out');

  const g = shop(600, { staff: [runner('r1'), runner('r2')], robbery: { gang: 'the river crew', where: 'the docks', at: 0, took: [], till: 0, trail: 2 * D } });
  assert.ok(St.sendRunner(g, 'gang', H, 'r1')); assert.ok(g.robbery.hunting);
  assert.ok(!St.sendRunner(g, 'gang', H, 'r2'), 'one runner after the gang at a time');
  assert.ok(St.sendRunner(g, 'reach', H, 'r2'), 'the other can take another road');
  St.letGo(g, 'r1'); assert.ok(!g.robbery.hunting, 'let go mid-hunt: the hunt is off');
});

test('worthOf is the finished card\'s worth, for every pattern, tier, WORKED and crack', () => {
  const rng = seeded(7);
  for (const id of Object.keys(PATTERNS)) {
    if (PATTERNS[id].makes) continue;
    for (const tier of [0, 1, 2, 3]) for (const [worked, cracks, flawed] of [[0, 0, false], [17, 1, false], [80, 0, false], [5, 2, true]]) {
      const picks = [Math.floor(rng() * 3), 0, 0];
      const c = R.makePiece({ patternId: id, picks, result: { tier, flawed, worked, strikes: 9, heats: 1, cracks }, maker: 'T', rng, now: 1 });
      assert.equal(R.worthOf({ patternId: id, picks, tier, worked, cracks, flawed }), c.worth, id + ' ' + tier + ' ' + worked);
    }
  }
});

test('the worth at the forge: steady while shaping, up with each strike that works it, down with a crack', () => {
  const S = R.newWorking({ patternId: 'falchion', picks: [0, 0, 0], level: 3, found: [], kit: {} }, seeded(3));
  const w0 = R.worthNow(S);
  assert.equal(w0.lo, R.worthOf({ patternId: 'falchion', picks: [0, 0, 0], tier: 0 })); assert.equal(w0.loWord, 'COMMON');
  assert.equal(w0.hiWord, 'RARE'); assert.ok(w0.hi > w0.lo);
  S.shape = 60; assert.equal(R.worthNow(S).lo, w0.lo, 'shaping: the worth holds');
  S.cracks = 1; const cracked = R.worthNow(S).lo; assert.ok(cracked < w0.lo, 'a crack takes it down');
  S.shape = 100; let last = cracked;
  for (let i = 0; i < 10; i++) { S.worked += 6; const w = R.worthNow(S); assert.ok(w.lo >= last); last = w.lo; }
  assert.ok(last > cracked, 'working it pushes it up');
  S.worked = 200; const capped = R.worthNow(S).lo; S.worked = 300; assert.equal(R.worthNow(S).lo, capped, 'no higher past +50 % WORKED');
  const at = R.worthNow(S); S.done = true;
  const res = R.finish(S, 'quench'); const c = R.makePiece({ patternId: 'falchion', picks: [0, 0, 0], result: res, maker: 'T', rng: seeded(1), now: 1 });
  assert.ok(c.worth >= at.lo && c.worth <= at.hi, 'the card lands between the two');
});

test('the worth at the forge: a rework shows what it takes to; no figure for a working that makes no card', () => {
  const S = R.newWorking({ patternId: 'dagger', picks: [0, 0, 0], level: 3, found: [], kit: {}, rework: { from: 1 } }, seeded(2));
  const w = R.worthNow(S); assert.equal(w.hiWord, 'RARE'); assert.equal(w.loWord, 'COMMON');
  assert.equal(w.hi, R.worthOf({ patternId: 'dagger', picks: [0, 0, 0], tier: 2 }));
  const mk = Object.keys(PATTERNS).find(k => PATTERNS[k].makes);
  if (mk) assert.equal(R.worthNow(R.newWorking({ patternId: mk, picks: [0, 0, 0], level: 3, found: [], kit: {} }, seeded(2))), null);
  const T = R.newWorking({ patternId: 'dagger', picks: [0, 0, 0], level: 3, found: [], kit: {} }, seeded(2)); T.part = { mythic: Object.keys(MYTHICS)[0] };
  assert.equal(R.worthNow(T), null);
});
