// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// THE APPRENTICE (milestone 36, docs/LEGACY-PLAN.md), with no page access: a member of the staff who works at the bench on the
// shop's clock (open, and away up to the cap). Plain pieces (Common or Fine) of patterns the shop knows, at a station it owns, from
// the back room's common materials. Their own trade in each pattern grows with each piece, faster while you work beside them,
// never past trade 5: a master is made, not trained.
import { APPRENTICE, PATTERNS, MATS } from './data.js?v=79';
import { levelOf, xpToNext, makePiece } from './rules.js?v=79';
import { recipe, short, takeMats, knows, inBack, sells, priceOf, buy } from './shop.js?v=79';
import { owns } from './room.js?v=79';
import * as Wear from './wear.js?v=79';

const A = APPRENTICE, PICKS = [0, 0, 0];
export const apprenticeOf = save => (save.staff || []).find(p => p.role === 'apprentice');
// the most a pattern's trade can hold: all the way to `top`, no further
export const TOP_XP = (() => { let x = 0; for (let l = 1; l < A.top; l++) x += xpToNext(l); return x; })();
export const skillOf = (p, id) => levelOf(Math.min(TOP_XP, ((p.skill || {})[id]) || 0)).level;
// their trades, best first: [{ id, level }]
export const skills = p => Object.keys(p.skill || {}).map(id => ({ id, level: skillOf(p, id) })).sort((a, b) => b.level - a.level || PATTERNS[a.id].name.localeCompare(PATTERNS[b.id].name));
// minutes of the shop's clock a piece takes them
export const minutesEach = p => A.every * (p.trait === 'swift' ? A.swift : 1);

// they buy what's short (common things only) from a supplier selling it this hour, while the purse keeps A.keep over; OFF: the back only
export const buys = p => !!p && p.buys !== false;
// what they'll make, and why not: a pattern the shop knows, at a station it owns and isn't broken, from common things in the back
// (or bought, if they may)
export function gate(save, id, now, p) {
  const pat = PATTERNS[id];
  if (!pat || pat.makes) return { ok: false, why: 'not a piece' };
  if (!knows(save, id)) return { ok: false, why: 'a pattern you don\'t know' };
  const st = pat.station || 'forge';
  if (!owns(save, st)) return { ok: false, why: 'no ' + st + ' set up' };
  if (Wear.isBroken(save, st, now)) return { ok: false, why: 'the ' + st + ' is broken' };
  const rec = recipe(id, PICKS);
  if (rec.some(r => MATS[r.mat] && (MATS[r.mat].rare || MATS[r.mat].relic))) return { ok: false, why: 'it takes a rare thing' };
  const sh = short(save.mats || {}, rec), hour = Math.floor((now || 0) / 3600000);
  if (sh.length && buys(p) && sh.every(r => sells(r.mat, hour, save))) {
    const cost = sh.reduce((c, r) => c + priceOf(r.mat, hour, save) * (r.n - r.have), 0);
    if ((save.coins || 0) - cost >= A.keep) return { ok: true, rec, buy: sh, cost };
  }
  if (sh.length) return { ok: false, why: 'short of ' + sh.map(r => (MATS[r.mat] || { name: r.mat }).name.toLowerCase()).join(', '), short: sh };
  return { ok: true, rec };
}
// all they could make now
export const makeable = (save, now, p) => Object.keys(PATTERNS).filter(id => gate(save, id, now, p).ok);
// the next piece: the one set at the bench, or (WHAT'S SHORT) the pattern fewest of in the back, their best first among those
// never more of a kind than will sell: no more than A.most of a pattern waiting in the back room
export function next(save, p, now) {
  if (p.bench === 'rest') return { id: null, why: 'resting: you\'ve set them to rest' };
  const back = inBack(save), n = id => back.filter(c => c.pattern === id).length;
  if (p.bench) {
    if (n(p.bench) >= A.most) return { id: null, why: PATTERNS[p.bench].name + ': ' + (A.most === 2 ? 'two' : A.most) + ' waiting in the back already' };
    const g = gate(save, p.bench, now, p); return g.ok ? { id: p.bench } : { id: null, why: PATTERNS[p.bench].name + ': ' + g.why };
  }
  const can = makeable(save, now, p).filter(id => n(id) < A.most).sort((a, b) => n(a) - n(b) || skillOf(p, b) - skillOf(p, a) || a.localeCompare(b));
  return can.length ? { id: can[0] } : { id: null, why: 'nothing they can make that isn\'t waiting in the back already' };
}
// one piece, made by their hand: Common, or Fine now and then; flawed more often while they're learning
export function makeOne(save, p, id, rng, now) {
  const g = gate(save, id, now, p); if (!g.ok) return null;
  const spared = p.trait === 'thrifty' && rng() < A.thrifty, hour = Math.floor(now / 3600000);
  let spent = 0;
  if (!spared && g.buy) for (const r of g.buy) { const b = save.coins; if (!buy(save, r.mat, r.n - r.have, hour)) return null; spent += b - save.coins; }
  if (!spared && !takeMats(save, g.rec)) return null;
  const l = skillOf(p, id);
  const fine = rng() < Math.min(A.fine[2], A.fine[0] + A.fine[1] * (l - 1));
  const flawed = rng() < Math.max(A.flaw[2], A.flaw[0] - A.flaw[1] * (l - 1)) * (p.trait === 'careful' ? A.careful : 1);
  const cracks = flawed ? 2 : rng() < 0.3 ? 1 : 0;
  const result = { tier: fine ? 1 : 0, flawed, worked: Math.round(2 * l + rng() * 8), strikes: 16 + Math.floor(rng() * 10), heats: 2, cracks };
  const piece = makePiece({ patternId: id, picks: PICKS, result, picked: null, maker: p.name, rng, now });
  piece.byApprentice = true;
  save.cards.unshift(piece);
  Wear.addWear(save, PATTERNS[id].station || 'forge', 'work', now);
  // they learn: faster beside you, never past the top
  const beside = save.benchAt && now - save.benchAt < A.besideMin * 60000;
  p.skill = p.skill || {};
  p.skill[id] = Math.min(TOP_XP, (p.skill[id] || 0) + A.learn * (p.trait === 'bright' ? 1.5 : 1) * (beside ? A.beside : 1));
  p.xp = (p.xp || 0) + (p.trait === 'bright' ? 1.5 : 1);
  p.made = (p.made || 0) + 1;
  p.spent = (p.spent || 0) + spent;
  return { piece, spared, beside, spent };
}
// the shop's clock runs on by dt seconds: a piece each time their minutes come round. Unpaid, they stop. Returns the pieces made.
export function step(save, dt, rng, now) {
  const p = apprenticeOf(save); if (!p || save.unpaid) return [];
  const need = minutesEach(p) * 60, out = [];
  p.benchT = (p.benchT || 0) + dt;
  while (p.benchT >= need) {
    const n = next(save, p, now);
    if (!n.id) { p.benchT = need - 60; break; }   // nothing to make: they wait at the bench and look again a minute of the clock later
    p.benchT -= need;
    const r = makeOne(save, p, n.id, rng, now); if (r) out.push(r);
  }
  return out;
}
