// Milestone 54: Hearthold, the town of the High Snow (docs/NORTH-PLAN.md), hidden. A third region in the frame: its suppliers and
// materials, its customers, roads, dangers and mine (ice, not water: a fire clears it, for coal). The Reach and the coast as they were.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as Rg from '../js/region.js';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import * as St from '../js/staff.js';
import * as Mon from '../js/monsters.js';
import * as Run from '../js/runner.js';
import * as Mine from '../js/mine.js';
import * as Src from '../js/sources.js';
import * as G from '../js/growth.js';
import * as Leg from '../js/legacy.js';
import { REGIONS, MATS, PATTERNS, ROUTES, MONSTERS, MINE, RENOWN, FORGED_PARTS } from '../js/data.js';

const NOW = 2e12, DAY = 864e5, H = 36e5, NORTH = 'north', COAST = 'greyshore';
function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const shop = (o = {}) => ({ v: 1, uid: 'u-north', maker: 'T', coins: 5000, renown: 500, cards: [], shelf: [], slots: 4, ledger: [], queue: [], found: ['ember'], trades: {}, stations: [], mats: {}, staff: [], ...o });
const hold = (o = {}) => shop({ region: NORTH, ...o });
const coast = (o = {}) => shop({ region: COAST, ...o });
const sold = (save, mat) => { for (let h = 0; h < 48; h++) if (Sh.sells(mat, h, save)) return true; return false; };
const NEW = Object.keys(MATS).filter(k => MATS[k].north);

test('a third region, hidden: Hearthold in the High Snow; no heir goes there yet, and nothing else tells of it', () => {
  assert.equal(Rg.regionId(hold()), NORTH); assert.equal(Rg.townName(hold()), 'Hearthold'); assert.equal(Rg.nameOf(hold()), 'the High Snow');
  assert.equal(Rg.rungWord(hold(), 6), 'OF THE SNOW'); assert.ok(REGIONS.north.hidden);
  const old = shop({ renown: 5000, curve: 2, mythicsMade: Rg.mythicsIn('reach'), nineAt: NOW - DAY, staff: [{ id: 'a1', role: 'apprentice', name: 'Pip', trait: 'bright', xp: 0, hiredAt: NOW - 20 * DAY, skill: {} }] });
  assert.equal(Rg.regionId(Leg.handOn(old, [], NOW).save), 'reach', 'an heir stays in the Reach, as before');
  // where a thing is dug, in the Reach: not up in the snow, yet; up there, Aud's Delving
  assert.ok(!Src.sourcesOf('ironstone').some(x => /Delving/.test(x.word)));
  assert.ok(Src.sourcesOf('ironstone', hold()).some(x => /Aud's Delving/.test(x.word)));
  for (const m of NEW) assert.ok(!Src.sourcesOf(m).some(x => x.kind === 'away'), m + ': the Reach isn\'t told it\'s sold up there');
});

test('the Hold Stores, the Furrier, the Woodcutters, the Caravan and the Snow Carrier: everything the Reach sells, and the snow\'s own', () => {
  for (const id of Object.keys(MATS).filter(k => !MATS[k].relic && !MATS[k].ore && !MATS[k].below)) {
    if (MATS[id].north) { assert.ok(sold(hold(), id) && !sold(shop(), id) && !sold(coast(), id), id + ': the snow\'s, sold only there'); continue; }
    if (sold(shop(), id)) assert.ok(sold(hold(), id), id + ' is sold up in the snow too');
  }
  const h = 1000;
  assert.ok(Sh.priceOf('iron', h, hold()) < Sh.priceOf('iron', h) && Sh.priceOf('steel', h, hold()) < Sh.priceOf('steel', h), 'iron and steel cheap in mining country');
  for (const w of ['ash', 'rowan', 'birch', 'oak', 'yew']) assert.ok(Rg.dearOf(hold(), w) > 1, w + ' is dear above the line');
  assert.ok(Sh.priceOf('oak', h, hold()) > Sh.priceOf('oak', h) && Sh.priceOf('yew', h, hold()) > Sh.priceOf('yew', h));
  assert.equal(Rg.dearOf(hold(), 'yew'), 1.5); assert.equal(Rg.dearOf(hold(), 'linen'), 1.5); assert.equal(Rg.dearOf(hold(), 'blacksand'), 1.5);
  const s = hold({ coins: 100 }); assert.ok(Sh.buy(s, 'elkhide', 2, h) && s.mats.elkhide === 2); assert.ok(!Sh.buy(shop({ coins: 100 }), 'elkhide', 1, h));
  assert.match(Rg.suppliers(hold()).find(x => x.id === 'pack').name, /Caravan/);
});

test('the snow\'s materials fit the patterns, after the coast\'s, so no pick moves; each region\'s screens offer only what\'s sold there', () => {
  const placed = new Set();
  for (const id of Object.keys(PATTERNS)) {
    const all = R.partOptions(id), reach = R.partOptions(id, shop()), there = R.partOptions(id, coast()), up = R.partOptions(id, hold());
    all.forEach((g, i) => {
      g.opts.forEach((o, k) => { const m = o.mat || o.id; if (MATS[m] && MATS[m].north) { placed.add(m); assert.ok(g.opts.slice(k).every(x => (MATS[x.mat || x.id] || {}).north), id + ': ' + m + ' comes last'); } });
      assert.ok(!reach[i].opts.some(o => (MATS[o.mat || o.id] || {}).north) && !there[i].opts.some(o => (MATS[o.mat || o.id] || {}).north), id + ': not offered below');
      // up in the snow every pick keeps its place: the coast's between are only marked away
      up[i].opts.forEach((o, k) => assert.equal(o.name, g.opts[k].name, id));
      up[i].opts.filter(o => o.away).forEach(o => assert.ok(!sold(hold(), o.mat || o.id), id + ': ' + o.name + ' is away up there'));
      assert.ok(!up[i].opts.some(o => (MATS[o.mat || o.id] || {}).north && o.away), id + ': the snow\'s own offered there');
    });
  }
  for (const m of NEW.filter(k => k !== 'coal')) assert.ok(placed.has(m), m + ' fits a part');
  assert.ok(!R.partOptions('falchion', shop()).some(g => g.opts.some(o => o.away)), 'the Reach\'s screens as they were');
  const held = R.partOptions('jerkin', shop({ mats: { elkhide: 2 } }))[0].opts.map(o => o.id); assert.ok(held.includes('elkhide'), 'held, it\'s offered anywhere');
});

test('every pattern can be made up in the snow: each part has something sold there (or a part forged from it)', () => {
  const can = m => !m || sold(hold(), m) || (FORGED_PARTS[m] && Object.keys(FORGED_PARTS[m].from).every(x => sold(hold(), x)));
  for (const id of Object.keys(PATTERNS).filter(k => !PATTERNS[k].makes && Rg.findsHere(hold(), k)))
    R.partOptions(id, hold()).forEach(g => assert.ok(g.opts.some(o => !o.away && !o.rare && (o.level || 1) <= 4 && can(o.mat || o.id)), id + ': ' + g.part));
  // the coast's own patterns are found only on the coast
  for (const id of Object.keys(PATTERNS).filter(k => PATTERNS[k].coast)) { assert.ok(!Rg.findsHere(hold(), id) && Rg.findsHere(coast(), id) && !Rg.findsHere(shop(), id), id); }
});

test('who comes in: herders, hunters, the hold\'s guard, miners, pilgrims and thanes; more furs and lanterns, fewer longbows and panes', () => {
  const c = Object.fromEntries(Rg.customers(hold()).map(x => [x.id, x]));
  assert.ok(c.folk.names.includes('a herder') && c.delver.names.some(n => /miner/.test(n)) && c.factor.names.some(n => /pilgrim/.test(n)) && c.steward.names.includes('a thane'));
  const all = Rg.customers(hold()).flatMap(x => x.wants);
  assert.ok(!all.includes('longbow') && !all.includes('pane'));
  assert.ok(all.filter(w => w === 'lantern').length >= 4 && all.filter(w => w === 'cloak' || w === 'hood').length >= 6);
  for (const x of Rg.customers(hold())) assert.deepEqual(x.purse, Rg.customers(shop()).find(y => y.id === x.id).purse, x.id + ': the same purse ladder');
});

test('the roads: the high pasture, the herders\' camps, the glacier, the old halls; the snow\'s finds, and never the snow\'s below', () => {
  const r = Rg.routes(hold());
  for (const k of Object.keys(ROUTES)) { assert.equal(r[k].h, ROUTES[k].h); assert.equal(r[k].fee, ROUTES[k].fee); }
  assert.match(r.yard.name, /high pasture/); assert.match(r.reach.name, /glacier/); assert.match(r.deep.name, /old halls/); assert.equal(r.below.rung, 5);
  const p = { id: 'r1', role: 'runner', name: 'Pell', xp: 0 }, found = { reach: new Set(), coast: new Set(), north: new Set() };
  for (let i = 0; i < 300; i++) for (const [k, s] of [['reach', shop], ['coast', coast], ['north', hold]])
    Object.keys(St.haul(s({ staff: [p] }), p, 'deep', seeded(i), NOW).mats).forEach(m => found[k].add(m));
  assert.ok(![...found.reach, ...found.coast].some(m => MATS[m].north), 'nothing of the snow found below it');
  assert.ok(![...found.north].some(m => MATS[m].coast && !Rg.soldIn(NORTH, m)), 'nor the coast\'s up there, but what the caravan carries');
  for (const m of ['elkhide', 'antler', 'bearfat', 'whitebear', 'iceamber', 'frostiron', 'glacierglass']) assert.ok(found.north.has(m), m + ' found up in the snow');
  assert.ok(!Rg.raresIn('reach').some(m => MATS[m].north) && !Rg.raresIn(COAST).some(m => MATS[m].north));
});

test('the dangers: raiders from the passes; a white bear, the frozen dead (a lantern keeps them off), something from the old halls', () => {
  assert.ok(Rg.gangs(hold()).some(g => /Ice-Beard/.test(g[0])));
  const m = { id: 'wight', region: NORTH, at: NOW }, k = Mon.kindOf(m);
  assert.match(k.name, /frozen dead/); assert.ok(k.order.some(o => o.any.includes('lantern')), 'the hold\'s guard asks for lanterns');
  assert.deepEqual(Mon.kindOf({ id: 'wight', at: NOW }).order, MONSTERS.kinds.wight.order, 'the Reach\'s as they were');
  assert.equal(Mon.huntKind(hold({ monster: { id: 'wolves', region: NORTH } })).mat, 'whitebear');
  // the bane: a lantern against the frozen dead, as silver against the grave-wight
  const lamp = { id: 'l1', pattern: 'lantern', tier: 'fine' }, silverBlade = { id: 'w1', pattern: 'falchion', metal: 'silver', tier: 'common' }, ironBlade = { ...silverBlade, id: 'w2', metal: 'iron' };
  const odds = (save, gear) => Run.beastOdds(save, { id: 'r1', role: 'runner', name: 'Pell', xp: 0, gear });
  const up = hold({ monster: { id: 'wight', region: NORTH } }), down = shop({ monster: { id: 'wight' } });
  assert.ok(odds(up, { light: lamp }) > odds(up, {}), 'a lantern helps up there'); assert.equal(odds(up, { weapon: silverBlade }), odds(up, { weapon: ironBlade }), 'silver doesn\'t');
  assert.ok(odds(down, { weapon: silverBlade }) > odds(down, { weapon: ironBlade }), 'silver against the Reach\'s wight'); assert.equal(odds(down, { light: lamp }), odds(down, {}));
  assert.ok(Rg.eventsIn(NORTH).some(e => e.id === 'deepwinter' && e.gap > 1), 'deep winter: fewer customers');
});

test('Aud\'s Delving: the hold\'s own mine; the deep galleries freeze over and a fire clears them, for coal; the others as they were', () => {
  const s = hold({ renown: RENOWN[2].at, coins: 1e5, trades: { dig: { xp: 1e6 } } }); assert.ok(Mine.open(s, NOW).ok);
  assert.equal(Mine.digOf(s), 'delving'); assert.equal(Mine.nameOf(s), 'Aud\'s Delving'); assert.equal(Mine.galleryName(s, 3), 'The frozen level');
  assert.ok(Mine.seams(s).some(x => x.ore === 'coal' && x.open), 'coal near the top'); assert.ok(Mine.seams(s).some(x => x.ore === 'frostiron' && x.gallery === 4));
  assert.ok(PATTERNS.delving.mine && PATTERNS.delving.tradeAs === 'dig' && PATTERNS.delving.station === 'face');
  s.mine.galleries.north = 3; assert.ok(!Mine.iced(shop()) && !Mine.iced(coast()) && Mine.iced(s));
  // a frost day: the third gallery iced over (and the shallow ones not)
  let d = Math.floor(NOW / DAY); while (!Mine.floodsOn(NORTH, d)) d++;
  const t = d * DAY + 2 * H; s.at = t - 30 * DAY; s.mine.at = t - 30 * DAY;
  assert.ok(Mine.isFlooded(s, 3, t) && !Mine.isFlooded(s, 2, t)); assert.equal(Mine.shut(s, 3, t), 'it\'s iced over');
  assert.equal(Mine.drainsAt(s, t), d * DAY + MINE.ice.thawH * H, 'it thaws of itself');
  const coins = s.coins; assert.match(Mine.pump(s, 3, t).why, /coal/); s.mats.coal = 10;
  const r = Mine.pump(s, 3, t); assert.ok(r.ok && r.coal === MINE.ice.coal[3]); assert.equal(s.coins, coins, 'no coin'); assert.equal(s.mats.coal, 10 - MINE.ice.coal[3]);
  assert.ok(!Mine.isFlooded(s, 3, t) && Mine.shut(s, 3, t) === '');
  // the frost days aren't the Reach's rain or the coast's tides
  let same = 0; for (let x = 0; x < 400; x++) if (Mine.floodsOn(NORTH, x) === Mine.floodsOn('reach', x)) same++; assert.ok(same < 380);
  assert.ok(Src.sourcesOf('coal', hold()).some(x => x.kind === 'dug') && Src.sourcesOf('coal', hold()).some(x => x.kind === 'sold'));
});

test('until the hold\'s own Nine (milestones 56–57), the Reach\'s stand in: a shop up there is no Maker of the Nine for having none', () => {
  assert.deepEqual(Rg.nineOf(hold()), Rg.mythicsIn('reach')); assert.deepEqual(Rg.relicsIn(NORTH), Rg.relicsIn('reach'));
  assert.ok(!G.isNine(hold())); assert.ok(G.isNine(hold({ mythicsMade: Rg.mythicsIn('reach') })));
  assert.ok(Rg.mythicsIn(COAST).every(id => !Rg.mythicsIn('reach').includes(id)), 'the coast\'s own, as they were');
});
