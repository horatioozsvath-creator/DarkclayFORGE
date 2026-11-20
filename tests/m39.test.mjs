// Milestone 39: the region frame and Saltby, the town on the Greyshore (docs/REGION-PLAN.md). A save works in one region (none is the
// Reach, exactly as before); the coast has its own suppliers and materials, customers, sellers, roads, finds, gangs, monsters, board,
// seasons and news. Hidden: nothing in the game sends a save over the pass yet (milestone 42).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as Rg from '../js/region.js';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import * as St from '../js/staff.js';
import * as Town from '../js/town.js';
import * as Th from '../js/thieves.js';
import * as Mon from '../js/monsters.js';
import * as Src from '../js/sources.js';
import * as Br from '../js/branch.js';
import * as Leg from '../js/legacy.js';
import * as Liv from '../js/living.js';
import { REGIONS, MATS, SUPPLIERS, CUSTOMERS, ROUTES, TOWN_HOT, SEASONS, THIEVES, MONSTERS, PATTERNS, MYTHICS as ALL_MYTHICS } from '../js/data.js';
// the Reach's Nine (milestone 42: the coast's Nine of the Tide are in the same table, marked with their region)
const MYTHICS = Object.fromEntries(Object.entries(ALL_MYTHICS).filter(([, m]) => !m.region));

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const DAY = 86400000, NOW = 2e12, COAST = 'greyshore';
const shop = (o = {}) => ({ v: 1, uid: 'u-coast', maker: 'T', coins: 5000, renown: 500, cards: [], shelf: [], slots: 4, ledger: [], queue: [], found: ['ember'], trades: {}, stations: [], mats: {}, staff: [], ...o });
const coast = (o = {}) => shop({ region: COAST, ...o });
const sold = (save, mat) => { for (let h = 0; h < 48; h++) if (Sh.sells(mat, h, save)) return true; return false; };

test('a save with no region is in the Reach, reading the very same tables as before', () => {
  for (const s of [shop(), shop({ region: 'nowhere' }), undefined]) assert.equal(Rg.regionId(s), 'reach');
  assert.deepEqual(Rg.suppliers(shop()), SUPPLIERS); assert.deepEqual(Rg.customers(shop()), CUSTOMERS); assert.deepEqual(Rg.routes(shop()), ROUTES);
  assert.deepEqual(Rg.hotIn(), TOWN_HOT); assert.deepEqual(Rg.seasonsIn(), SEASONS); assert.deepEqual(Rg.gangs(shop()), THIEVES.gangs);
  assert.equal(Rg.rungWord(shop(), 6), 'OF THE REACH'); assert.equal(Rg.rungWord(coast(), 6), 'OF THE SHORE'); assert.equal(Rg.rungWord(coast(), 4), 'FAMED');
  assert.ok(!('region' in Town.townOn(20000)), 'the Reach\'s board is as it was');
  // hidden: a new heir and a fresh save are in the Reach
  const DAYMS = 86400000, old = shop({ region: COAST, renown: 5000, curve: 2, mythicsMade: Object.keys(MYTHICS), cards: [{ id: 'm1', name: 'M', tier: 'mythic', pattern: 'axe', worth: 1 }],
    staff: [{ id: 'a1', role: 'apprentice', name: 'Pip Hollis', trait: 'careful', hiredAt: NOW - 20 * DAYMS, skill: {} }] });
  assert.equal(Rg.regionId(Leg.handOn(old, 'm1', NOW).save), 'reach');
});

test('Saltby sells everything the Reach does, and the coast\'s own things; what comes over the pass is dearer', () => {
  for (const id of Object.keys(MATS).filter(k => !MATS[k].relic && !MATS[k].ore && !MATS[k].below && !MATS[k].north)) {   // (an ore is sold by no one: milestone 45; old bone, milestone 52; the High Snow's, milestone 54)
    if (MATS[id].coast) { assert.ok(sold(coast(), id) && !sold(shop(), id), id + ': the coast\'s, sold only there'); continue; }
    if (sold(shop(), id)) assert.ok(sold(coast(), id), id + ' is sold on the coast too');
  }
  const h = 1000; assert.equal(Sh.priceOf('darkclay', h, shop()), Sh.priceOf('darkclay', h));
  assert.ok(Sh.priceOf('darkclay', h, coast()) > Sh.priceOf('darkclay', h) && Sh.priceOf('oldyew', h, coast()) > Sh.priceOf('oldyew', h, shop()));
  assert.equal(Sh.priceOf('iron', h, coast()), Sh.priceOf('iron', h), 'the coast\'s own staples cost what they cost');
  const s = coast({ coins: 100 }); assert.ok(Sh.buy(s, 'sealskin', 2, h) && s.mats.sealskin === 2); assert.ok(!Sh.buy(shop({ coins: 100 }), 'sealskin', 1, h));
  // where it comes from: a coastal thing in the Reach is sold over the pass
  assert.deepEqual(Src.sourcesOf('sealskin', shop()).map(x => x.kind), ['away']); assert.ok(Src.sourcesOf('sealskin', coast()).some(x => x.kind === 'sold'));
});

test('the coast\'s materials fit the patterns there, last in each part, so no pick moves; the Reach\'s screens don\'t offer them', () => {
  const placed = new Set();
  for (const id of Object.keys(PATTERNS)) {
    const all = R.partOptions(id), here = R.partOptions(id, shop()), there = R.partOptions(id, coast());
    all.forEach((g, i) => {
      g.opts.forEach((o, k) => { const m = o.mat || o.id; if (MATS[m] && MATS[m].coast) { placed.add(m); assert.ok(g.opts.slice(k).every(x => MATS[x.mat || x.id] && (MATS[x.mat || x.id].coast || MATS[x.mat || x.id].north)), id + ': ' + m + ' comes last (but the High Snow\'s, milestone 54)'); } });
      assert.deepEqual(here[i].opts, g.opts.slice(0, here[i].opts.length), id + ': the Reach\'s are the first');
      assert.ok(!here[i].opts.some(o => (MATS[o.mat || o.id] || {}).coast), id); assert.equal(there[i].opts.length, g.opts.filter(o => !(MATS[o.mat || o.id] || {}).north).length, id + ': all of them on the coast (but the High Snow\'s)');
    });
  }
  for (const m of ['brass', 'sealskin', 'whalebone', 'sailcloth', 'kelpash', 'ambergris', 'pearl', 'coral', 'drownedsilver']) assert.ok(placed.has(m), m + ' fits a part');
  // a maker who carried some back over the pass can still use it
  assert.ok(R.partOptions('falchion', shop({ mats: { brass: 2 } }))[0].opts.some(o => o.id === 'brass'));
});

test('who comes in: the same kinds of buyer, in the coast\'s names and wants; who sells to you', () => {
  const kinds = Rg.customers(coast()); assert.deepEqual(kinds.map(c => c.id), CUSTOMERS.map(c => c.id));
  const names = new Set(kinds.flatMap(c => c.names)), rng = seeded(4);
  for (let i = 0; i < 200; i++) { const c = Sh.newCustomer(rng, coast()); assert.ok(names.has(c.who), c.who); }
  assert.ok(kinds.find(c => c.id === 'delver').names.some(n => /wreck|diver/.test(n)));
  const who = new Set(REGIONS.greyshore.sellers.map(s => s.who));
  for (let i = 0; i < 40; i++) { const c = Sh.newSeller(seeded(i), 5, 1, coast()); assert.ok(who.has(c.who)); if (c.offer.type === 'mats') assert.ok(REGIONS.greyshore.sellMats.concat(REGIONS.greyshore.sellRare).includes(c.offer.mat)); }
});

test('the runner\'s roads: the same roads in the coast\'s words; what they bring back is the coast\'s, and never the coast\'s in the Reach', () => {
  const rc = Rg.routes(coast());
  for (const k of Object.keys(ROUTES)) { assert.equal(rc[k].h, ROUTES[k].h); assert.equal(rc[k].fee, ROUTES[k].fee); }
  assert.match(rc.deep.name, /drowned town/); assert.match(rc.below.from, /below the drowned town/);
  const p = { id: 'r1', role: 'runner', name: 'Pell', xp: 0 }, inReach = new Set(), onCoast = new Set();
  for (let i = 0; i < 300; i++) {
    Object.keys(St.haul(shop({ staff: [p] }), p, 'deep', seeded(i), NOW).mats).forEach(m => inReach.add(m));
    Object.keys(St.haul(coast({ staff: [p] }), p, 'deep', seeded(i), NOW).mats).forEach(m => onCoast.add(m));
  }
  assert.ok(![...inReach].some(m => MATS[m].coast), 'no coastal thing found in the Reach');
  for (const m of ['sealskin', 'whalebone', 'sailcloth', 'pearl']) assert.ok(onCoast.has(m), m + ' found on the coast');
});

test('the town: Saltby\'s board, events and seasons; no star falls there; the second shop at the Landing keeps the Reach\'s', () => {
  const ids = new Set(REGIONS.greyshore.hot.map(h => h.id)), ev = new Set(REGIONS.greyshore.events.map(e => e.id));
  let events = 0;
  for (let d = 20000; d < 20400; d++) { const t = Town.townOn(d, 0, COAST); assert.equal(t.region, COAST); t.hot.forEach(h => assert.ok(ids.has(h)));
    if (t.event) { events++; assert.ok(ev.has(t.event)); assert.ok(Town.eventOf(t).name); } assert.ok(Town.notices(t).hot.length === 2); }
  assert.ok(events > 50);
  assert.equal(Town.seasonOf(20000, COAST).line, REGIONS.greyshore.seasons.find(s => s.id === Town.seasonOf(20000).id).line);
  const s = coast(); Town.refreshTown(s, 20000 * DAY); assert.equal(s.town.region, COAST);
  s.region = undefined; Town.refreshTown(s, 20000 * DAY); assert.ok(!s.town.region, 'a change of region redraws the board');
  const b = coast({ coins: 1e6, renown: 999 }); assert.ok(Br.buy(b).ok); const v = Br.viewOf(b);
  assert.equal(Rg.regionId(v), 'reach'); Town.refreshTown(v, 20000 * DAY); assert.ok(!b.branch.town.region && b.town === undefined);
  assert.ok(Liv.rumours(coast({ ledger: [] }), 20000 * DAY).length >= 1);
});

test('threats on the coast: its gangs, and the same three monsters in its words (a hunt brings back its own trophy)', () => {
  const names = new Set(REGIONS.greyshore.gangs.map(g => g[0]));
  let g = null; for (let i = 0; i < 400 && !g; i++) { const s = coast({ renown: 3000 }); g = Th.plan(s, NOW + i * DAY, seeded(i)) && s.gang; }
  assert.ok(g && names.has(g.name), g && g.name);
  let m = null, s = null; for (let i = 0; i < 400 && !m; i++) { s = coast({ renown: 3000 }); m = Mon.plan(s, NOW + i * DAY, seeded(i)); }
  assert.ok(m); assert.equal(m.region, COAST); assert.equal(Mon.kindOf(m).name, REGIONS.greyshore.monsters[m.id].name);
  assert.deepEqual(Mon.kindOf(m).order, MONSTERS.kinds[m.id].order, 'the Watch asks the same');
  assert.equal(Mon.huntKind(s).trophy, REGIONS.greyshore.hunts[m.id].trophy); assert.equal(Mon.huntKind(s).bounty, MONSTERS.hunt.kinds[m.id].bounty);
  const r = shop({ renown: 3000 }); let rm = null; for (let i = 0; i < 400 && !rm; i++) rm = Mon.plan(r, NOW + i * DAY, seeded(i));
  assert.ok(rm && !('region' in rm), 'no region on a Reach monster'); assert.deepEqual(Mon.kindOf(rm), MONSTERS.kinds[rm.id], 'the Reach\'s as they were');
});
