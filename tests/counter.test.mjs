import test from 'node:test';
import assert from 'node:assert/strict';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import { PATTERNS, MATS, TIERS, HAGGLE_TABLE, PATIENCE } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const blank = (o = {}) => { const s = { coins: 100, mats: {}, cards: [], shelf: [], slots: 4, ledger: [], queue: [], clock: 0, ...o }; Sh.fixShelf(s); return s; };
const make = (pattern, m = 0, tier = 0, worked = 0, picks) => R.makePiece({ patternId: pattern, picks: picks || [m, 0, 0], result: { tier, flawed: false, worked, strikes: 20, heats: 2, cracks: 0 }, maker: 'T', rng: seeded(m * 10 + tier + 1), now: 1 });
const buyer = (o = {}) => ({ kind: 'buyer', who: 'x', type: 'guard', want: 'weapon', purse: 500, mood: 'EAGER', least: 0, wait: PATIENCE, shows: 0, ...o });

test('away from the counter, customers buy from the shelf as before', () => {
  const s = blank({ shopNext: 1 });
  const out = Sh.shopStep(s, 2, seeded(1), 0, false);
  assert.equal(out.length, 1); assert.equal(s.queue.length, 0);
});

test('at the counter, customers queue, and look for themselves when they\'ve waited', () => {
  const s = blank({ shopNext: 1, orderNext: 1e9 });
  const rng = seeded(3);
  Sh.shopStep(s, 2, rng, 0, true);
  assert.equal(s.queue.length, 1);
  s.shopNext = 1e9;
  Sh.shopStep(s, PATIENCE + 1, rng, 0, true);
  assert.equal(s.queue.length, 0);
  assert.equal(s.ledger.length, 1);
});

test('leaving the counter sends the queue to the shelf', () => {
  const s = blank({ queue: [buyer(), buyer(), { kind: 'seller', who: 's', offer: { type: 'mats', mat: 'iron', n: 2, price: 10 } }], shopNext: 1e9 });
  const out = Sh.shopStep(s, 0.1, seeded(1), 0, false);
  assert.equal(s.queue.length, 0); assert.equal(out.length, 2);
});

test('the haggle follows Zero\'s table', () => {
  for (const mood of ['EAGER', 'WARY', 'PINCHED']) for (const choice of ['meet', 'hold', 'ask']) {
    const card = make('dagger'); const s = blank({ cards: [card], coins: 0, queue: [buyer({ mood, want: 'weapon' })] });
    Sh.place(s, card.id);
    const r = Sh.haggle(s, card.id, choice, 1), want = HAGGLE_TABLE[mood][choice].split(':')[0];
    assert.equal(r.outcome, want, mood + ' ' + choice);
    if (want === 'sold') { assert.equal(s.coins, Sh.hagglePrice(card, 'fair', choice)); assert.equal(s.queue.length, 0); }
    if (want === 'counter') { assert.equal(s.queue.length, 1); const t = Sh.answerCounter(s, true, 2); assert.equal(t.outcome, 'sold'); assert.equal(s.coins, r.price); }
    if (want === 'gone') assert.equal(s.queue.length, 0);
  }
});

test('a want met exactly lifts the mood a step', () => {
  const card = make('dagger'); const s = blank({ cards: [card], coins: 0, queue: [buyer({ mood: 'PINCHED', want: 'dagger' })] });
  Sh.place(s, card.id);
  assert.equal(Sh.haggle(s, card.id, 'hold', 1).outcome, 'sold');
});

test('a haggled price never passes the purse, ASK MORE on DEAR included', () => {
  const card = make('falchion'); const s = blank({ cards: [card], coins: 0 });
  Sh.place(s, card.id); Sh.setTag(s, 0, 'dear');
  const ask = Sh.hagglePrice(card, 'dear', 'ask');
  s.queue = [buyer({ purse: ask - 1 })];
  assert.equal(Sh.haggle(s, card.id, 'ask', 1).outcome, 'over');
  assert.equal(s.coins, 0); assert.equal(s.queue.length, 1);
  s.queue[0].purse = ask; assert.equal(Sh.haggle(s, card.id, 'ask', 1).outcome, 'sold'); assert.equal(s.coins, ask);
});

test('a refused counter-offer, and they go', () => {
  const card = make('dagger'); const s = blank({ cards: [card], coins: 0, queue: [buyer({ mood: 'WARY' })], shopNext: 1e9, orderNext: 1e9 });
  Sh.place(s, card.id);
  assert.equal(Sh.haggle(s, card.id, 'ask', 1).outcome, 'counter');
  Sh.shopStep(s, PATIENCE * 3, seeded(1), 1, true);
  assert.equal(s.queue.length, 1, 'no one walks out mid-haggle');
  assert.equal(Sh.answerCounter(s, false, 2).outcome, 'gone');
  assert.equal(s.cards.length, 1); assert.equal(s.coins, 0);
});

test('haggling is practice', () => {
  const s = blank();
  assert.equal(Sh.haggleLevel(s), 1);
  s.haggle = { xp: 10 }; assert.equal(Sh.haggleLevel(s), 3);
});

test('sellers: buying what they bring', () => {
  for (let i = 0; i < 40; i++) {
    const c = Sh.newSeller(seeded(i), 5, 1);
    const s = blank({ coins: 10000, queue: [c] });
    assert.ok(Sh.buyOffer(s, 1));
    if (c.offer.type === 'mats') assert.equal(s.mats[c.offer.mat], c.offer.n); else assert.equal(s.cards.length, 1);
    assert.equal(s.coins, 10000 - c.offer.price); assert.equal(s.queue.length, 0);
  }
  const s = blank({ coins: 0, queue: [Sh.newSeller(seeded(2), 5, 1)] });
  assert.equal(Sh.buyOffer(s, 1), null);
});

test('no money machines: buying a piece to break down never pays', () => {
  for (let i = 0; i < 200; i++) {
    const c = Sh.newSeller(seeded(i), 5, 1);
    if (c.offer.type === 'piece') assert.ok(c.offer.price > Sh.salvageWorth(c.offer.card), c.offer.card.name);
  }
});

test('breaking down gives back less than it took', () => {
  for (const id of Object.keys(PATTERNS)) {
    const n = R.partOptions(id).map(p => p.opts.length);
    for (let m = 0; m < n[0]; m++) for (let g = 0; g < n[1]; g++) {
      const picks = [m, g, 0], card = make(id, m, 0, 0, picks);
      const cost = Sh.recipe(id, picks).reduce((c, r) => c + MATS[r.mat].price * r.n, 0);
      assert.ok(Sh.salvageWorth(card) < cost, card.name);
    }
  }
  const card = make('falchion', 0, 1, 0, [0, 2, 0]), s = blank({ cards: [card] });
  assert.deepEqual(Sh.salvage(s, card.id), [{ mat: 'iron', n: 1 }, { mat: 'blackwater', n: 1 }]);
  assert.equal(s.cards.length, 0); assert.equal(s.mats.iron, 1);
  const up = make('dagger'), t = blank({ cards: [up] }); Sh.place(t, up.id);
  assert.equal(Sh.salvage(t, up.id), null, 'not off the shelf');
});

test('special orders pay for what they ask, whatever is handed in', () => {
  const s = blank({ clock: 1000, orderNext: 0 });
  const e = Sh.postOrder(s, seeded(4), 1);
  assert.equal(e.order, 'posted'); assert.ok(s.order.pays > 0);
  const o = s.order, better = make(o.pattern, Math.max(0, R.partOptions(o.pattern)[0].opts.findIndex(x => x.id === (o.metal || R.partOptions(o.pattern)[0].opts[0].id))), 2, 40);
  s.cards.push(better);
  assert.ok(Sh.fills(o, better));
  const before = s.coins; Sh.deliver(s, better.id, 2);
  assert.equal(s.coins - before, o.pays); assert.equal(s.order, null);
  assert.ok(o.pays < better.worth * 2, 'a Rare handed in for a plain order pays the order, not double the Rare');
});

test('an order that runs past its time lapses', () => {
  const s = blank({ clock: 0, orderNext: 0 }); Sh.postOrder(s, seeded(1), 1);
  s.shopNext = 1e9;
  Sh.shopStep(s, s.order.due + 1, seeded(1), 2, false);
  assert.equal(s.order, null); assert.equal(s.ledger[0].order, 'lapsed');
});

test('orders ask for what the regular insists on', () => {
  for (let i = 0; i < 100; i++) {
    const s = blank(); Sh.postOrder(s, seeded(i), 1);
    const o = s.order; assert.ok(PATTERNS[o.pattern]);
    if (o.metal) assert.ok(R.partOptions(o.pattern)[0].opts.some(x => x.id === o.metal));
    if (o.who.startsWith('Ketty')) assert.equal(o.metal, 'silver');
  }
});

test('rework: a tier up when it takes, a tier down on a second crack, no roll', () => {
  const card = make('falchion', 0, 0);
  const S = R.newWorking({ patternId: 'falchion', picks: [0, 0, 0], level: 3, found: [], kit: {}, rework: { from: 0 } }, seeded(1));
  assert.equal(R.odds(S).f, 100);
  S.shape = 100;
  const up = R.finish(S, 'quench'); assert.equal(up.tier, 1); assert.ok(up.rework); assert.equal(up.clean, false);
  const S2 = R.newWorking({ patternId: 'falchion', picks: [0, 0, 0], level: 3, found: [], kit: {}, rework: { from: 1 } }, seeded(1));
  assert.equal(R.finish(S2, 'dropped').tier, 0);
  const S3 = R.newWorking({ patternId: 'falchion', picks: [0, 0, 0], level: 3, found: [], kit: {}, rework: { from: 0 } }, seeded(1));
  const d = R.finish(S3, 'dropped'); assert.equal(d.tier, 0); assert.ok(d.flawed);
  assert.ok(R.xpFor(up) > 0, 'a rework teaches');
});

test('a reworked piece keeps its id, maker and affixes, and gains the tier\'s', () => {
  const fine = make('falchion', 3, 1);   // silver: Silvered
  const res = { tier: 2, flawed: false, worked: 10, strikes: 12, heats: 1, cracks: 0, whiteHeat: false, frost: false };
  const rare = R.remakePiece({ card: fine, res, picked: null, rng: seeded(2), now: 5 });
  assert.equal(rare.id, fine.id); assert.equal(rare.tier, 'rare'); assert.equal(rare.maker, 'T');
  assert.ok(rare.affixes.some(a => a[0] === fine.affixes[0][0]), 'the old affix kept');
  assert.equal(rare.affixes.filter(a => a[0] === 'Silvered').length, 1);
  assert.equal(new Set(rare.affixes.map(a => a[0])).size, rare.affixes.length);
  assert.equal(rare.src.worked, fine.src.worked + 10);
  assert.ok(rare.made.some(m => m.startsWith('back in the fire')));
  assert.ok(rare.worth > fine.worth);
  assert.deepEqual(Sh.reworkCost(fine), [{ mat: 'silver', n: 2 }]);
});

test('an older card without its making can still be reworked and broken down', () => {
  const old = { id: 'o', pattern: 'falchion', metal: 'steel', tier: 'fine', name: 'Steel Falchion', worth: 461, affixes: [['Hallowed', '+9% on the dead']],
    made: ['Forged by Old Smith', 'WORKED +24 %', '23 strikes · 2 heats', '1 crack'] };
  const src = R.srcOf(old);
  assert.deepEqual(src.picks, [2, 0, 0]); assert.equal(src.worked, 24); assert.equal(src.cracks, 1);
  const rare = R.remakePiece({ card: old, res: { tier: 2, worked: 0, strikes: 10, heats: 1, cracks: 0 }, rng: seeded(1), now: 1 });
  assert.equal(rare.maker, 'Old Smith'); assert.ok(rare.affixes.some(a => a[0] === 'Hallowed'));
  assert.deepEqual(Sh.salvageOf(old), [{ mat: 'steel', n: 1 }]);
  assert.deepEqual(Sh.salvageOf(make('ring')), [], 'a one-bar piece gives no bar back');
});
