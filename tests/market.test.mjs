import test from 'node:test';
import assert from 'node:assert/strict';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import * as Town from '../js/town.js';
import { toCode, fromCode } from '../js/save.js';
import { PATIENCE, TOWN_HOT, TOWN_COLD, DEMAND, OPENING, CUSTOMERS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const blank = (o = {}) => { const s = { coins: 0, mats: {}, cards: [], shelf: [], slots: 4, ledger: [], queue: [], clock: 0, ...o }; Sh.fixShelf(s); return s; };
const make = (pattern, tier = 1, id) => { const p = R.makePiece({ patternId: pattern, picks: [0, 0, 0], result: { tier, flawed: false, worked: 10, strikes: 20, heats: 2, cracks: 0 }, maker: 'T', rng: seeded(tier + 3), now: 1 }); if (id) p.id = id; return p; };
const buyer = (o = {}) => ({ kind: 'buyer', who: 'x', type: 'guard', want: 'any', purse: 500, mood: 'EAGER', least: 0, wait: PATIENCE, shows: 0, ...o });
const shop = (cards, b) => { const s = blank({ cards, queue: [buyer(b)] }); cards.forEach(c => Sh.place(s, c.id)); return s; };

// ---------- haggling ----------
test('no dead end: whatever their purse and mood, there is a price that sells, and it never passes the purse', () => {
  const card = make('falchion'), fair = Sh.priceAt(card, 'fair');
  for (const mood of ['EAGER', 'WARY', 'PINCHED']) for (const share of [0.3, 0.6, 0.8, 0.95, 1, 1.2, 2]) for (const choice of ['meet', 'hold', 'ask']) {
    const purse = Math.round(fair * share), s = shop([card], { mood, purse });
    const r = Sh.haggle(s, card.id, choice, 1), tag = mood + ' ' + share + ' ' + choice;
    if (r.outcome === 'gone') { assert.equal(mood, 'PINCHED', tag); assert.equal(choice, 'ask', tag); continue; }   // the table's one walk-out
    if (r.outcome === 'counter') {
      assert.ok(r.price <= purse, tag + ': offer ' + r.price + ' over purse ' + purse);
      const t = Sh.answerCounter(s, true, 2); assert.equal(t.outcome, 'sold', tag); assert.equal(s.coins, r.price);
    } else { assert.equal(r.outcome, 'sold', tag); assert.ok(s.coins <= purse, tag); }
  }
});

test('over their purse, they name a price by mood; the 168 c falchion and the 134 c purse that used to be a dead end', () => {
  const card = make('falchion'), fair = Sh.priceAt(card, 'fair'), purse = Math.round(fair * 0.8);
  for (const mood of ['EAGER', 'WARY', 'PINCHED']) {
    const s = shop([card], { mood, purse, want: 'any' });   // a want not met exactly: their own mood
    const r = Sh.haggle(s, card.id, 'hold', 1);
    assert.equal(r.outcome, 'counter'); assert.ok(r.over); assert.equal(r.price, Math.floor(purse * OPENING[mood]), mood);
  }
});

test('split the difference: taken within the purse, else up to the whole purse; PINCHED only comes up, once', () => {
  const card = make('falchion'), fair = Sh.priceAt(card, 'fair');
  // EAGER, purse just under the price: offers the whole purse; halfway is over it, so they hold at the purse, final
  let s = shop([card], { mood: 'WARY', purse: Math.round(fair * 0.9), want: 'any' });
  let r = Sh.haggle(s, card.id, 'hold', 1); assert.equal(r.outcome, 'counter');
  const mid = Sh.splitPrice(s.queue[0].counter);
  const sp = Sh.split(s, 2);
  if (mid <= s.queue[0]?.purse) assert.equal(sp.outcome, 'sold');
  else { assert.equal(sp.outcome, 'counter'); assert.ok(sp.final); assert.equal(sp.price, Math.round(fair * 0.9)); assert.equal(Sh.split(s, 3), null, 'no second split'); }
  // WARY with a deep purse but a counter at HOLD (they asked more): halfway is within the purse, sold at it
  s = shop([card], { mood: 'WARY', purse: 5000, want: 'any' });
  r = Sh.haggle(s, card.id, 'ask', 1); assert.equal(r.outcome, 'counter'); assert.ok(!r.over);
  const k = { ...s.queue[0].counter };
  const done = Sh.split(s, 2); assert.equal(done.outcome, 'sold'); assert.equal(done.price, Sh.splitPrice(k)); assert.equal(s.coins, done.price);
  assert.equal(s.ledger[0].sold.tag, 'split');
  // PINCHED: comes up to halfway (or the purse) and that's the last word
  s = shop([card], { mood: 'PINCHED', purse: 5000, want: 'any' });
  r = Sh.haggle(s, card.id, 'hold', 1); assert.equal(r.outcome, 'counter');
  const p = Sh.split(s, 2); assert.equal(p.outcome, 'counter'); assert.ok(p.final); assert.ok(p.price > r.price);
  assert.equal(Sh.answerCounter(s, true, 3).outcome, 'sold'); assert.equal(s.coins, p.price);
});

test('saying no: they look at another piece they haven\'t seen, or they go', () => {
  const a = make('falchion', 1, 'a'), b = make('dagger', 1, 'b');
  const s = shop([a, b], { mood: 'WARY', purse: 30, want: 'weapon' });
  assert.equal(Sh.haggle(s, 'a', 'hold', 1).outcome, 'counter');
  assert.equal(Sh.answerCounter(s, false, 2).outcome, 'another'); assert.equal(s.queue.length, 1); assert.equal(s.queue[0].counter, null);
  Sh.shopStep(s, PATIENCE * 3, seeded(1), 0, true);
  const one = shop([a], { mood: 'WARY', purse: 30 });
  Sh.haggle(one, 'a', 'hold', 1); assert.equal(Sh.answerCounter(one, false, 2).outcome, 'gone'); assert.equal(one.queue.length, 0);
});

// ---------- the town's wants ----------
test('the notice board: the same for everyone on a day, two in demand, one out of favour that doesn\'t clash', () => {
  const seen = new Set();
  for (let d = 20000; d < 20400; d++) {
    const t = Town.townOn(d); assert.deepEqual(Town.townOn(d), t);
    assert.equal(t.hot.length, 2); assert.notEqual(t.hot[0], t.hot[1]); seen.add(t.hot.join());
    const hot = Town.hotPatterns(t), cold = TOWN_COLD.find(c => c.id === t.cold);
    if (cold) cold.patterns.forEach(p => assert.ok(!hot.includes(p), d + ': ' + p + ' hot and cold'));
  }
  assert.ok(seen.size > 30, 'it varies');
  const s = {}; Town.refreshTown(s, 20000 * 86400000 + 5); const first = s.town;
  Town.refreshTown(s, 20000 * 86400000 + 80000000); assert.equal(s.town, first, 'the same day keeps its board');
  Town.refreshTown(s, 20001 * 86400000); assert.equal(s.town.day, 20001);
});

test('in demand: asked for more, keener, deeper purses for it; out of favour: never asked for, thinner purses', () => {
  const day = [...Array(400).keys()].map(i => 20000 + i).find(d => { const t = Town.townOn(d); return Town.hotPatterns(t).includes('falchion') && t.cold; });
  const town = Town.townOn(day), cold = TOWN_COLD.find(c => c.id === town.cold).patterns[0];
  const save = { town, stations: ['stretcher', 'bowbench', 'kettle', 'glass'] }, rng = seeded(9);
  let hotWants = 0, coldWants = 0, plain = 0;
  for (let i = 0; i < 4000; i++) {
    const c = Sh.richer(save, Sh.newCustomer(rng), rng);
    if (Town.demandOf(town, c.want) > 0) hotWants++;
    if (c.want === cold) coldWants++;
    const p = Sh.richer({ stations: save.stations }, Sh.newCustomer(rng), rng); if (Town.hotPatterns(town).includes(p.want)) plain++;
  }
  assert.equal(coldWants, 0); assert.ok(hotWants > plain * 1.5, hotWants + ' vs ' + plain);
  const c = buyer({ purse: 100 });
  assert.equal(Sh.purseFor(save, c, make('falchion')), Math.round(100 * DEMAND.purse));
  const coldCard = make(cold); assert.equal(Sh.purseFor(save, c, coldCard), Math.round(100 * DEMAND.cold));
  assert.equal(Sh.moodFor(buyer({ mood: 'PINCHED', want: 'any' }), make('falchion'), save), 'WARY');
});

// ---------- the save code ----------
test('a save code carries the whole game and refuses anything else', () => {
  const s = { v: 1, maker: 'Ána Þór', coins: 123, cards: [make('falchion')], mats: { iron: 3 }, trades: { falchion: { xp: 40 } }, shelf: [], ledger: [], found: ['ember'] };
  const code = toCode(s); assert.match(code, /^DCF1\.[0-9a-z]+\.[A-Za-z0-9_-]+$/);
  const back = fromCode(code); assert.equal(back.maker, 'Ána Þór'); assert.equal(back.coins, 123); assert.deepEqual(back.cards, JSON.parse(JSON.stringify(s.cards)));
  assert.ok(fromCode('  ' + code.slice(0, 40) + '\n' + code.slice(40) + ' '), 'line breaks from a paste are fine');
  assert.equal(fromCode(code.slice(0, -3)), null, 'cut short');
  assert.equal(fromCode(code.replace(/.$/, c => c === 'A' ? 'B' : 'A')), null, 'damaged');
  assert.equal(fromCode('hello'), null); assert.equal(fromCode(''), null); assert.equal(fromCode(null), null);
  assert.equal(fromCode(toCode({ v: 1, hello: 'world' })), null, 'not a save');
  assert.equal(fromCode(toCode({ ...s, v: 2 })), null, 'a version this game doesn\'t know');
});

// ---------- the wealthy ----------
test('the wealthy come with renown: none to an unknown shop, more as it grows; a master collector for Old-Blood on show', () => {
  const ids = CUSTOMERS.map(c => c.id), share = (save, id) => { const w = Sh.customerWeights(save); return w[ids.indexOf(id)] / w.reduce((a, b) => a + b, 0); };
  const at = (renown, extra = {}) => ({ renown, wall: [], cards: [], shelf: [], ...extra });
  assert.equal(share(at(0), 'steward'), 0); assert.equal(share(at(20), 'steward'), 0); assert.equal(share(at(0), 'master'), 0);
  assert.ok(share(at(60), 'steward') > 0, 'KNOWN: stewards'); assert.equal(share(at(60), 'master'), 0, 'KNOWN: no master yet');
  assert.ok(share(at(500), 'steward') > share(at(200), 'steward')); assert.ok(share(at(200), 'master') > 0, 'SOUGHT: masters');
  const ob = make('falchion', 3, 'ob'), withOb = at(60, { cards: [ob], shelf: [{ id: 'ob', tag: 'fair' }] });
  assert.ok(share(withOb, 'master') > 0, 'Old-Blood on the shelf draws a master to a KNOWN shop');
  assert.equal(share(at(20, { cards: [ob], shelf: [{ id: 'ob', tag: 'fair' }] }), 'master'), 0, 'not to a merely NOTED one');
  // drawn, they carry real money and look only at good work
  const rng = seeded(5), seen = {};
  for (let i = 0; i < 3000; i++) { const c = Sh.newCustomer(rng, at(500)); (seen[c.type] = seen[c.type] || []).push(c); }
  assert.ok(seen.steward.length > 100 && seen.master.length > 30, JSON.stringify(Object.fromEntries(Object.entries(seen).map(([k, v]) => [k, v.length]))));
  assert.ok(seen.master.every(c => c.purse >= 3000 && c.least === 2)); assert.ok(seen.steward.every(c => c.purse >= 1500 && c.least === 1));
  assert.equal(Sh.newCustomer(seeded(1)).type !== undefined, true, 'without a save, as before');
});
