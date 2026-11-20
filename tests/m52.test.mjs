// Milestone 52: the grow-bed (docs/JACKPOT-PLAN.md). A piece grown, not forged: a living cutting planted toward a pattern, tended once
// a day, and lifted out three days later, grown, at the bed's odds.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../js/rules.js';
import * as Bed from '../js/bed.js';
import * as St from '../js/staff.js';
import * as Rm from '../js/room.js';
import { decodeCard, encodeCard } from '../js/share.js';
import { GROWBED, RENOWN } from '../js/data.js';

const D = 24 * 3600000, NOW = 1e12;
const queue = (...v) => { let i = 0; return () => (i < v.length ? v[i++] : 0.5); };
const shop = (o = {}) => ({ maker: 'Ada Vane', coins: 20000, renown: RENOWN[4].at, mats: { heartwood: 2, oldbone: 1 }, cards: [], found: [], stations: ['bowbench'], staff: [], book: { found: [] },
  workshop: Rm.defaultWorkshop(['bowbench'], 1), ...o });

test('set up from FAMED, in the workshop; a second bed from RENOWNED; never with the luck off', () => {
  assert.match(Bed.canBuild(shop({ renown: RENOWN[3].at })).why, /FAMED/);
  const s = shop();
  assert.ok(Bed.build(s).ok); assert.equal(s.coins, 20000 - GROWBED.cost); assert.equal(Bed.cap(s), 1);
  assert.ok(s.workshop.items.some(i => i.kind === 'growbed'), 'it stands in the workshop');
  assert.ok(Rm.valid(s.workshop)); assert.equal(Rm.sellBack(s, 'growbed').why, 'it stays');
  assert.match(Bed.canBuild(s).why, /RENOWNED/);
  s.renown = RENOWN[5].at; assert.ok(Bed.build(s).ok); assert.equal(Bed.cap(s), 2); assert.equal(Bed.bedsOf(s).length, 2);
  assert.equal(s.workshop.items.filter(i => i.kind === 'growbed').length, 1, 'one bed in the room for both');
  // an older save with the bed but its workshop laid out afresh: the bed goes back in
  const t = shop({ growbed: 1, workshop: null }); Rm.fixRoom(t); assert.ok(t.workshop.items.some(i => i.kind === 'growbed'));
  R.setLuck(false); try { assert.equal(Bed.canBuild(shop()).why, 'the luck is off'); } finally { R.setLuck(true); }
});

test('a cutting grows toward the patterns it can be the main part of, at a station the shop has', () => {
  const s = shop(); Bed.build(s);
  const wood = Bed.patternsFor(s, 'heartwood');
  assert.ok(wood.includes('staff') && wood.includes('axe') && !wood.includes('falchion'));
  assert.ok(!Bed.patternsFor(shop({ stations: [] }), 'heartwood').includes('staff'), 'no bench, no staff');
  assert.ok(!Bed.patternsFor(s, 'heartwood').includes('trident'), 'a trident only once it\'s been found');
  assert.match(Bed.plant(s, 0, 'heartwood', 'falchion', NOW).why, /won't grow/);
  assert.match(Bed.plant(s, 0, 'coral', 'ring', NOW).why, /no red coral/);
  assert.ok(Bed.plant(s, 0, 'heartwood', 'staff', NOW).ok); assert.equal(s.mats.heartwood, 1);
  assert.match(Bed.plant(s, 0, 'heartwood', 'axe', NOW).why, /growing/);
});

test('tended once a day; it comes up after three days, tended or not, and never sooner', () => {
  const s = shop(); Bed.build(s); Bed.plant(s, 0, 'heartwood', 'staff', NOW);
  assert.ok(Bed.tend(s, 0, NOW + 1000).ok); assert.match(Bed.tend(s, 0, NOW + 2000).why, /today/);
  assert.ok(Bed.tend(s, 0, NOW + 2 * D + 1).ok, 'day 2 missed, day 3 tended');
  assert.equal(Bed.stateOf(s.beds[0], NOW + 2 * D + 5).tended, 2);
  assert.match(Bed.harvest(s, 0, () => 0.5, NOW + 3 * D - 1).why, /hasn't come up/);
  assert.deepEqual(Bed.newlyUp(s, NOW + 3 * D).map(b => b.pattern), ['staff']); assert.deepEqual(Bed.newlyUp(s, NOW + 3 * D), [], 'told once');
  const r = Bed.harvest(s, 0, () => 0.5, NOW + 3 * D);
  assert.ok(r.ok); assert.equal(r.tended, 2); assert.equal(s.cards[0], r.card); assert.equal(s.beds[0], null);
  const c = r.card;
  assert.equal(c.pattern, 'staff'); assert.equal(c.grown.stage, 1, 'every piece from the bed is grown'); assert.equal(c.grown.tended, 2);
  assert.match(c.grown.bed, /^Ada Vane's, /); assert.match(c.made[0], /^Grown in the bed by Ada Vane/);
  assert.match(c.parts ? c.parts.join() : JSON.stringify(c), /Old yew/i, 'the heartwood stands for the stave');
  assert.equal(s.bedGrown, 1);
});

test('the bed\'s odds: tending lifts them; a Rare tended every day can wake; a mark far likelier than at the anvil; Old-Blood at most', () => {
  // roll(tended, rng): the tier die, the wake die (a Rare tended every day), the mark die, the mark's kind
  assert.equal(Bed.roll(0, queue(0.99, 0.99)).tier, 2);
  assert.equal(Bed.roll(0, queue(0.5, 0.99)).tier, 1);
  assert.equal(Bed.roll(0, queue(0.3, 0.99)).tier, 0, 'untended: Common 40 in a hundred');
  assert.equal(Bed.roll(3, queue(0.3, 0.99)).tier, 1, 'tended every day: Common only 10');
  const woke = Bed.roll(3, queue(0.95, 0.0, 0.99)); assert.equal(woke.tier, 3); assert.ok(woke.woke);
  assert.ok(!Bed.roll(2, queue(0.95, 0.0, 0.99)).woke, 'not tended every day: it doesn\'t wake');
  assert.equal(Bed.roll(3, queue(0.3, 0.05, 0.0)).mark, 'veined');
  assert.ok(GROWBED.mark[3] > 1 / 60 * 5, 'far likelier than at the anvil');
  for (let t = 0; t <= 3; t++) assert.ok(GROWBED.tier[t][2] <= 40, 'Rare at most 40 in a hundred');
  // a mark goes on the card and into the book
  const s = shop(); Bed.build(s); Bed.plant(s, 0, 'heartwood', 'staff', NOW);
  const r = Bed.harvest(s, 0, queue(0.95, 0.0, 0.0), NOW + 3 * D);   // untended: the tier die, the mark's, its kind
  assert.equal(r.card.mark, 'veined'); assert.deepEqual(s.marksMade.bowbench, ['veined']);
});

test('a runner turns cuttings up once there\'s a bed; never before, never with the luck off; old bone only below the doors', () => {
  const s = shop();
  assert.equal(Bed.roadFind(s, 'reach', () => 0), null, 'no bed, no die thrown');
  Bed.build(s);
  assert.equal(Bed.roadFind(s, 'reach', () => 0), 'heartwood');
  assert.equal(Bed.roadFind(s, 'yard', () => 0), null);
  assert.equal(Bed.roadFind(s, 'below', () => 0), 'oldbone');
  R.setLuck(false); try { assert.equal(Bed.roadFind(s, 'reach', () => 0), null); } finally { R.setLuck(true); }
  const h = St.haul(s, { name: 'Pell', xp: 0 }, 'reach', () => 0, NOW);
  assert.ok(h.mats.heartwood >= 1);
});

test('a bed-grown card\'s link keeps whose bed and the days tended; anything else is dropped', () => {
  const s = shop(); Bed.build(s); Bed.plant(s, 0, 'heartwood', 'staff', NOW); Bed.tend(s, 0, NOW);
  const c = Bed.harvest(s, 0, () => 0.5, NOW + 3 * D).card;
  const back = decodeCard(encodeCard(c));
  assert.deepEqual(back.grown, { stage: 1, uses: 0, bed: Bed.whereOf(s), tended: 1 });
  assert.ok(!decodeCard(encodeCard({ ...c, grown: { ...c.grown, tended: 7 } })).grown);
});
