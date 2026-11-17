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
import * as Br from '../js/branch.js';
import * as Hl from '../js/hall.js';
import * as Trail from '../js/trail.js';
import * as Bank from '../js/bank.js';
import * as Wear from '../js/wear.js';
import { BRANCH, RELICS, MYTHICS } from '../js/data.js';
import { PATTERNS, TOOLS, TIERS, SHELF_LEVELS, OLD_BLOOD } from '../js/data.js';

const days = +process.argv[2] || 7, seed0 = +process.argv[3] || 1, SESSION_MIN = +process.argv[4] || 45;
function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rng = seeded(seed0);
const save = { v: 1, maker: 'Bot', trades: {}, found: ['ember'], chosen: [], picks: {}, cards: [], made: 0,
  coins: 60, mats: { iron: 5, bronze: 2, cord: 3, wrap: 1, ash: 1, wool: 1, strap: 1 }, slots: 4, shelf: [], ledger: [], sold: 0, earned: 0, shopNext: 6, queue: [] };
Sh.fixShelf(save); Rm.fixRoom(save); Sh.fixShelf(save);
const OLD = process.env.OLD !== '0', TOWN = process.env.TOWN !== '0', BRANCHES = process.env.BRANCH !== '0';   // TOWN=0: the bot ignores the notice board   // OLD=0: a run without Old-Blood, to compare
let t = Date.UTC(2026, 10, 1, 9), log = [], made = 0, oldTried = 0, oldMade = 0, spent = { mats: 0, staff: 0, tools: 0, room: 0 };
const H = 3600000, lvl = id => R.levelOf((save.trades[id] || {}).xp || 0).level, note = m => log.push('  ' + m);

// on the trail (CHASE=0 turns it off): from RENOWNED, a pattern with a blueprint whose Relic isn't made yet is practised to trade 7, and
// its Old-Blood pieces are kept in the back for the Relic working
const CHASE = process.env.CHASE !== '0';
const chasing = id => G.rung(save) >= 5 && (save.blueprints || []).some(b => RELICS[b].pattern === id && !(save.relicsMade || []).includes(b));
// off the shelf and out of the Hall, into the back room (for a working)
function toBack(c) { const sl = Sh.onShelf(save, c.id); if (sl >= 0) Sh.takeDown(save, sl); if (save.hall) for (const k of Object.keys(save.hall.shown || {})) if (save.hall.shown[k] === c.id) delete save.hall.shown[k]; }
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
      const o = save.order, forOrder = o && o.pattern === id && (!o.metal || o.metal === m.id) && !Sh.inBack(save).some(x => Sh.fills(o, x));   // making to order
      const worth = PATTERNS[id].value * m.val * 1.4 * (forOrder ? 4 : 1), score = worth - Sh.recipeCost(rec, hour) + (lvl(id) < 3 ? 15 : 0) + (CHASE && chasing(id) && lvl(id) < OLD_BLOOD.level + 1 ? 250 : 0);
      if (!best || score > best.score) best = { id, picks, short, score };
    });
  }
  return best;
}
// one piece made: the odds of a steady player
// wear (WEAR=0 turns it off): every piece wears its station; the bot repairs past 60 %, rebuilds if one breaks (and waits)
const WEARING = process.env.WEAR !== '0';
let wearSpent = 0, repairs = 0, broke = 0;
function upkeep() { if (!WEARING) return; for (const st of ['forge'].concat(save.stations || [])) if (Wear.wearOf(save, st) > 60 && !Wear.isBroken(save, st, t)) { const c = Wear.repairCost(save, st); if (save.coins > c + 200) { const r = Wear.repair(save, st); if (r.ok) { wearSpent += r.cost; repairs++; } } } }
function makeOne(hour) {
  const c = choose(hour); if (!c) return false;
  if (WEARING && Wear.isBroken(save, R.stationOf(c.id).id, t)) return false;
  c.short.forEach(x => { const before = save.coins; Sh.buy(save, x.mat, x.n - x.have, hour); spent.mats += before - save.coins; });
  if (!Sh.takeMats(save, Sh.recipe(c.id, c.picks))) return false;
  const S = R.newWorking({ patternId: c.id, picks: c.picks, level: lvl(c.id), found: [], kit: G.kitOf(save) }, rng);
  S.shape = 100; S.worked = 10 + rng() * 15; S.strikes = 24; S.cracks = rng() < 0.4 ? 1 : 0;
  if (lvl(c.id) >= 5 && rng() < 0.3) S.earned = S.whiteHeat = true;
  const res = R.finish(S, 'quench');
  const p = R.makePiece({ patternId: c.id, picks: c.picks, result: res, picked: null, maker: 'Bot', rng, now: t });
  save.cards.unshift(p); made++;
  if (WEARING) { const st = R.stationOf(c.id).id; Wear.addWear(save, st, 'work', t); if (Wear.isBroken(save, st, t)) { broke++; const r = Wear.rebuild(save, st, t); if (r.ok) wearSpent += r.cost; } }
  (save.trades[c.id] = save.trades[c.id] || { xp: 0 }).xp += R.xpFor(res);
  const tag = 'fair';
  if (Sh.place(save, p.id, null, tag) < 0) { /* the shelf is full: it waits in the back */ }
  return true;
}
// the big sales: a piece over 1,000 c, an Old-Blood piece, and who bought them
const big = { over1000: 0, oldBlood: 0, by: {} };
function tally(entries) { (entries || []).forEach(e => { if (!e.sold) return; if (e.sold.price >= 1000) big.over1000++; if (e.sold.tier === 'oldblood') big.oldBlood++; if (e.sold.price >= 1000 || e.sold.tier === 'oldblood') big.by[e.type] = (big.by[e.type] || 0) + 1; }); }
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
    if (slot >= 0 && !(took && CHASE && chasing(c.pattern))) Sh.place(save, (took ? save.cards.find(x => x.id === c.id) : c).id, slot);
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
// the trail of the Nine: out to the fallen star when it falls; shards noted the day they're first held
const shardDays = {};
function trailWatch(day) {
  if (save.town) Trail.claimStar(save, save.town);
  (save.shards || []).forEach(id => { if (!shardDays[id]) shardDays[id] = day; });
}
// the Hall: built once it can be afforded with some over, its places filled with the best pieces, more plinths while there are more
let hallDay = null;
function runHall(day) {
  if (process.env.HALL === '0') return;
  if (!save.hall && Hl.canBuy(save).ok && save.coins > 27000) { Hl.buy(save); hallDay = day; note('built the Hall'); }
  if (!save.hall) return;
  Hl.tidy(save);
  const free = () => Rm.hallSpots(save.hall).filter(p => !(save.hall.shown || {})[p.key]);
  for (const c of Hl.candidates(save)) { const p = free()[0]; if (!p) break; Hl.show(save, p.key, c.id); }
  if (!free().length && Hl.candidates(save).length && save.coins > 6000) Rm.buy(save, 'plinth');
}
// the Relics: from RENOWNED a runner goes below the deep doors whenever home; an Old-Blood piece with its blueprint, the trade and
// the material goes to the Relic working (a steady player gets WHITE HEAT twice with no crack about a third of the time)
let relics = [], relicTried = 0;
function relicWork(day) {
  if (G.rung(save) < 5) return;
  let r = St.runnerOf(save);
  if (!r) { const c = St.candidates(save, Math.floor(t / H)).find(x => x.role === 'runner'); if (c && save.coins > St.hireFee(c) + 500) { St.hire(save, c); r = St.runnerOf(save); } }
  if (r && !r.trip && save.coins > 900) St.sendRunner(save, 'below', t);
  for (const c of save.cards.filter(x => x.tier === 'oldblood')) {
    let g = Sh.relicFor(save, c);
    if (!g.ok && g.why.length === 1 && /back room/.test(g.why[0])) { toBack(c); g = Sh.relicFor(save, c); }
    if (!g.ok) continue;
    const cost = Sh.relicCost(c, g.relic), short = Sh.short(save.mats, cost);
    if (short.some(x => RELICS[g.relic].mat === x.mat)) continue;
    short.forEach(x => Sh.buy(save, x.mat, x.n - x.have, Math.floor(t / H)));
    if (!Sh.takeMats(save, cost)) continue;
    relicTried++;
    if (rng() < 0.35) {
      const res = { tier: 4, flawed: false, worked: 10, strikes: 30, heats: 3, cracks: 0, whiteHeat: true };
      const p = R.relicPiece(R.remakePiece({ card: c, res, picked: null, rng, now: t }), g.relic);
      save.cards[save.cards.indexOf(c)] = p; save.relicsMade = (save.relicsMade || []).concat(g.relic); relics.push(g.relic + ' d' + day);
      note('A RELIC: ' + p.name + ' (' + p.worth + ' c)');
    }
    return;
  }
}
// the Nine (milestone 18): each shard's three parts worked when they can be (about half take), then the Mythic working on its Relic,
// taken down from the Hall for it (about a quarter take: WHITE HEAT three times and no crack)
let mythics = [], partsMade = 0, partsTried = 0, mythicTried = 0, courtAsked = 0;
function nineWork(day) {
  if (!Trail.open(save)) return;
  const hour = Math.floor(t / H), buyShort = cost => Sh.short(save.mats, cost).forEach(x => Sh.buy(save, x.mat, x.n - x.have, hour));
  for (const id of Object.keys(MYTHICS)) {
    if (!Trail.hasShard(save, id) || (save.mythicsMade || []).includes(id)) continue;
    for (let i = 0; i < 3; i++) {
      const g = Trail.partGate(save, id, i); if (!g.ok) continue;
      const cost = Sh.recipe(g.pattern, [0, 0, 0]).concat([Trail.partExtra(g.station)]);
      buyShort(cost); if (!Sh.takeMats(save, cost)) continue;
      partsTried++; if (rng() < 0.5) { Trail.makePart(save, id, i); partsMade++; }
      return;
    }
    const relic = save.cards.find(c => c.tier === 'relic' && c.relic === MYTHICS[id].relic); if (!relic) continue;
    let g = Sh.mythicFor(save, relic);
    if (!g.ok && save.hall && g.why.length === 1 && /back room/.test(g.why[0])) { for (const k of Object.keys(save.hall.shown || {})) if (save.hall.shown[k] === relic.id) delete save.hall.shown[k]; g = Sh.mythicFor(save, relic); }
    if (!g.ok) continue;
    const cost = Sh.mythicCost(relic, id);
    if (Sh.short(save.mats, cost).some(x => x.mat === RELICS[MYTHICS[id].relic].mat)) continue;
    buyShort(cost); if (!Sh.takeMats(save, cost)) continue;
    mythicTried++;
    if (rng() < 0.25) {
      const p = R.mythicPiece({ ...relic, tier: 'mythic' }, id);
      save.cards[save.cards.indexOf(relic)] = p; save.mythicsMade = (save.mythicsMade || []).concat(id); mythics.push(id + ' d' + day);
      note('ONE OF THE NINE: ' + p.name + (G.isNine(save) ? ' · MAKER OF THE NINE' : ''));
    }
    return;
  }
}
// a special order (a story's step too): delivered from the back room if something there fills it
let orders = 0, stories = 0;
function fillOrder() {
  const o = save.order; if (!o) return;
  const c = Sh.inBack(save).filter(x => Sh.fills(o, x)).sort((a, b) => a.worth - b.worth)[0];
  if (c && Sh.deliver(save, c.id, t)) { orders++; if (o.story) stories++; }
}
// the second shop: set up once it can be afforded with plenty over, then kept stocked from the back room, best first
let branchDay = null;
function runBranch(day) {
  if (!BRANCHES) return;
  if (!save.branch && Br.canBuy(save).ok && save.coins > BRANCH.cost + 300) { Br.buy(save); branchDay = day; note('opened the second shop at ' + BRANCH.town); }
  if (!save.branch) return;
  const v = Br.viewOf(save), back = Sh.inBack(save).filter(c => !c.sample).sort((a, b) => b.worth - a.worth);
  v.shelf.forEach((e, i) => { if (!e && back.length) Sh.place(v, back.shift().id, i); });
  const cost = Rm.shelfCost(v.room); if (cost != null && save.coins - cost > 3000 && back.length > 4) Rm.buy(v, 'shelf');
}
// the bank (BANK=1): borrow for the second shop as soon as the bank will lend enough, pay the week's interest, repay with plenty over
const BANKING = process.env.BANK === '1';
let loanDay = null, interestPaid = 0;
function runBank(day) {
  if (!BANKING) return;
  const w = Bank.weekly(save, t); if (w) interestPaid += w.paid;
  if (!save.branch && Br.canBuy({ ...save, coins: 1e9 }).ok && save.coins < BRANCH.cost + 300) {
    const need = BRANCH.cost + 300 - save.coins; if (need <= Bank.canBorrow(save) && Bank.borrow(save, need, t).ok) { loanDay = day; note('borrowed ' + need + ' c for the second shop'); }
  }
  const b = Bank.bankOf(save); if (b.loan && save.coins > b.loan + 4000) Bank.repay(save, b.loan);
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
    tally(Sh.shopStep(save, 50, rng, t, false, clerk));
    St.payWages(save, 50); St.resolveTrips(save, t, rng);
    t += 50000; save.lastSeen = t;
    if (s % 600 === 0) { upkeep(); runBank(d); runBranch(d); if (!BRANCHES || save.branch || !Br.canBuy({ ...save, coins: 1e9 }).ok) spend(hour); tryOldBlood(hour); restock(); fillOrder(); relicWork(d); nineWork(d); runHall(d); trailWatch(d); if (save.order && save.order.mythic && !save.order.seen) { save.order.seen = 1; courtAsked++; } }   // saving up for the second shop once it may be bought
    if (save.branch) tally(Br.step(save, 50, rng, t));
    if (Sh.rescue(save, hour)) note('scrap bin');
  }
  // the night: away for 14 hours
  const from = save.lastSeen, a = St.catchUp(save, t + 14 * H, rng); if (a) tally(a.sold);
  if (save.branch) tally(Br.away(save, from, t + 14 * H, rng, St.awayCap(save)).sold); t += 14 * H; save.lastSeen = t;
  const day = (save.earned || 0) - start;
  console.log(String(d).padStart(3), String(save.coins).padStart(6), String(day).padStart(7), String(made).padStart(5), String(save.sold || 0).padStart(4),
    String(save.slots).padStart(6), String((save.staff || []).length).padStart(6), String(G.makerLevel(save).level).padStart(6), String(G.renownOf(save)).padStart(6),
    String(Rm.sizeOf(save.room).w + '×' + Rm.sizeOf(save.room).d).padStart(6), a ? ' away: ' + a.sold.length + ' sold' : '');
  log.forEach(l => console.log(l)); log = [];
}
const tiers = {}; save.ledger.forEach(e => { if (e.sold) tiers[e.sold.tier] = (tiers[e.sold.tier] || 0) + 1; });
console.log('shards:', Object.entries(shardDays).map(([k, v]) => k + ' d' + v).join(', ') || 'none', ' trail open from', (() => { return 'renown ' + G.renownOf(save); })());
console.log('hall from day', hallDay, save.hall ? 'showing ' + Object.keys(save.hall.shown || {}).length + ', renown +' + G.hallRenown(save) : '');
console.log('stories:', JSON.stringify(Object.fromEntries(Object.entries(save.stories || {}).map(([k, v]) => [k, v.step]))));
console.log('relics:', relics.join(', ') || 'none', ' tried', relicTried, ' blueprints', (save.blueprints || []).join(','), ' relic mats', Object.entries(save.mats).filter(([m]) => ['heartstone','moonsilver','wyrmhide','ghostyew','starcore','moonmead'].includes(m)).map(([m, n]) => m + ' ' + n).join(' '));
console.log('big sales:', JSON.stringify(big), ' orders filled:', orders, '(stories', stories + ')', ' second shop from day', branchDay, save.branch ? 'sold ' + save.branch.sold + ' for ' + save.branch.earned + ' c' : '');
console.log('old-blood: tried', oldTried, 'made', oldMade, ' sold by tier:', tiers);
console.log('spent:', spent, ' trades:', Object.fromEntries(Object.entries(save.trades).map(([k, v]) => [k, lvl(k)])), ' in the back:', Sh.inBack(save).length);
console.log('nine:', mythics.join(', ') || 'none', ' parts', partsMade + '/' + partsTried, ' mythic tries', mythicTried, ' court asked', courtAsked, G.isNine(save) ? ' · MAKER OF THE NINE' : '');
const firstRelic = relics[0] ? relics[0].split(' d')[1] : '-';
console.log('SUMMARY first-relic d' + firstRelic + ' relics ' + relics.length + ' shards ' + (save.shards || []).length + ' parts ' + partsMade + ' mythics ' + mythics.length + ' renown ' + G.renownOf(save));
if (process.env.WHY) for (const id of Object.keys(RELICS)) {
  const r = RELICS[id], st = PATTERNS[r.pattern].station || 'forge';
  console.log('  ' + id.padEnd(14), (save.relicsMade || []).includes(id) ? 'MADE' : (save.blueprints || []).includes(id) ? 'bp' : 'no bp',
    r.pattern, 'pat', lvl(r.pattern), st, Trail.stationLevel(save, st), 'owns', Rm.owns(save, st), 'oldblood', save.cards.filter(c => c.tier === 'oldblood' && c.pattern === r.pattern).length, 'rare', save.cards.filter(c => c.tier === 'rare' && c.pattern === r.pattern).length, 'mat', save.mats[r.mat] || 0);
}
if (BANKING) console.log('bank: borrowed on day', loanDay, ' interest paid', interestPaid, ' owed now', Bank.bankOf(save).loan, ' second shop from day', branchDay);
console.log('EARNED', save.earned, 'coins', save.coins);
if (WEARING) console.log('wear: repairs', repairs, ' broke', broke, ' spent', wearSpent, ' (' + (100 * wearSpent / (save.earned || 1)).toFixed(1) + ' % of earnings)');
