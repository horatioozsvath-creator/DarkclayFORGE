// Milestone 47: miners (docs/MINE-PLAN.md). A new staff role once the trapdoor's open: a miner digs the seam you set them to on the
// shop's clock, here and while you're away, slower than your own hand; their workings wear the shoring, and the face can hurt them.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../js/rules.js';
import * as Mine from '../js/mine.js';
import * as Mi from '../js/miner.js';
import * as St from '../js/staff.js';
import * as Run from '../js/runner.js';
import { RENOWN, MINERS, ROLES, MINE } from '../js/data.js';

const H = 3600000, D = 24 * H, NOW = 2e12;
const xpAt = lvl => { let x = 0; for (let l = 1; l < lvl; l++) x += R.xpToNext(l); return x; };
const shop = (o = {}) => ({ v: 1, coins: 10000, mats: { oak: 40 }, trades: { dig: { xp: xpAt(6) } }, renown: RENOWN[4].at, cards: [], staff: [], ...o });
function mine(n, o) { const s = shop(o); Mine.open(s, NOW); for (let g = 2; g <= n; g++) assert.ok(Mine.openGallery(s).ok, 'gallery ' + g); return s; }
const miner = (o = {}) => ({ id: 'm1', role: 'miner', name: 'Garrow Pell', trait: 'quick', xp: 0, trip: null, ...o });
const always = () => 0, never = () => 0.999;
// a time in the Reach with no water in the deep galleries
const dryAt = s => [...Array(60).keys()].map(i => NOW + i * D).find(t => !Mine.isFlooded(s, 3, t));

test('the role: none looking for work till the trapdoor\'s open; one miner, a second once the third gallery is open', () => {
  assert.ok(ROLES.miner.mine);
  const s = shop(), seen = new Set();
  for (let h = 0; h < 400; h++) St.candidates(s, 1e5 + h).forEach(c => seen.add(c.role));
  assert.ok(!seen.has('miner') && !St.rolesOpen(s).includes('miner')); assert.equal(St.roleCap(s, 'miner'), 0);
  Mine.open(s, NOW); seen.clear();
  for (let h = 0; h < 400; h++) St.candidates(s, 1e5 + h).forEach(c => seen.add(c.role));
  assert.ok(seen.has('miner')); assert.equal(St.roleCap(s, 'miner'), 1);
  const c = St.candidates(s, [...Array(400).keys()].map(h => 1e5 + h).find(h => St.candidates(s, h).some(x => x.role === 'miner'))).find(x => x.role === 'miner');
  assert.ok(St.hire(s, c)); assert.ok(!St.canHireRole(s, 'miner'));
  assert.equal(Mi.cap(mine(3)), 2);
  // a shop without the mine: the hiring pool as before (no miner, the same draws)
  assert.deepEqual(St.rolesOpen(shop({ renown: RENOWN[4].at })), ['clerk', 'runner', 'guard', 'apprentice']);
});

test('a haul every 90 minutes of the clock, from the dearest open seam or the one set; Common or Fine, never Rare', () => {
  const s = mine(2), p = miner(); s.staff.push(p); const t = dryAt(s);
  assert.deepEqual(Mi.step(shop(), 3 * H / 1000, never, t), [], 'no miner, no haul');
  assert.equal(Mi.step(s, (MINERS.every - 1) * 60, never, t).length, 0);
  const r = Mi.step(s, 60, never, t); assert.equal(r.length, 1);
  assert.equal(r[0].mat, 'silverore', 'the dearest open seam'); assert.equal(r[0].tier, 0); assert.equal(s.mats.silverore, 4);
  p.seam = 'seam_iron'; const r2 = Mi.step(s, MINERS.every * 60, always, t); assert.equal(r2[0].mat, 'ironstone'); assert.equal(r2[0].tier, 1, 'Fine at best');
  p.seam = 'rest'; assert.equal(Mi.step(s, 5 * H / 1000, never, t).length, 0); assert.match(Mi.where(s, p, t).why, /rest/);
  delete p.seam; s.unpaid = true; assert.match(Mi.where(s, p, t).why, /wages/); s.unpaid = false;
  assert.equal(Mi.minutesEach(miner({ trait: 'strong' })), MINERS.every * MINERS.strong);
  assert.ok(Mi.fineOdds(miner({ xp: xpAt(20) })) <= MINERS.fine[2] + MINERS.canny);
});

test('their workings wear the shoring; a fallen or flooded gallery stops them; the roof coming in on them can hurt them', () => {
  const s = mine(2, { threatsFrom: 0 }), p = miner({ seam: 'seam_silver' }); s.staff.push(p); const t = dryAt(s);
  const before = Mine.shoring(s, 2); Mi.step(s, MINERS.every * 60, never, t); assert.equal(Mine.shoring(s, 2), before - MINE.shore.per);
  Mine.stateOf(s, 2).s = 1;
  const r = Mi.dig(s, p, Mine.seams(s).find(x => x.id === 'seam_silver'), always, t);
  assert.equal(r.fell, 2); assert.ok(r.hurt && r.days >= 1 && r.bill > 0); assert.ok(Run.hurtNow(p, t));
  assert.match(Mi.where(s, p, t + 7 * D).why, /fallen/);
  // a salve heals it
  const q = miner({ id: 'm2', seam: 'seam_iron', potions: [{ pattern: 'salve', name: 'Mending salve' }] }); Mine.stateOf(s, 1).s = 1;
  const r2 = Mi.dig(s, q, Mine.seams(s).find(x => x.id === 'seam_iron'), always, t); assert.ok(r2.fell && !r2.hurt); assert.deepEqual(r2.used, ['Mending salve']);
});

test('down in the old workings, something comes up: hurt, they drop the haul; a night guard halves it, armour and a lantern soften it', () => {
  const s = mine(4, { threatsFrom: 0 }), p = miner({ seam: 'seam_blackwater' }); s.staff.push(p); const t = dryAt(s);
  const k = Mi.risk(s, p, 4, t); assert.equal(k.beast, MINERS.beast.odds); assert.equal(Mi.risk(s, p, 3, t).beast, 0, 'not above the old workings');
  const r = Mi.dig(s, p, Mine.seams(s).find(x => x.id === 'seam_blackwater'), always, t);
  assert.ok(r.beast && r.lost && r.hurt); assert.equal(s.mats.blackwater, undefined, 'the haul dropped');
  s.staff.push({ id: 'g1', role: 'guard', name: 'Hollin', trait: 'stout', xp: 0 });
  assert.equal(Mi.risk(s, p, 4, t).beast, MINERS.beast.odds * MINERS.beast.guard);
  const kitted = miner({ gear: { head: { tier: 'fine' }, body: { tier: 'fine' }, light: { tier: 'fine' } } });
  assert.ok(Mi.risk(s, kitted, 4, t).hurt < Mi.risk(s, miner(), 4, t).hurt);
});

test('spared on a gentler Reach and in the week of grace: no wear, no hurt', () => {
  const s = mine(4, { gentle: true }), p = miner({ seam: 'seam_blackwater' }); s.staff.push(p);
  assert.deepEqual(Mi.risk(s, p, 4, NOW), { fall: 0, beast: 0, hurt: 0 });
  const r = Mi.dig(s, p, Mine.seams(s).find(x => x.id === 'seam_blackwater'), always, NOW);
  assert.ok(!r.hurt && !r.beast && !r.fell); assert.equal(Mine.shoring(s, 4), 100); assert.equal(s.mats.blackwater, 2);
  const g = mine(2, { threatsFrom: NOW + 7 * D }); assert.equal(Mi.risk(g, p, 2, NOW).fall, 0);
});

test('while you\'re away: the miners dig up to the cap, and the summary tells it; let go, their gear comes back', () => {
  const s = mine(2, { lastSeen: NOW }), p = miner({ seam: 'seam_iron', gear: { head: { id: 'h1', name: 'Iron helm', tier: 'common' } } }); s.staff.push(p);
  const t = dryAt(s); s.lastSeen = t - 3 * H;
  const a = St.catchUp(s, t, () => 0.5);
  assert.equal(a.dug.length, 2); assert.equal(s.mats.ironstone, 8);
  St.letGo(s, 'm1'); assert.ok(s.cards.some(c => c.id === 'h1')); assert.equal(Mi.minersOf(s).length, 0);
});
