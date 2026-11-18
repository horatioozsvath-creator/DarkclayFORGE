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

test('the trail: closed until OF THE REACH; then every clue is open, Relic made or not', () => {
  assert.ok(!Trail.open(reach({ renown: 2000 }))); assert.ok(Trail.open(reach()));
  assert.equal(Trail.clues(reach({ renown: 2000 })).filter(c => c.open).length, 0);
  const s = reach({ relicsMade: [] });
  const cl = Trail.clues(s); assert.equal(cl.filter(c => c.open).length, 9);
  const court = Object.keys(MYTHICS).filter(k => MYTHICS[k].shard === 'court');
  assert.deepEqual(Trail.pending(s, 'court'), court);
  assert.ok(Trail.give(s, 'vericsedge')); assert.ok(!Trail.give(s, 'vericsedge'), 'one shard each'); assert.ok(!Trail.pending(s, 'court').includes('vericsedge'));
});

test('shards: below the deep doors now and then; the Court\'s orders; the fallen star, once on its day', () => {
  const s = reach(), runner = { id: 'r', role: 'runner', name: 'Kit', trait: 'keen', xp: 0 }, rng = seeded(3);
  let got = 0; for (let i = 0; i < 1000; i++) { const h = St.haul(s, runner, 'below', rng, 0); if (h.shard && MYTHICS[h.shard].shard === 'deep') got++; else if (h.shard) assert.equal(MYTHICS[h.shard].shard, 'star', 'or a star\'s, now and then (milestone 35)'); }
  assert.ok(got > 200 && got < 400, got + ' of 1000 (about one trip in three)');
  // the Court: a Rare or better piece of the Relic's kind (milestone 34: was Old-Blood); its shard with the pay
  let court = null; for (let i = 0; i < 200 && !court; i++) { const t = reach(); Sh.postOrder(t, seeded(i), 0); if (t.order.shard) court = t; }
  assert.ok(court); const o = court.order; assert.equal(o.least, 2); assert.equal(MYTHICS[o.shard].shard, 'court');
  const piece = R.makePiece({ patternId: o.pattern, picks: [0, 0, 0], result: { tier: 3, flawed: false, worked: 10, strikes: 9, heats: 1, cracks: 0 }, maker: 'T', rng: seeded(1), now: 1 });
  court.cards.push(piece); const e = Sh.deliver(court, piece.id, 1); assert.equal(e.shard, o.shard); assert.ok(Trail.hasShard(court, o.shard));
  // the fallen star: rare, and only once a day
  let star = null; for (let d = 20000; d < 23000 && !star; d++) { const t = Town.townOn(d); if (t.event === 'starfall') star = t; }
  assert.ok(star, 'a star falls now and then');
  let falls = 0; for (let d = 20000; d < 24000; d++) if (Town.townOn(d).event === 'starfall') falls++;
  assert.ok(falls > 320 && falls < 520, falls + ' in 4000 days (about one in ten)');
  const t = reach(); const r = Trail.claimStar(t, star); assert.equal(MYTHICS[r.shard].shard, 'star');
  assert.ok(Trail.claimStar(t, star).why, 'once a day');
  assert.ok(Trail.claimStar(reach(), { ...star, event: 'fair' }).why);
});

// ---------- milestone 17: the parts and the Mythic working ----------
const xpTo = lvl => { let x = 0; for (let l = 1; l < lvl; l++) x += R.xpToNext(l); return x; };
test('a part: its shard first, the station set up, trade 4 there (milestone 34: was 6); narrow, WHITE HEAT once and no crack', () => {
  const s = reach({ shards: [], trades: {} });
  assert.match(Trail.partGate(s, 'vericsedge', 0).why.join(), /shard/);
  s.shards = ['vericsedge']; assert.match(Trail.partGate(s, 'vericsedge', 0).why.join(), /trade 4/);
  s.trades = { lens: { xp: xpTo(4) } }; const g = Trail.partGate(s, 'vericsedge', 0); assert.ok(g.ok); assert.equal(g.station, 'glass'); assert.equal(g.pattern, 'lens');
  assert.ok(!Trail.partGate({ ...s, stations: [] }, 'vericsedge', 0).ok, 'no glass set up');
  const cfg = { patternId: 'lens', picks: [0, 0, 0], level: 6, found: [], kit: {} };
  const plain = R.newWorking(cfg, seeded(1)), P = R.newWorking({ ...cfg, part: { mythic: 'vericsedge', i: 0 } }, seeded(1));
  assert.ok(P.part && P.band[1] - P.band[0] < plain.band[1] - plain.band[0]);
  P.shape = 100; P.whites = 1; P.whiteHeat = true; const ok = R.finish(P, 'quench'); assert.ok(ok.part && ok.took);
  const Q = R.newWorking({ ...cfg, part: { mythic: 'vericsedge', i: 0 } }, seeded(1)); Q.shape = 100; Q.whites = 1; Q.cracks = 1; assert.ok(!R.finish(Q, 'quench').took);
  Trail.makePart(s, 'vericsedge', 0); assert.ok(Trail.hasPart(s, 'vericsedge', 0)); assert.ok(Trail.partGate(s, 'vericsedge', 0).done);
  assert.ok(!Trail.partsDone(s, 'vericsedge')); Trail.makePart(s, 'vericsedge', 1); Trail.makePart(s, 'vericsedge', 2); assert.ok(Trail.partsDone(s, 'vericsedge'));
});

test('the Mythic working: on the Relic, with the shard, the three parts and trade 9; WHITE HEAT three times and no crack, or the Relic stays', () => {
  const base = R.makePiece({ patternId: 'falchion', picks: [3, 2, 0], result: { tier: 4, flawed: false, worked: 20, strikes: 20, heats: 2, cracks: 0, whiteHeat: true }, maker: 'T', rng: seeded(2), now: 1 });
  const relic = { ...R.relicPiece(base, 'gatewarden'), tier: 'relic' };
  const s = reach({ cards: [relic], shards: ['vericsedge'], mythicParts: { vericsedge: [true, true, false] }, trades: { falchion: { xp: xpTo(9) } } });
  assert.match(Sh.mythicFor(s, relic).why.join(), /moonwell quench|wyrm-hide/);
  s.mythicParts.vericsedge = [true, true, true]; const g = Sh.mythicFor(s, relic); assert.ok(g.ok); assert.equal(g.mythic, 'vericsedge');
  assert.deepEqual(Sh.mythicCost(relic, 'vericsedge').map(x => x.mat), [relic.metal, 'heartstone']);
  const cfg = { patternId: 'falchion', picks: [3, 2, 0], level: 9, found: [], kit: {} };
  const Rl = R.newWorking({ ...cfg, rework: { from: 3, relic: 'gatewarden' } }, seeded(1)), M = R.newWorking({ ...cfg, rework: { from: 4, mythic: 'vericsedge' } }, seeded(1));
  assert.ok(M.mythic && M.band[1] - M.band[0] < Rl.band[1] - Rl.band[0], 'the narrowest');
  M.shape = 100; M.whites = 3; M.whiteHeat = true; const ok = R.finish(M, 'quench'); assert.equal(ok.tier, 5); assert.ok(!ok.failed);
  const two = R.newWorking({ ...cfg, rework: { from: 4, mythic: 'vericsedge' } }, seeded(1)); two.shape = 100; two.whites = 2; assert.ok(R.finish(two, 'quench').failed);
  const piece = R.mythicPiece({ ...R.remakePiece({ card: relic, res: ok, picked: null, rng: seeded(3), now: 2 }), tier: 'mythic' }, 'vericsedge');
  assert.equal(piece.name, 'Veric\'s Edge'); assert.equal(piece.tier, 'mythic'); assert.equal(piece.powers.length, 3); assert.equal(piece.power, undefined);
  assert.ok(piece.worth > relic.worth * 2);
  assert.ok(Sh.mythicFor({ ...s, mythicsMade: ['vericsedge'] }, relic).made, 'one in a save');
  assert.equal(Sh.salvage({ cards: [piece], shelf: [], wall: [], mats: {} }, piece.id), null, 'never broken down');
});
