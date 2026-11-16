// A shop front as a link, with no page access: what a friend sees when they visit (the room as it's arranged, the cards on its
// shelves with their prices, the wall's pieces in full, a sign). Packed small here; js/share.js compresses it into the address after
// #shop=. A link comes from someone else's browser: unpack checks and rebuilds every part, and the room must pass the room rules.
import { FURNITURE, TIERS, RENOWN, ROOM_SIZES, STATIONS, CHARM_MAX, SHELF_LEVELS, MAX_PLACES } from './data.js?v=19';
import { ART } from './card.js?v=19';
import { valid, shelfSpots, charm, levelOf, homeOf } from './room.js?v=19';
import { priceAt } from './shop.js?v=19';
import { rung } from './growth.js?v=19';
import { cardFields, checkCard } from './share.js?v=19';

const TIER_N = Object.fromEntries(TIERS.map((t, i) => [t.id, i]));
const str = (v, n) => typeof v === 'string' && v.length <= n ? v : null;
const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
export const MAX_WALL = 12;

// the shop front, packed: v, n the maker, at when, rw renown rung, sz room size, ch charm, md made, sd sold, st stations,
// it furniture [kind, x, z, rot, level], sh the stands [place, tier, art, tint, name, price, count], w the wall's cards
export function packShop(save, now = Date.now()) {
  const room = save.room, spots = shelfSpots(room), cards = new Map(save.cards.map(c => [c.id, c]));
  const sh = [];
  spots.forEach((p, i) => {
    const e = save.shelf[i], c = e && cards.get(e.id);
    if (c) sh.push([i, TIER_N[c.tier] || 0, c.art, c.tint, c.name, priceAt(c, e.tag), c.count || 0]);
  });
  return {
    v: 1, n: String(save.maker || 'the Maker').slice(0, 40), at: now, rw: rung(save), sz: room.size || 0, ch: charm(room, save),
    md: save.made || 0, sd: save.sold || 0, st: ['forge'].concat(save.stations || []).filter(id => STATIONS[id]),
    it: room.items.map(i => [i.kind, i.x, i.z, i.rot, i.kind === 'shelf' ? levelOf(i) : 0]),
    sh, w: (save.wall || []).map(id => cards.get(id)).filter(Boolean).slice(0, MAX_WALL).map(cardFields),
  };
}

// someone else's shop, checked and rebuilt for the look-only view, or null when any part won't read
export function unpackShop(o) {
  if (!o || typeof o !== 'object' || o.v !== 1) return null;
  const maker = str(o.n, 40), at = Number.isFinite(o.at) ? o.at : null;
  if (maker == null || at == null || !int(o.rw, 0, RENOWN.length - 1) || !int(o.sz, 0, ROOM_SIZES.length - 1)) return null;
  if (!Number.isFinite(o.ch) || o.ch < 0 || o.ch > CHARM_MAX || !int(o.md, 0, 1e7) || !int(o.sd, 0, 1e7)) return null;
  if (!Array.isArray(o.st) || o.st.length > Object.keys(STATIONS).length || !o.st.every(id => typeof id === 'string' && STATIONS[id])) return null;
  if (!Array.isArray(o.it) || o.it.length > 120 || !Array.isArray(o.sh) || o.sh.length > MAX_PLACES || !Array.isArray(o.w) || o.w.length > MAX_WALL) return null;
  // the room: known shop furniture on whole tiles, one counter, every piece fitting (room.js valid)
  const items = [];
  for (const [i, r] of o.it.entries()) {
    if (!Array.isArray(r) || r.length !== 5) return null;
    const [kind, x, z, rot, lv] = r;
    if (typeof kind !== 'string' || !Object.hasOwn(FURNITURE, kind) || homeOf(kind) === 'work' || !int(x, 0, 30) || !int(z, 0, 30) || !int(rot, 0, 3) || !int(lv, 0, SHELF_LEVELS.length - 1)) return null;
    const it = { id: kind === 'counter' ? 'counter' : 'v' + i, kind, x, z, rot };
    if (kind === 'shelf' && lv) it.lv = lv;
    items.push(it);
  }
  const room = { kind: 'shop', size: o.sz, items };
  if (!valid(room)) return null;
  // the stands: one a place, on a place the room has
  const spots = shelfSpots(room), seen = new Set(), stands = [];
  for (const r of o.sh) {
    if (!Array.isArray(r) || r.length !== 7) return null;
    const [place, tier, art, tint, name, price, count] = r;
    if (!int(place, 0, spots.length - 1) || seen.has(place) || !int(tier, 0, TIERS.length - 1) || typeof art !== 'string' || !Object.hasOwn(ART, art)
      || typeof tint !== 'string' || !/^#[0-9a-f]{6}$/i.test(tint) || str(name, 60) == null || !int(price, 0, 1e6) || !int(count, 0, 9)) return null;
    seen.add(place);
    const p = spots[place];
    stands.push({ slot: place, shelf: p.shelf, spot: p.spot, lv: p.lv, price, card: { id: 'stand' + place, tier: TIERS[tier].id, art, tint, name, count } });
  }
  const wall = [];
  for (const [i, c] of o.w.entries()) { const k = checkCard(c); if (!k) return null; wall.push({ ...k, id: 'wall' + i }); }
  return { maker, at, renown: RENOWN[o.rw].word, rung: o.rw, size: ROOM_SIZES[o.sz], charm: Math.round(o.ch), made: o.md, sold: o.sd, stations: o.st, room, stands, wall };
}
