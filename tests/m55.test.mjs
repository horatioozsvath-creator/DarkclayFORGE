// Milestone 55: the hold's folk and finds (docs/NORTH-PLAN.md), hidden. Five patterns found only up in the snow (an ice axe, a fur
// hood, snowshoes, a warming draught, snow-goggles), made anywhere once found; Hearthold's six families, their ten stories and gifts;
// a generation on in the snow; the board in the hold's words. The Reach and the coast as they were.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import * as St from '../js/staff.js';
import * as Disc from '../js/discover.js';
import * as Rg from '../js/region.js';
import * as Rm from '../js/room.js';
import * as Run from '../js/runner.js';
import { dressingOf } from '../js/counter.js';
import { REGULARS as LOOKS } from '../js/folk.js';
import { ART } from '../js/card.js';
import { PATTERNS, MATS, METALS, TRY_ROLES, GEAR, REGIONS, FURNITURE, RELICS, STORIES } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const NOW = 2e12, NORTH = 'north', N = REGIONS.north, NEW = ['iceaxe', 'furhood', 'snowshoes', 'warming', 'goggles'];
const ALL_STATIONS = ['stretcher', 'bowbench', 'kettle', 'glass'];
const shop = (o = {}) => ({ v: 1, uid: 'u-hold', maker: 'T', coins: 5000, renown: 500, cards: [], shelf: [], slots: 4, ledger: [], queue: [], found: ['ember'], staff: [],
  trades: {}, stations: ALL_STATIONS.slice(), mats: {}, ...o });
const hold = (o = {}) => shop({ region: NORTH, ...o });
const coast = (o = {}) => shop({ region: 'greyshore', ...o });
const masterOf = ids => Object.fromEntries(ids.map(id => [id, { xp: 99999 }]));
const sold = (save, mat) => { for (let h = 0; h < 48; h++) if (Sh.sells(mat, h, save)) return true; return false; };

test('five patterns of the snow, one a station: art, lore, a gear slot where it fits, and a try only a thing of the snow completes', () => {
  assert.deepEqual(NEW.map(id => PATTERNS[id].station || 'forge'), ['forge', 'stretcher', 'bowbench', 'kettle', 'glass']);
  for (const id of NEW) {
    const p = PATTERNS[id], st = p.station || 'forge', opts = R.partOptions(id);
    assert.ok(p.north && p.hidden && ART[p.art] && p.lore.length === 4 && p.hidden.asks.length >= 2 && p.hidden.board && p.hidden.gate, id);
    TRY_ROLES[st].forEach((r, i) => p.hidden.try[r.id].forEach(m => {
      assert.ok(Disc.fitsRole(st, r.id, m), id + ': ' + m + ' fits ' + r.word); assert.ok(opts[i].opts.some(o => (o.mat || o.id) === m), id + ': ' + m + ' is an option');
    }));
    p.hidden.try[TRY_ROLES[st][0].id].forEach(m => assert.ok(METALS[m], id));
    assert.ok(Object.values(p.hidden.try).flat().some(m => MATS[m].north), id + ' needs something of the snow');
    // made anywhere: every first option is sold in the Reach
    opts.forEach(g => { const m = g.opts[0].mat || g.opts[0].id; if (m && MATS[m] && !MATS[m].forged) assert.ok(sold(shop(), m), id + ': ' + m + ' in the Reach'); });
  }
  for (const [id, slot] of [['iceaxe', 'weapon'], ['furhood', 'head'], ['snowshoes', 'feet']]) assert.equal(Run.slotOf({ pattern: id }), slot, id);
  assert.ok(Run.isPotion({ pattern: 'warming' }), 'a runner carries a warming draught as a potion');
  assert.equal(Run.slotOf({ pattern: 'goggles' }), null, 'goggles are for the customers, not a slot');
});

test('found only up in the snow: its tries, asks, clues and board; in the Reach and on the coast nothing of the snow is offered', () => {
  for (const id of NEW) {
    const st = PATTERNS[id].station || 'forge', picks = Object.fromEntries(Object.entries(PATTERNS[id].hidden.try).map(([k, v]) => [k, v[0]]));
    const mats = Object.fromEntries(Object.values(picks).map(m => [m, 2])), gate = masterOf(PATTERNS[id].hidden.gate.trades);
    const there = hold({ mats: { ...mats }, trades: gate });
    const r = Disc.tryIt(there, st, picks, seeded(1), NOW); assert.equal(r.result, 'found', id); assert.ok(Sh.knows(there, id));
    for (const below of [shop({ mats: { ...mats }, trades: gate }), coast({ mats: { ...mats }, trades: gate })]) {
      assert.ok(!Disc.toFind(below, st).includes(id), id);
      assert.notEqual(Disc.tryIt(below, st, picks, seeded(1), NOW).result, 'found', id); assert.ok(!Sh.knows(below, id));
    }
    assert.ok(Disc.toFind(hold(), st).includes(id), id);
    // once found, it's made in the Reach too, from the Reach's things
    const back = shop({ book: { found: [id], tries: [], clues: [] } }); assert.ok(Sh.knows(back, id) && R.partOptions(id, back).every(g => g.opts.length >= 1));
  }
  for (const s of [shop(), coast()]) {
    for (let d = 0; d < 300; d++) { const b = Disc.boardClue(s, d); assert.ok(!b || !PATTERNS[b.pattern].north); }
    for (let i = 0; i < 300; i++) { const a = Disc.askFor(s, seeded(i)); assert.ok(!a || !PATTERNS[a.pattern].north); }
  }
  const p = { id: 'r1', role: 'runner', name: 'Pell', xp: 0 };
  for (let i = 0; i < 400; i++) { const h = St.haul(shop({ staff: [p] }), p, 'deep', seeded(i), NOW); assert.ok(!h.piece || !PATTERNS[h.piece.pattern].north); }
  assert.ok(Rg.piecePatterns(hold()).includes('iceaxe') && !Rg.piecePatterns(hold()).includes('harpoon'));
  // the hold's customers ask for them
  const wants = Object.values(N.customers).flatMap(c => c.wants || []);
  for (const id of NEW) assert.ok(wants.includes(id), id + ' is wanted up there');
});

test('a warming draught keeps the cold out: the road\'s hurt a quarter less, and it\'s used up on the road', () => {
  const p = { id: 'r1', role: 'runner', name: 'Pell', xp: 0 }, s = hold({ renown: 5000, staff: [p] });
  const bare = Run.risk(s, p, 'below', NOW).hurt;
  Run.potionsOf(p).push({ pattern: 'warming', name: 'Warming draught', tier: 'common' });
  const warm = Run.risk(s, p, 'below', NOW).hurt;
  assert.ok(bare > 0); assert.ok(Math.abs(warm - bare * (1 - GEAR.warm)) < 1e-12, warm + ' vs ' + bare);
  const out = Run.road(s, p, 'below', () => 0.99, NOW); assert.ok(out.used.includes('Warming draught') && !Run.potionsOf(p).length);
});

test('the board speaks the hold\'s words for the Reach\'s hidden patterns', () => {
  const reachHidden = Object.keys(PATTERNS).filter(id => PATTERNS[id].hidden && Rg.homeOf(PATTERNS[id]) === 'reach');
  for (const id of reachHidden) assert.ok(N.boards[id] && N.boards[id] !== PATTERNS[id].hidden.board, id);
  for (let d = 0; d < 400; d++) { const b = Disc.boardClue(hold(), d); if (b) assert.ok(!/deep doors|delvers|far valley|carters|harbour|quay|boat/.test(b.line), b.line); }
  assert.equal(Rg.boardOf(shop(), 'spear'), PATTERNS.spear.hidden.board, 'the Reach\'s as it was');
});

test('Hearthold\'s six families: their orders, their clues, their looks at the counter', () => {
  const s = hold({ trades: masterOf(['falchion', 'dagger']), town: null }), who = new Set(N.regulars.map(r => r.who).concat(N.stories.map(x => x.who)));
  for (let i = 0; i < 200; i++) { s.order = null; s.stories = {}; Sh.postOrder(s, seeded(i), NOW); if (!s.order.relic && !s.order.mythic && !s.order.shard && !s.order.court) assert.ok(who.has(s.order.who), s.order.who); }
  assert.equal(N.regulars.length, 6);
  for (const r of N.regulars) for (const id of Object.keys(r.clues)) assert.ok(PATTERNS[id].hidden && Rg.findsHere(hold(), id), r.who + ': ' + id);
  for (const r of N.regulars.filter(r => r.who !== 'Leif Tarn, a goat-boy')) assert.ok(LOOKS.some(([re]) => re.test(r.who)), r.who);
  assert.ok(!LOOKS.some(([re]) => re.test('Leif Tarn, a goat-boy')));
  for (const k of Object.keys(N.folkOf)) assert.ok(N.lineFolk[N.folkOf[k]], k);
  // the Reach's and the coast's regulars, as they were
  const r = shop({ trades: masterOf(['falchion', 'dagger']) }); Sh.postOrder(r, seeded(3), NOW); assert.ok(!N.regulars.some(x => x.who === r.order.who));
  const c = coast({ trades: masterOf(['falchion', 'dagger']) }); Sh.postOrder(c, seeded(3), NOW); assert.ok(!N.regulars.some(x => x.who === c.order.who));
});

test('ten stories: five first ones leave a gift (the Reach\'s gifts\' looks, in the hold\'s words); the five great ones wait for the hold\'s Relics', () => {
  const first = N.stories.filter(x => !x.after), great = N.stories.filter(x => x.after);
  assert.equal(first.length, 5); assert.equal(great.length, 5);
  for (const st of first) { const f = FURNITURE[st.gift]; assert.ok(f && f.gift && FURNITURE[f.look] && FURNITURE[f.look].model === f.model, st.id); }
  for (const st of great) { assert.ok(st.blueprint && N.stories.some(x => x.id === st.after), st.id); assert.equal(st.steps.length, 5); }
  for (const st of N.stories) for (const step of st.steps) for (const id of step.patterns) assert.ok(PATTERNS[id], st.id + ': ' + id);
  // a whole first story told, up in the snow: its gift goes up
  const s = hold({ room: Rm.defaultShop(), trades: masterOf(['ring', 'dagger', 'lantern', 'furhood']), book: { found: ['lantern', 'furhood'], tries: [], clues: [] } });
  const st = N.stories.find(x => x.id === 'vik');
  st.steps.forEach((step, i) => {
    s.stories = { ...(s.stories || {}), vik: { step: i, next: 0 } };
    const card = R.makePiece({ patternId: step.patterns[0], picks: [step.metal ? R.partOptions(step.patterns[0])[0].opts.findIndex(o => o.id === step.metal) : 0, 0, 0],
      result: { tier: Math.max(step.least, 0), worked: 30, strikes: 20, heats: 2, cracks: 0 }, maker: 'T', rng: seeded(i), now: NOW });
    card.tier = ['common', 'fine', 'rare'][step.least]; s.cards.push(card);
    s.order = { who: st.who, pattern: step.patterns[0], least: step.least, metal: step.metal || null, story: 'vik', step: i, pays: 10 };
    const e = Sh.deliver(s, card.id, NOW); assert.ok(e, 'step ' + i); if (i === 2) assert.equal(e.story.gift, 'vikslamps');
  });
  assert.ok(s.room.items.some(it => it.kind === 'vikslamps')); assert.ok(dressingOf(s, NOW).over.includes('kettycandles'), 'drawn as Ketty\'s candles');
  // the great stories end in blueprints of the hold's Relics, which come in milestone 56: until then they don't come
  for (const st of great) assert.ok(!RELICS[st.blueprint], st.id);
  const late = hold({ renown: 99999, trades: masterOf(Object.keys(PATTERNS)), book: { found: Object.keys(PATTERNS), tries: [], clues: [] },
    stories: Object.fromEntries(first.map(x => [x.id, { step: x.steps.length, next: 0 }])) });
  assert.ok(!Sh.storiesReady(late, NOW).some(x => x.after), 'no great story yet');
  assert.deepEqual(Sh.storiesOf(shop()).map(x => x.id), STORIES.map(x => x.id), 'the Reach\'s stories as they were');
});

test('a generation on in the snow: the families\' grandchildren, counted by the generations that worked up there', () => {
  const first = hold({ gen: 2, line: [{ maker: 'A', region: undefined }] });
  assert.equal(Rg.localGen(first), 1, 'the first to climb is the hold\'s first');
  assert.equal(Sh.regularOf(first, N.regulars[0]).who, N.regulars[0].who, 'meets the founders');
  const next = hold({ gen: 3, lineOf: 'Old Hand', line: [{ maker: 'A' }, { maker: 'B', region: 'greyshore' }, { maker: 'C', region: NORTH }] });
  assert.equal(Rg.localGen(next), 2, 'only the generations up here count');
  const g = Sh.regularOf(next, N.regulars[0]); assert.equal(g.fam, 'stenhus'); assert.match(g.who, /^\w+ Stenhus, of the hold's guard$/);
  const st = N.stories.find(x => x.id === 'fellsson'); assert.match(Sh.storyWho(next, st), /^\w+ Fellsson, a herder$/);
  assert.equal(Sh.storyStep(next, st, 0).line, st.steps[0].line, 'they ask what their grandparents asked');
  assert.ok(LOOKS.some(([re]) => re.test(g.who)), 'and keep the family\'s look');
});
