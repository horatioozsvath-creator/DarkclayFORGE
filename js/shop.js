// The shop's rules, with no page access: materials and suppliers, the shelf and its tags, customers and sales.
// Every function that needs chance takes rng: () => [0,1). Time comes in as plain numbers so the same calls can run
// a second, a minute or (milestone 4) a night away.
import { PATTERNS, MATS, SUPPLIERS, TAGS, SLOT_COSTS, START_SLOTS, CUSTOMERS, MOODS, MOOD_ODDS, TIERS } from './data.js?v=2';
import { chosenParts } from './rules.js?v=2';

const TIER_N = Object.fromEntries(TIERS.map((t, i) => [t.id, i]));
export const LEDGER_MAX = 30;

// ---------- recipes ----------
// what a pattern with these parts takes: the metal's bars, and one of each named material
export function recipe(patternId, picks) {
  const parts = chosenParts(patternId, picks), need = {};
  need[parts[0].id] = PATTERNS[patternId].bars;
  parts.slice(1).forEach(o => { if (o.mat) need[o.mat] = (need[o.mat] || 0) + 1; });
  return Object.entries(need).map(([mat, n]) => ({ mat, n }));
}
export const short = (mats, rec) => rec.filter(r => (mats[r.mat] || 0) < r.n).map(r => ({ ...r, have: mats[r.mat] || 0 }));
export const canMake = (mats, rec) => short(mats, rec).length === 0;
export function takeMats(save, rec) {
  if (!canMake(save.mats, rec)) return false;
  rec.forEach(r => { save.mats[r.mat] -= r.n; if (!save.mats[r.mat]) delete save.mats[r.mat]; });
  return true;
}
export const recipeCost = (rec, hour) => rec.reduce((c, r) => c + priceOf(r.mat, hour) * r.n, 0);

// ---------- suppliers: prices drift on the hour ----------
export const hourOf = ms => Math.floor(ms / 3600000);
function hash(a, b) {   // a small, steady hash of an hour and a name: the same on every device
  let h = 2166136261 ^ a;
  for (let i = 0; i < b.length; i++) { h ^= b.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
export const drift = (hour, id) => 0.85 + 0.35 * hash(hour, id);
export const priceOf = (id, hour) => Math.max(1, Math.round(MATS[id].price * drift(hour, id)));
// what a supplier has this hour: its staple lines, and a pedlar's pick of rare ones
export function linesOf(supplier, hour) {
  const rare = (supplier.rare || []).slice().sort((a, b) => hash(hour, supplier.id + a) - hash(hour, supplier.id + b)).slice(0, supplier.pick || 99);
  return supplier.lines.concat(rare);
}
export const sells = (id, hour) => SUPPLIERS.some(s => linesOf(s, hour).includes(id));
export function buy(save, id, n, hour) {
  if (!sells(id, hour)) return false;
  const cost = priceOf(id, hour) * n;
  if (save.coins < cost) return false;
  save.coins -= cost; save.mats[id] = (save.mats[id] || 0) + n;
  return true;
}

// ---------- the shelf ----------
export function fixShelf(save) {
  save.slots = Math.max(START_SLOTS, Math.min(START_SLOTS + SLOT_COSTS.length, save.slots || START_SLOTS));
  const ids = new Set(save.cards.map(c => c.id));
  const shelf = (save.shelf || []).slice(0, save.slots).map(e => e && ids.has(e.id) && TAGS[e.tag] ? e : null);
  while (shelf.length < save.slots) shelf.push(null);
  save.shelf = shelf;
}
export const priceAt = (card, tag) => Math.max(1, Math.round(card.worth * TAGS[tag].mult));
export const onShelf = (save, id) => save.shelf.findIndex(e => e && e.id === id);
export const inBack = save => save.cards.filter(c => onShelf(save, c.id) < 0);
export function place(save, id, slot, tag = 'fair') {
  if (slot == null) slot = save.shelf.findIndex(e => !e);
  if (slot < 0 || slot >= save.slots || save.shelf[slot] || onShelf(save, id) >= 0 || !save.cards.some(c => c.id === id)) return -1;
  save.shelf[slot] = { id, tag };
  return slot;
}
export function takeDown(save, slot) { save.shelf[slot] = null; }
export function setTag(save, slot, tag) { if (save.shelf[slot] && TAGS[tag]) save.shelf[slot].tag = tag; }
export const nextSlotCost = save => SLOT_COSTS[save.slots - START_SLOTS];
export function buySlot(save) {
  const c = nextSlotCost(save);
  if (c == null || save.coins < c) return false;
  save.coins -= c; save.slots++; save.shelf.push(null);
  return true;
}

// ---------- customers ----------
const pick = (list, rng) => list[Math.floor(rng() * list.length)];
function weighted(items, w, rng) { let r = rng() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < items.length; i++) { r -= w[i]; if (r < 0) return items[i]; } return items[items.length - 1]; }
export function newCustomer(rng) {
  const t = weighted(CUSTOMERS, CUSTOMERS.map(c => c.weight), rng);
  return { type: t.id, who: pick(t.names, rng), want: pick(t.wants, rng), purse: Math.round(t.purse[0] + rng() * (t.purse[1] - t.purse[0])),
    mood: weighted(MOODS, t.moods, rng), least: t.least || 0, fig: t.fig };
}
export const wants = (want, card) => want === 'any' || want === card.pattern || PATTERNS[card.pattern].want === want;
export function wantWord(want) {
  if (PATTERNS[want]) return 'a ' + PATTERNS[want].name.toLowerCase();
  return { weapon: 'a weapon', helm: 'a helm', ring: 'a ring', any: 'something good' }[want];
}
export const takeOdds = (mood, tag) => mood === 'PINCHED' && tag === 'dear' ? 0 : Math.min(0.95, MOOD_ODDS[mood] * TAGS[tag].odds);
const LINES = {
  sold: { EAGER: 'Just the thing. Wrap it up.', WARY: 'It\'ll do. It had better.', PINCHED: 'It\'s all I have, but it\'s mine now.' },
  passed: { EAGER: 'Not today. Maybe next time.', WARY: 'I\'ve bought ones that bent. I\'ll wait.', PINCHED: 'More than I can part with.' },
};

// One customer comes in, looks at the shelf and buys or goes. Returns the ledger entry.
export function visit(save, rng, now, c = newCustomer(rng)) {
  const shown = save.shelf.map((e, slot) => e && { slot, tag: e.tag, card: save.cards.find(x => x.id === e.id) }).filter(Boolean)
    .filter(e => wants(c.want, e.card) && TIER_N[e.card.tier] >= c.least);
  const afford = shown.filter(e => priceAt(e.card, e.tag) <= c.purse)
    .sort((a, b) => TIER_N[b.card.tier] - TIER_N[a.card.tier] || priceAt(b.card, b.tag) - priceAt(a.card, a.tag));
  const entry = { at: now, who: c.who, type: c.type, fig: c.fig, mood: c.mood, want: c.want, purse: c.purse, sold: null, line: '' };
  if (!shown.length) entry.line = 'Nothing on the shelf for them' + (c.least ? ' (Fine or better only).' : '.');
  else if (!afford.length) { const e = shown.sort((a, b) => priceAt(a.card, a.tag) - priceAt(b.card, b.tag))[0]; entry.line = 'Looked at the ' + e.card.name + ' at ' + priceAt(e.card, e.tag) + ' c, but carried ' + c.purse + '.'; entry.near = e.card.id; }
  else {
    const e = afford[0], price = priceAt(e.card, e.tag);
    if (rng() < takeOdds(c.mood, e.tag)) {
      save.coins += price; save.sold = (save.sold || 0) + 1; save.earned = (save.earned || 0) + price;
      save.cards = save.cards.filter(x => x.id !== e.card.id); save.shelf[e.slot] = null;
      entry.sold = { name: e.card.name, tier: e.card.tier, price, tag: e.tag, id: e.card.id };
      entry.line = '"' + LINES.sold[c.mood] + '"';
    } else { entry.line = 'Weighed the ' + e.card.name + ' at ' + price + ' c. "' + LINES.passed[c.mood] + '"'; entry.near = e.card.id; }
  }
  save.ledger = [entry].concat(save.ledger || []).slice(0, LEDGER_MAX);
  return entry;
}
export const gap = rng => 18 + rng() * 22;   // seconds between customers
// The shop's clock: dt seconds pass, and whoever comes in comes in. Returns the visits, oldest first.
export function shopStep(save, dt, rng, now) {
  const out = [];
  if (save.shopNext == null) save.shopNext = gap(rng);
  save.shopNext -= dt;
  while (save.shopNext <= 0) { out.push(visit(save, rng, now)); save.shopNext += gap(rng); }
  return out;
}

// ---------- never stuck ----------
// No coin for a bar and a cord, nothing made and nothing to make one from: the yard's scrap bin gives a dagger's worth.
export function rescue(save, hour) {
  if (save.cards.length) return false;
  const m = save.mats, cheapest = recipe('dagger', [0, 0, 0]);
  if (canMake(m, cheapest)) return false;
  if (save.coins >= recipeCost(short(m, cheapest).map(r => ({ mat: r.mat, n: r.n - r.have })), hour)) return false;
  cheapest.forEach(r => { m[r.mat] = Math.max(m[r.mat] || 0, r.n); });
  return true;
}
