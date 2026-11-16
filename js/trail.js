// THE TRAIL OF THE NINE, with no page access: the shards of Veric, one for each Mythic. The trail opens OF THE REACH; a Mythic's
// shard can be found once its Relic is made, from its source: below the deep doors (staff.js), a Court order (shop.js), or the
// fallen star (a rare town event, claimed from the notice board).
import { MYTHICS, RELICS, TRAIL } from './data.js?v=28';
import { rung } from './growth.js?v=28';

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
