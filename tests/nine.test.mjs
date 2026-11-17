// Milestone 18: mastery by the station, the Court's once-only purchase of each Mythic, and the ending.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import * as G from '../js/growth.js';
import * as V from '../js/visit.js';
import * as Rm from '../js/room.js';
import { MYTHICS, RELICS, STATIONS, NINE, HALL_CHARM } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const xpTo = lvl => { let x = 0; for (let l = 1; l < lvl; l++) x += R.xpToNext(l); return x; };
const reach = (o = {}) => ({ renown: 4000, wall: [], cards: [], shelf: [null, null], slots: 2, mats: {}, stations: Object.keys(STATIONS).filter(k => k !== 'forge'), ledger: [], clock: 0, found: ['ember'], made: 5, ...o });
const piece = (pattern, tier) => R.makePiece({ patternId: pattern, picks: [0, 0, 0], result: { tier, flawed: false, worked: 20, strikes: 20, heats: 2, cracks: 0, whiteHeat: true }, maker: 'T', rng: seeded(2), now: 1 });
const relicOf = id => ({ ...R.relicPiece(piece(RELICS[id].pattern, 4), id), tier: 'relic' });
const mythicOf = id => R.mythicPiece({ ...relicOf(MYTHICS[id].relic), tier: 'mythic' }, id);

test('a Relic asks trade 7 in something at its station and trade 5 in its own pattern (milestone 34: was 9 at the station)', () => {
  const helm = piece('helm', 3), hk = Object.keys(RELICS).find(k => RELICS[k].pattern === 'helm');
  const s = reach({ cards: [helm], blueprints: [hk], trades: { falchion: { xp: xpTo(7) }, helm: { xp: xpTo(4) } } });
  assert.match(Sh.relicFor(s, helm).why.join(), /trade 5 in/);
  s.trades.helm.xp = xpTo(5); assert.ok(Sh.relicFor(s, helm).ok, 'a master of the forge works the helm at trade 5');
  s.trades = { helm: { xp: xpTo(6) } }; assert.match(Sh.relicFor(s, helm).why.join(), /trade 7 in something at the forge/);
  s.trades = { lens: { xp: xpTo(9) }, helm: { xp: xpTo(5) } }; assert.ok(!Sh.relicFor(s, helm).ok, 'mastery at another station doesn\'t count');
});

test('one of the Nine: never on a shelf; the Court asks for it once, pays twice its worth, and only it fills that order', () => {
  const m = mythicOf('vericsedge'), s = reach({ cards: [m] });
  assert.equal(Sh.place(s, m.id, 0), -1, 'not for ordinary buyers');
  let posted = null;
  for (let i = 0; i < 40 && !posted; i++) { const t = reach({ cards: [m] }); Sh.postOrder(t, seeded(i), 0); if (t.order && t.order.mythic) posted = t; }
  assert.ok(posted, 'the Court asks');
  const o = posted.order; assert.equal(o.mythic, 'vericsedge'); assert.equal(o.pays, m.worth * NINE.courtPays); assert.match(Sh.orderWord(o), /one of the Nine/);
  assert.deepEqual(posted.courtAsked, ['vericsedge']);
  // asked once: never again for that one, whatever happens to the order
  posted.order = null; for (let i = 0; i < 60; i++) { Sh.postOrder(posted, seeded(100 + i), 0); assert.ok(!posted.order.mythic); posted.order = null; }
  // only the Mythic fills it; and a Mythic fills no other order
  const t = reach({ cards: [m, piece('falchion', 3)] }); t.order = { ...o };
  assert.ok(!Sh.fills(t.order, t.cards[1])); assert.ok(Sh.fills(t.order, m));
  assert.ok(!Sh.fills({ pattern: 'falchion', least: 1, metal: null }, m), 'a regular\'s order takes no Mythic');
  const coins = t.coins = 0, e = Sh.deliver(t, m.id, 1);
  assert.ok(e); assert.equal(t.coins, coins + o.pays); assert.ok(!t.cards.includes(m));
});

test('the ending: all Nine made (sold or kept) is the Maker of the Nine; the Hall\'s charm doubles; shop links carry it', () => {
  const ids = Object.keys(MYTHICS), s = reach({ mythicsMade: ids.slice(0, 8) });
  assert.ok(!G.isNine(s)); s.mythicsMade = ids; assert.ok(G.isNine(s));
  const shown = mythicOf(ids[0]), hs = reach({ cards: [shown], hall: { shown: {} } });
  hs.hall.shown = { p0: shown.id };
  const before = G.hallCharm(hs); assert.ok(before > 0); assert.equal(before, HALL_CHARM.mythic);
  hs.mythicsMade = ids; assert.equal(G.hallCharm(hs), before * NINE.hallCharm);
  // the shop link: the Nine as a flag, read back; anything else in its place and the link won't open
  const shop = reach({ maker: 'T', coins: 0, trades: {}, queue: [], sold: 0, stations: [] }); Rm.fixRoom(shop); Sh.fixShelf(shop);
  const plain = V.packShop(shop, 5); assert.equal(plain.n9, 0); assert.equal(V.unpackShop(plain).nine, false);
  shop.mythicsMade = ids; const nine = V.packShop(shop, 5); assert.equal(nine.n9, 1); assert.equal(V.unpackShop(nine).nine, true);
  assert.equal(V.unpackShop({ ...nine, n9: 'yes' }), null);
  assert.equal(V.unpackShop({ ...nine, n9: undefined }).nine, false, 'an older link, without it');
});
