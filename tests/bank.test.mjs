// Milestone 19: the Bank.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as B from '../js/bank.js';
import * as R from '../js/rules.js';
import { BANK } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const W = BANK.week;
const piece = (pattern, tier, i) => ({ ...R.makePiece({ patternId: pattern, picks: [0, 0, 0], result: { tier, flawed: false, worked: 10, strikes: 10, heats: 1, cracks: 0 }, maker: 'T', rng: seeded(i), now: i }), id: 'p' + i });
const shop = (o = {}) => ({ coins: 1000, renown: 60, cards: [], shelf: [null, null, null, null], slots: 4, wall: [], ...o });   // KNOWN

test('deposits: in and out, safe; 1 % a week, capped; a week counts once however long away', () => {
  const s = shop();
  assert.ok(B.deposit(s, 600, 0).ok); assert.equal(s.coins, 400); assert.equal(B.bankOf(s).deposit, 600); assert.equal(B.bankOf(s).due, W);
  assert.ok(B.deposit(s, 99999, 0).ok); assert.equal(s.coins, 0, 'no more than the purse');
  assert.equal(B.weekly(s, W - 1), null, 'not yet');
  const w = B.weekly(s, W * 5); assert.equal(w.earned, 10); assert.equal(B.bankOf(s).deposit, 1010);
  assert.equal(B.bankOf(s).due, W * 6, 'away five weeks: one week counted, the next a week from now');
  const rich = shop(); B.deposit(rich, 1000, 0); B.bankOf(rich).deposit = 1e6; assert.equal(B.weekly(rich, W).earned, BANK.depositCap);
  assert.ok(B.withdraw(s, 10).ok); assert.equal(s.coins, 10); assert.ok(B.withdraw(s, 1e9).ok); assert.equal(B.bankOf(s).deposit, 0); assert.equal(B.bankOf(s).due, 0, 'nothing in: the week stops');
});

test('loans: by renown, from KNOWN; 5 % a week from the purse then the bank; repaid any time', () => {
  assert.ok(B.borrow(shop({ renown: 10 }), 100, 0).why, 'not lent below KNOWN');
  const s = shop(); assert.equal(B.limitOf(s), 1000);
  assert.ok(B.borrow(s, 1001, 0).why); assert.ok(B.borrow(s, 800, 0).ok); assert.equal(s.coins, 1800); assert.equal(B.canBorrow(s), 200);
  const w = B.weekly(s, W); assert.equal(w.interest, 40); assert.equal(w.paid, 40); assert.equal(s.coins, 1760); assert.equal(B.bankOf(s).loan, 800);
  s.coins = 10; B.bankOf(s).deposit = 100; const w2 = B.weekly(s, W * 2); assert.equal(w2.unpaid, 0); assert.equal(s.coins, 0); assert.equal(B.bankOf(s).deposit, 71, '100, +1 interest, -30 toward the loan');
  s.coins = 900; assert.ok(B.repay(s, 300).ok); assert.equal(B.bankOf(s).loan, 500); assert.ok(B.repay(s, 1e9).ok); assert.equal(B.bankOf(s).loan, 0); assert.equal(s.coins, 100);
  assert.ok(B.repay(s, 5).why, 'nothing owed');
});

test('a missed week: the letter and a fee; the second: the bailiff, the shelf\'s best toward it, never a Relic; the debt is capped', () => {
  const relic = { ...piece('falchion', 4, 9), tier: 'relic' }, good = piece('axe', 2, 2), poor = piece('dagger', 0, 3);
  const s = shop({ cards: [relic, good, poor], shelf: [{ id: relic.id, tag: 'fair' }, { id: good.id, tag: 'fair' }, { id: poor.id, tag: 'fair' }, null] });
  B.borrow(s, 1000, 0); s.coins = 0;
  const w1 = B.weekly(s, W); assert.equal(w1.unpaid, 50); assert.equal(w1.fee, 5); assert.equal(B.bankOf(s).loan, 1055); assert.equal(B.bankOf(s).missed, 1); assert.equal(w1.bailiff, null);
  const w2 = B.weekly(s, W * 2); assert.ok(w2.bailiff); assert.equal(w2.bailiff.took[0].name, good.name, 'the best first');
  assert.ok(s.cards.includes(relic) && s.shelf[0], 'never a Relic'); assert.ok(!s.cards.includes(good)); assert.equal(B.bankOf(s).missed, 0);
  assert.equal(s.renown, 60 - BANK.bailiffRenown);
  const c = shop(); B.borrow(c, 1000, 0); c.coins = 0; for (let k = 1; k < 60; k++) { B.weekly(c, W * k); }
  assert.ok(B.bankOf(c).loan <= 2000, 'never past twice what was borrowed');
});

test('the gentler Reach and the week of grace', () => {
  const s = shop(); B.fixThreats(s, 0); assert.ok(!B.threatsOn(s, 1)); assert.ok(B.threatsOn(s, BANK.grace));
  s.gentle = true; assert.ok(!B.threatsOn(s, BANK.grace * 9));
  const n = shop({ threatsFrom: 0 }); B.fixThreats(n, 5); assert.equal(n.threatsFrom, 0, 'a new game set its own');
});
