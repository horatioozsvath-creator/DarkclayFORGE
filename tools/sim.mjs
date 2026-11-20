// The economy, played by a bot: node tools/sim.mjs [days] [seed]
// Each day: a play session (making pieces at the forge, the shop selling while the game is open), then a night away.
// The bot plays like a steady, middling player: it works each piece to about WORKED +15 %, a crack now and then, and spends on
// shelves, staff, tools and furniture when it can afford them with some to spare. Prints a line a day and when things happen.
import * as R from '../js/rules.js';
import * as Sh from '../js/shop.js';
import * as St from '../js/staff.js';
import * as Mi from '../js/miner.js';
import * as Rm from '../js/room.js';
import * as G from '../js/growth.js';
import * as Town from '../js/town.js';
import * as Br from '../js/branch.js';
import * as Hl from '../js/hall.js';
import * as Trail from '../js/trail.js';
import * as Bank from '../js/bank.js';
import * as Wear from '../js/wear.js';
import * as Th from '../js/thieves.js';
import * as Run from '../js/runner.js';
import * as Mon from '../js/monsters.js';
import * as Liv from '../js/living.js';
import * as Ap from '../js/apprentice.js';
import * as Leg from '../js/legacy.js';
import * as Rg from '../js/region.js';
import * as Mine from '../js/mine.js';
import * as Bed from '../js/bed.js';
import * as Who from '../js/who.js';
import fs from 'node:fs';
import { BRANCH, RELICS, MYTHICS, MATS, PEOPLES } from '../js/data.js';
import { PATTERNS, TOOLS, TIERS, SHELF_LEVELS, OLD_BLOOD, RELIC_WORK } from '../js/data.js';

const days = +process.argv[2] || 7, seed0 = +process.argv[3] || 1, SESSION_MIN = +process.argv[4] || 45;
function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rng = seeded(seed0);
const save = { v: 1, maker: 'Bot', trades: {}, found: ['ember'], chosen: [], picks: {}, cards: [], made: 0,
  coins: 60, mats: { iron: 5, bronze: 2, cord: 3, wrap: 1, ash: 1, wool: 1, strap: 1 }, slots: 4, shelf: [], ledger: [], sold: 0, earned: 0, shopNext: 6, queue: [] };
save.uid = 'sim' + seed0;
// REGION=greyshore: a shop on the coast over the pass (milestone 39); none, the Reach
if (process.env.REGION && process.env.REGION !== 'reach') save.region = process.env.REGION;
// SHOP=kettle, BACKGROUND=miner, PEOPLE=orc (milestone 53): who opens the shop, and what kind; none of them, today's game to the byte
if (process.env.SHOP || process.env.BACKGROUND || process.env.PEOPLE) {
  const people = process.env.PEOPLE || 'human', r = Who.start(save, { people, look: PEOPLES[people].looks[0], background: process.env.BACKGROUND || 'pedlar', shop: process.env.SHOP || 'forge' });
  if (!r.ok) throw new Error(r.why);
}
Sh.fixShelf(save); Rm.fixRoom(save); Sh.fixShelf(save);
// FOUND=0: only the patterns known from the start; otherwise (milestone 33's balance run) every hidden pattern found from day one
// START=n: begin n calendar days later (the town's board, and so the fallen star, is the same in every shop on a day)
const FOUND = process.env.FOUND !== '0';
// (the coast's own patterns only on the coast, milestone 40)
if (FOUND) save.book = { found: Object.keys(PATTERNS).filter(id => PATTERNS[id].hidden && Rg.findsHere(save, id)), tries: [], clues: [], seen: 0 };
const OLD = process.env.OLD !== '0', TOWN = process.env.TOWN !== '0', BRANCHES = process.env.BRANCH !== '0';   // TOWN=0: the bot ignores the notice board   // OLD=0: a run without Old-Blood, to compare
let t = Date.UTC(2026, 10, 1, 9) + (+process.env.START || 0) * 86400000, log = [], made = 0, oldTried = 0, oldMade = 0, spent = { mats: 0, staff: 0, tools: 0, room: 0 };
// FROM=file: a first generation's save at its end (SAVEOUT=file writes one); it's handed on to its apprentice, and the run plays the
// second generation (milestone 38's pace). The heirlooms: the best the old shop has.
if (process.env.FROM) {
  const old = JSON.parse(fs.readFileSync(process.env.FROM, 'utf8')); t = old.lastSeen;
  // REGION=greyshore with FROM: the heir crosses the pass at the handing on (milestone 42)
  const n = Leg.heirloomsFor(Leg.gen(old) + 1), r = Leg.handOn(old, Leg.heirlooms(old).slice(0, n).map(c => c.id), t, process.env.REGION);
  if (!r.ok) { console.log('not handed on: ' + r.why); process.exit(1); }
  Object.keys(save).forEach(k => delete save[k]); Object.assign(save, r.save, { queue: [], shopNext: 6 }); Sh.fixShelf(save); Rm.fixRoom(save); Sh.fixShelf(save);
  console.log('handed on to ' + save.maker + ' (' + save.heirTrait + '), generation ' + save.gen + '; shards: ' + JSON.stringify(save.shardWhere));
}
const H = 3600000, lvl = id => R.levelOf((save.trades[id] || {}).xp || 0).level, note = m => log.push('  ' + m);

// on the trail (CHASE=0 turns it off): from RENOWNED, a pattern with a blueprint whose Relic isn't made yet is practised to trade 7, then
// still made often (for a Rare to work it from, milestone 35), and
// its Old-Blood pieces are kept in the back for the Relic working
const CHASE = process.env.CHASE !== '0';
// a Rare or Old-Blood piece of it to work a Relic from (milestone 43: till there's one, the bot keeps making it, as a player would)
const hasWorkable = id => save.cards.some(c => c.pattern === id && !c.sample && (c.tier === 'rare' || c.tier === 'oldblood'));
// (milestone 42: the region's own Relics; an heir over the pass chases the Tide's, not the Reach's carried blueprints)
const chasing = id => G.rung(save) >= 5 && (save.blueprints || []).some(b => RELICS[b].pattern === id && Rg.relicsIn(Rg.regionId(save)).includes(b) && !(save.relicsMade || []).includes(b));
// off the shelf and out of the Hall, into the back room (for a working)
// what the game's FILL THE SHELVES keeps back (Sh.keepBack: a Relic, a Mythic, a piece ready for its Relic) and a piece marked KEEP:
// the bot puts out only what a player filling the shelves would (milestone 34: it used to shelve Relics, and sell them, by hand)
const forSale = c => !c.sample && !c.keep && !Sh.keepBack(save, c);
function toBack(c) { const sl = Sh.onShelf(save, c.id); if (sl >= 0) Sh.takeDown(save, sl); if (save.hall) for (const k of Object.keys(save.hall.shown || {})) if (save.hall.shown[k] === c.id) delete save.hall.shown[k]; }
// which piece to make: the best worth over materials the bot can make or buy, at its trade
const GLUT = +process.env.GLUT || 6;
function choose(hour) {
  let best = null;
  for (const id of Object.keys(PATTERNS)) {
    if (!Rm.owns(save, PATTERNS[id].station || 'forge') || PATTERNS[id].makes || !Sh.knows(save, id)) continue;
    if (save.shop && save.shop !== 'forge' && G.rung(save) < 2 && (PATTERNS[id].station || 'forge') !== save.shop) continue;   // a new shop of another kind: its own station first, till KNOWN (milestone 53)
    // six of it waiting unsold: make something else, as a player would; unless it's the piece a Relic waits on and the trade isn't there yet
    // (milestone 42: a player chasing a Relic keeps making it; the coast's bench never got there)
    if (Sh.inBack(save).filter(c => c.pattern === id).length >= GLUT && !(CHASE && chasing(id) && (Trail.stationLevel(save, PATTERNS[id].station || 'forge') < RELIC_WORK.level || lvl(id) < RELIC_WORK.pattern || !hasWorkable(id)))) continue;
    const metals = R.partOptions(id)[0].opts;
    metals.forEach((m, mi) => {
      if ((m.level || 1) > lvl(id)) return;
      const picks = [mi, 0, 0], rec = Sh.recipe(id, picks), short = Sh.short(save.mats, rec);
      if (short.some(x => !Sh.sells(x.mat, hour, save))) return;
      const cost = short.reduce((c, x) => c + Sh.priceOf(x.mat, hour, save) * (x.n - x.have), 0);
      if (cost > save.coins) return;
      const o = save.order, forOrder = o && o.pattern === id && (!o.metal || o.metal === m.id) && !Sh.inBack(save).some(x => Sh.fills(o, x));   // making to order
      const worth = PATTERNS[id].value * m.val * 1.4 * (forOrder ? 4 : 1), score = worth - Sh.recipeCost(rec, hour, save) + (lvl(id) < 3 ? 15 : 0) + (CHASE && chasing(id) ? (lvl(id) < OLD_BLOOD.level + 1 ? 250 : 120) : 0);
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
  save.cards.unshift(p); made++; save.benchAt = t;
  if (p.mark) { luckBy.marks[p.mark] = (luckBy.marks[p.mark] || 0) + 1; Sh.noteMark(save, p); }
  if (p.gilded) luckBy.gilded += p.gilded.length; if (p.flawless) luckBy.flawless++; if (p.woke) luckBy.woke++; if (p.grown) luckBy.grown++;
  if (WEARING) { const st = R.stationOf(c.id).id; Wear.addWear(save, st, 'work', t); if (Wear.isBroken(save, st, t)) { broke++; const r = Wear.rebuild(save, st, t); if (r.ok) wearSpent += r.cost; } }
  (save.trades[c.id] = save.trades[c.id] || { xp: 0 }).xp += Math.round(R.xpFor(res) * G.xpMult(save));
  const tag = 'fair';
  if (Sh.place(save, p.id, null, tag) < 0) { /* the shelf is full: it waits in the back */ }
  return true;
}
// THE MINE (MINE=share, milestone 45): the bot opens the trapdoor at KNOWN and spends that share of its workings in the mine: smelting
// when it has the ore, digging its best open seam when it hasn't; it opens the next gallery when it can (buying the oak). Milestone
// 46: it shores a worn or fallen gallery and pumps a flooded best seam, and a seam's worth counts the smelting it takes after. No MINE:
// the mine is never opened, and the run is the same as before milestone 45.
const MINING = +process.env.MINE || 0;
let dug = 0, smelted = 0, mineBars = {}, mineSlot = 0;
// for finding what a change does (milestone 46): DEEPEST=n, the bot opens no gallery past n; NOPOCKET, no pockets; NOSHORE, no shoring
// (with DEEPEST=2 and NOSHORE, the run is release 70's to the byte, but for the shafts line)
const DEEPEST = +process.env.DEEPEST || 9, NOPOCKET = !!process.env.NOPOCKET, NOSHORE = !!process.env.NOSHORE;
// milestone 48: NOSHAFT, the bot never sends a runner down through the mine
const NOSHAFT = !!process.env.NOSHAFT; let shaftTrips = 0, deepFinds = [], relicBought = 0;   // (relicBought: relic materials bought, from the Crown's factor)
const shafts = { shored: 0, oak: 0, coins: 0, falls: 0, pumped: 0, wet: 0, pockets: {} };   // milestone 46
// THE MINERS (milestone 47; MINERS=n, with MINE): the bot hires up to n miners once the trapdoor's open, set to the dearest open seam,
// bare (no gear), and keeps the galleries shored for them
// LUCK=0: no marks, no gilded affixes, no Collector (milestone 49): the game as release 74 was
R.setLuck(process.env.LUCK !== '0');
const luckBy = { marks: {}, gilded: 0, flawless: 0, collector: 0, collectorC: 0, woke: 0, grown: 0, stages: [0, 0, 0, 0, 0], rose: 0 };
// grown pieces that reached a stage (milestone 51), from trips home and hauls dug
// the grow-bed (milestone 52): set up once there's coin to spare, a cutting planted when it has one (heartwood bought when Hollin's
// has it), tended when it looks in, lifted out when it's come up
const bedBy = { day: null, day2: null, grown: 0, tiers: [0, 0, 0, 0], marks: 0, woke: 0, tended: 0, bought: 0, found: 0 };
function bedWork(d, hour) {
  if (!R.luckOn()) return;
  const c = Bed.canBuild(save);
  if (c.ok && save.coins > c.cost + (c.more ? 8000 : 4000)) { Bed.build(save); if (c.more) bedBy.day2 = d; else bedBy.day = d; note(c.more ? 'dug a second grow-bed' : 'set up the grow-bed'); }
  if (!save.growbed) return;
  Bed.bedsOf(save).forEach((b, i) => {
    if (b) { const st = Bed.stateOf(b, t); if (st.ready) { const r = Bed.harvest(save, i, rng, t); if (r.ok) { bedBy.grown++; bedBy.tiers[TIERS.findIndex(x => x.id === r.card.tier)]++; if (r.mark) { bedBy.marks++; luckBy.marks[r.mark] = (luckBy.marks[r.mark] || 0) + 1; } if (r.woke) bedBy.woke++; bedBy.tended += r.tended; } } else if (st.due) Bed.tend(save, i, t); return; }
    const best = m => Bed.patternsFor(save, m).sort((a, b) => PATTERNS[b].value - PATTERNS[a].value)[0];
    let m = Bed.cuttings().find(k => (save.mats[k] || 0) > 0 && best(k));
    if (!m && best('heartwood') && Sh.sells('heartwood', hour, save) && save.coins > 1500) { const b0 = save.coins; if (Sh.buy(save, 'heartwood', 1, hour)) { bedBy.bought++; spent.mats += b0 - save.coins; m = 'heartwood'; } }
    if (m) Bed.plant(save, i, m, best(m), t);
  });
}
const tallyGrew = list => (list || []).forEach(x => (x.grew || []).forEach(e => { luckBy.stages[e.stage]++; if (e.rose) luckBy.rose++; }));
const MINERS_N = +process.env.MINERS || 0, dugBy = { hauls: 0, mats: {}, hurt: 0, beasts: 0, falls: 0, lost: 0, idle: 0 };
function hireMiner() {
  if (!MINING || !MINERS_N || !Mine.isOpen(save) || Mi.minersOf(save).length >= MINERS_N || !St.canHireRole(save, 'miner')) return;
  const c = St.candidates(save, Math.floor(t / H)).find(x => x.role === 'miner');
  if (c && save.coins > St.hireFee(c) + 800 && St.hire(save, c)) note('hired a miner: ' + c.name);
}
function tallyDug(list) { tallyGrew(list); for (const r of list) { dugBy.hauls++; if (!r.lost) dugBy.mats[r.mat] = (dugBy.mats[r.mat] || 0) + r.n; else dugBy.lost++; if (r.hurt) dugBy.hurt++; if (r.beast) dugBy.beasts++; if (r.fell) dugBy.falls++; } }
// what a seam's working is worth with the smelting it takes after: an ore's bars spread over the workings, else what comes up
const seamWorth = (x, hour) => {
  const n = R.yieldOf(Mine.digOf(save), 1, [x.i]).n, sm = R.partOptions('smelt')[0].opts.find(o => o.id === x.ore);
  return sm ? n / Mine.smeltTakes() * R.yieldOf('smelt', 1, [0]).n * Sh.priceOf(sm.bar, hour, save) / (1 + n / Mine.smeltTakes()) : usable(x.ore) ? n * Sh.priceOf(x.ore, hour, save) : 0;
};
// what a seam brings up as it is, worth digging only if something the bot can make takes it (sand without a glass is no use)
const usable = mat => Object.keys(PATTERNS).some(id => !PATTERNS[id].makes && Sh.knows(save, id) && Rm.owns(save, PATTERNS[id].station || 'forge')
  && R.partOptions(id).some(g => g.opts.some(o => (o.mat || o.id) === mat)));
// the shoring: a fall cleared and a worn gallery shored again, the oak bought; a flooded best seam pumped out (milestone 46)
function tendMine(hour) {
  for (let g = 1; g <= Mine.galleries(save); g++) {
    if (!Mine.isFallen(save, g) && !Mine.isWorn(save, g)) continue;
    const c = Mine.shoreCost(save, g), k = c.oak - (save.mats.oak || 0), before = save.coins;
    if (save.coins < c.coins + 300) continue;
    if (k > 0) Sh.buy(save, 'oak', k, hour);
    const r = Mine.shore(save, g); if (r.ok) { shafts.shored++; shafts.oak += r.oak; shafts.coins += before - save.coins; }
  }
}
function work(patternId, picks) {   // a working at a steady player's odds, as makeOne's
  if (!Sh.takeMats(save, Sh.recipe(patternId, picks))) return null;   // smelting takes its ore; the rock takes nothing
  const S = R.newWorking({ patternId, picks, level: R.levelOf((save.trades[R.tradeId(patternId)] || {}).xp || 0).level, found: [], kit: G.kitOf(save) }, rng);
  S.shape = 100; S.worked = 10 + rng() * 15; S.strikes = 24; S.cracks = rng() < 0.4 ? 1 : 0;
  const res = R.finish(S, 'quench'), y = R.yieldOf(patternId, res.tier, picks);
  save.mats[y.mat] = (save.mats[y.mat] || 0) + y.n; if (y.gem) save.mats.gem = (save.mats.gem || 0) + y.gem;
  (save.trades[R.tradeId(patternId)] = save.trades[R.tradeId(patternId)] || { xp: 0 }).xp += Math.round(R.xpFor(res) * G.xpMult(save));
  y.res = res; return y;
}
function mineOne(hour) {
  if (!MINING) return false;
  if (Mine.canOpen(save)) { Mine.open(save, t); note('opened the trapdoor: ' + Mine.nameOf(save)); }
  if (!Mine.isOpen(save)) return false;
  // a maker chasing a Relic spends the workings on it, not in the mine
  if (CHASE && Object.keys(PATTERNS).some(chasing)) return false;
  mineSlot += MINING; if (mineSlot < 1) return false; mineSlot -= 1;
  const nx = Mine.nextGallery(save);
  if (nx && nx.n <= DEEPEST && Mine.level(save) >= nx.level && save.coins > nx.coins + 800) { for (const [m, n] of Object.entries(nx.mats)) { const k = n - (save.mats[m] || 0); if (k > 0) Sh.buy(save, m, k, hour); } if (Mine.openGallery(save).ok) note('opened gallery ' + Mine.galleries(save) + ' of the mine'); }
  // ore enough to smelt: the dearest first
  const ore = Mine.ores(save).filter(o => o.have >= Mine.smeltTakes()).sort((a, b) => Sh.priceOf(b.bar, hour, save) - Sh.priceOf(a.bar, hour, save))[0];
  if (ore) { const y = work('smelt', [ore.i]); if (!y) return false; smelted++; mineBars[y.mat] = (mineBars[y.mat] || 0) + y.n; return true; }
  if (!NOSHORE) tendMine(hour);
  const open = Mine.seams(save).filter(x => x.open && x.level <= Mine.level(save) && !Mine.isFallen(save, x.gallery)).sort((a, b) => seamWorth(b, hour) - seamWorth(a, hour));
  if (open[0] && Mine.isFlooded(save, open[0].gallery, t) && Mine.iced(save)) {   // up in the snow (milestone 54): coal bought for the fire
    shafts.wet++; const k = Mine.fireCoal(open[0].gallery) - (save.mats.coal || 0); if (save.coins > 1000 && k > 0) Sh.buy(save, 'coal', k, hour);
    const r = Mine.pump(save, open[0].gallery, t); if (r.ok) { shafts.pumped++; shafts.coal = (shafts.coal || 0) + r.coal; }
  } else if (open[0] && Mine.isFlooded(save, open[0].gallery, t)) { shafts.wet++; if (save.coins > 1000) { const r = Mine.pump(save, open[0].gallery, t); if (r.ok) { shafts.pumped++; shafts.coins += r.cost; } } }
  const seam = open.find(x => Mine.canDig(save, x.i, t).ok);
  if (!seam) return false;
  const y = work(Mine.digOf(save), [seam.i]); dug++;
  if (!R.partOptions('smelt')[0].opts.some(o => o.id === y.mat)) mineBars[y.mat] = (mineBars[y.mat] || 0) + y.n;
  const sh = NOSHORE ? null : Mine.afterDig(save, seam.gallery, rng() < 0.4 ? 1 : 0, rng, t);   // a steady player's: a rockfall now and then
  if (sh && sh.fell) { shafts.falls++; note('the roof came in: gallery ' + seam.gallery); }   // (milestone 47: this line had slipped into the comment above, so falls went uncounted)
  const k = NOPOCKET ? null : Mine.pocket(save, seam.gallery, y.res.tier, rng, t);
  const df = NOPOCKET ? null : Mine.deepFind(save, seam.gallery, rng, t);   // the bottom's face (milestone 48)
  if (df) { deepFinds.push(df.mat); note('a relic material at the bottom of the mine: ' + df.mat); }
  if (k) { const w = Object.keys(k)[0]; shafts.pockets[w] = (shafts.pockets[w] || 0) + 1; if (k.piece) Sh.place(save, k.piece.id, null, 'fair'); if (k.blueprint) note('a blueprint in a pocket: ' + k.blueprint); }
  return true;
}
// the big sales: a piece over 1,000 c, an Old-Blood piece, and who bought them
const big = { over1000: 0, oldBlood: 0, by: {} };
function tally(entries) { (entries || []).forEach(e => { if (!e.sold) return; if (e.type === 'marks') { luckBy.collector++; luckBy.collectorC += e.sold.price; } if (apIds.has(e.sold.id)) { apSold += e.sold.price; apN++; } if (e.sold.price >= 1000) big.over1000++; if (e.sold.tier === 'oldblood') big.oldBlood++; if (e.sold.price >= 1000 || e.sold.tier === 'oldblood') big.by[e.type] = (big.by[e.type] || 0) + 1; }); }
// a master's last working: a Rare that qualifies (on the shelf or in the back), its materials bought if they're for sale this hour.
// A steady player finishes it with no crack about half the time at trade 6, better with each level after.
function tryOldBlood(hour) {
  if (!OLD) return;
  for (const c of save.cards.filter(x => x.tier === 'rare')) {
    const slot = Sh.onShelf(save, c.id); if (slot >= 0) Sh.takeDown(save, slot);
    if (!Sh.canRework(save, c)) { if (slot >= 0) Sh.place(save, c.id, slot); continue; }
    const cost = Sh.reworkCost(c), short = Sh.short(save.mats, cost);
    const coins = short.reduce((n, x) => n + Sh.priceOf(x.mat, hour, save) * (x.n - x.have), 0);
    if (short.some(x => !Sh.sells(x.mat, hour, save)) || save.coins - coins < 300) { if (slot >= 0) Sh.place(save, c.id, slot); continue; }
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
// the Court's shard order (milestone 38): a Rare asked for, and none in hand. A player reworks a Fine one up (the bot had waited on a
// Rare to come out of a plain working, and the order lapsed again and again)
let courtRw = 0;
function courtRework(hour) {
  const o = save.order; if (!o || !o.shard || save.cards.some(x => !x.sample && !x.keep && x.tier !== 'relic' && x.tier !== 'mythic' && Sh.fills(o, x))) return;   // a Relic is kept for its Mythic, as fillOrder keeps it
  const c = save.cards.filter(x => x.pattern === o.pattern && x.tier === 'fine' && !x.sample).sort((a, b) => b.worth - a.worth)[0]; if (!c) return;
  const slot = Sh.onShelf(save, c.id); if (slot >= 0) Sh.takeDown(save, slot);
  if (!Sh.canRework(save, c)) { if (slot >= 0) Sh.place(save, c.id, slot); return; }
  const cost = Sh.reworkCost(c), short = Sh.short(save.mats, cost);
  if (short.some(x => !Sh.sells(x.mat, hour, save))) { if (slot >= 0) Sh.place(save, c.id, slot); return; }
  short.forEach(x => { const b = save.coins; Sh.buy(save, x.mat, x.n - x.have, hour); spent.mats += b - save.coins; });
  Sh.takeMats(save, cost); courtRw++;
  const took = rng() < Math.min(0.8, 0.4 + 0.05 * lvl(c.pattern));
  if (took) { const p = R.remakePiece({ card: c, res: { tier: 2, flawed: false, worked: 10, strikes: 24, heats: 2, cracks: 0 }, picked: null, rng, now: t }); save.cards[save.cards.indexOf(c)] = p; note('reworked for the Court: ' + p.name); }
}
// following the notice board: what the town wants goes on the shelf at DEAR, in place of what it doesn't (from the back room)
function restock() {
  if (!TOWN || !save.town) return;
  const hot = c => Town.demandOf(save.town, c.pattern) > 0;
  const back = Sh.inBack(save).filter(hot).filter(forSale).sort((a, b) => b.worth - a.worth);
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
  if (r && !r.trip) kit(r);
  if (r && !r.trip && Run.huntOpen(save, t)) { if (St.sendRunner(save, 'gang', t)) hunts++; }
  // the way down through the mine (milestone 48), once it's broken through, while no shard lies below (that way finds none)
  const shaftOk = Mine.atBottom(save) && !NOSHAFT && !Trail.pending(save, 'deep').length && !Trail.pending(save, 'star').length;
  if (r && !r.trip && save.coins > 900 && St.sendRunner(save, shaftOk ? 'shaft' : 'below', t) && shaftOk) shaftTrips++;
  for (const c of save.cards.filter(x => x.tier === 'oldblood' || x.tier === 'rare').sort((a, b) => (b.tier === 'oldblood') - (a.tier === 'oldblood'))) {   // an Old-Blood piece first, else a Rare (milestone 34)
    let g = Sh.relicFor(save, c);
    if (!g.ok && g.why.length === 1 && /back room/.test(g.why[0])) { toBack(c); g = Sh.relicFor(save, c); }
    if (!g.ok) continue;
    const cost = Sh.relicCost(c, g.relic), short = Sh.short(save.mats, cost);
    short.forEach(x => { if (Sh.buy(save, x.mat, x.n - x.have, Math.floor(t / H)) && MATS[x.mat].relic) relicBought += x.n - x.have; });   // the relic material too, from the Crown's factor when it has it
    if (Sh.short(save.mats, cost).length) continue;
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
  for (const id of Rg.nineOf(save)) {
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
    { const had = Object.fromEntries(cost.map(c => [c.mat, save.mats[c.mat] || 0])); buyShort(cost); cost.forEach(c => { if (MATS[c.mat] && MATS[c.mat].relic) relicBought += Math.max(0, (save.mats[c.mat] || 0) - had[c.mat]); }); }   // the relic material from the Crown's factor, when it has it this hour (milestone 34)
    if (!Sh.takeMats(save, cost)) continue;
    mythicTried++;
    if (rng() < 0.25) {
      const p = R.mythicPiece({ ...relic, tier: 'mythic' }, id);
      save.cards[save.cards.indexOf(relic)] = p; save.mythicsMade = (save.mythicsMade || []).concat(id); mythics.push(id + ' d' + day);
      note('ONE OF THE NINE: ' + p.name + (G.isNine(save) ? ' · MAKER OF THE NINE' : '')); if (G.isNine(save) && !save.nineAt) save.nineAt = t;
    }
    return;
  }
}
// the apprentice (milestone 36; APPR=0 turns it off): hired from FAMED when one's looking for work, set to WHAT'S SHORT
const APPR = process.env.APPR !== '0';
let benched = 0, apprDay = null; const apIds = new Set(); let apSold = 0, apN = 0;
function hireApprentice(day) {
  if (!APPR || Ap.apprenticeOf(save) || G.rung(save) < 4) return;
  const c = St.candidates(save, Math.floor(t / H)).find(x => x.role === 'apprentice');
  if (c && save.coins > St.hireFee(c) + 1000 && St.hire(save, c)) { apprDay = day; Ap.apprenticeOf(save).hiredAt = t; note('took on an apprentice: ' + c.name); }
}
// a special order (a story's step too): delivered from the back room if something there fills it
let orders = 0, stories = 0;
function fillOrder() {
  const o = save.order; if (!o) return;
  // on the trail, a Relic whose Mythic isn't made yet is kept for it, not sold to a regular's order
  // from the back room, or off the shelf (milestone 35: a player takes the piece down for an order; the bot had looked only in the back)
  if (o.mythic) return;   // the Court's offer for one of the Nine: kept, as before
  const c = save.cards.filter(x => !x.sample && !x.keep && Sh.fills(o, x) && !(CHASE && x.tier === 'relic' && Rg.relicsIn(Rg.regionId(save)).includes(x.relic) && !(save.mythicsMade || []).some(id => MYTHICS[id].relic === x.relic))).sort((a, b) => a.worth - b.worth)[0];
  if (c) toBack(c);
  if (c && Sh.deliver(save, c.id, t)) { orders++; if (o.story) stories++; }
}
// the second shop: set up once it can be afforded with plenty over, then kept stocked from the back room, best first
let branchDay = null;
function runBranch(day) {
  if (!BRANCHES) return;
  if (!save.branch && Br.canBuy(save).ok && save.coins > BRANCH.cost + 300) { Br.buy(save); branchDay = day; note('opened the second shop at ' + BRANCH.town); }
  if (!save.branch) return;
  const v = Br.viewOf(save), back = Sh.inBack(save).filter(forSale).sort((a, b) => b.worth - a.worth);
  v.shelf.forEach((e, i) => { if (!e && back.length) Sh.place(v, back.shift().id, i); });
  const cost = Rm.shelfCost(v.room); if (cost != null && save.coins - cost > 3000 && back.length > 4) Rm.buy(v, 'shelf');
}
// the runner's kit (KIT=0: none): before a trip, the best piece in the back room for each empty slot, and two potions if there are any
const KITTING = process.env.KIT !== '0';
let hunts = 0;
function kit(r) {
  if (!KITTING) return;
  // never a piece FILL THE SHELVES keeps back (a Relic, a Mythic, one ready for its Relic): a Relic tonic carried is drunk (milestone 35)
  for (const c of Sh.inBack(save).filter(c => !c.sample && !Sh.keepBack(save, c) && Run.canCarry(c)).sort((a, b) => b.worth - a.worth)) {
    if (Run.isPotion(c)) { if (Run.potionsOf(r).length < 2) Run.equip(save, r, c.id); }
    else if (!Run.gearOf(r)[Run.slotOf(c)] || (c.grown && !Run.gearOf(r)[Run.slotOf(c)].grown)) Run.equip(save, r, c.id);   // a grown piece swapped in (milestone 51)
  }
}
// the guild fair: the bot enters its best piece
const fairs = [0, 0, 0, 0];
function fair() { if (!Liv.fairOpen(save, t)) return; const best = save.cards.filter(c => !c.sample).sort((a, b) => b.worth - a.worth)[0]; if (!best) return; const r = Liv.enterFair(save, best.id, t, rng); if (r.ok) fairs[Math.min(3, r.place - 1)]++; }
// monsters (MONSTERS=0 turns them off): the bot arms the Watch from the back room, cheapest first, and sets wards when it has them
const MONSTERING = process.env.MONSTERS !== '0';
let monsters = 0, kept = 0, came = 0, monsterBills = 0, beasts = 0;
function watchDuty() {
  if (!MONSTERING) return;
  Mon.tidy(save, t);
  if (Mon.plan(save, t, rng)) monsters++;
  const m = save.monster, st = Mon.stageOf(save, t);
  if (m && (st === 'rumour' || st === 'sighted')) Mon.kindOf(m).order.forEach((l, i) => { for (const c of Sh.inBack(save).filter(c => Mon.fitsLine(l, c)).sort((a, b) => a.worth - b.worth)) { if (!Mon.lineLeft(save, i)) break; if (Mon.give(save, i, c.id, t).kept) kept++; } });
  // the hunt (milestone 34): a free runner, kitted, goes after it when the odds are even or better
  const rn = St.runnerOf(save);
  if (rn && !rn.trip && Mon.huntOpen(save, t) && !save.monster.hunting) { kit(rn); if (Run.beastOdds(save, rn) >= 0.5 && St.sendRunner(save, 'beast', t)) beasts++; }
  const r = Mon.strike(save, t, rng); if (r) { came++; monsterBills += r.bill; note('MONSTER: ' + r.name + ', ' + r.bill + ' c'); }
  for (const c of Sh.inBack(save).filter(Mon.canWard)) { if (Mon.wardsOf(save).length >= 3) break; Mon.addWard(save, c.id); }
}
// thieves (THIEVES=0 turns them off): the bot fits a lock from SOUGHT, a strongbox from FAMED, and hires a night guard from FAMED
const THIEVING = process.env.THIEVES !== '0', GUARDING = process.env.GUARD !== '0';
let robbed = 0, caught = 0, turned = 0, lostWorth = 0, lostTill = 0;
function security() {
  if (!THIEVING) return;
  if (G.rung(save) >= 3 && save.coins > 1500) Th.buySecurity(save, 'lock');
  if (G.rung(save) >= 4 && save.coins > 4000) Th.buySecurity(save, 'strongbox');
  if (GUARDING && G.rung(save) >= 4 && !St.guardOf(save)) { const c = St.candidates(save, Math.floor(t / H)).find(x => x.role === 'guard'); if (c && save.coins > St.hireFee(c) + 1000) St.hire(save, c); }
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
  Sh.inBack(save).filter(forSale).forEach(c => Sh.place(save, c.id));
}

console.log('day  coins  earned  made sold  slots  staff  maker renown  room  (session ' + SESSION_MIN + ' min a day, then a night away)');
// an heir over the pass (FROM with REGION): the bot can't try things at a station, so it finds the coast's own patterns as a player
// trying with the clues might, one every FINDGAP days (3) from the first (milestone 42)
const FINDGAP = +process.env.FINDGAP || 3, toFindHere = process.env.FROM && !Rg.isReach(save) ? Object.keys(PATTERNS).filter(id => Rg.homeOf(PATTERNS[id]) === Rg.regionId(save) && !Sh.knows(save, id)) : [];
for (let d = 1; d <= days; d++) {
  const start = save.earned || 0;
  if (toFindHere.length && d % FINDGAP === 0) { const id = toFindHere.shift(); save.book = save.book || { found: [], tries: [], clues: [] }; save.book.found = (save.book.found || []).concat(id); note('FOUND: ' + id); }
  // a play session: a piece every ~50 s, the shop open all the while
  save.lastSeen = t;
  for (let s = 0; s < SESSION_MIN * 60; s += 50) {
    const hour = Math.floor(t / H);
    if (!mineOne(hour)) makeOne(hour);
    const c = St.clerkOf(save), clerk = c && !save.unpaid ? St.clerkTerms(c) : null;
    tally(Sh.shopStep(save, 50, rng, t, false, clerk));
    St.payWages(save, 50); tallyGrew(St.resolveTrips(save, t, rng)); { const bm = Ap.step(save, 50, rng, t); benched += bm.length; bm.forEach(r => apIds.add(r.piece.id)); } tallyDug(Mi.step(save, 50, rng, t));
    t += 50000; save.lastSeen = t;
    if (s % 600 === 0) { fair(); watchDuty(); security(); upkeep(); runBank(d); runBranch(d); if (!BRANCHES || save.branch || !Br.canBuy({ ...save, coins: 1e9 }).ok) spend(hour); tryOldBlood(hour); bedWork(d, hour); courtRework(hour); hireApprentice(d); hireMiner(); if (Mi.minersOf(save).length && !NOSHORE) tendMine(hour); restock(); fillOrder(); relicWork(d); nineWork(d); runHall(d); trailWatch(d); if (save.order && save.order.mythic && !save.order.seen) { save.order.seen = 1; courtAsked++; } }   // saving up for the second shop once it may be bought
    if (save.branch) tally(Br.step(save, 50, rng, t));
    if (Sh.rescue(save, hour)) note('scrap bin');
  }
  // the night: away for 14 hours
  const from = save.lastSeen, a = St.catchUp(save, t + 14 * H, rng); if (a) tallyDug(a.dug || []); if (a) tallyGrew(a.trips); if (a) (a.made || []).forEach(c => apIds.add(c.id)); if (a) tally(a.sold);
  if (THIEVING) { const th = Th.night(save, from, t + 14 * H, rng, a ? a.coins : 0); if (th) { if (th.robbed) { robbed++; lostWorth += th.took.reduce((x, c) => x + c.worth, 0); lostTill += th.till; note('ROBBED by ' + th.gang + ': ' + th.took.map(c => c.name).join(', ') + (th.till ? ', ' + th.till + ' c' : '')); } else if (th.caught) caught++; else turned++; } }
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
if (process.env.BACK) { const n = {}; for (const c of Sh.inBack(save)) n[c.pattern] = (n[c.pattern] || 0) + 1; console.log('back by pattern:', JSON.stringify(n)); }
console.log('nine:', mythics.join(', ') || 'none', ' parts', partsMade + '/' + partsTried, ' mythic tries', mythicTried, ' court asked', courtAsked, G.isNine(save) ? ' · MAKER OF THE NINE' : '');
const firstRelic = relics[0] ? relics[0].split(' d')[1] : '-';
console.log('SUMMARY first-relic d' + firstRelic + ' relics ' + relics.length + ' shards ' + (save.shards || []).length + ' parts ' + partsMade + ' mythics ' + mythics.length + ' renown ' + G.renownOf(save));
if (process.env.WHY) for (const id of Object.keys(RELICS)) {
  const r = RELICS[id], st = PATTERNS[r.pattern].station || 'forge';
  console.log('  ' + id.padEnd(14), (save.relicsMade || []).includes(id) ? 'MADE' : (save.blueprints || []).includes(id) ? 'bp' : 'no bp',
    r.pattern, 'pat', lvl(r.pattern), st, Trail.stationLevel(save, st), 'owns', Rm.owns(save, st), 'oldblood', save.cards.filter(c => c.tier === 'oldblood' && c.pattern === r.pattern).length, 'rare', save.cards.filter(c => c.tier === 'rare' && c.pattern === r.pattern).length, 'mat', save.mats[r.mat] || 0);
}
if (process.env.WHY) for (const id of Rg.nineOf(save)) console.log('  nine ' + id.padEnd(13), (save.mythicsMade || []).includes(id) ? 'MADE' : '-', 'shard', Trail.hasShard(save, id) ? 'y' : 'n',
  'parts', [0, 1, 2].filter(i => Trail.hasPart(save, id, i)).length, 'relic', MYTHICS[id].relic, (save.relicsMade || []).includes(MYTHICS[id].relic) ? 'made' : 'not', save.cards.some(c => c.relic === MYTHICS[id].relic && c.tier === 'relic') ? 'held' : 'gone', 'src', MYTHICS[id].shard);
if (BANKING) console.log('bank: borrowed on day', loanDay, ' interest paid', interestPaid, ' owed now', Bank.bankOf(save).loan, ' second shop from day', branchDay);
console.log('EARNED', save.earned, 'coins', save.coins);
if (R.luckOn()) console.log('luck: woke', luckBy.woke, ' grown', luckBy.grown, 'stages', luckBy.stages.slice(2).join('/'), 'rose', luckBy.rose, ' marks', JSON.stringify(luckBy.marks), ' gilded affixes', luckBy.gilded, ' flawless', luckBy.flawless, ' sold to the Collector', luckBy.collector, 'for', luckBy.collectorC, 'c');
if (R.luckOn()) console.log('bed: set up day', bedBy.day, ' second', bedBy.day2, ' grown', bedBy.grown, '(C/F/R/OB ' + bedBy.tiers.join('/') + ')', ' marks', bedBy.marks, ' woke', bedBy.woke, ' tended', bedBy.grown ? (bedBy.tended / bedBy.grown).toFixed(1) : '-', 'days of 3 ·  heartwood bought', bedBy.bought);
if (MINERS_N) console.log('miners: hauls', dugBy.hauls, ' brought', JSON.stringify(dugBy.mats), ' hurt', dugBy.hurt, ' beasts', dugBy.beasts, ' falls on them', dugBy.falls, ' hauls dropped', dugBy.lost);
if (MINING) console.log('mine: dug', dug, ' smelted', smelted, ' galleries', Mine.galleries(save), ' mining trade', Mine.level(save), ' smelting trade', R.levelOf((save.trades.smelt || {}).xp || 0).level, ' brought up', JSON.stringify(mineBars), ' worth', Object.entries(mineBars).reduce((a, [m, n]) => a + Sh.priceOf(m, 0, save) * n, 0), 'c');
if (MINING) console.log('shafts:', JSON.stringify(shafts), ' bottom: relic finds', deepFinds.length, JSON.stringify(deepFinds), ' runners down the mine', shaftTrips, ' relic materials bought', relicBought);
{ const a = Ap.apprenticeOf(save); if (APPR) console.log('apprentice: ' + (a ? a.name + ' (' + (a.trait) + ') from day ' + apprDay + ', made ' + (a.made || 0) + ' (open ' + benched + ') sold ' + apN + ' for ' + apSold + ' spent ' + (a.spent || 0) + '  trades ' + Ap.skills(a).slice(0, 5).map(x => x.id + ' ' + x.level).join(', ') : 'none')); }
if (WEARING) console.log('wear: repairs', repairs, ' broke', broke, ' spent', wearSpent, ' (' + (100 * wearSpent / (save.earned || 1)).toFixed(1) + ' % of earnings)');
if (THIEVING) console.log('thieves: robbed', robbed, ' caught', caught, ' turned away', turned, ' lost pieces worth', lostWorth, ' from the till', lostTill, ' (' + (100 * (lostWorth + lostTill) / (save.earned || 1)).toFixed(1) + ' % of earnings)');
{ const r = St.runnerOf(save); console.log('runner: ' + (r ? r.name + ' guard ' + Run.strength(r).guard + ' fight ' + Run.strength(r).fight : 'none') + ' · hunts', hunts, ' memorials', (save.memorials || []).length, (save.memorials || []).map(m => m.name).join(', ')); }
if (MONSTERING) console.log('monsters:', monsters, ' kept off', kept, ' came', came, ' hunted', beasts, ' trophies', Mon.trophiesOf(save).map(x => x.name).join(', ') || 'none', ' bills', monsterBills, ' (' + (100 * monsterBills / (save.earned || 1)).toFixed(2) + ' % of earnings) · wards', Mon.wardsOf(save).map(c => c.name).join(', ') || 'none');
console.log('guild fairs: first', fairs[0], ' second', fairs[1], ' third', fairs[2], ' no prize', fairs[3]);
// DUMP=path: write the save at the end (for a look at it in the game, slot 3)
if (process.env.DUMP) (await import('node:fs')).writeFileSync(process.env.DUMP, JSON.stringify(save));
if (process.env.SAVEOUT) { save.lastSeen = t; fs.writeFileSync(process.env.SAVEOUT, JSON.stringify(save)); }
