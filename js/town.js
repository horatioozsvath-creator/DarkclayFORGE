// The town's wants, with no page access: what's in demand today and what's out of favour. It follows the real calendar day (UTC), so
// every player sees the same notice board on the same day. The day's pick is kept on the save (save.town) for the shop's rules.
import { TOWN_HOT, TOWN_COLD, DEMAND } from './data.js?v=18';

export const dayOf = ms => Math.floor(ms / 86400000);
function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// a day's notices: two in demand (different), one out of favour (none of its patterns in demand that day)
export function townOn(day) {
  const rng = seeded(day * 7919 + 13), hot = [];
  while (hot.length < 2) { const h = TOWN_HOT[Math.floor(rng() * TOWN_HOT.length)]; if (!hot.includes(h)) hot.push(h); }
  const want = new Set(hot.flatMap(h => h.patterns)), cold = TOWN_COLD.filter(c => !c.patterns.some(p => want.has(p)));
  return { day, hot: hot.map(h => h.id), cold: cold.length ? cold[Math.floor(rng() * cold.length)].id : null };
}
export function refreshTown(save, now) { const d = dayOf(now); if (!save.town || save.town.day !== d) save.town = townOn(d); return save.town; }
const HOT = Object.fromEntries(TOWN_HOT.map(h => [h.id, h])), COLD = Object.fromEntries(TOWN_COLD.map(c => [c.id, c]));
export const notices = town => town ? { hot: town.hot.map(id => HOT[id]).filter(Boolean), cold: COLD[town.cold] || null } : { hot: [], cold: null };
export const hotPatterns = town => [...new Set(notices(town).hot.flatMap(h => h.patterns))];
// 1 in demand, -1 out of favour, 0 neither
export function demandOf(town, pattern) {
  if (!town) return 0;
  if (hotPatterns(town).includes(pattern)) return 1;
  const c = notices(town).cold; return c && c.patterns.includes(pattern) ? -1 : 0;
}
export const purseMultFor = (town, pattern) => { const d = demandOf(town, pattern); return d > 0 ? DEMAND.purse : d < 0 ? DEMAND.cold : 1; };
