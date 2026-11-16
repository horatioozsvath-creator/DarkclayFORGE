import test from 'node:test';
import assert from 'node:assert/strict';
import * as Hl from '../js/hall.js';
import * as Rm from '../js/room.js';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import * as G from '../js/growth.js';
import * as V from '../js/visit.js';
import { packLink, unpackLink } from '../js/share.js';
import { HALL, HALL_RENOWN, FURNITURE } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const piece = (tier, i = 0) => { const c = R.makePiece({ patternId: 'falchion', picks: [3, 2, 0], result: { tier: Math.min(tier, 3), flawed: false, worked: 20, strikes: 20, heats: 2, cracks: 0, whiteHeat: true }, maker: 'T', rng: seeded(i + 1), now: i }); if (tier === 4) return { ...R.relicPiece(c, 'gatewarden'), tier: 'relic' }; return c; };
function maker(o = {}) { const s = { coins: 100000, mats: {}, cards: [], shelf: [], slots: 4, wall: [], ledger: [], queue: [], stations: [], renown: 1100, ...o }; Rm.fixRoom(s); Sh.fixShelf(s); return s; }

test('the Hall: built from RENOWNED for its price; four plinths in a valid room of its own', () => {
  assert.ok(Hl.buy(maker({ renown: 600 })).why); assert.ok(Hl.buy(maker({ coins: 10 })).why);
  const s = maker(); assert.ok(Hl.buy(s).ok); assert.equal(s.coins, 100000 - HALL.cost); assert.ok(Hl.buy(s).why);
  assert.ok(Rm.valid(s.hall)); assert.equal(Rm.hallSpots(s.hall).length, HALL.plinths);
  // more places: a plinth, a glass case of three; a bigger hall
  assert.ok(Rm.buy(s, 'plinth').item); assert.ok(Rm.buy(s, 'hallcase').item); assert.equal(Rm.hallSpots(s.hall).length, HALL.plinths + 4);
  assert.ok(Rm.expand(s, 'hall')); assert.equal(Rm.sizeOf(s.hall).w, 8);
  assert.ok(Rm.buy(s, 'lamp', 'hall').item, 'decor too'); assert.ok(Rm.buy(s, 'shelf').item && !s.hall.items.some(i => i.kind === 'shelf'), 'shelves stay in the shop');
});

test('only Old-Blood and better, from the back room; shown, a piece is off the shelves and the wall and adds renown and charm', () => {
  const s = maker(); Hl.buy(s);
  const [common, ob, relic] = [piece(0, 1), piece(3, 2), piece(4, 3)]; s.cards.push(common, ob, relic);
  const keys = Rm.hallSpots(s.hall).map(p => p.key);
  assert.equal(Hl.show(s, keys[0], common.id), false, 'not good enough for the Hall');
  const r0 = G.renownOf(s), c0 = Rm.charm(s.room, s);
  assert.ok(Hl.show(s, keys[0], relic.id)); assert.ok(Hl.show(s, keys[1], ob.id)); assert.equal(Hl.show(s, keys[1], relic.id), false, 'one piece a place');
  assert.equal(G.renownOf(s), r0 + HALL_RENOWN.relic + HALL_RENOWN.oldblood); assert.ok(Rm.charm(s.room, s) > c0);
  assert.equal(Sh.place(s, relic.id), -1); assert.equal(G.hang(s, ob.id), false); assert.ok(!Sh.inBack(s).some(c => c.id === relic.id));
  assert.equal(Sh.salvage(s, ob.id), null);
  // a plinth with a piece on it can't be sold; taken down, it can
  const plinth = s.hall.items.find(i => keys[0].startsWith(i.id + ':'));
  assert.ok(Rm.sellBack(s, plinth.id).why); Hl.takeDown(s, keys[0]); assert.ok(Rm.sellBack(s, plinth.id).refund > 0);
  Hl.tidy(s); assert.ok(!Object.keys(s.hall.shown).includes(keys[0]));
  // a piece that's gone leaves its place empty
  s.cards = s.cards.filter(c => c.id !== ob.id); Hl.tidy(s); assert.deepEqual(s.hall.shown, {});
});

test('the Hall travels in a shop link and shows on the visit; the flyer can feature a piece from it', async () => {
  const s = maker({ uid: 'abcd1234' }); Hl.buy(s); const relic = piece(4, 5); s.cards.push(relic);
  Hl.show(s, Rm.hallSpots(s.hall)[0].key, relic.id);
  assert.equal(V.featuredOf(s).id, relic.id, 'the best on show, the Hall\'s included');
  const back = V.unpackShop(await unpackLink(await packLink(V.packShop(s, 5))));
  assert.equal(back.hall.length, 1); assert.equal(back.hall[0].name, 'Gatewarden'); assert.deepEqual(back.hall[0].power, relic.power);
  assert.equal(V.unpackShop({ ...V.packShop(s, 5), hl: [{ tier: 'relic' }] }), null, 'a Hall card that won\'t check');
});
