// Milestone 41: the Greyshore's nine Relics (docs/REGION-PLAN.md). Five from Saltby's families' great stories, four from below the
// drowned town, one for each of the coast's patterns. A blueprint travels with the line, so a piece can become another region's
// Relic; the region's own comes first. Hidden, as milestones 39 and 40 are.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import * as St from '../js/staff.js';
import * as Rg from '../js/region.js';
import { RELICS, PATTERNS, MATS, REGIONS, MYTHICS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const xpTo = lvl => { let x = 0; for (let l = 1; l < lvl; l++) x += R.xpToNext(l); return x; };
const make = (pattern, tier) => R.makePiece({ patternId: pattern, picks: [0, 0, 0], result: { tier, flawed: false, worked: 20, strikes: 20, heats: 2, cracks: 0, whiteHeat: true }, maker: 'T', rng: seeded(tier + 1), now: 1 });
const COAST = 'greyshore', G = REGIONS.greyshore;
const REACH11 = ['gatewarden', 'widowsband', 'hollowhelm', 'wolfmantle', 'roadwalkers', 'oskbow', 'abbeystaff', 'wennasdraught', 'brannocsalve', 'abbeylens', 'corrowgoblet'];
const shop = (o = {}) => ({ coins: 0, mats: {}, cards: [], shelf: [null, null], slots: 2, wall: [], ledger: [], queue: [], stations: ['stretcher', 'bowbench', 'kettle', 'glass'],
  trades: {}, blueprints: [], renown: 1300, found: ['ember'], ...o });
const coast = (o = {}) => shop({ region: COAST, ...o });

test('the coast\'s nine: one for each new pattern, the rest from the families\' great stories; relic materials; the Reach\'s eleven as they were', () => {
  const nine = Rg.relicsIn(COAST);
  assert.equal(nine.length, 9);
  assert.deepEqual(Rg.relicsIn('reach'), REACH11, 'the Reach\'s, in their order');
  for (const p of ['harpoon', 'oilskin', 'trident', 'pitch', 'spyglass']) assert.equal(nine.filter(k => RELICS[k].pattern === p).length, 1, p);
  const stations = new Set(nine.map(k => PATTERNS[RELICS[k].pattern].station || 'forge'));
  assert.equal(stations.size, 5, 'every station has one');
  for (const id of nine) {
    const r = RELICS[id];
    assert.ok(MATS[r.mat].relic && r.lore && r.power.length === 2, id);
    if (r.source === 'deep') continue;
    assert.ok(G.stories.some(s => s.after && s.fam === r.source && s.blueprint === id), id + ': a great story ends in it');
  }
  for (const s of G.stories.filter(x => x.blueprint)) assert.ok(RELICS[s.blueprint] && RELICS[s.blueprint].region === COAST, s.id);
  assert.equal(nine.filter(k => RELICS[k].source === 'deep').length, 4);
  // one per pattern in each region; names all different
  for (const id of ['reach', COAST]) { const ps = Rg.relicsIn(id).map(k => RELICS[k].pattern); assert.equal(new Set(ps).size, ps.length, id); }
  const names = Object.values(RELICS).map(r => r.name); assert.equal(new Set(names).size, names.length);
  // each region's Nine grow from that region's Relics (the Tide's: milestone 42)
  for (const m of Object.values(MYTHICS)) assert.equal(RELICS[m.relic].region, m.region, m.name + ': grows from its own region\'s Relic');
});

test('which Relic a piece can become: the region\'s own, or one whose blueprint came with the line', () => {
  const fal = 'falchion';
  assert.equal(Rg.relicOf(shop(), fal), 'gatewarden'); assert.equal(Rg.relicOf(coast(), fal), 'tidewarden');
  assert.equal(Rg.relicOf(coast({ blueprints: ['gatewarden'] }), fal), 'gatewarden', 'the Reach\'s blueprint, carried over the pass');
  assert.equal(Rg.relicOf(coast({ blueprints: ['gatewarden', 'tidewarden'] }), fal), 'tidewarden', 'the coast\'s first, on the coast');
  assert.equal(Rg.relicOf(shop({ blueprints: ['gatewarden', 'tidewarden'] }), fal), 'gatewarden', 'and the Reach\'s in the Reach');
  assert.equal(Rg.relicOf(shop({ blueprints: ['gatewarden', 'tidewarden'], relicsMade: ['gatewarden'] }), fal), 'tidewarden', 'one made, the other still to make');
  assert.equal(Rg.relicOf(shop({ blueprints: ['hobbsbarb'] }), 'harpoon'), 'hobbsbarb', 'a coastal Relic made in the Reach');
  assert.equal(Rg.relicOf(shop(), 'dagger'), undefined);
  // the working: an Old-Blood falchion on the coast, by a master
  const ob = make(fal, 3), master = { falchion: { xp: xpTo(9) } };
  const f = Sh.relicFor(coast({ cards: [ob], trades: master }), ob); assert.equal(f.relic, 'tidewarden'); assert.match(f.why.join(), /blueprint/);
  assert.ok(Sh.relicFor(coast({ cards: [ob], trades: master, blueprints: ['tidewarden'] }), ob).ok);
  assert.deepEqual(Sh.relicCost(ob, 'tidewarden').map(x => x.mat), [ob.metal, 'heartstone']);
  // the piece it becomes; a relic brew boils down to one bottle
  const barb = R.relicPiece(make('harpoon', 3), 'hobbsbarb'); assert.equal(barb.name, 'Hobb\'s Barb'); assert.deepEqual(barb.power, RELICS.hobbsbarb.power);
  const caulk = R.relicPiece({ ...make('pitch', 3), count: 3 }, 'blackcaulk'); assert.equal(caulk.count, 1);
});

test('below the drowned town: the coast\'s blueprints only; below the deep doors, the Reach\'s only', () => {
  const runner = { id: 'r', role: 'runner', name: 'Kit', trait: 'keen', xp: 0 };
  for (const [save, mine] of [[coast(), Rg.relicsIn(COAST)], [shop(), REACH11]]) {
    const got = new Set(), rng = seeded(7);
    for (let i = 0; i < 3000; i++) { const h = St.haul(save, runner, 'below', rng, 0); if (h.blueprint) got.add(h.blueprint); }
    assert.ok(got.size >= 5, [...got].join()); for (const b of got) assert.ok(mine.includes(b), b);
  }
  // all the coast's found or made: none left below
  const rng = seeded(3), full = coast({ blueprints: Rg.relicsIn(COAST) });
  for (let i = 0; i < 500; i++) assert.ok(!St.haul(full, runner, 'below', rng, 0).blueprint);
});

test('the families\' great stories now come in on the coast, and end in their blueprints', () => {
  const first = G.stories.filter(x => !x.after), great = G.stories.filter(x => x.after);
  const s = coast({ renown: 5000, stories: Object.fromEntries(first.map(x => [x.id, { step: 3, next: 0 }])) });
  const ready = Sh.storiesReady(s, 2e12).map(x => x.id);
  for (const st of great) assert.ok(ready.includes(st.id), st.id);
  const st = great.find(x => x.id === 'hobb2'), last = st.steps.length - 1, c = make('harpoon', 3);
  Object.assign(s, { cards: [c], stories: { ...s.stories, hobb2: { step: last, next: 0 } }, order: { who: st.who, pattern: 'harpoon', least: 3, metal: null, story: 'hobb2', step: last, pays: 1, due: 1e9 } });
  const e = Sh.deliver(s, c.id, 2e12); assert.equal(e.story.blueprint, 'hobbsbarb'); assert.deepEqual(s.blueprints, ['hobbsbarb']);
});

test('the Relic working on every coastal pattern: a two-station trident and a batch of pitch too', () => {
  for (const id of Rg.relicsIn(COAST)) {
    const pattern = RELICS[id].pattern, cfg = { patternId: pattern, picks: [0, 0, 0], level: 9, found: [], kit: {} };
    const S = R.newWorking({ ...cfg, rework: { from: 3, relic: id } }, seeded(1)); assert.equal(S.relic, id, id);
    S.shape = 100; S.whites = 2; S.whiteHeat = true;
    const res = R.finish(S, 'quench'); assert.equal(res.tier, 4, id); assert.ok(!res.failed, id);
    const base = make(pattern, 3), piece = R.relicPiece(R.remakePiece({ card: base, res, picked: null, rng: seeded(4), now: 2 }), id);
    assert.equal(piece.name, RELICS[id].name); assert.equal(piece.tier, 'relic', id);
    for (const card of [base, make(pattern, 2)]) for (const c of Sh.relicCost(card, id)) assert.ok(MATS[c.mat] && Number.isFinite(c.n) && c.n > 0, id + ': ' + c.mat + ' ' + c.n);
  }
});
