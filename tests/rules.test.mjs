// node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../js/rules.js';
import { PATTERNS, FOUND } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const cfg = (o = {}) => ({ patternId: 'falchion', picks: [0, 0, 0], level: 3, found: [], kit: {}, ...o });

test('levels come from practice', () => {
  assert.equal(R.levelOf(0).level, 1);
  assert.equal(R.levelOf(4).level, 2);
  assert.equal(R.levelOf(10).level, 3);
  assert.equal(R.levelOf(1e6).level, R.MAX_LEVEL);
  assert.deepEqual([1, 3, 5, 7].map(R.slotsFor), [0, 1, 2, 3]);
});

test('the iron strip is 20 tiles and a learner has no cracks', () => {
  const parts = R.chosenParts('falchion', [0, 0, 0]);
  const a = R.buildStrip({ parts, level: 3 });
  assert.equal(a.t.length, 20);
  assert.deepEqual(R.counts(a.t), { GOOD: 10, GREAT: 3, HOLD: 3, CRACK: 4, TRUE: 0, FOUND: 0 });
  const b = R.buildStrip({ parts, level: 1 });
  assert.equal(R.counts(b.t).CRACK, 0);
  assert.equal(new Set(a.t.map(x => x.id)).size, 20);
});

test('trade, rare parts and found tiles stack the strip', () => {
  const parts = R.chosenParts('falchion', [0, 2, 0]);   // Blackwater iron guard
  const s = R.buildStrip({ parts, level: 7, found: ['ember', 'twin', 'seer', 'echo'] });
  const c = R.counts(s.t);
  assert.equal(c.CRACK, 2);      // two turned by trade 7
  assert.equal(c.TRUE, 2);       // the rare guard, and a true hand
  assert.equal(c.FOUND, 3);      // three slots at trade 7
  assert.equal(s.t.length, 20);
});

test('bands follow the metal', () => {
  const m = id => R.partOptions('falchion')[0].opts.find(o => o.id === id);
  assert.deepEqual(R.bandFor(m('iron')), [45, 86]);
  assert.deepEqual(R.bandFor(m('steel')), [55, 92]);
  const b = R.bandFor(m('bronze')); assert.ok(b[1] - b[0] > 41);
});

test('a working can be shaped, pushed and quenched', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const rng = seeded(seed), S = R.newWorking(cfg(), rng);
    R.begin(S);
    let guard = 0;
    while (!S.done && guard++ < 400) {
      if (S.meter < S.band[0] + 10) { R.toggleFire(S); while (S.meter < S.band[1] - 6) R.tick(S, 0.1); }
      const ev = R.strike(S);
      if (ev.drop) { const r = R.finish(S, 'dropped'); assert.ok(r.tier >= 0); break; }
      if (S.shape >= 100 && S.worked >= 12) { const r = R.finish(S, 'quench'); assert.ok(r.tier >= 0 && r.tier <= 2); assert.ok(r.strikes > 8); }
    }
    assert.ok(S.done, 'seed ' + seed + ' finished');
    assert.ok(S.shape >= 0 && S.shape <= 100);
  }
});

test('struck cold: nothing for a learner, a crack slips in after', () => {
  const a = R.newWorking(cfg({ level: 1 }), seeded(1)); R.begin(a);
  const ev = R.strike(a); assert.ok(ev.dead); assert.equal(a.rack.length, 20);
  const b = R.newWorking(cfg({ level: 3 }), seeded(1)); R.begin(b);
  R.strike(b); assert.equal(b.rack.length, 21);
});

test('back in the fire every tile returns and the slipped-in go', () => {
  const S = R.newWorking(cfg(), seeded(2)); R.begin(S);
  R.strike(S); R.strike(S);
  assert.ok(S.rack.length > 20);
  const r = R.toggleFire(S);
  assert.ok(r.shuffled); assert.equal(S.rack.length, 20); assert.equal(R.left(S).length, 20); assert.equal(S.heats, 2);
});

test('left in past white it scales', () => {
  const S = R.newWorking(cfg(), seeded(3)); R.begin(S); R.toggleFire(S);
  let scaled = 0; for (let i = 0; i < 80; i++) if (R.tick(S, 0.1).scaled) scaled++;
  assert.ok(scaled >= 1); assert.equal(S.scaled, scaled);
  assert.equal(R.counts(S.rack).GOOD, 10 - scaled);
});

test('found tiles do their tricks', () => {
  for (const id of Object.keys(FOUND)) {
    const S = R.newWorking(cfg({ level: 7, found: [id] }), seeded(5)); R.begin(S);
    S.meter = 70;
    const i = S.rack.findIndex(x => x.f === id); assert.ok(i >= 0, id);
    [S.rack[0], S.rack[i]] = [S.rack[i], S.rack[0]];
    const ev = R.strike(S); assert.equal(ev.k, 'FOUND');
    if (id === 'twin') assert.ok(S.twin);
    if (id === 'warden') assert.ok(S.warden);
    if (id === 'frost') assert.ok(S.frost);
    if (id === 'seer') assert.equal(S.rack.filter(x => x.peek).length, 2);
    if (id === 'hollow') assert.equal(S.rack.length, 21);
  }
});

test('odds rise with the work and never pass their caps', () => {
  const S = R.newWorking(cfg(), seeded(1));
  const a = R.odds(S); S.worked = 30; const b = R.odds(S); S.worked = 500; const c = R.odds(S);
  assert.ok(b.f > a.f && b.r > a.r);
  assert.equal(c.f, 70); assert.equal(c.r, 40);
  assert.ok(Math.abs(a.c + a.f + a.r - 100) < 1e-9);
});

test('a dropped piece is worse, never lost', () => {
  const S = R.newWorking(cfg(), () => 0.99); S.shape = 100; S.cracks = 2;
  const r = R.finish(S, 'dropped');
  assert.equal(r.tier, 0); assert.ok(r.flawed);
  const p = R.makePiece({ patternId: 'falchion', picks: [0, 0, 0], result: r, maker: 'Test', rng: seeded(1), now: 1 });
  assert.ok(p.worth >= 1); assert.equal(p.tier, 'common');
});

test('every pattern and metal makes a card with its tier\'s affixes', () => {
  for (const id of Object.keys(PATTERNS)) {
    const n = R.partOptions(id)[0].opts.length;
    for (let m = 0; m < n; m++) for (let tier = 0; tier < 3; tier++) {
      const result = { tier, flawed: false, worked: 20, strikes: 20, heats: 2, cracks: 0, whiteHeat: true, frost: false };
      const p = R.makePiece({ patternId: id, picks: [m, 0, 0], result, maker: 'Test', rng: seeded(m * 7 + tier), now: 1700000000000 });
      const own = p.affixes.filter(a => a[0] !== 'Silvered').length;
      assert.equal(own, tier, id + ' tier ' + tier);
      assert.ok(p.worth > 0 && p.name && p.stats.length);
      assert.equal(new Set(p.affixes.map(a => a[0])).size, p.affixes.length);
    }
  }
  const common = R.makePiece({ patternId: 'falchion', picks: [0, 0, 0], result: { tier: 0, worked: 0, strikes: 16, heats: 1, cracks: 0 }, maker: 'T', rng: seeded(1), now: 1 });
  const rare = R.makePiece({ patternId: 'falchion', picks: [0, 0, 0], result: { tier: 2, worked: 40, strikes: 30, heats: 2, cracks: 0 }, maker: 'T', rng: seeded(1), now: 1 });
  assert.ok(rare.worth > common.worth * 8);
});

test('practice teaches, MAKE IT does not', () => {
  assert.equal(R.xpFor({ instant: true, tier: 2, cracks: 0 }), 0);
  assert.equal(R.xpFor({ tier: 0, cracks: 1 }), 2);
  assert.equal(R.xpFor({ tier: 2, cracks: 0 }), 5);
  assert.equal(R.xpFor({ dropped: true, tier: 0, cracks: 2 }), 1);
});
