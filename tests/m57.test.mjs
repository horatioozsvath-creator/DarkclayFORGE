// Milestone 57: the Nine of the Hearth, and the climb (docs/NORTH-PLAN.md). Aud the Hearthkeeper's nine pieces, each one of the hold's
// Relics reforged; their shards below the old halls, from the Thanes' Moot's orders, and at the ice-foot when the thaw gives back. At
// the handing on the heir chooses from three places: the Reach, over the pass or up into the snow. Hearthold is open.
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
const DAY = 86400000, NOW = 2e12, NORTH = 'north', COAST = 'greyshore';
const REACH9 = ['vericsedge', 'ironcrown', 'ringofnine', 'mantle', 'longsong', 'staffofosk', 'vericsdraught', 'farsight', 'morning'];
const HEARTH = Rg.mythicsIn(NORTH), TIDE = Rg.mythicsIn(COAST);
const piece = (id, tier) => ({ id, name: 'Piece ' + id, tier, pattern: 'axe', worth: 1000 });
const maker = (o = {}) => ({ v: 1, uid: 'u1', mats: {}, maker: 'Old Hand', coins: 1, renown: 5000, curve: 2, trades: {}, cards: [piece('m1', 'mythic'), piece('r1', 'relic')],
  mythicsMade: REACH9.slice(), staff: [{ id: 'a1', role: 'apprentice', name: 'Pip Hollis', trait: 'careful', hiredAt: NOW - 20 * DAY, skill: {} }], ...o });
const count = w => Object.values(w).reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {});

test('the Nine of the Hearth: one from each of the hold\'s Relics, three parts from three other stations, three shards from each place', () => {
  assert.deepEqual(Rg.mythicsIn('reach'), REACH9, 'the Reach\'s Nine, as they were'); assert.equal(TIDE.length, 9);
  assert.equal(HEARTH.length, 9);
  assert.deepEqual(new Set(HEARTH.map(id => MYTHICS[id].relic)), new Set(Rg.relicsIn(NORTH)), 'every one of the hold\'s Relics, once');
  const by = { deep: 0, court: 0, star: 0 };
  for (const id of HEARTH) {
    const m = MYTHICS[id], home = R.stationOf(RELICS[m.relic].pattern).id;
    assert.equal(m.parts.length, 3); assert.equal(new Set(m.parts.map(p => p[0])).size, 3, id);
    assert.ok(m.parts.every(p => STATIONS[p[0]] && p[0] !== home), id + ': parts from other stations');
    assert.ok(m.powers.length === 3 && m.lore, id); by[m.shard]++;
  }
  assert.deepEqual(by, { deep: 3, court: 3, star: 3 });
  const names = Object.values(MYTHICS).map(m => m.name); assert.equal(new Set(names).size, names.length);
});

test('each region\'s Nine: up in the snow the maker is the Maker of the Hearth; the others\' Nine don\'t count there', () => {
  assert.ok(G.isNine(maker()), 'the Reach, as before');
  assert.ok(!G.isNine(maker({ region: NORTH })) && !G.isNine(maker({ region: NORTH, mythicsMade: TIDE.slice() })));
  assert.ok(G.isNine(maker({ region: NORTH, mythicsMade: HEARTH.slice() })));
  assert.ok(!G.isNine(maker({ mythicsMade: HEARTH.slice() })) && !G.isNine(maker({ region: COAST, mythicsMade: HEARTH.slice() })));
  const L = Rg.legend(maker({ region: NORTH }));
  assert.equal(L.title, 'MAKER OF THE HEARTH'); assert.equal(L.ofLine, ' · OF THE HIGH SNOW'); assert.equal(L.court, 'The Thanes\' Moot');
  assert.equal(L.ending.length, 4); assert.equal(L.arrive.length, 3); assert.equal(L.arriveWord, 'UP INTO THE SNOW');
  const s = maker({ region: NORTH, renown: 1e5, mythicsMade: [] });
  assert.deepEqual(Trail.clues(s).map(c => c.id), HEARTH);
  assert.match(Trail.partGate(s, HEARTH[0], 0).why.join(), /shard of the Hearth/);
});

test('the shards up in the snow: the thaw gives back what a star would, the Thanes\' Moot asks, the old halls hold the rest', () => {
  const s = maker({ region: NORTH, renown: 1e5, mythicsMade: [], shards: [] });
  const r = Trail.claimStar(s, { day: 100, region: NORTH, event: 'thawgives' });
  assert.equal(r.shards.length, 2); assert.ok(r.shards.every(id => MYTHICS[id].region === NORTH && MYTHICS[id].shard === 'star'));
  assert.ok(Trail.claimStar(maker({ region: NORTH, renown: 1e5, mythicsMade: [] }), { day: 100, region: NORTH, event: 'deepwinter' }).why, 'not in deep winter');
  assert.ok(REGIONS.north.events.some(e => e.id === 'thawgives' && e.shards) && !REGIONS.north.events.some(e => e.id === 'starfall' || e.id === 'washup'));
  assert.ok(Rg.shardDay({ region: NORTH, event: 'thawgives' }) && !Rg.shardDay({ region: NORTH, event: 'moot' }));
  const o = maker({ region: NORTH, renown: 1e5, mythicsMade: [], book: { found: ['iceaxe', 'furhood', 'snowshoes', 'warming', 'goggles', 'lantern'], tries: [], clues: [] },
    stations: ['stretcher', 'bowbench', 'kettle', 'glass'], shelf: [], slots: 4, ledger: [], queue: [], cards: [] });
  let moot = null; for (let i = 0; i < 400 && !moot; i++) { o.order = null; Sh.postOrder(o, seeded(i), NOW); if (o.order && o.order.shard) moot = o.order; }
  assert.ok(moot, 'the Moot asks'); assert.equal(moot.who, 'The Thanes\' Moot'); assert.equal(MYTHICS[moot.shard].region, NORTH); assert.match(moot.line, /Aud/);
});

test('the climb: up into the snow from the Reach or the coast; the record keeps where each generation worked; the Nine scattered are the Hearth\'s', () => {
  for (const from of [{}, { region: COAST, mythicsMade: TIDE.slice() }]) {
    const h = Leg.handOn(maker(from), 'm1', NOW, NORTH); assert.ok(h.ok); const s = h.save;
    assert.equal(s.region, NORTH); assert.equal(s.gen, 2); assert.equal(s.line[0].region || 'reach', from.region || 'reach');
    assert.deepEqual(Object.keys(s.shardWhere).sort(), HEARTH.slice().sort()); assert.deepEqual(count(s.shardWhere), { deep: 3, court: 3, star: 3 });
    assert.equal(Rg.localGen(s), 1, 'the hold\'s first'); assert.equal(s.renown, 0);
    assert.equal(s.line[0].nine, 9, 'the old region\'s Nine, counted');
  }
  const s = Leg.handOn(maker(), 'm1', NOW, NORTH).save;
  const g3 = Leg.handOn({ ...s, staff: maker().staff, mythicsMade: HEARTH.slice(), cards: [piece('m2', 'mythic')] }, 'm2', NOW, NORTH).save;
  assert.equal(Rg.localGen(g3), 2); assert.equal(g3.renown, 0); assert.equal(g3.line[1].region, NORTH); assert.equal(g3.line[1].nine, 9);
  const g4 = Leg.handOn({ ...g3, staff: maker().staff, mythicsMade: HEARTH.slice(), cards: [piece('m3', 'mythic')] }, 'm3', NOW, NORTH).save;
  assert.equal(Rg.localGen(g4), 3); assert.equal(g4.renown, RENOWN[LEGACY.welcome].at, 'the third up in the snow: the hold knows the line');
  // back down: the Reach counts every generation; over the pass, only the coast's
  const home = Leg.handOn({ ...g3, staff: maker().staff, mythicsMade: HEARTH.slice(), cards: [piece('m3', 'mythic')] }, 'm3', NOW, 'reach').save;
  assert.equal(home.region, undefined); assert.equal(home.renown, RENOWN[LEGACY.welcome].at); assert.deepEqual(Object.keys(home.shardWhere).sort(), REACH9.slice().sort());
  const sea = Leg.handOn({ ...g3, staff: maker().staff, mythicsMade: HEARTH.slice(), cards: [piece('m3', 'mythic')] }, 'm3', NOW, COAST).save;
  assert.equal(sea.region, COAST); assert.equal(Rg.localGen(sea), 1); assert.deepEqual(Object.keys(sea.shardWhere).sort(), TIDE.slice().sort());
  // each region's words for the road
  assert.match(Rg.legendIn(NORTH).go, /Hearthold/); assert.match(Rg.legendIn(COAST).go, /Saltby/);
  assert.match(Rg.legendIn(NORTH).back, /down from the snow/); assert.match(Rg.legendIn(COAST).back, /over the pass/);
});

test('the visit link carries the High Snow; a Reach shop\'s link as it was', () => {
  const s = Leg.handOn(maker(), 'm1', NOW, NORTH).save; s.room = Rm.defaultShop(); s.shelf = []; s.cards = []; s.uid = 'shop03';
  const o = packShop(s, NOW); assert.equal(o.rg, NORTH); assert.equal(unpackShop(o).region, NORTH);
  delete o.rg; assert.equal(unpackShop(o).region, 'reach');
});

test('a Relic of another region grows none of the Hearth\'s Nine; the hold\'s grows only the Hearth\'s', () => {
  const gate = { id: 'g1', pattern: 'falchion', tier: 'relic', relic: 'gatewarden', name: 'Gatewarden', worth: 5000 };
  const frost = { id: 'f1', pattern: 'iceaxe', tier: 'relic', relic: 'frostwarden', name: 'The Frostwarden', worth: 5000 };
  const at = { shelf: [], wall: [], mythicsMade: [], cards: [gate, frost] }, hold = maker({ region: NORTH, ...at }), reach = maker(at);
  assert.equal(Sh.mythicFor(hold, gate).mythic, null); assert.equal(Sh.mythicFor(hold, frost).mythic, 'highgateaxe');
  assert.equal(Sh.mythicAtStake(hold, frost), 'highgateaxe'); assert.equal(Sh.mythicFor(reach, frost).mythic, null);
});
