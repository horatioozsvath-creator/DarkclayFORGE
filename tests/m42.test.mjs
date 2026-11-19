// Milestone 42: the Nine of the Tide, and the crossing (docs/REGION-PLAN.md). Isel the Tide-Queen's nine pieces, each a coastal Relic
// reforged; their shards below the drowned town, from the Harbour Guild's orders, and on the strand when the tide gives back. At the
// handing on, the heir chooses where to set up the forge: the Reach or over the pass. The line's record, the link and the flyer
// carry where each generation worked.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as Leg from '../js/legacy.js';
import * as G from '../js/growth.js';
import * as Sh from '../js/shop.js';
import * as Trail from '../js/trail.js';
import * as Rg from '../js/region.js';
import * as Rm from '../js/room.js';
import * as R from '../js/rules.js';
import { packShop, unpackShop } from '../js/visit.js';
import { MYTHICS, RELICS, REGIONS, LEGACY, RENOWN, STATIONS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const DAY = 86400000, NOW = 2e12, COAST = 'greyshore';
const REACH9 = ['vericsedge', 'ironcrown', 'ringofnine', 'mantle', 'longsong', 'staffofosk', 'vericsdraught', 'farsight', 'morning'];
const TIDE = Rg.mythicsIn(COAST);
const piece = (id, tier) => ({ id, name: 'Piece ' + id, tier, pattern: 'axe', worth: 1000 });
const maker = (o = {}) => ({ v: 1, uid: 'u1', mats: {}, maker: 'Old Hand', coins: 1, renown: 5000, curve: 2, trades: {}, cards: [piece('m1', 'mythic'), piece('r1', 'relic')],
  mythicsMade: REACH9.slice(), staff: [{ id: 'a1', role: 'apprentice', name: 'Pip Hollis', trait: 'careful', hiredAt: NOW - 20 * DAY, skill: {} }], ...o });
const count = w => Object.values(w).reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {});

test('the Nine of the Tide: one from each of the coast\'s Relics, three parts from three other stations, three shards from each place', () => {
  assert.deepEqual(Rg.mythicsIn('reach'), REACH9, 'the Reach\'s Nine, as they were');
  assert.equal(TIDE.length, 9);
  assert.deepEqual(new Set(TIDE.map(id => MYTHICS[id].relic)), new Set(Rg.relicsIn(COAST)), 'every coastal Relic, once');
  const by = { deep: 0, court: 0, star: 0 };
  for (const id of TIDE) {
    const m = MYTHICS[id], home = R.stationOf(RELICS[m.relic].pattern).id;
    assert.equal(m.parts.length, 3); assert.equal(new Set(m.parts.map(p => p[0])).size, 3, id);
    assert.ok(m.parts.every(p => STATIONS[p[0]] && p[0] !== home), id + ': parts from other stations');
    assert.ok(m.powers.length === 3 && m.lore, id); by[m.shard]++;
  }
  assert.deepEqual(by, { deep: 3, court: 3, star: 3 });
  const names = Object.values(MYTHICS).map(m => m.name); assert.equal(new Set(names).size, names.length);
});

test('each region\'s Nine: the coast\'s maker is the Maker of the Tide; the Reach\'s Nine don\'t count there', () => {
  assert.ok(G.isNine(maker()), 'the Reach, as before');
  assert.ok(!G.isNine(maker({ region: COAST })), 'the Reach\'s Nine made, on the coast: not the Tide\'s');
  assert.ok(G.isNine(maker({ region: COAST, mythicsMade: TIDE.slice() })));
  assert.ok(!G.isNine(maker({ mythicsMade: TIDE.slice() })));
  assert.equal(Rg.legend(maker({ region: COAST })).title, 'MAKER OF THE TIDE'); assert.equal(Rg.legend(maker()).title, 'MAKER OF THE NINE');
  // the trail on the coast: the Tide's clues, and its words
  const s = maker({ region: COAST, renown: 1e5, mythicsMade: [] });
  assert.deepEqual(Trail.clues(s).map(c => c.id), TIDE);
  assert.match(Trail.partGate(s, TIDE[0], 0).why.join(), /shard of the Tide/);
});

test('the shards on the coast: the tide gives back what a star would, the Harbour Guild asks, the drowned town holds the rest', () => {
  const s = maker({ region: COAST, renown: 1e5, mythicsMade: [], shards: [] });
  // the tide giving back: a coastal day's event, its shards the Tide's
  const washup = { day: 100, region: COAST, event: 'washup' };
  const r = Trail.claimStar(s, washup); assert.equal(r.shards.length, 2); assert.ok(r.shards.every(id => MYTHICS[id].region === COAST && MYTHICS[id].shard === 'star'));
  assert.ok(Trail.claimStar(maker({ region: COAST, renown: 1e5, mythicsMade: [] }), { day: 100, region: COAST, event: 'gale' }).why, 'not on a gale day');
  assert.ok(REGIONS.greyshore.events.some(e => e.id === 'washup' && e.shards) && !REGIONS.greyshore.events.some(e => e.id === 'starfall'));
  // the Guild's order for a shard: a coastal Relic's kind, in the Guild's words
  const o = maker({ region: COAST, renown: 1e5, mythicsMade: [], book: { found: ['harpoon', 'oilskin', 'trident', 'pitch', 'spyglass'], tries: [], clues: [] },
    stations: ['stretcher', 'bowbench', 'kettle', 'glass'], shelf: [], slots: 4, ledger: [], queue: [], cards: [] });
  let guild = null; for (let i = 0; i < 400 && !guild; i++) { o.order = null; Sh.postOrder(o, seeded(i), NOW); if (o.order && o.order.shard) guild = o.order; }
  assert.ok(guild, 'the Guild asks'); assert.equal(guild.who, 'The Harbour Guild'); assert.equal(MYTHICS[guild.shard].region, COAST); assert.match(guild.line, /Tide-Queen/);
});

test('the crossing: the heir chooses where; the record keeps where each generation worked; the Nine scattered are that region\'s', () => {
  const h = Leg.handOn(maker(), 'm1', NOW, COAST);
  assert.ok(h.ok); const s = h.save;
  assert.equal(s.region, COAST); assert.equal(s.gen, 2); assert.equal(s.line[0].region, 'reach', 'the old shop worked in the Reach');
  assert.deepEqual(Object.keys(s.shardWhere).sort(), TIDE.slice().sort()); assert.deepEqual(count(s.shardWhere), { deep: 3, court: 3, star: 3 });
  assert.equal(Rg.localGen(s), 1, 'the coast\'s first'); assert.equal(s.renown, 0);
  // a third generation over the pass: still unknown in Saltby (its first was the second of the line)
  const g3 = Leg.handOn({ ...s, staff: maker().staff, mythicsMade: TIDE.slice(), cards: [piece('m2', 'mythic')] }, 'm2', NOW, COAST).save;
  assert.equal(g3.gen, 3); assert.equal(Rg.localGen(g3), 2); assert.equal(g3.renown, 0, 'the town\'s welcome counts the coast\'s generations');
  assert.equal(g3.line[1].region, COAST); assert.equal(g3.line[1].nine, 9, 'the Tide\'s Nine, counted');
  const g4 = Leg.handOn({ ...g3, staff: maker().staff, mythicsMade: TIDE.slice(), cards: [piece('m3', 'mythic')] }, 'm3', NOW, COAST).save;
  assert.equal(Rg.localGen(g4), 3); assert.equal(g4.renown, RENOWN[LEGACY.welcome].at, 'the third on the coast: the town knows the line');
  // going back over the pass: the Reach counts every generation (milestone 38), and has no region on the save
  const home = Leg.handOn({ ...g3, staff: maker().staff, mythicsMade: TIDE.slice(), cards: [piece('m3', 'mythic')] }, 'm3', NOW, 'reach').save;
  assert.equal(home.region, undefined); assert.equal(home.gen, 4); assert.equal(home.renown, RENOWN[LEGACY.welcome].at);
  assert.deepEqual(Object.keys(home.shardWhere).sort(), REACH9.slice().sort());
  // no region given: the Reach, exactly as before
  const plain = Leg.handOn(maker(), 'm1', NOW).save; assert.equal(plain.region, undefined);
  assert.deepEqual(plain.shardWhere, Leg.handOn(maker(), 'm1', NOW, 'reach').save.shardWhere);
});

test('the visit link carries the region; an older link, or one it can\'t read, is the Reach', () => {
  const s = Leg.handOn(maker(), 'm1', NOW, COAST).save; s.room = Rm.defaultShop(); s.shelf = []; s.cards = []; s.uid = 'shop01';
  const o = packShop(s, NOW); assert.equal(o.rg, COAST);
  assert.equal(unpackShop(o).region, COAST);
  delete o.rg; assert.equal(unpackShop(o).region, 'reach');
  assert.equal(unpackShop({ ...o, rg: 'atlantis' }).region, 'reach');
  const r = Leg.handOn(maker(), 'm1', NOW).save; r.room = Rm.defaultShop(); r.shelf = []; r.cards = []; r.uid = 'shop02';
  assert.ok(!('rg' in packShop(r, NOW)), 'a Reach shop\'s link as it was');
});

test('a Relic of the other region grows none of this region\'s Nine: no keeping it back, no Mythic working', () => {
  const gate = { id: 'g1', pattern: 'falchion', tier: 'relic', relic: 'gatewarden', name: 'Gatewarden', worth: 5000 };
  const tide = { id: 't1', pattern: 'falchion', tier: 'relic', relic: 'tidewarden', name: 'The Tidewarden', worth: 5000 };
  const at = { shelf: [], wall: [], mythicsMade: [], cards: [gate, tide] }, coast = maker({ region: COAST, ...at }), reach = maker(at);
  assert.equal(Sh.mythicAtStake(coast, gate), null); assert.equal(Sh.mythicFor(coast, gate).mythic, null);
  assert.equal(Sh.mythicAtStake(coast, tide), 'seagatesword'); assert.equal(Sh.mythicFor(coast, tide).mythic, 'seagatesword');
  assert.equal(Sh.mythicAtStake(reach, tide), null); assert.equal(Sh.mythicFor(reach, tide).mythic, null);
  assert.equal(Sh.mythicAtStake(reach, gate), 'vericsedge');
});
