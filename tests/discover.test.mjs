// Milestone 31: patterns found by trying, by studying an old piece, and by what customers ask for.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as Disc from '../js/discover.js';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import { PATTERNS, GEAR, MATS } from '../js/data.js';
import { ART } from '../js/card.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const xpFor = level => { let xp = 0; while (R.levelOf(xp).level < level) xp++; return xp; };
const shop = (o = {}) => ({ coins: 500, renown: 0, maker: 'T', cards: [], shelf: [], slots: 4, ledger: [], queue: [], found: ['ember'], staff: [],
  mats: { iron: 5, steel: 3, ash: 3, rowan: 2, oak: 2, cord: 3, gut: 2, strap: 3, wrap: 3, horn: 2, yew: 2 }, trades: {}, ...o });
const HIDDEN = ['spear', 'mace', 'shortsword', 'warhammer'];

test('the forge\'s four: full patterns, hidden till found, with card art, gear slots and trades that gate them', () => {
  for (const id of HIDDEN) {
    const p = PATTERNS[id]; assert.ok(p.hidden && ART[p.art] && p.lore.length === 4 && GEAR.slots.weapon.includes(id), id);
    for (const m of Object.values(p.hidden.try).flat()) assert.ok(MATS[m], id + ': ' + m);
    for (const role of ['haft', 'binding']) for (const m of p.hidden.try[role]) assert.ok(R.partOptions(id).some(g => g.opts.some(o => o.mat === m)), id + ' takes ' + m + ' as a part');
    assert.ok(p.hidden.asks.length >= 2);
  }
  const s = shop();
  assert.ok(HIDDEN.every(id => !Sh.knows(s, id))); assert.ok(Sh.knows(s, 'dagger'));
  assert.deepEqual(Disc.toFind(s, 'forge').sort(), HIDDEN.slice().sort());
  // no two share a recipe: each full recipe finds only itself
  for (const a of HIDDEN) for (const b of HIDDEN) if (a !== b) {
    const t = PATTERNS[a].hidden.try, picks = { head: t.head[0], haft: t.haft[0], binding: t.binding[0] };
    assert.ok(!Disc.grade(b, picks).every(g => g === 'right'), a + ' vs ' + b);
  }
});

test('a try: nothing, then close with a clue for each choice, then not yet, then found', () => {
  const s = shop(), rng = seeded(1);
  const r0 = Disc.tryIt(s, 'forge', { head: 'iron', haft: 'cord', binding: 'oak' }, rng, 1);
  assert.equal(r0.result, 'nothing'); assert.equal(s.mats.iron, 4, 'the materials are spent'); assert.equal(s.mats.oak, 1);
  const again = Disc.tryIt(s, 'forge', { head: 'iron', haft: 'cord', binding: 'oak' }, rng, 2);
  assert.equal(again.result, 'tried'); assert.equal(s.mats.iron, 4, 'the same try twice: nothing spent');
  const r1 = Disc.tryIt(s, 'forge', { head: 'iron', haft: 'ash', binding: 'horn' }, rng, 3);
  assert.equal(r1.result, 'close'); assert.equal(r1.pattern, 'spear'); assert.equal(r1.clues.length, 3);
  assert.deepEqual(r1.clues.map(c => c.g), ['right', 'right', 'wrong']);
  assert.match(r1.clues[2].line, /lash the head on/);
  const r2 = Disc.tryIt(s, 'forge', { head: 'iron', haft: 'ash', binding: 'cord' }, rng, 4);
  assert.equal(r2.result, 'notyet'); assert.match(r2.gate.word, /daggers or axe heads, trade 3/); assert.equal(s.mats.ash, 2, 'not yet: nothing spent');
  s.trades.axe = { xp: xpFor(3) };
  const iron = s.mats.iron, r3 = Disc.tryIt(s, 'forge', { head: 'iron', haft: 'ash', binding: 'cord' }, rng, 5);
  assert.equal(r3.result, 'found'); assert.equal(r3.pattern, 'spear'); assert.ok(Sh.knows(s, 'spear'));
  assert.equal(s.mats.iron, iron - 1); assert.equal(s.cards[0].pattern, 'spear'); assert.equal(s.cards[0].tier, 'common'); assert.ok(s.renown > 0);
  assert.equal(Disc.tryIt(s, 'forge', { head: 'steel', haft: 'yew', binding: 'gut' }, rng, 6).result, 'known');
  assert.equal(Disc.bookOf(s).tries.filter(t => t.result !== 'tried').length, 3);
});

test('a near miss: the right family, not the right thing', () => {
  const s = shop({ trades: { dagger: { xp: xpFor(5) } } });
  const r = Disc.tryIt(s, 'forge', { head: 'iron', haft: 'horn', binding: 'wrap' }, seeded(2), 1);
  assert.equal(r.result, 'close'); assert.equal(r.pattern, 'shortsword'); assert.deepEqual(r.clues.map(c => c.g), ['near', 'right', 'right']);
  assert.match(r.clues[0].line, /steel/);
});

test('study: an old piece of a pattern you don\'t know, taken apart and learned; then it can be reworked', () => {
  const s = shop(), c = { ...R.makePiece({ patternId: 'mace', picks: [0, 0, 0], result: { tier: 0, flawed: false, worked: 5, strikes: 9, heats: 1, cracks: 0 }, maker: 'an old maker', rng: seeded(3), now: 1 }), id: 'old' };
  s.cards.push(c);
  assert.ok(Disc.canStudy(s, c)); assert.ok(!Sh.canRework(s, c), 'not reworked before it\'s known');
  assert.equal(Disc.study(s, 'old'), 'mace'); assert.ok(Sh.knows(s, 'mace')); assert.ok(!s.cards.includes(c));
  assert.ok(!Disc.canStudy(s, { ...c, id: 'x' }), 'known now: nothing to study');
  assert.ok(!Disc.canStudy(s, { ...c, pattern: 'dagger' }));
});

test('customers ask only for patterns still to find, and only what you know is wanted or ordered', () => {
  const s = shop({ town: null });
  let asked = 0;
  for (let i = 0; i < 400; i++) { s.queue = []; Sh.arrive(s, seeded(i), 1000 + i, true); const c = s.queue[0]; if (c && c.asks) { asked++; assert.ok(!Sh.knows(s, c.asks)); assert.equal(c.tell, Disc.bookOf(s).clues.find(x => x.line === c.tell).line); } }
  assert.ok(asked > 10 && asked < 120, 'now and then: ' + asked);
  assert.ok(Disc.bookOf(s).clues.length >= 4);
  for (let i = 0; i < 300; i++) { const c = Sh.richer(s, { type: 'guard', who: 'x', want: 'spear', purse: 100, mood: 'EAGER', least: 0 }, seeded(i)); assert.notEqual(c.want, 'spear', 'no one is left wanting a spear you can\'t make'); }
  Disc.bookOf(s).found = HIDDEN.slice();
  for (let i = 0; i < 50; i++) { s.queue = []; Sh.arrive(s, seeded(i), 1000 + i, true); assert.ok(!(s.queue[0] || {}).asks); }
});
