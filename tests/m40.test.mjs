// Milestone 40: the Greyshore's folk and finds (docs/REGION-PLAN.md). Five patterns found only on the coast (a harpoon, an oilskin,
// a trident, pitch-proofing, a spyglass), made anywhere once found; Saltby's six families, their ten stories and gifts; a coastal
// generation on, their grandchildren; the board in the coast's words; the shop's look. Hidden, as milestone 39 is.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import * as St from '../js/staff.js';
import * as Disc from '../js/discover.js';
import * as Rg from '../js/region.js';
import * as Rm from '../js/room.js';
import { dressingOf } from '../js/counter.js';
import { REGULARS as LOOKS } from '../js/folk.js';
import { ART } from '../js/card.js';
import { PATTERNS, MATS, METALS, TRY_ROLES, GEAR, REGIONS, FURNITURE, RELICS, STORIES } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const NOW = 2e12, COAST = 'greyshore', G = REGIONS.greyshore, NEW = ['harpoon', 'oilskin', 'trident', 'pitch', 'spyglass'];
const ALL_STATIONS = ['stretcher', 'bowbench', 'kettle', 'glass'];
const shop = (o = {}) => ({ v: 1, uid: 'u-coast', maker: 'T', coins: 5000, renown: 500, cards: [], shelf: [], slots: 4, ledger: [], queue: [], found: ['ember'], staff: [],
  trades: {}, stations: ALL_STATIONS.slice(), mats: {}, ...o });
const coast = (o = {}) => shop({ region: COAST, ...o });
const masterOf = ids => Object.fromEntries(ids.map(id => [id, { xp: 99999 }]));
const sold = (save, mat) => { for (let h = 0; h < 48; h++) if (Sh.sells(mat, h, save)) return true; return false; };

test('five coastal patterns, one a station: art, lore, a gear slot where it fits, and a try that only a coastal thing completes', () => {
  assert.deepEqual(NEW.map(id => PATTERNS[id].station || 'forge'), ['forge', 'stretcher', 'bowbench', 'kettle', 'glass']);
  for (const id of NEW) {
    const p = PATTERNS[id], st = p.station || 'forge', opts = R.partOptions(id);
    assert.ok(p.coast && p.hidden && ART[p.art] && p.lore.length === 4 && p.hidden.asks.length >= 2 && p.hidden.board && p.hidden.gate, id);
    TRY_ROLES[st].forEach((r, i) => p.hidden.try[r.id].forEach(m => {
      assert.ok(Disc.fitsRole(st, r.id, m), id + ': ' + m + ' fits ' + r.word); assert.ok(opts[i].opts.some(o => (o.mat || o.id) === m), id + ': ' + m + ' is an option');
    }));
    p.hidden.try[TRY_ROLES[st][0].id].forEach(m => assert.ok(METALS[m], id));
    // found with a coastal thing (or a forged part only the coast's pattern takes)
    const things = Object.values(p.hidden.try).flat();
    assert.ok(things.some(m => MATS[m].coast) || id === 'trident', id + ' needs something of the coast');
    // made anywhere: every first option is sold in the Reach
    opts.forEach(g => { const m = g.opts[0].mat || g.opts[0].id; if (m && MATS[m] && !MATS[m].forged) assert.ok(sold(shop(), m), id + ': ' + m + ' in the Reach'); });
  }
  for (const [id, slot] of [['harpoon', 'weapon'], ['trident', 'weapon'], ['oilskin', 'body']]) assert.ok(GEAR.slots[slot].includes(id));
});

test('found only on the coast: its tries, asks, clues and board; in the Reach nothing of the coast is offered', () => {
  for (const id of NEW) {
    const st = PATTERNS[id].station || 'forge', picks = Object.fromEntries(Object.entries(PATTERNS[id].hidden.try).map(([k, v]) => [k, v[0]]));
    const mats = Object.fromEntries(Object.values(picks).map(m => [m, 2])), gate = masterOf(PATTERNS[id].hidden.gate.trades);
    const there = coast({ mats: { ...mats }, trades: gate }), here = shop({ mats: { ...mats }, trades: gate });
    assert.equal(Disc.tryIt(there, st, picks, seeded(1), NOW).result, 'found', id); assert.ok(Sh.knows(there, id));
    assert.ok(!Disc.toFind(here, st).includes(id) && Disc.toFind(coast(), st).includes(id), id);
    const r = Disc.tryIt(here, st, picks, seeded(1), NOW); assert.notEqual(r.result, 'found', id); assert.ok(!Sh.knows(here, id));
    // once found, it's made in the Reach too, from the Reach's things
    const back = shop({ book: { found: [id], tries: [], clues: [] } }); assert.ok(Sh.knows(back, id) && R.partOptions(id, back).every(g => g.opts.length >= 1));
  }
  for (let d = 0; d < 300; d++) { const b = Disc.boardClue(shop(), d); assert.ok(!b || !PATTERNS[b.pattern].coast); }
  for (let i = 0; i < 300; i++) { const a = Disc.askFor(shop(), seeded(i)); assert.ok(!a || !PATTERNS[a.pattern].coast); }
  // a runner's old piece or a seller's: never of the coast's patterns in the Reach
  const p = { id: 'r1', role: 'runner', name: 'Pell', xp: 0 };
  for (let i = 0; i < 400; i++) { const h = St.haul(shop({ staff: [p] }), p, 'deep', seeded(i), NOW); assert.ok(!h.piece || !PATTERNS[h.piece.pattern].coast); }
  for (let i = 0; i < 300; i++) { const c = Sh.newSeller(seeded(i), 5, 1, shop()); assert.ok(c.offer.type !== 'piece' || !PATTERNS[c.offer.card.pattern].coast); }
  assert.ok(Rg.piecePatterns(coast()).includes('harpoon'));
});

test('the board speaks the coast\'s words for the Reach\'s hidden patterns too', () => {
  const reachHidden = Object.keys(PATTERNS).filter(id => PATTERNS[id].hidden && !PATTERNS[id].coast && !PATTERNS[id].north);   // (the High Snow's own carry theirs, milestone 55)
  for (const id of reachHidden) assert.ok(G.boards[id] && G.boards[id] !== PATTERNS[id].hidden.board, id);
  for (let d = 0; d < 400; d++) { const b = Disc.boardClue(coast(), d); if (b) assert.ok(!/deep doors|delvers|far valley|carters/.test(b.line), b.line); }
  assert.equal(Rg.boardOf(shop(), 'spear'), PATTERNS.spear.hidden.board, 'the Reach\'s as it was');
});

test('Saltby\'s six families: their orders, their clues, their looks at the counter', () => {
  const s = coast({ trades: masterOf(['falchion', 'dagger']), town: null }), who = new Set(G.regulars.map(r => r.who).concat(G.stories.map(x => x.who)));
  for (let i = 0; i < 200; i++) { s.order = null; s.stories = {}; const e = Sh.postOrder(s, seeded(i), NOW); if (!s.order.relic && !s.order.mythic && !s.order.shard && !s.order.court) assert.ok(who.has(s.order.who), s.order.who); }
  for (const r of G.regulars) for (const id of Object.keys(r.clues)) assert.ok(PATTERNS[id].hidden, r.who + ': ' + id);
  for (const r of G.regulars.filter(r => r.who !== 'Kit Rook, a ship\'s boy')) assert.ok(LOOKS.some(([re]) => re.test(r.who)), r.who);
  assert.ok(!LOOKS.some(([re]) => re.test('Ama Penhale\'s Garden')), 'a supplier is not a regular');
  // the Reach's regulars, as they were
  const r = shop({ trades: masterOf(['falchion', 'dagger']) }); Sh.postOrder(r, seeded(3), NOW); assert.ok(!G.regulars.some(x => x.who === r.order.who));
});

test('ten stories: five first ones leave a gift (the Reach\'s gifts\' looks, in the coast\'s words); the five great ones wait for the coast\'s Relics', () => {
  const first = G.stories.filter(x => !x.after), great = G.stories.filter(x => x.after);
  assert.equal(first.length, 5); assert.equal(great.length, 5);
  for (const st of first) { const f = FURNITURE[st.gift]; assert.ok(f && f.gift && FURNITURE[f.look] && FURNITURE[f.look].model === f.model, st.id); }
  for (const st of great) { assert.ok(st.blueprint && G.stories.some(x => x.id === st.after), st.id); assert.equal(st.steps.length, 5); }
  // a whole first story told, on the coast: its gift goes up
  const s = coast({ room: Rm.defaultShop(), trades: masterOf(['ring', 'dagger', 'oilskin', 'cloak']), book: { found: ['oilskin', 'cloak'], tries: [], clues: [] } });
  const st = G.stories.find(x => x.id === 'tregear');
  st.steps.forEach((step, i) => {
    s.stories = { ...(s.stories || {}), tregear: { step: i, next: 0 } };
    const card = R.makePiece({ patternId: step.patterns[0], picks: [step.metal ? R.partOptions(step.patterns[0])[0].opts.findIndex(o => o.id === step.metal) : 0, 0, 0],
      result: { tier: Math.max(step.least, 0), worked: 30, strikes: 20, heats: 2, cracks: 0 }, maker: 'T', rng: seeded(i), now: NOW });
    card.tier = ['common', 'fine', 'rare'][step.least]; s.cards.push(card);
    s.order = { who: st.who, pattern: step.patterns[0], least: step.least, metal: step.metal || null, story: 'tregear', step: i, pays: 10 };
    const e = Sh.deliver(s, card.id, NOW); assert.ok(e, 'step ' + i); if (i === 2) assert.equal(e.story.gift, 'widowlights');
  });
  assert.ok(s.room.items.some(it => it.kind === 'widowlights')); assert.ok(dressingOf(s, NOW).over.includes('kettycandles'), 'drawn as Ketty\'s candles');
  // the great stories end in the coast's Relics' blueprints (milestone 41: tests/m41.test.mjs)
  for (const st of great) assert.ok(RELICS[st.blueprint], st.id);
  assert.deepEqual(Sh.storiesOf(shop()).map(x => x.id), STORIES.map(x => x.id), 'the Reach\'s stories as they were');
});

test('a coastal generation on: the families\' grandchildren, counted by the generations that worked on the coast', () => {
  const first = coast({ gen: 2, line: [{ maker: 'A', region: undefined }] });
  assert.equal(Rg.localGen(first), 1, 'the first to cross is the coast\'s first');
  const r = Sh.regularOf(first, G.regulars[0]); assert.equal(r.who, G.regulars[0].who, 'meets the founders');
  const next = coast({ gen: 3, lineOf: 'Old Hand', line: [{ maker: 'A' }, { maker: 'B', region: COAST }] });
  assert.equal(Rg.localGen(next), 2);
  const g = Sh.regularOf(next, G.regulars[0]); assert.equal(g.who, 'Tegen Crane, of the harbour watch'); assert.equal(g.fam, 'crane');
  const st = G.stories.find(x => x.id === 'hobb'); assert.equal(Sh.storyWho(next, st), 'Davey Hobb, a skipper');
  assert.equal(Sh.storyStep(next, st, 0).line, st.steps[0].line, 'they ask what their grandparents asked');
  assert.ok(LOOKS.some(([re]) => re.test(g.who)), 'and keep the family\'s look');
  // the Reach counts as it did (milestone 38)
  assert.equal(Rg.localGen(shop({ gen: 3 })), 3);
});
