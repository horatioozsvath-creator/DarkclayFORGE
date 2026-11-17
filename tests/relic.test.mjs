import test from 'node:test';
import assert from 'node:assert/strict';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import * as St from '../js/staff.js';
import * as G from '../js/growth.js';
import { encodeCard, decodeCard } from '../js/share.js';
import { TIERS, RELICS, RELIC_WORK, STORIES, OLD_BLOOD, PATTERNS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const xpTo = lvl => { let x = 0; for (let l = 1; l < lvl; l++) x += R.xpToNext(l); return x; };
const make = (pattern, tier, extra = {}) => R.makePiece({ patternId: pattern, picks: [3, 2, 0], result: { tier, flawed: false, worked: 20, strikes: 20, heats: 2, cracks: 0, whiteHeat: true, ...extra }, maker: 'T', rng: seeded(tier + 1), now: 1 });
const shop = (o = {}) => ({ coins: 0, mats: {}, cards: [], shelf: [null, null], slots: 2, wall: [], ledger: [], queue: [], trades: { falchion: { xp: xpTo(9) } }, blueprints: ['gatewarden'], renown: 1300, ...o });

test('the Relic tier: amber, after Old-Blood; a plain rework never reaches it', () => {
  assert.equal(TIERS[RELIC_WORK.tier].id, 'relic'); assert.ok(TIERS[4].worth > TIERS[3].worth * 2);
  const ob = make('falchion', 3); const s = shop({ cards: [ob] });
  assert.ok(!Sh.canRework(s, ob), 'Old-Blood never goes back in an ordinary fire');
  assert.equal(R.reworkTo(3), 3);
});

test('what the Relic working needs: its blueprint, a Rare or Old-Blood piece of its kind, trade 7 at the station, in the back room; one in a save', () => {
  const ob = make('falchion', 3);
  assert.ok(Sh.relicFor(shop({ cards: [ob] }), ob).ok);
  assert.match(Sh.relicFor(shop({ cards: [ob], blueprints: [] }), ob).why.join(), /blueprint/);
  assert.match(Sh.relicFor(shop({ cards: [ob], trades: { falchion: { xp: xpTo(6) } } }), ob).why.join(), /trade 7/);
  const rare = make('falchion', 2); assert.ok(Sh.relicFor(shop({ cards: [rare] }), rare).ok, 'a Rare will do (milestone 34)');
  assert.deepEqual(Sh.relicCost(rare, 'gatewarden').map(x => x.mat), [rare.metal, 'heartstone', 'blackwater'], 'from a Rare, the station\'s rare thing too');
  assert.equal(Sh.relicFor(shop(), make('falchion', 1)).relic, null, 'a Fine piece: no');
  assert.equal(Sh.relicFor(shop(), make('dagger', 3)).relic, null, 'no Relic dagger');
  assert.ok(Sh.relicFor(shop({ cards: [ob], relicsMade: ['gatewarden'] }), ob).made);
  assert.deepEqual(Sh.relicCost(ob, 'gatewarden'), [{ mat: ob.metal, n: Math.ceil(PATTERNS.falchion.bars / 2) * 3 }, { mat: 'heartstone', n: 1 }]);
});

test('the working: narrowest band, WHITE HEAT twice and not one crack, or the Old-Blood piece stays as it was', () => {
  const cfg = { patternId: 'falchion', picks: [3, 2, 0], level: 9, found: [], kit: {}, rework: { from: 3, relic: 'gatewarden' } };
  const ob = R.newWorking({ ...cfg, rework: { from: 2 } }, seeded(1)), S = R.newWorking(cfg, seeded(1));
  assert.ok(S.band[1] - S.band[0] < ob.band[1] - ob.band[0]); assert.equal(S.whiteStreak, 12); assert.equal(S.relic, 'gatewarden');
  S.shape = 100; S.whites = 2; S.whiteHeat = true; const ok = R.finish(S, 'quench');
  assert.equal(ok.tier, 4); assert.ok(!ok.failed);
  const once = R.newWorking(cfg, seeded(1)); once.shape = 100; once.whites = 1; once.whiteHeat = true; assert.ok(R.finish(once, 'quench').failed);
  const crack = R.newWorking(cfg, seeded(1)); crack.shape = 100; crack.whites = 2; crack.cracks = 1; const c = R.finish(crack, 'quench'); assert.ok(c.failed); assert.equal(c.tier, 3);
  // WHITE HEAT counted as it comes, by streak or by a TRUE
  const live = R.newWorking(cfg, seeded(4)); R.begin(live); live.meter = (live.band[0] + live.band[1]) / 2;
  live.rack.forEach(x => { if (!x.up) x.k = 'GOOD'; }); for (let i = 0; i < 12; i++) { live.meter = (live.band[0] + live.band[1]) / 2; R.strike(live); }
  assert.equal(live.whites, 1);
  // the piece: named, its lore and power, its affixes kept, worth far more; a shared link carries the power
  const base = make('falchion', 3), piece = R.relicPiece(R.remakePiece({ card: base, res: ok, picked: null, rng: seeded(2), now: 2 }), 'gatewarden');
  assert.equal(piece.name, 'Gatewarden'); assert.equal(piece.tier, 'relic'); assert.deepEqual(piece.power, RELICS.gatewarden.power);
  assert.ok(base.affixes.every(a => piece.affixes.some(b => b[0] === a[0]))); assert.ok(piece.worth > base.worth * 2);
  const own = { cards: [piece], shelf: [], wall: [], mats: {} }; assert.equal(Sh.salvage(own, piece.id), null, 'a Relic is never broken down');
  const back = decodeCard(encodeCard(piece)); assert.deepEqual(back.power, piece.power); assert.equal(back.tier, 'relic');
  assert.equal(decodeCard(encodeCard({ ...piece, power: ['x', 3] })), null, 'a power that won\'t check');
});

test('blueprints: a great story\'s end, after the first and at RENOWNED; the Deep, now and then', () => {
  const s = { coins: 0, mats: {}, cards: [], shelf: [], slots: 2, wall: [], ledger: [], queue: [], stations: [], renown: 1300, stories: {} };
  const great = STORIES.find(x => x.id === 'vance2');
  assert.ok(!Sh.storiesReady(s, 1e12).some(x => x.id === 'vance2'), 'not before Vance\'s first');
  s.stories.vance = { step: 3, next: 0 }; assert.ok(Sh.storiesReady(s, 1e12).some(x => x.id === 'vance2'));
  s.renown = 900; assert.ok(!Sh.storiesReady(s, 1e12).some(x => x.id === 'vance2'), 'and RENOWNED'); s.renown = 1300;
  s.stories.vance2 = { step: great.steps.length - 1, next: 0 };
  s.order = { who: great.who, pattern: 'falchion', least: 3, metal: null, story: 'vance2', step: great.steps.length - 1, pays: 1, due: 1e9 };
  const c = make('falchion', 3); s.cards.push(c);
  const e = Sh.deliver(s, c.id, 1e12); assert.equal(e.story.blueprint, 'gatewarden'); assert.deepEqual(s.blueprints, ['gatewarden']);
  // the Deep: the Hollow King's Helm, now and then
  const runner = { id: 'r', role: 'runner', name: 'Kit', trait: 'keen', xp: 0 }, d = { ...s, blueprints: [], found: ['ember'] };
  let got = 0; const rng = seeded(9); for (let i = 0; i < 2000; i++) if (St.haul(d, runner, 'below', rng, 0).blueprint) got++;
  assert.ok(got > 180 && got < 380, got + ' of 2000 trips');
  // one for a station the maker is good at, first: a master of the falchion is shown the forge's
  d.trades = { falchion: { xp: 1e6 } }; let gw = 0; for (let i = 0; i < 2000; i++) { const b = St.haul(d, runner, 'below', rng, 0).blueprint; if (b) { assert.equal(PATTERNS[RELICS[b].pattern].station || 'forge', 'forge'); gw++; } }
  assert.ok(gw > 80);
  d.blueprints = Object.keys(RELICS); for (let i = 0; i < 300; i++) assert.ok(!St.haul(d, runner, 'below', rng, 0).blueprint, 'all found: no more');
});

test('a RENOWNED shop with a blueprint is sometimes asked for that Relic; only the Relic fills it', () => {
  let asked = 0;
  for (let i = 0; i < 300; i++) {
    const s = { renown: 1300, wall: [], cards: [], stations: [], ledger: [], clock: 0, stories: Object.fromEntries(STORIES.map(x => [x.id, { step: 9 }])), blueprints: ['gatewarden'] };
    Sh.postOrder(s, seeded(i), 0);
    if (s.order.relic) { asked++; assert.equal(s.order.pattern, 'falchion'); assert.equal(s.order.least, 4); assert.match(Sh.orderWord(s.order), /Gatewarden/); }
  }
  assert.ok(asked > 15 && asked < 70, asked + ' of 300');
  const o = { pattern: 'falchion', least: 4, metal: null };
  assert.ok(!Sh.fills(o, make('falchion', 3))); assert.ok(Sh.fills(o, { ...make('falchion', 3), tier: 'relic' }));
});

test('every Relic: a real piece to work from, a relic material, and a blueprint that can be found', async () => {
  const { MATS } = await import('../js/data.js');
  const byStation = {};
  for (const [id, r] of Object.entries(RELICS)) {
    const p = PATTERNS[r.pattern]; assert.ok(p && !p.makes, id);
    assert.ok(MATS[r.mat] && MATS[r.mat].relic, id + ' material');
    assert.ok(Array.isArray(r.power) && r.power.length === 2 && r.lore, id);
    if (r.source !== 'deep') assert.ok(STORIES.some(s => s.after === r.source && s.blueprint === id), id + ': a great story ends in it');
    const st = p.station || 'forge'; byStation[st] = (byStation[st] || 0) + 1;
  }
  assert.ok(byStation.stretcher >= 2 && byStation.bowbench >= 2 && byStation.forge >= 3);
});

test('the Relic working at the stretcher and the bench: the same rule, at their own meters', () => {
  for (const [pattern, relic] of [['jerkin', 'wolfmantle'], ['longbow', 'oskbow']]) {
    const cfg = { patternId: pattern, picks: [0, 2, 2], level: 9, found: [], kit: {} };
    const plain = R.newWorking({ ...cfg, rework: { from: 2 } }, seeded(1)), S = R.newWorking({ ...cfg, rework: { from: 3, relic } }, seeded(1));
    assert.ok(S.band[1] - S.band[0] < plain.band[1] - plain.band[0], pattern);
    S.shape = 100; S.whites = 2; S.whiteHeat = true;
    const res = R.finish(S, 'quench'); assert.equal(res.tier, 4, pattern);
    const base = R.makePiece({ patternId: pattern, picks: [0, 2, 2], result: { tier: 3, flawed: false, worked: 20, strikes: 20, heats: 2, cracks: 0, whiteHeat: true }, maker: 'T', rng: seeded(3), now: 1 });
    const piece = R.relicPiece(R.remakePiece({ card: base, res, picked: null, rng: seeded(4), now: 2 }), relic);
    assert.equal(piece.name, RELICS[relic].name); assert.equal(piece.tier, 'relic');
  }
});

test('a relic brew is worked from an Old-Blood batch and boils down to one bottle; the glass\'s Relics at its own meter', () => {
  const xp9 = xpTo(9);
  const batch = R.makePiece({ patternId: 'tonic', picks: [0, 2, 0], result: { tier: 3, flawed: false, worked: 20, strikes: 20, heats: 2, cracks: 0, whiteHeat: true }, maker: 'T', rng: seeded(2), now: 1 });
  assert.equal(batch.count, 3);
  const s = shop({ cards: [batch], trades: { tonic: { xp: xp9 } }, blueprints: ['wennasdraught'], stations: ['kettle'] });
  const g = Sh.relicFor(s, batch); assert.ok(g.ok); assert.equal(g.relic, 'wennasdraught');
  assert.deepEqual(Sh.relicCost(batch, g.relic).map(x => x.mat), [batch.metal, 'moonmead']);
  const S = R.newWorking({ patternId: 'tonic', picks: [0, 2, 0], level: 9, found: [], kit: {}, rework: { from: 3, relic: g.relic } }, seeded(1));
  assert.equal(S.relic, 'wennasdraught'); S.shape = 100; S.whites = 2; S.whiteHeat = true;
  const res = R.finish(S, 'quench'); assert.equal(res.tier, 4);
  const piece = R.relicPiece(R.remakePiece({ card: batch, res, picked: null, rng: seeded(3), now: 2 }), g.relic);
  assert.equal(piece.count, 1); assert.equal(piece.name, 'Wenna\'s Last Draught');
  // it sells once, and it's gone
  const shopS = { ...shop({ cards: [piece], trades: {} }), made: 1 }; Sh.fixShelf(shopS); Sh.place(shopS, piece.id);
  shopS.queue = [{ kind: 'buyer', who: 'x', want: 'any', purse: 1e7, mood: 'EAGER', least: 0, wait: 45, shows: 0 }];
  assert.equal(Sh.haggle(shopS, piece.id, 'hold', 1).outcome, 'sold'); assert.equal(shopS.cards.length, 0);
  // the glass: the lens, at the gather's meter
  const L = R.newWorking({ patternId: 'lens', picks: [0, 0, 2], level: 9, found: [], kit: {}, rework: { from: 3, relic: 'abbeylens' } }, seeded(1));
  const Lp = R.newWorking({ patternId: 'lens', picks: [0, 0, 2], level: 9, found: [], kit: {}, rework: { from: 2 } }, seeded(1));
  assert.ok(L.band[1] - L.band[0] < Lp.band[1] - Lp.band[0]);
});
