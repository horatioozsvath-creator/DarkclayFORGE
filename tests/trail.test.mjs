import test from 'node:test';
import assert from 'node:assert/strict';
import * as Trail from '../js/trail.js';
import * as Sh from '../js/shop.js';
import * as St from '../js/staff.js';
import * as R from '../js/rules.js';
import * as Town from '../js/town.js';
import { encodeCard, decodeCard } from '../js/share.js';
import { TIERS, MYTHICS, RELICS, TRAIL, TOWN_EVENTS, STATIONS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const reach = (o = {}) => ({ renown: 4000, wall: [], cards: [], shelf: [], mats: {}, stations: Object.keys(STATIONS).filter(k => k !== 'forge'), ledger: [], clock: 0, found: ['ember'], relicsMade: Object.keys(RELICS), ...o });

test('the Mythic tier and the Nine: red, after the Relic; nine of them, each from a Relic, three parts from three other stations', () => {
  assert.equal(TIERS[5].id, 'mythic'); assert.ok(TIERS[5].worth > TIERS[4].worth * 2);
  assert.equal(Object.keys(MYTHICS).length, 9);
  const counts = { deep: 0, court: 0, star: 0 };
  for (const [id, m] of Object.entries(MYTHICS)) {
    const r = RELICS[m.relic]; assert.ok(r, id);
    const home = (R.stationOf(r.pattern) || {}).id;
    assert.equal(m.parts.length, 3); assert.equal(new Set(m.parts.map(p => p[0])).size, 3, id + ': three different stations');
    assert.ok(m.parts.every(p => STATIONS[p[0]] && p[0] !== home), id + ': parts from other stations');
    assert.equal(m.powers.length, 3); counts[m.shard]++;
  }
  assert.deepEqual(counts, { deep: 3, court: 3, star: 3 });
  assert.equal(new Set(Object.values(MYTHICS).map(m => m.relic)).size, 9, 'nine different Relics');
  // a Mythic card's powers travel in a link
  const c = { tier: 'mythic', name: 'Veric\'s Edge', kind: 'SWORD', art: 'falchion', tint: '#c9c5be', dice: '', stats: [], affixes: [], made: [], lore: 'x', worth: 1, pattern: 'falchion', powers: MYTHICS.vericsedge.powers };
  assert.deepEqual(decodeCard(encodeCard(c)).powers, MYTHICS.vericsedge.powers);
});

test('the trail: closed until OF THE REACH; a clue opens with its Relic made', () => {
  assert.ok(!Trail.open(reach({ renown: 2000 }))); assert.ok(Trail.open(reach()));
  const s = reach({ relicsMade: ['gatewarden'] });
  const cl = Trail.clues(s); assert.equal(cl.filter(c => c.open).length, 1); assert.equal(cl.find(c => c.open).id, 'vericsedge');
  assert.deepEqual(Trail.pending(s, 'court'), ['vericsedge']); assert.deepEqual(Trail.pending(s, 'deep'), []);
  assert.ok(Trail.give(s, 'vericsedge')); assert.ok(!Trail.give(s, 'vericsedge'), 'one shard each'); assert.deepEqual(Trail.pending(s, 'court'), []);
});

test('shards: below the deep doors now and then; the Court\'s orders; the fallen star, once on its day', () => {
  const s = reach(), runner = { id: 'r', role: 'runner', name: 'Kit', trait: 'keen', xp: 0 }, rng = seeded(3);
  let got = 0; for (let i = 0; i < 1000; i++) { const h = St.haul(s, runner, 'below', rng, 0); if (h.shard) { got++; assert.equal(MYTHICS[h.shard].shard, 'deep'); } }
  assert.ok(got > 50 && got < 150, got + ' of 1000');
  // the Court: an Old-Blood piece of the Relic's kind; its shard with the pay
  let court = null; for (let i = 0; i < 200 && !court; i++) { const t = reach(); Sh.postOrder(t, seeded(i), 0); if (t.order.shard) court = t; }
  assert.ok(court); const o = court.order; assert.equal(o.least, 3); assert.equal(MYTHICS[o.shard].shard, 'court');
  const piece = R.makePiece({ patternId: o.pattern, picks: [0, 0, 0], result: { tier: 3, flawed: false, worked: 10, strikes: 9, heats: 1, cracks: 0 }, maker: 'T', rng: seeded(1), now: 1 });
  court.cards.push(piece); const e = Sh.deliver(court, piece.id, 1); assert.equal(e.shard, o.shard); assert.ok(Trail.hasShard(court, o.shard));
  // the fallen star: rare, and only once a day
  let star = null; for (let d = 20000; d < 23000 && !star; d++) { const t = Town.townOn(d); if (t.event === 'starfall') star = t; }
  assert.ok(star, 'a star falls now and then');
  let falls = 0; for (let d = 20000; d < 24000; d++) if (Town.townOn(d).event === 'starfall') falls++;
  assert.ok(falls > 120 && falls < 280, falls + ' in 4000 days (about one in three weeks)');
  const t = reach(); const r = Trail.claimStar(t, star); assert.equal(MYTHICS[r.shard].shard, 'star');
  assert.ok(Trail.claimStar(t, star).why, 'once a day');
  assert.ok(Trail.claimStar(reach(), { ...star, event: 'fair' }).why);
});
