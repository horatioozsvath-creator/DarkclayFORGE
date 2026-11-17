// Milestone 23: monsters, the Watch's order, the night it comes, the wards.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../js/monsters.js';
import * as Run from '../js/runner.js';
import * as T from '../js/thieves.js';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import { MONSTERS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const H = 3600000, D = 24 * H, always = () => 0;
let n = 0;
const piece = (pattern, tier = 0, pick = 0, o = {}) => ({ ...R.makePiece({ patternId: pattern, picks: [pick, 0, 0], result: { tier, flawed: false, worked: 10, strikes: 10, heats: 1, cracks: 0 }, maker: 'T', rng: seeded(++n), now: n }), id: 'm' + n, ...o });
const shop = (o = {}) => ({ coins: 5000, renown: 60, threatsFrom: 0, cards: [], shelf: [], staff: [], ...o });   // KNOWN

test('something threatens the town: from its rung, once a day at most, one at a time; rumour, sighted, due in three days', () => {
  assert.equal(M.plan(shop({ renown: 10 }), 0, always), null, 'nothing comes for a small shop');
  assert.equal(M.plan(shop({ gentle: true }), 0, always), null);
  const s = shop(); const m = M.plan(s, 10 * D, always); assert.equal(m.id, 'wolves', 'only wolves at KNOWN');
  assert.equal(M.plan(s, 10 * D + H, always), null);
  assert.equal(M.stageOf(s, 10 * D + H), 'rumour'); assert.equal(M.stageOf(s, 11 * D + H), 'sighted'); assert.equal(M.stageOf(s, 13 * D), 'due');
  assert.equal(M.plan(s, 11 * D, always), null, 'one at a time');
});

test('arming the Watch: only what they asked for, paid half again; filled in time, it\'s kept off (renown); then gone', () => {
  const s = shop(); M.plan(s, 0, always);
  const axe = piece('axe'), axe2 = piece('axe'), helm = piece('helm'), arrows = piece('arrows'), arrows2 = piece('arrows');
  s.cards.push(axe, axe2, helm, arrows, arrows2);
  assert.ok(M.give(s, 0, helm.id, H).why);
  const r = M.give(s, 0, axe.id, H); assert.ok(r.ok); assert.equal(r.pay, Math.round(axe.worth * 1.5)); assert.ok(!s.cards.includes(axe));
  M.give(s, 0, axe2.id, H); assert.ok(M.give(s, 0, piece('dagger').id, H).why, 'enough blades (and not in the back room)');
  M.give(s, 1, arrows.id, H); const last = M.give(s, 1, arrows2.id, H); assert.ok(last.kept); assert.equal(M.stageOf(s, 5 * D), 'kept');
  assert.equal(s.renown, 60 + MONSTERS.kinds.wolves.renown); assert.equal(M.strike(s, 5 * D, always), null, 'it never came');
  M.plan(s, 10 * D, () => 0.999); assert.equal(s.monster, null, 'gone a day after');
});

test('the night it comes: a bill, a shelf knocked over (safe in the back room), customers scared; wards soften it', () => {
  const s = shop(), cards = [piece('axe'), piece('dagger'), piece('helm'), piece('ring')]; s.cards = cards; s.shelf = cards.map(c => ({ id: c.id, tag: 'fair' }));
  M.plan(s, 0, always); assert.equal(M.strike(s, 2 * D, always), null, 'not yet');
  const r = M.strike(s, 3 * D, always); assert.equal(r.bill, MONSTERS.kinds.wolves.damage * 3 / 2, 'KNOWN: rung 2'); assert.equal(r.knocked.length, 3);
  assert.equal(s.cards.length, 4, 'knocked off, not lost'); assert.equal(s.shelf.filter(Boolean).length, 1);
  M.tidy(s, 3 * D + H); assert.ok(s.scared); assert.ok(Sh.eventGap(s) > 1.5); M.tidy(s, 5 * D); assert.ok(!s.scared);
  const w = shop(), oil = piece('oil', 2, 0, { count: 3 }), pane = piece('pane', 2); w.cards = [oil, pane];
  assert.ok(M.addWard(w, oil.id).ok); assert.equal(oil.count, 2, 'one bottle'); assert.ok(M.addWard(w, pane.id).ok); assert.ok(M.addWard(w, oil.id).ok); assert.ok(M.addWard(w, oil.id).why, 'three at most');
  assert.ok(M.wardCut(w) > 0.5); M.plan(w, 0, always); const r2 = M.strike(w, 3 * D, always); assert.ok(r2.bill < MONSTERS.kinds.wolves.damage * 3 / 4);
  assert.ok(M.takeWard(w, 0).ok); assert.equal(M.wardsOf(w).length, 2);
});

test('while it\'s about every road is twice as dangerous; wards keep some thieves off too', () => {
  const s = shop({ renown: 600, staff: [{ id: 'r', role: 'runner', name: 'Kit', xp: 0 }] }), p = s.staff[0];
  const before = Run.risk(s, p, 'reach', 0).hurt; M.plan(s, 0, always); assert.equal(Run.risk(s, p, 'reach', D).hurt, before * 2);
  const t = shop({ renown: 200 }), base = T.doorOdds(t).in; t.wards = [piece('pane', 3), piece('lens', 3)]; assert.ok(T.doorOdds(t).in < base);
});
