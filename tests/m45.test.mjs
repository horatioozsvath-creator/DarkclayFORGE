// Milestone 45: the trapdoor (docs/MINE-PLAN.md). A mine under the shop from KNOWN, worked at THE FACE (a working like the
// stations': fire-set the rock till it's brittle, then swing), its seams in two galleries, the ore smelted to bars at the forge.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../js/rules.js';
import * as Sh from '../js/shop.js';
import * as Mine from '../js/mine.js';
import * as Rm from '../js/room.js';
import * as Trail from '../js/trail.js';
import * as Src from '../js/sources.js';
import * as Leg from '../js/legacy.js';
import { PATTERNS, MATS, RENOWN, FACE, STATIONS, MINE } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const KNOWN = RENOWN[MINE.rung].at, NOW = 2e12;
const shop = (o = {}) => ({ v: 1, coins: 1000, mats: {}, trades: {}, renown: KNOWN, cards: [], ...o });
const xpAt = lvl => { let x = 0; for (let l = 1; l < lvl; l++) x += R.xpToNext(l); return x; };

test('the trapdoor: there from KNOWN, opened once; a shop that never opens it has no mine', () => {
  assert.ok(!Mine.canOpen(shop({ renown: KNOWN - 1 }))); assert.ok(Mine.open(shop({ renown: KNOWN - 1 }), NOW).why);
  const s = shop(); assert.ok(Mine.canOpen(s) && !Mine.isOpen(s) && !Rm.owns(s, 'face'));
  assert.equal(Mine.galleries(s), 0);
  assert.ok(Mine.open(s, NOW).ok); assert.ok(Mine.isOpen(s) && !Mine.canOpen(s) && Rm.owns(s, 'face'));
  assert.equal(Mine.galleries(s), 1); assert.deepEqual(s.mine.galleries, { reach: 1 });
  assert.ok(Mine.open(s, NOW).why, 'only once');
  // on the coast: Wheal Isel
  const c = shop({ region: 'greyshore' }); Mine.open(c, NOW);
  assert.equal(Mine.digOf(c), 'wheal'); assert.equal(Mine.nameOf(c), 'Wheal Isel'); assert.deepEqual(c.mine.galleries, { greyshore: 1 });
});

test('the face: not a station (no room, no customer wants it); fire-set rock, a glancing blow when cold, a spall when too hot', () => {
  assert.ok(!STATIONS.face, 'not one of the stations');
  assert.equal(R.stationOf('dig').id, 'face'); assert.equal(R.stationOf('wheal').id, 'face'); assert.equal(R.stationOf('smelt').id, 'forge');   // (the page's data.js?v= is another module: compare ids)
  const S = R.newWorking({ patternId: 'dig', picks: [0], level: 3, found: [], kit: {} }, seeded(1));
  assert.equal(S.station.id, 'face'); assert.deepEqual(S.band, FACE.band); R.begin(S);
  // too cold: the pick glances off, nothing turns over and nothing slips in
  S.meter = 10; const before = S.rack.length, cold = R.strike(S); assert.ok(cold.dead); assert.equal(S.rack.length, before);
  // too hot (trade 3): a CRACK slips in, as a wet hide tears
  S.meter = 95; const hot = R.strike(S); assert.ok(S.rack.length > before, 'a CRACK slipped in');
  assert.ok(hot.pops.some(p => /SPALLED/.test(p.why || '')) || S.heatLines.some(l => /spalled/.test(l.what)));
  // a learner (trade 2): too hot does no harm yet
  const L = R.newWorking({ patternId: 'dig', picks: [0], level: 2, found: [], kit: {} }, seeded(2)); R.begin(L); L.meter = 95; const n = L.rack.length; R.strike(L); assert.equal(L.rack.length, n);
});

test('the seams: each region\'s own, the second gallery\'s shut till it\'s opened; the rock takes nothing; a haul by its tier', () => {
  const s = shop(); Mine.open(s, NOW);
  assert.deepEqual(Mine.seams(s).slice(0, 4).map(x => x.ore), ['ironstone', 'clearsand', 'tinstone', 'silverore']);   // (milestone 46 adds the deep galleries' after)
  assert.deepEqual(Mine.seams(s).slice(0, 4).map(x => x.open), [true, true, false, false]);
  const c = shop({ region: 'greyshore' }); Mine.open(c, NOW);
  assert.deepEqual(Mine.seams(c).slice(0, 4).map(x => x.ore), ['tinstone', 'blacksand', 'calamine', 'silverore']);
  assert.ok(Mine.canDig(s, 0).ok); assert.match(Mine.canDig(s, 2).why, /gallery/); assert.match(Mine.canDig(shop(), 0).why, /isn't open/);
  assert.deepEqual(Sh.recipe('dig', [0]), [], 'the rock takes nothing from the store room');
  assert.deepEqual(R.yieldOf('dig', 0, [0]), { mat: 'ironstone', n: 4, gem: 0 });
  assert.deepEqual(R.yieldOf('dig', 2, [1]), { mat: 'clearsand', n: 8, gem: 0 });
  assert.deepEqual(R.yieldOf('dig', 2, [3]), { mat: 'silverore', n: 8, gem: 1 }, 'a Rare haul from a silver vein brings a rough gem');
  assert.equal(R.yieldOf('dig', 1, [3]).gem, 0);
  assert.equal(R.yieldOf('bottles', 1).mat, 'bottle', 'the glass\'s bottles as before');
});

test('further down: the second gallery for trade 3, coin and oak to shore it', () => {
  const s = shop({ coins: 1000, mats: { oak: 4 } }); Mine.open(s, NOW);
  assert.match(Mine.nextGallery(s).why.join(), /trade 3/); assert.ok(Mine.openGallery(s).why);
  s.trades.dig = { xp: xpAt(3) };
  assert.ok(Mine.nextGallery(s).ok); assert.ok(Mine.openGallery(s).ok);
  assert.equal(Mine.galleries(s), 2); assert.equal(s.coins, 700); assert.equal(s.mats.oak, undefined);
  assert.ok(Mine.seams(s).slice(0, 4).every(x => x.open)); assert.ok(Mine.canDig(s, 3).ok);
  assert.equal(Mine.nextGallery(s).n, 3, 'the third gallery next (milestone 46)');
  const poor = shop({ coins: 10, mats: { oak: 1 }, trades: { dig: { xp: xpAt(3) } } }); Mine.open(poor, NOW);
  assert.deepEqual(Mine.nextGallery(poor).why, ['300 c', '4 oak staves']);
});

test('one mining trade between the regions; smelting is the forge\'s own working, and its practice doesn\'t raise the forge', () => {
  assert.equal(R.tradeId('wheal'), 'dig'); assert.equal(R.tradeId('dig'), 'dig'); assert.equal(R.tradeId('falchion'), 'falchion');
  const s = shop({ trades: { smelt: { xp: xpAt(9) }, dagger: { xp: xpAt(2) } } });
  assert.equal(Trail.stationLevel(s, 'forge'), 2, 'smelting is no forging');
  assert.equal(Trail.stationLevel(s, 'face'), 1);
});

test('smelting: three ore to four to six bars by its tier; the coast\'s calamine is offered on the coast, or to whoever carried some back', () => {
  assert.deepEqual(Sh.recipe('smelt', [0]), [{ mat: 'ironstone', n: 3 }]);
  assert.deepEqual(['ironstone', 'tinstone', 'silverore', 'darkclayore', 'calamine'].map((o, i) => R.yieldOf('smelt', 1, [i]).mat), ['iron', 'bronze', 'silver', 'darkclay', 'brass']);
  assert.equal(R.yieldOf('smelt', 0, [0]).n, 4); assert.equal(R.yieldOf('smelt', 2, [0]).n, 6);
  assert.deepEqual(R.partOptions('smelt', shop())[0].opts.map(o => o.id), ['ironstone', 'tinstone', 'silverore', 'darkclayore']);   // (darkclay ore: milestone 46)
  assert.equal(R.partOptions('smelt', shop({ region: 'greyshore' }))[0].opts.length, 5);
  assert.equal(R.partOptions('smelt', shop({ mats: { calamine: 3 } }))[0].opts.length, 5);
  // ore is sold by no one, and no runner brings it
  for (const id of ['ironstone', 'tinstone', 'silverore', 'calamine']) { assert.ok(MATS[id].ore); for (let h = 0; h < 48; h++) assert.ok(!Sh.sells(id, h) && !Sh.sells(id, h, shop({ region: 'greyshore' }))); }
});

test('where things come from: ore is dug; a bar can be smelted, after the sellers; a gem from a silver vein', () => {
  assert.deepEqual(Src.sourcesOf('ironstone').map(x => x.kind), ['dug']);
  assert.match(Src.sourcesOf('calamine', shop({ region: 'greyshore' }))[0].word, /Wheal Isel/);
  const iron = Src.sourcesOf('iron').map(x => x.kind); assert.equal(iron[0], 'sold'); assert.ok(iron.includes('smelted'));
  assert.ok(Src.sourcesOf('clearsand').some(x => x.kind === 'dug')); assert.ok(Src.sourcesOf('gem').some(x => x.kind === 'dug'));
  for (const m of Src.neededMats()) assert.ok(Src.sourcesOf(m).length, m);
});

test('the patterns: the mine\'s make no piece, are wanted by no one, and aren\'t handed on yet', () => {
  for (const id of ['dig', 'wheal', 'smelt']) { const p = PATTERNS[id]; assert.ok(p.mine && p.makes && !p.want && !p.hidden, id); }
  const old = { ...shop({ maker: 'Old Hand', renown: 5000, trades: { dig: { xp: xpAt(5) } }, curve: 2 }), cards: [], staff: [{ id: 'a1', role: 'apprentice', name: 'Pip Hollis', trait: 'careful', hiredAt: NOW - 20 * 86400000, skill: {} }], mythicsMade: ['vericsedge', 'ironcrown', 'ringofnine', 'mantle', 'longsong', 'staffofosk', 'vericsdraught', 'farsight', 'morning'] };
  Mine.open(old, NOW);
  const h = Leg.handOn(old, [], NOW); assert.ok(h.ok, h.why);
  // the line's mine (milestone 48): the galleries kept, the face and the smelting at the rest's trade
  assert.equal(R.levelOf(h.save.trades.dig.xp).level, 2); assert.equal(R.levelOf(h.save.trades.smelt.xp).level, 2); assert.deepEqual(h.save.mine.galleries, { reach: 1 });
});

test('the stage draws every pattern\'s working, wide and tall (milestone 45\'s fix: five forge patterns had no shape, and it threw)', async () => {
  globalThis.performance = globalThis.performance || { now: () => 0 };
  if (!globalThis.Path2D) globalThis.Path2D = class {};
  const St = await import('../js/stage.js');
  const noop = () => {}, grad = { addColorStop: noop };
  const g = new Proxy({}, { get: (t, k) => k === 'createRadialGradient' || k === 'createLinearGradient' ? () => grad : k === 'measureText' ? () => ({ width: 10 }) : t[k] !== undefined ? t[k] : noop, set: (t, k, v) => (t[k] = v, true) });
  for (const id of Object.keys(PATTERNS)) {
    const S = R.newWorking({ patternId: id, picks: [0, 0, 0], level: 3, found: [], kit: {} }, seeded(3)); R.begin(S);
    for (const inFire of [false, true]) { S.inFire = inFire; S.shape = inFire ? 40 : 100; S.worked = 12;
      assert.doesNotThrow(() => { St.paint(g, S, { flash: 1, ring: 0.5, ringC: '#fff', sparks: [] }, 0.016); St.paint(g, S, { flash: 0, ring: 0, sparks: [] }, 0.016, St.LAYOUTS.tall); }, id); }
  }
});
