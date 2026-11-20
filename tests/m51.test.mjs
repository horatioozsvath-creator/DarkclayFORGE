// Milestone 51: grown pieces (docs/JACKPOT-PLAN.md). Now and then a piece of gear comes out alive, and grows as the staff carry it.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../js/rules.js';
import * as Run from '../js/runner.js';
import * as Leg from '../js/legacy.js';
import { decodeCard, encodeCard } from '../js/share.js';
import { GROWN, MARKS } from '../js/data.js';

const queue = (...v) => { let i = 0; return () => (i < v.length ? v[i++] : 0.5); };
function worked(patternId, rolls, o = {}) {
  const S = R.newWorking({ patternId, picks: [0, 0, 0], level: o.level || 3, found: [] }, () => 0.5);
  S.shape = 100; S.worked = 20; S.strikes = 20; S.cracks = o.cracks || 0;
  S.rng = queue(...rolls);
  return R.finish(S, 'quench');
}
const piece = (tier, o = {}) => R.makePiece({ patternId: o.pattern || 'falchion', picks: [0, 0, 0], result: { tier, worked: 20, strikes: 20, heats: 1, cracks: 0, grown: true, ...(o.result || {}) },
  picked: null, maker: 'Hand', rng: o.rng || (() => 0.3), now: 1 });

test('a piece comes out alive now and then: only gear the staff carry, twice as often with a mark; never with the luck off', () => {
  // the dice: the tier (0.99, Common), the mark's (0.5: none), then the grown roll (0: alive)
  const r = worked('falchion', [0.99, 0.5, 0]); assert.equal(r.grown, true);
  assert.ok(!worked('falchion', [0.99, 0.5, 0.5]).grown);
  assert.ok(!worked('salve', [0.99, 0.5, 0]).grown, 'a brew never');
  assert.ok(!worked('pane', [0.99, 0.5, 0]).grown, 'a window glass never');
  assert.ok(!worked('smelt', [0.99, 0.5, 0]).grown, 'a bottle-maker\'s or the mine\'s never');
  const S = { cracks: 0, earned: false, level: 3 };
  assert.ok(Math.abs(R.growOdds(S, null) - GROWN.odds * MARKS.clean) < 1e-12);
  assert.equal(R.growOdds(S, 'veined'), R.growOdds(S, null) * GROWN.marked);
  R.setLuck(false);
  try {
    let n = 0; const W = R.newWorking({ patternId: 'falchion', picks: [0, 0, 0], level: 3, found: [] }, () => 0.5); W.shape = 100; W.rng = () => { n++; return 0; };
    assert.ok(!R.finish(W, 'quench').grown); assert.equal(n, 1, 'no dice thrown for it');
  } finally { R.setLuck(true); }
});

test('it grows as it\'s carried: GROWN gilds every affix, NAMED takes a name and an affix, FULL-GROWN rises a tier', () => {
  const c = piece(2), base = c.affixes.length;
  assert.deepEqual(c.grown, { stage: 1, uses: 0 });
  assert.deepEqual(R.growBy(c, 'Pell Hayes', 9, () => 0.4), [], 'not yet');
  const e2 = R.growBy(c, 'Pell Hayes', 1, () => 0.4);
  assert.equal(e2[0].stage, 2); assert.equal(c.gilded.length, base, 'every affix at its best');
  const e3 = R.growBy(c, 'Pell Hayes', 15, () => 0.4);
  assert.equal(e3[0].stage, 3); assert.match(c.name, /^Pell's /); assert.equal(c.affixes.length, base + 1); assert.equal(c.grown.extra.length, 1);
  const worth3 = c.worth;
  const e4 = R.growBy(c, 'Pell Hayes', 25, () => 0.4);
  assert.equal(e4[0].stage, 4); assert.equal(e4[0].rose, 'Old-Blood'); assert.equal(c.tier, 'oldblood');
  assert.match(c.name, /^Pell's /, 'its name kept'); assert.ok(c.affixes.some(a => a[0] === c.grown.extra[0]), 'NAMED\'s affix kept over the count');
  assert.ok(c.flawless && c.worth > worth3, 'Old-Blood with every affix gilded: FLAWLESS');
  assert.deepEqual(R.growBy(c, 'Pell Hayes', 100, () => 0.4), [], 'it grows no more');
  // a grown Old-Blood piece takes another affix instead; a Relic never rises
  const ob = piece(3); R.growBy(ob, 'Ada', 50, () => 0.4);
  assert.equal(ob.tier, 'oldblood'); assert.equal(ob.grown.stage, 4); assert.equal(ob.grown.extra.length, 2);
  const rel = { ...piece(4), relic: 'x', name: 'The Relic' }; R.growBy(rel, 'Ada', 50, () => 0.4);
  assert.equal(rel.tier, 'relic'); assert.equal(rel.name, 'The Relic', 'a Relic keeps its own name');
});

test('reworked, a grown piece keeps its growth, its name and its extra affix', () => {
  const c = piece(1); R.growBy(c, 'Pell', 30, () => 0.4);
  assert.equal(c.grown.stage, 3);
  const up = R.remakePiece({ card: c, res: { tier: 2, worked: 5, strikes: 5, heats: 1, cracks: 0 }, picked: null, rng: () => 0.6, now: 2 });
  assert.equal(up.tier, 'rare'); assert.equal(up.name, c.name); assert.equal(up.grown.stage, 3);
  assert.ok(up.affixes.some(a => a[0] === c.grown.extra[0])); assert.equal(up.gilded.length, up.affixes.filter(a => R.affixIds([a]).length).length, 'all gilded');
});

test('the staff carry it: a trip grows it by its hours, a haul by a quarter; an heirloom can come down from over the door and goes back', () => {
  const c = piece(0, { pattern: 'boots' });
  const save = { cards: [c], heirlooms: [], staff: [] }, p = { id: 'r', name: 'Pell Hayes', role: 'runner' };
  assert.ok(Run.equip(save, p, c.id).ok);
  const out = Run.growGear(p, 10, () => 0.4); assert.equal(out[0].who, 'Pell Hayes'); assert.equal(out[0].stage, 2);
  assert.equal(c.grown.by, 'Pell Hayes');
  // handed on: a grown piece of any tier can be an heirloom
  assert.ok(Leg.heirlooms({ cards: [piece(0)] }).length === 1);
  const loom = { ...piece(1, { pattern: 'helm' }), id: 'loom', heirloom: true, from: 'Old Maker' };
  save.heirlooms = [loom];
  assert.equal(Run.carriableLooms(save).length, 1);
  assert.ok(Run.equip(save, p, 'loom').ok); assert.equal(save.heirlooms.length, 0); assert.ok(!save.cards.includes(loom));
  Run.unequip(save, p, 'head'); assert.equal(save.heirlooms[0], loom, 'back over the door'); assert.ok(!save.cards.includes(loom));
  Run.equip(save, p, 'loom'); save.staff = [p]; Run.lose(save, p, 'deep', 1);
  assert.ok(save.heirlooms.includes(loom), 'killed on the road: the Watch brings it home, over the door'); assert.ok(save.cards.includes(c));
});

test('a grown card goes through a link with its stage; nothing the game doesn\'t know', () => {
  const c = piece(2); R.growBy(c, 'Pell Hayes', 30, () => 0.4);
  const back = decodeCard(encodeCard(c));
  assert.deepEqual(back.grown, { stage: 3, uses: 30, by: 'Pell Hayes' });
  assert.ok(!decodeCard(encodeCard({ ...c, grown: { stage: 9, uses: 1 } })).grown);
  assert.ok(!decodeCard(encodeCard({ ...c, grown: 'yes' })).grown);
});
