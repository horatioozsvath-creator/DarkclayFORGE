import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../js/rules.js';
import * as Sh from '../js/shop.js';
import * as Rm from '../js/room.js';
import { PATTERNS, BENCH, MATS, SUPPLIERS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const cfg = (o = {}) => ({ patternId: 'shortbow', picks: [0, 0, 0], level: 3, found: [], kit: {}, ...o });

test('the bench\'s working: steam, its band, the yew strip', () => {
  const S = R.newWorking(cfg(), seeded(1));
  assert.equal(S.station.id, 'bowbench'); assert.deepEqual(S.band, BENCH.band);
  assert.deepEqual(R.counts(S.rack), { GOOD: 10, GREAT: 3, HOLD: 3, CRACK: 4, TRUE: 0, FOUND: 0 });
  const birch = R.newWorking(cfg({ picks: [1, 0, 0] }), seeded(1)); assert.ok(birch.band[1] - birch.band[0] >= S.band[1] - S.band[0]);
});

test('the grain turns: with it for 2.6 s, across it for 1.4 s; a bend across does nothing', () => {
  const S = R.newWorking(cfg(), seeded(2)); R.begin(S); S.meter = 70;
  assert.ok(!R.acrossGrain(S));
  let turned = 0; for (let i = 0; i < 27; i++) if (R.tick(S, 0.1).grain) turned++;
  assert.ok(R.acrossGrain(S)); assert.equal(turned, 1);
  S.meter = 70; const ev = R.strike(S); assert.ok(ev.dead); assert.equal(S.shape, 0); assert.equal(S.rack.length, 20);
  for (let i = 0; i < 14; i++) R.tick(S, 0.1);
  assert.ok(!R.acrossGrain(S)); S.meter = 70; assert.ok(!R.strike(S).dead);
});

test('bent cold: a learner\'s bend does nothing; from trade 3 it splits', () => {
  const a = R.newWorking(cfg({ level: 1 }), seeded(3)); R.begin(a); a.meter = 10; assert.ok(R.strike(a).dead); assert.equal(a.rack.length, 20);
  const b = R.newWorking(cfg({ level: 3 }), seeded(3)); R.begin(b); b.meter = 10; R.strike(b); assert.equal(b.rack.length, 21);
});

test('the steam never scales a stave', () => {
  const S = R.newWorking(cfg(), seeded(4)); R.begin(S); R.toggleFire(S);
  for (let i = 0; i < 200; i++) assert.ok(!R.tick(S, 0.1).scaled);
});

test('a bow\'s card: its wood in its name, its range, bent by its maker', () => {
  const p = R.makePiece({ patternId: 'longbow', picks: [2, 1, 0], result: { tier: 1, worked: 10, strikes: 20, heats: 2, cracks: 0 }, maker: 'T', rng: seeded(1), now: 1 });
  assert.equal(p.name, 'Oak Longbow'); assert.ok(p.stats.some(s => s[0] === 'Range')); assert.ok(p.made[0].startsWith('Bent by'));
  assert.equal(R.makerOf(p), 'T');
});

test('strong links: arrows need forged heads, a staff a forged ferrule; forged at once from iron, or bought dearer', () => {
  assert.deepEqual(Sh.recipe('arrows', [0, 0, 0]), [{ mat: 'yew', n: 1 }, { mat: 'arrowheads', n: 1 }, { mat: 'goose', n: 1 }]);
  assert.ok(Sh.recipe('staff', [0, 0, 0]).some(r => r.mat === 'ferrule'));
  const s = { mats: { iron: 3 } };
  assert.ok(Sh.forgePart(s, 'arrowheads')); assert.equal(s.mats.arrowheads, 2); assert.equal(s.mats.iron, 2);
  assert.ok(Sh.forgePart(s, 'ferrule', 2)); assert.equal(s.mats.ferrule, 2); assert.equal(s.mats.iron, undefined);
  assert.ok(!Sh.forgePart(s, 'ferrule'), 'no iron left');
  // never a dead end: they're for sale, and dearer than forging them
  for (const id of ['arrowheads', 'ferrule']) assert.ok(SUPPLIERS.some(sp => sp.lines.includes(id)), id);
  assert.ok(MATS.arrowheads.price > MATS.iron.price / 2); assert.ok(MATS.ferrule.price > MATS.iron.price);
});

test('setting up the bench; hunters want bows only where a bench stands', () => {
  const s = { coins: 5000, room: Rm.defaultRoom(), slots: 4, shelf: [null, null, null, null], cards: [], stations: [] };
  assert.ok(Rm.buyStation(s, 'bowbench').item); assert.ok(Rm.valid(s.room)); assert.equal(s.coins, 5000 - BENCH.cost);
  const none = { stations: [] }, bench = { stations: ['bowbench'] };
  let bows = 0;
  for (let i = 0; i < 400; i++) {
    const a = Sh.richer(none, Sh.newCustomer(seeded(i))); assert.ok(!['bow', 'arrows', 'shortbow', 'longbow', 'staff'].includes(a.want), a.want);
    const b = Sh.richer(bench, Sh.newCustomer(seeded(i))); if (['bow', 'arrows', 'shortbow', 'longbow'].includes(b.want)) bows++;
  }
  assert.ok(bows > 30, bows + ' bow customers in 400');
  assert.equal(Sh.wantWord('arrows'), 'a sheaf of arrows'); assert.equal(Sh.wantWord('bow'), 'a bow');
});
