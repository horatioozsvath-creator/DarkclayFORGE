// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// FOUND BY TRYING (milestone 31, docs/DISCOVERY-PLAN.md), with no page access: TRY SOMETHING NEW at a station (a head, a haft and a
// binding from the store room), the clue each choice earns, the trade a pattern needs first, studying an old piece to learn its pattern,
// customers asking for what you don't make yet, and THE MAKER'S BOOK that keeps it all (save.book).
import { PATTERNS, MATS, TRY_ROLES, TRY_FAMILY, STUDY_RENOWN, FIND_RENOWN } from './data.js?v=72';
import { makePiece, partOptions, levelOf } from './rules.js?v=72';
import { knows, salvage } from './shop.js?v=72';
import * as Rg from './region.js?v=72';

export const bookOf = save => save.book || (save.book = { found: [], tries: [], clues: [], seen: 0 });
export const hiddenAt = st => Object.keys(PATTERNS).filter(id => PATTERNS[id].hidden && (PATTERNS[id].station || 'forge') === st);
// a region's own patterns are found only there (milestone 40)
export const toFind = (save, st) => hiddenAt(st).filter(id => !knows(save, id) && Rg.findsHere(save, id));
export const familyOf = mat => Object.keys(TRY_FAMILY).find(f => TRY_FAMILY[f].includes(mat)) || null;
// what can go in a role: the store room's things of the role's families
export const fitsRole = (st, role, mat) => { const r = TRY_ROLES[st].find(x => x.id === role); return !!r && (r.only ? r.only.includes(mat) : r.fams.includes(familyOf(mat))); };
const trade = (save, id) => levelOf(((save.trades || {})[id] || {}).xp || 0).level;
// the trade a pattern needs first: { ok, word }
export function gateOf(save, id) {
  const g = PATTERNS[id].hidden.gate; if (!g) return { ok: true, word: '' };
  const names = g.trades.map(t => PATTERNS[t].trade.toLowerCase());
  return { ok: g.trades.some(t => trade(save, t) >= g.level), word: names.join(' or ') + ', trade ' + g.level };
}
// how each choice sits against a pattern's recipe: 'right' | 'near' (the right family, not the right thing) | 'wrong'
export function grade(id, picks) {
  const t = PATTERNS[id].hidden.try;
  return TRY_ROLES[PATTERNS[id].station || 'forge'].map(r => {
    const m = picks[r.id], ok = t[r.id] || [];
    if (m && ok.includes(m)) return 'right';
    if (m && ok.some(x => familyOf(x) === familyOf(m))) return 'near';
    return 'wrong';
  });
}
const score = g => g.reduce((a, x) => a + (x === 'right' ? 2 : x === 'near' ? 1 : 0), 0);
const keyOf = (st, picks) => st + ':' + TRY_ROLES[st].map(r => picks[r.id] || '-').join('+');
// the clue for one choice, in words
function clueLine(id, role, g, mat) {
  const h = PATTERNS[id].hidden.hints[role.id], nm = mat ? MATS[mat].name.toLowerCase() : 'nothing';
  if (g === 'right') return { role: role.word, g, line: 'The ' + nm + ' was right.' };
  if (g === 'near') return { role: role.word, g, line: 'Near: the ' + nm + ' is the right kind of thing, not the right one. It wants ' + h + '.' };
  return { role: role.word, g, line: 'The ' + nm + ' was wrong for it. It wants ' + h + '.' };
}
// the materials a try takes: one of each thing chosen
export const tryCost = picks => Object.values(picks).filter(Boolean).reduce((o, m) => (o[m] = (o[m] || 0) + 1, o), {});
export const canAfford = (save, picks) => Object.entries(tryCost(picks)).every(([m, n]) => (save.mats[m] || 0) >= n);

// TRY IT. picks: { head, haft, binding } (material ids, or null). Returns
// { result: 'found' | 'close' | 'nothing' | 'notyet' | 'known' | 'short' | 'tried', pattern, clues: [{ role, g, line }], card, gate }
export function tryIt(save, st, picks, rng, now) {
  const book = bookOf(save), key = keyOf(st, picks);
  if (!TRY_ROLES[st] || !picks[TRY_ROLES[st][0].id]) return { result: 'short', clues: [] };
  // a known pattern's recipe (found already): nothing to learn, nothing spent
  const known = hiddenAt(st).find(id => knows(save, id) && grade(id, picks).every(g => g === 'right'));
  if (known) return { result: 'known', pattern: known, clues: [] };
  const same = book.tries.find(t => t.key === key);
  if (same) return { result: 'tried', pattern: same.pattern, clues: same.clues };
  const left = toFind(save, st); if (!left.length) return { result: 'nothing', clues: [], all: true };
  const ranked = left.map(id => ({ id, g: grade(id, picks) })).sort((a, b) => score(b.g) - score(a.g));
  const best = ranked[0], hit = best.g.every(g => g === 'right');
  if (hit) { const gate = gateOf(save, best.id); if (!gate.ok) return { result: 'notyet', pattern: best.id, gate, clues: [] }; }
  if (!canAfford(save, picks)) return { result: 'short', clues: [] };
  Object.entries(tryCost(picks)).forEach(([m, n]) => { save.mats[m] -= n; if (!save.mats[m]) delete save.mats[m]; });
  save.trades = save.trades || {};
  if (hit) {
    learn(save, best.id, FIND_RENOWN);
    const p = PATTERNS[best.id], opts = partOptions(best.id);
    const pickIx = TRY_ROLES[st].map((r, i) => Math.max(0, opts[i] ? opts[i].opts.findIndex(o => (o.mat || o.id) === picks[r.id]) : 0));
    const card = makePiece({ patternId: best.id, picks: pickIx, result: { tier: 0, flawed: false, worked: 0, strikes: 0, heats: 1, cracks: 0, instant: true }, maker: save.maker || 'the Maker', rng, now });
    save.cards.unshift(card);
    book.tries.unshift({ key, st, picks: { ...picks }, at: now, result: 'found', pattern: best.id, clues: [] });
    return { result: 'found', pattern: best.id, card, clues: [], name: p.name };
  }
  const close = score(best.g) >= 3;   // more than the head alone right
  const clues = close ? TRY_ROLES[st].map((r, i) => clueLine(best.id, r, best.g[i], picks[r.id])) : [];
  book.tries.unshift({ key, st, picks: { ...picks }, at: now, result: close ? 'close' : 'nothing', pattern: close ? best.id : null, clues });
  book.tries = book.tries.slice(0, 60);
  return { result: close ? 'close' : 'nothing', pattern: close ? best.id : null, clues, kind: close ? PATTERNS[best.id].kind : '' };
}
function learn(save, id, renown) {
  const book = bookOf(save);
  if (!book.found.includes(id)) book.found.push(id);
  save.renown = (save.renown || 0) + renown;
}
// STUDY IT: an old piece of a pattern you don't know, taken apart (its salvage kept) and its pattern learned
export const canStudy = (save, card) => !!card && !card.sample && !!PATTERNS[card.pattern] && !!PATTERNS[card.pattern].hidden && !knows(save, card.pattern);
export function study(save, cardId) {
  const c = save.cards.find(x => x.id === cardId);
  if (!canStudy(save, c) || !salvage(save, cardId)) return null;
  learn(save, c.pattern, STUDY_RENOWN);
  bookOf(save).tries.unshift({ key: 'study:' + c.id, st: PATTERNS[c.pattern].station || 'forge', at: Date.now(), result: 'studied', pattern: c.pattern, clues: [], from: c.name });
  return c.pattern;
}
// a customer asking for what you don't make yet: a pattern still to find, and their words (once a clue's in the book, a new one)
export function askFor(save, rng) {
  const left = Object.keys(PATTERNS).filter(id => PATTERNS[id].hidden && !knows(save, id) && ownsStation(save, PATTERNS[id].station) && Rg.findsHere(save, id));
  if (!left.length) return null;
  const id = left[Math.floor(rng() * left.length)], asks = PATTERNS[id].hidden.asks, line = asks[Math.floor(rng() * asks.length)];
  return { pattern: id, line };
}
const ownsStation = (save, st) => !st || st === 'forge' || (save.stations || []).includes(st);
// THE TOWN BOARD (milestone 32): each day, a notice for one pattern still to find at a station you have (the same all day)
export function boardClue(save, day) {
  const left = Object.keys(PATTERNS).filter(id => PATTERNS[id].hidden && PATTERNS[id].hidden.board && !knows(save, id) && ownsStation(save, PATTERNS[id].station) && Rg.findsHere(save, id));
  if (!left.length) return null;
  const id = left[((day * 2654435761) >>> 0) % left.length];
  return { pattern: id, line: Rg.boardOf(save, id) };
}
export function noteClue(save, c, who, now) {
  const book = bookOf(save);
  if (book.clues.some(x => x.line === c.line)) return false;
  book.clues.unshift({ pattern: c.pattern, line: c.line, who, at: now });
  book.clues = book.clues.slice(0, 40);
  return true;
}
export const newClues = save => { const b = bookOf(save); return b.clues.filter(c => c.at > (b.seen || 0)).length; };
