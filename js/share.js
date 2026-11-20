// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// A card as a link: the piece's own data packed into the address after #card=. Nothing is sent anywhere.
// A link comes from someone else's browser: everything in it is checked and rebuilt before it's shown.
import { TIERS, PATTERNS, MARKS } from './data.js?v=80';
import { ART } from './card.js?v=80';

const FIELDS = ['tier', 'name', 'kind', 'art', 'tint', 'dice', 'stats', 'affixes', 'made', 'lore', 'worth', 'pattern', 'maker', 'power', 'powers', 'mark', 'gilded', 'flawless', 'grown'];
function toB64url(bytes) { let s = ''; bytes.forEach(b => { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function fromB64url(t) { const s = atob(t.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(s, c => c.charCodeAt(0)); }
// the fields a card carries off this browser (no ids, no making record)
export function cardFields(card) { const o = {}; FIELDS.forEach(k => { if (card[k] != null) o[k] = card[k]; }); return o; }
export function encodeCard(card) { return toB64url(new TextEncoder().encode(JSON.stringify(cardFields(card)))); }

// ---------- a bigger thing as a link (a whole shop): JSON, compressed with the browser's own deflate, base64url ----------
const MAX_LINK = 12000, MAX_JSON = 200000;   // a link longer than any real shop's, or one that swells past this, won't open
async function through(bytes, stream) {
  const reader = new Blob([bytes]).stream().pipeThrough(stream).getReader(), parts = [];
  let n = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; n += value.length; if (n > MAX_JSON) { reader.cancel(); throw new Error('too big'); } parts.push(value); }
  const out = new Uint8Array(n); let at = 0; parts.forEach(p => { out.set(p, at); at += p.length; });
  return out;
}
export async function packLink(obj) { return toB64url(await through(new TextEncoder().encode(JSON.stringify(obj)), new CompressionStream('deflate-raw'))); }
export async function unpackLink(t) {
  try {
    if (typeof t !== 'string' || !t || t.length > MAX_LINK || !/^[A-Za-z0-9_-]+$/.test(t)) return null;
    return JSON.parse(new TextDecoder().decode(await through(fromB64url(t), new DecompressionStream('deflate-raw'))));
  } catch (e) { return null; }
}
const str = (v, n) => typeof v === 'string' && v.length <= n ? v : null;
// the card, rebuilt from checked fields, or null when the link won't read
export function decodeCard(t) {
  let o;
  try { if (typeof t !== 'string' || t.length > 6000) return null; o = JSON.parse(new TextDecoder().decode(fromB64url(t))); } catch (e) { return null; }
  return checkCard(o);
}
// a card's fields from someone else's link, checked and rebuilt, or null
export function checkCard(o) {
  if (!o || typeof o !== 'object') return null;
  if (!TIERS.some(x => x.id === o.tier) || !ART[o.art] || !PATTERNS[o.pattern]) return null;
  const name = str(o.name, 60), kind = str(o.kind, 40), lore = str(o.lore, 200), dice = o.dice == null ? '' : str(o.dice, 12);
  const tint = typeof o.tint === 'string' && /^#[0-9a-f]{6}$/i.test(o.tint) ? o.tint : null;
  const worth = Number.isFinite(o.worth) && o.worth >= 0 && o.worth < 1e6 ? Math.round(o.worth) : null;
  if (name == null || kind == null || lore == null || dice == null || !tint || worth == null) return null;
  const pair = a => Array.isArray(a) && a.length === 2 && str(a[0], 40) != null && str(a[1], 120) != null;
  const stats = Array.isArray(o.stats) && o.stats.length <= 8 && o.stats.every(r => Array.isArray(r) && r.length === 3 && str(r[0], 20) != null && str(String(r[1]), 20) != null && (r[2] === null || (Number.isFinite(r[2]) && r[2] >= 0 && r[2] <= 1)))
    ? o.stats.map(r => [r[0], String(r[1]), r[2]]) : null;
  const affixes = Array.isArray(o.affixes) && o.affixes.length <= 8 && o.affixes.every(pair) ? o.affixes.map(a => [a[0], a[1]]) : null;
  const made = Array.isArray(o.made) && o.made.length <= 10 && o.made.every(m => str(m, 80) != null) ? o.made.slice() : null;
  if (!stats || !affixes || !made) return null;
  const power = o.power == null ? undefined : pair(o.power) ? [o.power[0], o.power[1]] : null;
  if (power === null) return null;
  const powers = o.powers == null ? undefined : Array.isArray(o.powers) && o.powers.length <= 3 && o.powers.every(pair) ? o.powers.map(w => [w[0], w[1]]) : null;
  if (powers === null) return null;
  // its mark, gilded affixes and FLAWLESS (milestone 49): only names the game knows, only affixes it carries
  const luck = {};
  if (MARKS.kinds[o.mark] && Object.prototype.hasOwnProperty.call(MARKS.kinds, o.mark)) luck.mark = o.mark;
  if (Array.isArray(o.gilded) && o.gilded.length <= 8 && o.gilded.every(w => affixes.some(a => a[0] === w))) { if (o.gilded.length) luck.gilded = o.gilded.slice(); if (o.flawless === true && o.gilded.length >= 3) luck.flawless = true; }
  // grown (milestone 51): its stage, how far it's been carried, and by whom; from the grow-bed (milestone 52), whose bed and the days tended
  const g = o.grown;
  if (g && typeof g === 'object' && Number.isInteger(g.stage) && g.stage >= 1 && g.stage <= 4 && Number.isFinite(g.uses) && g.uses >= 0 && g.uses < 1e5 && (g.by == null || str(g.by, 40) != null)
    && (g.bed == null || (str(g.bed, 40) != null && Number.isInteger(g.tended) && g.tended >= 0 && g.tended <= 3)))
    luck.grown = { stage: g.stage, uses: Math.floor(g.uses), ...(g.by != null ? { by: g.by } : {}), ...(g.bed != null ? { bed: g.bed, tended: g.tended } : {}) };
  return { ...luck, id: 'shared', tier: o.tier, name, kind, art: o.art, tint, dice, stats, affixes, made, lore, worth, pattern: o.pattern, maker: str(o.maker, 40) || '', shared: true, ...(power ? { power } : {}), ...(powers ? { powers } : {}) };
}
export const linkFor = (card, base) => base.split('#')[0] + '#card=' + encodeCard(card);
