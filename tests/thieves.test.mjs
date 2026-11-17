// Milestone 21: thieves.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../js/thieves.js';
import * as St from '../js/staff.js';
import * as R from '../js/rules.js';
import { THIEVES } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const H = 3600000, D = 24 * H, always = () => 0, never = () => 0.999;
const piece = (pattern, tier, i) => ({ ...R.makePiece({ patternId: pattern, picks: [0, 0, 0], result: { tier, flawed: false, worked: 10, strikes: 10, heats: 1, cracks: 0 }, maker: 'T', rng: seeded(i), now: i }), id: 'p' + i });
function shop(o = {}) {
  const cards = [piece('axe', 2, 1), piece('falchion', 4, 2), piece('dagger', 0, 3), piece('helm', 1, 4)];
  cards[1] = { ...cards[1], tier: 'relic' };
  return { coins: 5000, renown: 200, threatsFrom: 0, cards, shelf: cards.map(c => ({ id: c.id, tag: 'fair' })), slots: 4, staff: [], ...o };   // SOUGHT
}

test('a gang: not below SOUGHT, not on a gentler Reach; heard of first, about for a few days, once a day at most', () => {
  assert.equal(T.dailyOdds(shop({ renown: 60 })), 0);
  assert.equal(T.plan(shop({ gentle: true }), 10 * D, always), null);
  const s = shop(); assert.ok(T.dailyOdds(s) > 0 && T.dailyOdds(s) < 0.1);
  const g = T.plan(s, 10 * D, always); assert.ok(g); assert.equal(g.from, 10 * D + THIEVES.warnH * H);
  assert.equal(T.plan(s, 10 * D + H, always), null, 'once a day');
  assert.equal(T.night(s, 10 * D, 10 * D + 8 * H, always), null, 'not the night they\'re first heard of');
  const r = T.plan(s, 20 * D, never); assert.equal(r, null); assert.equal(s.gang, null, 'moved on');
});

test('a night they get in: the shelf\'s best (a Relic too), a share of the takings; nothing from the till with a strongbox', () => {
  const s = shop(); T.plan(s, 10 * D, always);
  const n = s.gang.from, r = T.night(s, n, n + 8 * H, always, 1000);
  assert.ok(r.robbed); assert.equal(r.took.length, 1, 'one with the lowest roll'); assert.equal(r.took[0].tier, 'relic', 'the best first');
  assert.equal(r.till, 300); assert.equal(s.coins, 4700); assert.equal(s.cards.length, 3); assert.equal(s.shelf.filter(Boolean).length, 3);
  assert.equal(s.robbery.took[0].tier, 'relic', 'kept for the hunt'); assert.equal(s.gang, null);
  const b = shop({ security: { strongbox: true } }); T.plan(b, 10 * D, always); const rb = T.night(b, b.gang.from, b.gang.from + 8 * H, always, 1000); assert.equal(rb.till, 0);
  const short = shop(); T.plan(short, 10 * D, always); assert.equal(T.night(short, short.gang.from, short.gang.from + 2 * H, always), null, 'a short time away: not a night');
});

test('the defences: a lock lowers it; a guard turns most away and catches some (renown, the gang gone)', () => {
  const s = shop(); assert.equal(T.doorOdds(s).in, THIEVES.strike);
  s.security = { lock: true }; assert.equal(T.doorOdds(s).in, THIEVES.strike * THIEVES.lock.x);
  s.staff = [{ id: 'g', role: 'guard', name: 'Brask', trait: 'watchful', xp: 0 }];
  assert.ok(T.doorOdds(s).in < 0.1); assert.equal(St.guardOf(s).name, 'Brask');
  T.plan(s, 10 * D, always); const g = s.gang;
  const r = T.night(s, g.from, g.from + 8 * H, never); assert.ok(r.turned, 'turned away');
  s.gang = g; let caught = null; const rng = seeded(4); for (let i = 0; i < 40 && !caught; i++) { s.gang = g; const x = T.night(s, g.from, g.from + 8 * H, rng); if (x && x.caught) caught = x; }
  assert.ok(caught); assert.equal(s.gang, null); assert.ok(s.renown > 200);
  assert.ok(T.buySecurity(shop(), 'strongbox').ok); assert.ok(T.buySecurity(shop({ coins: 10 }), 'lock').why);
});

test('a night guard can be hired from SOUGHT', () => {
  const seen = new Set(); for (let h = 0; h < 60; h++) St.candidates(shop(), h).forEach(c => seen.add(c.role));
  assert.ok(seen.has('guard'));
  const low = new Set(); for (let h = 0; h < 60; h++) St.candidates(shop({ renown: 20 }), h).forEach(c => low.add(c.role));
  assert.ok(!low.has('guard'));
});
