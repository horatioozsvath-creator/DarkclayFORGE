// Milestone 50: the blood wakes (docs/JACKPOT-PLAN.md). A Rare roll from a working with WHITE HEAT and not one crack, at trade 4 or
// more, now and then comes out Old-Blood, no master's rework needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../js/rules.js';
import { WAKE, OLD_BLOOD } from '../js/data.js';

const queue = (...v) => { let i = 0; return () => (i < v.length ? v[i++] : 0.5); };
// a finished working, its dice given: the tier roll, then the waking's, then the mark's
function worked(patternId, rolls, o = {}) {
  const S = R.newWorking({ patternId, picks: [0, 0, 0], level: o.level ?? 5, found: [] }, () => 0.5);
  S.shape = 100; S.worked = 30; S.strikes = 20; S.cracks = o.cracks || 0; S.whiteHeat = o.white ?? true; S.earned = S.whiteHeat;
  let n = 0; const q = queue(...rolls); S.rng = () => { n++; return q(); };
  const res = R.finish(S, 'quench'); return { res, n };
}

test('a Rare with WHITE HEAT and no crack, at trade 4 or more: one in 20 wakes to Old-Blood', () => {
  const w = worked('falchion', [0, 0]); assert.equal(w.res.tier, OLD_BLOOD.tier); assert.ok(w.res.woke);
  const no = worked('falchion', [0, WAKE.odds]); assert.equal(no.res.tier, 2); assert.ok(!no.res.woke);
  // the dice are thrown for it only when it can wake: no Rare, a crack, no WHITE HEAT, under trade 4, a brew, the luck off
  for (const [why, o, roll] of [['Fine', {}, 0.99], ['a crack', { cracks: 1 }, 0], ['no WHITE HEAT', { white: false }, 0], ['trade 3', { level: 3 }, 0]]) {
    const r = worked('falchion', [roll, 0.99, 0.99]); const c = worked('falchion', [roll, 0.99, 0.99], o);
    assert.ok(!c.res.woke, why); if (why !== 'Fine') assert.equal(c.n, r.n - 1, why + ': no dice for it');
  }
  assert.ok(!worked('draught', [0, 0]).res.woke, 'a brew\'s Old-Blood is the master\'s brew\'s');
  R.setLuck(false); try { assert.ok(!worked('falchion', [0, 0]).res.woke); } finally { R.setLuck(true); }
});

test('a woken piece: Old-Blood, three affixes, "woke in the fire" on the card, and it stays so through a rework', () => {
  const { res } = worked('falchion', [0, 0, 0.99]);
  const p = R.makePiece({ patternId: 'falchion', picks: [0, 0, 0], result: res, picked: null, maker: 'Hand', rng: () => 0.3, now: 1 });
  assert.equal(p.tier, 'oldblood'); assert.equal(p.affixes.length, 3); assert.ok(p.woke); assert.ok(p.made.includes('woke in the fire'));
  const again = R.remakePiece({ card: p, res: { tier: 3, worked: 5, strikes: 5, heats: 1, cracks: 0 }, picked: null, rng: () => 0.3, now: 2 });
  assert.ok(again.woke && again.made.includes('woke in the fire'));
  // and a woken piece can still be marked: the mark's dice come after
  const m = worked('falchion', [0, 0, 0, 0]); assert.ok(m.res.woke && m.res.mark);
});
