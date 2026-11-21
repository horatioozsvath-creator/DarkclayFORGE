// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// WHO OPENS THE SHOP (milestone 53, docs/CREATOR-PLAN.md), with no page access: the maker's people and look, what they were before,
// and the kind of shop they open. save.who = { people, look, background }; save.shop = a station's id. A save without them is a
// forge shop with no gift and no head start, as every save before: every gift below is 1 (or nothing) for it.
import { PEOPLES, BACKGROUNDS, SHOPS, SIGN, STATIONS, PATTERNS } from './data.js?v=84';
import { xpToNext } from './rules.js?v=84';

const levelXp = lvl => { let x = 0; for (let l = 1; l < lvl; l++) x += xpToNext(l); return x; };   // as legacy.js xpFor
export const shopOf = save => (save && SHOPS[save.shop]) ? save.shop : 'forge';
export const shopWord = save => SHOPS[shopOf(save)].word;
export const titleOf = save => 'Darkclay ' + shopWord(save);
export const peopleOf = save => (save && save.who && PEOPLES[save.who.people]) || null;
export const backgroundOf = save => (save && save.who && BACKGROUNDS[save.who.background]) || null;
const gift = save => (peopleOf(save) || {}).gift || {};
// the people's gifts
export const bandGift = (save, st) => gift(save).band === st ? gift(save).x : 1;
export const xpGift = save => gift(save).xp || 1;
export const priceGift = save => gift(save).price || 1;
export const hurtGift = save => gift(save).hurt || 1;
// the background's
export const guardWage = save => (backgroundOf(save) || {}).guard || 1;
export const mineStart = save => (backgroundOf(save) || {}).mine || 0;
// a station's first patterns: the ones it has from the start (not found, not the coast's, not the mine's), as the patterns list has them
export const firstPatterns = st => Object.keys(PATTERNS).filter(id => (PATTERNS[id].station || 'forge') === st && !PATTERNS[id].hidden && !PATTERNS[id].coast && !PATTERNS[id].north && !PATTERNS[id].mine);
// what a new shop's customers come in for, while it's new: the sign's (null for a forge shop, which the town knows already)
export const signWant = (save, rung) => save && SHOPS[save.shop] && save.shop !== 'forge' && rung < SIGN.rung ? SHOPS[save.shop].want : null;
// is this choice whole: { people, look, background, shop }
export function valid(c) {
  return !!c && !!PEOPLES[c.people] && PEOPLES[c.people].looks.includes(c.look) && !!BACKGROUNDS[c.background] && !!SHOPS[c.shop];
}
// a new game's start (a fresh save, nothing made): who, the shop's station set up free, its store room, the head start
export function start(save, c) {
  const trade = (id, xp) => { save.trades[id] = { xp }; };
  if (!valid(c)) return { why: 'choose who you are, what you were and the shop you open' };
  if (save.made || (save.cards || []).length) return { why: 'this shop is already open' };
  const sh = SHOPS[c.shop], bg = BACKGROUNDS[c.background];
  save.who = { people: c.people, look: c.look, background: c.background };
  save.shop = c.shop;
  if (c.shop !== 'forge' && !(save.stations || []).includes(c.shop)) save.stations = (save.stations || []).concat(c.shop);
  save.mats = { ...sh.mats };
  for (const [m, n] of Object.entries(bg.mats || {})) save.mats[m] = (save.mats[m] || 0) + n;
  save.trades = save.trades || {};
  const sum = () => Object.values(save.trades).reduce((a, t) => a + (t.xp || 0), 0) + ((save.haggle || {}).xp || 0), before = sum();
  if (bg.station) for (const id of firstPatterns(bg.station)) trade(id, Math.max((save.trades[id] || {}).xp || 0, levelXp(bg.level)));
  if (bg.coins) save.coins = (save.coins || 0) + bg.coins;
  if (bg.haggle) save.haggle = { xp: Math.max((save.haggle || {}).xp || 0, levelXp(bg.haggle)) };
  if (save.mine) onMineOpen(save);   // an heir's mine is open already
  save.inheritedXp = (save.inheritedXp || 0) + sum() - before;   // the head start isn't counted to the maker's level
  return { ok: true };
}
// the miner's head start, once the trapdoor opens: mining and smelting at their trade (never lower than they are)
export function onMineOpen(save) {
  const lvl = mineStart(save); if (!lvl) return;
  save.trades = save.trades || {};
  for (const id of ['dig', 'smelt']) save.trades[id] = { xp: Math.max((save.trades[id] || {}).xp || 0, levelXp(lvl)) };
}
export const stationName = st => (STATIONS[st] || STATIONS.forge).name.toLowerCase();
