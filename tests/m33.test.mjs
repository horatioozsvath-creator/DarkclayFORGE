// Milestone 33: two hands to make it. The shield, the crossbow and the lantern, each made at its station with a part forged at the forge;
// a shield in the off hand, a lantern on the road and by the shop's door; the regulars' clues; found patterns among what they order.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as Disc from '../js/discover.js';
import * as Sh from '../js/shop.js';
import * as R from '../js/rules.js';
import * as Run from '../js/runner.js';
import * as St from '../js/staff.js';
import * as Mon from '../js/monsters.js';
import * as Src from '../js/sources.js';
import { PATTERNS, GEAR, FORGED_PARTS, TRY_ROLES, REGULARS, MONSTERS, SUPPLIERS } from '../js/data.js';

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const xpFor = level => { let xp = 0; while (R.levelOf(xp).level < level) xp++; return xp; };
const TWO = { shield: ['stretcher', 'boss'], crossbow: ['bowbench', 'lath'], lantern: ['glass', 'lampframe'] };
const shop = (o = {}) => ({ coins: 500, renown: 0, maker: 'T', cards: [], shelf: [], slots: 4, ledger: [], queue: [], found: ['ember'], staff: [], trades: {},
  stations: ['stretcher', 'bowbench', 'kettle', 'glass'], mats: {}, ...o });

test('each two-station piece: made at its station, with a part forged at the forge for it; forged at once, or bought dear', () => {
  for (const [id, [st, part]] of Object.entries(TWO)) {
    const p = PATTERNS[id];
    assert.equal(p.station, st); assert.ok(p.hidden && /TWO STATIONS/.test(p.hidden.look), id);
    assert.ok(p.parts[1].opts.some(o => o.mat === part), id + ' takes the ' + part);
    assert.deepEqual(p.hidden.try.haft, [part]);
    assert.equal(FORGED_PARTS[part].for, st);
    assert.ok(Disc.fitsRole(st, 'haft', part), part + ' fits the second choice at the ' + st);
    assert.deepEqual(Src.sourcesOf(part).map(x => x.kind), ['forged', 'sold']);
    assert.ok(SUPPLIERS.some(sp => sp.lines.includes(part)));
    const s = { mats: { iron: 2 } }; assert.ok(Sh.forgePart(s, part)); assert.equal(s.mats[part], 1); assert.equal(s.mats.iron, 1);
  }
  for (const f of Object.values(FORGED_PARTS)) assert.ok(TRY_ROLES[f.for], 'every forged part names a station');
});

test('found by trying: the forged part in the second choice; another forged part is near; not before the trade', () => {
  for (const [id, [st]] of Object.entries(TWO)) {
    const t = PATTERNS[id].hidden.try, picks = { head: t.head[0], haft: t.haft[0], binding: t.binding[0] };
    const s = shop({ mats: { [picks.head]: 2, [picks.haft]: 2, [picks.binding]: 2 } });
    assert.equal(Disc.tryIt(s, st, picks, seeded(1), 1).result, 'notyet', id);
    s.trades[PATTERNS[id].hidden.gate.trades[0]] = { xp: xpFor(PATTERNS[id].hidden.gate.level) };
    const r = Disc.tryIt(s, st, picks, seeded(1), 2);
    assert.equal(r.result, 'found', id); assert.ok(Sh.knows(s, id)); assert.equal(s.cards[0].pattern, id);
  }
  const s = shop({ trades: { jerkin: { xp: xpFor(3) } }, mats: { deer: 1, ferrule: 1, wrap: 1 } });
  const r = Disc.tryIt(s, 'stretcher', { head: 'deer', haft: 'ferrule', binding: 'wrap' }, seeded(2), 1);
  assert.equal(r.result, 'close'); assert.equal(r.pattern, 'shield'); assert.deepEqual(r.clues.map(c => c.g), ['right', 'near', 'right']);
  assert.match(r.clues[1].line, /forged at the forge/);
});

test('a shield in the off hand guards; a lantern carried takes the road\'s hurt down, never past half', () => {
  assert.ok(GEAR.slots.offhand.includes('shield') && GEAR.slots.light.includes('lantern') && GEAR.slots.weapon.includes('crossbow'));
  const p = { id: 'r', role: 'runner', name: 'Pell', xp: 0, gear: {} }, bare = Run.strength(p).guard;
  p.gear.offhand = { pattern: 'shield', tier: 'fine' }; assert.equal(Run.strength(p).guard, bare + GEAR.power.fine);
  assert.equal(Run.lightCut(p), 1);
  p.gear.light = { pattern: 'lantern', tier: 'common' }; assert.ok(Math.abs(Run.lightCut(p) - 0.9) < 1e-9);
  p.gear.light = { pattern: 'lantern', tier: 'mythic' }; assert.equal(Run.lightCut(p), 1 - GEAR.lightMax);
  const s = { coins: 0, staff: [], renown: 0 }, now = 1e12, lit = Run.risk(s, p, 'below', now).hurt;
  delete p.gear.light; assert.ok(Run.risk(s, p, 'below', now).hurt > lit);
});

test('a lantern hung by the door among the wards: the shop kept an hour longer while you\'re away', () => {
  assert.ok(MONSTERS.wards.pieces.includes('lantern'));
  const s = shop({ cards: [{ id: 'l1', pattern: 'lantern', tier: 'common', name: 'Lantern', worth: 50 }] }), before = St.awayCap(s);
  assert.ok(Mon.canWard(s.cards[0])); assert.ok(Mon.addWard(s, 'l1').ok);
  assert.equal(St.awayCap(s), before + MONSTERS.wards.lanternH); assert.equal(s.cards.length, 0, 'off the shelves while it hangs');
  s.cards.push({ id: 'l2', pattern: 'lantern', tier: 'rare', name: 'Lantern', worth: 90 }); assert.ok(Mon.addWard(s, 'l2').ok);
  assert.equal(St.awayCap(s), before + MONSTERS.wards.lanternH, 'a second lantern adds no more hours');
});

test('the regulars: a word now and then about a pattern still to find at a station you have, into the book once', () => {
  const bram = REGULARS.find(r => /Bram/.test(r.who)), marrow = REGULARS.find(r => /Marrow/.test(r.who));
  assert.ok(bram.clues.crossbow && marrow.clues.poultice, 'the plan\'s own: Bram on a crossbow, Marrow on a poultice');
  for (const r of REGULARS) for (const id of Object.keys(r.clues || {})) assert.ok(PATTERNS[id].hidden, r.who + ': ' + id);
  const none = shop({ stations: [] });
  for (let i = 0; i < 20; i++) assert.equal(Sh.regularClue(none, marrow, seeded(i), 1), null, 'no kettle: nothing from Marrow');
  const s = shop(), c = Sh.regularClue(s, bram, seeded(3), 5);
  assert.ok(c && bram.clues[c.pattern] === c.line); assert.equal(Disc.bookOf(s).clues[0].who, bram.who);
  const n = Disc.bookOf(s).clues.length; Sh.regularClue(s, bram, seeded(3), 6);
  assert.ok(Disc.bookOf(s).clues.length <= n + 1);
  for (let i = 0; i < 10; i++) Sh.regularClue(s, bram, seeded(i), 7);
  assert.equal(new Set(Disc.bookOf(s).clues.map(x => x.line)).size, Disc.bookOf(s).clues.length, 'never the same word twice');
  Disc.bookOf(s).found = Object.keys(bram.clues); assert.equal(Sh.regularClue(s, bram, seeded(1), 8), null, 'all found: nothing to tell');
});

test('the regulars order found patterns once they\'re known, and not before; an order sometimes carries a clue', () => {
  const s = shop({ clock: 0 }); let clues = 0;
  for (let i = 0; i < 300; i++) {
    s.order = null; const e = Sh.postOrder(s, seeded(i), i);
    if (s.order) assert.ok(!PATTERNS[s.order.pattern].hidden, 'nothing still to find: ' + s.order.pattern);
    if (e && e.clue) clues++;
  }
  assert.ok(clues > 20, clues + ' orders with a clue');
  Disc.bookOf(s).found = ['shield', 'crossbow', 'lantern'];
  const asked = new Set();
  for (let i = 0; i < 600; i++) { s.order = null; Sh.postOrder(s, seeded(1000 + i), i); if (s.order) asked.add(s.order.pattern); }
  assert.ok(['shield', 'crossbow', 'lantern'].some(id => asked.has(id)), [...asked].join(' '));
});
