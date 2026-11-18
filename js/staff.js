// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// The staff and the clock, with no page access: hiring, wages, the runner's trips, and the shop while the page is closed.
// Time comes in as plain milliseconds (Date.now() on the page, fixed numbers in the tests).
import { ROLES, TRAITS, NAMES, ROUTES, RUNNER_CAP, RENOWN, AWAY_CAP_H, MATS, FOUND, PATTERNS, ROOM_SIZES, RELICS, BLUEPRINT_DEEP, MYTHICS } from './data.js?v=60';
import { levelOf, makePiece, partOptions } from './rules.js?v=60';
import { awayStep } from './shop.js?v=60';
import { wageMult, capBonus, rung } from './growth.js?v=60';
import * as Trail from './trail.js?v=60';
import { TRAIL, MONSTERS } from './data.js?v=60';
import * as Run from './runner.js?v=60';
import * as Mon from './monsters.js?v=60';

const H = 3600000;
function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (list, rng) => list[Math.floor(rng() * list.length)];

// ---------- the people ----------
export const levelOfP = p => levelOf(p.xp || 0).level;
export const wageOf = p => ROLES[p.role].wage + levelOfP(p) - 1;
export const wages = save => (save.staff || []).reduce((w, p) => w + wageOf(p), 0) * wageMult(save);
export const clerkOf = save => (save.staff || []).find(p => p.role === 'clerk');
export const runnerOf = save => (save.staff || []).find(p => p.role === 'runner');
export const runners = save => (save.staff || []).filter(p => p.role === 'runner');
// how many runners the shop can take on, and the next step up: { cap, next: { n, rung } | null }
export const runnerCap = save => RUNNER_CAP.filter(([r]) => rung(save) >= r).pop()[1];
export const nextRunner = save => { const n = RUNNER_CAP.find(([r]) => rung(save) < r); return n ? { n: n[1], word: RENOWN[n[0]].word } : null; };
// how many of a role can be hired now (a clerk and a guard: one each)
export const roleCap = (save, role) => role === 'runner' ? runnerCap(save) : 1;
export const canHireRole = (save, role) => (save.staff || []).filter(p => p.role === role).length < roleCap(save, role);
// runners home, paid and on their feet: ready to be sent out
export const readyRunners = (save, now) => save.unpaid ? [] : runners(save).filter(p => !p.trip && !Run.hurtNow(p, now));
export const guardOf = save => (save.staff || []).find(p => p.role === 'guard');
export const traitOf = p => TRAITS[p.role].find(t => t.id === p.trait);
export function gain(p, n) { p.xp = (p.xp || 0) + n * (p.trait === 'quick' ? 1.5 : 1); }
// a clerk away: the share of the tag price that reaches the till; minding the shop while you work: how much more readily walk-ins buy
export function clerkTerms(p) {
  const l = levelOfP(p);
  return { name: p.name.split(' ')[0], rate: Math.min(0.97, 0.8 + 0.02 * (l - 1) + (p.trait === 'silver' ? 0.05 : 0)), boost: 1.3 + 0.03 * (l - 1), restock: p.restock !== false, tidy: p.trait === 'tidy' && p.restock !== false };
}
// hours of away time the shop is kept for
export const awayCap = save => (save.awayCapH || AWAY_CAP_H) + ((clerkOf(save) || {}).trait === 'early' ? 2 : 0) + ((ROOM_SIZES[(save.room || {}).size || 0] || {}).capH || 0) + capBonus(save) + lanternHours(save);
// a lantern hung by the door among the wards (milestone 33): an hour more (one lantern is enough: a second adds no more)
export const lanternHours = save => (save.wards || []).some(c => c && c.pattern === 'lantern') ? MONSTERS.wards.lanternH : 0;

// who's looking for work this hour: three, at least one of each role, none already hired
export function candidates(save, hour) {
  const rng = seeded(hour * 7919 + 13), taken = new Set((save.staff || []).map(p => p.name));
  const out = [];
  for (let i = 0; i < 3; i++) {
    const roles = Object.keys(ROLES).filter(r => !ROLES[r].rung || rung(save) >= ROLES[r].rung);   // a night guard from SOUGHT
    const role = i === 0 ? 'clerk' : i === 1 ? 'runner' : pick(roles.length > 2 && rng() < 0.6 ? roles.slice(2) : roles, rng);
    const names = NAMES.filter(n => !taken.has(n)); const name = pick(names, rng); taken.add(name);
    const xp = [0, 0, 5, 5, 20][Math.floor(rng() * 5)];   // level 1, 1, 2, 2, 3
    const c = { id: 'h' + hour + '-' + i, role, name, trait: pick(TRAITS[role], rng).id, xp };
    if (!(save.hiredIds || []).includes(c.id)) out.push(c);
  }
  return out;
}
export const hireFee = c => wageOf(c) * 20;
export function hire(save, c) {
  save.staff = save.staff || [];
  if (!canHireRole(save, c.role) || (save.staff || []).some(p => p.name === c.name) || save.coins < hireFee(c) || (save.hiredIds || []).includes(c.id)) return false;
  save.coins -= hireFee(c);
  save.staff.push({ id: c.id, role: c.role, name: c.name, trait: c.trait, xp: c.xp, trip: null });
  save.hiredIds = (save.hiredIds || []).concat(c.id).slice(-30);
  return true;
}
export function letGo(save, id) {
  const p = (save.staff || []).find(x => x.id === id);   // what they carried comes back to the back room (the potions go with them)
  if (p) { Object.values(p.gear || {}).forEach(c => save.cards.unshift(c)); if (p.trip && ROUTES[p.trip.route].hunt && save.robbery) save.robbery.hunting = false; if (p.trip && ROUTES[p.trip.route].beast && save.monster) save.monster.hunting = false; }
  save.staff = (save.staff || []).filter(p => p.id !== id); if (!save.staff.length) { save.owed = 0; save.unpaid = false; } }

// ---------- wages ----------
// Owed by the second, paid by the coin as the purse allows. More than an hour's wages behind, the staff are unpaid: the runner
// won't set out. The clerk keeps selling (the takings pay what's owed). What's owed never runs past the away cap's worth.
export function payWages(save, dt) {
  if (!(save.staff || []).length) return 0;
  const w = wages(save);
  save.owed = Math.min(w * awayCap(save), (save.owed || 0) + w * dt / 3600);
  const n = Math.min(Math.floor(save.owed), Math.max(0, save.coins));
  if (n > 0) { save.coins -= n; save.owed -= n; }
  save.unpaid = save.owed >= w;
  return n;
}
export const working = save => !save.unpaid;

// ---------- the runner's roads ----------
export const tripHours = (p, route) => ROUTES[route].h * (p.trait === 'surefoot' ? 0.8 : 1);
// id: which runner (the first, when it isn't given). Only one runner goes after a gang at a time.
export function sendRunner(save, route, now, id) {
  const p = id ? runners(save).find(x => x.id === id) : runnerOf(save), r = ROUTES[route];
  if (!p || p.trip || !r || save.unpaid || save.coins < r.fee || (r.rung && rung(save) < r.rung) || Run.hurtNow(p, now) || (r.hunt && (!Run.huntOpen(save, now) || save.robbery.hunting))
    || (r.beast && (!Mon.huntOpen(save, now) || save.monster.hunting))) return false;
  save.coins -= r.fee;
  p.trip = { route, left: now, back: now + tripHours(p, route) * H };
  if (r.hunt) { p.trip.odds = Run.huntOdds(save, p); save.robbery.hunting = true; }
  if (r.beast) { p.trip.odds = Run.beastOdds(save, p); p.trip.heard = save.monster.heard; save.monster.hunting = true; }
  return true;
}
export const COMMONS = ['iron', 'iron', 'iron', 'bronze', 'bronze', 'steel', 'wrap', 'cord', 'ash', 'wool', 'strap', 'horn', 'rowan', 'silk', 'sharkhide', 'deer', 'deer', 'goat', 'gut', 'linen', 'yew', 'birch', 'goose', 'bone'];
const RARES = Object.keys(MATS).filter(id => MATS[id].rare);
export const RELIC_MATS = Object.keys(MATS).filter(id => MATS[id].relic);
export function haul(save, p, route, rng, now) {
  const r = ROUTES[route], l = levelOfP(p), mats = {};
  // the Deep can come back with nothing much: a few common things, no more
  // a good weapon: fewer trips below that come to nothing
  if (r.empty && rng() < r.empty * 6 / (6 + Run.strength(p).fight)) { for (let i = 0; i < 2; i++) { const m = pick(COMMONS, rng); mats[m] = (mats[m] || 0) + 1; } return { mats, piece: null, tile: null, empty: true }; }
  if (r.relic) { for (const odds of r.relic) if (rng() < odds) { const m = pick(RELIC_MATS, rng); mats[m] = (mats[m] || 0) + 1; } }
  // a blueprint, now and then: one of the Deep's still to be found
  let blueprint = null;
  if (r.relic && rng() < BLUEPRINT_DEEP) {
    // any blueprint still to be found, one for a station the maker is good at (trade 7 and up in something there) if there is one.
    // On the trail of the Nine, one a Mythic grows from first (milestone 35)
    const left = Object.keys(RELICS).filter(k => !(save.blueprints || []).includes(k) && !(save.relicsMade || []).includes(k));
    const nine = Trail.open(save) ? left.filter(k => Object.values(MYTHICS).some(m => m.relic === k)) : [], pool = nine.length ? nine : left;
    const good = pool.filter(k => Trail.stationLevel(save, PATTERNS[RELICS[k].pattern].station || 'forge') >= 7);
    if (pool.length) blueprint = pick(good.length ? good : pool, rng);
  }
  const n = Math.round((r.commons[0] + rng() * (r.commons[1] - r.commons[0])) * (1 + 0.08 * (l - 1)) * (p.trait === 'keen' ? 1.2 : 1) * Run.packBonus(p));
  for (let i = 0; i < n; i++) { const m = pick(COMMONS, rng); mats[m] = (mats[m] || 0) + 1; }
  for (let i = 0; i < r.rare; i++) { const m = pick(RARES, rng); mats[m] = (mats[m] || 0) + 1; }
  if (r.gem && rng() < r.gem) mats.gem = (mats.gem || 0) + 1;
  let piece = null, tile = null;
  if (r.piece && rng() < r.piece) {
    const ids = Object.keys(PATTERNS).filter(k => !PATTERNS[k].makes), pattern = pick(ids, rng), metals = partOptions(pattern)[0].opts;
    piece = makePiece({ patternId: pattern, picks: [Math.floor(rng() * Math.min(3, metals.length)), 0, 0],
      result: { tier: rng() < 0.35 ? 1 : 0, flawed: false, worked: Math.floor(rng() * 20), strikes: 20, heats: 2, cracks: Math.floor(rng() * 3) }, maker: 'an old maker', rng, now });
  }
  const missing = Object.keys(FOUND).filter(id => !save.found.includes(id));
  if (r.tile && missing.length && rng() < r.tile * (p.trait === 'lucky' ? 2 : 1)) tile = pick(missing, rng);
  // on the trail of the Nine: a shard that lies below, now and then
  let shard = null; const below = r.relic ? Trail.pending(save, 'deep') : [];
  if (below.length && rng() < TRAIL.deep) shard = pick(below, rng);
  // a star's shard, now and then, carried down where it fell long ago: the star falls on the same days in every shop, and can go
  // weeks without falling (milestone 35)
  const fell = !shard && r.relic ? Trail.pending(save, 'star') : [];
  if (fell.length && rng() < TRAIL.starBelow) shard = pick(fell, rng);
  return { mats, piece, tile, blueprint, shard };
}
// trips that have come home by `now`: their hauls put away. Returns what each brought.
export function resolveTrips(save, now, rng) {
  const out = [];
  for (const p of save.staff || []) {
    if (!p.trip || now < p.trip.back) continue;
    const route = p.trip.route, at = p.trip.back, odds = p.trip.odds;
    // the hunt: decided as they reach the gang; then the road's danger (milestone 22). Killed: nothing comes home but what the Watch
    // brings back (their gear); the gang, if caught, still caught
    if (ROUTES[route].hunt) {
      const hu = Run.hunt(save, p, rng, at, odds || 0), d = Run.road(save, p, route, rng, at); if (save.robbery) save.robbery.hunting = false;
      p.trip = null;
      if (d.died) Run.lose(save, p, route, at); else gain(p, 1 + Math.ceil(ROUTES[route].h));
      out.push({ who: p.name, route, at, mats: {}, hunt: hu, road: d }); continue;
    }
    // the beast (milestone 34): the road's danger first (as dangerous as the kind), then, if they live, the hunt
    if (ROUTES[route].beast) {
      const d = Run.road(save, p, route, rng, at), b = d.died ? Mon.hunt(save, () => 1, at, 0) : Mon.hunt(save, rng, at, odds || 0, p.trip.heard);
      p.trip = null;
      if (d.died) Run.lose(save, p, route, at); else gain(p, 1 + Math.ceil(ROUTES[route].h));
      out.push({ who: p.name, route, at, mats: {}, beast: b, road: d }); continue;
    }
    const h = haul(save, p, route, rng, at), d = Run.road(save, p, route, rng, at);
    if (d.died) { p.trip = null; Run.lose(save, p, route, at); out.push({ who: p.name, route, at, mats: {}, road: d }); continue; }
    Object.entries(h.mats).forEach(([m, n]) => { save.mats[m] = (save.mats[m] || 0) + n; });
    if (h.piece) save.cards.unshift(h.piece);
    if (h.tile) save.found.push(h.tile);
    if (h.blueprint) save.blueprints = [...new Set((save.blueprints || []).concat(h.blueprint))];
    if (h.shard) Trail.give(save, h.shard);
    gain(p, 1 + Math.ceil(ROUTES[route].h));
    p.trip = null;
    out.push({ who: p.name, route, at, ...h, road: d });
  }
  return out;
}

// ---------- away ----------
// The page was closed (or hidden) from save.lastSeen to `to`. Up to the away cap, the clerk (if paid) sells from the shelf and
// wages are paid; trips come home on the real clock whatever the cap. A save that never recorded lastSeen was away no time at all.
// Returns a summary, or null when nothing worth telling happened.
export function catchUp(save, to, rng) {
  const from = save.lastSeen;
  save.lastSeen = to;
  if (!from || to <= from) return null;
  const elapsed = (to - from) / 1000, counted = Math.min(elapsed, awayCap(save) * 3600);
  const sum = { elapsed, counted, capped: elapsed > counted, sold: [], restocked: [], coins: 0, cut: 0, missed: 0, wages: 0, trips: [], unpaid: false, clerk: null };
  const c = clerkOf(save);
  for (let t = 0; t < counted; t += 60) {
    const dt = Math.min(60, counted - t), at = from + (t + dt) * 1000;
    const terms = c ? clerkTerms(c) : null;   // sales first: a broke shop's clerk earns the wage
    const r = awayStep(save, dt, rng, at, terms);
    sum.sold.push(...r.sold); r.sold.forEach(e => e.restocked && sum.restocked.push(e.restocked.name)); sum.restocked.push(...(r.tidied || [])); sum.missed += r.missed; sum.cut += r.cut;
    if (terms) { sum.clerk = terms.name; r.sold.forEach(() => gain(c, 1)); }
    sum.wages += payWages(save, dt);
    if (save.unpaid) sum.unpaid = true;
  }
  sum.coins = sum.sold.reduce((a, e) => a + e.sold.price, 0);
  save.sold = (save.sold || 0); save.earned = (save.earned || 0);
  sum.trips = resolveTrips(save, to, rng);
  // worth telling: a sale, a trip home, wages behind, or customers who found no one to serve them
  if (!sum.sold.length && !sum.trips.length && !sum.unpaid && !(sum.missed && !c)) return null;
  return sum;
}
