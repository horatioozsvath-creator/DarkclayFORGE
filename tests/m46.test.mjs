// Milestone 46: going down (docs/MINE-PLAN.md). The third and fourth galleries, the shoring that wears and the roof that can come
// in, the water in the deep galleries, and the pockets a Rare haul breaks into down there.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../js/rules.js';
import * as Mine from '../js/mine.js';
import * as Src from '../js/sources.js';
import { MATS, RENOWN, MINE, RELICS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const H = 3600000, D = 24 * H, NOW = 2e12;
const xpAt = lvl => { let x = 0; for (let l = 1; l < lvl; l++) x += R.xpToNext(l); return x; };
const shop = (o = {}) => ({ v: 1, coins: 10000, mats: { oak: 40 }, trades: { dig: { xp: xpAt(6) } }, renown: RENOWN[4].at, cards: [], ...o });
// a mine opened down to gallery n
function mine(n, o) { const s = shop(o); Mine.open(s, NOW); for (let g = 2; g <= n; g++) assert.ok(Mine.openGallery(s).ok, 'gallery ' + g); return s; }
const always = () => 0, never = () => 0.999;

test('the third and fourth galleries: trade 5 and SOUGHT, trade 6 and FAMED, coin and oak; each region names its own', () => {
  const s = mine(2, { trades: { dig: { xp: xpAt(4) } }, renown: RENOWN[2].at });
  assert.deepEqual(Mine.nextGallery(s).why, ['trade 5 in mining', 'a shop SOUGHT']);
  s.trades.dig.xp = xpAt(5); s.renown = RENOWN[3].at;
  assert.ok(Mine.openGallery(s).ok); assert.equal(Mine.galleries(s), 3); assert.equal(s.mats.oak, 40 - 4 - 8);
  assert.deepEqual(Mine.nextGallery(s).why, ['trade 6 in mining', 'a shop FAMED']);
  assert.equal(Mine.galleryName(s, 3), 'The darkclay seam'); assert.equal(Mine.galleryName(s, 4), 'The old workings');
  const c = shop({ region: 'greyshore' }); Mine.open(c, NOW);
  assert.equal(Mine.galleryName(c, 3), 'Under the harbour'); assert.equal(Mine.nextGallery(c).name, 'The second level');
  const deep = mine(4); assert.equal(Mine.nextGallery(deep).n, 5, 'the bottom next (milestone 48)'); assert.equal(Mine.galleries(deep), Mine.deepest() - 1);
});

test('the deep seams: darkclay ore to smelt, blackwater iron and starmetal a lump or two at a time; the coast\'s own', () => {
  const s = mine(4);
  assert.deepEqual(Mine.seams(s).slice(4, 8).map(x => [x.ore, x.gallery, x.level]), [['darkclayore', 3, 5], ['cobalt', 3, 5], ['blackwater', 4, 6], ['starmetal', 4, 6]]);
  assert.deepEqual([0, 1, 2].map(t => R.yieldOf('dig', t, [4]).n), [3, 4, 6]);
  assert.deepEqual([0, 1, 2].map(t => R.yieldOf('dig', t, [6]).n), [1, 2, 3]);
  assert.deepEqual([0, 1, 2].map(t => R.yieldOf('dig', t, [7]).n), [1, 1, 2]);
  assert.deepEqual([0, 1, 2].map(t => R.yieldOf('dig', t, [5]).n), [4, 6, 8], 'a seam with no haul of its own: the pattern\'s');
  assert.equal(R.yieldOf('smelt', 1, [3]).mat, 'darkclay'); assert.ok(MATS.darkclayore.ore);
  const c = mine(4, { region: 'greyshore' });
  assert.deepEqual(Mine.seams(c).slice(4, 8).map(x => x.ore), ['seasand', 'darkclayore', 'drownedsilver', 'starmetal']);
  const dry = [...Array(30).keys()].map(i => NOW + i * D).find(t => !Mine.isFlooded(s, 3, t));   // (2e12 is a wet day in the Reach)
  assert.ok(Mine.seams(s).filter(x => x.gallery <= 4).every(x => Mine.canDig(s, x.i, dry).ok));
  // where they come from
  assert.ok(Src.sourcesOf('blackwater').some(x => x.kind === 'dug' && /Gallery 4/.test(x.word)));
  assert.ok(Src.sourcesOf('darkclayore').some(x => x.kind === 'dug' && /Gallery 3/.test(x.word)));
  assert.ok(Src.sourcesOf('darkclay').some(x => x.kind === 'smelted'));
});

test('the shoring wears with each working, more for each rockfall (a swing too hot); worn, the roof can come in; fallen, the gallery\'s shut', () => {
  const s = mine(1);
  assert.equal(Mine.shoring(s, 1), 100);
  let r = Mine.afterDig(s, 1, 0, never, NOW); assert.deepEqual(r, { s: 96, worn: false, fell: false });
  r = Mine.afterDig(s, 1, 2, never, NOW); assert.equal(r.s, 96 - MINE.shore.per - 2 * MINE.shore.perFall);
  // down to worn: a warning the once
  Mine.stateOf(s, 1).s = 33; r = Mine.afterDig(s, 1, 0, never, NOW); assert.ok(r.worn && !r.fell);
  r = Mine.afterDig(s, 1, 0, never, NOW); assert.ok(!r.worn && !r.fell, 'luck held');
  r = Mine.afterDig(s, 1, 0, always, NOW); assert.ok(r.fell, 'worn, the roof can come in');
  assert.ok(Mine.isFallen(s, 1)); assert.match(Mine.canDig(s, 0, NOW).why, /fallen/);
  // with timbers left above worn, it never falls
  const t = mine(1); Mine.afterDig(t, 1, 0, always, NOW); assert.ok(!Mine.isFallen(t, 1));
  // none left: it falls, luck or no
  const u = mine(1); Mine.stateOf(u, 1).s = 3; assert.ok(Mine.afterDig(u, 1, 0, never, NOW).fell);
  // a gentler Reach, or the week of grace: no wear at all
  const g = mine(1, { gentle: true }); assert.equal(Mine.afterDig(g, 1, 3, always, NOW), null); assert.equal(Mine.shoring(g, 1), 100);
  const w = mine(1, { threatsFrom: NOW + D }); assert.equal(Mine.afterDig(w, 1, 0, always, NOW), null);
  // a rockfall is a swing too hot, counted at any trade (the strip's own cracks don't wear the timbers)
  const W = R.newWorking({ patternId: 'dig', picks: [0], level: 2, found: [], kit: {} }, seeded(2)); R.begin(W);
  W.meter = 95; R.strike(W); W.meter = 60; R.strike(W); assert.equal(W.spalls, 1);
});

test('shoring again: oak for what\'s worn; a fall takes the full oak and coin to clear', () => {
  const s = mine(3);
  assert.equal(Mine.shore(s, 3).why, 'it\'s shored as it is');
  Mine.stateOf(s, 3).s = 50; assert.deepEqual(Mine.shoreCost(s, 3), { oak: 3, coins: 0, clear: false });
  const oak = s.mats.oak; assert.ok(Mine.shore(s, 3).ok); assert.equal(s.mats.oak, oak - 3); assert.equal(Mine.shoring(s, 3), 100);
  Mine.stateOf(s, 3).s = 99; assert.equal(Mine.shoreCost(s, 3).oak, 1, 'at least a stave');
  const st = Mine.stateOf(s, 3); st.s = 0; st.fell = true;
  assert.deepEqual(Mine.shoreCost(s, 3), { oak: MINE.shore.oak[3], coins: MINE.shore.clear[3], clear: true });
  const c0 = s.coins; assert.ok(Mine.shore(s, 3).ok); assert.ok(!Mine.isFallen(s, 3)); assert.equal(s.coins, c0 - MINE.shore.clear[3]);
  const poor = mine(1, { coins: 0 }); poor.mats = {}; const p = Mine.stateOf(poor, 1); p.s = 0; p.fell = true;
  assert.equal(Mine.shore(poor, 1).why, '2 oak staves, 40 c');
  // each region's mine keeps its own timbers
  const c = mine(1, { region: 'greyshore' }); Mine.stateOf(c, 1).s = 10; c.region = 'reach'; assert.equal(Mine.shoring(c, 1), 100);
});

test('the water: the deep galleries flood after rain in the Reach, at the spring tides on the coast; it drains, or it\'s pumped', () => {
  // the same days for every shop; about the rain's odds of days in the Reach, two in every few on the coast
  const days = Array.from({ length: 2000 }, (_, i) => 20000 + i);
  const rain = days.filter(d => Mine.floodsOn('reach', d)).length / days.length;
  assert.ok(Math.abs(rain - MINE.water.rain) < 0.03, 'rain ' + rain);
  assert.ok(Math.abs(days.filter(d => Mine.floodsOn('greyshore', d)).length - 2000 / MINE.water.tides * 2) <= 2);
  const wet = days.find(d => Mine.floodsOn('reach', d) && !Mine.floodsOn('reach', d - 1) && !Mine.floodsOn('reach', d + 1) && !Mine.floodsOn('reach', d + 2));
  const s = mine(4), at = wet * D + 2 * H;
  assert.ok(!Mine.isFlooded(s, 2, at) && Mine.isFlooded(s, 3, at) && Mine.isFlooded(s, 4, at), 'only the deep galleries');
  assert.match(Mine.canDig(s, 4, at).why, /water/); assert.ok(Mine.canDig(s, 0, at).ok);
  assert.ok(!Mine.isFlooded(s, 3, wet * D + MINE.water.drainH * H + 1), 'it drains of itself');
  assert.ok(!Mine.isFlooded(s, 3, wet * D - 1), 'and not before the rain');
  const c0 = s.coins; assert.ok(Mine.pump(s, 3, at).ok); assert.equal(s.coins, c0 - MINE.water.pump[3]);
  assert.ok(!Mine.isFlooded(s, 3, at + H) && Mine.isFlooded(s, 4, at + H), 'pumped, gallery by gallery');
  assert.equal(Mine.pump(s, 3, at + H).why, 'it\'s dry');
  assert.ok(!Mine.isFlooded(mine(4, { gentle: true }), 3, at), 'a gentler Reach stays dry');
  // the coast: the tides
  const tide = days.find(d => Mine.floodsOn('greyshore', d)), c = mine(3, { region: 'greyshore' });
  assert.ok(Mine.isFlooded(c, 3, tide * D + H));
});

test('pockets: a Rare haul from a deep gallery: old coin, an old piece, or (the old workings) a blueprint still to be found below', () => {
  const s = mine(4);
  assert.equal(Mine.pocket(s, 2, 2, always, NOW), null, 'not in the upper galleries');
  assert.equal(Mine.pocket(s, 3, 1, always, NOW), null, 'only a Rare haul');
  assert.equal(Mine.pocket(s, 3, 2, never, NOW), null, 'and not every time');
  // the third gallery never gives a blueprint
  const seen = { coins: 0, piece: 0, blueprint: 0 }, rng = seeded(4);
  for (let i = 0; i < 400; i++) { const k = Mine.pocket(s, 3, 2, rng, NOW); if (k) seen[Object.keys(k)[0]]++; }
  assert.ok(seen.coins > 50 && seen.piece > 50 && !seen.blueprint, JSON.stringify(seen));
  assert.equal(s.cards.length, seen.piece); assert.ok(s.cards.every(c => c.maker === 'an old maker' && ['common', 'fine'].includes(c.tier)));
  // the fourth: a blueprint now and then, only one found below the deep doors, and none twice
  const d = mine(4); let bps = 0; const r2 = seeded(5);
  for (let i = 0; i < 400; i++) { const k = Mine.pocket(d, 4, 2, r2, NOW); if (k && k.blueprint) bps++; }
  assert.ok(bps > 0); assert.equal(new Set(d.blueprints).size, d.blueprints.length);
  assert.ok(d.blueprints.every(b => RELICS[b].source === 'deep' && !RELICS[b].region));
});

test('a release-70 save\'s smelting pick still means calamine, once', () => {
  const s = { picks: { smelt: [3] } }; Mine.fixSave(s); assert.deepEqual(s.picks.smelt, [4]);
  s.picks.smelt = [3]; Mine.fixSave(s); assert.deepEqual(s.picks.smelt, [3], 'darkclay ore, picked since');
  const n = { picks: {} }; Mine.fixSave(n); assert.ok(n.smelt46);
});
