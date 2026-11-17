// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// The second shop, with no page access: a shop front in another town, run by a keeper. It's the same rules as the first shop
// (shop.js, room.js), run on a view of the save whose shop keys (room, shelf, ledger, clock, town…) are the second shop's own, and
// whose coins, cards, renown and stations are the maker's. Bought once; the keeper sells while the game is open and while it's away.
import { BRANCH, RENOWN } from './data.js?v=55';
import * as Sh from './shop.js?v=55';
import { defaultShop } from './room.js?v=55';
import { rung } from './growth.js?v=55';

const KEYS = new Set(['room', 'shelf', 'slots', 'ledger', 'clock', 'shopNext', 'awayNext', 'queue', 'order', 'orderNext', 'town', 'townSalt', 'townWeights', 'townGap', 'sold', 'earned']);
// the save as the second shop sees it
export function viewOf(save) {
  return new Proxy(save, {
    get(t, k) { if (k === '__main') return t; return KEYS.has(k) ? t.branch[k] : t[k]; },
    set(t, k, v) { if (KEYS.has(k)) t.branch[k] = v; else t[k] = v; return true; },
  });
}
export const canBuy = save => save.branch ? { why: 'yours already' } : rung(save) < BRANCH.rung ? { why: 'a shop ' + RENOWN[BRANCH.rung].word.toLowerCase() + ' first' } : save.coins < BRANCH.cost ? { why: 'not enough coin' } : { ok: true };
export function buy(save) {
  const c = canBuy(save); if (!c.ok) return c;
  save.coins -= BRANCH.cost;
  save.branch = { room: defaultShop(2, 0), shelf: [], slots: 4, ledger: [], clock: 0, queue: [], orderNext: 1e15, townSalt: BRANCH.salt, townWeights: { ...BRANCH.weights }, townGap: BRANCH.gap, sold: 0, earned: 0, owe: 0, closed: false };
  Sh.fixShelf(viewOf(save));
  return { ok: true };
}
// dt seconds at the second shop: the keeper's wage (it closes while the maker can't pay), then its customers. The sales' coin goes to
// the maker, and counts in the maker's sold and earned too. Returns the ledger entries made.
// the keeper's share of a sale made while the game is open (away, awayStep takes it as the clerk's does)
function keeperCut(save, e) { const k = Math.round(e.sold.price * BRANCH.cut); save.coins -= k; e.sold.full = e.sold.price; e.sold.price -= k; }
// the keeper's wage for dt seconds; false when it can't be paid (the shop closes until it can)
function payKeeper(save, dt) {
  const b = save.branch;
  b.owe = (b.owe || 0) + BRANCH.wage * dt / 3600;
  const due = Math.floor(b.owe);
  if (due > 0) { if (save.coins < due) { b.closed = true; return false; } save.coins -= due; b.owe -= due; save.wagesBranch = (save.wagesBranch || 0) + due; }
  b.closed = false;
  return true;
}
export function step(save, dt, rng, now) {
  const b = save.branch; if (!b || !payKeeper(save, dt)) return [];
  const out = Sh.shopStep(viewOf(save), dt, rng, now, false, { boost: BRANCH.boost, by: BRANCH.keeper });
  out.forEach(e => { if (e.sold) { keeperCut(save, e); save.sold = (save.sold || 0) + 1; save.earned = (save.earned || 0) + e.sold.price; } });
  return out;
}
// away: the keeper sells on (up to the hours given) at the pace the first shop's clerk does while you're away (shop.js awayStep:
// a quiet town without its maker), a minute at a time. Returns { sold: [entries], coins, wages }
export function away(save, from, to, rng, capH) {
  const sum = { sold: [], coins: 0, wages: 0 }; if (!save.branch || !from || to <= from) return sum;
  const counted = Math.min((to - from) / 1000, capH * 3600), w0 = save.wagesBranch || 0, v = viewOf(save);
  for (let t = 0; t < counted; t += 60) {
    const dt = Math.min(60, counted - t); if (!payKeeper(save, dt)) continue;
    Sh.awayStep(v, dt, rng, from + (t + dt) * 1000, { rate: 1 - BRANCH.cut, name: BRANCH.keeper }).sold.forEach(e => {
      sum.sold.push(e); sum.coins += e.sold.price; save.sold = (save.sold || 0) + 1; save.earned = (save.earned || 0) + e.sold.price; });
  }
  sum.wages = (save.wagesBranch || 0) - w0;
  return sum;
}
