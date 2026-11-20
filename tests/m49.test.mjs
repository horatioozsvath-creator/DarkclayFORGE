// Milestone 49: the reveal, and marks (docs/JACKPOT-PLAN.md). Now and then a working's piece comes out with a mark in the metal,
// an affix can come out gilded at its very best, and the Collector buys only marked pieces.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../js/rules.js';
import * as Sh from '../js/shop.js';
import { decodeCard, encodeCard } from '../js/share.js';
import { MARKS, AFFIXES, RENOWN, CUSTOMERS } from '../js/data.js';

const queue = (...v) => { let i = 0; return () => (i < v.length ? v[i++] : 0.5); };
// a finished working at the forge, its dice given: the tier roll, then the mark's
function worked(patternId, rolls, o = {}) {
  const S = R.newWorking({ patternId, picks: [0, 0, 0], level: o.level || 3, found: [] }, () => 0.5);
  S.shape = 100; S.worked = 20; S.strikes = 20; S.cracks = o.cracks || 0; S.earned = !!o.earned;
  S.rng = queue(...rolls);
  return { S, res: R.finish(S, 'quench') };
}

test('a mark now and then: more for a clean working, fewer for a cracked one, more with the trade; never with the luck off', () => {
  const at = o => R.markOdds({ cracks: 0, earned: false, level: 3, ...o });
  assert.equal(at({}), MARKS.odds * MARKS.clean);
  assert.equal(at({ cracks: 1 }), MARKS.odds * MARKS.cracked);
  assert.equal(at({ cracks: 1, earned: true }), at({}), 'WHITE HEAT earned counts as clean');
  assert.ok(at({ level: 8 }) > at({}) && at({ level: 1 }) < at({}));
  assert.ok(Math.abs(1 / at({}) - 40) < 1, 'about one clean working in 40, one in 60 at the plain odds');
  // the dice: the tier roll (99: Common), then the mark's (0: a mark), then which (0.99: the rarest, Ember-hearted)
  const { res } = worked('falchion', [0.99, 0, 0.99]); assert.equal(res.tier, 0); assert.equal(res.mark, 'ember');
  assert.equal(worked('falchion', [0.99, 0.5]).res.mark, null);
  R.setLuck(false);
  try {
    let n = 0; const S = R.newWorking({ patternId: 'falchion', picks: [0, 0, 0], level: 3, found: [] }, () => 0.5); S.shape = 100; S.rng = () => { n++; return 0; };
    assert.equal(R.finish(S, 'quench').mark, null); assert.equal(n, 1, 'no dice thrown for a mark');
  } finally { R.setLuck(true); }
  // a bottle-maker's working, or a mine's, never comes out marked
  assert.equal(worked('smelt', [0.99, 0, 0]).res.mark, null);
});

test('what a mark does: its worth; Starfall brings an affix to its best, Ghost-tempered adds Hallowed; its name at each station', () => {
  const make = (mark, tier = 2) => R.makePiece({ patternId: 'falchion', picks: [0, 0, 0], result: { tier, worked: 20, strikes: 20, heats: 1, cracks: 0, mark }, picked: null, maker: 'Hand', rng: () => 0.3, now: 1 });
  const plain = make(null), ember = make('ember'), star = make('starfall'), ghost = make('ghost');
  assert.equal(ember.worth, Math.round(plain.worth * 3)); assert.equal(make('veined').worth, plain.worth * 2);
  assert.ok(!plain.gilded); assert.equal(star.gilded.length, 1);
  const a = star.affixes.find(x => x[0] === star.gilded[0]), id = Object.keys(AFFIXES).find(k => AFFIXES[k].word === a[0]);
  assert.ok(a[1].includes(String(AFFIXES[id].max)), 'at its very best');
  assert.ok(ghost.affixes.some(x => x[0] === 'Hallowed'));
  if (plain.affixes.some(x => x[0] === 'Hallowed')) assert.ok(ghost.gilded.includes('Hallowed'), 'had it already: at its best');
  else assert.equal(ghost.affixes.length, plain.affixes.length + 1, 'over the tier\'s count');
  const ghost2 = R.makePiece({ patternId: 'falchion', picks: [0, 0, 0], result: { tier: 2, worked: 20, strikes: 20, heats: 1, cracks: 0, mark: 'ghost' }, picked: null, maker: 'Hand', rng: () => 0.9, now: 1 });
  assert.ok(ghost2.affixes.some(x => x[0] === 'Hallowed') && ghost2.giftGiven);
  assert.equal(R.markName('ember', 'falchion'), 'Ember-hearted'); assert.equal(R.markName('ember', 'jerkin'), 'Ember-warm'); assert.equal(R.markName('veined', 'shortbow'), 'Dark-grained');
});

test('gilded: an affix at its very best now and then; three on one piece, FLAWLESS, worth twice', () => {
  const g = R.rollAffixes('falchion', 3, () => 0.99); assert.ok(g.every(a => a[3]));
  const make = rng => R.makePiece({ patternId: 'falchion', picks: [0, 0, 0], result: { tier: 3, worked: 20, strikes: 20, heats: 1, cracks: 0 }, picked: null, maker: 'Hand', rng, now: 1 });
  const top = make(() => 0.99), mid = make(() => 0.5);
  assert.equal(top.gilded.length, 3); assert.ok(top.flawless); assert.ok(!mid.gilded && !mid.flawless);
  assert.equal(top.worth, mid.worth * MARKS.flawless);
  R.setLuck(false); try { assert.ok(!make(() => 0.99).gilded, 'never with the luck off'); } finally { R.setLuck(true); }
});

test('a mark stays through every rework, its gift given once; gilded affixes kept stay gilded', () => {
  const base = R.makePiece({ patternId: 'falchion', picks: [0, 0, 0], result: { tier: 0, worked: 20, strikes: 20, heats: 1, cracks: 0, mark: 'starfall' }, picked: null, maker: 'Hand', rng: () => 0.3, now: 1 });
  assert.ok(!base.giftGiven, 'a Common piece has no affix to bring to its best yet');
  const fine = R.remakePiece({ card: base, res: { tier: 1, worked: 5, strikes: 5, heats: 1, cracks: 0 }, picked: null, rng: () => 0.3, now: 2 });
  assert.equal(fine.mark, 'starfall'); assert.ok(fine.giftGiven); assert.equal(fine.gilded.length, 1);
  const rare = R.remakePiece({ card: fine, res: { tier: 2, worked: 5, strikes: 5, heats: 1, cracks: 0 }, picked: null, rng: () => 0.3, now: 3 });
  assert.equal(rare.mark, 'starfall'); assert.deepEqual(rare.gilded, fine.gilded, 'the gift isn\'t given twice; the gilded one kept');
  const ghost = R.makePiece({ patternId: 'falchion', picks: [0, 0, 0], result: { tier: 1, worked: 20, strikes: 20, heats: 1, cracks: 0, mark: 'ghost' }, picked: null, maker: 'Hand', rng: () => 0.3, now: 1 });
  const g2 = R.remakePiece({ card: ghost, res: { tier: 2, worked: 5, strikes: 5, heats: 1, cracks: 0 }, picked: null, rng: () => 0.7, now: 2 });
  assert.ok(g2.affixes.some(a => a[0] === 'Hallowed')); assert.equal(g2.affixes.filter(a => a[0] === 'Hallowed').length, 1);
  assert.equal(g2.affixes.length, 3, 'Rare\'s two, and Hallowed over them');
});

test('the Collector: from FAMED, once a mark has been made; only marked pieces, half again for them; remembers what they bought', () => {
  const cards = [], save = { coins: 0, cards, shelf: [null, null, null], renown: RENOWN[4].at, made: 10, stations: [], book: { found: [] } };
  const i = CUSTOMERS.findIndex(c => c.marks);
  assert.equal(Sh.customerWeights(save)[i], 0, 'no mark made yet');
  const marked = R.makePiece({ patternId: 'falchion', picks: [0, 0, 0], result: { tier: 1, worked: 20, strikes: 20, heats: 1, cracks: 0, mark: 'veined' }, picked: null, maker: 'Hand', rng: () => 0.3, now: 1 });
  const plain = R.makePiece({ patternId: 'dagger', picks: [0, 0, 0], result: { tier: 2, worked: 20, strikes: 20, heats: 1, cracks: 0 }, picked: null, maker: 'Hand', rng: () => 0.3, now: 2 });
  cards.push(marked, plain); assert.ok(Sh.noteMark(save, marked)); assert.ok(!Sh.noteMark(save, marked), 'once in the book');
  assert.deepEqual(Sh.marksMade(save), { forge: ['veined'] });
  assert.ok(Sh.customerWeights(save)[i] > 0);
  assert.equal(Sh.customerWeights({ ...save, renown: RENOWN[3].at })[i], 0, 'not before FAMED');
  R.setLuck(false); try { assert.equal(Sh.customerWeights(save)[i], 0); } finally { R.setLuck(true); }
  Sh.place(save, plain.id, 0); Sh.place(save, marked.id, 1);
  const c = { type: 'marks', who: 'the Collector', want: 'any', purse: 5000, mood: 'EAGER', least: 0, marks: true, askMark: 'veined' };
  assert.equal(Sh.purseFor(save, c, marked), Math.round(5000 * MARKS.collector.pays));
  const e = Sh.visit(save, () => 0, 1000, c);
  assert.equal(e.sold.id, marked.id, 'the marked piece, not the dearer plain one');
  assert.equal(save.collector[0].name, marked.name);
  assert.match(Sh.collectorTell(save, { askMark: 'ember' }), /Ember-hearted.*you sold me/);
  const none = Sh.visit(save, () => 0, 2000, { ...c }); assert.ok(!none.sold); assert.match(none.line, /Nothing marked/);
});

test('a marked card goes through a link with its mark and gilded affixes; nothing the game doesn\'t know', () => {
  const p = R.makePiece({ patternId: 'falchion', picks: [0, 0, 0], result: { tier: 3, worked: 20, strikes: 20, heats: 1, cracks: 0, mark: 'ember' }, picked: null, maker: 'Hand', rng: () => 0.99, now: 1 });
  const back = decodeCard(encodeCard(p));
  assert.equal(back.mark, 'ember'); assert.deepEqual(back.gilded, p.gilded); assert.equal(back.flawless, true);
  const bad = decodeCard(encodeCard({ ...p, mark: 'toString', gilded: ['Nonsense'], flawless: true }));
  assert.ok(bad && !bad.mark && !bad.gilded && !bad.flawless);
});
