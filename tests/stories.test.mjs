import test from 'node:test';
import assert from 'node:assert/strict';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import * as Rm from '../js/room.js';
import { STORIES, STORY_GAP, FURNITURE, ORDER_PAYS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const H = 3600000;
function shop(stations = []) { const s = { coins: 0, mats: {}, cards: [], shelf: [], slots: 4, ledger: [], queue: [], clock: 0, stations, wall: [] }; Rm.fixRoom(s); Sh.fixShelf(s); return s; }
const fill = (s, o, now) => { const m = R.partOptions(o.pattern)[0].opts.findIndex(x => x.id === o.metal);
  const c = R.makePiece({ patternId: o.pattern, picks: [Math.max(0, m), 0, 0], result: { tier: o.least, flawed: false, worked: 10, strikes: 9, heats: 1, cracks: 0 }, maker: 'T', rng: seeded(1), now });
  s.cards.push(c); return Sh.deliver(s, c.id, now); };

test('a regular\'s story: three orders, each back a rest after the last, then a gift in the shop and renown', () => {
  const s = shop(), rng = seeded(3), ketty = STORIES.find(x => x.id === 'ketty');
  let now = 1e12;
  for (let step = 0; step < 3; step++) {
    // only Ketty can come in: the others are resting
    s.stories = { ...(s.stories || {}) }; STORIES.filter(x => x.id !== 'ketty').forEach(x => { s.stories[x.id] = { step: 9, next: 0 }; });
    assert.equal(Sh.storiesReady(s, now).length, 1);
    Sh.postOrder(s, () => 0.01, now);   // a story, not an ordinary order
    const o = s.order; assert.equal(o.story, 'ketty'); assert.equal(o.step, step); assert.equal(o.pattern, ketty.steps[step].patterns[0]);
    assert.equal(o.pays, Math.round(Sh.orderPays(o.pattern, o.metal, o.least) / ORDER_PAYS * 2.5));
    const e = fill(s, o, now); assert.ok(e); assert.equal(e.story.thanks, ketty.steps[step].thanks);
    assert.equal(Sh.storyOf(s, 'ketty').step, step + 1);
    assert.equal(Sh.storiesReady(s, now + (STORY_GAP - 1) * H).length, 0, 'resting');
    now += STORY_GAP * H;
  }
  assert.ok(s.room.items.some(i => i.kind === 'kettycandles'), 'the gift stands in the shop');
  assert.ok(s.renown >= 10 + 9);
  assert.equal(Sh.storiesReady(s, now + 99 * H).length, 0, 'told');
  // the gift can be moved but never sold back, and a rebuilt room keeps it
  const g = s.room.items.find(i => i.kind === 'kettycandles');
  assert.ok(Rm.sellBack(s, g.id).why); assert.ok(FURNITURE.kettycandles.gift);
});

test('a story waits while the shop can\'t make what it asks for, and a lapsed step comes back later', () => {
  const s = shop([]), now = 1e12;
  assert.ok(!Sh.storiesReady(s, now).some(x => x.id === 'marrow'), 'no kettle, no Marrow');
  s.stations = ['kettle']; assert.ok(Sh.storiesReady(s, now).some(x => x.id === 'marrow'));
  s.stories = Object.fromEntries(STORIES.map(x => [x.id, { step: x.id === 'vance' ? 1 : 9, next: 0 }]));
  Sh.postOrder(s, () => 0.01, now); assert.equal(s.order.story, 'vance'); assert.equal(s.order.step, 1);
  s.clock = s.order.due + 1; Sh.shopStep(s, 0.1, seeded(1), now + 1000, false);
  assert.equal(s.order, null); assert.equal(Sh.storyOf(s, 'vance').step, 1, 'still the same step');
  assert.ok(Sh.storyOf(s, 'vance').next > now, 'back after a while');
});

test('a gift with no room waits in the store room until it can be put out', () => {
  const s = shop();
  // fill the floor with urns wherever they fit
  for (let i = 0; i < 40; i++) { const it = Rm.firstFree(s.room, 'urn', 'u' + i); if (it) s.room.items.push(it); }
  const r = Rm.placeGift(s, 'corrowstatue'); assert.ok(r.stored); assert.deepEqual(s.stored, ['corrowstatue']);
  assert.ok(Rm.putOut(s, 'corrowstatue').why);
  s.room.items = s.room.items.filter(i => i.kind !== 'urn');
  assert.ok(Rm.putOut(s, 'corrowstatue').item); assert.deepEqual(s.stored, []);
});
