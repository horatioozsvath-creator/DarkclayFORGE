// The save: kept in this browser only. Works without storage (private windows), it just won't last.
const KEY = 'darkclayforge.save';
// v1 still: a milestone 1 save reads as it is, the shop's fields filled in from here (its pieces go in the back)
const fresh = () => ({ v: 1, maker: 'the Maker', trades: {}, found: ['ember'], chosen: [], picks: {}, cards: [], made: 0,
  coins: 60, mats: { iron: 5, bronze: 2, cord: 3, wrap: 1, ash: 1, wool: 1, strap: 1 }, slots: 4, shelf: [], ledger: [], sold: 0, earned: 0, shopNext: 6, curve: 2 });

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = JSON.parse(raw); if (s && s.v === 1) return { ...fresh(), curve: 1, ...s }; }
  } catch (e) { /* no storage, or a save that won't read: start fresh */ }
  return fresh();
}
export function store(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; }
}

// ---------- the save as a code: a backup to copy somewhere or keep as a file, loaded on any browser ----------
// DCF1.<check>.<the save as JSON, base64url>. Checked before anything is replaced: the prefix, the check, and the shape of a save.
const PREFIX = 'DCF1';
const check = t => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
function b64(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
const unb64 = t => Uint8Array.from(atob(t.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
export function toCode(s) {
  const body = b64(new TextEncoder().encode(JSON.stringify(s)));
  return PREFIX + '.' + check(body) + '.' + body;
}
// the save in a code, or null when it won't read (not a code, a damaged one, or not a save)
export function fromCode(text) {
  try {
    const parts = String(text || '').replace(/\s+/g, '').split('.');
    if (parts.length !== 3 || parts[0] !== PREFIX || check(parts[2]) !== parts[1]) return null;
    const s = JSON.parse(new TextDecoder().decode(unb64(parts[2])));
    const obj = x => x && typeof x === 'object' && !Array.isArray(x);
    if (!obj(s) || s.v !== 1 || typeof s.coins !== 'number' || !Array.isArray(s.cards) || !obj(s.mats) || !obj(s.trades)) return null;
    return { ...fresh(), ...s };
  } catch (e) { return null; }
}
