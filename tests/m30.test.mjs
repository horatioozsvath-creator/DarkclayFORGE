// Milestone 30: where things come from, and the likely worth at the forge.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as Src from '../js/sources.js';
import * as R from '../js/rules.js';
import * as Sh from '../js/shop.js';
import { MATS, PATTERNS } from '../js/data.js';
import { matHome } from '../js/region.js';
// (milestone 54: a material of the High Snow, hidden from the others, is told of up there)
const at = m => matHome(m) === 'north' ? { region: 'north', mats: {} } : undefined;

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

test('every material any pattern needs has a way to get it', () => {
  const need = Src.neededMats();
  assert.ok(need.includes('arrowheads') && need.includes('ferrule') && need.includes('bottle') && need.includes('moonwater'));
  for (const m of need) assert.ok(Src.sourcesOf(m, at(m)).length, m + ' has no source');
});

test('arrowheads and a ferrule: forged at once from iron, or bought; bottles: made at the glass, or bought', () => {
  const kinds = m => Src.sourcesOf(m).map(x => x.kind);
  assert.deepEqual(kinds('arrowheads'), ['forged', 'sold']); assert.deepEqual(kinds('ferrule'), ['forged', 'sold']);
  assert.deepEqual(kinds('bottle'), ['made', 'sold']); assert.equal(Src.sourcesOf('bottle')[0].pattern, 'bottles');
  const s = { mats: { iron: 3 } };
  assert.ok(Sh.forgePart(s, 'arrowheads', 2)); assert.equal(s.mats.arrowheads, 4); assert.equal(s.mats.iron, 1);
  assert.ok(!Sh.forgePart(s, 'arrowheads', 2), 'not without the iron');
});

test('the rare things: the pedlar some hours, a runner on the longer roads; the relic things only below', () => {
  const rare = Object.keys(MATS).find(m => MATS[m].rare && !MATS[m].relic && m !== 'gem');
  const k = Src.sourcesOf(rare).map(x => x.kind); assert.ok(k.includes('runner'));
  const relic = Object.keys(MATS).find(m => MATS[m].relic);
  // the Crown's factor sells them from RENOWNED, some hours (milestone 34); never to a shop below RENOWNED
  assert.deepEqual(Src.sourcesOf(relic).map(x => x.kind), ['pedlar', 'deep']);
  assert.equal(Sh.sells(relic, 1000), false, 'without a save: not sold'); assert.equal(Sh.sells(relic, 1000, { renown: 0 }), false);
  const hr = [...Array(48).keys()].map(i => 1000 + i).find(h => Sh.sells(relic, h, { renown: 1000 })); assert.ok(hr != null, 'RENOWNED: some hour in two days');
  assert.equal(Src.nextSold('iron', 1000), 0, 'iron: always at the yard');
  const pedlar = Src.sourcesOf('moonwater').find(x => x.kind === 'pedlar'); assert.ok(pedlar);
  const n = Src.nextSold('moonwater', 1000); assert.ok(n !== null && n <= 48);
  assert.ok(Sh.sells('moonwater', 1000 + n));
});

test('the likely worth: between the least and the most, climbing as the piece is worked', () => {
  const S = R.newWorking({ patternId: 'falchion', picks: [0, 0, 0], level: 3, found: [], kit: {} }, seeded(3));
  S.shape = 100; let last = 0;
  for (let i = 0; i < 10; i++) { S.worked += 6; const w = R.worthNow(S); assert.ok(w.likely >= w.lo && w.likely <= w.hi); assert.ok(w.likely > last); last = w.likely; }
  const o = R.odds(S), at = t => R.worthOf({ patternId: 'falchion', picks: [0, 0, 0], tier: t, worked: S.worked });
  assert.equal(R.worthNow(S).likely, Math.round((o.c * at(0) + o.f * at(1) + o.r * at(2)) / 100));
  const before = R.worthNow(S).likely; S.cracks = 1; assert.ok(R.worthNow(S).likely < before, 'a crack takes it down');
  const W = R.newWorking({ patternId: 'dagger', picks: [0, 0, 0], level: 3, found: [], kit: {}, rework: { from: 0 } }, seeded(2));
  assert.equal(R.worthNow(W).likely, undefined, 'a rework: no roll, no likely');
});
