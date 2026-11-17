// Milestone 22: the runner's gear and potions, the road's danger, the hunt.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as Run from '../js/runner.js';
import * as St from '../js/staff.js';
import * as R from '../js/rules.js';
import { GEAR, ROUTES } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const H = 3600000, D = 24 * H;
let n = 0;
const piece = (pattern, tier = 1, o = {}) => ({ ...R.makePiece({ patternId: pattern, picks: [0, 0, 0], result: { tier, flawed: false, worked: 10, strikes: 10, heats: 1, cracks: 0 }, maker: 'T', rng: seeded(++n), now: n }), id: 'c' + n, ...o });
const runner = (o = {}) => ({ id: 'r', role: 'runner', name: 'Kit', trait: 'keen', xp: 0, trip: null, ...o });
const shop = (o = {}) => ({ coins: 5000, renown: 600, threatsFrom: 0, cards: [], mats: {}, found: ['ember'], staff: [runner()], ...o });

test('gear: by slot, off the shelves while carried; a replaced piece goes back; two potions, a bottle from a batch', () => {
  const s = shop(), p = s.staff[0], sword = piece('falchion', 2), helm = piece('helm', 1), helm2 = piece('helm', 3), salve = { ...piece('salve', 1), count: 3 }, lens = piece('lens');
  s.cards.push(sword, helm, helm2, salve, lens);
  assert.ok(Run.equip(s, p, sword.id).ok); assert.equal(p.gear.weapon, sword); assert.ok(!s.cards.includes(sword));
  assert.ok(Run.equip(s, p, helm.id).ok); assert.ok(Run.equip(s, p, helm2.id).ok); assert.equal(p.gear.head, helm2); assert.ok(s.cards.includes(helm), 'the old helm back');
  assert.ok(Run.equip(s, p, lens.id).why, 'a lens is no gear');
  assert.ok(Run.equip(s, p, salve.id).potion); assert.equal(salve.count, 2); assert.ok(Run.equip(s, p, salve.id).ok); assert.ok(Run.equip(s, p, salve.id).why, 'two at most');
  assert.deepEqual(Run.strength(p), { guard: 5, fight: 3 }, 'an Old-Blood helm, a Rare sword');
  assert.ok(Run.unequip(s, p, 'weapon').ok); assert.ok(s.cards.includes(sword));
});

test('danger: every road has some, the short roads little and never deadly; none on a gentler Reach; gear cuts it, death most of all', () => {
  const s = shop(), p = s.staff[0];
  const y = Run.risk(s, p, 'yard', 0); assert.ok(y.hurt > 0 && y.hurt < 0.01); assert.equal(y.die, 0);
  assert.equal(Run.riskLevel(s, p, 'yard', 0).word, 'LOW'); assert.equal(Run.riskLevel(s, p, 'below', 0).word, 'DEADLY');
  assert.ok(Run.riskLevel(shop({ gentle: true }), p, 'below', 0).spared);
  assert.deepEqual(Run.risk(shop({ gentle: true }), p, 'below', 0), { hurt: 0, die: 0 });
  const bare = Run.risk(s, p, 'below', 0); assert.equal(bare.die, GEAR.danger.below.die);
  ['falchion', 'helm', 'jerkin', 'gloves', 'boots', 'ring'].forEach(k => { const c = piece(k, 2); s.cards.push(c); Run.equip(s, p, c.id); });
  const kitted = Run.risk(s, p, 'below', 0);
  assert.ok(kitted.hurt < bare.hurt / 2); assert.ok(kitted.die < bare.die / 5);
  const lv = Run.riskLevel(s, p, 'below', 0); assert.equal(lv.word, 'MODERATE', 'a full set of Rare gear: deadly down to moderate'); assert.equal(lv.bare, 'DEADLY'); assert.ok(lv.cut > 0.5);
  for (const r of Object.keys(ROUTES)) assert.ok(GEAR.danger[r], r + ' has its danger');
});

test('the road: a salve heals a wound, a draught keeps a dying runner alive; hurt breaks a piece of armour (never a Relic) and costs a healer', () => {
  const s = shop(), p = s.staff[0], always = () => 0;
  const helm = piece('helm', 1); s.cards.push(helm); Run.equip(s, p, helm.id);
  p.potions = [{ pattern: 'draught', name: 'Draught' }];
  const r = Run.road(s, p, 'below', always, 0); assert.ok(!r.died && r.hurt, 'a draught: hurt, not killed'); assert.equal(r.broke, helm.name); assert.ok(r.bill > 0); assert.ok(Run.hurtNow(p, D)); assert.ok(!Run.hurtNow(p, 5 * D));
  const t = shop(), q = t.staff[0]; q.potions = [{ pattern: 'salve', name: 'Salve' }];
  const crown = { ...piece('helm', 4), tier: 'relic' }; t.cards.push(crown); Run.equip(t, q, crown.id);
  let k = 0; const seq = () => [0.99, 0.0][k++ % 2];   // not killed, then hurt
  const r2 = Run.road(t, q, 'gang', seq, 0); assert.ok(!r2.hurt, 'the salve healed it'); assert.deepEqual(r2.used, ['Salve']);
  q.potions = []; k = 0; const r3 = Run.road(t, q, 'gang', seq, 0); assert.ok(r3.hurt); assert.equal(r3.broke, null, 'a Relic doesn\'t break');
  const dead = shop(), d = dead.staff[0], sword = piece('falchion'); dead.cards.push(sword); Run.equip(dead, d, sword.id);
  Run.lose(dead, d, 'below', 7); assert.equal(dead.staff.length, 0); assert.ok(dead.cards.includes(sword), 'the Watch brought it back'); assert.equal(dead.memorials[0].name, 'Kit');
});

test('the hunt: only while the trail is warm; the pieces back and a bounty; a Relic keeps the trail warm until it\'s found', () => {
  const s = shop(), p = s.staff[0];
  assert.ok(!St.sendRunner(s, 'gang', 0), 'no robbery, no hunt');
  const stolen = [piece('axe', 2), { ...piece('ring', 4), tier: 'relic' }];
  s.robbery = { gang: 'the river crew', where: 'down to the docks', at: 0, took: stolen, till: 0, trail: 2 * D };
  assert.ok(St.sendRunner(s, 'gang', H)); assert.ok(p.trip.odds >= GEAR.hunt.base);
  const cold = Run.hunt(s, p, () => 0.999, 3 * H, 0.5); assert.ok(cold.again); assert.ok(!s.robbery.done); assert.ok(s.robbery.trail > 3 * H);
  const coins = s.coins, won = Run.hunt(s, p, () => 0, 4 * H, 0.5); assert.ok(won.won); assert.ok(s.cards.includes(stolen[1])); assert.ok(s.coins > coins); assert.ok(s.robbery.done);
  const t = shop({ robbery: { gang: 'x', took: [piece('dagger')], trail: D } }); const c2 = Run.hunt(t, t.staff[0], () => 0.999, H, 0.5); assert.ok(c2.cold && !c2.again); assert.ok(t.robbery.done, 'no Relic: gone');
  assert.ok(ROUTES.gang.hunt);
});

test('a hurt runner stays home', () => {
  const s = shop(); s.staff[0].hurt = 2 * D; assert.ok(!St.sendRunner(s, 'yard', D)); assert.ok(St.sendRunner(s, 'yard', 3 * D));
});
