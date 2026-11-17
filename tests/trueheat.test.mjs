// Release 51: A TRUE HEAT. Out of the fire in the zone at the top of the band, the piece holds its heat.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../js/rules.js';
import { TRUE_HEAT } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const working = (patternId = 'falchion', o = {}) => { const S = R.newWorking({ patternId, picks: [0, 0, 0], level: 3, found: [], kit: {}, ...o }, seeded(4)); R.begin(S); return S; };

test('the zone sits at the top of the band, under where it scales; a run of true heats widens it', () => {
  const S = working();
  assert.deepEqual(R.trueZone(S), [S.band[1] - TRUE_HEAT.w, S.band[1]]);
  const B = working('shortbow'); assert.ok(R.trueZone(B)[1] <= B.station.over - TRUE_HEAT.belowOver, 'the bench: not simply left in to the top');
  S.trueRun = 1; assert.equal(R.trueZone(S)[0], S.band[1] - TRUE_HEAT.w - TRUE_HEAT.widen);
  S.trueRun = 9; assert.equal(R.trueZone(S)[0], S.band[1] - TRUE_HEAT.w - TRUE_HEAT.widen * TRUE_HEAT.chainMax);
});

test('taken out in the zone: a true heat that cools slower and drains less; out of it, as before', () => {
  const S = working(), z = R.trueZone(S);
  R.toggleFire(S); S.meter = (z[0] + z[1]) / 2;
  const r = R.toggleFire(S); assert.ok(r.trueHeat); assert.ok(S.trueHeat); assert.equal(S.trueRun, 1);
  const m = S.meter; R.tick(S, 1); assert.ok(Math.abs((m - S.meter) - S.cool * TRUE_HEAT.cool) < 1e-9);
  const m2 = S.meter; R.strike(S); assert.ok(Math.abs((m2 - S.meter) - S.drain * TRUE_HEAT.drain) < 1e-9);
  R.toggleFire(S); assert.ok(!S.trueHeat, 'back in the fire: it ends');
  S.meter = z[0] - 5; assert.ok(!R.toggleFire(S).trueHeat); assert.equal(S.trueRun, 0, 'a miss starts the run again');
  const m3 = S.meter; R.tick(S, 1); assert.equal(m3 - S.meter, S.cool);
});

test('struck straight from the fire in the zone: a true heat too, with its pop', () => {
  const S = working(), z = R.trueZone(S);
  R.toggleFire(S); S.meter = z[1] - 1;
  const ev = R.strike(S); assert.ok(S.trueHeat); assert.ok(ev.pops.some(p => p.trueHeat));
});

test('the kettle: a stoke that lands in the zone is a true heat', () => {
  const S = working('salve'), z = R.trueZone(S);
  S.meter = z[0] + 1 - S.station.stoke; assert.ok(R.toggleFire(S).trueHeat);
});

test('timed well, about twice the strikes a heat at a phone\'s pace (one a second)', () => {
  const per = trueHeat => {
    const S = working(), z = R.trueZone(S); R.toggleFire(S); S.meter = trueHeat ? z[1] - 1 : S.band[1] - 1;
    if (!trueHeat) S.meter = Math.min(S.meter, z[0] - 1);
    R.toggleFire(S); let n = 0;
    while (S.meter >= S.band[0] && n < 50) { R.strike(S); n++; R.tick(S, 1); }
    return n;
  };
  const plain = per(false), tru = per(true);
  assert.ok(plain <= 5, 'plain: ' + plain); assert.ok(tru >= 2 * plain - 1 && tru >= 8, 'true: ' + tru);
});
