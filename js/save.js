// The save: kept in this browser only. Works without storage (private windows), it just won't last.
const KEY = 'darkclayforge.save';
const fresh = () => ({ v: 1, maker: 'the Maker', trades: {}, found: ['ember'], chosen: [], picks: {}, cards: [], made: 0 });

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
