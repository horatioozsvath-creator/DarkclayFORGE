// Milestone 38: the next generation's Reach. A generation on, the Nine's shards lie in new places (three of each source, shuffled
// for the shop and the generation); the regulars' grandchildren come in with their own names and words, and remember the old maker;
// from the third generation, two heirlooms and the town's welcome (the shop starts KNOWN). The visit link carries the generation.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as Leg from '../js/legacy.js';
import * as Trail from '../js/trail.js';
import * as Sh from '../js/shop.js';
import * as G from '../js/growth.js';
import * as Rm from '../js/room.js';
import { packShop, unpackShop } from '../js/visit.js';
import { REGULARS as LOOKS } from '../js/folk.js';
import { LEGACY, MYTHICS, STORIES, REGULARS, LINE_STORIES, LINE_FOLK, RENOWN } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const DAY = 86400000, NOW = 2e12, NINE = Object.keys(MYTHICS);
const piece = (id, tier) => ({ id, name: 'Piece ' + id, tier, pattern: 'axe', worth: 1000 });
const maker = (o = {}) => ({ v: 1, uid: 'u1', mats: {}, maker: 'Old Hand', coins: 1, renown: 5000, curve: 2, trades: {}, cards: [piece('m1', 'mythic'), piece('r1', 'relic'), piece('o1', 'oldblood')],
  mythicsMade: NINE.slice(), staff: [{ id: 'a1', role: 'apprentice', name: 'Pip Hollis', trait: 'careful', hiredAt: NOW - 20 * DAY, skill: {} }], ...o });
const count = w => Object.values(w).reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {});

test('the Nine scattered again: three of each source, in new places, fixed for the shop and the generation', () => {
  const s = Leg.handOn(maker(), 'm1', NOW).save;
  assert.deepEqual(count(s.shardWhere), LEGACY.sources);
  assert.deepEqual(Leg.handOn(maker(), 'm1', NOW).save.shardWhere, s.shardWhere, 'the same for the same shop');
  const others = ['u2', 'u3', 'u4', 'u5', 'u6'].map(uid => JSON.stringify(Leg.handOn(maker({ uid }), 'm1', NOW).save.shardWhere));
  assert.ok(new Set(others.concat(JSON.stringify(s.shardWhere))).size > 1, 'other shops, other places');
  // the trail looks where they lie now: a shard moved to the Court is asked for there, not below the deep doors
  s.renown = 99999;
  const id = NINE.find(k => s.shardWhere[k] !== MYTHICS[k].shard);
  assert.ok(id, 'at least one moved');
  assert.ok(Trail.pending(s, s.shardWhere[id]).includes(id)); assert.ok(!Trail.pending(s, MYTHICS[id].shard).includes(id));
  assert.equal(Trail.sourceOf({}, id), MYTHICS[id].shard, 'a first generation as before');
  const w = Trail.scatter(seeded(3)); assert.deepEqual(count(w), LEGACY.sources);
});

test('the regulars\' grandchildren: their own names and words, the same wants; the old maker remembered once', () => {
  const s = { ...Leg.handOn(maker(), 'm1', NOW).save };
  for (const r of REGULARS) {
    const g = Sh.regularOf(s, r);
    assert.notEqual(g.who, r.who, r.who); assert.deepEqual(g.wants, r.wants); assert.ok(!/\{/.test(g.who + g.line));
  }
  assert.equal(Sh.regularOf({}, REGULARS[0]), REGULARS[0], 'a first generation as before');
  for (const st of STORIES) {
    assert.ok(LINE_STORIES[st.id], st.id); assert.equal(LINE_STORIES[st.id].steps.length, st.steps.length, st.id);
    const who = Sh.storyWho(s, st); assert.notEqual(who, st.who);
    st.steps.forEach((x, i) => { const y = Sh.storyStep(s, st, i); assert.deepEqual(y.patterns, x.patterns); assert.equal(y.least, x.least); assert.ok(!/\{/.test(y.line + y.thanks), st.id + i); });
  }
  assert.match(Sh.say(s, '{master}'), /Old Hand/);
  // each name keeps its family's look in the shop
  for (const r of REGULARS.filter(r => !/Tib/.test(r.who))) assert.ok(LOOKS.some(([re]) => re.test(Sh.regularOf(s, r).who)), r.who);
  for (const st of STORIES) assert.ok(LOOKS.some(([re]) => re.test(Sh.storyWho(s, st))), st.id);
  // a plain regular's first order says the family's word about the old maker; the next doesn't
  const shop = { ...s, cards: [], ledger: [], stations: [], clock: 0, stories: Object.fromEntries(STORIES.map(x => [x.id, { step: 99 }])) };
  const words = new Set();
  for (let i = 0; i < 60; i++) { shop.order = null; Sh.postOrder(shop, seeded(i), NOW); if (shop.order && !shop.order.shard && !shop.order.court) words.add(shop.order.line); }
  const remembered = Object.values(LINE_FOLK).map(f => Sh.say(s, f.remember)).filter(l => words.has(l));
  assert.ok(remembered.length >= 1); assert.ok((shop.remembered || []).length >= remembered.length);
});

test('a generation on: one heirloom for the second, two from the third, and the town\'s welcome', () => {
  assert.equal(Leg.heirloomsFor(2), 1); assert.equal(Leg.heirloomsFor(3), 2); assert.equal(Leg.heirloomsFor(5), 2); assert.equal(Leg.heirloomsFor(9), 2);
  const g2 = Leg.handOn(maker(), 'm1', NOW).save;
  assert.equal(g2.renown, 0); assert.equal(G.rung(g2), 0);
  assert.equal(Leg.handOn(maker(), ['m1', 'r1'], NOW).ok, false, 'only one for the second');
  const at2 = { ...g2, mythicsMade: NINE.slice(), cards: [piece('m2', 'mythic'), piece('r2', 'relic')], staff: [{ id: 'a2', role: 'apprentice', name: 'Wren', trait: 'swift', hiredAt: NOW, skill: {} }] };
  assert.equal(Leg.handOn(at2, 'm2', NOW + 20 * DAY).ok, false, 'two to choose');
  const g3 = Leg.handOn(at2, ['m2', 'r2'], NOW + 20 * DAY).save;
  assert.equal(g3.gen, 3); assert.deepEqual(g3.heirlooms.map(h => h.name), ['Piece m2', 'Piece r2']);
  assert.equal(g3.renown, RENOWN[LEGACY.welcome].at); assert.equal(RENOWN[G.rung(g3)].word, 'KNOWN');
  assert.equal(G.heirloomCharm(g3), 6 + 3);
  assert.notDeepEqual(g3.shardWhere, g2.shardWhere, 'scattered again');
  assert.deepEqual(g3.line[0].heirlooms.map(h => h.name), ['Piece m1']); assert.deepEqual(g3.line[1].heirlooms.map(h => h.name), ['Piece m2', 'Piece r2']);
});

test('the visit link carries the generation; an older link reads as the first', () => {
  const s = Leg.handOn(maker(), 'm1', NOW).save; s.room = Rm.defaultShop(); s.shelf = []; s.cards = []; s.uid = 'shop01';
  const o = packShop(s, NOW); assert.equal(o.g, 2);
  const back = unpackShop(o); assert.equal(back.gen, 2);
  delete o.g; assert.equal(unpackShop(o).gen, 1);
});

test('the line\'s lore: an heir finds star shards below twice as often and is asked by the Court a little more; a first maker as before', async () => {
  const { TRAIL } = await import('../js/data.js');
  assert.equal(Trail.starBelowOf({}), TRAIL.starBelow); assert.equal(Trail.courtOddsOf({}), TRAIL.court);
  assert.equal(Trail.starBelowOf({ gen: 2 }), TRAIL.starBelow * LEGACY.lore.starBelow);
  assert.equal(Trail.courtOddsOf({ gen: 2 }), Math.min(0.9, TRAIL.court * LEGACY.lore.court));
});
