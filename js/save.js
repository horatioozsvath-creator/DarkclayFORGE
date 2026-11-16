// The save: kept in this browser only. Works without storage (private windows), it just won't last.
const KEY = 'darkclayforge.save';
// v1 still: a milestone 1 save reads as it is, the shop's fields filled in from here (its pieces go in the back)
const fresh = () => ({ v: 1, maker: 'the Maker', trades: {}, found: ['ember'], chosen: [], picks: {}, cards: [], made: 0,
  coins: 60, mats: { iron: 5, bronze: 2, cord: 3, wrap: 1, ash: 1, wool: 1, strap: 1 }, slots: 4, shelf: [], ledger: [], sold: 0, earned: 0, shopNext: 6 });

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = JSON.parse(raw); if (s && s.v === 1) return { ...fresh(), ...s }; }
  } catch (e) { /* no storage, or a save that won't read: start fresh */ }
  return fresh();
}
export function store(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; }
}
