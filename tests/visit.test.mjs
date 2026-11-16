import test from 'node:test';
import assert from 'node:assert/strict';
import * as V from '../js/visit.js';
import * as Rm from '../js/room.js';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import * as G from '../js/growth.js';
import { packLink, unpackLink } from '../js/share.js';
import { PATTERNS, FURNITURE, MAX_SHELVES } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pats = Object.keys(PATTERNS).filter(p => !PATTERNS[p].makes);
const piece = (i, rng) => R.makePiece({ patternId: pats[i % pats.length], picks: [i % 2, 0, 0], result: { tier: i % 4, flawed: false, worked: 20, strikes: 20, heats: 2, cracks: 0, whiteHeat: true }, maker: 'Ána', rng, now: 1e12 + i });
function shopSave(big) {
  const rng = seeded(3), s = { maker: 'Ána <b>Þór</b>', coins: 1e6, cards: [], shelf: [], slots: 4, wall: [], mats: {}, trades: {}, ledger: [], queue: [], made: 812, sold: 400, renown: big ? 999 : 0, stations: big ? ['stretcher', 'bowbench', 'kettle', 'glass'] : [] };
  Rm.fixRoom(s); Sh.fixShelf(s);
  if (big) {
    s.room.size = 2;
    while (Rm.shelvesOf(s.room) < MAX_SHELVES && Rm.buy(s, 'shelf').item);
    for (const it of s.room.items.filter(i => i.kind === 'shelf')) { Rm.upgradeShelf(s, it.id); Rm.upgradeShelf(s, it.id); }
    for (const k of Object.keys(FURNITURE).filter(k => FURNITURE[k].cost && Rm.homeOf(k) !== 'work')) Rm.buy(s, k);
  }
  const n = big ? s.slots + 12 : 3;
  for (let i = 0; i < n; i++) s.cards.push(piece(i, rng));
  s.cards.forEach(c => Sh.place(s, c.id));
  if (big) Sh.inBack(s).slice(0, G.wallSlots(s)).forEach(c => G.hang(s, c.id));
  return s;
}

test('a shop packs and opens again: the room as arranged, every card on its place with its price, the wall in full', async () => {
  for (const big of [false, true]) {
    const s = shopSave(big), link = await packLink(V.packShop(s, 5)), back = V.unpackShop(await unpackLink(link));
    assert.ok(back, big ? 'big' : 'small');
    assert.equal(back.maker, 'Ána <b>Þór</b>', 'kept as text; the page escapes it');
    assert.deepEqual(back.room.items.map(i => [i.kind, i.x, i.z, i.rot, i.lv || 0]), s.room.items.map(i => [i.kind, i.x, i.z, i.rot, Rm.levelOf(i)]));
    assert.ok(Rm.valid(back.room)); assert.equal(Rm.shelfSpots(back.room).length, s.slots);
    const onShelf = s.shelf.map((e, i) => e && [i, s.cards.find(c => c.id === e.id)]).filter(Boolean);
    assert.equal(back.stands.length, onShelf.length);
    for (const [i, c] of onShelf) { const st = back.stands.find(x => x.slot === i); assert.equal(st.card.name, c.name); assert.equal(st.price, Sh.priceAt(c, 'fair')); assert.equal(st.card.tier, c.tier); }
    assert.equal(back.wall.length, (s.wall || []).length);
    back.wall.forEach((c, i) => assert.equal(c.name, s.cards.find(x => x.id === s.wall[i]).name));
    assert.equal(back.made, 812); assert.equal(back.renown, big ? 'FAMED' : 'UNKNOWN');
    assert.ok(link.length < 3000, (big ? 'big' : 'small') + ' shop link: ' + link.length + ' characters');
    if (big) { assert.ok(back.stands.length >= 40, back.stands.length + ' cards on show'); assert.ok(back.wall.length >= 3); console.log('  big shop link', link.length, 'chars,', back.stands.length, 'cards on show,', back.wall.length, 'on the wall'); }
  }
});

test('a damaged, cut-short or hostile link opens nothing', async () => {
  const s = shopSave(false), good = V.packShop(s, 5), link = await packLink(good);
  assert.equal(await unpackLink(link.slice(0, -10)), null, 'cut short');
  assert.equal(await unpackLink(link + '!'), null); assert.equal(await unpackLink(''), null); assert.equal(await unpackLink('x'.repeat(20000)), null);
  // a link that swells past any real shop when opened
  assert.equal(await unpackLink(await packLink({ v: 1, junk: 'a'.repeat(400000) })), null);
  const bad = f => { const o = JSON.parse(JSON.stringify(good)); f(o); return V.unpackShop(o); };
  assert.ok(V.unpackShop(JSON.parse(JSON.stringify(good))));
  assert.equal(bad(o => { o.it.push(['forge', 0, 4, 0, 0]); }), null, 'workshop furniture in the shop');
  assert.equal(bad(o => { o.it.push(['__proto__', 0, 4, 0, 0]); }), null, 'no such furniture');
  assert.equal(bad(o => { o.it[0][1] = 40; }), null, 'off the room');
  assert.equal(bad(o => { o.it.push(['counter', 0, 4, 0, 0]); }), null, 'two counters');
  assert.equal(bad(o => { o.it.push(o.it.find(r => r[0] === 'shelf').slice()); }), null, 'two shelves on one spot');
  assert.equal(bad(o => { o.sh[0][0] = 99; }), null, 'a card on a place the room hasn\'t got');
  assert.equal(bad(o => { o.sh.push(o.sh[0].slice()); }), null, 'two cards on one place');
  assert.equal(bad(o => { o.sh[0][3] = 'red;background:url(x)'; }), null, 'a colour that isn\'t one');
  assert.equal(bad(o => { o.sh[0][4] = 'x'.repeat(200); }), null, 'an overlong name');
  assert.equal(bad(o => { o.sh[0][2] = 'constructor'; }), null, 'no such picture');
  assert.equal(bad(o => { o.n = 'x'.repeat(300); }), null);
  assert.equal(bad(o => { o.st = ['forge', 'nuke']; }), null);
  assert.equal(bad(o => { o.v = 2; }), null);
  assert.equal(bad(o => { o.w = [{ tier: 'rare', name: 'x' }]; }), null, 'a wall card that won\'t check');
});

// ---------- the flyer's piece, and keeping a copy of it ----------
test('the flyer features the chosen piece, else the best on show; the link carries it and the shop\'s id', async () => {
  const s = shopSave(true); s.uid = 'abc123xy';
  const best = V.showable(s)[0];
  assert.equal(V.featuredOf(s).id, best.id);
  const other = V.showable(s)[3]; s.flyerPick = other.id; assert.equal(V.featuredOf(s).id, other.id);
  const back = V.unpackShop(await unpackLink(await packLink(V.packShop(s, 5))));
  assert.equal(back.uid, 'abc123xy'); assert.equal(back.featured.name, other.name); assert.equal(back.featured.tier, other.tier);
  const bad = o => V.unpackShop({ ...V.packShop(s, 5), ...o });
  assert.equal(bad({ u: 'A B<script>' }), null); assert.equal(bad({ f: { tier: 'rare' } }), null);
  assert.ok(bad({ u: '', f: null }), 'an older link without them still opens');
});

test('keeping a copy: one a shop, never your own; a sample that sells as a plain Common and can\'t be reworked, broken or hung', () => {
  const owner = shopSave(true); owner.uid = 'owner001';
  const shop = V.unpackShop(JSON.parse(JSON.stringify(V.packShop(owner, 5))));
  const me = { uid: 'visitor1', kept: [], cards: [], shelf: [], slots: 4, wall: [], mats: {}, trades: {}, made: 0 }; Sh.fixShelf(me);
  assert.equal(V.keepCopy({ ...me, uid: 'owner001' }, shop).why, 'own');
  const r = V.keepCopy(me, shop, 99); assert.ok(r.card);
  assert.equal(V.keepCopy(me, shop, 100).why, 'already'); assert.equal(me.cards.length, 1);
  assert.equal(V.keepCopy(me, { ...shop, uid: '' }).why, 'an old link');
  const c = r.card;
  assert.equal(c.name, shop.featured.name); assert.equal(c.tier, shop.featured.tier); assert.ok(c.sample); assert.match(c.made.at(-1), /flyer/);
  const plain = R.makePiece({ patternId: c.pattern, picks: [0, 0, 0], result: { tier: 0, flawed: false, worked: 0, strikes: 0, heats: 0, cracks: 0 }, maker: '', rng: () => 0, now: 1 });
  assert.equal(c.worth, plain.worth); assert.ok(c.worth < shop.featured.worth);
  assert.ok(!Sh.canRework({ ...me, trades: { [c.pattern]: { xp: 1e6 } } }, c)); assert.deepEqual(Sh.salvageOf(c), []); assert.equal(Sh.salvage(me, c.id), null);
  assert.equal(G.hang(me, c.id), false);
  assert.ok(!Sh.fills({ pattern: c.pattern, least: 0, metal: null }, c), 'a copy never fills a special order');
  // it waits in the back until the first piece is made
  assert.equal(Sh.place(me, c.id), -1); me.made = 1; assert.equal(Sh.place(me, c.id), 0);
  // and it sells, at a sample's price
  me.queue = [{ kind: 'buyer', who: 'x', want: 'any', purse: 9999, mood: 'EAGER', least: 0, wait: 45, shows: 0 }]; me.ledger = []; me.coins = 0;
  assert.equal(Sh.haggle(me, c.id, 'hold', 1).outcome, 'sold'); assert.equal(me.coins, Sh.priceAt(c, 'fair'));
});
