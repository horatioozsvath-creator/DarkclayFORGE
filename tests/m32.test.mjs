// Milestone 32: finds at every station. The stretcher's cloak, satchel and sling; the bench's club and wand; the kettle's poultice and
// ink; the glass's mirror and beads. The town board's clue, a satchel that brings more home, a poultice that halves a hurt.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as Disc from '../js/discover.js';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import * as Run from '../js/runner.js';
import { PATTERNS, GEAR, MATS, TRY_ROLES, TRY_LINE, METALS, MONSTERS, CUSTOMERS } from '../js/data.js';
import { ART } from '../js/card.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const xpFor = level => { let xp = 0; while (R.levelOf(xp).level < level) xp++; return xp; };
const HIDDEN = Object.keys(PATTERNS).filter(id => PATTERNS[id].hidden);
const NEW = { stretcher: ['cloak', 'satchel', 'sling'], bowbench: ['club', 'wand'], kettle: ['poultice', 'ink'], glass: ['mirror', 'beads'] };
const shop = (o = {}) => ({ coins: 500, renown: 0, maker: 'T', cards: [], shelf: [], slots: 4, ledger: [], queue: [], found: ['ember'], staff: [], trades: {},
  stations: ['stretcher', 'bowbench', 'kettle', 'glass'], mats: {}, ...o });

test('every hidden pattern: art, lore, a recipe that fits its station\'s roles and its own parts, a gate at its station, words for the board', () => {
  for (const id of HIDDEN) {
    const p = PATTERNS[id], st = p.station || 'forge', roles = TRY_ROLES[st], opts = R.partOptions(id);
    assert.ok(ART[p.art] && p.lore.length === 4 && p.hidden.asks.length >= 2 && p.hidden.board, id);
    assert.equal(roles.length, 3, st); assert.ok(TRY_LINE[st], st);
    roles.forEach((r, i) => {
      assert.ok(p.hidden.try[r.id] && p.hidden.try[r.id].length, id + ': ' + r.id);
      for (const m of p.hidden.try[r.id]) {
        assert.ok(MATS[m], id + ': ' + m);
        assert.ok(Disc.fitsRole(st, r.id, m), id + ': ' + m + ' can be chosen for ' + r.word);
        assert.ok(opts[i].opts.some(o => (o.mat || o.id) === m), id + ': ' + m + ' is one of part ' + i + '\'s options');
      }
    });
    for (const m of p.hidden.try[roles[0].id]) assert.ok(METALS[m], id + ': the first is the station\'s own material, ' + m);
    if (p.hidden.gate) for (const t of p.hidden.gate.trades) assert.equal(PATTERNS[t].station || 'forge', st, id + ' gated on ' + t);
  }
  // no two at a station share a full recipe
  for (const a of HIDDEN) for (const b of HIDDEN) if (a !== b && PATTERNS[a].station === PATTERNS[b].station) {
    const t = PATTERNS[a].hidden.try, picks = { head: t.head[0], haft: t.haft[0], binding: t.binding[0] };
    assert.ok(!Disc.grade(b, picks).every(g => g === 'right'), a + ' vs ' + b);
  }
  for (const [st, ids] of Object.entries(NEW)) assert.deepEqual(Disc.hiddenAt(st).sort(), ids.slice().sort());
});

test('a found try at each station, with its gate met: the pattern, a Common one (a batch at the kettle)', () => {
  for (const [st, ids] of Object.entries(NEW)) for (const id of ids) {
    const p = PATTERNS[id], t = p.hidden.try, picks = { head: t.head[0], haft: t.haft[0], binding: t.binding[0] };
    const s = shop({ mats: { [picks.head]: 2, [picks.haft]: 2, [picks.binding]: 2 } });
    if (p.hidden.gate) {
      assert.equal(Disc.tryIt(s, st, picks, seeded(1), 1).result, 'notyet', id);
      s.trades[p.hidden.gate.trades[0]] = { xp: xpFor(p.hidden.gate.level) };
    }
    const r = Disc.tryIt(s, st, picks, seeded(1), 2);
    assert.equal(r.result, 'found', id); assert.equal(r.pattern, id); assert.ok(Sh.knows(s, id));
    assert.equal(s.cards[0].pattern, id); assert.equal(s.cards[0].tier, 'common');
    if (p.batch) assert.equal(s.cards[0].count, p.batch, id + ': a batch');
    assert.equal(s.mats[picks.head], 1, 'one of each spent');
  }
});

test('the station\'s own material only in its first role; a near miss by family; a close try with three clues', () => {
  assert.ok(Disc.fitsRole('stretcher', 'head', 'goat')); assert.ok(!Disc.fitsRole('stretcher', 'head', 'strap'));
  assert.ok(Disc.fitsRole('kettle', 'binding', 'honey')); assert.ok(!Disc.fitsRole('kettle', 'binding', 'iron'));
  assert.ok(Disc.fitsRole('glass', 'binding', 'silver')); assert.ok(Disc.fitsRole('bowbench', 'haft', 'gem'));
  const s = shop({ trades: { jerkin: { xp: xpFor(3) } }, mats: { deer: 2, wool: 2, gut: 2 } });
  const r = Disc.tryIt(s, 'stretcher', { head: 'deer', haft: 'wool', binding: 'gut' }, seeded(2), 1);
  assert.equal(r.result, 'close'); assert.equal(r.pattern, 'cloak'); assert.deepEqual(r.clues.map(c => c.g), ['near', 'right', 'near']);
  assert.match(r.clues[0].line, /goat/);
});

test('the town board: a notice a day for a pattern still to find at a station you have, into the book once', () => {
  const s = shop({ stations: [] });
  for (let d = 0; d < 30; d++) { const c = Disc.boardClue(s, d); assert.ok(c && (PATTERNS[c.pattern].station || 'forge') === 'forge', 'forge only, without the others'); }
  const t = shop(), seen = new Set();
  for (let d = 0; d < 60; d++) { const c = Disc.boardClue(t, d); seen.add(c.pattern); assert.deepEqual(Disc.boardClue(t, d), c, 'the same all day'); }
  assert.ok(seen.size >= 8, 'it moves round them: ' + seen.size);
  const c = Disc.boardClue(t, 3); assert.ok(Disc.noteClue(t, c, 'the town board', 1)); assert.ok(!Disc.noteClue(t, c, 'the town board', 2));
  Disc.bookOf(t).found = HIDDEN.slice(); assert.equal(Disc.boardClue(t, 3), null);
});

test('runner gear: a satchel in the pack brings more home; a poultice halves a hurt and the healer\'s bill; a mirror wards', () => {
  assert.ok(GEAR.slots.pack.includes('satchel') && GEAR.slots.body.includes('cloak') && GEAR.slots.weapon.includes('sling') && GEAR.slots.weapon.includes('club') && GEAR.slots.weapon.includes('wand') && GEAR.slots.ring.includes('beads'));
  assert.ok(GEAR.potions.includes('poultice')); assert.ok(MONSTERS.wards.pieces.includes('mirror'));
  const p = { id: 'r', role: 'runner', name: 'Pell', xp: 0, gear: {} };
  assert.equal(Run.packBonus(p), 1);
  p.gear.pack = { pattern: 'satchel', tier: 'fine' }; assert.ok(Math.abs(Run.packBonus(p) - (1 + 2 * GEAR.pack)) < 1e-9);
  const hurt = withPoultice => {
    const s = { coins: 1000, renown: 0, staff: [] }, q = { id: 'q', role: 'runner', name: 'Q', xp: 0, gear: {}, potions: withPoultice ? [{ pattern: 'poultice', name: 'Poultice' }] : [] };
    let out; for (let i = 0; i < 2000; i++) { out = Run.road(s, q, 'below', seeded(i), 1e12); if (out.hurt) break; }
    return out;
  };
  const a = hurt(false), b = hurt(true);
  assert.ok(a.hurt && b.hurt && b.poultice && !a.poultice);
  assert.ok(b.bill < a.bill); assert.deepEqual(b.used, ['Poultice']);
});

test('folk want the new things once they\'re known, and not before', () => {
  const wanted = new Set(CUSTOMERS.flatMap(c => c.wants));
  for (const ids of Object.values(NEW)) for (const id of ids) assert.ok(wanted.has(id), id + ' is wanted by someone');
  const s = shop();
  for (let i = 0; i < 300; i++) { const c = Sh.richer(s, { type: 'traveller', who: 'x', want: 'satchel', purse: 100, mood: 'EAGER', least: 0 }, seeded(i)); assert.notEqual(c.want, 'satchel'); }
});
