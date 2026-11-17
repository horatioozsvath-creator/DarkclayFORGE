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

test('the backdrops\' places and spots: every view at both shapes; the left wall shows the shelf\'s places, the counter its spots', () => {
  const d = JSON.parse(readFileSync(new URL('../assets/backdrops/backdrops.json', import.meta.url)));
  for (const v of C.VIEWS) for (const sh of ['wide', 'tall']) assert.ok(d[v] && d[v][sh] && d[v][sh].size, v + ' ' + sh);
  assert.ok(d.left.wide.places.shelf.length >= 6); assert.ok(d.right.wide.places.wall.length >= 3);
  assert.ok(d.counter.wide.spots.length >= 3 && d.counter.wide.fg); assert.ok(d.back.wide.hot.workshop);
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
