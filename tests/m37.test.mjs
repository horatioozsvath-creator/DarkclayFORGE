// Milestone 37: handing on the forge. A Maker of the Nine with an apprentice of two weeks hands the forge on: the heir starts a fresh
// shop with the book, the blueprints, their trades (up to 5; 2 in the rest), their trait for good and one heirloom; the old shop goes
// into the line's record with its save code.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as Leg from '../js/legacy.js';
import * as G from '../js/growth.js';
import * as Rm from '../js/room.js';
import * as St from '../js/staff.js';
import { fromCode } from '../js/save.js';
import { LEGACY, MYTHICS, PATTERNS, HALL_CHARM } from '../js/data.js';
import { levelOf } from '../js/rules.js';
import { TOP_XP } from '../js/apprentice.js';

const DAY = 86400000, NOW = 2e12, NINE = Object.keys(MYTHICS);
const myth = { id: 'm1', name: 'The Crown of Veric', tier: 'mythic', pattern: 'axe', worth: 9000 };
const relic = { id: 'r1', name: 'A Relic', tier: 'relic', pattern: 'axe', worth: 3000 };
const nine = (o = {}) => ({ v: 1, uid: 'u1', mats: { iron: 3 }, maker: 'Old Hand', coins: 90000, renown: 5000, made: 900, sold: 700, earned: 500000, curve: 2, trades: { axe: { xp: 99999 } },
  found: ['ember', 'oak'], book: { found: ['lantern'], tries: [{ k: 1 }], clues: [], seen: 3 }, blueprints: ['r_axe'], relicsMade: ['r_axe'], picks: { axe: [1, 0, 0] },
  mythicsMade: NINE.slice(), shards: NINE.slice(), mythicParts: { x: [true, true, true] }, nineAt: NOW - DAY, starDay: 5, tools: ['bellows'], perks: ['wages'],
  stations: ['loom'], hall: { items: [], shown: {} }, wall: ['m1'], cards: [myth, relic, { id: 'c1', tier: 'common', name: 'An axe' }, { id: 's1', tier: 'mythic', name: 'A copy', sample: true }],
  staff: [{ id: 'a1', role: 'apprentice', name: 'Pip Hollis', trait: 'bright', xp: 0, hiredAt: NOW - 15 * DAY, skill: { axe: 1e9, dagger: 40 } }], gentle: true, kept: ['k1'], ...o });

test('only a Maker of the Nine, with an apprentice of two weeks (by hiredAt, or the hour in an older one\'s id)', () => {
  assert.equal(Leg.canHandOn(nine({ mythicsMade: NINE.slice(1) }), NOW).ok, false);
  assert.match(Leg.canHandOn(nine({ staff: [] }), NOW).why, /no apprentice/);
  const young = Leg.canHandOn(nine({ staff: [{ id: 'a1', role: 'apprentice', name: 'Pip', hiredAt: NOW - 3 * DAY }] }), NOW);
  assert.equal(young.ok, false); assert.equal(young.left, 11);
  assert.ok(Leg.canHandOn(nine(), NOW).ok);
  const hour = Math.floor((NOW - 20 * DAY) / 3600000);
  assert.ok(Leg.canHandOn(nine({ staff: [{ id: 'h' + hour + '-2', role: 'apprentice', name: 'Pip' }] }), NOW).ok, 'hired in release 61');
  const s = { coins: 1e5, renown: 500, staff: [] }; St.hire(s, { id: 'h1-1', role: 'apprentice', name: 'Ned', trait: 'careful', xp: 0 });
  assert.ok(s.staff[0].hiredAt > 0, 'hiring stamps the day');
});

test('the heirloom: an Old-Blood piece, Relic or Mythic of your own; chosen when there is one; none needed when there isn\'t', () => {
  const s = nine();
  assert.deepEqual(Leg.heirlooms(s).map(c => c.id), ['m1', 'r1'], 'best first, no flyer copies');
  assert.equal(Leg.handOn(s, null, NOW).ok, false, 'choose one');
  assert.equal(Leg.handOn(s, 'c1', NOW).ok, false, 'a common piece can\'t pass on');
  const bare = Leg.handOn(nine({ cards: [] }), null, NOW); assert.ok(bare.ok); assert.deepEqual(bare.save.heirlooms, []);
});

test('the heir\'s shop: a fresh climb with what the line keeps', () => {
  const old = nine(), r = Leg.handOn(old, 'm1', NOW), s = r.save;
  assert.ok(r.ok);
  assert.equal(s.coins, LEGACY.purse); assert.equal(G.rung(s), 0, 'renown starts over, the heirloom gives none'); assert.equal(G.isNine(s), false);
  assert.equal(s.maker, 'Pip Hollis'); assert.equal(s.lineOf, 'Old Hand'); assert.equal(s.gen, 2); assert.equal(s.heirTrait, 'bright');
  for (const k of ['shards', 'mythicsMade', 'relicsMade', 'mythicParts', 'nineAt', 'starDay', 'tools', 'perks', 'stations', 'hall', 'wall', 'staff', 'bank', 'branch'])
    assert.ok(s[k] === undefined || (Array.isArray(s[k]) && !s[k].length), k + ' starts over');
  assert.deepEqual(s.cards, []); assert.deepEqual(s.blueprints, ['r_axe']); assert.deepEqual(s.book.found, ['lantern']); assert.deepEqual(s.found, ['ember', 'oak']);
  assert.equal(s.uid, 'u1'); assert.equal(s.gentle, true); assert.deepEqual(s.kept, ['k1']);
  // trades: their own, up to 5; 2 in the rest
  assert.equal(s.trades.axe.xp, TOP_XP); assert.equal(levelOf(s.trades.axe.xp).level, LEGACY.top);
  const other = Object.keys(PATTERNS).find(id => id !== 'axe' && id !== 'dagger'); assert.equal(levelOf(s.trades[other].xp).level, LEGACY.rest);
  assert.equal(Object.keys(s.trades).length, Object.keys(PATTERNS).length);
  assert.equal(G.makerLevel(s).level, 1, 'the head start isn\'t practice: skill points are earned again');
  // the heirloom: out of the cards, over the door, charm but no renown
  assert.equal(s.heirlooms[0].name, myth.name); assert.equal(s.heirlooms[0].from, 'Old Hand'); assert.ok(!s.cards.some(c => c.id === 'm1'));
  assert.equal(G.heirloomCharm(s), HALL_CHARM.mythic); assert.equal(G.renownOf(s), 0);
  const room = Rm.defaultShop(); assert.equal(Rm.charm(room, s) - Rm.charm(room, { ...s, heirlooms: [] }), HALL_CHARM.mythic);
  // the old save is untouched
  assert.equal(old.coins, 90000); assert.equal(old.maker, 'Old Hand');
});

test('the line\'s record: the old shop, readable, with its save code; a second handing on adds to it and nothing nests', () => {
  const s = Leg.handOn(nine(), 'm1', NOW).save;
  assert.equal(s.line.length, 1);
  const r = s.line[0]; assert.equal(r.gen, 1); assert.equal(r.maker, 'Old Hand'); assert.equal(r.nine, 9); assert.equal(r.heirloom.name, myth.name);
  const back = fromCode(r.code); assert.equal(back.maker, 'Old Hand'); assert.equal(back.coins, 90000); assert.equal(back.line, undefined);
  // the heir makes the Nine and hands on again
  const s2 = { ...s, mythicsMade: NINE.slice(), nineAt: NOW + 30 * DAY, cards: [relic], staff: [{ id: 'a2', role: 'apprentice', name: 'Wren', trait: 'thrifty', hiredAt: NOW, skill: {} }] };
  const t = Leg.handOn(s2, 'r1', NOW + 30 * DAY);
  assert.ok(t.ok); assert.equal(t.save.gen, 3); assert.equal(t.save.line.length, 2); assert.equal(t.save.lineOf, 'Pip Hollis');
  assert.equal(t.save.line[1].days, 30, 'days from the heir\'s start to the Nine');
  assert.equal(fromCode(t.save.line[1].code).line, undefined, 'the record isn\'t kept inside its own codes');
  assert.ok(Leg.withoutCodes(t.save).line.every(x => x.code === null));
});

test('the heir\'s trait, for good: careful widens the band, swift slows the cooling, thrifty cuts wages, bright learns faster; none for a first maker', () => {
  assert.deepEqual(G.kitOf({}), G.kitOf({ heirTrait: null }));
  assert.ok(G.kitOf({ heirTrait: 'careful' }).widen > 1); assert.ok(G.kitOf({ heirTrait: 'swift' }).coolX < 1);
  assert.equal(G.wageMult({ heirTrait: 'thrifty' }), LEGACY.trait.thrifty.wage); assert.equal(G.wageMult({}), 1);
  assert.equal(G.xpMult({ heirTrait: 'bright' }), LEGACY.trait.bright.xp); assert.equal(G.xpMult({}), 1);
});
