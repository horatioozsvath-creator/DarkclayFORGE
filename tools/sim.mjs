// The economy, played by a bot: node tools/sim.mjs [days] [seed]
// Each day: a play session (making pieces at the forge, the shop selling while the game is open), then a night away.
// The bot plays like a steady, middling player: it works each piece to about WORKED +15 %, a crack now and then, and spends on
// shelves, staff, tools and furniture when it can afford them with some to spare. Prints a line a day and when things happen.
import * as R from '../js/rules.js';
import * as Sh from '../js/shop.js';
import * as St from '../js/staff.js';
import * as Rm from '../js/room.js';
import * as G from '../js/growth.js';
import * as Town from '../js/town.js';
import { PATTERNS, TOOLS, TIERS, SHELF_LEVELS, OLD_BLOOD } from '../js/data.js';

const days = +process.argv[2] || 7, seed0 = +process.argv[3] || 1, SESSION_MIN = +process.argv[4] || 45;
function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rng = seeded(seed0);
const save = { v: 1, maker: 'Bot', trades: {}, found: ['ember'], chosen: [], picks: {}, cards: [], made: 0,
  coins: 60, mats: { iron: 5, bronze: 2, cord: 3, wrap: 1, ash: 1, wool: 1, strap: 1 }, slots: 4, shelf: [], ledger: [], sold: 0, earned: 0, shopNext: 6, queue: [] };
Sh.fixShelf(save); Rm.fixRoom(save); Sh.fixShelf(save);
const OLD = process.env.OLD !== '0', TOWN = process.env.TOWN !== '0';   // TOWN=0: the bot ignores the notice board   // OLD=0: a run without Old-Blood, to compare
let t = Date.UTC(2026, 10, 1, 9), log = [], made = 0, oldTried = 0, oldMade = 0, spent = { mats: 0, staff: 0, tools: 0, room: 0 };
const H = 3600000, lvl = id => R.levelOf((save.trades[id] || {}).xp || 0).level, note = m => log.push('  ' + m);

// which piece to make: the best worth over materials the bot can make or buy, at its trade
function choose(hour) {
  let best = null;
  for (const id of Object.keys(PATTERNS)) {
    if (!Rm.owns(save, PATTERNS[id].station || 'forge') || PATTERNS[id].makes) continue;
    const metals = R.partOptions(id)[0].opts;
    metals.forEach((m, mi) => {
      if ((m.level || 1) > lvl(id)) return;
      const picks = [mi, 0, 0], rec = Sh.recipe(id, picks), short = Sh.short(save.mats, rec);
      if (short.some(x => !Sh.sells(x.mat, hour))) return;
      const cost = short.reduce((c, x) => c + Sh.priceOf(x.mat, hour) * (x.n - x.have), 0);
      if (cost > save.coins) return;
      const worth = PATTERNS[id].value * m.val * 1.4, score = worth - Sh.recipeCost(rec, hour) + (lvl(id) < 3 ? 15 : 0);
      if (!best || score > best.score) best = { id, picks, short, score };
    });
  }
  return best;
}
// one piece made: the odds of a steady player
function makeOne(hour) {
  const c = choose(hour); if (!c) return false;
  c.short.forEach(x => { const before = save.coins; Sh.buy(save, x.mat, x.n - x.have, hour); spent.mats += before - save.coins; });
  if (!Sh.takeMats(save, Sh.recipe(c.id, c.picks))) return false;
  const S = R.newWorking({ patternId: c.id, picks: c.picks, level: lvl(c.id), found: [], kit: G.kitOf(save) }, rng);
  S.shape = 100; S.worked = 10 + rng() * 15; S.strikes = 24; S.cracks = rng() < 0.4 ? 1 : 0;
  if (lvl(c.id) >= 5 && rng() < 0.3) S.earned = S.whiteHeat = true;
  const res = R.finish(S, 'quench');
  const p = R.makePiece({ patternId: c.id, picks: c.picks, result: res, picked: null, maker: 'Bot', rng, now: t });
  save.cards.unshift(p); made++;
  (save.trades[c.id] = save.trades[c.id] || { xp: 0 }).xp += R.xpFor(res);
  const tag = 'fair';
  if (Sh.place(save, p.id, null, tag) < 0) { /* the shelf is full: it waits in the back */ }
  return true;
}
// a master's last working: a Rare that qualifies (on the shelf or in the back), its materials bought if they're for sale this hour.
// A steady player finishes it with no crack about half the time at trade 6, better with each level after.
function tryOldBlood(hour) {
  if (!OLD) return;
  for (const c of save.cards.filter(x => x.tier === 'rare')) {
    const slot = Sh.onShelf(save, c.id); if (slot >= 0) Sh.takeDown(save, slot);
    if (!Sh.canRework(save, c)) { if (slot >= 0) Sh.place(save, c.id, slot); continue; }
    const cost = Sh.reworkCost(c), short = Sh.short(save.mats, cost);
    const coins = short.reduce((n, x) => n + Sh.priceOf(x.mat, hour) * (x.n - x.have), 0);
    if (short.some(x => !Sh.sells(x.mat, hour)) || save.coins - coins < 300) { if (slot >= 0) Sh.place(save, c.id, slot); continue; }
    short.forEach(x => { const b = save.coins; Sh.buy(save, x.mat, x.n - x.have, hour); spent.mats += b - save.coins; });
    Sh.takeMats(save, cost); oldTried++;
    const took = rng() < Math.min(0.75, 0.45 + 0.06 * (lvl(c.pattern) - OLD_BLOOD.level));
    (save.trades[c.pattern] = save.trades[c.pattern] || { xp: 0 }).xp += took ? 6 : 2;
    if (took) {
      const res = { tier: OLD_BLOOD.tier, flawed: false, worked: 10, strikes: 24, heats: 2, cracks: 0, whiteHeat: true };
      const p = R.remakePiece({ card: c, res, picked: null, rng, now: t }); save.cards[save.cards.indexOf(c)] = p; oldMade++;
      note('OLD-BLOOD: ' + p.name + ' (' + p.worth + ' c)');
    }
    if (slot >= 0) Sh.place(save, (took ? save.cards.find(x => x.id === c.id) : c).id, slot);
    return;
  }
}
// following the notice board: what the town wants goes on the shelf at DEAR, in place of what it doesn't (from the back room)
function restock() {
  if (!TOWN || !save.town) return;
  const hot = c => Town.demandOf(save.town, c.pattern) > 0;
  const back = Sh.inBack(save).filter(hot).sort((a, b) => b.worth - a.worth);
  save.shelf.forEach((e, i) => {
    const c = e && save.cards.find(x => x.id === e.id);
    if (c && hot(c)) { if (e.tag !== 'dear') Sh.setTag(save, i, 'dear'); return; }
    if (!back.length) return;
    if (e) Sh.takeDown(save, i);
    Sh.place(save, back.shift().id, i, 'dear');
  });
  // yesterday's DEAR pieces the town no longer wants go back to FAIR
  save.shelf.forEach((e, i) => { const c = e && save.cards.find(x => x.id === e.id); if (c && !hot(c) && e.tag === 'dear') Sh.setTag(save, i, 'fair'); });
}
// spending, with a reserve kept for materials
function spend(hour) {
  const reserve = 80;
  const cost = Rm.shelfCost(save.room);
  if (cost != null && save.coins - cost > reserve && Sh.inBack(save).length >= 2) { const r = Rm.buy(save, 'shelf'); if (r.item) { spent.room += cost; note('a shelf (' + save.slots + ' places), ' + cost + ' c'); } }
  // a shelf made better when the back fills up and a new shelf costs more than the upgrade (or there's no room for one)
  for (const it of save.room.items.filter(i => i.kind === 'shelf')) {
    const next = SHELF_LEVELS[Rm.levelOf(it) + 1], shelf = Rm.shelfCost(save.room);
    if (next && Sh.inBack(save).length >= 2 && save.coins - next.cost > reserve + 100 && (shelf == null || next.cost / (next.places - Rm.placesOf(it)) < shelf / 2)) {
      if (!Rm.upgradeShelf(save, it.id).why) { spent.room += next.cost; note('a ' + next.name.toLowerCase() + ' (' + save.slots + ' places), ' + next.cost + ' c'); }
    }
  }
  if (!St.clerkOf(save)) { const c = St.candidates(save, Math.floor(t / H)).find(x => x.role === 'clerk'); if (c && save.coins - St.hireFee(c) > reserve + 60) { St.hire(save, c); spent.staff += St.hireFee(c); note('hired ' + c.name + ' (clerk), ' + St.hireFee(c) + ' c'); } }
  for (const id of ['anvil', 'hammer1', 'bellows', 'gloves', 'firebrick', 'hammer2']) if (G.canBuyTool(save, id).ok && save.coins - TOOLS[id].cost > reserve + 100) { G.buyTool(save, id); spent.tools += TOOLS[id].cost; note('tool: ' + TOOLS[id].name); }
  if (!Rm.owns(save, 'stretcher') && save.coins > 1200 + reserve + 300) { if (Rm.buyStation(save, 'stretcher').item) { spent.room += 1200; note('set up the stretcher'); } }
  if (Rm.owns(save, 'kettle') && !Rm.owns(save, 'glass') && save.coins > 3500 + reserve + 300) { if (Rm.buyStation(save, 'glass').item) { spent.room += 3500; note('set up the glass'); } }
  if (Rm.owns(save, 'bowbench') && !Rm.owns(save, 'kettle') && save.coins > 1500 + reserve + 300) { if (Rm.buyStation(save, 'kettle').item) { spent.room += 1500; note('set up the kettle'); } }
  if (Rm.owns(save, 'stretcher') && !Rm.owns(save, 'bowbench') && save.coins > 2000 + reserve + 300) { if (Rm.buyStation(save, 'bowbench').item) { spent.room += 2000; note('set up the bench'); } }
  const next = Rm.nextSize(save.room); if (next && save.coins - next.cost > reserve + 200) { Rm.expand(save); spent.room += next.cost; note('a bigger shop: ' + next.w + '×' + next.d); }
  for (const k of ['lamp', 'rug', 'bench', 'table', 'workbench']) if (Rm.costOf(save.room, k) && save.coins - Rm.costOf(save.room, k) > reserve + 300 && Rm.charm(save.room, save) < 20) { const r = Rm.buy(save, k); if (r.item) spent.room += Rm.costOf(save.room, k); }
  while (G.pointsLeft(save) > 0) { const order = [['craft', 0], ['house', 0], ['craft', 1], ['house', 2], ['craft', 2], ['counter', 0], ['house', 1], ['counter', 1], ['counter', 2]]; const n = order.find(([b, i]) => G.canTake(save, b, i).ok); if (!n) break; G.takePerk(save, ...n); note('skill: ' + n.join(' ')); }
  // anything in the back goes up when there's room
  Sh.inBack(save).forEach(c => Sh.place(save, c.id));
}

console.log('day  coins  earned  made sold  slots  staff  maker renown  room  (session ' + SESSION_MIN + ' min a day, then a night away)');
for (let d = 1; d <= days; d++) {
  const start = save.earned || 0;
  // a play session: a piece every ~50 s, the shop open all the while
  save.lastSeen = t;
  for (let s = 0; s < SESSION_MIN * 60; s += 50) {
    const hour = Math.floor(t / H);
    makeOne(hour);
    const c = St.clerkOf(save), clerk = c && !save.unpaid ? St.clerkTerms(c) : null;
    Sh.shopStep(save, 50, rng, t, false, clerk);
    St.payWages(save, 50); St.resolveTrips(save, t, rng);
    t += 50000; save.lastSeen = t;
    if (s % 600 === 0) { spend(hour); tryOldBlood(hour); restock(); }
    if (Sh.rescue(save, hour)) note('scrap bin');
  }
  // the night: away for 14 hours
  const a = St.catchUp(save, t + 14 * H, rng); t += 14 * H; save.lastSeen = t;
  const day = (save.earned || 0) - start;
  console.log(String(d).padStart(3), String(save.coins).padStart(6), String(day).padStart(7), String(made).padStart(5), String(save.sold || 0).padStart(4),
    String(save.slots).padStart(6), String((save.staff || []).length).padStart(6), String(G.makerLevel(save).level).padStart(6), String(G.renownOf(save)).padStart(6),
    String(Rm.sizeOf(save.room).w + '×' + Rm.sizeOf(save.room).d).padStart(6), a ? ' away: ' + a.sold.length + ' sold' : '');
  log.forEach(l => console.log(l)); log = [];
}
const tiers = {}; save.ledger.forEach(e => { if (e.sold) tiers[e.sold.tier] = (tiers[e.sold.tier] || 0) + 1; });
console.log('old-blood: tried', oldTried, 'made', oldMade, ' sold by tier:', tiers);
console.log('spent:', spent, ' trades:', Object.fromEntries(Object.entries(save.trades).map(([k, v]) => [k, lvl(k)])), ' in the back:', Sh.inBack(save).length);
