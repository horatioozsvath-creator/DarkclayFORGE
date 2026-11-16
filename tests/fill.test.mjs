import test from 'node:test';
import assert from 'node:assert/strict';
const Sh = await import('../js/shop.js');

const card = (id, worth, extra = {}) => ({ id, worth, pattern: 'dagger', tier: 'common', ...extra });
const base = (cards, slots = 3) => ({ cards, slots, shelf: Array(slots).fill(null), wall: [], hall: [], made: 1, blueprints: [], relicsMade: [], trades: {} });

test('fill the shelves: empty places only, best first, at FAIR; full shelves stop it', () => {
  const s = base([card('a', 10), card('b', 50), card('c', 30), card('d', 20)]);
  s.shelf[1] = { id: 'd', tag: 'dear' };
  const put = Sh.fillShelf(s);
  assert.deepEqual(put.map(c => c.id), ['b', 'c']);
  assert.deepEqual(s.shelf.map(e => e && e.id), ['b', 'd', 'c']);
  assert.equal(s.shelf[0].tag, 'fair'); assert.equal(s.shelf[1].tag, 'dear', 'what was up stays as it was');
  assert.deepEqual(Sh.fillShelf(s), [], 'nothing more to fill');
});
test('fill the shelves leaves Relics, Mythics, the wall\'s pieces and a new player\'s flyer copy alone', () => {
  const s = base([card('r', 900, { tier: 'relic' }), card('m', 2000, { tier: 'mythic' }), card('w', 80), card('f', 70, { sample: true }), card('p', 5)]);
  s.wall = ['w']; s.made = 0;
  assert.deepEqual(Sh.fillShelf(s, 'cheap').map(c => c.id), ['p']);
  assert.equal(s.shelf[0].tag, 'cheap');
  assert.ok(Sh.inBack(s).some(c => c.id === 'r') && Sh.inBack(s).some(c => c.id === 'm'));
});
