// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// THE GROW-BED (milestone 52, docs/JACKPOT-PLAN.md), with no page access: a piece grown, not forged. Set up in the workshop from
// FAMED, a second bed from RENOWNED. A living cutting (heartwood, old bone, red coral) is planted toward a pattern it can be the main
// part of; it comes up GROWBED.days later on the shop's clock, open or away. Tended once a day it comes up better; missed, it still
// comes up, plainer (a miss takes nothing away). What comes up is rolled as it's lifted out: the tier at the bed's odds, a mark far
// likelier than at the anvil, a Rare tended every day now and then woken to Old-Blood, and every piece from the bed grown (milestone 51).
// save.growbed: set up; save.beds: [{ mat, pattern, at, tended: [the days tended], told }] or null, one a bed.
import { GROWBED as B, PATTERNS, MATS, TIERS } from './data.js?v=81';
import { makePiece, partOptions, canGrow, luckOn, markKind } from './rules.js?v=81';
import { rung } from './growth.js?v=81';
import { knows, noteMark } from './shop.js?v=81';
import { owns, firstFree } from './room.js?v=81';
import * as Rg from './region.js?v=81';

const D = 24 * 3600000, OLD_BLOOD = 3;
// how many beds: none till it's set up, one, a second from RENOWNED once it's been bought
export const cap = save => !save.growbed ? 0 : save.growbed >= 2 ? 2 : 1;
export const bedsOf = save => { const n = cap(save), b = (save.beds || []).slice(0, n); while (b.length < n) b.push(null); return b; };
// setting it up, or the second bed: what it costs, and why not
export function canBuild(save) {
  if (!luckOn()) return { why: 'the luck is off' };
  const more = !!save.growbed, need = more ? B.more : B;
  if (more && cap(save) >= 2) return { why: 'yours already' };
  if (rung(save) < need.rung) return { why: 'a shop ' + (need.rung === B.more.rung ? 'RENOWNED' : 'FAMED'), cost: need.cost, more };
  if ((save.coins || 0) < need.cost) return { why: 'not enough coin', cost: need.cost, more };
  if (!more && !(save.workshop && firstFree(save.workshop, 'growbed', 'growbed'))) return { why: 'no room in the workshop: move things, or make it bigger', cost: need.cost, more };
  return { ok: true, cost: need.cost, more };
}
export function build(save) {
  const c = canBuild(save);
  if (!c.ok) return c;
  save.coins -= c.cost;
  if (c.more) save.growbed = 2;
  else { save.workshop.items.push(firstFree(save.workshop, 'growbed', 'growbed')); save.growbed = 1; }
  save.beds = bedsOf(save);
  return { ok: true, cost: c.cost, more: c.more };
}
// the patterns a cutting can be grown toward here: the cutting's, ones the shop knows, at a station it has
export const patternsFor = (save, mat) => ((B.cuttings[mat] || {}).patterns || []).filter(id => PATTERNS[id] && canGrow(id) && knows(save, id)
  && owns(save, PATTERNS[id].station || 'forge'));
export const cuttings = () => Object.keys(B.cuttings);
// a planted bed's state at `now`: the day it's on (0 first), whether today's tending is done, ready to lift out
export function stateOf(bed, now) {
  if (!bed) return null;
  const day = Math.floor((now - bed.at) / D), ready = now >= bed.at + B.days * D;
  return { day: Math.min(day, B.days - 1), ready, tended: (bed.tended || []).length, due: !ready && !(bed.tended || []).includes(day), left: Math.max(0, bed.at + B.days * D - now) };
}
export function plant(save, i, mat, pattern, now) {
  const beds = bedsOf(save);
  if (i < 0 || i >= beds.length) return { why: 'no such bed' };
  if (beds[i]) return { why: 'something is growing there' };
  if (!B.cuttings[mat]) return { why: 'that won\'t grow' };
  if (!((save.mats || {})[mat] > 0)) return { why: 'no ' + MATS[mat].name.toLowerCase() };
  if (!patternsFor(save, mat).includes(pattern)) return { why: MATS[mat].name + ' won\'t grow into that here' };
  save.mats[mat]--; if (!save.mats[mat]) delete save.mats[mat];
  beds[i] = { mat, pattern, at: now, tended: [] }; save.beds = beds;
  return { ok: true };
}
// once a day: water, light, turning it on its stake
export function tend(save, i, now) {
  const bed = bedsOf(save)[i], s = stateOf(bed, now);
  if (!s) return { why: 'nothing planted' };
  if (!s.due) return { why: s.ready ? 'it\'s come up' : 'tended today already' };
  bed.tended = (bed.tended || []).concat(s.day);
  return { ok: true, day: s.day, tended: bed.tended.length };
}
// the beds that have come up and haven't been told of yet (marks them told)
export function newlyUp(save, now) {
  return bedsOf(save).map((b, i) => ({ b, i })).filter(({ b }) => b && !b.told && stateOf(b, now).ready).map(({ b, i }) => { b.told = true; return { i, pattern: b.pattern, mat: b.mat }; });
}
// the part the cutting stands for on the card: the first of its picks the pattern takes, in its first part that has one
function picksFor(pattern, mat) {
  const parts = partOptions(pattern), want = (B.cuttings[mat] || {}).picks || [], picks = parts.map(() => 0);
  for (const id of want) { const k = parts.findIndex(p => p.opts.some(o => (o.id || o.mat) === id)); if (k >= 0) { picks[k] = parts[k].opts.findIndex(o => (o.id || o.mat) === id); break; } }
  return picks;
}
// what comes up, as rolled: { tier, woke, mark }. Tended days lift the odds; a miss takes nothing away.
export function roll(tended, rng) {
  const t = Math.max(0, Math.min(B.days, tended | 0)), [c, f] = B.tier[t], r = rng() * 100;
  let tier = r < c ? 0 : r < c + f ? 1 : 2, woke = false;
  if (tier === 2 && t >= B.days && rng() < B.wake) { tier = OLD_BLOOD; woke = true; }
  const mark = rng() < B.mark[t] ? markKind(rng) : null;
  return { tier, woke, mark };
}
// lift it out: the piece onto the back room's pile, the bed empty. Returns { card, tended, woke, mark } or why not.
export function harvest(save, i, rng, now) {
  const bed = bedsOf(save)[i], s = stateOf(bed, now);
  if (!s) return { why: 'nothing planted' };
  if (!s.ready) return { why: 'it hasn\'t come up yet' };
  const tended = Math.min(B.days, s.tended), r = roll(tended, rng);
  const card = makePiece({ patternId: bed.pattern, picks: picksFor(bed.pattern, bed.mat), result: { tier: r.tier, worked: 20, strikes: 20, heats: 1, cracks: 0, flawed: false,
    ...(r.mark ? { mark: r.mark } : {}), ...(r.woke ? { woke: true } : {}), grown: true }, picked: null, maker: save.maker, rng, now });
  card.grown = { ...card.grown, bed: whereOf(save), tended };
  // no working: who grew it, whether the blood woke, and what it's of (the working's strikes and heats don't belong on it)
  card.made = ['Grown in the bed by ' + save.maker, ...(r.woke ? ['woke in the earth'] : []), (card.made || []).slice(-1)[0] || ''];
  card.cutting = bed.mat;
  if (card.mark) card.firstMark = noteMark(save, card);   // the book's marks, and the Collector's (milestone 49)
  save.cards.unshift(card);
  const beds = bedsOf(save); beds[i] = null; save.beds = beds;
  save.bedGrown = (save.bedGrown || 0) + 1;
  return { ok: true, card, tended, woke: r.woke, mark: r.mark, tier: TIERS[r.tier] };
}
// "Ada Vane's, in the Reach" (or "in Saltby"): whose bed, and where
export const whereOf = save => (save.maker + '\'s, in ' + (Rg.isReach(save) ? Rg.nameOf(save) : Rg.townName(save))).slice(0, 40);
// a runner's road turns up a cutting now and then, once there's a bed to plant it in (the luck on): after the haul's own dice
export function roadFind(save, route, rng) {
  if (!luckOn() || !save.growbed) return null;
  for (const [mat, roads] of Object.entries(B.finds)) if (roads[route] && rng() < roads[route]) return mat;
  return null;
}
