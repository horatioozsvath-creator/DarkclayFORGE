// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// THIEVES, with no page access: a gang heard of first (the rumour), then their nights: on a night away they try the shop. A lock, a
// strongbox and a night guard against them. What they take waits for the hunt (milestone 22). Spared on a gentler Reach (bank.js).
import { THIEVES, RENOWN } from './data.js?v=58';
import { rung } from './growth.js?v=58';
import { threatsOn } from './bank.js?v=58';
import { guardOf } from './staff.js?v=58';
import { wardCut } from './monsters.js?v=58';

const H = 3600000, D = 24 * H;
const dayOf = ms => Math.floor(ms / D);
export const has = (save, k) => !!(save.security || {})[k];
// the shelf's worth, for how much a gang would want this shop
const shelfWorth = save => (save.shelf || []).reduce((a, e) => { const c = e && save.cards.find(x => x.id === e.id); return a + (c ? c.worth : 0); }, 0);
// the chance, any day, that a gang starts working the lanes (0 below SOUGHT)
export function dailyOdds(save) {
  const n = THIEVES.odds[rung(save)]; if (!n) return 0;
  const f = Math.max(0.5, Math.min(1.5, 0.5 + shelfWorth(save) / (THIEVES.ref * (1 + rung(save)))));
  return f / n;
}
// on a night they come: in, turned away at the door, or caught (a guard)
export function doorOdds(save) {
  const g = guardOf(save), lock = has(save, 'lock') ? THIEVES.lock.x : 1;
  const stop = g ? (g.trait === 'stout' ? THIEVES.guard.stout : THIEVES.guard.stop) : 0;
  const caught = g ? (g.trait === 'watchful' ? THIEVES.guard.watchful : THIEVES.guard.catch) : 0;
  return { in: THIEVES.strike * lock * (1 - stop) * (1 - wardCut(save) / 2), caught };   // wards keep some off too
}
// a word for the risk tonight
export function riskWord(save, now) {
  if (!threatsOn(save, now)) return save.gentle ? 'NONE: THE GENTLER REACH' : 'NONE YET';
  if (rung(save) < THIEVES.rung) return 'NONE: TOO SMALL TO BOTHER WITH';
  const g = save.gang && now < save.gang.until ? save.gang : null, p = doorOdds(save).in;
  return g ? (p > 0.3 ? 'HIGH: A GANG IS ABOUT' : p > 0.1 ? 'SOME: A GANG IS ABOUT' : 'LOW: A GANG IS ABOUT, BUT THE DOOR IS WATCHED') : 'QUIET';
}
// once a day: a gang may start working the lanes (the rumour; their nights from tomorrow)
export function plan(save, now, rng) {
  const d = dayOf(now);
  if (save.thiefDay === d) return null;
  save.thiefDay = d;
  if (save.gang && now >= save.gang.until) save.gang = null;   // moved on
  if (save.gang || !threatsOn(save, now) || rng() >= dailyOdds(save)) return null;
  const [name, where] = THIEVES.gangs[Math.floor(rng() * THIEVES.gangs.length)];
  save.gang = { name, where, heard: now, from: now + THIEVES.warnH * H, until: now + THIEVES.warnH * H + THIEVES.stayD * D };
  return save.gang;
}
// a night away (from → to): if a gang is about and the time is long enough, they try the shop. takings: what the clerk took meanwhile
export function night(save, from, to, rng, takings = 0) {
  plan(save, from, rng);
  const g = save.gang;
  if (!g || !from || to - from < THIEVES.minAwayH * H || to < g.from || from > g.until || !threatsOn(save, to)) return null;
  const o = doorOdds(save);
  if (rng() >= o.in) {   // they didn't get in: a guard may have caught them
    if (guardOf(save) && rng() < o.caught) { save.gang = null; save.renown = (save.renown || 0) + THIEVES.caughtRenown; return { caught: true, gang: g.name, guard: guardOf(save).name }; }
    return guardOf(save) || has(save, 'lock') ? { turned: true, gang: g.name, by: guardOf(save) ? guardOf(save).name : 'the lock' } : null;
  }
  // in: the shelf's best pieces, and a share of the till
  const shelf = (save.shelf || []).map((e, i) => ({ i, c: e && save.cards.find(x => x.id === e.id) })).filter(x => x.c).sort((a, b) => b.c.worth - a.c.worth);
  const n = THIEVES.take[0] + Math.floor(rng() * (THIEVES.take[1] - THIEVES.take[0] + 1)), took = shelf.slice(0, n);
  took.forEach(x => { save.shelf[x.i] = null; });
  const ids = new Set(took.map(x => x.c.id)); save.cards = save.cards.filter(c => !ids.has(c.id));
  const till = has(save, 'strongbox') ? 0 : Math.min(save.coins, Math.round(takings * THIEVES.till)); save.coins -= till;
  const rob = { gang: g.name, where: g.where, at: to, took: took.map(x => x.c), till, trail: to + THIEVES.trailD * D };
  save.robbery = rob; save.robberies = (save.robberies || 0) + 1; save.gang = null;   // they got what they came for
  return { robbed: true, ...rob };
}
// the lock and the strongbox: bought once
export function buySecurity(save, k) {
  const c = THIEVES[k] && THIEVES[k].cost; if (!c) return { why: 'no such thing' };
  if (has(save, k)) return { why: 'yours already' };
  if (save.coins < c) return { why: 'not enough coin' };
  save.coins -= c; save.security = { ...(save.security || {}), [k]: true }; return { ok: true, cost: c };
}
export const fromRung = () => RENOWN[THIEVES.rung].word;
