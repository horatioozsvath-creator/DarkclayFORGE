// Milestone 48: the bottom and the line (docs/MINE-PLAN.md). The fifth gallery breaks through into the deep (on the coast, the
// drowned town from below): the runners' way down through the mine, a relic material now and then at the bottom's face, and the
// heir keeping the galleries, their shoring gone old.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../js/rules.js';
import * as Mine from '../js/mine.js';
import * as Mi from '../js/miner.js';
import * as St from '../js/staff.js';
import * as Run from '../js/runner.js';
import * as Src from '../js/sources.js';
import * as Leg from '../js/legacy.js';
import { RENOWN, MINE, MATS, ROUTES, LEGACY } from '../js/data.js';

const H = 3600000, D = 24 * H, NOW = 2e12;
const xpAt = lvl => { let x = 0; for (let l = 1; l < lvl; l++) x += R.xpToNext(l); return x; };
const shop = (o = {}) => ({ v: 1, coins: 30000, mats: { oak: 60 }, trades: { dig: { xp: xpAt(7) } }, renown: RENOWN[5].at, cards: [], staff: [], found: ['ember'], ...o });
function mine(n, o) { const s = shop(o); Mine.open(s, NOW); for (let g = 2; g <= n; g++) assert.ok(Mine.openGallery(s).ok, 'gallery ' + g); return s; }
const always = () => 0, never = () => 0.999;

test('the bottom: trade 7, a shop RENOWNED, 8,000 c and 16 oak; it breaks through, and its face has a seam of its own', () => {
  const s = mine(4, { trades: { dig: { xp: xpAt(6) } }, renown: RENOWN[4].at });
  assert.deepEqual(Mine.nextGallery(s).why, ['trade 7 in mining', 'a shop RENOWNED']);
  assert.ok(!Mine.atBottom(s));
  s.trades.dig.xp = xpAt(7); s.renown = RENOWN[5].at; const coins = s.coins;
  assert.ok(Mine.openGallery(s).ok); assert.equal(coins - s.coins, 8000); assert.ok(Mine.atBottom(s)); assert.equal(Mine.nextGallery(s), null);
  assert.equal(Mine.galleryName(s, 5), 'The bottom');
  const b = Mine.seams(s).find(x => x.gallery === 5); assert.equal(b.ore, 'darkclayore'); assert.equal(b.level, 7);
  assert.deepEqual([0, 1, 2].map(t => R.yieldOf('dig', t, [b.i]).n), [4, 6, 8]);
  const c = mine(5, { region: 'greyshore' }); assert.equal(Mine.galleryName(c, 5), 'Under the drowned town');
  assert.equal(Mine.seams(c).find(x => x.gallery === 5).ore, 'drownedsilver');
  assert.equal(MINE.galleries[5].deep, true, 'it takes water too');
});

test('a relic material in the rock at the bottom, now and then, to your own hand only', () => {
  const s = mine(5);
  assert.equal(Mine.deepFind(s, 4, always, NOW), null, 'not above the bottom');
  assert.equal(Mine.deepFind(s, 5, never, NOW), null);
  const f = Mine.deepFind(s, 5, always, NOW); assert.ok(MATS[f.mat].relic); assert.equal(s.mats[f.mat], 1);
  assert.equal(Mine.deepFind(s, 5, always, NOW + (MINE.bottom.gapD - 1) * D), null, 'never twice within the gap');
  assert.ok(Mine.deepFind(s, 5, always, NOW + MINE.bottom.gapD * D)); delete s.mats[Object.keys(s.mats).filter(m => MATS[m].relic && m !== f.mat)[0]]; s.mats[f.mat] = 1;
  // a miner at the bottom never brings one up
  const t = s, p = { id: 'm', role: 'miner', name: 'Pell', trait: 'quick', xp: 0, seam: 'seam_bottom' }; t.staff.push(p); t.gentle = true;
  for (let i = 0; i < 40; i++) Mi.dig(t, p, Mine.seams(t).find(x => x.id === 'seam_bottom'), always, NOW);
  assert.equal(Object.keys(t.mats).filter(m => MATS[m].relic).length, 1, 'only the one you found');
});

test('down through the mine: a runner\'s way below once it\'s broken through, shorter and safer than the road; no shard that way', () => {
  const s = mine(4, { threatsFrom: 0 }), p = { id: 'r1', role: 'runner', name: 'Pip', trait: 'keen', xp: 0, trip: null }; s.staff.push(p);
  assert.ok(!St.sendRunner(s, 'shaft', NOW, 'r1'), 'not before the bottom');
  assert.ok(!Src.sourcesOf('heartstone', s).some(x => x.kind === 'dug')); assert.ok(!Src.sourcesOf('heartstone', s).find(x => x.kind === 'deep').roads.includes(ROUTES.shaft.name));
  assert.ok(Mine.openGallery(s).ok);
  assert.ok(Src.sourcesOf('heartstone', s).some(x => x.kind === 'dug')); assert.ok(Src.sourcesOf('heartstone', s).find(x => x.kind === 'deep').roads.includes(ROUTES.shaft.name));
  assert.ok(ROUTES.shaft.h < ROUTES.below.h && ROUTES.shaft.noShard);
  const k = Run.risk(s, p, 'shaft', NOW), b = Run.risk(s, p, 'below', NOW); assert.ok(k.hurt < b.hurt && k.die < b.die);
  assert.ok(St.sendRunner(s, 'shaft', NOW, 'r1')); assert.equal(p.trip.back - NOW, ROUTES.shaft.h * H);
  assert.ok(!St.haul(s, p, 'shaft', always, NOW).shard); assert.ok(!St.haul(s, p, 'shaft', () => 0.5, NOW).shard);
  const c = mine(5, { region: 'greyshore' }); assert.ok(Mine.atBottom(c));
});

test('the line keeps the mine: the heir starts as deep as the last generation got, the shoring gone old; the record says how deep', () => {
  const old = { ...shop({ maker: 'Old Hand', renown: 5000, curve: 2 }), cards: [], staff: [{ id: 'a1', role: 'apprentice', name: 'Pip Hollis', trait: 'careful', hiredAt: NOW - 20 * D, skill: {} }],
    mythicsMade: ['vericsedge', 'ironcrown', 'ringofnine', 'mantle', 'longsong', 'staffofosk', 'vericsdraught', 'farsight', 'morning'] };
  Mine.open(old, NOW); for (let g = 2; g <= 4; g++) assert.ok(Mine.openGallery(old).ok);
  old.mine.galleries.greyshore = 2;   // they'd dug Wheal Isel too
  Mine.stateOf(old, 3).fell = true;
  const h = Leg.handOn(old, [], NOW + D); assert.ok(h.ok, h.why);
  const n = h.save;
  assert.deepEqual(n.mine.galleries, { reach: 4, greyshore: 2 });
  assert.ok(Mine.isOpen(n)); assert.equal(Mine.galleries(n), 4);
  for (let g = 1; g <= 4; g++) { assert.equal(Mine.shoring(n, g), MINE.line.old); assert.ok(!Mine.isFallen(n, g)); }
  assert.equal(n.mine.state.greyshore[2].s, MINE.line.old);
  assert.equal(R.levelOf(n.trades.dig.xp).level, LEGACY.rest);
  assert.equal(h.record.depth, 4); assert.equal(Mine.depthOf(n), 4);
  // a line that never opened the trapdoor: nothing of the mine, and its heir's trades as before
  const none = { ...old, mine: undefined }; delete none.mine; const h2 = Leg.handOn(none, [], NOW + D);
  assert.ok(!h2.save.mine && !h2.save.trades.dig); assert.equal(h2.record.depth, 0);
});
