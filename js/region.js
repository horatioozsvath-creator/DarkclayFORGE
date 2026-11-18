// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// THE REGIONS (milestone 39), with no page access: where a save works (save.region; none is the Reach) and the region's own tables.
// The Reach's are data.js's own tables, so a Reach save plays exactly as before; another region names only what differs (REGIONS).
import { REGIONS, SUPPLIERS, CUSTOMERS, SELLERS, ROUTES, THIEVES, MONSTERS, TOWN_HOT, TOWN_COLD, TOWN_EVENTS, SEASONS, RENOWN, REACH_RUNG, MATS } from './data.js?v=64';

export const REACH = 'reach';
export const idOf = r => (r && REGIONS[r] ? r : REACH);
export const regionId = save => idOf(save && save.region);
export const regionOf = save => REGIONS[regionId(save)];
export const isReach = save => regionId(save) === REACH;
export const nameOf = save => regionOf(save).name;
export const townName = save => regionOf(save).town;

const memo = {};
const once = (key, f) => key in memo ? memo[key] : (memo[key] = f());
// a region's tables, by its id: its own, or the Reach's
const own = (id, k, base) => REGIONS[idOf(id)][k] || base;

// ---------- buying ----------
export const suppliersIn = id => own(id, 'suppliers', SUPPLIERS);
export const suppliers = save => suppliersIn(regionId(save));
// what comes from far off costs more here (× 1 in the Reach)
export const dearOf = (save, mat) => (regionOf(save).dear || {})[mat] || 1;
// a material sold in the region (staple or a pedlar's), at any hour
export const soldIn = (id, mat) => suppliersIn(id).some(s => s.lines.includes(mat) || (s.rare || []).includes(mat));

// ---------- who comes in: the Reach's kinds, with the region's names, wants and weights ----------
export const customersIn = id => idOf(id) === REACH ? CUSTOMERS
  : once('cust:' + id, () => CUSTOMERS.map(c => ({ ...c, ...((REGIONS[id].customers || {})[c.id] || {}) })));
export const customers = save => customersIn(regionId(save));
export const sellers = save => own(regionId(save), 'sellers', SELLERS);
export const sellMats = (save, base) => own(regionId(save), 'sellMats', base);
export const sellRare = (save, base) => own(regionId(save), 'sellRare', base);

// ---------- the runner's roads: the same roads, in the region's words ----------
export const routesIn = id => idOf(id) === REACH ? ROUTES
  : once('routes:' + id, () => Object.fromEntries(Object.entries(ROUTES).map(([k, r]) => [k, { ...r, ...((REGIONS[id].routes || {})[k] || {}) }])));
export const routes = save => routesIn(regionId(save));
export const commons = (save, base) => own(regionId(save), 'commons', base);
// the rare things a runner can find: the region's own, and not another region's
export const raresIn = id => once('rares:' + idOf(id), () => Object.keys(MATS).filter(k => MATS[k].rare && (idOf(id) === REACH ? !MATS[k].coast : soldIn(id, k) || !MATS[k].coast)));

// ---------- threats ----------
export const gangs = save => own(regionId(save), 'gangs', THIEVES.gangs);
// a monster kind (by the region it came in), in that region's words
export const monsterKind = (kindId, region) => {
  const k = MONSTERS.kinds[kindId]; if (!k || idOf(region) === REACH) return k;
  return once('mon:' + region + ':' + kindId, () => ({ ...k, ...((REGIONS[region].monsters || {})[kindId] || {}) }));
};
export const huntKind = (kindId, region) => {
  const k = MONSTERS.hunt.kinds[kindId]; if (!k || idOf(region) === REACH) return k;
  return once('hunt:' + region + ':' + kindId, () => ({ ...k, ...((REGIONS[region].hunts || {})[kindId] || {}) }));
};

// ---------- the town: its notice board, events and seasons, by the town's region ----------
export const hotIn = id => own(id, 'hot', TOWN_HOT);
export const coldIn = id => own(id, 'cold', TOWN_COLD);
export const eventsIn = id => own(id, 'events', TOWN_EVENTS);
export const seasonsIn = id => own(id, 'seasons', SEASONS);
export const gossip = (save, base) => own(regionId(save), 'gossip', base);
export const rivals = (save, base) => own(regionId(save), 'rivals', base);
export const news = (save, k, base) => ((regionOf(save).news || {})[k]) || base;

// ---------- renown: the top rung is the region's own ----------
export const rungWord = (save, i) => i === REACH_RUNG ? regionOf(save).top : RENOWN[i].word;
