// The shop's room, with no page access: the grid, what stands on it, buying, moving, selling back, and making the room bigger.
import { FURNITURE, ROOM_SIZES, DOOR_Z, SHELF_COSTS, MAX_SHELVES, CHARM_MAX, CHARM_STEP, START_SLOTS, STATIONS } from './data.js?v=6';
import { wallCharm } from './growth.js?v=6';

export const sizeOf = room => ROOM_SIZES[room.size || 0];
// the footprint, turned: rot 0 or 2 as authored, 1 or 3 swapped
export const fpOf = it => { const f = FURNITURE[it.kind].fp; return it.rot % 2 ? [f[1], f[0]] : [f[0], f[1]]; };
export const tilesOf = it => { const [fx, fz] = fpOf(it), out = []; for (let x = 0; x < fx; x++) for (let z = 0; z < fz; z++) out.push([it.x + x, it.z + z]); return out; };
const key = (x, z) => x + ',' + z;
// tiles that must stay clear: the door's, and the row in front of the counter (where customers stand)
export function kept(room) {
  const out = new Set([key(0, DOOR_Z)]);
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

// the starting shop: forge and anvil at the back, the counter near the front, shelves where they fit
export function defaultRoom(shelves = 2, size = 0) {
  const room = { size, items: [
    { id: 'forge', kind: 'forge', x: 0, z: 0, rot: 0 },
    { id: 'anvil', kind: 'anvil', x: 2, z: 1, rot: 0 },
    { id: 'counter', kind: 'counter', x: 3, z: 2, rot: 0 },
  ] };
  const spots = [{ x: 3, z: 0, rot: 0 }, { x: 5, z: 1, rot: 1 }];
  for (let i = 0; i < shelves; i++) {
    const want = spots[i] && { id: 'shelf-' + i, kind: 'shelf', ...spots[i] };
    const it = want && fits(room, want) ? want : firstFree(room, 'shelf', 'shelf-' + i);
    if (!it) break;
    room.items.push(it);
  }
  return room;
}
export const shelvesOf = room => room.items.filter(i => i.kind === 'shelf').length;
// the room's charm, and the wall's pieces with it, under the one cap
export function charm(room, save) { return Math.min(CHARM_MAX, room.items.reduce((c, i) => c + (FURNITURE[i.kind].charm || 0), 0) + (save ? wallCharm(save) : 0)); }
// how much sooner customers come for the room's charm (a multiplier on the gap between them)
export const charmGap = save => save.room ? 1 / (1 + charm(save.room, save) * CHARM_STEP) : 1;

// a room that won't read (an older save, or a broken one) is rebuilt; shelf places always match the shelves
export function valid(room) {
  if (!room || !Array.isArray(room.items) || !ROOM_SIZES[room.size || 0]) return false;
  if (!room.items.every(i => FURNITURE[i.kind])) return false;
  for (const k of ['forge', 'anvil', 'counter']) if (room.items.filter(i => i.kind === k).length !== 1) return false;
  if (room.items.filter(i => i.kind === 'stretcher').length > 1) return false;
  return room.items.every(i => fits(room, i, i.id));
}
export function fixRoom(save) {
  if (!valid(save.room)) {
    const want = Math.max(2, Math.ceil((save.slots || START_SLOTS) / 2));
    let size = (save.room && ROOM_SIZES[save.room.size] ? save.room.size : 0), room = defaultRoom(want, size);
    while (shelvesOf(room) < want && size < ROOM_SIZES.length - 1) room = defaultRoom(want, ++size);   // more shelves than a small shop holds
    save.room = room;
  }
  save.slots = Math.max(START_SLOTS, shelvesOf(save.room) * 2);
  // a station the shop has set up always stands in the room
  for (const id of save.stations || []) if (!save.room.items.some(i => i.kind === id)) {
    let it = firstFree(save.room, id, id);
    while (!it && (save.room.size || 0) < ROOM_SIZES.length - 1) { save.room.size++; it = firstFree(save.room, id, id); }
    if (it) save.room.items.push(it);
  }
}
// ---------- stations: set one up, and it stands in the room ----------
export const owns = (save, id) => id === 'forge' || (save.stations || []).includes(id);
export function buyStation(save, id) {
  const st = STATIONS[id];
  if (!st || owns(save, id)) return { why: 'yours already' };
  if (save.coins < st.cost) return { why: 'not enough coin' };
  const it = firstFree(save.room, id, id);
  if (!it) return { why: 'no room: move things, or make the shop bigger' };
  save.coins -= st.cost; save.room.items.push(it); save.stations = (save.stations || []).concat(id);
  return { item: it };
}

// ---------- buying, moving, selling back, growing ----------
export const shelfCost = room => SHELF_COSTS[shelvesOf(room) - 2];
export const costOf = (room, kind) => kind === 'shelf' ? shelfCost(room) : FURNITURE[kind].cost;
// buy and place where it first fits. Returns the new piece, or a reason it can't be had (nothing is paid then).
export function buy(save, kind) {
  const f = FURNITURE[kind];
  if (!f || f.fixed) return { why: 'not for sale' };
  if (kind === 'shelf' && shelvesOf(save.room) >= MAX_SHELVES) return { why: 'as many shelves as a shop can use' };
  const cost = costOf(save.room, kind);
  if (cost == null) return { why: 'not for sale' };
  if (save.coins < cost) return { why: 'not enough coin' };
  const it = firstFree(save.room, kind, newId(kind));
  if (!it) return { why: 'no room: move things, or make the shop bigger' };
  save.coins -= cost; save.room.items.push(it);
  if (f.slots) { save.slots += f.slots; while (save.shelf.length < save.slots) save.shelf.push(null); }
  return { item: it };
}
export function move(save, id, x, z, rot) {
  const it = save.room.items.find(i => i.id === id);
  if (!it) return false;
  const to = { ...it, x, z, rot: rot == null ? it.rot : rot };
  if (!fits(save.room, to, id)) return false;
  Object.assign(it, to);
  return true;
}
export const turn = (save, id) => { const it = save.room.items.find(i => i.id === id); return !!it && move(save, id, it.x, it.z, (it.rot + 1) % 4); };
// sell back for half: never the forge, anvil or counter; a shelf only while it's the last shelf's places that are empty
export function sellBack(save, id) {
  const it = save.room.items.find(i => i.id === id), f = it && FURNITURE[it.kind];
  if (!it || f.fixed) return { why: 'it stays' };
  if (it.kind === 'shelf') {
    if (shelvesOf(save.room) <= 2) return { why: 'a shop keeps two shelves' };
    if (save.shelf.slice(-2).some(Boolean)) return { why: 'take the pieces off the last shelf first' };
  }
  const paid = it.kind === 'shelf' ? SHELF_COSTS[shelvesOf(save.room) - 3] : f.cost;
  save.room.items = save.room.items.filter(i => i !== it);
  save.coins += Math.floor(paid / 2);
  if (it.kind === 'shelf') { save.slots -= 2; save.shelf = save.shelf.slice(0, save.slots); }
  return { refund: Math.floor(paid / 2) };
}
export const nextSize = room => ROOM_SIZES[(room.size || 0) + 1];
export function expand(save) {
  const next = nextSize(save.room);
  if (!next || save.coins < next.cost) return false;
  save.coins -= next.cost; save.room.size = (save.room.size || 0) + 1;
  return true;
}
