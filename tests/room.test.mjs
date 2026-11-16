import test from 'node:test';
import assert from 'node:assert/strict';
import * as Rm from '../js/room.js';
import * as Sh from '../js/shop.js';
import * as St from '../js/staff.js';
import { FURNITURE, ROOM_SIZES, DOOR_Z, MAX_SHELVES, CHARM_MAX, SHELF_COSTS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const piece = id => ({ id, pattern: 'dagger', tier: 'common', name: 'Dagger', worth: 24, metal: 'iron', affixes: [], made: [] });
function oldSave(slots, filled) {
  const cards = []; for (let i = 0; i < filled; i++) cards.push(piece('p' + i));
  const s = { coins: 100, mats: {}, cards, slots, shelf: [], ledger: [], queue: [] };
  Sh.fixShelf(s); cards.forEach(c => Sh.place(s, c.id)); return s;
}

test('the starting room is valid and keeps the door and the counter\'s front clear', () => {
  const r = Rm.defaultRoom();
  assert.ok(Rm.valid(r)); assert.equal(Rm.shelvesOf(r), 2);
  const k = Rm.kept(r); assert.ok(k.has('0,' + DOOR_Z));
  const taken = new Set(r.items.flatMap(i => Rm.tilesOf(i).map(t => t.join(','))));
  for (const t of k) assert.ok(!taken.has(t), t + ' kept clear');
});

test('every older save keeps its pieces on the shelf and gets a valid room', () => {
  for (let slots = 4; slots <= 8; slots++) for (let filled = 0; filled <= slots; filled++) {
    const s = oldSave(slots, filled), before = s.shelf.filter(Boolean).map(e => e.id);
    Rm.fixRoom(s); Sh.fixShelf(s);
    assert.ok(Rm.valid(s.room), slots + ' slots');
    assert.ok(s.slots >= slots, slots + ' slots kept: ' + s.slots);
    assert.equal(s.slots, Rm.shelvesOf(s.room) * 2);
    assert.deepEqual(s.shelf.filter(Boolean).map(e => e.id), before, 'pieces stay on the shelf');
    Rm.fixRoom(s); Sh.fixShelf(s); assert.equal(s.shelf.length, s.slots, 'a second load changes nothing');
  }
});

test('placing: inside the room, no overlap, not on kept tiles, in the right room', () => {
  const s = { room: Rm.defaultRoom(), workshop: Rm.defaultWorkshop() };
  assert.ok(!Rm.fits(s.workshop, { id: 'x', kind: 'barrels', x: 0, z: 0, rot: 0 }), 'on the forge');
  assert.ok(!Rm.fits(s.room, { id: 'x', kind: 'barrels', x: 1, z: 0, rot: 0 }), 'in the way through to the workshop');
  assert.ok(!Rm.fits(s.room, { id: 'x', kind: 'forge', x: 0, z: 0, rot: 0 }), 'no forge in the shop front');
  assert.ok(!Rm.fits(s.workshop, { id: 'x', kind: 'shelf', x: 3, z: 3, rot: 0 }), 'no shelves in the workshop');
  assert.ok(!Rm.fits(s.room, { id: 'x', kind: 'barrels', x: 0, z: DOOR_Z, rot: 0 }), 'in the doorway');
  assert.ok(!Rm.fits(s.room, { id: 'x', kind: 'barrels', x: 6, z: 0, rot: 0 }), 'outside');
  assert.ok(!Rm.fits(s.room, { id: 'x', kind: 'barrels', x: 3, z: 3, rot: 0 }), 'in front of the counter');
  assert.ok(Rm.fits(s.room, { id: 'x', kind: 'barrels', x: 0, z: 4, rot: 0 }));
});

test('buying furniture: paid only when it fits; shelves add two places', () => {
  const s = { coins: 5000, room: Rm.defaultRoom(), slots: 4, shelf: [null, null, null, null] };
  const r = Rm.buy(s, 'shelf'); assert.ok(r.item); assert.equal(s.slots, 6); assert.equal(s.shelf.length, 6); assert.equal(s.coins, 5000 - SHELF_COSTS[0]);
  assert.ok(Rm.buy(s, 'lamp').item);
  let guard = 0; while (Rm.buy(s, 'barrels').item && guard++ < 50);
  const coins = s.coins, why = Rm.buy(s, 'barrels').why;
  assert.match(why, /no room/); assert.equal(s.coins, coins, 'nothing paid');
  assert.ok(Rm.valid(s.room));
  assert.equal(Rm.buy(s, 'forge').why, 'not for sale');
  const poor = { coins: 0, room: Rm.defaultRoom(), slots: 4, shelf: [] }; assert.equal(Rm.buy(poor, 'lamp').why, 'not enough coin');
});

test('moving and turning keep both rooms valid', () => {
  const s = { room: Rm.defaultRoom(), workshop: Rm.defaultWorkshop() };
  assert.ok(!Rm.move(s, 'forge', 2, 1), 'onto the anvil');
  assert.ok(Rm.move(s, 'anvil', 4, 4)); assert.ok(Rm.valid(s.workshop));
  assert.ok(!Rm.move(s, 'counter', 3, 0), 'onto a shelf');
  assert.ok(Rm.move(s, 'counter', 0, 1)); assert.ok(Rm.valid(s.room));
  Rm.turn(s, 'forge'); assert.ok(Rm.valid(s.workshop));
});

test('selling back: half the price; never the forge; a shelf only when its places are empty', () => {
  const s = { coins: 5000, room: Rm.defaultRoom(), slots: 4, shelf: [null, null, null, null], cards: [] };
  const lamp = Rm.buy(s, 'lamp').item; assert.equal(Rm.sellBack(s, lamp.id).refund, Math.floor(FURNITURE.lamp.cost / 2));
  assert.equal(Rm.sellBack(s, 'forge').why, 'it stays');
  assert.match(Rm.sellBack(s, 'shelf-0').why, /two shelves/);
  const sh = Rm.buy(s, 'shelf').item; s.cards.push(piece('a')); s.shelf[5] = { id: 'a', tag: 'fair' };
  assert.match(Rm.sellBack(s, sh.id).why, /take the pieces off/);
  s.shelf[5] = null; assert.equal(Rm.sellBack(s, sh.id).refund, SHELF_COSTS[0] / 2); assert.equal(s.slots, 4); assert.equal(s.shelf.length, 4);
});

test('a bigger shop: more room, a longer away cap', () => {
  const s = { coins: 50000, room: Rm.defaultRoom(), staff: [], slots: 4, shelf: [null, null, null, null] };
  const cap = St.awayCap(s);
  assert.ok(Rm.expand(s)); assert.equal(Rm.sizeOf(s.room).w, 8); assert.equal(St.awayCap(s), cap + ROOM_SIZES[1].capH);
  assert.ok(Rm.valid(s.room));
  assert.ok(Rm.expand(s)); assert.ok(!Rm.expand(s), 'no bigger than the biggest');
  for (let i = 0; i < MAX_SHELVES; i++) Rm.buy(s, 'shelf');
  assert.equal(Rm.shelvesOf(s.room), MAX_SHELVES);
});

test('charm brings customers sooner, up to a cap', () => {
  const s = { room: Rm.defaultRoom() };
  assert.equal(Rm.charmGap(s), 1);
  s.room.items.push(...Array.from({ length: 30 }, (_, i) => ({ id: 't' + i, kind: 'table', x: 100, z: 100, rot: 0 })));
  assert.equal(Rm.charm(s.room), CHARM_MAX);
  assert.ok(Rm.charmGap(s) > 0.6 && Rm.charmGap(s) < 1);
});

test('even at the most charm, four pieces on the shelf last a good while away', () => {
  const hours = [];
  for (let seed = 1; seed <= 30; seed++) {
    const cards = []; for (let i = 0; i < 4; i++) cards.push({ ...piece('p' + i), pattern: ['dagger', 'ring', 'falchion', 'helm'][i], worth: [24, 20, 80, 56][i] });
    const room = Rm.defaultRoom(); room.items.push(...Array.from({ length: 10 }, (_, i) => ({ id: 't' + i, kind: 'table', x: 100, z: 100, rot: 0 })));
    const s = { coins: 1000, mats: {}, cards, slots: 4, shelf: [], ledger: [], queue: [], clock: 0, found: [], room, lastSeen: 1e12,
      staff: [{ id: 'c', role: 'clerk', name: 'Wenna', trait: 'quick', xp: 0 }] };
    Sh.fixShelf(s); cards.forEach(c => Sh.place(s, c.id));
    let t = 1e12; while (s.shelf.some(Boolean) && t < 1e12 + 24 * 3600e3) { t += 900e3; St.catchUp(s, t, seeded(seed * 97 + t / 3600e3)); }
    hours.push((t - 1e12) / 3600e3);
  }
  hours.sort((a, b) => a - b);
  assert.ok(hours[15] >= 1.5, 'median ' + hours[15] + ' h');
});

test('an older one-room shop: the forge, the anvil and the stations go through to a workshop; nothing is lost', () => {
  const old = { size: 1, items: [
    { id: 'forge', kind: 'forge', x: 0, z: 0, rot: 0 }, { id: 'anvil', kind: 'anvil', x: 2, z: 1, rot: 0 }, { id: 'counter', kind: 'counter', x: 3, z: 2, rot: 0 },
    { id: 'shelf-0', kind: 'shelf', x: 3, z: 0, rot: 0 }, { id: 'shelf-1', kind: 'shelf', x: 5, z: 1, rot: 1 },
    { id: 'stretcher', kind: 'stretcher', x: 6, z: 0, rot: 0 }, { id: 'lamp-a', kind: 'lamp', x: 0, z: 4, rot: 0 } ] };
  const cards = [piece('a')], s = { slots: 4, shelf: [], cards, stations: ['stretcher'], room: old };
  Sh.fixShelf(s); Sh.place(s, 'a');
  Rm.fixRoom(s); Sh.fixShelf(s);
  assert.equal(s.room.kind, 'shop'); assert.equal(s.workshop.kind, 'work');
  assert.ok(Rm.valid(s.room)); assert.ok(Rm.valid(s.workshop));
  assert.equal(s.room.size, 1, 'the shop front keeps its size');
  assert.deepEqual(s.room.items.map(i => i.kind).sort(), ['counter', 'lamp', 'shelf', 'shelf']);
  assert.deepEqual(s.workshop.items.map(i => i.kind).sort(), ['anvil', 'forge', 'stretcher']);
  assert.equal(s.slots, 4); assert.equal(Sh.onShelf(s, 'a'), 0);
  const again = JSON.stringify([s.room, s.workshop]); Rm.fixRoom(s); assert.equal(JSON.stringify([s.room, s.workshop]), again, 'a second load changes nothing');
});

test('every station fits a small workshop, with the forge and anvil', () => {
  const w = Rm.defaultWorkshop(['stretcher', 'bowbench', 'kettle', 'glass'], 0);
  assert.ok(w && Rm.valid(w), 'all four stations in 6 x 5');
});

test('the workshop grows on its own, and stations go there', () => {
  const s = { coins: 50000, room: Rm.defaultRoom(), workshop: Rm.defaultWorkshop(), slots: 4, shelf: [null, null, null, null], stations: [] };
  assert.ok(Rm.expand(s, 'work')); assert.equal(Rm.sizeOf(s.workshop).w, 8); assert.equal(Rm.sizeOf(s.room).w, 6);
  Rm.buyStation(s, 'glass'); assert.ok(s.workshop.items.some(i => i.kind === 'glass')); assert.ok(!s.room.items.some(i => i.kind === 'glass'));
  assert.ok(Rm.buy(s, 'lamp', 'work').item); assert.ok(s.workshop.items.some(i => i.kind === 'lamp'));
  const c = Rm.charm(s.room, s); assert.equal(c, 0, 'workshop decor brings no customers');
});
