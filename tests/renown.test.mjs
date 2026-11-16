import test from 'node:test';
import assert from 'node:assert/strict';
import * as Sh from '../js/shop.js';
import * as St from '../js/staff.js';
import * as G from '../js/growth.js';
import { RENOWN, CUSTOMERS, ROUTES, MATS, RENOWNED_RUNG, FAMED_RUNG } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const at = renown => ({ renown, wall: [], cards: [], shelf: [] });

test('two rungs above FAMED; purses stop growing at FAMED, the Crown\'s agent comes from RENOWNED', () => {
  assert.deepEqual(RENOWN.slice(-2).map(r => r.word), ['RENOWNED', 'OF THE REACH']);
  assert.equal(G.rung(at(1000)), RENOWNED_RUNG); assert.equal(G.rung(at(999)), FAMED_RUNG); assert.equal(G.rung(at(5000)), RENOWN.length - 1);
  assert.equal(G.purseMult(at(5000)), G.purseMult(at(400)), 'purses grow to FAMED, no further');
  const ids = CUSTOMERS.map(c => c.id), share = (s, id) => { const w = Sh.customerWeights(s); return w[ids.indexOf(id)] / w.reduce((a, b) => a + b, 0); };
  assert.equal(share(at(900), 'crown'), 0); assert.ok(share(at(1000), 'crown') > 0); assert.ok(share(at(4000), 'crown') > share(at(1000), 'crown'));
  assert.equal(Sh.customerWeights(at(5000))[ids.indexOf('steward')], Sh.customerWeights(at(400))[ids.indexOf('steward')], 'stewards level off at FAMED');
  const rng = seeded(3); for (let i = 0; i < 2000; i++) { const c = Sh.newCustomer(rng, at(1500)); if (c.type === 'crown') { assert.ok(c.purse >= 8000 && c.least === 3); } }
});

test('below the deep doors: only for a RENOWNED shop; long and dear; relic materials, sometimes nothing much', () => {
  const r = ROUTES.below, runner = { id: 'r', role: 'runner', name: 'Kit', trait: 'steady', xp: 0 };
  const s = { coins: 10000, staff: [runner], mats: {}, cards: [], found: ['ember'], renown: 900, wall: [] };
  assert.equal(St.sendRunner(s, 'below', 0), false, 'FAMED isn\'t enough'); s.renown = 1300;
  assert.ok(St.sendRunner(s, 'below', 0)); assert.equal(s.coins, 10000 - r.fee); assert.ok(r.h >= 12);
  let relics = 0, empty = 0; const rng = seeded(7);
  for (let i = 0; i < 1000; i++) { const h = St.haul(s, runner, 'below', rng, 0); if (h.empty) empty++; relics += Object.keys(h.mats).filter(m => MATS[m].relic).reduce((a, m) => a + h.mats[m], 0); }
  assert.ok(empty > 100 && empty < 220, empty + ' empty'); assert.ok(relics > 500 && relics < 800, relics + ' relic materials in 1000 trips');
  // no other road brings them
  for (const id of ['yard', 'ford', 'reach', 'deep']) for (let i = 0; i < 300; i++) assert.ok(!Object.keys(St.haul(s, runner, id, rng, 0).mats).some(m => MATS[m].relic));
});
