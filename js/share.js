// A card as a link: the piece's own data packed into the address after #card=. Nothing is sent anywhere.
// A link comes from someone else's browser: everything in it is checked and rebuilt before it's shown.
import { TIERS, PATTERNS } from './data.js?v=16';
import { ART } from './card.js?v=16';

const FIELDS = ['tier', 'name', 'kind', 'art', 'tint', 'dice', 'stats', 'affixes', 'made', 'lore', 'worth', 'pattern', 'maker'];
function toB64url(bytes) { let s = ''; bytes.forEach(b => { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function fromB64url(t) { const s = atob(t.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(s, c => c.charCodeAt(0)); }
export function encodeCard(card) {
  const o = {}; FIELDS.forEach(k => { if (card[k] != null) o[k] = card[k]; });
  return toB64url(new TextEncoder().encode(JSON.stringify(o)));
}
const str = (v, n) => typeof v === 'string' && v.length <= n ? v : null;
// the card, rebuilt from checked fields, or null when the link won't read
export function decodeCard(t) {
  let o;
  try { if (typeof t !== 'string' || t.length > 6000) return null; o = JSON.parse(new TextDecoder().decode(fromB64url(t))); } catch (e) { return null; }
  if (!o || typeof o !== 'object') return null;
  if (!TIERS.some(x => x.id === o.tier) || !ART[o.art] || !PATTERNS[o.pattern]) return null;
  const name = str(o.name, 60), kind = str(o.kind, 40), lore = str(o.lore, 200), dice = o.dice == null ? '' : str(o.dice, 12);
  const tint = typeof o.tint === 'string' && /^#[0-9a-f]{6}$/i.test(o.tint) ? o.tint : null;
  const worth = Number.isFinite(o.worth) && o.worth >= 0 && o.worth < 1e6 ? Math.round(o.worth) : null;
  if (name == null || kind == null || lore == null || dice == null || !tint || worth == null) return null;
  const pair = a => Array.isArray(a) && a.length === 2 && str(a[0], 40) != null && str(a[1], 120) != null;
  const stats = Array.isArray(o.stats) && o.stats.length <= 8 && o.stats.every(r => Array.isArray(r) && r.length === 3 && str(r[0], 20) != null && str(String(r[1]), 20) != null && (r[2] === null || (Number.isFinite(r[2]) && r[2] >= 0 && r[2] <= 1)))
    ? o.stats.map(r => [r[0], String(r[1]), r[2]]) : null;
  const affixes = Array.isArray(o.affixes) && o.affixes.length <= 6 && o.affixes.every(pair) ? o.affixes.map(a => [a[0], a[1]]) : null;
  const made = Array.isArray(o.made) && o.made.length <= 10 && o.made.every(m => str(m, 80) != null) ? o.made.slice() : null;
  if (!stats || !affixes || !made) return null;
  return { id: 'shared', tier: o.tier, name, kind, art: o.art, tint, dice, stats, affixes, made, lore, worth, pattern: o.pattern, maker: str(o.maker, 40) || '', shared: true };
}
export const linkFor = (card, base) => base.split('#')[0] + '#card=' + encodeCard(card);
