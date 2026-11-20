// Milestone 53: who opens the shop (docs/CREATOR-PLAN.md). A new game's maker chooses their people (a small gift), what they were
// (a small head start) and the kind of shop (its station free, its store room, the game's name); an heir chooses afresh.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as Who from '../js/who.js';
import * as Leg from '../js/legacy.js';
import * as Rm from '../js/room.js';
import * as Sh from '../js/shop.js';
import * as St from '../js/staff.js';
import * as Run from '../js/runner.js';
import * as Mine from '../js/mine.js';
import * as Wear from '../js/wear.js';
import * as G from '../js/growth.js';
import { fresh } from '../js/save.js';
import { levelOf } from '../js/rules.js';
import { PEOPLES, SHOPS, MYTHICS as ALL, RENOWN } from '../js/data.js';

const pick = (o = {}) => ({ people: 'human', look: 'folk_man', background: 'pedlar', shop: 'forge', ...o });
const lvl = (s, id) => levelOf(((s.trades || {})[id] || {}).xp || 0).level;

test('a save without a choice is a forge shop, as before: Darkclay Forge, no gift, no head start', () => {
  const s = fresh();
  assert.equal(Who.shopOf(s), 'forge'); assert.equal(Who.titleOf(s), 'Darkclay Forge');
  assert.equal(Wear.bandMult(s, 'forge'), 1); assert.equal(G.xpMult(s), 1); assert.equal(Sh.priceOf('iron', 5, s), Sh.priceOf('iron', 5, { ...s, region: undefined }));
  assert.equal(Who.signWant(s, 0), null);
});

test('the shop opened: its station set up free, its store room, the game\'s name; any kind', () => {
  for (const [id, sh] of Object.entries(SHOPS)) {
    const s = fresh(); assert.ok(Who.start(s, pick({ shop: id })).ok);
    assert.equal(Who.titleOf(s), 'Darkclay ' + sh.word);
    assert.equal(s.coins, 60 + 60, 'nothing paid for the station (the pedlar\'s 60 on top)');
    assert.ok(Rm.owns(s, id), id + ' owned'); assert.ok(Rm.owns(s, 'forge'), 'the forge stands too');
    for (const [m, n] of Object.entries(sh.mats)) assert.equal(s.mats[m], n);
    Rm.fixRoom(s); assert.ok(s.workshop.items.some(i => i.kind === id), id + ' stands in the workshop');
  }
  assert.equal(Who.titleOf({ shop: 'kettle' }), 'Darkclay Alchemy');
  assert.match(Who.start(fresh(), pick({ shop: 'mine' })).why, /choose/);
  assert.match(Who.start({ ...fresh(), made: 3 }, pick()).why, /already open/);
});

test('a background\'s head start; never tied to the shop: a miner can open a potion shop', () => {
  const s = fresh(); Who.start(s, pick({ background: 'miner', shop: 'kettle' }));
  assert.equal(s.mats.ironstone, 6); assert.equal(Who.shopOf(s), 'kettle');
  s.renown = RENOWN[2].at; Mine.open(s, 1); assert.equal(lvl(s, 'dig'), 3); assert.equal(lvl(s, 'smelt'), 3);
  const h = fresh(); Who.start(h, pick({ background: 'herbs', shop: 'glass' }));
  for (const id of Who.firstPatterns('kettle')) assert.equal(lvl(h, id), 2, id);
  assert.equal(G.practice(h), 0, 'the head start isn\'t counted to the maker\'s level');
  const p = fresh(); Who.start(p, pick()); assert.equal(levelOf(p.haggle.xp).level, 2);
});

test('a soldier\'s first runner goes out with their sword; a soldier\'s night guard costs less', () => {
  const s = { ...fresh(), coins: 1e5, renown: RENOWN[3].at, staff: [] }; Who.start(s, pick({ background: 'soldier' }));
  assert.ok(St.hire(s, { id: 'r1', role: 'runner', name: 'Pell', trait: 'keen', xp: 0 }));
  const sw = (s.staff[0].gear || {}).weapon;
  assert.ok(sw && sw.pattern === 'falchion', 'the first runner carries it'); assert.match(sw.made[0], /from the wars/);
  s.renown = RENOWN[4].at; St.hire(s, { id: 'r2', role: 'runner', name: 'Ada', trait: 'keen', xp: 0 });
  assert.ok(!(s.staff[1] && (s.staff[1].gear || {}).weapon), 'only the first');
  St.hire(s, { id: 'g1', role: 'guard', name: 'Watch', trait: 'keen', xp: 0 });
  const plain = { ...s, who: { ...s.who, background: 'pedlar' } };
  assert.ok(St.wages(s) < St.wages(plain));
});

test('the peoples\' gifts: a band, faster trades, cheaper suppliers, fewer hurts; one each, no more', () => {
  const as = people => { const s = fresh(); Who.start(s, pick({ people, look: PEOPLES[people].looks[0] })); return s; };
  assert.equal(Wear.bandMult(as('dwarf'), 'forge'), 1.05); assert.equal(Wear.bandMult(as('dwarf'), 'kettle'), 1);
  assert.equal(Wear.bandMult(as('lizard'), 'kettle'), 1.05); assert.equal(Wear.bandMult(as('shiril'), 'glass'), 1.05);
  assert.equal(G.xpMult(as('human')), 1.05);
  assert.ok(Sh.priceOf('oldyew', 7, as('goblin')) < Sh.priceOf('oldyew', 7, as('human')));
  assert.equal(Who.hurtGift(as('orc')), 5 / 6); assert.equal(Who.hurtGift(as('human')), 1);
  for (const p of Object.values(PEOPLES)) assert.ok(p.looks.length >= 1 && p.line);
});

test('a new shop\'s customers come in for what its sign says, until KNOWN; a forge shop\'s as ever', () => {
  const s = fresh(); Who.start(s, pick({ shop: 'kettle' }));
  assert.equal(Who.signWant(s, 0), 'brew'); assert.equal(Who.signWant(s, 2), null);
  const c = Sh.richer(s, { want: 'weapon', purse: 50, mood: 'calm' }, () => 0);
  assert.equal(c.want, 'brew'); assert.equal(c.was, 'weapon');
});

test('the heir is a new person, and can open a different kind of shop', () => {
  const NINE = Object.keys(ALL).filter(id => !ALL[id].region), NOW = 2e12, DAY = 864e5;
  const old = { ...fresh(), uid: 'u', maker: 'Old Hand', made: 9, mythicsMade: NINE, shards: NINE, nineAt: NOW - DAY, shop: 'forge', who: { people: 'dwarf', look: 'delver_dwarf', background: 'smith' },
    staff: [{ id: 'a1', role: 'apprentice', name: 'Pip Hollis', trait: 'bright', xp: 0, hiredAt: NOW - 15 * DAY, skill: {} }], cards: [] };
  const r = Leg.handOn(old, [], NOW, 'reach', pick({ people: 'orc', look: 'guard_orc', background: 'herbs', shop: 'kettle' }));
  assert.ok(r.ok, r.why);
  assert.equal(r.save.maker, 'Pip Hollis'); assert.equal(r.save.shop, 'kettle'); assert.equal(r.save.who.people, 'orc');
  assert.ok(r.save.stations.includes('kettle')); assert.equal(Who.titleOf(r.save), 'Darkclay Alchemy');
  assert.equal(r.save.inheritedXp, Object.values(r.save.trades).reduce((a, t) => a + t.xp, 0) + ((r.save.haggle || {}).xp || 0));
  const none = Leg.handOn(old, [], NOW, 'reach'); assert.ok(none.ok); assert.equal(Who.shopOf(none.save), 'forge', 'without a choice, a forge as before');
});
