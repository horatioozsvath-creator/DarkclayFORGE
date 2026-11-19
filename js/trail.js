// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// THE TRAIL OF THE NINE, with no page access: the shards of Veric, one for each Mythic. The trail opens OF THE REACH, and with it every
// clue (release 37: before, each waited on its Relic), so shards and parts are gathered alongside the Relics. From its source: below the deep doors (staff.js), a Court order (shop.js), or the
// fallen star (a rare town event, claimed from the notice board).
import { LEGACY, MYTHICS, RELICS, TRAIL, PART_WORK, PART_PATTERN, OLD_BLOOD, PATTERNS } from './data.js?v=71';
import { rung } from './growth.js?v=71';
import { owns } from './room.js?v=71';
import * as Rg from './region.js?v=71';
import { levelOf, stationOf } from './rules.js?v=71';

export const open = save => rung(save) >= TRAIL.rung;
export const hasShard = (save, id) => (save.shards || []).includes(id);
// each of the Nine: its shard found, its clue open (the trail open), and where to look
// where a shard lies: as Veric's legend has it, or (a generation on, milestone 38) where it was scattered when the Nine were lost again
export const sourceOf = (save, id) => ((save && save.shardWhere) || {})[id] || MYTHICS[id].shard;
// the Nine scattered: the same count of each source (TRAIL sources), shuffled by rng
export function scatter(rng, region) {
  const ids = Rg.mythicsIn(region), src = ids.map(id => MYTHICS[id].shard);
  for (let i = src.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [src[i], src[j]] = [src[j], src[i]]; }
  return Object.fromEntries(ids.map((id, i) => [id, src[i]]));
}
export const clues = save => Rg.nineOf(save).map(id => [id, MYTHICS[id]]).map(([id, m]) => ({ id, name: m.name, source: sourceOf(save, id), found: hasShard(save, id),
  open: open(save), relic: m.relic }));
export const pending = (save, source) => clues(save).filter(c => c.open && !c.found && c.source === source).map(c => c.id);
export function give(save, id) {
  if (!MYTHICS[id] || hasShard(save, id)) return false;
  save.shards = (save.shards || []).concat(id);
  return true;
}
// the fallen star: on its day, once, the shards waiting there, up to TRAIL.star of them (milestone 35: was one)
export function claimStar(save, town) {
  if (!Rg.shardDay(town)) return { why: Rg.legend(save).starNone };   // the fallen star, or the tide giving back (milestone 42)
  if (save.starDay === town.day) return { why: 'you\'ve been out to it today' };
  const p = pending(save, 'star'); if (!p.length) return { why: open(save) ? 'no shard of yours lies there' : 'the trail isn\'t open to you yet' };
  save.starDay = town.day; const shards = p.slice(0, TRAIL.star); shards.forEach(id => give(save, id));
  return { shard: shards[0], shards };
}
// the line's lore (milestone 38): an heir knows a little of where to look. Star shards below twice as often; the Court asks a little more.
const heir = save => ((save && save.gen) || 1) > 1;
export const starBelowOf = save => TRAIL.starBelow * (heir(save) ? LEGACY.lore.starBelow : 1);
export const courtOddsOf = save => Math.min(0.9, TRAIL.court * (heir(save) ? LEGACY.lore.court : 1));
export const relicOf = id => RELICS[MYTHICS[id].relic];

// ---------- the parts (milestone 17) ----------
export const hasPart = (save, id, i) => !!((save.mythicParts || {})[id] || [])[i];
export const partsDone = (save, id) => [0, 1, 2].every(i => hasPart(save, id, i));
// the maker's best trade at a station (any of its patterns)
export const stationLevel = (save, st) => Math.max(1, ...Object.keys(PATTERNS).filter(p => (PATTERNS[p].station || 'forge') === st && !PATTERNS[p].mine).map(p => levelOf(((save.trades || {})[p] || {}).xp || 0).level));
// what a part's working needs: { ok, station, pattern, why }
export function partGate(save, id, i) {
  const m = MYTHICS[id]; if (!m || !m.parts[i]) return { ok: false, why: ['no such part'] };
  const st = m.parts[i][0], why = [];
  if (hasPart(save, id, i)) return { ok: false, station: st, done: true, why: ['made already'] };
  if (!hasShard(save, id)) why.push(Rg.legend(save).shardWhy);
  if (!owns(save, st)) why.push('a ' + st + ' set up');
  else if (stationLevel(save, st) < PART_WORK.level) why.push('trade ' + PART_WORK.level + ' in something at the ' + st);
  return { ok: !why.length, station: st, pattern: PART_PATTERN[st], why };
}
// its stuff: the piece's own recipe (the bars, the parts) and two of the station's rare things
export const partExtra = st => ({ mat: OLD_BLOOD.rare[st], n: PART_WORK.rare });
export function makePart(save, id, i) { save.mythicParts = save.mythicParts || {}; const a = (save.mythicParts[id] || [false, false, false]).slice(); a[i] = true; save.mythicParts[id] = a; }
