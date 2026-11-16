import test from 'node:test';
import assert from 'node:assert/strict';
import * as Br from '../js/branch.js';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import * as Rm from '../js/room.js';
import * as G from '../js/growth.js';
import * as Town from '../js/town.js';
import { BRANCH, CUSTOMERS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const piece = (i, rng) => R.makePiece({ patternId: ['dagger', 'falchion', 'helm', 'ring'][i % 4], picks: [0, 0, 0], result: { tier: i % 2, flawed: false, worked: 10, strikes: 9, heats: 1, cracks: 0 }, maker: 'T', rng, now: i });
function maker(o = {}) { const s = { coins: 50000, mats: {}, cards: [], shelf: [], slots: 4, ledger: [], queue: [], clock: 0, wall: [], stations: [], renown: 200, made: 10, ...o }; Rm.fixRoom(s); Sh.fixShelf(s); const rng = seeded(2); for (let i = 0; i < 12; i++) s.cards.push(piece(i, rng)); return s; }

test('a second shop: bought once the shop is SOUGHT and can pay; it starts with two shelves of its own', () => {
  assert.ok(Br.buy(maker({ renown: 100 })).why, 'KNOWN is not enough');
  assert.ok(Br.buy(maker({ coins: 100 })).why, 'not enough coin');
  const s = maker(); assert.ok(Br.buy(s).ok); assert.equal(s.coins, 50000 - BRANCH.cost); assert.ok(Br.buy(s).why, 'one only');
  const v = Br.viewOf(s);
  assert.equal(Rm.shelvesOf(v.room), 2); assert.equal(v.slots, 4); assert.notEqual(v.room, s.room); assert.notEqual(v.shelf, s.shelf);
  assert.ok(Rm.valid(s.branch.room));
});

test('a piece is on one shelf at most: the first shop\'s, the second\'s, or the wall', () => {
  const s = maker(); Br.buy(s); const v = Br.viewOf(s), [a, b] = s.cards;
  assert.equal(Sh.place(v, a.id), 0); assert.equal(Sh.place(s, a.id), -1, 'already at the Landing');
  assert.equal(Sh.place(s, b.id), 0); assert.equal(Sh.place(v, b.id), -1, 'already in the first shop');
  assert.ok(!Sh.inBack(s).some(c => c.id === a.id) && !Sh.inBack(v).some(c => c.id === b.id));
  assert.equal(G.hang(s, a.id), false); assert.equal(Sh.salvage(s, a.id), null);
  // the second shop buys its own shelves and makes them better, on its own floor
  const r = Rm.buy(v, 'shelf'); assert.ok(r.item); assert.equal(v.slots, 6); assert.equal(s.slots, 4);
  assert.ok(Rm.upgradeShelf(v, 'shelf-0').places); assert.equal(Rm.shelvesOf(s.room), 2);
});

test('the keeper sells while the game runs: the coin is the maker\'s, the wage comes out of it, and it closes when it can\'t be paid', () => {
  const s = maker(); Br.buy(s); const v = Br.viewOf(s);
  s.cards.slice(0, 4).forEach(c => Sh.place(v, c.id));
  const coins = s.coins, rng = seeded(4); let sold = 0, got = 0;
  for (let t = 0; t < 3600; t += 10) Br.step(s, 10, rng, 1e12 + t * 1000).forEach(e => { if (e.sold) { sold++; got += e.sold.price; } });
  assert.ok(sold > 0, 'it sells'); assert.equal(s.coins, coins + got - s.wagesBranch); assert.ok(Math.abs(s.wagesBranch - BRANCH.wage) <= 1, 'an hour\'s wage');
  assert.equal(s.branch.sold, sold); assert.ok(s.sold >= sold, 'counted in the maker\'s sales too');
  assert.ok(s.branch.ledger.length > 0); assert.equal(s.ledger.length, 0, 'the first shop\'s ledger is its own');
  s.coins = 0; s.branch.owe = 0.99; Br.step(s, 600, rng, 1e12 + 4e6); assert.ok(s.branch.closed);
});

test('its own customers and its own notice board', () => {
  const s = maker(); Br.buy(s); const v = Br.viewOf(s), ids = CUSTOMERS.map(c => c.id);
  const share = (x, id) => { const w = Sh.customerWeights(x); return w[ids.indexOf(id)] / w.reduce((a, b) => a + b, 0); };
  assert.ok(share(v, 'delver') > share(s, 'delver') * 2); assert.ok(share(v, 'folk') < share(s, 'folk'));
  let differ = 0;
  for (let d = 20000; d < 20030; d++) { Town.refreshTown(s, d * 86400000); Town.refreshTown(v, d * 86400000); if (JSON.stringify(s.town.hot) !== JSON.stringify(s.branch.town.hot)) differ++; }
  assert.ok(differ > 15, differ + ' of 30 days its board differs');
});

test('away, the keeper sells on what\'s on its shelves, up to the away cap', () => {
  const s = maker(); Br.buy(s); const v = Br.viewOf(s);
  s.cards.slice(0, 4).forEach(c => Sh.place(v, c.id));
  const a = Br.away(s, 1e12, 1e12 + 20 * 3600000, seeded(5), 8);
  assert.ok(a.sold.length > 0 && a.sold.length <= 4, a.sold.length + ' sold'); assert.equal(a.wages, 8 * BRANCH.wage);
  assert.ok(a.coins > 0);
});
