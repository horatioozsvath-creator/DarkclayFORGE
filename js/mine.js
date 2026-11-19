// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// THE MINE (milestone 45, docs/MINE-PLAN.md), with no page access: a trapdoor in the shop's floor from KNOWN, a mine under it worked
// at the face (a working like the stations', rules.js with FACE), its galleries opened one at a time, and the ore smelted at the forge.
// Each region has its own mine (the Reach's under the shop, Wheal Isel under Saltby): save.mine.galleries keeps how far down each is.
// Milestone 46: the deep galleries, the shoring (save.mine.state[region][gallery]: s, the timbers left; fell, the roof's in; pumped,
// when its water was last pumped out), the water and the pockets.
import { MINE, PATTERNS, METALS, MATS, RENOWN, RELICS } from './data.js?v=73';
import { levelOf, partOptions, makePiece } from './rules.js?v=73';
import { rung } from './growth.js?v=73';
import { threatsOn } from './bank.js?v=73';
import * as Rg from './region.js?v=73';

const H = 3600000, D = 24 * H;

// the region's working at the face, and its mine's name
export const digOf = save => MINE.dig[Rg.regionId(save)] || MINE.dig.reach;
export const nameOf = save => MINE.names[Rg.regionId(save)] || MINE.names.reach;
// the trapdoor: there to open from KNOWN; open once it's been opened (in any region: the mine under this shop is the region's)
export const canOpen = save => !save.mine && rung(save) >= MINE.rung;
export const isOpen = save => !!save.mine;
// a save from release 70: its smelting pick moved when darkclay ore came in before calamine (milestone 46); once
export function fixSave(save) {
  if (save.smelt46) return;
  if (save.picks && save.picks.smelt && save.picks.smelt[0] === 3) save.picks.smelt[0] = 4;
  save.smelt46 = true;
}
export function open(save, now) {
  if (save.mine) return { why: 'it\'s open' };
  if (rung(save) < MINE.rung) return { why: 'the shop has to be KNOWN first' };
  save.mine = { at: now, galleries: { [Rg.regionId(save)]: 1 } };
  return { ok: true };
}
// how far down this region's mine is (0: not opened here yet; the first gallery opens with the trapdoor, in either region)
export const galleries = save => !save.mine ? 0 : (save.mine.galleries || {})[Rg.regionId(save)] || 1;
export const deepest = () => MINE.galleries.length - 1;
// broken through (milestone 48): this region's mine is down to the bottom, into the deep below the doors (on the coast, the drowned town)
export const atBottom = save => !!save && !!save.mine && galleries(save) >= deepest();
export const RELIC_ORE = Object.keys(MATS).filter(id => MATS[id].relic);
// a working of your own at the bottom's face: now and then a relic material in the rock (never a miner's: they don't know it), never
// twice within MINE.bottom.gapD days
export function deepFind(save, g, rng, now) {
  if (!save.mine || !(MINE.galleries[g] || {}).bottom || now - (save.mine.relicAt || 0) < MINE.bottom.gapD * D || rng() >= MINE.bottom.relic) return null;
  const m = RELIC_ORE[Math.floor(rng() * RELIC_ORE.length)]; save.mats[m] = (save.mats[m] || 0) + 1; save.mine.relicAt = now; return { mat: m };
}
// the heir's mine (milestone 48): the galleries the line opened, in every region, their shoring gone old; nothing fallen, nothing pumped
export function inherit(old, now) {
  if (!old.mine) return null;
  const galleries = { ...(old.mine.galleries || {}) }, state = {};
  for (const [r, n] of Object.entries(galleries)) { state[r] = {}; for (let g = 1; g <= n; g++) state[r][g] = { s: MINE.line.old, fell: false, pumped: 0 }; }
  return { at: now, galleries, state, from: old.maker };
}
// how deep a shop's mine went, in any region (for the line's record)
export const depthOf = save => save.mine ? Math.max(1, ...Object.values(save.mine.galleries || {})) : 0;
// a gallery's name in this region's mine
export const galleryName = (save, g) => ((MINE.gname[Rg.regionId(save)] || [])[g]) || (MINE.galleries[g] || {}).name || '';
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
  if (next.rung && rung(save) < next.rung) why.push('a shop ' + RENOWN[next.rung].word);
  if ((save.coins || 0) < next.coins) why.push(next.coins + ' c');
  for (const [m, n] of Object.entries(next.mats || {})) if (((save.mats || {})[m] || 0) < n) why.push(n + ' ' + MATS[m].name.toLowerCase() + (n > 1 ? 's' : ''));
  return { n: g + 1, ...next, name: galleryName(save, g + 1), ok: !why.length, why };
}
export function openGallery(save) {
  const nx = nextGallery(save);
  if (!nx) return { why: 'there\'s no further down yet' };
  if (!nx.ok) return { why: nx.why.join(', ') };
  save.coins -= nx.coins;
  for (const [m, n] of Object.entries(nx.mats || {})) { save.mats[m] -= n; if (!save.mats[m]) delete save.mats[m]; }
  save.mine.galleries = { ...(save.mine.galleries || {}), [Rg.regionId(save)]: nx.n };
  const st = stateOf(save, nx.n); st.s = 100; st.fell = false;
  return { ok: true, n: nx.n };
}
// a seam can be worked: the mine open here, its gallery open (not fallen in, not under water), the trade there
export function canDig(save, i, now) {
  const s = seams(save)[i];
  if (!s) return { why: 'no such seam' };
  if (!galleries(save)) return { why: 'the mine isn\'t open' };
  if (!s.open) return { why: 'its gallery isn\'t open' };
  const sh = shut(save, s.gallery, now); if (sh) return { why: sh };
  if (level(save) < s.level) return { why: 'trade ' + s.level + ' in mining' };
  return { ok: true };
}

// ---------- the shoring (milestone 46) ----------
export function stateOf(save, g) {
  const m = save.mine.state || (save.mine.state = {}), r = m[Rg.regionId(save)] || (m[Rg.regionId(save)] = {});
  return r[g] || (r[g] = { s: 100, fell: false, pumped: 0 });
}
export const shoring = (save, g) => save.mine ? stateOf(save, g).s : 0;
export const isFallen = (save, g) => !!save.mine && !!stateOf(save, g).fell;
export const isWorn = (save, g) => shoring(save, g) <= MINE.shore.worn;
// why a gallery can't be worked just now ('' if it can)
export function shut(save, g, now) {
  if (!save.mine || g > galleries(save)) return 'its gallery isn\'t open';
  if (isFallen(save, g)) return 'the roof\'s fallen in';
  if (isFlooded(save, g, now)) return 'it\'s under water';
  return '';
}
// a working at the face done in gallery g: the timbers wear, more for each rockfall (a swing too hot); worn, the roof can come in.
// { s, worn, fell } (null on a gentler Reach or in the week of grace)
export function afterDig(save, g, falls, rng, now) {
  if (!save.mine || !threatsOn(save, now)) return null;
  const sh = MINE.shore, st = stateOf(save, g), before = st.s;
  st.s = Math.max(0, st.s - sh.per - sh.perFall * (falls || 0));
  const worn = before > sh.worn && st.s <= sh.worn;
  const fell = st.s <= 0 || (st.s <= sh.worn && rng() < sh.fall * (sh.worn - st.s) / sh.worn);
  if (fell) { st.fell = true; st.s = 0; }
  return { s: st.s, worn, fell };
}
// what shoring a gallery takes: oak for the timbers worn (all of it, and coin to clear the fall, if the roof's in)
export function shoreCost(save, g) {
  const sh = MINE.shore, st = stateOf(save, g);
  if (st.fell) return { oak: sh.oak[g], coins: sh.clear[g], clear: true };
  return { oak: st.s >= 100 ? 0 : Math.max(1, Math.ceil(sh.oak[g] * (100 - st.s) / 100)), coins: 0, clear: false };
}
export function shore(save, g) {
  if (!save.mine || g > galleries(save)) return { why: 'its gallery isn\'t open' };
  const c = shoreCost(save, g), st = stateOf(save, g);
  if (!c.oak) return { why: 'it\'s shored as it is' };
  const why = [];
  if (((save.mats || {}).oak || 0) < c.oak) why.push(c.oak + ' oak stave' + (c.oak > 1 ? 's' : ''));
  if ((save.coins || 0) < c.coins) why.push(c.coins + ' c');
  if (why.length) return { why: why.join(', ') };
  save.mats.oak -= c.oak; if (!save.mats.oak) delete save.mats.oak; save.coins -= c.coins;
  st.s = 100; st.fell = false;
  return { ok: true, ...c };
}

// ---------- the water (milestone 46): the deep galleries flood after rain in the Reach, at the spring tides on the coast ----------
// the same days in every shop, as the star falls (a night's rain: the day's odds; the tides: two days in every few)
const dayRoll = d => { let t = (d * 2654435761) >>> 0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const floodsOn = (region, d) => region === Rg.REACH ? dayRoll(d) < MINE.water.rain : ((d % MINE.water.tides) + MINE.water.tides) % MINE.water.tides < 2;
// when the water last came in and is still in (0: it isn't)
export function floodFrom(save, now) {
  const w = MINE.water, r = Rg.regionId(save);
  for (let d = Math.floor(now / D); d * D + w.drainH * H > now; d--) if (floodsOn(r, d)) return d * D;
  return 0;
}
export function isFlooded(save, g, now) {
  if (!save.mine || g < MINE.water.deep || g > galleries(save) || !threatsOn(save, now)) return false;
  const f = floodFrom(save, now); return !!f && stateOf(save, g).pumped < f;
}
// when a flooded gallery drains of itself
export const drainsAt = (save, now) => floodFrom(save, now) + MINE.water.drainH * H;
export const pumpCost = g => MINE.water.pump[g] || 0;
export function pump(save, g, now) {
  if (!isFlooded(save, g, now)) return { why: 'it\'s dry' };
  const c = pumpCost(g); if ((save.coins || 0) < c) return { why: c + ' c' };
  save.coins -= c; stateOf(save, g).pumped = now; return { ok: true, cost: c };
}

// ---------- the pockets (milestone 46): a Rare haul in a deep gallery breaks into one ----------
// old coin, an old piece (as a seller's), or, from the old workings, a blueprint still to be found below. Kept in the save; what it was
export function pocket(save, g, tier, rng, now) {
  const p = MINE.pocket; if (!save.mine || g < p.from || tier < 2 || rng() >= p.odds) return null;
  if (g >= 4) {
    const left = Rg.relicsIn(Rg.regionId(save)).filter(k => RELICS[k].source === 'deep' && !(save.blueprints || []).includes(k) && !(save.relicsMade || []).includes(k));
    if (left.length && rng() < p.blueprint) { const b = left[Math.floor(rng() * left.length)]; save.blueprints = (save.blueprints || []).concat(b); return { blueprint: b }; }
  }
  if (rng() < p.piece) {
    const ids = Rg.piecePatterns(save), pattern = ids[Math.floor(rng() * ids.length)], metals = partOptions(pattern)[0].opts;
    const card = makePiece({ patternId: pattern, picks: [Math.floor(rng() * Math.min(3, metals.length)), 0, 0],
      result: { tier: rng() < 0.4 ? 1 : 0, flawed: false, worked: Math.floor(rng() * 20), strikes: 20, heats: 2, cracks: Math.floor(rng() * 3) }, maker: 'an old maker', rng, now });
    save.cards.unshift(card); return { piece: card };
  }
  const coins = p.coins[0] + Math.floor(rng() * (p.coins[1] - p.coins[0] + 1));
  save.coins += coins; return { coins };
}
// the ores in the store room, and the bars each smelts to (the forge's SMELTING: one working takes a pattern's bars of ore)
export function ores(save) {
  return partOptions('smelt', save)[0].opts.map((o, i) => ({ i, id: o.id, bar: o.bar, have: (save.mats || {})[o.id] || 0 }));
}
export const smeltTakes = () => PATTERNS.smelt.bars;
