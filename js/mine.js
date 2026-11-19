// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// THE MINE (milestone 45, docs/MINE-PLAN.md), with no page access: a trapdoor in the shop's floor from KNOWN, a mine under it worked
// at the face (a working like the stations', rules.js with FACE), its galleries opened one at a time, and the ore smelted at the forge.
// Each region has its own mine (the Reach's under the shop, Wheal Isel under Saltby): save.mine.galleries keeps how far down each is.
import { MINE, PATTERNS, METALS, MATS } from './data.js?v=70';
import { levelOf, partOptions } from './rules.js?v=70';
import { rung } from './growth.js?v=70';
import * as Rg from './region.js?v=70';

// the region's working at the face, and its mine's name
export const digOf = save => MINE.dig[Rg.regionId(save)] || MINE.dig.reach;
export const nameOf = save => MINE.names[Rg.regionId(save)] || MINE.names.reach;
// the trapdoor: there to open from KNOWN; open once it's been opened (in any region: the mine under this shop is the region's)
export const canOpen = save => !save.mine && rung(save) >= MINE.rung;
export const isOpen = save => !!save.mine;
export function open(save, now) {
  if (save.mine) return { why: 'it\'s open' };
  if (rung(save) < MINE.rung) return { why: 'the shop has to be KNOWN first' };
  save.mine = { at: now, galleries: { [Rg.regionId(save)]: 1 } };
  return { ok: true };
}
// how far down this region's mine is (0: not opened here yet; the first gallery opens with the trapdoor, in either region)
export const galleries = save => !save.mine ? 0 : (save.mine.galleries || {})[Rg.regionId(save)] || 1;
// the mining trade: one between the regions (the Reach's DIGGING and the coast's share it: tradeAs)
export const level = save => levelOf(((save.trades || {}).dig || {}).xp || 0).level;
// the seams of this region's mine: { i (the pick), id, seam, open (its gallery's open), level (the trade it takes) }
export function seams(save) {
  const g = galleries(save);
  return partOptions(digOf(save))[0].opts.map((o, i) => ({ i, id: o.id, seam: METALS[o.id], ore: o.ore, open: o.gallery <= g, gallery: o.gallery, level: o.level || 1 }));
}
// the next gallery down: what it takes, and what's short
export function nextGallery(save) {
  const g = galleries(save), next = MINE.galleries[g + 1];
  if (!g || !next) return null;
  const why = [];
  if (level(save) < next.level) why.push('trade ' + next.level + ' in mining');
  if ((save.coins || 0) < next.coins) why.push(next.coins + ' c');
  for (const [m, n] of Object.entries(next.mats || {})) if (((save.mats || {})[m] || 0) < n) why.push(n + ' ' + MATS[m].name.toLowerCase() + (n > 1 ? 's' : ''));
  return { n: g + 1, ...next, ok: !why.length, why };
}
export function openGallery(save) {
  const nx = nextGallery(save);
  if (!nx) return { why: 'there\'s no further down yet' };
  if (!nx.ok) return { why: nx.why.join(', ') };
  save.coins -= nx.coins;
  for (const [m, n] of Object.entries(nx.mats || {})) { save.mats[m] -= n; if (!save.mats[m]) delete save.mats[m]; }
  save.mine.galleries = { ...(save.mine.galleries || {}), [Rg.regionId(save)]: nx.n };
  return { ok: true, n: nx.n };
}
// a seam can be worked: the mine open here, its gallery open, the trade there
export function canDig(save, i) {
  const s = seams(save)[i];
  if (!s) return { why: 'no such seam' };
  if (!galleries(save)) return { why: 'the mine isn\'t open' };
  if (!s.open) return { why: 'its gallery isn\'t open' };
  if (level(save) < s.level) return { why: 'trade ' + s.level + ' in mining' };
  return { ok: true };
}
// the ores in the store room, and the bars each smelts to (the forge's SMELTING: one working takes a pattern's bars of ore)
export function ores(save) {
  return partOptions('smelt', save)[0].opts.map((o, i) => ({ i, id: o.id, bar: o.bar, have: (save.mats || {})[o.id] || 0 }));
}
export const smeltTakes = () => PATTERNS.smelt.bars;
