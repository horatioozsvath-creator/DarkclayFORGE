// Milestone 56: the High Snow's nine Relics (docs/NORTH-PLAN.md). Five from Hearthold's families' great stories, four from below the
// old halls, one for each of the hold's patterns. A blueprint travels with the line; the region's own comes first. Hidden until the
// climb (milestone 57); the Reach's Nine still stand in up there.
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
const NORTH = 'north', COAST = 'greyshore', N = REGIONS.north;
const REACH11 = ['gatewarden', 'widowsband', 'hollowhelm', 'wolfmantle', 'roadwalkers', 'oskbow', 'abbeystaff', 'wennasdraught', 'brannocsalve', 'abbeylens', 'corrowgoblet'];
const shop = (o = {}) => ({ coins: 0, mats: {}, cards: [], shelf: [null, null], slots: 2, wall: [], ledger: [], queue: [], stations: ['stretcher', 'bowbench', 'kettle', 'glass'],
  trades: {}, blueprints: [], renown: 1300, found: ['ember'], ...o });
const hold = (o = {}) => shop({ region: NORTH, ...o });
const coast = (o = {}) => shop({ region: COAST, ...o });

test('the hold\'s nine: one for each new pattern, the rest from the families\' great stories; relic materials; the others as they were', () => {
  const nine = Rg.relicsIn(NORTH);
  assert.equal(nine.length, 9);
  assert.deepEqual(Rg.relicsIn('reach'), REACH11, 'the Reach\'s, in their order'); assert.equal(Rg.relicsIn(COAST).length, 9);
  assert.ok(nine.every(k => !Rg.relicsIn(COAST).includes(k) && !REACH11.includes(k)));
  for (const p of ['iceaxe', 'furhood', 'snowshoes', 'warming', 'goggles']) assert.equal(nine.filter(k => RELICS[k].pattern === p).length, 1, p);
  assert.equal(new Set(nine.map(k => PATTERNS[RELICS[k].pattern].station || 'forge')).size, 5, 'every station has one');
  for (const id of nine) {
    const r = RELICS[id];
    assert.ok(MATS[r.mat].relic && r.lore && r.power.length === 2, id);
    assert.ok(N.bpWhere[r.source], id + ': where its blueprint is, in the hold\'s words');
    if (r.source === 'deep') continue;
    assert.ok(N.stories.some(s => s.after && s.fam === r.source && s.blueprint === id), id + ': a great story ends in it');
    // the great story's last step asks for the Relic's own pattern
    const st = N.stories.find(s => s.blueprint === id); assert.ok(st.steps[st.steps.length - 1].patterns.includes(r.pattern), id);
  }
  assert.equal(nine.filter(k => RELICS[k].source === 'deep').length, 4);
  const ps = nine.map(k => RELICS[k].pattern); assert.equal(new Set(ps).size, ps.length);
  const names = Object.values(RELICS).map(r => r.name); assert.equal(new Set(names).size, names.length);
  assert.match(Rg.bpWhere(hold(), 'deep', {}), /below the old halls/);
});

test('which Relic a piece can become up in the snow: the hold\'s own, or one whose blueprint came with the line', () => {
  assert.equal(Rg.relicOf(hold(), 'ring'), 'thanering'); assert.equal(Rg.relicOf(shop(), 'ring'), 'widowsband'); assert.equal(Rg.relicOf(coast(), 'ring'), 'drownedring');
  assert.equal(Rg.relicOf(hold({ blueprints: ['widowsband'] }), 'ring'), 'widowsband', 'the Reach\'s blueprint, carried up');
  assert.equal(Rg.relicOf(hold({ blueprints: ['widowsband', 'thanering'] }), 'ring'), 'thanering', 'the hold\'s first, up there');
  assert.equal(Rg.relicOf(shop({ blueprints: ['frostwarden'] }), 'iceaxe'), 'frostwarden', 'a Relic of the snow made in the Reach');
  // the Reach has no axe, lantern or shortbow Relic: there the hold's are offered only once their blueprint came with the line
  for (const p of ['axe', 'lantern', 'shortbow']) { assert.equal(Rg.relicOf(shop(), p), undefined, p); assert.equal(Rg.relicOf(coast(), p), undefined, p); }
  assert.equal(Rg.relicOf(shop({ blueprints: ['mootaxe'] }), 'axe'), 'mootaxe'); assert.equal(Rg.relicOf(shop({ relicsMade: ['mootaxe'] }), 'axe'), 'mootaxe');
  assert.equal(Sh.relicFor(shop({ trades: { axe: { xp: xpTo(9) } } }), make('axe', 3)).relic, null, 'no Relic working for a Reach axe');
  const ob = make('iceaxe', 3), master = { iceaxe: { xp: xpTo(9) } };
  const f = Sh.relicFor(hold({ cards: [ob], trades: master }), ob); assert.equal(f.relic, 'frostwarden'); assert.match(f.why.join(), /blueprint/);
  assert.ok(Sh.relicFor(hold({ cards: [ob], trades: master, blueprints: ['frostwarden'] }), ob).ok);
  const ember = R.relicPiece({ ...make('warming', 3), count: 3 }, 'bakkesember'); assert.equal(ember.count, 1); assert.equal(ember.name, 'The Keepers\' Ember');
});

test('below the old halls: the hold\'s blueprints only; below the deep doors and the drowned town, as before', () => {
  const runner = { id: 'r', role: 'runner', name: 'Kit', trait: 'keen', xp: 0 };
  for (const [save, mine] of [[hold(), Rg.relicsIn(NORTH)], [coast(), Rg.relicsIn(COAST)], [shop(), REACH11]]) {
    const got = new Set(), rng = seeded(7);
    for (let i = 0; i < 3000; i++) { const h = St.haul(save, runner, 'below', rng, 0); if (h.blueprint) got.add(h.blueprint); }
    assert.ok(got.size >= 5, [...got].join()); for (const b of got) assert.ok(mine.includes(b), b);
  }
  const rng = seeded(3), full = hold({ blueprints: Rg.relicsIn(NORTH) });
  for (let i = 0; i < 500; i++) assert.ok(!St.haul(full, runner, 'below', rng, 0).blueprint);
});

test('the families\' great stories come in up in the snow, and end in their blueprints', () => {
  const first = N.stories.filter(x => !x.after), great = N.stories.filter(x => x.after);
  const s = hold({ renown: 5000, book: { found: ['iceaxe', 'furhood', 'snowshoes', 'warming', 'goggles', 'lantern'], tries: [], clues: [] },
    stories: Object.fromEntries(first.map(x => [x.id, { step: 3, next: 0 }])) });
  const ready = Sh.storiesReady(s, 2e12).map(x => x.id);
  for (const st of great) assert.ok(ready.includes(st.id), st.id);
  const st = great.find(x => x.id === 'fellsson2'), last = st.steps.length - 1, c = make('snowshoes', 3);
  Object.assign(s, { cards: [c], stories: { ...s.stories, fellsson2: { step: last, next: 0 } }, order: { who: st.who, pattern: 'snowshoes', least: 3, metal: null, story: 'fellsson2', step: last, pays: 1, due: 1e9 } });
  const e = Sh.deliver(s, c.id, 2e12); assert.equal(e.story.blueprint, 'fellstride'); assert.deepEqual(s.blueprints, ['fellstride']);
});

test('the Relic working on every one of the hold\'s: a batch of warming draught and a lantern too', () => {
  for (const id of Rg.relicsIn(NORTH)) {
    const pattern = RELICS[id].pattern, cfg = { patternId: pattern, picks: [0, 0, 0], level: 9, found: [], kit: {} };
    const S = R.newWorking({ ...cfg, rework: { from: 3, relic: id } }, seeded(1)); assert.equal(S.relic, id, id);
    S.shape = 100; S.whites = 2; S.whiteHeat = true;
    const res = R.finish(S, 'quench'); assert.equal(res.tier, 4, id); assert.ok(!res.failed, id);
    const base = make(pattern, 3), piece = R.relicPiece(R.remakePiece({ card: base, res, picked: null, rng: seeded(4), now: 2 }), id);
    assert.equal(piece.name, RELICS[id].name); assert.equal(piece.tier, 'relic', id);
    for (const card of [base, make(pattern, 2)]) for (const c of Sh.relicCost(card, id)) assert.ok(MATS[c.mat] && Number.isFinite(c.n) && c.n > 0, id + ': ' + c.mat + ' ' + c.n);
  }
});

test('until the Nine of the Hearth (milestone 57), the Reach\'s Nine still stand in up there, and every Nine grows from its own region\'s Relics', () => {
  assert.deepEqual(Rg.nineOf(hold()), Rg.mythicsIn('reach'));
  for (const m of Object.values(MYTHICS)) assert.equal(RELICS[m.relic].region, m.region, m.name);
});
