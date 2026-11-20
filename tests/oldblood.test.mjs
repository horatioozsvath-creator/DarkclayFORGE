import test from 'node:test';
import assert from 'node:assert/strict';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import { encodeCard, decodeCard } from '../js/share.js';
import { TIERS, OLD_BLOOD, PATTERNS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const make = (pattern, picks, tier, extra = {}) => R.makePiece({ patternId: pattern, picks, result: { tier, flawed: false, worked: 20, strikes: 20, heats: 2, cracks: 0, ...extra }, maker: 'T', rng: seeded(tier + 7), now: 1 });
const xpFor = lvl => { let x = 0; for (let l = 1; l < lvl; l++) x += R.xpToNext(l); return x; };
const saveWith = (card, level) => ({ cards: [card], shelf: [null, null], slots: 2, wall: [], mats: {}, trades: { [card.pattern]: { xp: xpFor(level) } } });
const RARE_GUARD = [0, 2, 0];   // a falchion with a blackwater iron guard (✶)

test('Old-Blood is the fourth tier: violet, three affixes, never rolled by a working (but the blood waking, milestone 50)', () => {
  const t = TIERS[OLD_BLOOD.tier];
  assert.equal(t.id, 'oldblood'); assert.equal(t.affixes, 3); assert.ok(t.mult > TIERS[2].mult && t.worth > TIERS[2].worth);
  const rng = seeded(4);
  R.setLuck(false);
  try {
    for (let i = 0; i < 3000; i++) {
      const S = R.newWorking({ patternId: 'falchion', picks: RARE_GUARD, level: 10, found: [], kit: { fine: 30 } }, rng);
      S.shape = 100; S.worked = 200; S.earned = S.whiteHeat = true;
      assert.ok(R.finish(S, 'quench').tier <= 2);
    }
  } finally { R.setLuck(true); }
  for (let i = 0; i < 3000; i++) {   // with the luck: an Old-Blood piece only as one that woke
    const S = R.newWorking({ patternId: 'falchion', picks: RARE_GUARD, level: 10, found: [], kit: { fine: 30 } }, rng);
    S.shape = 100; S.worked = 200; S.earned = S.whiteHeat = true;
    const r = R.finish(S, 'quench'); assert.ok(r.tier <= 2 || (r.tier === OLD_BLOOD.tier && r.woke));
  }
  for (const id of Object.keys(PATTERNS)) assert.equal(PATTERNS[id].lore.length, 4, id + ' has an Old-Blood line');
});

test('the gate: Rare, not flawed, trade 6, and a ✶ part or WHITE HEAT; brews and bottles never', () => {
  const plain = make('falchion', [0, 0, 0], 2), rareGuard = make('falchion', RARE_GUARD, 2), hot = make('falchion', [0, 0, 0], 2, { whiteHeat: true });
  assert.ok(!R.oldBloodGate(plain, 6).ok);
  assert.match(R.oldBloodGate(plain, 6).why.join(), /WHITE HEAT/);
  assert.ok(R.oldBloodGate(rareGuard, 6).ok); assert.ok(R.oldBloodGate(hot, 6).ok);
  assert.ok(!R.oldBloodGate(rareGuard, 5).ok, 'a master only');
  assert.ok(!R.oldBloodGate(make('falchion', RARE_GUARD, 1), 9).ok, 'Rare first');
  assert.ok(!R.oldBloodGate({ ...rareGuard, flawed: true }, 9).ok);
  assert.ok(!R.oldBloodGate(make('draught', [0, 0, 2], 2, { whiteHeat: true }), 9).ok, 'brews stop at Rare');
  // the shop's side: only a qualifying Rare can go back in the fire, and it costs three times the bars and a rare thing
  assert.ok(Sh.canRework(saveWith(make('falchion', [0, 0, 0], 1), 1), make('falchion', [0, 0, 0], 1)), 'Fine still goes up');
  assert.ok(!Sh.canRework(saveWith(plain, 9), plain));
  assert.ok(!Sh.canRework(saveWith(rareGuard, 5), rareGuard));
  assert.ok(Sh.canRework(saveWith(rareGuard, 6), rareGuard));
  const bars = Math.ceil(PATTERNS.falchion.bars / 2);
  assert.deepEqual(Sh.reworkCost(rareGuard), [{ mat: rareGuard.metal, n: bars * 3 }, { mat: 'blackwater', n: 1 }]);
  assert.deepEqual(Sh.reworkCost(make('falchion', [0, 0, 0], 1)), [{ mat: 'iron', n: bars }]);
});

test('the last rework: a narrower band, WHITE HEAT later, and not one crack, or it stays Rare', () => {
  const cfg = from => ({ patternId: 'falchion', picks: RARE_GUARD, level: 6, found: [], kit: {}, rework: { from } });
  const A = R.newWorking(cfg(1), seeded(1)), B = R.newWorking(cfg(2), seeded(1));
  assert.ok(B.band[1] - B.band[0] < A.band[1] - A.band[0]); assert.equal(B.whiteStreak, 12); assert.ok(!A.oldBlood && B.oldBlood);
  assert.equal(R.odds(B).o, 100);
  B.shape = 100; const ok = R.finish(B, 'quench'); assert.equal(ok.tier, 3); assert.ok(!ok.failed);
  const C = R.newWorking(cfg(2), seeded(1)); C.shape = 100; C.cracks = 1;
  const one = R.finish(C, 'quench'); assert.equal(one.tier, 2); assert.ok(one.failed); assert.ok(!one.earned);
  const D = R.newWorking(cfg(2), seeded(1)); const dr = R.finish(D, 'dropped'); assert.equal(dr.tier, 2, 'never lower than Rare'); assert.ok(!dr.flawed);
  // the piece it makes: Old-Blood, three affixes of its own kept and added, its fourth lore line, worth more
  const rare = make('falchion', RARE_GUARD, 2);
  const ob = R.remakePiece({ card: rare, res: ok, picked: null, rng: seeded(3), now: 2 });
  assert.equal(ob.tier, 'oldblood'); assert.equal(ob.id, rare.id);
  assert.ok(ob.affixes.length >= 3); assert.ok(rare.affixes.every(a => ob.affixes.some(b => b[0] === a[0])));
  assert.equal(ob.lore, PATTERNS.falchion.lore[3]); assert.ok(ob.worth > rare.worth * 1.6);
  // shared as a link, it opens anywhere
  const back = decodeCard(encodeCard(ob)); assert.ok(back); assert.equal(back.tier, 'oldblood');
});

test('a famed shop is sometimes asked for Old-Blood (a brew too, a master\'s), never for bottles', () => {
  let asked = 0;
  for (let i = 0; i < 400; i++) {
    const save = { renown: 999, wall: [], cards: [], stations: ['kettle', 'stretcher', 'bowbench', 'glass'], ledger: [], clock: 0 };
    Sh.postOrder(save, seeded(i), 0);
    if (save.order.least === OLD_BLOOD.tier) { asked++; assert.ok(!PATTERNS[save.order.pattern].makes); assert.match(Sh.orderWord(save.order), /^Old-Blood or better/); }
  }
  assert.ok(asked > 20 && asked < 200, asked + ' of 400');
  const plain = { renown: 0, wall: [], cards: [], stations: [], ledger: [], clock: 0 };
  for (let i = 0; i < 100; i++) { Sh.postOrder(plain, seeded(i), 0); assert.ok(plain.order.least < OLD_BLOOD.tier); }
});

// ---------- the kettle: a master's brew ----------
const MOON = [0, 2, 0];   // mending herb, moonwell water (✶), honey
const brewing = (o = {}) => R.newWorking({ patternId: 'draught', picks: MOON, level: 6, found: [], kit: {}, master: true, ...o }, seeded(2));

test('a master\'s brew: trade 6 and moonwell water, brews only; an ordinary brew never comes out Old-Blood', () => {
  assert.ok(R.masterBrewGate('draught', MOON, 6).ok);
  assert.match(R.masterBrewGate('draught', MOON, 5).why.join(), /trade 6/);
  assert.match(R.masterBrewGate('draught', [0, 0, 0], 9).why.join(), /moonwell/);
  assert.ok(!R.masterBrewGate('falchion', [0, 2, 0], 9).ok); assert.ok(!R.masterBrewGate('bottles', [0, 0, 0], 9).ok, 'bottles stop at Rare');
  assert.ok(!brewing({ level: 5 }).master, 'the switch does nothing without the gate');
  const rng = seeded(8);
  for (let i = 0; i < 1500; i++) {
    const S = R.newWorking({ patternId: 'draught', picks: MOON, level: 10, found: [], kit: {} }, rng);
    S.shape = 100; S.worked = 200; S.whiteHeat = S.earned = true;
    assert.ok(R.finish(S, 'quench').tier <= 2);
  }
});

test('a master\'s brew: a narrower simmer, WHITE HEAT later; not one boil-over and WHITE HEAT, or an ordinary batch', () => {
  const plain = R.newWorking({ patternId: 'draught', picks: MOON, level: 6, found: [], kit: {} }, seeded(2)), M = brewing();
  assert.ok(M.master && !M.oldBlood); assert.ok(M.band[1] - M.band[0] < plain.band[1] - plain.band[0]); assert.equal(M.whiteStreak, 12);
  M.shape = 100; M.whiteHeat = M.earned = true;
  const ok = R.finish(M, 'quench'); assert.equal(ok.tier, 3); assert.ok(ok.master && ok.oldBlood);
  const batch = R.makePiece({ patternId: 'draught', picks: MOON, result: ok, picked: null, maker: 'T', rng: seeded(1), now: 1 });
  assert.equal(batch.tier, 'oldblood'); assert.equal(batch.count, 3); assert.equal(batch.lore, PATTERNS.draught.lore[3]);
  const boiled = brewing(); boiled.shape = 100; boiled.whiteHeat = true; boiled.boils = 1;
  const b = R.finish(boiled, 'quench'); assert.ok(b.tier <= 2); assert.equal(b.masterShort, 'boiled');
  const cold = brewing(); cold.shape = 100;
  const c = R.finish(cold, 'quench'); assert.ok(c.tier <= 2); assert.equal(c.masterShort, 'nowhite');
  const spilt = brewing(); spilt.whiteHeat = true; assert.equal(R.finish(spilt, 'dropped').masterShort, 'dropped');
  // a boil-over is counted as it happens
  const live = brewing(); R.begin(live); live.meter = 99; R.strike(live); assert.equal(live.boils, 1);
});

test('a master\'s brew takes a second measure of the herb and one more moonwell water; a famed order for one is filled by it', () => {
  const plain = Sh.recipe('draught', MOON), more = Sh.recipe('draught', MOON, true), n = (rec, m) => (rec.find(r => r.mat === m) || {}).n || 0;
  assert.equal(n(more, 'mending'), n(plain, 'mending') + PATTERNS.draught.bars); assert.equal(n(more, 'moonwater'), n(plain, 'moonwater') + 1);
  assert.equal(n(more, 'bottle'), n(plain, 'bottle'));
  assert.deepEqual(Sh.recipe('falchion', [0, 0, 0], true), Sh.recipe('falchion', [0, 0, 0]), 'only brews');
  const M = brewing(); M.shape = 100; M.whiteHeat = true;
  const batch = R.makePiece({ patternId: 'draught', picks: MOON, result: R.finish(M, 'quench'), picked: null, maker: 'T', rng: seeded(1), now: 1 });
  assert.ok(Sh.fills({ pattern: 'draught', least: OLD_BLOOD.tier, metal: null }, batch));
});
