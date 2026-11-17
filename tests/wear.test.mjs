// Milestone 20: wear, the broken station, rebuilding, the dwarven forge.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as W from '../js/wear.js';
import * as R from '../js/rules.js';
import { WEAR } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const H = 3600000;
const shop = (o = {}) => ({ coins: 100000, renown: 0, threatsFrom: 0, ...o });

test('each working wears its station; a Mythic far more than a plain one; worn from three quarters', () => {
  const s = shop();
  for (let i = 0; i < 10; i++) W.addWear(s, 'forge', 'work', 1);
  assert.equal(W.wearOf(s, 'forge'), 5); assert.equal(W.wearOf(s, 'glass'), 0, 'only the station worked');
  W.addWear(s, 'forge', 'mythic', 1); assert.equal(W.wearOf(s, 'forge'), 10);
  assert.equal(W.kindOf({ instant: true }), 'quick'); assert.equal(W.kindOf({ relic: 'x', rework: true }), 'relic'); assert.equal(W.kindOf({ tier: 1 }), 'work');
  assert.equal(W.bandMult(s, 'forge'), 1); s.wear.forge.w = 74.9; const r = W.addWear(s, 'forge', 'work', 1); assert.ok(r.worn); assert.equal(W.bandMult(s, 'forge'), WEAR.wornBand);
});

test('the gentler Reach and the week of grace: no wear', () => {
  assert.equal(W.addWear(shop({ gentle: true }), 'forge', 'mythic', 1), null);
  assert.equal(W.addWear(shop({ threatsFrom: 10 }), 'forge', 'mythic', 5), null);
});

test('full wear: broken after the working; nothing until rebuilt (coin and three hours); repair is cheap before that', () => {
  const s = shop({ renown: 60 });   // KNOWN: rung 2
  s.wear = { forge: { w: 50 } };
  assert.equal(W.repairCost(s, 'forge'), 50 * 2 * 2); assert.ok(W.repair(s, 'forge').ok); assert.equal(W.wearOf(s, 'forge'), 0);
  s.wear.forge.w = 99.8; const r = W.addWear(s, 'forge', 'work', 0); assert.ok(r.broke); assert.ok(W.isBroken(s, 'forge', 0));
  assert.ok(W.repair(s, 'forge').why, 'a broken one is rebuilt, not repaired');
  const coins = s.coins, b = W.rebuild(s, 'forge', 0); assert.ok(b.ok); assert.equal(coins - s.coins, 300 * 3);
  assert.ok(W.rebuild(s, 'forge', 1).why, 'once');
  assert.ok(W.isBroken(s, 'forge', 3 * H - 1)); assert.ok(!W.isBroken(s, 'forge', 3 * H)); assert.equal(W.wearOf(s, 'forge'), 0);
});

test('the dwarven forge: from FAMED, out while it goes up, then a wider band and slower wear', () => {
  assert.ok(W.buildDwarven(shop({ renown: 200 }), 0).why, 'FAMED first');
  const s = shop({ renown: 500 }); assert.ok(W.buildDwarven(s, 0).ok); assert.ok(W.isBroken(s, 'forge', 6 * H - 1)); assert.ok(!W.isBroken(s, 'forge', 6 * H));
  assert.equal(W.bandMult(s, 'forge'), WEAR.dwarven.band); assert.equal(W.bandMult(s, 'glass'), 1, 'the forge only');
  W.addWear(s, 'forge', 'work', 7 * H); assert.equal(W.wearOf(s, 'forge'), 0.5 * WEAR.dwarven.wear);
  assert.ok(W.canDwarven(s).why);
});

test('the band, in a working: narrower when worn, wider at the dwarven forge', () => {
  const cfg = { patternId: 'falchion', picks: [0, 0, 0], level: 3, found: [], kit: {} };
  const span = x => { const S = R.newWorking({ ...cfg, bandX: x }, seeded(1)); return S.band[1] - S.band[0]; };
  assert.ok(span(WEAR.wornBand) < span(1)); assert.ok(span(WEAR.dwarven.band) > span(1));
});
