// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// THE LEGACY (milestone 37, docs/LEGACY-PLAN.md), with no page access: a Maker of the Nine hands the forge on to their apprentice.
// The heir's shop is built fresh, with only what the line keeps: the book (patterns found, tries, clues), the blueprints, the found
// tiles, the heir's trades (their own, up to trade 5; trade 2 in the rest), their trait for good and one heirloom over the door. The
// old shop goes into the line's record, with its save code (its own record left out, so nothing nests).
import { LEGACY, PATTERNS, HALL, MYTHICS, TIERS, RENOWN } from './data.js?v=79';
import { scatter } from './trail.js?v=79';
import { isNine, renownOf } from './growth.js?v=79';
import { levelOf, xpToNext } from './rules.js?v=79';
import { apprenticeOf, TOP_XP } from './apprentice.js?v=79';
import { fresh, toCode } from './save.js?v=79';
import * as Rg from './region.js?v=79';
import { inherit as inheritMine, depthOf } from './mine.js?v=79';

const DAY = 86400000;
export const gen = save => save.gen || 1;
// how many heirlooms pass to the next generation (two from the third: milestone 38)
export const heirloomsFor = nextGen => LEGACY.heirlooms[Math.min(nextGen, LEGACY.heirlooms.length) - 1];
// the heirlooms over the door: a list (release 62 kept one, as save.heirloom)
export const loomsOf = save => save.heirlooms || (save.heirloom ? [save.heirloom] : []);
// a small seeded rng: the scatter is fixed for a shop and a generation
const seeded = seed => { let x = seed >>> 0; return () => { x = (x + 0x6D2B79F5) >>> 0; let t = x; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const hash = t => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
// when they were taken on: hiredAt, or for those hired in release 61 the hour in their id ('h<hour>-<i>')
export function hiredAt(p) {
  if (!p) return null; if (p.hiredAt) return p.hiredAt;
  const m = /^h(\d+)-/.exec(p.id || ''); return m ? +m[1] * 3600000 : null;
}
// may the forge be handed on now? { ok, heir } or { ok: false, why }
export function canHandOn(save, now) {
  if (!isNine(save)) return { ok: false, why: 'only a Maker of the Nine can hand on the forge' };
  const p = apprenticeOf(save); if (!p) return { ok: false, why: 'you have no apprentice to hand it to' };
  const at = hiredAt(p), days = at ? (now - at) / DAY : 0;
  if (days < LEGACY.days) return { ok: false, heir: p, why: p.name + ' has been with you ' + Math.floor(days) + ' of ' + LEGACY.days + ' days', left: Math.ceil(LEGACY.days - days) };
  return { ok: true, heir: p };
}
// what can pass on as the heirloom: an Old-Blood piece, a Relic or a Mythic of the maker's own, best first
// a grown piece of any tier too (milestone 51): it can be carried in the next generation's hands, and grows on
export const heirlooms = save => (save.cards || []).filter(c => (HALL.tiers.includes(c.tier) || c.grown) && !c.sample)
  .sort((a, b) => HALL.tiers.indexOf(b.tier) - HALL.tiers.indexOf(a.tier) || (b.worth || 0) - (a.worth || 0));
// the xp a trade level takes
export const xpFor = lvl => { let x = 0; for (let l = 1; l < lvl; l++) x += xpToNext(l); return x; };
// the heir's trades: their own (never past LEGACY.top, as they learned it), trade LEGACY.rest in every other pattern
export function heirTrades(p) {
  const out = {}, rest = xpFor(LEGACY.rest);
  // (the mine's trades aren't handed on yet: the heir learns the face from the start; the line's mine is milestone 48's)
  Object.keys(PATTERNS).filter(id => !PATTERNS[id].mine).forEach(id => { out[id] = { xp: Math.max(rest, Math.min(TOP_XP, ((p.skill || {})[id]) || 0)) }; });
  return out;
}
// what the line's record keeps of a shop: enough to read, not the whole save (that's the code)
export function recordOf(save, now, looms) {
  const old = { ...save }; delete old.line;
  const hall = Object.values((save.hall || {}).shown || {}).map(id => (save.cards || []).find(c => c.id === id)).filter(Boolean).map(c => c.name);
  // region: where this generation worked (milestone 42; a record without one is the Reach's)
  return { gen: gen(save), region: Rg.regionId(save), maker: save.maker, lineOf: save.lineOf || null, trait: save.heirTrait || null, startedAt: save.startedAt || null, nineAt: save.nineAt || null, handedAt: now,
    days: save.startedAt && save.nineAt ? Math.round((save.nineAt - save.startedAt) / DAY) : null, renown: renownOf(save), made: save.made || 0, sold: save.sold || 0,
    earned: save.earned || 0, depth: depthOf(save), heirloom: looms[0] ? { name: looms[0].name, tier: looms[0].tier } : null, heirlooms: looms.map(x => ({ name: x.name, tier: x.tier })), hall, nine: Rg.nineOf(save).filter(id => (save.mythicsMade || []).includes(id)).length,
    code: toCode(old) };
}
// the heir's shop, from the old one: a new object (the old save is left as it was). heirloomId: a card from heirlooms(), or null.
// to: where the heir sets up the forge (milestone 42, the crossing): the Reach (the default) or over the pass, 'greyshore'
export function handOn(save, picked, now, to) {
  const c = canHandOn(save, now); if (!c.ok) return c;
  const ids = [...new Set([].concat(picked || []))], n = heirloomsFor(gen(save) + 1), p = c.heir, list = heirlooms(save), looms = ids.map(id => list.find(x => x.id === id));
  if (looms.some(x => !x)) return { ok: false, why: 'that piece can\'t pass on' };
  if (looms.length > n) return { ok: false, why: 'only ' + n + ' can pass on' };
  if (looms.length < Math.min(n, list.length)) return { ok: false, why: n > 1 ? 'choose the heirlooms' : 'choose the heirloom' };
  const loom = looms[0] || null, rec = recordOf(save, now, looms), book = save.book ? JSON.parse(JSON.stringify(save.book)) : undefined;
  const next = { ...fresh(),
    // the player's own: the shop's id (its links), settings, what they've been told
    uid: save.uid, kept: (save.kept || []).slice(), gentle: save.gentle, hintsOff: save.hintsOff, seen: (save.seen || []).slice(), backupAt: save.backupAt, curve: 2,
    // what the line keeps
    book, blueprints: (save.blueprints || []).slice(), found: (save.found || ['ember']).slice(), picks: JSON.parse(JSON.stringify(save.picks || {})),
    smelt46: true,   // (its picks are the old shop's, already in the milestone-46 order: Mine.fixSave mustn't move them again)
    trades: heirTrades(p), maker: p.name, heirTrait: p.trait, lineOf: save.maker, gen: gen(save) + 1, startedAt: now, lastSeen: now,
    heirlooms: looms.map(x => ({ ...JSON.parse(JSON.stringify(x)), heirloom: true, from: save.maker })),
    // the Nine scattered again: their shards lie in new places this generation (milestone 38); the region's own Nine (milestone 42)
    shardWhere: scatter(seeded(hash((save.uid || '') + ':' + (gen(save) + 1))), to),
    line: (save.line || []).concat(rec),
    coins: LEGACY.purse };
  if (Rg.idOf(to) !== Rg.REACH) next.region = Rg.idOf(to);
  // the line's mine (milestone 48): the galleries kept, their shoring gone old, and the face and the smelting at trade LEGACY.rest
  const mine = inheritMine(save, now);
  if (mine) { next.mine = mine; for (const id of ['dig', 'smelt']) next.trades[id] = { xp: xpFor(LEGACY.rest) }; }
  // from the third generation in the region, the town's welcome: the shop starts KNOWN. The Reach counts every generation (milestone
  // 38); over the pass, only the ones that worked there: nobody in Saltby has heard of the line (milestone 42)
  next.renown = Rg.localGen(next) >= LEGACY.welcomeFrom ? RENOWN[LEGACY.welcome].at : 0;
  next.inheritedXp = Object.values(next.trades).reduce((a, t) => a + t.xp, 0);   // the head start: not counted to the maker's level
  if (next.book === undefined) delete next.book;
  return { ok: true, save: next, record: rec };
}
// the record without its codes, if the browser won't hold them all: the line still reads, the old shops can't be loaded
export const withoutCodes = s => ({ ...s, line: (s.line || []).map(r => ({ ...r, code: null })) });
export const tierName = id => (TIERS.find(t => t.id === id) || { name: id }).name;
export const levelIn = (save, id) => levelOf(((save.trades || {})[id] || {}).xp || 0).level;
