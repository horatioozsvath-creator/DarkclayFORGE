// Milestone 35: the Nine's pace. A fallen star brings two shards, and now and then one lies below the deep doors; on the trail, the Deep
// brings the blueprints the Nine grow from first.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as Trail from '../js/trail.js';
import * as St from '../js/staff.js';
import * as Town from '../js/town.js';
import { MYTHICS as ALL_MYTHICS, RELICS, STATIONS, TRAIL } from '../js/data.js';
// the Reach's Nine (milestone 42: the coast's Nine of the Tide are in the same table, marked with their region)
const MYTHICS = Object.fromEntries(Object.entries(ALL_MYTHICS).filter(([, m]) => !m.region));

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const reach = (o = {}) => ({ renown: 4000, wall: [], cards: [], shelf: [], mats: {}, stations: Object.keys(STATIONS).filter(k => k !== 'forge'), ledger: [], clock: 0, found: ['ember'], relicsMade: Object.keys(RELICS), ...o });
const starDay = () => { for (let d = 20000; d < 23000; d++) { const t = Town.townOn(d); if (t.event === 'starfall') return t; } };

test('a fallen star: two of the shards waiting there, then one, then none', () => {
  assert.equal(TRAIL.star, 2);
  const star = starDay(), s = reach(), all = Object.keys(MYTHICS).filter(id => MYTHICS[id].shard === 'star');
  const r = Trail.claimStar(s, star);
  assert.equal(r.shards.length, 2); assert.equal(r.shard, r.shards[0]); assert.ok(r.shards.every(id => Trail.hasShard(s, id)));
  assert.ok(Trail.claimStar(s, star).why, 'once a day');
  const r2 = Trail.claimStar(s, { ...star, day: star.day + 1 }); assert.equal(r2.shards.length, 1, 'only one left there');
  assert.ok(all.every(id => Trail.hasShard(s, id)));
  assert.ok(Trail.claimStar(s, { ...star, day: star.day + 2 }).why, 'none left');
});

test('below the deep doors, on the trail: a blueprint a Mythic grows from first; before the trail, any', () => {
  const runner = { id: 'r', role: 'runner', name: 'Kit', trait: 'keen', xp: 0 }, nineRelics = new Set(Object.values(MYTHICS).map(m => m.relic));
  const others = Object.keys(RELICS).filter(k => !nineRelics.has(k)); assert.ok(others.length, 'some Relics none of the Nine grow from');
  const on = reach({ relicsMade: [], blueprints: [] }), rng = seeded(4); let got = 0;
  for (let i = 0; i < 2000; i++) { const b = St.haul(on, runner, 'below', rng, 0).blueprint; if (b) { got++; assert.ok(nineRelics.has(b), b); } }
  assert.ok(got > 150, got + ' blueprints');
  // all the Nine's found: the others come
  const rest = reach({ relicsMade: [], blueprints: [...nineRelics] }); let other = 0;
  for (let i = 0; i < 2000; i++) { const b = St.haul(rest, runner, 'below', rng, 0).blueprint; if (b) { assert.ok(others.includes(b)); other++; } }
  assert.ok(other > 150);
  // before the trail opens: any of them
  const early = reach({ renown: 1300, relicsMade: [], blueprints: [] }); assert.ok(!Trail.open(early)); const seen = new Set();
  for (let i = 0; i < 4000; i++) { const b = St.haul(early, runner, 'below', rng, 0).blueprint; if (b) seen.add(b); }
  assert.ok(others.some(k => seen.has(k)), 'a Relic outside the Nine can come before the trail');
});

test('below the deep doors: now and then one of the star\'s shards, once the Deep\'s own are found', () => {
  const runner = { id: 'r', role: 'runner', name: 'Kit', trait: 'keen', xp: 0 }, rng = seeded(7);
  const deepOnes = Object.keys(MYTHICS).filter(id => MYTHICS[id].shard === 'deep'), starOnes = Object.keys(MYTHICS).filter(id => MYTHICS[id].shard === 'star');
  const s = reach({ shards: [...deepOnes], blueprints: Object.keys(RELICS) }); let got = 0;
  for (let i = 0; i < 2000; i++) { const h = St.haul(s, runner, 'below', rng, 0); if (h.shard) { assert.ok(starOnes.includes(h.shard), h.shard); got++; } }
  assert.ok(got > 2000 * TRAIL.starBelow * 0.5 && got < 2000 * TRAIL.starBelow * 1.6, got + ' of 2000 trips');
  const done = reach({ shards: [...deepOnes, ...starOnes], blueprints: Object.keys(RELICS) });
  for (let i = 0; i < 500; i++) assert.ok(!St.haul(done, runner, 'below', rng, 0).shard, 'none left');
  for (let i = 0; i < 500; i++) assert.ok(!St.haul(reach({ shards: [] }), runner, 'deep', rng, 0).shard, 'not on a shallower road');
});
