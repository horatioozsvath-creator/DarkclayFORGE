// Milestone 34: the loose ends. A Tidy clerk; the Court's orders for found patterns; the monster hunt and its trophy; the Nine's pace.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as St from '../js/staff.js';
import * as Sh from '../js/shop.js';
import { TRAITS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const H = 3600000, T0 = 1.8e12;
const piece = (id, pattern = 'dagger', worth = 24, o = {}) => ({ id, pattern, tier: 'common', name: 'Test ' + pattern, worth, metal: 'iron', affixes: [], made: [], ...o });

test('a Relic from a Rare comes out with three affixes and its power', async () => {
  const R = await import('../js/rules.js');
  const rare = R.makePiece({ patternId: 'falchion', picks: [0, 0, 0], result: { tier: 2, flawed: false, worked: 10, strikes: 20, heats: 2, cracks: 0 }, maker: 'T', rng: seeded(1), now: 1 });
  assert.equal(rare.affixes.length, 2);
  const p = R.relicPiece(R.remakePiece({ card: rare, res: { tier: 4, flawed: false, worked: 10, strikes: 30, heats: 3, cracks: 0, whiteHeat: true }, picked: null, rng: seeded(2), now: 2 }), 'gatewarden');
  assert.equal(p.tier, 'relic'); assert.equal(p.affixes.length, 3); assert.equal(p.name, 'Gatewarden');
});

test('a Tidy clerk fills every empty place from the back, never a Rare or a kept piece; the switch turns it off', () => {
  assert.ok(TRAITS.clerk.some(t => t.id === 'tidy'));
  const back = [piece('a', 'ring', 15), piece('b', 'dagger', 30), piece('r', 'dagger', 90, { tier: 'rare' }), piece('k', 'dagger', 5, { keep: true })];
  const s = { coins: 0, mats: {}, cards: back, shelf: [], slots: 4, ledger: [], queue: [], clock: 0, found: ['ember'], staff: [], made: 1 };
  Sh.fixShelf(s);
  const put = Sh.tidyUp(s);
  assert.deepEqual(put.map(c => c.id), ['a', 'b'], 'the least worth first; never the Rare or the kept one');
  assert.equal(s.shelf.filter(Boolean).length, 2);
  const p = { id: 'c', role: 'clerk', name: 'Wenna Tolley', trait: 'tidy', xp: 0 };
  assert.equal(St.clerkTerms(p).tidy, true); p.restock = false; assert.equal(St.clerkTerms(p).tidy, false);
  assert.equal(St.clerkTerms({ ...p, trait: 'early', restock: true }).tidy, false);
});

test('away, a Tidy clerk keeps the shelf full; the summary lists what they put out', () => {
  const back = Array.from({ length: 40 }, (_, i) => piece('b' + i, 'dagger', 20 + i));
  const s = { coins: 500, mats: {}, cards: back, shelf: [], slots: 4, ledger: [], queue: [], clock: 0, found: ['ember'], made: 1, lastSeen: T0,
    staff: [{ id: 'c', role: 'clerk', name: 'Wenna Tolley', trait: 'tidy', xp: 0, trip: null }] };
  Sh.fixShelf(s);
  const a = St.catchUp(s, T0 + 6 * H, seeded(4));
  assert.ok(a && a.restocked.length >= 4, 'filled the empty shelf: ' + (a && a.restocked.length));
  assert.equal(s.shelf.filter(Boolean).length, 4, 'still full at the end');
});

import * as Disc from '../js/discover.js';
import { PATTERNS, COURT_FOUND, RENOWN } from '../js/data.js';
const court = (o = {}) => ({ coins: 500, renown: 0, maker: 'T', cards: [], shelf: [], slots: 4, ledger: [], queue: [], found: ['ember'], staff: [], trades: {},
  stations: ['stretcher', 'bowbench', 'kettle', 'glass'], mats: {}, clock: 0, ...o });
const courtOrders = (s, n, seed0 = 0) => { const got = []; for (let i = 0; i < n; i++) { s.order = null; Sh.postOrder(s, seeded(seed0 + i), i); if (s.order && s.order.court) got.push(s.order); } return got; };

test('the Court asks for a pattern you found, from FAMED; never one still to find, never before FAMED', () => {
  const none = court({ renown: RENOWN[COURT_FOUND.rung].at });
  assert.equal(courtOrders(none, 300).length, 0, 'nothing found: the Court asks nothing of the kind');
  const early = court({ renown: RENOWN[COURT_FOUND.rung - 1].at }); Disc.bookOf(early).found = ['ink', 'shield'];
  assert.equal(courtOrders(early, 300).length, 0, 'SOUGHT: not yet');
  const s = court({ renown: RENOWN[COURT_FOUND.rung].at }); Disc.bookOf(s).found = ['ink', 'shield'];
  const got = courtOrders(s, 400);
  assert.ok(got.length > 10, got.length + ' Court orders');
  for (const o of got) { assert.ok(['ink', 'shield'].includes(o.pattern), o.pattern); assert.equal(o.least, 1); assert.equal(o.who, 'The Court'); }
});

test('a Court order filled: half again the pay, and renown', () => {
  const s = court({ renown: RENOWN[COURT_FOUND.rung].at }); Disc.bookOf(s).found = ['shield'];
  const o = courtOrders(s, 400).find(Boolean); s.order = o;
  assert.equal(o.pays, Math.round(Sh.orderPays('shield', null, 1) * COURT_FOUND.pays));
  s.cards.push({ id: 'sh', pattern: 'shield', tier: 'fine', name: 'Shield', worth: 100, metal: 'iron', affixes: [], made: [] });
  const r0 = s.renown, c0 = s.coins, e = Sh.deliver(s, 'sh', 5);
  assert.ok(e && e.order === 'filled'); assert.equal(s.coins, c0 + o.pays); assert.equal(s.renown, r0 + 3 + COURT_FOUND.renown);
});

import * as Mon from '../js/monsters.js';
import * as Run from '../js/runner.js';
import { MONSTERS, ROUTES } from '../js/data.js';
const D = 24 * H;
const beastShop = (id, o = {}) => ({ coins: 1000, renown: 2000, mats: {}, cards: [], shelf: [], slots: 4, ledger: [], queue: [], clock: 0, found: ['ember'], made: 1,
  staff: [{ id: 'r', role: 'runner', name: 'Pell Rook', trait: 'keen', xp: 0, trip: null, gear: {} }], monster: { id, heard: T0, comes: T0 + 3 * D, got: MONSTERS.kinds[id].order.map(() => 0) }, ...o });

test('the hunt opens with the sightings, not the rumour; one runner at a time; as dangerous as the kind', () => {
  const s = beastShop('wight'), p = s.staff[0];
  assert.equal(Mon.huntOpen(s, T0 + H), false, 'the rumour: not yet');
  assert.equal(St.sendRunner(s, 'beast', T0 + H), false);
  assert.ok(Mon.huntOpen(s, T0 + D + H));
  const bare = Run.risk(s, p, 'beast', T0 + D + H);
  assert.ok(Math.abs(bare.hurt - MONSTERS.hunt.kinds.wight.danger.hurt) < 1e-9, 'not doubled by its being about');
  assert.ok(Run.risk(beastShop('deep'), p, 'beast', T0 + D + H).hurt > bare.hurt, 'the deep thing worse than the wight');
  const plain = Run.beastOdds(s, p); p.gear.weapon = { pattern: 'falchion', tier: 'common', metal: 'silver' };
  assert.ok(Math.abs(Run.beastOdds(s, p) - plain - MONSTERS.hunt.silver - MONSTERS.hunt.fight) < 1e-9, 'silver against the wight');
  assert.ok(St.sendRunner(s, 'beast', T0 + D + H)); assert.ok(s.monster.hunting); assert.equal(Mon.huntOpen(s, T0 + D + H) && !s.monster.hunting, false);
});

test('brought down: it won\'t come, a bounty, renown, its material and its trophy; got away: it still comes', () => {
  const s = beastShop('deep'), c0 = s.coins, r0 = s.renown, at = T0 + D + H;
  const won = Mon.hunt(s, () => 0, at, 0.5);
  assert.ok(won.won); assert.equal(s.monster.done, 'hunted'); assert.ok(s.coins > c0); assert.equal(s.renown, r0 + MONSTERS.hunt.kinds.deep.renown);
  assert.equal(s.mats.heartstone, 1); assert.equal(Mon.trophiesOf(s)[0].name, MONSTERS.hunt.kinds.deep.trophy);
  assert.equal(Mon.strike(s, T0 + 4 * D, () => 0), null, 'it never comes'); assert.equal(Mon.roadX(s, at + H), 1);
  assert.equal(Mon.huntOpen(s, at + H), false, 'once');
  const other = beastShop('wolves'); assert.ok(Mon.hunt(other, () => 0, at, 1, T0 - D).away, 'another one since: nothing to bring down');
  const t = beastShop('wolves'), lost = Mon.hunt(t, () => 0.99, at, 0.5);
  assert.ok(lost.away); assert.ok(!t.monster.done); assert.ok(Mon.strike(t, T0 + 4 * D, () => 0), 'the night still comes');
});

test('a kept-off monster can still be hunted until a day after; a runner sent comes back with it', () => {
  const s = beastShop('wolves'); s.monster.done = 'kept'; s.monster.doneAt = T0 + 2 * D;
  assert.ok(Mon.huntOpen(s, T0 + 2 * D + H));
  s.staff[0].xp = 0; assert.ok(St.sendRunner(s, 'beast', T0 + 2 * D + H)); s.staff[0].trip.odds = 1;
  const back = St.resolveTrips(s, T0 + 2 * D + H + ROUTES.beast.h * H + 1, () => 0.5);
  assert.equal(back.length, 1); assert.ok(back[0].beast.won || back[0].road.died); assert.equal(s.monster.hunting, false);
});

test('a Relic one of the Nine still grows from is at stake; not once that Mythic is made, and never a plain piece', async () => {
  const relic = { id: 'g', pattern: 'falchion', tier: 'relic', relic: 'gatewarden', name: 'Gatewarden', worth: 5000 };
  const { MYTHICS } = await import('../js/data.js'), m = Object.keys(MYTHICS).find(k => MYTHICS[k].relic === 'gatewarden');
  assert.equal(Sh.mythicAtStake({ mythicsMade: [] }, relic), m);
  assert.equal(Sh.mythicAtStake({ mythicsMade: [m] }, relic), null, 'its Mythic made: nothing at stake');
  assert.equal(Sh.mythicAtStake({}, { ...relic, tier: 'oldblood', relic: undefined }), null);
});
