// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// THE LEGACY (milestone 37, docs/LEGACY-PLAN.md), with no page access: a Maker of the Nine hands the forge on to their apprentice.
// The heir's shop is built fresh, with only what the line keeps: the book (patterns found, tries, clues), the blueprints, the found
// tiles, the heir's trades (their own, up to trade 5; trade 2 in the rest), their trait for good and one heirloom over the door. The
// old shop goes into the line's record, with its save code (its own record left out, so nothing nests).
import { LEGACY, PATTERNS, HALL, MYTHICS, TIERS } from './data.js?v=62';
import { isNine, renownOf } from './growth.js?v=62';
import { levelOf, xpToNext } from './rules.js?v=62';
import { apprenticeOf, TOP_XP } from './apprentice.js?v=62';
import { fresh, toCode } from './save.js?v=62';

const DAY = 86400000;
export const gen = save => save.gen || 1;
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
export const heirlooms = save => (save.cards || []).filter(c => HALL.tiers.includes(c.tier) && !c.sample)
  .sort((a, b) => HALL.tiers.indexOf(b.tier) - HALL.tiers.indexOf(a.tier) || (b.worth || 0) - (a.worth || 0));
// the xp a trade level takes
export const xpFor = lvl => { let x = 0; for (let l = 1; l < lvl; l++) x += xpToNext(l); return x; };
// the heir's trades: their own (never past LEGACY.top, as they learned it), trade LEGACY.rest in every other pattern
export function heirTrades(p) {
  const out = {}, rest = xpFor(LEGACY.rest);
  Object.keys(PATTERNS).forEach(id => { out[id] = { xp: Math.max(rest, Math.min(TOP_XP, ((p.skill || {})[id]) || 0)) }; });
  return out;
}
// what the line's record keeps of a shop: enough to read, not the whole save (that's the code)
export function recordOf(save, now, heirloom) {
  const old = { ...save }; delete old.line;
  const hall = Object.values((save.hall || {}).shown || {}).map(id => (save.cards || []).find(c => c.id === id)).filter(Boolean).map(c => c.name);
  return { gen: gen(save), maker: save.maker, lineOf: save.lineOf || null, trait: save.heirTrait || null, startedAt: save.startedAt || null, nineAt: save.nineAt || null, handedAt: now,
    days: save.startedAt && save.nineAt ? Math.round((save.nineAt - save.startedAt) / DAY) : null, renown: renownOf(save), made: save.made || 0, sold: save.sold || 0,
    earned: save.earned || 0, heirloom: heirloom ? { name: heirloom.name, tier: heirloom.tier } : null, hall, nine: Object.keys(MYTHICS).filter(id => (save.mythicsMade || []).includes(id)).length,
    code: toCode(old) };
}
// the heir's shop, from the old one: a new object (the old save is left as it was). heirloomId: a card from heirlooms(), or null.
export function handOn(save, heirloomId, now) {
  const c = canHandOn(save, now); if (!c.ok) return c;
  const p = c.heir, list = heirlooms(save), loom = heirloomId ? list.find(x => x.id === heirloomId) : null;
  if (heirloomId && !loom) return { ok: false, why: 'that piece can\'t pass on' };
  if (!heirloomId && list.length) return { ok: false, why: 'choose the heirloom' };
  const rec = recordOf(save, now, loom), book = save.book ? JSON.parse(JSON.stringify(save.book)) : undefined;
  const next = { ...fresh(),
    // the player's own: the shop's id (its links), settings, what they've been told
    uid: save.uid, kept: (save.kept || []).slice(), gentle: save.gentle, hintsOff: save.hintsOff, seen: (save.seen || []).slice(), backupAt: save.backupAt, curve: 2,
    // what the line keeps
    book, blueprints: (save.blueprints || []).slice(), found: (save.found || ['ember']).slice(), picks: JSON.parse(JSON.stringify(save.picks || {})),
    trades: heirTrades(p), maker: p.name, heirTrait: p.trait, lineOf: save.maker, gen: gen(save) + 1, startedAt: now, lastSeen: now,
    heirloom: loom ? { ...JSON.parse(JSON.stringify(loom)), heirloom: true, from: save.maker } : null,
    line: (save.line || []).concat(rec),
    coins: LEGACY.purse };
  next.inheritedXp = Object.values(next.trades).reduce((a, t) => a + t.xp, 0);   // the head start: not counted to the maker's level
  if (next.book === undefined) delete next.book;
  return { ok: true, save: next, record: rec };
}
// the record without its codes, if the browser won't hold them all: the line still reads, the old shops can't be loaded
export const withoutCodes = s => ({ ...s, line: (s.line || []).map(r => ({ ...r, code: null })) });
export const tierName = id => (TIERS.find(t => t.id === id) || { name: id }).name;
export const levelIn = (save, id) => levelOf(((save.trades || {})[id] || {}).xp || 0).level;
