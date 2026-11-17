// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// The shop's two rooms, with no page access: the shop front (counter, shelves, decor; where customers come) and the workshop
// behind it (the forge, the anvil and every station). A grid each, what stands on it, buying, moving, selling back, growing.
import { FURNITURE, ROOM_SIZES, WORK_SIZES, HALL_SIZES, HALL, DOOR_Z, WORK_DOOR_X, SHELF_COSTS, SHELF_LEVELS, MAX_SHELVES, CHARM_MAX, CHARM_STEP, START_SLOTS, STATIONS } from './data.js?v=50';
import { wallCharm, hallCharm } from './growth.js?v=50';

export const SIZES = { shop: ROOM_SIZES, work: WORK_SIZES, hall: HALL_SIZES };
export const sizeOf = room => SIZES[room.kind || 'shop'][room.size || 0];
// which room a kind of furniture belongs in: the forge, the anvil and the stations in the workshop; counter and shelves in front
export const homeOf = kind => FURNITURE[kind].room || 'any';
const belongs = (room, kind) => homeOf(kind) === 'any' || homeOf(kind) === (room.kind || 'shop');
// the footprint, turned: rot 0 or 2 as authored, 1 or 3 swapped
export const fpOf = it => { const f = FURNITURE[it.kind].fp; return it.rot % 2 ? [f[1], f[0]] : [f[0], f[1]]; };
export const tilesOf = it => { const [fx, fz] = fpOf(it), out = []; for (let x = 0; x < fx; x++) for (let z = 0; z < fz; z++) out.push([it.x + x, it.z + z]); return out; };
const key = (x, z) => x + ',' + z;
// tiles that must stay clear: each room's door in its left wall; in front, the way through to the workshop in the back wall and the
// row before the counter (where customers stand)
export function kept(room) {
  const out = new Set([key(0, DOOR_Z)]);
  if ((room.kind || 'shop') === 'shop') out.add(key(WORK_DOOR_X, 0));
  const c = room.items.find(i => i.kind === 'counter');
  if (c) {
    const [fx, fz] = fpOf(c);
    // the counter's front faces the room's open side (+z) when it runs along x, the room's middle (-x) when turned
    if (c.rot % 2 === 0) for (let x = 0; x < fx; x++) out.add(key(c.x + x, c.z + fz));
    else for (let z = 0; z < fz; z++) out.add(key(c.x - 1, c.z + z));
  }
  return out;
}
export function fits(room, it, ignoreId = null) {
  if (!belongs(room, it.kind)) return false;
  const { w, d } = sizeOf(room);
  const others = room.items.filter(o => o.id !== ignoreId && o.id !== it.id);
  const taken = new Set(others.flatMap(o => tilesOf(o).map(([x, z]) => key(x, z))));
  const clear = kept({ ...room, items: others.concat(it.kind === 'counter' ? [] : room.items.filter(o => o.kind === 'counter' && o.id !== it.id)) });
  if (it.kind === 'counter') { const k = kept({ ...room, items: [it] }); for (const t of k) if (taken.has(t)) return false; for (const t of k) { const [x, z] = t.split(',').map(Number); if (x < 0 || z < 0 || x >= w || z >= d) return false; } }
  return tilesOf(it).every(([x, z]) => x >= 0 && z >= 0 && x < w && z < d && !taken.has(key(x, z)) && !clear.has(key(x, z)));
}
// the first place a piece of furniture fits, back to front, turned or not
export function firstFree(room, kind, id) {
  const { w, d } = sizeOf(room);
  for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) for (const rot of [0, 1]) {
    const it = { id, kind, x, z, rot };
    if (fits(room, it)) return it;
  }
  return null;
}
let n = 0;
const newId = kind => kind + '-' + Date.now().toString(36) + (n++).toString(36);
const place = (room, it) => { const p = fits(room, it) ? it : firstFree(room, it.kind, it.id); if (p) room.items.push(p); return p; };

// the starting shop front: the counter near the front, two shelves where they fit
export function defaultShop(shelves = 2, size = 0) {
  const room = { kind: 'shop', size, items: [{ id: 'counter', kind: 'counter', x: 3, z: 2, rot: 0 }] };
  const spots = [{ x: 3, z: 0, rot: 0 }, { x: 5, z: 1, rot: 3 }];   // both facing the way the shop is seen from, so their cards show
  for (let i = 0; i < shelves; i++) if (!place(room, { id: 'shelf-' + i, kind: 'shelf', ...(spots[i] || { x: 0, z: 0, rot: 0 }) })) break;
  return room;
}
// the starting workshop: the forge in the corner, the anvil before it, every station set up where it fits
export function defaultWorkshop(stations = [], size = 0) {
  const room = { kind: 'work', size, items: [{ id: 'forge', kind: 'forge', x: 0, z: 0, rot: 0 }, { id: 'anvil', kind: 'anvil', x: 2, z: 1, rot: 0 }] };
  for (const id of stations) if (!place(room, { id, kind: id, x: 0, z: 0, rot: 0 })) return null;
  return room;
}
export const defaultRoom = defaultShop;   // the shop front is "the room" everywhere the customers are
export const shelvesOf = room => room.items.filter(i => i.kind === 'shelf').length;
// a shelf's level (0: a plain shelf), its places, and all the shelf places in a room
export const levelOf = it => Math.min(SHELF_LEVELS.length - 1, Math.max(0, it.lv | 0));
export const placesOf = it => SHELF_LEVELS[levelOf(it)].places;
export const placesIn = room => room.items.filter(i => i.kind === 'shelf').reduce((n, s) => n + placesOf(s), 0);
// where each shelf place stands: the shelves in the room's order, each one's places in turn (spot: which place on that shelf)
export const shelfSpots = room => room.items.filter(i => i.kind === 'shelf').flatMap(s => Array.from({ length: placesOf(s) }, (_, k) => ({ shelf: s.id, spot: k, lv: levelOf(s) })));
const spotsOfShelf = (room, id) => shelfSpots(room).map((p, i) => p.shelf === id ? i : -1).filter(i => i >= 0);
// make a shelf better where it stands: its new places go in after its own, so every piece stays on the shelf it was on
export function upgradeShelf(save, id) {
  const it = save.room.items.find(i => i.id === id && i.kind === 'shelf');
  if (!it) return { why: 'no such shelf' };
  const next = SHELF_LEVELS[levelOf(it) + 1];
  if (!next) return { why: 'as fine as a shelf gets' };
  if (save.coins < next.cost) return { why: 'not enough coin' };
  const at = spotsOfShelf(save.room, id).pop() + 1, more = next.places - placesOf(it);
  save.coins -= next.cost; it.lv = levelOf(it) + 1;
  save.shelf.splice(at, 0, ...Array(more).fill(null)); save.slots += more;
  return { level: it.lv, places: next.places };
}
// the shop front's charm, and the wall's pieces with it, under the one cap (the workshop's decor is for the maker's eyes only)
export function charm(room, save) { return Math.min(CHARM_MAX, room.items.reduce((c, i) => c + (FURNITURE[i.kind].charm || 0) + (i.kind === 'shelf' ? SHELF_LEVELS[levelOf(i)].charm || 0 : 0), 0) + (save ? wallCharm(save) + hallCharm(save) : 0)); }
// how much sooner customers come for the room's charm (a multiplier on the gap between them)
export const charmGap = save => save.room ? 1 / (1 + charm(save.room, save) * CHARM_STEP) : 1;

// a room that won't read (an older save, or a broken one) is rebuilt; shelf places always match the shelves
export function valid(room) {
  if (!room || !Array.isArray(room.items) || !SIZES[room.kind || 'shop'] || !sizeOf(room)) return false;
  if (!room.items.every(i => FURNITURE[i.kind] && belongs(room, i.kind))) return false;
  const must = { shop: ['counter'], work: ['forge', 'anvil'], hall: [] }[room.kind || 'shop'];
  for (const k of must) if (room.items.filter(i => i.kind === k).length !== 1) return false;
  for (const id of Object.keys(STATIONS)) if (room.items.filter(i => i.kind === id).length > 1) return false;
  return room.items.every(i => fits(room, i, i.id));
}
// older saves had one room with everything in it: the forge, the anvil and the stations go through to a workshop of their own
export function fixRoom(save) {
  if (save.room && !save.room.kind) {
    const old = save.room, work = old.items.filter(i => homeOf(i.kind) === 'work');
    save.room = { kind: 'shop', size: old.size || 0, items: old.items.filter(i => homeOf(i.kind) !== 'work') };
    if (!save.workshop) save.workshop = { kind: 'work', size: 0, items: work.map(i => ({ ...i })) };
  }
  if (!valid(save.room)) {
    const want = Math.max(2, Math.ceil((save.slots || START_SLOTS) / 2)), keep = save.room && valid({ ...save.room, items: [] }) ? save.room.items.filter(i => FURNITURE[i.kind] && (!FURNITURE[i.kind].fixed || FURNITURE[i.kind].gift) && i.kind !== 'shelf') : [];
    let size = save.room && SIZES.shop[save.room.size] ? save.room.size : 0, room = defaultShop(want, size);
    while (shelvesOf(room) < want && size < ROOM_SIZES.length - 1) room = defaultShop(want, ++size);   // more shelves than a small shop holds
    keep.forEach(i => place(room, { ...i }));   // the decor goes back where it fits
    save.room = room;
  }
  // once: the starting side shelf stood with its back to the view, hiding its cards; turned round where it was never moved
  if (!save.faced) { const s1 = save.room.items.find(i => i.id === 'shelf-1' && i.x === 5 && i.z === 1 && i.rot === 1); if (s1 && fits(save.room, { ...s1, rot: 3 }, s1.id)) s1.rot = 3; save.faced = 1; }
  save.slots = Math.max(START_SLOTS, placesIn(save.room));
  const stations = (save.stations || []).filter(id => STATIONS[id]);
  if (!valid(save.workshop) || stations.some(id => !save.workshop.items.some(i => i.kind === id))) {
    // keep what stands where it stands; put back what's missing; if it won't do, lay the workshop out afresh, bigger if need be
    let size = save.workshop && SIZES.work[save.workshop.size] ? save.workshop.size : 0;
    let room = save.workshop && Array.isArray(save.workshop.items) ? { kind: 'work', size, items: [] } : null;
    if (room) for (const i of save.workshop.items) if (FURNITURE[i.kind] && belongs(room, i.kind) && !room.items.some(o => o.kind === i.kind && FURNITURE[i.kind].fixed)) place(room, { ...i });
    if (room) for (const k of ['forge', 'anvil', ...stations]) if (!room.items.some(i => i.kind === k) && !place(room, { id: k, kind: k, x: 0, z: 0, rot: 0 })) room = null;
    if (!room || !valid(room)) { room = null; for (; !room && size < WORK_SIZES.length; size++) room = defaultWorkshop(stations, size); }
    save.workshop = room || defaultWorkshop([], 0);
  }
}
export const roomOf = (save, which) => which === 'work' ? save.workshop : which === 'hall' ? save.hall : save.room;
export const roomWith = (save, id) => [save.room, save.workshop, save.hall].find(r => r && r.items.some(i => i.id === id));
// ---------- THE HALL: a gallery room (data.js HALL) ----------
export function defaultHall() {
  const room = { kind: 'hall', size: 0, items: [], shown: {} };
  for (let i = 0; i < HALL.plinths; i++) { const it = firstFree(room, 'plinth', 'plinth-' + i); if (it) room.items.push(it); }
  return room;
}
// its places: each plinth's one, each case's three, in the room's order; key: 'item:spot' (what hall.shown maps to a card)
export const hallSpots = room => room.items.filter(i => FURNITURE[i.kind].places).flatMap(i => Array.from({ length: FURNITURE[i.kind].places }, (_, k) => ({ item: i.id, kind: i.kind, spot: k, key: i.id + ':' + k })));

// ---------- stations: set one up, and it stands in the workshop ----------
export const owns = (save, id) => id === 'forge' || (save.stations || []).includes(id);
export function buyStation(save, id) {
  const st = STATIONS[id];
  if (!st || owns(save, id)) return { why: 'yours already' };
  if (save.coins < st.cost) return { why: 'not enough coin' };
  const it = firstFree(save.workshop, id, id);
  if (!it) return { why: 'no room: move things, or make the workshop bigger' };
  save.coins -= st.cost; save.workshop.items.push(it); save.stations = (save.stations || []).concat(id);
  return { item: it };
}

// ---------- buying, moving, selling back, growing ----------
export const shelfCost = room => SHELF_COSTS[shelvesOf(room) - 2];
export const costOf = (room, kind) => kind === 'shelf' ? shelfCost(room) : FURNITURE[kind].cost;
// buy and place where it first fits, in the shop front or the workshop. Returns the new piece, or why it can't be had (nothing paid).
export function buy(save, kind, which = 'shop') {
  const f = FURNITURE[kind], room = homeOf(kind) === 'shop' ? save.room : homeOf(kind) === 'hall' ? save.hall : roomOf(save, which);
  if (!room) return { why: 'no hall yet' };
  if (!f || f.fixed) return { why: 'not for sale' };
  if (kind === 'shelf' && shelvesOf(save.room) >= MAX_SHELVES) return { why: 'as many shelves as a shop can use' };
  const cost = costOf(save.room, kind);
  if (cost == null) return { why: 'not for sale' };
  if (save.coins < cost) return { why: 'not enough coin' };
  const it = firstFree(room, kind, newId(kind));
  if (!it) return { why: 'no room: move things, or make the ' + (room.kind === 'work' ? 'workshop' : 'shop front') + ' bigger' };
  save.coins -= cost; room.items.push(it);
  if (f.slots) { save.slots += f.slots; while (save.shelf.length < save.slots) save.shelf.push(null); }
  return { item: it };
}
export function move(save, id, x, z, rot) {
  const room = roomWith(save, id), it = room && room.items.find(i => i.id === id);
  if (!it) return false;
  const to = { ...it, x, z, rot: rot == null ? it.rot : rot };
  if (!fits(room, to, id)) return false;
  Object.assign(it, to);
  return true;
}
export const turn = (save, id) => { const r = roomWith(save, id), it = r && r.items.find(i => i.id === id); return !!it && move(save, id, it.x, it.z, (it.rot + 1) % 4); };
// sell back for half: never the forge, anvil, counter or a station; a shelf only once its own places are empty (its upgrades
// come back at half too)
export function sellBack(save, id) {
  const room = roomWith(save, id), it = room && room.items.find(i => i.id === id), f = it && FURNITURE[it.kind];
  if (!it || f.fixed) return { why: 'it stays' };
  if (FURNITURE[it.kind].places && room.shown && Object.keys(room.shown).some(k => k.startsWith(it.id + ':'))) return { why: 'take its pieces off first' };
  if (it.kind === 'shelf') {
    if (shelvesOf(save.room) <= 2) return { why: 'a shop keeps two shelves' };
    if (spotsOfShelf(save.room, id).some(i => save.shelf[i])) return { why: 'take the pieces off it first' };
  }
  const paid = it.kind === 'shelf' ? SHELF_COSTS[shelvesOf(save.room) - 3] + SHELF_LEVELS.slice(1, levelOf(it) + 1).reduce((c, l) => c + l.cost, 0) : f.cost;
  const gone = it.kind === 'shelf' ? new Set(spotsOfShelf(save.room, id)) : null;
  room.items = room.items.filter(i => i !== it);
  save.coins += Math.floor(paid / 2);
  if (gone) { save.shelf = save.shelf.filter((_, i) => !gone.has(i)); save.slots = save.shelf.length; }
  return { refund: Math.floor(paid / 2) };
}
// a gift from a regular: put out in the shop front where it first fits, else kept in the store room (save.stored) until there's room
export function placeGift(save, kind) {
  const it = FURNITURE[kind] && firstFree(save.room, kind, newId(kind));
  if (it) { save.room.items.push(it); return { item: it }; }
  save.stored = (save.stored || []).concat(kind);
  return { stored: true };
}
export function putOut(save, kind) {
  const i = (save.stored || []).indexOf(kind); if (i < 0) return { why: 'not in the store room' };
  const it = firstFree(save.room, kind, newId(kind)); if (!it) return { why: 'no room: move things, or make the shop front bigger' };
  save.room.items.push(it); save.stored.splice(i, 1);
  return { item: it };
}
export const nextSize = room => SIZES[room.kind || 'shop'][(room.size || 0) + 1];
export function expand(save, which = 'shop') {
  const room = roomOf(save, which), next = nextSize(room);
  if (!next || save.coins < next.cost) return false;
  save.coins -= next.cost; room.size = (room.size || 0) + 1;
  return true;
}
