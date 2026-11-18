// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// WEAR, with no page access: every working wears its station; a worn one narrows the band; at full wear it breaks (after a working,
// never during one) until rebuilt, which takes coin and hours. The dwarven forge: a better forge. Spared on a gentler Reach (bank.js).
import { WEAR, STATIONS, RENOWN } from './data.js?v=64';
import { rung } from './growth.js?v=64';
import { threatsOn } from './bank.js?v=64';

const H = 3600000;
export const stateOf = (save, st) => { save.wear = save.wear || {}; return save.wear[st] || (save.wear[st] = { w: 0 }); };
export const wearOf = (save, st) => stateOf(save, st).w;
// a rebuild (or the dwarven forge going up) finished: the station whole again
export function tidy(save, now) {
  for (const st of Object.keys(save.wear || {})) { const s = save.wear[st]; if (s.broken && s.ready && now >= s.ready) { s.broken = false; s.ready = 0; s.w = 0; } }
}
export const isBroken = (save, st, now) => { tidy(save, now); return !!stateOf(save, st).broken; };
export const rebuilding = (save, st) => { const s = stateOf(save, st); return s.broken && s.ready ? s.ready : 0; };
const dwarf = (save, st) => st === 'forge' && !!save.dwarven;
// the band, as the station stands: worn narrower, the dwarven forge wider
export const bandMult = (save, st) => (dwarf(save, st) ? WEAR.dwarven.band : 1) * (wearOf(save, st) >= WEAR.worn ? WEAR.wornBand : 1);
// what a working was, for its wear
export const kindOf = res => res.mythic ? 'mythic' : res.relic ? 'relic' : res.part ? 'part' : res.instant ? 'quick' : res.rework || res.oldBlood || res.master ? 'rework' : 'work';
// a working done: its wear; { w, broke } (null on a gentler Reach or in the week of grace)
export function addWear(save, st, kind, now) {
  if (!threatsOn(save, now)) return null;
  const s = stateOf(save, st); if (s.broken) return { w: s.w, broke: false };
  const before = s.w;
  s.w = Math.min(WEAR.max, s.w + (WEAR.per[kind] || WEAR.per.work) * (dwarf(save, st) ? WEAR.dwarven.wear : 1));
  const broke = s.w >= WEAR.max; if (broke) { s.broken = true; s.ready = 0; }
  return { w: s.w, broke, worn: before < WEAR.worn && s.w >= WEAR.worn };
}
export const repairCost = (save, st) => Math.ceil(wearOf(save, st) * WEAR.repair * (1 + WEAR.repairStep * rung(save)));
export function repair(save, st) {
  const s = stateOf(save, st), c = repairCost(save, st);
  if (s.broken) return { why: 'it\'s broken: it has to be rebuilt' };
  if (!s.w) return { why: 'it\'s as good as new' };
  if (save.coins < c) return { why: 'not enough coin' };
  save.coins -= c; s.w = 0; return { ok: true, cost: c };
}
export const rebuildCost = save => WEAR.rebuild * (1 + rung(save));
export function rebuild(save, st, now) {
  const s = stateOf(save, st), c = rebuildCost(save);
  if (!s.broken) return { why: 'it isn\'t broken' };
  if (s.ready) return { why: 'it\'s being rebuilt' };
  if (save.coins < c) return { why: 'not enough coin' };
  save.coins -= c; s.ready = now + WEAR.rebuildH * H; return { ok: true, cost: c, ready: s.ready };
}
// the dwarven forge: from FAMED; it takes the old forge's place (broken or not) and is out while it goes up
export function canDwarven(save) {
  const d = WEAR.dwarven;
  if (save.dwarven) return { why: 'yours already' };
  if (rung(save) < d.rung) return { why: 'a shop ' + RENOWN[d.rung].word + ' first' };
  if (save.coins < d.cost) return { why: 'not enough coin' };
  return { ok: true };
}
export function buildDwarven(save, now) {
  const c = canDwarven(save); if (!c.ok) return c;
  save.coins -= WEAR.dwarven.cost; save.dwarven = true;
  const s = stateOf(save, 'forge'); s.w = 0; s.broken = true; s.ready = now + WEAR.dwarven.h * H;
  return { ok: true, ready: s.ready };
}
export const stationName = st => (STATIONS[st] || STATIONS.forge).word.toLowerCase();
