import test from 'node:test';
import assert from 'node:assert/strict';

// a localStorage for node
const mem = new Map();
globalThis.localStorage = { getItem: k => mem.has(k) ? mem.get(k) : null, setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
const S = await import('../js/save.js');

test('three slots: the old save is slot 1; each slot keeps its own game; an empty slot starts fresh', () => {
  mem.set('darkclayforge.save', JSON.stringify({ v: 1, maker: 'Old Hand', coins: 999, cards: [], mats: {}, trades: {} }));
  assert.equal(S.activeSlot(), 1);
  assert.equal(S.load().maker, 'Old Hand', 'a save from before slots is slot 1');
  S.setActiveSlot(2); const two = S.load(); assert.equal(two.maker, 'the Maker'); assert.equal(two.coins, 60);
  two.maker = 'Second'; S.store(two);
  assert.equal(JSON.parse(mem.get('darkclayforge.save')).maker, 'Old Hand', 'slot 1 untouched');
  const peek = S.peekSlots(); assert.equal(peek.length, 3);
  assert.equal(peek[0].maker, 'Old Hand'); assert.equal(peek[1].maker, 'Second'); assert.equal(peek[2], null);
  S.setActiveSlot(1); assert.equal(S.load().maker, 'Old Hand');
  assert.ok(S.clearSlot(2)); assert.equal(S.peekSlots()[1], null);
  S.setActiveSlot(9); assert.equal(S.activeSlot(), 1, 'a slot that isn\'t one: the first');
});
