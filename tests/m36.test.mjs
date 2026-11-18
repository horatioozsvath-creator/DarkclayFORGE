// Milestone 36: the apprentice. A member of the staff from FAMED who makes plain pieces at the bench on the shop's clock, from
// common things in the back (bought when short, if they may), learns as they go (faster beside you), never past trade 5.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as Ap from '../js/apprentice.js';
import * as St from '../js/staff.js';
import * as Sh from '../js/shop.js';
import { APPRENTICE, ROLES, TRAITS, PATTERNS, MATS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const NOW = 1e12, MIN = 60;
const shop = (o = {}) => ({ coins: 0, renown: 500, gentle: true, maker: 'T', cards: [], shelf: [], slots: 4, ledger: [], queue: [], found: ['ember'], trades: {}, stations: [], mats: {},
  staff: [{ id: 'a1', role: 'apprentice', name: 'Pip Hollis', trait: 'bright', xp: 0 }], ...o });
const apOf = s => Ap.apprenticeOf(s);

test('a new kind of staff from FAMED: four traits; looking for work only once the shop is FAMED', () => {
  assert.equal(ROLES.apprentice.rung, 4); assert.equal(TRAITS.apprentice.length, 4);
  const seen = renown => { const out = new Set(); for (let h = 0; h < 400; h++) St.candidates({ renown, staff: [] }, h).forEach(c => out.add(c.role)); return out; };
  assert.ok(!seen(399).has('apprentice'), 'not before FAMED'); assert.ok(seen(400).has('apprentice'));
  const s = shop({ coins: 10000, staff: [] }), c = { id: 'h1-2', role: 'apprentice', name: 'Pip Hollis', trait: 'careful', xp: 0 };
  assert.ok(St.hire(s, c)); assert.ok(!St.canHireRole(s, 'apprentice'), 'one at a time');
});

test('at the bench: a piece every 30 minutes of the clock from common things in the back, fewest-in-the-back first, two of a kind at most', () => {
  const s = shop({ mats: { iron: 20, cord: 10, wrap: 10 } });
  assert.deepEqual(Ap.step(s, 29 * MIN, seeded(1), NOW), [], 'not yet');
  const r = Ap.step(s, 1 * MIN, seeded(1), NOW); assert.equal(r.length, 1);
  const c = r[0].piece; assert.ok(['common', 'fine'].includes(c.tier)); assert.ok(c.byApprentice); assert.equal(c.maker, 'Pip Hollis');
  assert.ok(Sh.inBack(s).includes(c), 'into the back room');
  Ap.step(s, 300 * MIN, seeded(2), NOW);
  const kinds = {}; Sh.inBack(s).forEach(x => kinds[x.pattern] = (kinds[x.pattern] || 0) + 1);
  assert.ok(Object.values(kinds).every(n => n <= APPRENTICE.most), JSON.stringify(kinds));
  for (const id of Object.keys(kinds)) assert.ok(!Sh.recipe(id, [0, 0, 0]).some(x => MATS[x.mat].rare || MATS[x.mat].relic), id);
  assert.equal(apOf(s).made, Sh.inBack(s).length);
});

test('set to a pattern, or to rest; unpaid, they stop; short and not buying, they wait', () => {
  const s = shop({ mats: { iron: 20, cord: 10 } }); apOf(s).bench = 'dagger';
  Ap.step(s, 120 * MIN, seeded(3), NOW);
  assert.ok(s.cards.length === APPRENTICE.most && s.cards.every(c => c.pattern === 'dagger'));
  assert.match(Ap.next(s, apOf(s), NOW).why, /waiting in the back/);
  s.cards = []; apOf(s).bench = 'rest'; assert.deepEqual(Ap.step(s, 600 * MIN, seeded(3), NOW), []);
  delete apOf(s).bench; s.unpaid = true; assert.deepEqual(Ap.step(s, 600 * MIN, seeded(3), NOW), []);
  const bare = shop(); apOf(bare).buys = false; assert.equal(Ap.step(bare, 600 * MIN, seeded(4), NOW).length, 0);
  assert.match(Ap.next(bare, apOf(bare), NOW).why, /nothing they can make/);
});

test('short of something common, they buy it while 300 c stays in the purse', () => {
  const s = shop({ coins: 2000 }), hour = Math.floor(NOW / 3600000);
  assert.ok(Sh.sells('iron', hour, s) && Sh.sells('cord', hour, s));
  apOf(s).bench = 'dagger'; const r = Ap.step(s, 30 * MIN, seeded(5), NOW);
  assert.equal(r.length, 1); assert.ok(r[0].spent > 0 && s.coins === 2000 - r[0].spent); assert.equal(apOf(s).spent, r[0].spent);
  const poor = shop({ coins: APPRENTICE.keep }); apOf(poor).bench = 'dagger';
  assert.deepEqual(Ap.step(poor, 600 * MIN, seeded(5), NOW), [], 'never below the purse they keep');
});

test('they learn: a trade a piece, twice as fast beside you, never past trade 5', () => {
  const a = shop({ mats: { iron: 400, cord: 200 } }), b = shop({ mats: { iron: 400, cord: 200 }, benchAt: NOW - 5 * 60000 });
  [a, b].forEach(s => { apOf(s).trait = 'careful'; apOf(s).bench = 'dagger'; Ap.makeOne(s, apOf(s), 'dagger', seeded(6), NOW); });
  assert.equal(apOf(b).skill.dagger, 2 * apOf(a).skill.dagger, 'beside you');
  for (let i = 0; i < 300; i++) Ap.makeOne(a, apOf(a), 'dagger', seeded(i), NOW);
  assert.equal(Ap.skillOf(apOf(a), 'dagger'), APPRENTICE.top); assert.equal(apOf(a).skill.dagger, Ap.TOP_XP);
  // better hands: more Fine and fewer flawed at trade 5 than at trade 1
  const tally = lvlXp => { const s = shop({ mats: { iron: 999, cord: 999 } }); let fine = 0, flawed = 0; for (let i = 0; i < 400; i++) { apOf(s).skill = { dagger: lvlXp }; const r = Ap.makeOne(s, apOf(s), 'dagger', seeded(100 + i), NOW); if (r.piece.tier === 'fine') fine++; if (r.piece.flawed) flawed++; } return { fine, flawed }; };
  const lo = tally(0), hi = tally(Ap.TOP_XP); assert.ok(hi.fine > lo.fine * 2 && hi.flawed < lo.flawed, JSON.stringify({ lo, hi }));
});

test('the traits: Swift a quarter sooner; Thrifty now and then for nothing; Careful half the flaws', () => {
  const p = { trait: 'swift' }; assert.equal(Ap.minutesEach(p), APPRENTICE.every * APPRENTICE.swift);
  const s = shop({ mats: { iron: 999, cord: 999 } }); apOf(s).trait = 'thrifty'; let spared = 0;
  for (let i = 0; i < 400; i++) if (Ap.makeOne(s, apOf(s), 'dagger', seeded(i), NOW).spared) spared++;
  assert.ok(spared > 60 && spared < 140, spared + ' of 400');
  const flaws = trait => { const t = shop({ mats: { iron: 999, cord: 999 } }); apOf(t).trait = trait; let n = 0; for (let i = 0; i < 600; i++) if (Ap.makeOne(t, apOf(t), 'dagger', seeded(i), NOW).piece.flawed) n++; return n; };
  assert.ok(flaws('careful') < flaws('swift') * 0.7);
});

test('away: they work up to the away cap and the summary says so; their sales bring a quarter of the renown', () => {
  const s = shop({ coins: 200, mats: { iron: 50, cord: 50, wrap: 50 }, lastSeen: NOW }); apOf(s).buys = false;
  const sum = St.catchUp(s, NOW + 2 * 3600000, seeded(7));
  assert.ok(sum && sum.made.length === 4, (sum && sum.made.length) + ' made in two hours'); assert.equal(sum.apprentice, 'Pip Hollis');
  assert.equal(Sh.fameOf({ byApprentice: true }), APPRENTICE.renown); assert.equal(Sh.fameOf({}), 1);
});
