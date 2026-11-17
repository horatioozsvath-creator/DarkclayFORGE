// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// THE HALL, with no page access: a gallery room for the best pieces (Old-Blood, Relics, Mythics). Bought once from RENOWNED; its
// plinths and cases are its places (room.js hallSpots); a piece shown there is off the shelves and the wall, adds renown and charm
// (growth.js hallRenown, hallCharm), and shows in shop links and flyers.
import { HALL, RENOWN } from './data.js?v=52';
import { defaultHall, hallSpots } from './room.js?v=52';
import { rung, onHall, onWall } from './growth.js?v=52';
import { onShelf, onOtherShelf } from './shop.js?v=52';

export const canBuy = save => save.hall ? { why: 'yours already' } : rung(save) < HALL.rung ? { why: 'a shop ' + RENOWN[HALL.rung].word.toLowerCase() + ' first' } : save.coins < HALL.cost ? { why: 'not enough coin' } : { ok: true };
export function buy(save) {
  const c = canBuy(save); if (!c.ok) return c;
  save.coins -= HALL.cost; save.hall = defaultHall();
  return { ok: true };
}
// a piece fit for the Hall: Old-Blood or better, the maker's own (not a flyer's copy), in the back room
export const fit = (save, card) => !!card && HALL.tiers.includes(card.tier) && !card.sample && onShelf(save, card.id) < 0 && !onWall(save, card.id) && !onOtherShelf(save, card.id) && !onHall(save, card.id);
export const candidates = save => save.cards.filter(c => fit(save, c)).sort((a, b) => HALL.tiers.indexOf(b.tier) - HALL.tiers.indexOf(a.tier) || b.worth - a.worth);
export function show(save, key, cardId) {
  const h = save.hall, card = save.cards.find(c => c.id === cardId);
  if (!h || !hallSpots(h).some(p => p.key === key) || (h.shown || {})[key] || !fit(save, card)) return false;
  h.shown = { ...(h.shown || {}), [key]: cardId };
  return true;
}
export function takeDown(save, key) { if (save.hall && save.hall.shown) delete save.hall.shown[key]; }
// pieces that went (sold elsewhere, broken, lost) leave their place empty
export function tidy(save) {
  if (!save.hall) return;
  const keys = new Set(hallSpots(save.hall).map(p => p.key));
  for (const [k, id] of Object.entries(save.hall.shown || {})) if (!keys.has(k) || !save.cards.some(c => c.id === id)) delete save.hall.shown[k];
}
