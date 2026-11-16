import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../js/growth.js';
import * as R from '../js/rules.js';
import * as Sh from '../js/shop.js';
import * as St from '../js/staff.js';
import * as Rm from '../js/room.js';
import { encodeCard, decodeCard, linkFor } from '../js/share.js';
import { card } from '../js/card.js';
import { RENOWN, TOOLS, PERKS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const make = (pattern = 'falchion', tier = 1) => R.makePiece({ patternId: pattern, picks: [0, 0, 0], result: { tier, worked: 12, strikes: 20, heats: 2, cracks: 0, whiteHeat: true }, maker: 'Old Smith', rng: seeded(3), now: 1700000000000 });
const blank = (o = {}) => { const s = { coins: 5000, mats: {}, cards: [], shelf: [], slots: 4, ledger: [], queue: [], clock: 0, found: [], trades: {}, ...o }; Sh.fixShelf(s); return s; };

test('tools: bought in order, once', () => {
  const s = blank();
  assert.match(G.buyTool(s, 'hammer2').why, /needs/);
  assert.ok(G.buyTool(s, 'hammer1').ok); assert.ok(G.buyTool(s, 'hammer2').ok); assert.equal(G.buyTool(s, 'hammer1').why, 'yours already');
  assert.equal(s.coins, 5000 - TOOLS.hammer1.cost - TOOLS.hammer2.cost);
  assert.equal(G.buyTool(blank({ coins: 0 }), 'gloves').why, 'not enough coin');
});

test('every tool and craft perk together: a valid strip, a wider band, odds still capped', () => {
  const s = blank({ tools: Object.keys(TOOLS), perks: PERKS.craft.perks.map(p => p.id) });
  const kit = G.kitOf(s);
  assert.equal(kit.hammer, 2); assert.equal(kit.good, 2); assert.equal(kit.gloves, 1);
  for (const level of [1, 3, 7, 10]) {
    const S = R.newWorking({ patternId: 'falchion', picks: [4, 2, 0], level, found: ['ember', 'twin', 'seer'], kit }, seeded(1));
    const c = R.counts(S.rack);
    assert.equal(S.rack.length, 22); assert.ok(Object.values(c).every(n => n >= 0)); assert.ok(c.GREAT >= 6);
    const plain = R.newWorking({ patternId: 'falchion', picks: [4, 2, 0], level, found: [], kit: {} }, seeded(1));
    assert.ok(S.band[1] - S.band[0] > plain.band[1] - plain.band[0]); assert.ok(S.cool < plain.cool);
    S.worked = 1000; const o = R.odds(S); assert.equal(o.f, 70); assert.equal(o.r, 40);
  }
});

test('the maker: a level from all practice, a point a level, perks in order', () => {
  const s = blank({ trades: { falchion: { xp: 150 }, dagger: { xp: 30 } }, haggle: { xp: 10 } });
  assert.equal(G.practice(s), 190); assert.equal(G.makerLevel(s).level, 5); assert.equal(G.pointsLeft(s), 4);
  assert.match(G.takePerk(s, 'craft', 1).why, /first/);
  assert.ok(G.takePerk(s, 'craft', 0).ok); assert.ok(G.takePerk(s, 'craft', 1).ok); assert.equal(G.pointsLeft(s), 2);
  const none = blank(); assert.equal(G.pointsLeft(none), 0); assert.match(G.takePerk(none, 'house', 0).why, /no points/);
});

test('renown from fair sales and orders; rungs bring richer purses', () => {
  const s = blank();
  assert.equal(G.rung(s), 0); assert.equal(G.purseMult(s), 1);
  G.fame(s, RENOWN[2].at); assert.equal(G.rung(s), 2); assert.ok(G.purseMult(s) > 1);
  const w = blank({ perks: ['word'] }); G.fame(w, 10); assert.equal(w.renown, 15);
  // a sale at FAIR to a walk-in earns it, at CHEAP not
  const c = make('dagger', 0), t = blank({ cards: [c] }); Sh.place(t, c.id);
  Sh.visit(t, () => 0, 1, { who: 'x', type: 'folk', want: 'any', purse: 999, mood: 'EAGER', least: 0 });
  assert.equal(t.renown, 1);
  const d = make('dagger', 0), u = blank({ cards: [d] }); Sh.place(u, d.id); Sh.setTag(u, 0, 'cheap');
  Sh.visit(u, () => 0, 1, { who: 'x', type: 'folk', want: 'any', purse: 999, mood: 'EAGER', least: 0 });
  assert.ok(!u.renown);
});

test('the wall: kept off the shelf and out of the back; adds renown and charm', () => {
  const a = make('falchion', 2), b = make('ring', 0); b.id = 'b';
  const s = blank({ cards: [a, b], room: Rm.defaultRoom() });
  assert.ok(G.hang(s, a.id)); assert.ok(!G.hang(s, a.id));
  assert.equal(Sh.inBack(s).length, 1); assert.equal(Sh.place(s, a.id), -1);
  assert.equal(Sh.salvage(s, a.id), null); assert.ok(!Sh.canRework(s, a));
  assert.equal(G.renownOf(s), 12); assert.ok(Rm.charm(s.room, s) > Rm.charm(s.room));
  Sh.place(s, b.id); assert.ok(!G.hang(s, b.id), 'not off the shelf');
  s.cards = s.cards.filter(c => c.id !== a.id); G.fixWall(s); assert.deepEqual(s.wall, []);
});

test('perks the shop reads: patience, a silver tongue never past the purse, wages, hours', () => {
  const c = make('dagger', 0), s = blank({ cards: [c], perks: ['tongue', 'patient', 'wages', 'hours'] }); Sh.place(s, c.id);
  const ask = Sh.hagglePrice(c, 'fair', 'ask', G.haggleMult(s));
  assert.ok(ask > Sh.hagglePrice(c, 'fair', 'ask'));
  s.queue = [{ kind: 'buyer', who: 'x', want: 'any', purse: ask - 1, mood: 'EAGER', least: 0, wait: 45, shows: 0 }];
  const r = Sh.haggle(s, c.id, 'ask', 1); assert.equal(r.outcome, 'counter'); assert.ok(r.price <= ask - 1);
  assert.equal(G.patienceOf(s, 45), 65);
  const st = blank({ staff: [{ id: 'c', role: 'clerk', name: 'W', trait: 'quick', xp: 0 }], perks: ['wages', 'hours'] });
  assert.equal(St.wages(st), 4 * 0.8); assert.equal(St.awayCap(st), 10);
});

test('everything at its most: a full shelf still lasts a good while away', () => {
  const hours = [];
  for (let seed = 1; seed <= 30; seed++) {
    const cards = ['dagger', 'ring', 'falchion', 'helm'].map((p, i) => { const k = make(p, 0); k.id = 'p' + i; return k; });
    const room = Rm.defaultRoom(2, 2); room.items.push(...Array.from({ length: 10 }, (_, i) => ({ id: 't' + i, kind: 'table', x: 100, z: 100, rot: 0 })));
    const s = blank({ cards, room, renown: 1000, perks: ['hours', 'word'], lastSeen: 1e12, staff: [{ id: 'c', role: 'clerk', name: 'W', trait: 'early', xp: 200 }] });
    cards.forEach(c => Sh.place(s, c.id));
    let t = 1e12; while (s.shelf.some(Boolean) && t < 1e12 + 24 * 3600e3) { t += 900e3; St.catchUp(s, t, seeded(seed * 31 + t / 3600e3)); }
    hours.push((t - 1e12) / 3600e3);
  }
  hours.sort((a, b) => a - b);
  assert.ok(hours[15] >= 1.25, 'median ' + hours[15] + ' h');
});

test('a card link: a round trip, nothing it shouldn\'t carry', () => {
  const c = make('falchion', 2);
  const back = decodeCard(encodeCard(c));
  for (const k of ['tier', 'name', 'kind', 'art', 'tint', 'dice', 'worth', 'lore', 'pattern']) assert.deepEqual(back[k], c[k], k);
  assert.deepEqual(back.stats, c.stats); assert.deepEqual(back.affixes, c.affixes); assert.deepEqual(back.made, c.made);
  assert.ok(back.shared); assert.equal(back.id, 'shared'); assert.equal(back.src, undefined);
  assert.match(linkFor(c, 'https://x.io/g/?debug#old'), /^https:\/\/x\.io\/g\/\?debug#card=[A-Za-z0-9_-]+$/);
});

test('a hand-made card link can\'t carry script', () => {
  const c = make('falchion', 1);
  const enc = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  assert.equal(decodeCard(enc({ ...c, tint: '"><script>alert(1)</script>' })), null);
  assert.equal(decodeCard(enc({ ...c, art: 'nope' })), null);
  assert.equal(decodeCard(enc({ ...c, tier: 'godlike' })), null);
  assert.equal(decodeCard('!!!not base64'), null);
  const k = decodeCard(enc({ ...c, kind: '<img src=x onerror=alert(1)>', stats: [['<b>x</b>', '<i>', 0.5]] }));
  const html = card(k);
  assert.ok(!html.includes('<img src=x') && !html.includes('<b>x</b>'));
  assert.ok(html.includes('&lt;img'));
});
