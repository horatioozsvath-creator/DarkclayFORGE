// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// MONSTERS, with no page access: something threatens the town (the rumour, the sightings, the night it comes); the Watch's order to
// arm them, filled from the back room; the night it comes if it isn't; and the wards (an oil, a lens, a pane) that soften it.
// Spared on a gentler Reach (bank.js).
import { MONSTERS, GEAR, TIERS } from './data.js?v=53';
import { rung } from './growth.js?v=53';
import { threatsOn } from './bank.js?v=53';

const H = 3600000, D = 24 * H;
const TIER_N = Object.fromEntries(TIERS.map((t, i) => [t.id, i]));
export const kindOf = m => m && MONSTERS.kinds[m.id];
// what it is now: 'rumour' (the first day), 'sighted', 'came' or 'kept' (done), or null
export function stageOf(save, now) {
  const m = save.monster; if (!m) return null;
  if (m.done) return m.done;
  return now >= m.comes ? 'due' : now < m.heard + D ? 'rumour' : 'sighted';
}
// once a day: something may start to threaten the town (one at a time; gone a day after it's done)
export function plan(save, now, rng) {
  const d = Math.floor(now / D);
  if (save.monsterDay === d) return null;
  save.monsterDay = d;
  if (save.monster && save.monster.done && now > save.monster.doneAt + MONSTERS.afterD * D) save.monster = null;
  if (save.monster || !threatsOn(save, now) || rng() >= 1 / MONSTERS.odds) return null;
  const kinds = Object.keys(MONSTERS.kinds).filter(k => rung(save) >= MONSTERS.kinds[k].rung); if (!kinds.length) return null;
  const id = kinds[Math.floor(rng() * kinds.length)], k = MONSTERS.kinds[id];
  save.monster = { id, heard: now, comes: now + MONSTERS.warnD * D, got: k.order.map(() => 0) };
  return save.monster;
}
// the Watch's order: a piece that answers a line of it
export const fitsLine = (line, c) => !c.sample && line.any.includes(c.pattern) && TIER_N[c.tier] >= line.least && (!line.metal || c.metal === line.metal) && c.tier !== 'relic' && c.tier !== 'mythic';
export const lineLeft = (save, i) => { const m = save.monster, l = kindOf(m).order[i]; return Math.max(0, l.n - (m.got[i] || 0)); };
export const orderDone = save => kindOf(save.monster).order.every((l, i) => lineLeft(save, i) === 0);
// hand a piece to the Watch: paid half again its worth (a batch: one bottle's worth of it); the order filled in time keeps it off
export function give(save, i, cardId, now) {
  const m = save.monster, st = stageOf(save, now);
  if (!m || st === 'came' || st === 'kept' || st === 'due') return { why: 'the Watch has no order now' };
  const line = kindOf(m).order[i], c = save.cards.find(x => x.id === cardId);
  if (!line || !c || !fitsLine(line, c)) return { why: 'not what the Watch asked for' };
  if (!lineLeft(save, i)) return { why: 'they have enough of those' };
  const pay = Math.round(c.worth * MONSTERS.pays); save.coins += pay;
  save.cards = save.cards.filter(x => x !== c); m.got[i] = (m.got[i] || 0) + 1;
  const out = { ok: true, pay };
  if (orderDone(save)) { m.done = 'kept'; m.doneAt = now; save.renown = (save.renown || 0) + kindOf(m).renown; out.kept = true; out.renown = kindOf(m).renown; }
  return out;
}
// ---------- the wards: an oil (one bottle), a lens or a pane, set about the shop ----------
const powerOf = c => Math.max(0, GEAR.power[c.tier] - (c.flawed ? 1 : 0));
export const wardsOf = save => save.wards || (save.wards = []);
export const canWard = c => !c.sample && MONSTERS.wards.pieces.includes(c.pattern);
export const wardPower = save => wardsOf(save).reduce((a, c) => a + powerOf(c), 0);
export const wardCut = save => { const p = wardPower(save); return p / (p + MONSTERS.wards.soft); };
export function addWard(save, cardId) {
  const c = save.cards.find(x => x.id === cardId);
  if (!c || !canWard(c)) return { why: 'not something to ward with' };
  if (wardsOf(save).length >= MONSTERS.wards.max) return { why: 'three wards at most' };
  if (c.pattern === 'oil' && (c.count || 1) > 1) { c.count--; wardsOf(save).push({ ...c, id: c.id + '-w' + Math.floor(Math.random() * 1e9).toString(36), count: 1 }); }
  else { save.cards = save.cards.filter(x => x !== c); wardsOf(save).push(c); }
  return { ok: true };
}
export function takeWard(save, i) { const c = wardsOf(save)[i]; if (!c) return { why: 'nothing there' }; wardsOf(save).splice(i, 1); save.cards.unshift(c); return { ok: true }; }
// ---------- the night it comes (when it's due, the order short) ----------
export function strike(save, now, rng) {
  const m = save.monster; if (!m || m.done || now < m.comes) return null;
  m.done = 'came'; m.doneAt = now;
  if (!threatsOn(save, now)) return null;
  const k = kindOf(m), cut = wardCut(save);
  const bill = Math.min(save.coins, Math.round(k.damage * (1 + rung(save)) / 2 * (1 - cut))); save.coins -= bill;   // a bigger shop, more to mend
  // a shelf knocked over: up to three places' pieces into the back room (safe), fewer with wards
  const full = (save.shelf || []).map((e, i) => e ? i : -1).filter(i => i >= 0), n = Math.round(3 * (1 - cut));
  const knocked = [];
  for (let j = 0; j < n && full.length; j++) { const i = full.splice(Math.floor(rng() * full.length), 1)[0]; const c = save.cards.find(x => x.id === save.shelf[i].id); if (c) knocked.push(c.name); save.shelf[i] = null; }
  save.scaredUntil = now + k.fearH * H; save.scared = true;
  return { name: k.name, line: k.lines[2], bill, knocked, cut, fearH: k.fearH };
}
// customers scared off for a while after; the roads twice as dangerous while it's about (sighted until a day after)
export function tidy(save, now) { save.scared = !!(save.scaredUntil && now < save.scaredUntil); }
export function roadX(save, now) {
  const m = save.monster; if (!m || m.done === 'kept') return 1;
  return now >= m.heard && now < (m.doneAt || m.comes) + D ? MONSTERS.roadX : 1;
}
