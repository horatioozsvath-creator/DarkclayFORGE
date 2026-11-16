// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// THE TRAIL OF THE NINE, with no page access: the shards of Veric, one for each Mythic. The trail opens OF THE REACH; a Mythic's
// shard can be found once its Relic is made, from its source: below the deep doors (staff.js), a Court order (shop.js), or the
// fallen star (a rare town event, claimed from the notice board).
import { MYTHICS, RELICS, TRAIL, PART_WORK, PART_PATTERN, OLD_BLOOD, PATTERNS } from './data.js?v=34';
import { rung } from './growth.js?v=34';
import { owns } from './room.js?v=34';
import { levelOf, stationOf } from './rules.js?v=34';

export const open = save => rung(save) >= TRAIL.rung;
export const hasShard = (save, id) => (save.shards || []).includes(id);
// each of the Nine: its shard found, its clue open (the trail open and its Relic made), and where to look
export const clues = save => Object.entries(MYTHICS).map(([id, m]) => ({ id, name: m.name, source: m.shard, found: hasShard(save, id),
  open: open(save) && (save.relicsMade || []).includes(m.relic), relic: m.relic }));
export const pending = (save, source) => clues(save).filter(c => c.open && !c.found && c.source === source).map(c => c.id);
export function give(save, id) {
  if (!MYTHICS[id] || hasShard(save, id)) return false;
  save.shards = (save.shards || []).concat(id);
  return true;
}
// the fallen star: on its day, once, the first shard waiting there
export function claimStar(save, town) {
  if (!town || town.event !== 'starfall') return { why: 'no star fell today' };
  if (save.starDay === town.day) return { why: 'you\'ve been out to it today' };
  const p = pending(save, 'star'); if (!p.length) return { why: open(save) ? 'no shard of yours lies there' : 'the trail isn\'t open to you yet' };
  save.starDay = town.day; give(save, p[0]);
  return { shard: p[0] };
}
export const relicOf = id => RELICS[MYTHICS[id].relic];

// ---------- the parts (milestone 17) ----------
export const hasPart = (save, id, i) => !!((save.mythicParts || {})[id] || [])[i];
export const partsDone = (save, id) => [0, 1, 2].every(i => hasPart(save, id, i));
// the maker's best trade at a station (any of its patterns)
export const stationLevel = (save, st) => Math.max(1, ...Object.keys(PATTERNS).filter(p => (PATTERNS[p].station || 'forge') === st).map(p => levelOf(((save.trades || {})[p] || {}).xp || 0).level));
// what a part's working needs: { ok, station, pattern, why }
export function partGate(save, id, i) {
  const m = MYTHICS[id]; if (!m || !m.parts[i]) return { ok: false, why: ['no such part'] };
  const st = m.parts[i][0], why = [];
  if (hasPart(save, id, i)) return { ok: false, station: st, done: true, why: ['made already'] };
  if (!hasShard(save, id)) why.push('its shard of Veric');
  if (!owns(save, st)) why.push('a ' + st + ' set up');
  else if (stationLevel(save, st) < PART_WORK.level) why.push('trade ' + PART_WORK.level + ' in something at the ' + st);
  return { ok: !why.length, station: st, pattern: PART_PATTERN[st], why };
}
// its stuff: the piece's own recipe (the bars, the parts) and two of the station's rare things
export const partExtra = st => ({ mat: OLD_BLOOD.rare[st], n: PART_WORK.rare });
export function makePart(save, id, i) { save.mythicParts = save.mythicParts || {}; const a = (save.mythicParts[id] || [false, false, false]).slice(); a[i] = true; save.mythicParts[id] = a; }
