// The staff and the clock, with no page access: hiring, wages, the runner's trips, and the shop while the page is closed.
// Time comes in as plain milliseconds (Date.now() on the page, fixed numbers in the tests).
import { ROLES, TRAITS, NAMES, ROUTES, AWAY_CAP_H, MATS, FOUND, PATTERNS, ROOM_SIZES } from './data.js?v=12';
import { levelOf, makePiece, partOptions } from './rules.js?v=12';
import { awayStep } from './shop.js?v=12';
import { wageMult, capBonus } from './growth.js?v=12';

const H = 3600000;
function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (list, rng) => list[Math.floor(rng() * list.length)];

// ---------- the people ----------
export const levelOfP = p => levelOf(p.xp || 0).level;
export const wageOf = p => ROLES[p.role].wage + levelOfP(p) - 1;
export const wages = save => (save.staff || []).reduce((w, p) => w + wageOf(p), 0) * wageMult(save);
export const clerkOf = save => (save.staff || []).find(p => p.role === 'clerk');
export const runnerOf = save => (save.staff || []).find(p => p.role === 'runner');
export const traitOf = p => TRAITS[p.role].find(t => t.id === p.trait);
export function gain(p, n) { p.xp = (p.xp || 0) + n * (p.trait === 'quick' ? 1.5 : 1); }
// a clerk away: the share of the tag price that reaches the till; minding the shop while you work: how much more readily walk-ins buy
export function clerkTerms(p) {
  const l = levelOfP(p);
  return { name: p.name.split(' ')[0], rate: Math.min(0.97, 0.8 + 0.02 * (l - 1) + (p.trait === 'silver' ? 0.05 : 0)), boost: 1.3 + 0.03 * (l - 1) };
}
// hours of away time the shop is kept for
export const awayCap = save => (save.awayCapH || AWAY_CAP_H) + ((clerkOf(save) || {}).trait === 'early' ? 2 : 0) + ((ROOM_SIZES[(save.room || {}).size || 0] || {}).capH || 0) + capBonus(save);

// who's looking for work this hour: three, at least one of each role, none already hired
export function candidates(save, hour) {
  const rng = seeded(hour * 7919 + 13), taken = new Set((save.staff || []).map(p => p.name));
  const out = [];
  for (let i = 0; i < 3; i++) {
    const role = i === 0 ? 'clerk' : i === 1 ? 'runner' : pick(['clerk', 'runner'], rng);
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
  if (save.staff.some(p => p.role === c.role) || save.coins < hireFee(c) || (save.hiredIds || []).includes(c.id)) return false;
  save.coins -= hireFee(c);
  save.staff.push({ id: c.id, role: c.role, name: c.name, trait: c.trait, xp: c.xp, trip: null });
  save.hiredIds = (save.hiredIds || []).concat(c.id).slice(-30);
  return true;
}
export function letGo(save, id) { save.staff = (save.staff || []).filter(p => p.id !== id); if (!save.staff.length) { save.owed = 0; save.unpaid = false; } }

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
export function sendRunner(save, route, now) {
  const p = runnerOf(save), r = ROUTES[route];
  if (!p || p.trip || !r || save.unpaid || save.coins < r.fee) return false;
  save.coins -= r.fee;
  p.trip = { route, left: now, back: now + tripHours(p, route) * H };
  return true;
}
const COMMONS = ['iron', 'iron', 'iron', 'bronze', 'bronze', 'steel', 'wrap', 'cord', 'ash', 'wool', 'strap', 'horn', 'rowan', 'silk', 'sharkhide', 'deer', 'deer', 'goat', 'gut', 'linen', 'yew', 'birch', 'goose', 'bone'];
const RARES = Object.keys(MATS).filter(id => MATS[id].rare);
export function haul(save, p, route, rng, now) {
  const r = ROUTES[route], l = levelOfP(p), mats = {};
  const n = Math.round((r.commons[0] + rng() * (r.commons[1] - r.commons[0])) * (1 + 0.08 * (l - 1)) * (p.trait === 'keen' ? 1.2 : 1));
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
  return { mats, piece, tile };
}
// trips that have come home by `now`: their hauls put away. Returns what each brought.
export function resolveTrips(save, now, rng) {
  const out = [];
  for (const p of save.staff || []) {
    if (!p.trip || now < p.trip.back) continue;
    const route = p.trip.route, at = p.trip.back, h = haul(save, p, route, rng, at);
    Object.entries(h.mats).forEach(([m, n]) => { save.mats[m] = (save.mats[m] || 0) + n; });
    if (h.piece) save.cards.unshift(h.piece);
    if (h.tile) save.found.push(h.tile);
    gain(p, 1 + Math.ceil(ROUTES[route].h));
    p.trip = null;
    out.push({ who: p.name, route, at, ...h });
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
  const sum = { elapsed, counted, capped: elapsed > counted, sold: [], coins: 0, cut: 0, missed: 0, wages: 0, trips: [], unpaid: false, clerk: null };
  const c = clerkOf(save);
  for (let t = 0; t < counted; t += 60) {
    const dt = Math.min(60, counted - t), at = from + (t + dt) * 1000;
    const terms = c ? clerkTerms(c) : null;   // sales first: a broke shop's clerk earns the wage
    const r = awayStep(save, dt, rng, at, terms);
    sum.sold.push(...r.sold); sum.missed += r.missed; sum.cut += r.cut;
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
