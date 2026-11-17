// Milestone 25: the counter view's pure parts (fit, the skew of a card onto its painted place, who stands where).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../js/counter.js';
import { readFileSync, existsSync } from 'node:fs';

test('a backdrop covers its box: scaled to fill, centred', () => {
  const f = C.cover(390, 430, 780, 860); assert.ok(Math.abs(f.s - 0.5) < 1e-9 && Math.abs(f.ox) < 1e-9 && Math.abs(f.oy) < 1e-9);
  const g = C.cover(1000, 400, 1600, 900); assert.equal(g.s, 1000 / 1600); assert.ok(g.oy < 0, 'cropped top and bottom');
  assert.equal(C.shapeFor(760, 430), 'wide'); assert.equal(C.shapeFor(390, 430), 'tall');
});

test('a card\'s face lands exactly on its painted place (corners, and the skew in between is a true projection)', () => {
  const q = [[100, 300], [180, 310], [175, 180], [95, 190]];   // bottom-left, bottom-right, top-right, top-left
  const near = (a, b) => Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;
  assert.ok(near(C.mapPoint(256, 360, q, 0, 360), q[0]) && near(C.mapPoint(256, 360, q, 256, 360), q[1]));
  assert.ok(near(C.mapPoint(256, 360, q, 256, 0), q[2]) && near(C.mapPoint(256, 360, q, 0, 0), q[3]));
  assert.match(C.quadMatrix(256, 360, q), /^matrix3d\(/);
  const sq = [[0, 360], [256, 360], [256, 0], [0, 0]]; assert.ok(near(C.mapPoint(256, 360, sq, 100, 50), [100, 50]), 'a flat place: no skew');
});

test('the queue stands at the spots: the front at the counter, the rest behind; a customer always looks the same', () => {
  const q = [{ type: 'guard', who: 'Hask' }, { type: 'delver', who: 'Pell' }, { type: 'factor', who: 'Mira' }];
  const s = C.standing(q, 2); assert.equal(s.length, 2); assert.equal(s[0].spot, 0); assert.equal(s[0].c.who, 'Hask');
  assert.equal(C.lookOf(q[0]), C.lookOf({ type: 'guard', who: 'Hask' })); assert.ok(C.FOLK_LOOKS[C.lookOf(q[2])]);
  assert.deepEqual(C.standing([], 4), []);
});

test('the backdrops at every shop size: every view at both shapes; the left wall\'s shelf places with every level\'s card places', () => {
  for (const size of [0, 1, 2]) {
    const d = JSON.parse(readFileSync(new URL('../assets/backdrops/s' + size + '/backdrops.json', import.meta.url)));
    for (const v of C.VIEWS) for (const sh of ['wide', 'tall']) assert.ok(d[v] && d[v][sh] && d[v][sh].size, size + ' ' + v + ' ' + sh);
    const units = d.left.wide.units; assert.equal(units.length, size + 2, 'a bigger shop, more shelf places');
    for (const u of units) { assert.ok(u.sprites.cardshelf && u.sprites.cardcase); assert.equal(u.quads['0'].length, 2); assert.equal(u.quads['1'].length, 3); assert.equal(u.quads['2'].length, 6); }
    assert.ok(d.right.wide.wall.length >= 3); assert.ok(d.counter.wide.spots.length >= 3 && d.counter.wide.fg && d.counter.wide.wards);
    assert.ok(d.back.wide.hot.workshop && d.back.wide.cold); assert.ok(d.counter.wide.over.boards && d.counter.wide.over.watchbanner);
  }
});

// Milestone 26: the folk as pictures
test('every kind of customer draws from its own pool; the regulars always look themselves; every look has a picture', () => {
  const kinds = ['folk', 'guard', 'traveller', 'delver', 'hunter', 'factor', 'collector', 'steward', 'master', 'crown', 'seller'];
  for (const k of kinds) for (const who of ['a', 'bb', 'ccc', 'dddd']) assert.ok(C.FOLK_LOOKS[C.lookOf({ type: k, who })], k);
  assert.equal(C.lookOf({ type: 'guard', who: 'Sergeant Ollo Vance' }), 'vance');
  assert.equal(C.lookOf({ who: 'Captain Ollo Vance' }), 'vance');
  assert.equal(C.lookOf({ who: 'Ketty Moss, a grandmother now' }), 'ketty');
  assert.equal(C.lookOf({ who: 'Lady Ysmay Corrow, dowager' }), 'corrow');
  assert.notEqual(C.lookOf({ type: 'collector', who: 'Lady Ysmay Corrow\'s man' }), 'corrow', 'her man is not her');
  assert.equal(C.lookOf({ who: 'The Court' }), 'herald');
  assert.equal(C.lookOf({ type: 'nobody-knows', who: 'x' }), C.lookOf({ type: 'folk', who: 'x' }), 'an unknown kind is folk');
  for (const k of Object.keys(C.FOLK_LOOKS)) {
    assert.ok(C.FOLK_LOOKS[k] > 1 && C.FOLK_LOOKS[k] < 2.3, k + ' height');
    assert.ok(existsSync(new URL('../assets/folk/' + k + '.webp', import.meta.url)), k + ' picture');
  }
});

test('the small folk climb a step at the counter to be seen; nobody else does, and nobody behind', () => {
  assert.ok(C.stepUp(C.FOLK_LOOKS.traveller_gob, 0) > 0.3, 'a goblin at the counter is lifted');
  assert.equal(C.stepUp(C.FOLK_LOOKS.traveller_gob, 0) + C.FOLK_LOOKS.traveller_gob, C.STEP_TO);
  assert.equal(C.stepUp(C.FOLK_LOOKS.guard_orc, 0), 0); assert.equal(C.stepUp(C.FOLK_LOOKS.traveller_gob, 2), 0);
});

// Milestone 27: the haggle at the counter
test('each answer at the counter has its mark: sold pleased, gone offended, a counter-offer wary (offended past their purse)', () => {
  assert.equal(C.reactionTo({ outcome: 'sold', price: 9 }), 'pleased');
  assert.equal(C.reactionTo({ outcome: 'gone' }), 'offended');
  assert.equal(C.reactionTo({ outcome: 'counter', price: 9 }), 'wary');
  assert.equal(C.reactionTo({ outcome: 'counter', price: 9, over: true }), 'offended');
  assert.equal(C.reactionTo({ outcome: 'another' }), 'wary');
  assert.equal(C.reactionTo(null), null);
  for (const k of ['offended', 'pleased', 'wary', 'eager']) assert.match(C.MARKS[k], /^<svg/);
});

// Milestone 28: the room dressed
import { defaultShop } from '../js/room.js';
const H28 = 3600000, NOW = 1e12;
const shop = (extra = {}) => ({ room: defaultShop(2, 0), shelf: [], cards: [], wards: [], threatsFrom: 0, ...extra });
test('the room\'s state: boards on the door for a day after a break-in, the wall mended after a monster, never on the gentler Reach', () => {
  assert.deepEqual(C.dressingOf(shop(), NOW).over, []);
  assert.ok(C.dressingOf(shop({ robbery: { at: NOW - 2 * H28 } }), NOW).over.includes('boards'));
  assert.ok(!C.dressingOf(shop({ robbery: { at: NOW - 30 * H28 } }), NOW).over.includes('boards'), 'mended by the next day');
  assert.ok(C.dressingOf(shop({ monster: { done: 'came', doneAt: NOW - 5 * H28 } }), NOW).over.includes('mended'));
  assert.ok(!C.dressingOf(shop({ monster: { done: 'kept', doneAt: NOW - 5 * H28 } }), NOW).over.includes('mended'), 'kept off: no damage');
  const g = C.dressingOf(shop({ gentle: true, robbery: { at: NOW - H28 }, monster: { done: 'came', doneAt: NOW - H28 } }), NOW);
  assert.deepEqual(g.over, [], 'the gentler Reach: no boards, no damage');
});
test('a gift shows only when it\'s put out; the forge cold when it broke; the wards over the door', () => {
  const s = shop(); s.room.items.push({ id: 'g', kind: 'watchbanner', x: 0, z: 4, rot: 0 }); s.stored = ['corrowstatue'];
  const d = C.dressingOf(s, NOW); assert.ok(d.over.includes('watchbanner')); assert.ok(!d.over.includes('corrowstatue'), 'in the store room: not shown');
  assert.equal(C.dressingOf(shop({ wear: { forge: { w: 9, broken: true, ready: NOW + H28 } } }), NOW).cold, true);
  assert.equal(C.dressingOf(shop({ wear: { forge: { w: 9, broken: true, ready: NOW - H28 } } }), NOW).cold, false, 'rebuilt');
  assert.equal(C.dressingOf(shop({ wards: [{ id: 'a', tier: 'fine', name: 'x' }] }), NOW).wards.length, 1);
});
test('your shelves on the painted places: each with its level and its places in order, the first nearest the counter; the shop\'s size', () => {
  const s = shop(); s.room.items.find(i => i.kind === 'shelf').lv = 2;
  const d = C.dressingOf(s, NOW);
  assert.deepEqual(d.shelves.map(x => [x.lv, x.places]), [[2, [0, 1, 2, 3, 4, 5]], [0, [6, 7]]]);
  assert.equal(C.shelfAt(1, 2, d.shelves).lv, 2, 'the first shelf: the painted place nearest the counter'); assert.equal(C.shelfAt(0, 2, d.shelves).lv, 0);
  assert.equal(C.shelfAt(0, 3, d.shelves), null, 'a bigger wall than you have shelves: bare');
  assert.equal(C.dressingOf({ ...s, room: { ...s.room, size: 2 } }, NOW).size, 2);
});
