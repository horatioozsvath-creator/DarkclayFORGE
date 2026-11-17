// Milestone 24: a living Reach.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../js/living.js';
import * as Town from '../js/town.js';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import { LIVING, SEASONS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const D = 24 * 3600000;
const piece = (pattern, tier, i) => ({ ...R.makePiece({ patternId: pattern, picks: [0, 0, 0], result: { tier, flawed: false, worked: 10, strikes: 10, heats: 1, cracks: 0 }, maker: 'T', rng: seeded(i), now: i }), id: 'l' + i });

test('the seasons turn every two weeks, round the year; their wares fetch more; summer busier, winter quieter', () => {
  const seen = []; for (let d = 0; d < 56; d += 14) seen.push(Town.seasonOf(d).id);
  assert.deepEqual(seen, SEASONS.map(s => s.id)); assert.equal(Town.seasonOf(56).id, SEASONS[0].id);
  const winter = SEASONS.findIndex(s => s.id === 'winter') * 14, town = { day: winter, hot: [], cold: null, event: null };
  assert.equal(Town.purseMultFor(town, 'jerkin'), LIVING.seasonPurse); assert.equal(Town.purseMultFor(town, 'lens'), 1);
  assert.ok(Town.livingGap(town) > 1); assert.ok(Town.livingGap({ day: 14, hot: [], cold: null }) < 1, 'summer');
  assert.ok(Sh.eventGap({ town }) > 1);
});

test('market days and fair days bring a crowd', () => {
  const market = [...Array(14).keys()].find(d => Town.marketOn(d)), fair = [...Array(28).keys()].find(d => Town.fairOn(d));
  assert.ok(market != null && fair != null); assert.ok(Town.livingGap({ day: 28 * 2 + fair }) < Town.seasonOf(28 * 2 + fair).gap);
});

test('the word in town: the same all day, true things first (a gang, the season turning), and some gossip', () => {
  const now = 10 * 14 * D + 2 * 3600000, s = { ledger: [], gang: { name: 'the river crew', until: now + D } };
  const a = L.rumours(s, now), b = L.rumours(s, now + 3600000);
  assert.deepEqual(a, b); assert.ok(a.length >= 2 && a.length <= 3);
  assert.ok(a.some(x => /river crew/.test(x)) || a.some(x => /season has turned/.test(x)));
});

test('the guild fair: once on its day; judged on worth; a prize for the first three; the piece stays yours', () => {
  const fairDay = LIVING.fair.at + 28 * 100, now = fairDay * D + 3600000;
  const s = { coins: 0, renown: 60, cards: [{ ...piece('axe', 3, 1), worth: 99999 }, piece('dagger', 0, 2)] };
  assert.ok(L.enterFair(s, s.cards[0].id, now - D, seeded(1)).why, 'not on other days');
  const r = L.enterFair(s, s.cards[0].id, now, seeded(1)); assert.equal(r.place, 1); assert.ok(r.coins > 0 && s.coins === r.coins); assert.ok(s.renown > 60);
  assert.ok(s.cards.length === 2, 'kept'); assert.ok(L.enterFair(s, s.cards[1].id, now, seeded(2)).why, 'once a fair');
  const poor = { coins: 0, renown: 60, cards: [piece('dagger', 0, 3)] }; const p2 = L.enterFair(poor, poor.cards[0].id, now, seeded(3)); assert.equal(p2.place, 4); assert.equal(p2.coins, 0);
  assert.ok(!L.fairOpen({ renown: 0 }, now), 'not for an unknown shop');
});
