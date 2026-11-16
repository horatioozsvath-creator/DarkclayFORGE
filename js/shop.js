// The shop's rules, with no page access: materials and suppliers, the shelf and its tags, customers and sales.
// Every function that needs chance takes rng: () => [0,1). Time comes in as plain numbers so the same calls can run
// a second, a minute or (milestone 4) a night away.
import { FORGED_PARTS, PATTERNS, MATS, SUPPLIERS, TAGS, SLOT_COSTS, START_SLOTS, MAX_PLACES, CUSTOMERS, MOODS, MOOD_ODDS, TIERS,
  HAGGLE, HAGGLE_TABLE, TELLS, PATIENCE, QUEUE_MAX, SELLER_ODDS, REGULARS, ORDER_TIME, ORDER_PAYS, SELLERS, OLD_BLOOD, RENOWN, OPENING, DEMAND } from './data.js?v=16';
import { refreshTown, hotPatterns, demandOf, purseMultFor } from './town.js?v=16';
import { chosenParts, partOptions, makePiece, srcOf, levelOf, oldBloodGate, stationOf } from './rules.js?v=16';
import { charmGap } from './room.js?v=16';
import { fame, purseMult, patienceOf, haggleMult, onWall, rung } from './growth.js?v=16';

const TIER_N = Object.fromEntries(TIERS.map((t, i) => [t.id, i]));
export const LEDGER_MAX = 30;

// ---------- recipes ----------
// what a pattern with these parts takes: the metal's bars, and one of each named material
export function recipe(patternId, picks) {
  const parts = chosenParts(patternId, picks), need = {};
  need[parts[0].id] = PATTERNS[patternId].bars;
  parts.slice(1).forEach(o => { if (o.mat) need[o.mat] = (need[o.mat] || 0) + 1; });
  if (PATTERNS[patternId].batch) need.bottle = (need.bottle || 0) + PATTERNS[patternId].batch;   // a batch takes a bottle each
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
  save.slots = Math.max(START_SLOTS, Math.min(MAX_PLACES, save.slots || START_SLOTS));
  const ids = new Set(save.cards.map(c => c.id));
  const shelf = (save.shelf || []).slice(0, save.slots).map(e => e && ids.has(e.id) && TAGS[e.tag] ? e : null);
  while (shelf.length < save.slots) shelf.push(null);
  save.shelf = shelf;
}
// one sold from the shelf: a batch gives up a bottle and stays while it has any; a piece goes
export function takeOne(save, card) {
  if ((card.count || 1) > 1) { card.count--; return; }
  const slot = onShelf(save, card.id); if (slot >= 0) save.shelf[slot] = null;
  save.cards = save.cards.filter(x => x.id !== card.id);
}
export const priceAt = (card, tag) => Math.max(1, Math.round(card.worth * TAGS[tag].mult));
export const onShelf = (save, id) => save.shelf.findIndex(e => e && e.id === id);
export const inBack = save => save.cards.filter(c => onShelf(save, c.id) < 0 && !onWall(save, c.id));
export function place(save, id, slot, tag = 'fair') {
  if (slot == null) slot = save.shelf.findIndex(e => !e);
  if (slot < 0 || slot >= save.slots || save.shelf[slot] || onShelf(save, id) >= 0 || onWall(save, id) || !save.cards.some(c => c.id === id)) return -1;
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
// the shelf's pieces this buyer wants, at a tier they'll look at; one who came in for what the town wants settles for what they
// meant to buy when there's none of it
function onOffer(save, c) {
  const all = save.shelf.map((e, slot) => e && { slot, tag: e.tag, card: save.cards.find(x => x.id === e.id) }).filter(e => e && e.card && TIER_N[e.card.tier] >= c.least);
  const hit = all.filter(e => wants(c.want, e.card));
  return hit.length || !c.was ? hit : all.filter(e => wants(c.was, e.card));
}
const pick = (list, rng) => list[Math.floor(rng() * list.length)];
function weighted(items, w, rng) { let r = rng() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < items.length; i++) { r -= w[i]; if (r < 0) return items[i]; } return items[items.length - 1]; }
// what this shop can make: a customer who wanted something only an absent station makes wants something else (a want of any kind
// it can make, else anything at all), and purses grow with renown
const makes = (save, want) => {
  const own = st => !st || st === 'forge' || (save.stations || []).includes(st);
  if (PATTERNS[want]) return own(PATTERNS[want].station);
  return want === 'any' || Object.values(PATTERNS).some(p => p.want === want && own(p.station));
};
export function richer(save, c, rng) {
  let want = makes(save, c.want) ? c.want : 'any', was = null;
  if (save.town && demandOf(save.town, want) < 0) want = 'any';   // no one asks for what's out of favour
  // the town's wants: some come in asking for what's in demand (and settle for what they came for if it isn't on the shelf)
  if (save.town && rng) { const hot = hotPatterns(save.town).filter(p => makes(save, p)); if (hot.length && rng() < DEMAND.want) { was = want; want = hot[Math.floor(rng() * hot.length)]; } }
  return { ...c, want, was, purse: Math.round(c.purse * purseMult(save)) };
}
// what they'll part with for this piece: their purse, more for what the town wants, less for what it doesn't
export const purseFor = (save, c, card) => Math.round(c.purse * purseMultFor(save.town, card.pattern));
export function newCustomer(rng) {
  const t = weighted(CUSTOMERS, CUSTOMERS.map(c => c.weight), rng);
  return { type: t.id, who: pick(t.names, rng), want: pick(t.wants, rng), purse: Math.round(t.purse[0] + rng() * (t.purse[1] - t.purse[0])),
    mood: weighted(MOODS, t.moods, rng), least: t.least || 0, fig: t.fig };
}
const PAIRS = ['gloves', 'boots'];
const SHEAVES = ['arrows'];
export const wants = (want, card) => want === 'any' || want === card.pattern || PATTERNS[card.pattern].want === want;
export function wantWord(want) {
  if (PATTERNS[want]) { const n = PATTERNS[want].name.toLowerCase(); return SHEAVES.includes(want) ? 'a sheaf of ' + n : PAIRS.includes(want) ? 'a pair of ' + n : (/^[aeiou]/.test(n) ? 'an ' : 'a ') + n; }
  return { weapon: 'a weapon', helm: 'something for the head', ring: 'a ring', armour: 'something to wear', bow: 'a bow', brew: 'something from the kettle', glass: 'something of glass', any: 'something good' }[want];
}
export const takeOdds = (mood, tag) => mood === 'PINCHED' && tag === 'dear' ? 0 : Math.min(0.95, MOOD_ODDS[mood] * TAGS[tag].odds);
const LINES = {
  sold: { EAGER: 'Just the thing. Wrap it up.', WARY: 'It\'ll do. It had better.', PINCHED: 'It\'s all I have, but it\'s mine now.' },
  passed: { EAGER: 'Not today. Maybe next time.', WARY: 'I\'ve bought ones that bent. I\'ll wait.', PINCHED: 'More than I can part with.' },
};

// One customer comes in, looks at the shelf and buys or goes. Returns the ledger entry.
// o: { rate: the share of the price that reaches the till (a clerk's cut taken, away), boost: on the odds they take it (a clerk minding
// the shop), by: who sold it, quiet: a visit with no sale goes uncounted in the ledger (away: only sales are written down) }
export function visit(save, rng, now, c = richer(save, newCustomer(rng), rng), o = {}) {
  const shown = onOffer(save, c);
  const afford = shown.filter(e => priceAt(e.card, e.tag) <= purseFor(save, c, e.card))
    .sort((a, b) => TIER_N[b.card.tier] - TIER_N[a.card.tier] || priceAt(b.card, b.tag) - priceAt(a.card, a.tag));
  const entry = { at: now, who: c.who, type: c.type, fig: c.fig, mood: c.mood, want: c.want, purse: c.purse, sold: null, line: '' };
  if (!shown.length) entry.line = 'Nothing on the shelf for them' + (c.least ? ' (Fine or better only).' : '.');
  else if (!afford.length) { const e = shown.sort((a, b) => priceAt(a.card, a.tag) - priceAt(b.card, b.tag))[0]; entry.line = 'Looked at the ' + e.card.name + ' at ' + priceAt(e.card, e.tag) + ' c, but carried ' + c.purse + '.'; entry.near = e.card.id; }
  else {
    const e = afford[0], price = Math.max(1, Math.round(priceAt(e.card, e.tag) * (o.rate || 1)));
    // what the town wants: a step keener, and DEAR doesn't put them off (they take it as readily as at FAIR)
    const hot = demandOf(save.town, e.card.pattern) > 0, mood = hot ? LIFT[c.mood] : c.mood;
    if (rng() < Math.min(0.95, takeOdds(mood, hot && e.tag === 'dear' ? 'fair' : e.tag) * (o.boost || 1))) {
      save.coins += price; save.sold = (save.sold || 0) + 1; save.earned = (save.earned || 0) + price;
      takeOne(save, e.card);
      entry.sold = { name: e.card.name, tier: e.card.tier, price, full: priceAt(e.card, e.tag), tag: e.tag, id: e.card.id };
      if (e.tag !== 'cheap') fame(save, 1);
      entry.line = '"' + LINES.sold[c.mood] + '"' + (o.by ? ' Sold by ' + o.by + (o.rate && o.rate < 1 ? ', who kept ' + (priceAt(e.card, e.tag) - price) + ' c.' : '.') : '');
      if (o.by) entry.by = o.by;
    } else { entry.line = 'Weighed the ' + e.card.name + ' at ' + priceAt(e.card, e.tag) + ' c. "' + LINES.passed[c.mood] + '"'; entry.near = e.card.id; }
  }
  if (o.quiet && !entry.sold) return entry;
  return log(save, entry);
}
export const gap = rng => 22 + rng() * 26;   // seconds between customers
function log(save, entry) { save.ledger = [entry].concat(save.ledger || []).slice(0, LEDGER_MAX); return entry; }

// ---------- the clock ----------
// dt seconds of open shop pass. present: the maker is at the counter (the shop screen, in front): customers queue to be served,
// sellers come in. Away from it, the shelf sells itself as in milestone 2 and the queue looks for itself.
// Returns the ledger entries made, oldest first.
// clerk: { name, boost } minding the shop while the maker is elsewhere (it sells a little more readily), or null
export function shopStep(save, dt, rng, now, present = false, clerk = null) {
  const out = [];
  save.clock = (save.clock || 0) + dt;
  if (now) refreshTown(save, now);
  if (!save.queue) save.queue = [];
  if (!present && save.queue.length) out.push(...flushQueue(save, rng, now, clerk));
  if (present && save.queue[0] && !save.queue[0].counter) {
    save.queue[0].wait -= dt;
    if (save.queue[0].wait <= 0) out.push(walkAway(save, rng, now));
  }
  if (save.order && save.clock > save.order.due) {
    out.push(log(save, { at: now, who: save.order.who, fig: save.order.fig, mood: 'WARY', want: save.order.pattern, sold: null, order: 'lapsed',
      line: 'The order lapsed. "I went elsewhere in the end."' }));
    save.order = null; save.orderNext = save.clock + 300;
  }
  if (save.shopNext == null) save.shopNext = gap(rng);
  save.shopNext -= dt;
  while (save.shopNext <= 0) { out.push(...arrive(save, rng, now, present, clerk)); save.shopNext += gap(rng) * charmGap(save); }
  return out;
}

// ---------- away: the shop while the page is closed ----------
// Customers come more slowly than while the maker is about (the shop's a quiet place without its maker), and only a clerk sells.
// Away time doesn't run the open-shop clock, so special orders wait. Returns { sold: [entries], missed, cut }.
export const awayGap = rng => 480 + rng() * 480;   // 8 to 16 minutes between customers
export function awayStep(save, dt, rng, at, clerk) {
  const out = { sold: [], missed: 0, cut: 0 };
  if (at) refreshTown(save, at);
  if (save.awayNext == null) save.awayNext = awayGap(rng);
  save.awayNext -= dt;
  while (save.awayNext <= 0) {
    const when = at + save.awayNext * 1000;   // when they came in, so the ledger keeps the night's times
    save.awayNext += awayGap(rng) * charmGap(save);
    if (!clerk) { out.missed++; continue; }
    const e = visit(save, rng, when, undefined, { rate: clerk.rate, by: clerk.name, quiet: true });
    if (e.sold) { out.sold.push(e); out.cut += e.sold.full - e.sold.price; } else out.missed++;
  }
  return out;
}
// someone comes in: a regular with an order, a seller (only with the maker there), or a customer to the counter or the shelf
export function arrive(save, rng, now, present, clerk = null) {
  if (!save.order && (save.clock || 0) >= (save.orderNext ?? 180) && rng() < 0.2) return [postOrder(save, rng, now)];
  if (present && save.queue.length < QUEUE_MAX) {
    const c = rng() < SELLER_ODDS ? newSeller(rng, Math.floor(now / 3600000), now) : { ...richer(save, newCustomer(rng), rng), kind: 'buyer' };
    c.tell = c.kind === 'buyer' ? TELLS[c.mood][Math.floor(rng() * TELLS[c.mood].length)] : '';
    c.wait = patienceOf(save, PATIENCE); c.shows = 0; c.id = 'v' + Math.floor(rng() * 1e9).toString(36);
    save.queue.push(c);
    return [];
  }
  return [visit(save, rng, now, undefined, clerk ? { boost: clerk.boost, by: clerk.name } : {})];
}
function flushQueue(save, rng, now, clerk) {
  const out = save.queue.filter(c => c.kind === 'buyer').map(c => visit(save, rng, now, c, clerk ? { boost: clerk.boost, by: clerk.name } : {}));
  save.queue = [];
  return out;
}
// waited long enough: a buyer looks at the shelf for themselves, a seller goes
function walkAway(save, rng, now) {
  const c = save.queue.shift();
  if (save.queue[0]) save.queue[0].wait = patienceOf(save, PATIENCE);
  if (c.kind === 'buyer') return visit(save, rng, now, c);
  return log(save, { at: now, who: c.who, fig: c.fig, mood: 'WARY', want: 'any', sold: null, line: 'Didn\'t wait to sell. Went on up the road.' });
}
function next(save) { save.queue.shift(); if (save.queue[0]) save.queue[0].wait = patienceOf(save, PATIENCE); }

// ---------- the haggle (Zero's §5.3) ----------
export const haggleLevel = save => levelOf((save.haggle || {}).xp || 0).level;
const LIFT = { PINCHED: 'WARY', WARY: 'EAGER', EAGER: 'EAGER' };
// what the customer at the counter could be shown: the shelf's pieces they want, at a tier they'll look at
export function showable(save, c = save.queue[0]) {
  if (!c || c.kind !== 'buyer') return [];
  return onOffer(save, c).sort((a, b) => TIER_N[b.card.tier] - TIER_N[a.card.tier] || priceAt(b.card, b.tag) - priceAt(a.card, a.tag));
}
export const hagglePrice = (card, tag, choice, mult = 1) => Math.max(1, Math.round(priceAt(card, tag) * HAGGLE[choice].mult * mult));
// a want met exactly (they asked for a falchion, it's a falchion), or a piece the town wants today, lifts their mood a step
export const moodFor = (c, card, save) => c.want === card.pattern || (save && demandOf(save.town, card.pattern) > 0) ? LIFT[c.mood] : c.mood;
function sellAt(save, c, card, price, how, now) {
  save.coins += price; save.sold = (save.sold || 0) + 1; save.earned = (save.earned || 0) + price;
  takeOne(save, card);
  return log(save, { at: now, who: c.who, type: c.type, fig: c.fig, mood: c.mood, want: c.want, purse: c.purse, served: true,
    sold: { name: card.name, tier: card.tier, price, tag: how, id: card.id }, line: '"' + { EAGER: 'Done. Wrap it up.', WARY: 'Fair enough. Done.', PINCHED: 'It\'s all I have. Done.' }[c.mood] + '"' });
}
function practise(save, n) { save.haggle = save.haggle || { xp: 0 }; save.haggle.xp += n; }
// Offer the piece at the counter at MEET (90 %), HOLD (its tag's price) or ASK MORE (115 %).
// Within their purse their mood decides (HAGGLE_TABLE): sold, a counter-offer, or gone. Over their purse they name a price instead:
// a share of it by mood (OPENING). A counter-offer never goes over their purse, so there's always a price that sells.
// Returns { outcome: 'sold' | 'counter' | 'gone', price, entry?, over? }
export function haggle(save, cardId, choice, now) {
  const c = save.queue[0], e = showable(save).find(x => x.card.id === cardId);
  if (!c || !e || !HAGGLE[choice]) return null;
  const price = hagglePrice(e.card, e.tag, choice, haggleMult(save)), purse = purseFor(save, c, e.card), mood = moodFor(c, e.card, save);
  if (price > purse) {
    const offer = Math.max(1, Math.floor(purse * OPENING[mood]));
    c.counter = { id: e.card.id, price: offer, asked: price, over: true };
    return { outcome: 'counter', price: offer, over: true };
  }
  const [what, at] = HAGGLE_TABLE[mood][choice].split(':');
  if (what === 'sold') { practise(save, choice === 'ask' ? 2 : 1); if (choice !== 'meet') fame(save, 1); const entry = sellAt(save, c, e.card, price, choice, now); next(save); return { outcome: 'sold', price, entry }; }
  if (what === 'counter') {
    const offer = Math.min(purse, hagglePrice(e.card, e.tag, at, haggleMult(save)));
    c.counter = { id: e.card.id, price: offer, asked: price };
    return { outcome: 'counter', price: offer };
  }
  return gone(save, c, now, '"At ' + price + ' c? I\'ll go elsewhere."');
}
function gone(save, c, now, line) {
  practise(save, 1);
  const entry = log(save, { at: now, who: c.who, type: c.type, fig: c.fig, mood: c.mood, want: c.want, purse: c.purse, served: true, sold: null, line });
  next(save);
  return { outcome: 'gone', entry };
}
// halfway between their offer and what you asked: within their purse they take it (a PINCHED buyer only comes up to it, and that's
// their last word); over it, they come up to their whole purse and no further
export const splitPrice = k => Math.round((k.price + k.asked) / 2);
export function split(save, now) {
  const c = save.queue[0];
  if (!c || !c.counter || c.counter.final) return null;
  const card = save.cards.find(x => x.id === c.counter.id);
  if (!card) return null;
  const mid = splitPrice(c.counter), purse = purseFor(save, c, card), mood = moodFor(c, card, save);
  if (mid <= purse && mood !== 'PINCHED') {
    practise(save, 2); fame(save, 1);
    const entry = sellAt(save, c, card, mid, 'split', now); next(save);
    return { outcome: 'sold', price: mid, entry };
  }
  c.counter = { ...c.counter, price: Math.max(c.counter.price, Math.min(mid, purse)), final: true };
  return { outcome: 'counter', price: c.counter.price, final: true };
}
// their counter-offer: take it, or say no (they look at another piece if there's one they haven't seen, or they go)
export function answerCounter(save, take, now) {
  const c = save.queue[0];
  if (!c || !c.counter) return null;
  const card = save.cards.find(x => x.id === c.counter.id);
  if (take && card) {
    practise(save, 1);
    const entry = sellAt(save, c, card, c.counter.price, 'counter', now); next(save);
    return { outcome: 'sold', price: entry.sold.price, entry };
  }
  const offered = c.counter.price; c.counter = null;
  if (showable(save, c).length > 1 && (c.shows || 0) < 2) { c.shows = (c.shows || 0) + 1; return { outcome: 'another' }; }
  return gone(save, c, now, 'Offered ' + offered + ' c. Refused, they went.');
}
// nothing for them: they go
export function sendAway(save, now) {
  const c = save.queue[0]; if (!c) return null;
  const entry = log(save, { at: now, who: c.who, type: c.type, fig: c.fig, mood: c.mood || 'WARY', want: c.want || 'any', sold: null, served: true,
    line: c.kind === 'seller' ? 'You passed on what they had.' : 'Nothing for them today.' });
  next(save);
  return entry;
}

// ---------- sellers: what customers bring in to sell ----------
const SELL_MATS = ['iron', 'iron', 'bronze', 'steel', 'steel', 'silver', 'wrap', 'sharkhide', 'silk', 'gem', 'darkclay'];
const SELL_RARE = ['blackwater', 'bogoak', 'winterfox', 'starglass'];
export function newSeller(rng, hour, now) {
  const s = SELLERS[Math.floor(rng() * SELLERS.length)];
  const c = { kind: 'seller', who: s.who, fig: s.fig, type: 'seller', mood: 'WARY', want: 'any' };
  if (s.kind === 'mats') {
    const rare = rng() < 0.3, mat = rare ? SELL_RARE[Math.floor(rng() * SELL_RARE.length)] : SELL_MATS[Math.floor(rng() * SELL_MATS.length)];
    const n = rare ? 1 : 2 + Math.floor(rng() * 4);
    c.offer = { type: 'mats', mat, n, price: Math.max(1, Math.round(priceOf(mat, hour) * n * (rare ? 0.6 : 0.7))) };
  } else {
    const ids = Object.keys(PATTERNS).filter(k => !PATTERNS[k].makes), pattern = ids[Math.floor(rng() * ids.length)], metals = partOptions(pattern)[0].opts;
    const m = Math.floor(rng() * Math.min(3, metals.length)), tier = rng() < 0.3 ? 1 : 0, cracks = Math.floor(rng() * 3);
    const card = makePiece({ patternId: pattern, picks: [m, 0, 0], result: { tier, flawed: false, worked: Math.floor(rng() * 20), strikes: 20, heats: 2, cracks },
      maker: 'an old maker', rng, now });
    c.offer = { type: 'piece', card, price: Math.max(salvageWorth(card) + 1, Math.round(card.worth * 0.55)) };
  }
  return c;
}
export function buyOffer(save, now) {
  const c = save.queue[0];
  if (!c || c.kind !== 'seller' || save.coins < c.offer.price) return null;
  save.coins -= c.offer.price;
  if (c.offer.type === 'mats') save.mats[c.offer.mat] = (save.mats[c.offer.mat] || 0) + c.offer.n;
  else save.cards.unshift(c.offer.card);
  const what = c.offer.type === 'mats' ? MATS[c.offer.mat].name + ' × ' + c.offer.n : 'the ' + c.offer.card.name;
  const entry = log(save, { at: now, who: c.who, fig: c.fig, mood: 'WARY', want: 'any', sold: null, bought: { what, price: c.offer.price }, served: true, line: 'Sold you ' + what + '.' });
  next(save);
  return entry;
}

// ---------- special orders ----------
const metalIndex = (pattern, metal) => partOptions(pattern)[0].opts.findIndex(o => o.id === metal);
// what the order pays: twice the worth of the piece it asks for (plain parts, its least tier, no WORKED), whatever is handed in
export function orderPays(pattern, metal, least) {
  const p = makePiece({ patternId: pattern, picks: [Math.max(0, metalIndex(pattern, metal || partOptions(pattern)[0].opts[0].id)), 0, 0],
    result: { tier: least, flawed: false, worked: 0, strikes: 0, heats: 0, cracks: 0 }, maker: '', rng: () => 0, now: 0 });
  return p.worth * ORDER_PAYS;
}
export function postOrder(save, rng, now) {
  // a regular asks only for what this shop's stations can make
  const owns = p => !PATTERNS[p].station || PATTERNS[p].station === 'forge' || (save.stations || []).includes(PATTERNS[p].station);
  const regs = REGULARS.filter(x => x.wants.some(owns)), r = regs[Math.floor(rng() * regs.length)], can = r.wants.filter(owns);
  const hot = save.town ? can.filter(p => demandOf(save.town, p) > 0) : [];
  const pattern = hot.length && rng() < 0.5 ? hot[Math.floor(rng() * hot.length)] : can[Math.floor(rng() * can.length)];
  let least = r.least != null ? r.least : (rng() < 0.35 ? 1 : 0);
  // a famed shop: now and then a regular asks for Old-Blood (only a piece that can be reworked that far)
  if (rung(save) === RENOWN.length - 1 && !PATTERNS[pattern].batch && !PATTERNS[pattern].makes && rng() < 0.2) least = OLD_BLOOD.tier;
  let metal = r.metal && metalIndex(pattern, r.metal) >= 0 ? r.metal : null;
  if (!metal && rng() < 0.3) { const ok = ['iron', 'bronze', 'steel'].filter(m => metalIndex(pattern, m) >= 0); metal = ok[Math.floor(rng() * ok.length)]; }
  save.order = { who: r.who, fig: r.fig, pattern, least, metal, line: r.line, posted: save.clock || 0,
    due: (save.clock || 0) + ORDER_TIME[0] + rng() * (ORDER_TIME[1] - ORDER_TIME[0]), pays: orderPays(pattern, metal, least) };
  return log(save, { at: now, who: r.who, fig: r.fig, mood: 'EAGER', want: pattern, sold: null, order: 'posted', line: 'Left a special order: ' + orderWord(save.order) + '.' });
}
export function orderWord(o) {
  const rest = (o.metal ? MATS[o.metal].name.replace(' bar', '').toLowerCase() + ' ' : '') + PATTERNS[o.pattern].name.toLowerCase();
  return o.least ? TIERS[o.least].name + ' or better ' + rest : SHEAVES.includes(o.pattern) ? 'a sheaf of ' + rest : PAIRS.includes(o.pattern) ? 'a pair of ' + rest : (/^[aeiou]/.test(rest) ? 'an ' : 'a ') + rest;
}
export const fills = (o, card) => !!o && card.pattern === o.pattern && TIER_N[card.tier] >= o.least && (!o.metal || card.metal === o.metal) && !card.flawed;
export function deliver(save, cardId, now) {
  const o = save.order, card = save.cards.find(c => c.id === cardId);
  if (!o || !card || !fills(o, card) || onWall(save, cardId)) return null;
  takeOne(save, card);
  save.coins += o.pays; save.earned = (save.earned || 0) + o.pays; save.sold = (save.sold || 0) + 1;
  save.order = null; save.orderNext = (save.clock || 0) + 240; fame(save, 3);
  return log(save, { at: now, who: o.who, fig: o.fig, mood: 'EAGER', want: o.pattern, sold: { name: card.name, tier: card.tier, price: o.pays, tag: 'order', id: card.id },
    order: 'filled', served: true, line: '"Just as I asked. Thank you."' });
}

// ---------- the back room: break a piece down, or send it back in the fire ----------
// breaking down gives back half its bars, rounded down (a one-bar piece gives no bar back), and any rare part it carried
export function salvageOf(card) {
  if (PATTERNS[card.pattern].batch || PATTERNS[card.pattern].makes) return [];   // a brew can't be unbrewed
  const src = srcOf(card), parts = chosenParts(card.pattern, src.picks), out = {};
  const bars = Math.floor(PATTERNS[card.pattern].bars / 2);
  if (bars) out[card.metal] = bars;
  parts.slice(1).forEach(o => { if (o.rare && o.mat) out[o.mat] = (out[o.mat] || 0) + 1; });
  return Object.entries(out).map(([mat, n]) => ({ mat, n }));
}
export const salvageWorth = card => salvageOf(card).reduce((c, r) => c + MATS[r.mat].price * r.n, 0);
export function salvage(save, cardId) {
  const card = save.cards.find(c => c.id === cardId);
  if (!card || onShelf(save, cardId) >= 0 || onWall(save, cardId)) return null;
  const got = salvageOf(card);
  got.forEach(r => { save.mats[r.mat] = (save.mats[r.mat] || 0) + r.n; });
  save.cards = save.cards.filter(c => c.id !== cardId);
  return got;
}
// back in the fire: half the bars (rounded up) of its own metal; Common to Fine, Fine to Rare
// back in the fire: half the bars again; toward Old-Blood three times that and one rare thing of the station's
export const reworkCost = card => {
  const n = Math.ceil(PATTERNS[card.pattern].bars / 2);
  if (TIER_N[card.tier] !== OLD_BLOOD.tier - 1) return [{ mat: card.metal, n }];
  const rare = OLD_BLOOD.rare[stationOf(card.pattern).id];
  return [{ mat: card.metal, n: n * OLD_BLOOD.costX }].concat(rare ? [{ mat: rare, n: 1 }] : []);
};
export const tradeLevel = (save, pattern) => levelOf(((save.trades || {})[pattern] || {}).xp || 0).level;
// Common and Fine go up a tier; Rare only toward Old-Blood, for a master with the right piece (rules.js oldBloodGate)
export const canRework = (save, card) => !PATTERNS[card.pattern].batch && !PATTERNS[card.pattern].makes && TIER_N[card.tier] < TIERS.length - 1
  && onShelf(save, card.id) < 0 && !onWall(save, card.id) && (TIER_N[card.tier] < OLD_BLOOD.tier - 1 || oldBloodGate(card, tradeLevel(save, card.pattern)).ok);

// ---------- parts for other stations, forged at once ----------
export function forgePart(save, id, n = 1) {
  const f = FORGED_PARTS[id]; if (!f) return false;
  for (const [m, k] of Object.entries(f.from)) if ((save.mats[m] || 0) < k * n) return false;
  for (const [m, k] of Object.entries(f.from)) { save.mats[m] -= k * n; if (!save.mats[m]) delete save.mats[m]; }
  save.mats[id] = (save.mats[id] || 0) + f.makes * n;
  return true;
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
