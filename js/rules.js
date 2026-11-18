// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// The rules of the working, with no page access (so they run under node for the tests).
// Ported from the Darkclay Zero mockup "The Working" (decision 277). Every function that needs chance takes rng: () => [0,1).
import { TRUE_HEAT, CLEAN_BLOW, KINDS, KC, TIERS, FORGE, STATIONS, METALS, PATTERNS, AFFIXES, FOUND, SPEED_WORDS, BARS, OLD_BLOOD, RELIC_WORK, RELICS, MYTHICS, MYTHIC_WORK, PART_WORK } from './data.js?v=61';

// ---------- trades by practice ----------
export const MAX_LEVEL = 10;
// practice to the next level: a handful of pieces to trade 3, a few dozen to trade 5, a couple of hundred to master it
export const xpToNext = lvl => Math.round(5 * Math.pow(lvl, 1.6));
export function levelOf(xp) {
  let lvl = 1, left = xp || 0;
  while (lvl < MAX_LEVEL && left >= xpToNext(lvl)) { left -= xpToNext(lvl); lvl++; }
  return { level: lvl, into: left, need: lvl >= MAX_LEVEL ? 0 : xpToNext(lvl) };
}
// Practice from before the slower curve (milestone 7): the same level, the same share of the way to the next
const oldToNext = lvl => 4 + 2 * (lvl - 1);
export function convertXp(xp) {
  let l = 1, left = xp || 0;
  while (l < MAX_LEVEL && left >= oldToNext(l)) { left -= oldToNext(l); l++; }
  let out = 0; for (let k = 1; k < l; k++) out += xpToNext(k);
  return out + (l < MAX_LEVEL ? Math.floor(left / oldToNext(l) * xpToNext(l)) : 0);
}
export function convertSave(save) {
  if (save.curve === 2) return false;
  Object.values(save.trades || {}).forEach(t => { t.xp = convertXp(t.xp); });
  if (save.haggle) save.haggle.xp = convertXp(save.haggle.xp);
  (save.staff || []).forEach(p => { p.xp = convertXp(p.xp); });
  save.curve = 2;
  return true;
}
export const slotsFor = l => l < 3 ? 0 : l < 5 ? 1 : l < 7 ? 2 : 3;
// what a finished working teaches: an honest try, more for a better piece and a clean one
export const xpFor = r => r.instant ? 0 : r.dropped ? 1 : 2 + r.tier + (r.cracks === 0 ? 1 : 0);

// ---------- the parts ----------
export function partOptions(patternId) {
  return PATTERNS[patternId].parts.map(p => p.metals
    ? { part: p.part, opts: p.metals.map(id => ({ id, ...METALS[id] })) }
    : { part: p.part, opts: p.opts });
}
export function chosenParts(patternId, picks) {
  return partOptions(patternId).map((p, i) => p.opts[(picks && picks[i]) || 0] || p.opts[0]);
}
export const stationOf = patternId => STATIONS[PATTERNS[patternId].station || 'forge'];
export function bandFor(metal, station = FORGE) {
  let band = (metal.band || station.band).slice();
  if (metal.widen) { const mid = (band[0] + band[1]) / 2, half = (band[1] - band[0]) / 2 * metal.widen; band = [Math.max(0, Math.round(mid - half)), Math.min(100, Math.round(mid + half))]; }
  return band;
}

// ---------- the strip: the base, every line that stacks it, the found tiles in plain tiles' places ----------
export function buildStrip({ parts, level, found = [], kit = {} }) {
  const t = [];
  const add = (k, n) => { for (let i = 0; i < n; i++) t.push({ k, src: '' }); };
  const m0 = parts[0], sp = m0.strip || [10, 3, 4, 3];
  add('GOOD', sp[0]); add('GREAT', sp[1]); add('CRACK', sp[2]); add('HOLD', sp[3]);
  const lines = [{ what: m0.name, how: sp[0] + ' GOOD · ' + sp[1] + ' GREAT · ' + sp[2] + ' CRACK · ' + sp[3] + ' HOLD', col: 'var(--bone)' }];
  const turn = (from, to, n, src, label) => {
    let done = 0;
    for (const x of t) { if (done >= n) break; if (x.k === from && !x.src) { x.k = to; x.src = src; done++; } }
    if (done) lines.push({ what: label, how: done + ' ' + from + ' → ' + to, col: KC[to] });
    return done;
  };
  const cracks = () => t.filter(x => x.k === 'CRACK').length;
  if (level < 3) turn('CRACK', 'HOLD', 99, 'LEARNING', 'Trade ' + level + ' · learning, no cracks yet');
  else {
    const tr = Math.min(Math.floor((level - 1) / 3), cracks() - 1);
    if (tr > 0) turn('CRACK', 'GOOD', tr, 'TRADE', 'Trade ' + level + ' · every 3 levels');
    if (kit.gloves && cracks() > 1) turn('CRACK', 'GOOD', 1, 'GLOVES', 'Gloves worn');
  }
  if (kit.good) { add('GOOD', kit.good); t.slice(-kit.good).forEach(x => x.src = 'KIT'); lines.push({ what: 'A good anvil, a steady hand', how: '+' + kit.good + ' GOOD', col: KC.GOOD }); }
  if (kit.hammer) turn('GOOD', 'GREAT', kit.hammer, 'HAMMER', kit.hammer === 1 ? 'A Fine hammer' : 'An Old-Blood hammer');
  const rare = parts.filter(o => o.rare);
  if (rare.length) turn('GOOD', 'TRUE', rare.length, 'RARE', rare.map(o => o.name).join(', ') + ' (rare)');
  if (level >= 7) turn('GOOD', 'TRUE', 1, 'TRADE', 'Trade 7 · a true hand');
  const fl = found.slice(0, slotsFor(level));
  fl.forEach(id => { const g = t.find(x => x.k === 'GOOD' && !x.src) || t.find(x => x.k === 'GOOD'); if (g) { g.k = 'FOUND'; g.f = id; g.src = 'FOUND'; } });
  if (fl.length) lines.push({ what: 'Found tiles', how: fl.length + ' GOOD → ' + fl.map(id => FOUND[id].short).join(', '), col: KC.FOUND });
  const seen = {};
  t.forEach(x => { const key = x.k + '|' + (x.f || '') + '|' + x.src; seen[key] = (seen[key] || 0) + 1; x.id = key + '|' + seen[key]; });
  return { t, lines };
}

export function shuffle(a, rng) { for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(rng() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a; }
export const counts = list => { const o = {}; KINDS.forEach(k => o[k] = 0); list.forEach(x => o[x.k]++); return o; };
export const left = S => S.rack.filter(x => !x.up);

// ---------- the working ----------
// cfg: { patternId, picks, level, found, kit }
export function newWorking(cfg, rng) {
  const parts = chosenParts(cfg.patternId, cfg.picks), metal = parts[0];
  const kit = cfg.kit || {}, st = stationOf(cfg.patternId), b0 = bandFor(metal, st);
  let band = b0;
  if (kit.widen && kit.widen !== 1) { const mid = (b0[0] + b0[1]) / 2, half = (b0[1] - b0[0]) / 2 * kit.widen; band = [Math.max(0, Math.round(mid - half)), Math.min(100, Math.round(mid + half))]; }
  // the last rework, toward Old-Blood: the band narrower about its middle, WHITE HEAT later
  const master = !!(cfg.master && !cfg.rework && masterBrewGate(cfg.patternId, cfg.picks, cfg.level).ok);
  const relic = cfg.rework && cfg.rework.relic && RELICS[cfg.rework.relic] ? cfg.rework.relic : null;
  const mythic = cfg.rework && cfg.rework.mythic && MYTHICS[cfg.rework.mythic] ? cfg.rework.mythic : null;
  const part = !cfg.rework && cfg.part && MYTHICS[cfg.part.mythic] ? cfg.part : null;
  const old = !relic && !mythic && !part && (!!(cfg.rework && reworkTo(cfg.rework.from) === OLD_BLOOD.tier && cfg.rework.from < OLD_BLOOD.tier) || master);
  // bandX: the station's state (a worn one narrower, the dwarven forge wider: wear.js)
  const narrow = (mythic ? MYTHIC_WORK.band : relic ? RELIC_WORK.band : part ? PART_WORK.band : old ? OLD_BLOOD.band : 1) * (cfg.bandX || 1);
  if (narrow !== 1) { const mid = (band[0] + band[1]) / 2, half = (band[1] - band[0]) / 2 * narrow; band = [Math.max(0, Math.round(mid - half)), Math.min(100, Math.round(mid + half))]; }
  const S = { cfg, parts, metal, level: cfg.level, rng, station: st,
    band, cool: st.cool * (metal.coolX || 1) * (kit.coolX || 1), drain: st.drain, rise: st.rise, over: st.over,
    phase: 'prepare', meter: st.start || 30, inFire: false, shape: 0, worked: 0, cracks: 0, notches: [], crackMarks: [],
    streak: 0, white: 0, whiteHeat: false, earned: false, scaled: 0, overT: 0, strikes: 0, heats: 1, done: false, dropped: false,
    twin: false, warden: false, frost: false, rack: [], lines: [], heatLines: [], slipN: 0, oldBlood: old && !master, master, relic, mythic, part, whites: 0, boils: 0, whiteStreak: mythic ? MYTHIC_WORK.whiteStreak : relic ? RELIC_WORK.whiteStreak : part ? PART_WORK.whiteStreak : old ? OLD_BLOOD.whiteStreak : 0 };
  deal(S);
  return S;
}
export function deal(S) {
  const b = buildStrip({ parts: S.parts, level: S.level, found: S.cfg.found, kit: S.cfg.kit });
  for (let i = 0; i < S.scaled; i++) { const g = b.t.find(x => x.k === 'GOOD' && x.src !== 'SCALE'); if (g) { g.k = 'HOLD'; g.src = 'SCALE'; g.id += '|scaled'; } }
  S.rack = shuffle(b.t.map(x => ({ ...x, up: false, n: 0, isNew: true })), S.rng);
  S.lines = b.lines; S.heatLines = [];
}
function slipIn(S, k, src, note) {
  const down = S.rack.map((x, i) => x.up ? -1 : i).filter(i => i >= 0);
  const at = down.length ? down[Math.floor(S.rng() * down.length)] : S.rack.length;
  S.rack.splice(at, 0, { k, src: '', up: false, n: 0, isNew: true, added: true, id: 'slip|' + k + '|' + (++S.slipN) });
  S.heatLines.push({ what: note, how: '+1 ' + k + ' slipped in', col: KC[k] });
}
export function begin(S) { S.phase = 'work'; shuffle(S.rack, S.rng); S.rack.forEach(x => { x.up = false; x.isNew = true; }); }

// A strike turns over the next tile. Returns what to show: { k, dead, pops: [{ tile | label, gain, why, size, colour, delay }], drop }
export function strike(S) {
  if (S.phase !== 'work' || S.done) return null;
  const pops = [], pop = p => pops.push(p);
  const m = S.meter, [lo, hi] = S.band, shaping = S.shape < 100;
  S.strikes++;
  // struck straight from the fire: taken out by the strike, and judged as it comes out
  if (S.inFire) { S.inFire = false; if (judgeHeat(S)) pop({ label: 'A TRUE HEAT', gain: 'IT HOLDS ITS HEAT', size: 'bigpop', colour: '#ffd25a', trueHeat: true }); }
  S.meter = Math.max(0, S.meter - S.drain * (S.trueHeat ? TRUE_HEAT.drain : 1));

  const st = S.station || FORGE;
  if (m < lo) {
    // the stretcher: too dry, a stitch turns nothing over (no tear); the forge: a learner's cold strike does nothing, a CRACK slips in after
    if (st.dryDead || st.noTake || S.level < 3) { S.streak = 0; S.stirred = true; pop({ label: 'NOTHING', why: st.dryDead || st.noTake ? st.cold : 'TOO COLD · IT DOESN\'T MOVE', size: 'bad', colour: KC.HOLD }); return { k: 'HOLD', dead: true, pops }; }
    if (st.shatter) S.shatterNext = true;   // glass: not a random slip, the very next tile turned
    else slipIn(S, 'CRACK', 'COLD', (st.id === 'bowbench' ? 'Bent cold: it split (bend ' : 'Struck cold (strike ') + S.strikes + ')');
  }
  // the bench: a bend across the grain turns nothing over (the steam still drains)
  if (st.grain && acrossGrain(S)) { S.streak = 0; pop({ label: 'NOTHING', why: 'ACROSS THE GRAIN · WAIT FOR IT', size: 'bad', colour: KC.HOLD }); return { k: 'HOLD', dead: true, pops }; }
  const tore = st.wetTear && m > hi && S.level >= 3;
  if (tore) slipIn(S, 'CRACK', 'WET', 'Too wet: it tore (stitch ' + S.strikes + ')');
  // the kettle: the first stir starts it settling; over the band it boils over (a CRACK from trade 3) and the boil drops
  S.stirred = true;
  const boiled = st.boilOver && m > hi;
  if (boiled) { S.boils++; if (S.level >= 3) slipIn(S, 'CRACK', 'BOIL', 'Boiled over (stir ' + S.strikes + ')' + (S.master ? ': no master\'s brew now' : '')); S.meter = Math.max(0, S.meter - st.boilOver); }
  if (!left(S).length) { deal(S); pop({ label: 'SHUFFLED', gain: 'THE STRIP RAN OUT · EVERY TILE BACK IN', size: 'bigpop', colour: KC.FOUND }); }
  let tk = S.rack.find(x => !x.up);
  if (S.shatterNext) {   // it shattered: this tile is a CRACK (a found tile there swaps places with the first plain one after it)
    S.shatterNext = false;
    if (tk.k === 'FOUND') { const i = S.rack.indexOf(tk), j = S.rack.findIndex((x, n) => n > i && !x.up && x.k !== 'FOUND'); if (j > i) { [S.rack[i], S.rack[j]] = [S.rack[j], S.rack[i]]; tk = S.rack[i]; } }
    if (tk.k !== 'FOUND') { tk.k = 'CRACK'; tk.src = 'SHATTER'; }
    S.heatLines.push({ what: 'Too stiff: it shattered (blow ' + S.strikes + ')', how: 'the next tile a CRACK', col: KC.CRACK });
  }
  // glass too soft: it sags, and SHAPE slips back while shaping
  const sagged = st.sag && m > hi && S.shape < 100;
  if (sagged) S.shape = Math.max(0, S.shape - st.sag);
  tk.up = true; tk.n = S.strikes; tk.peek = false;
  let k = tk.k, why = m < lo ? (st.shatter ? 'TOO STIFF · IT SHATTERED' : st.id === 'bowbench' ? 'BENT COLD · IT SPLIT' : 'STRUCK COLD · A CRACK SLIPPED IN') : sagged ? 'TOO HOT · IT SAGS' : tore ? 'TOO WET · A TEAR SLIPPED IN' : boiled ? (S.level >= 3 ? 'IT BOILED OVER · A CRACK SLIPPED IN' : 'IT BOILED OVER') : '', gain = '', size = '', colour = null, drop = false;
  if (k === 'CRACK' && (S.white > 0 || S.warden)) { why = S.warden ? 'THE WARDEN\'S TILE HOLDS IT' : 'WHITE HEAT · NO CRACK'; S.warden = false; k = 'HOLD'; }
  const mult = S.twin && k !== 'CRACK' ? 2 : 1;
  if (S.twin && k !== 'CRACK') { S.twin = false; why = why || 'TWIN · IT COUNTS TWICE'; }

  if (k === 'CRACK') {
    S.cracks++; S.streak = 0; S.crackMarks.push(S.rng());
    if (shaping) { S.notches.push(S.shape); S.shape = Math.max(0, S.shape - 5); gain = '−5 SHAPE · A MARK ON IT'; }
    else gain = S.cracks >= 2 ? (S.oldBlood ? 'IT STAYS RARE' : 'IT DROPS A TIER') : S.oldBlood ? 'A CRACK · IT WON\'T TAKE OLD-BLOOD' : 'A MARK ON IT · ONE MORE DROPS A TIER';
    if (S.oldBlood && shaping) gain += ' · IT WON\'T TAKE OLD-BLOOD';
    pop({ tile: tk, gain, why, size: 'bad' });
    if (S.cracks >= 2 && !shaping) drop = true;
  } else {
    S.streak++;
    let gk = k;
    if (k === 'FOUND') {
      const f = tk.f; gk = f === 'hollow' ? 'GREAT' : 'GOOD';
      size = 'bigpop'; colour = FOUND[f].glaze;
      if (f === 'ember') { S.meter = st.wetTear ? (S.band[0] + S.band[1]) / 2 : Math.min(S.band[1] - 2, S.meter + 28); why = st.wetTear ? 'EMBER · JUST SUPPLE AGAIN' : 'EMBER · THE HEAT JUMPS BACK'; }
      if (f === 'mender') { if (S.cracks) { S.cracks--; S.crackMarks.pop(); if (S.notches.length) S.notches.pop(); why = 'MENDER · A CRACK\'S MARK CLEARED'; } else why = 'MENDER · NOTHING TO MEND'; }
      if (f === 'twin') { S.twin = true; why = 'TWIN · THE NEXT TILE COUNTS TWICE'; }
      if (f === 'warden') { S.warden = true; why = 'WARDEN · THE NEXT CRACK IS A HOLD'; }
      if (f === 'seer') { left(S).slice(0, 2).forEach(x => x.peek = true); why = 'SEER · THE NEXT TWO SHOWN'; }
      if (f === 'echo') {
        const g = S.rack.slice().reverse().find(x => x.up && x.k === 'GOOD' && x !== tk);
        if (g) { g.up = false; g.n = 0; g.isNew = true; S.rack.splice(S.rack.indexOf(g), 1);
          const down = S.rack.map((x, i) => x.up ? -1 : i).filter(i => i >= 0);
          S.rack.splice(down.length ? down[Math.floor(S.rng() * down.length)] : S.rack.length, 0, g); why = 'ECHO · A GOOD GOES BACK FACE DOWN'; }
        else why = 'ECHO · NO GOOD TO CALL BACK';
      }
      if (f === 'hollow') { slipIn(S, 'CRACK', 'HOLLOW', 'The Hollow King\'s Tile'); why = 'THE HOLLOW KING · A GREAT, AND A CRACK SLIPPED IN'; }
      if (f === 'frost') { S.frost = true; why = 'FROST-KISS · THE PIECE TAKES A FROST SIDE'; }
    }
    const base = shaping ? { GOOD: 6.5, GREAT: 11, TRUE: 16, HOLD: 0 }[gk] : { GOOD: 3, GREAT: 6, TRUE: 15, HOLD: 0 }[gk];
    const clean = shaping && (gk === 'GOOD' || gk === 'GREAT') && S.rng() < (S.trueHeat ? CLEAN_BLOW.trueOdds : CLEAN_BLOW.odds);
    const g = base * mult * (clean ? CLEAN_BLOW.x : 1);
    if (clean) { S.cleanBlows = (S.cleanBlows || 0) + 1; size = 'bigpop'; why = why || 'A CLEAN BLOW · TWICE THE SHAPE'; }
    if (shaping) { S.shape = Math.min(100, S.shape + g); gain = g ? '+' + Math.round(g * 10) / 10 + ' SHAPE' + (clean ? ' · CLEAN' : '') : 'NOTHING GAINED · NOTHING LOST'; }
    else { S.worked += g; gain = g ? '+' + g + ' % WORKED' : 'NOTHING GAINED · NOTHING LOST'; }
    if (k === 'GREAT') size = 'bigpop';
    if (k === 'TRUE') { size = 'bigpop'; if (S.white <= 0) S.whites++; S.earned = true; S.whiteHeat = true; S.white = 4; why = why || 'WHITE HEAT · THE PICK IS YOURS'; }
    pop({ tile: tk, gain, why, size, colour, ring: k === 'TRUE' ? '#fff2c4' : null });
    if (shaping && S.shape >= 100) pop({ label: 'IT\'S MADE', gain: 'NOW EVERY STRIKE PUSHES IT', why: st.close + ' WHENEVER YOU CHOOSE', size: 'bigpop', colour: '#e8c464', delay: 700, ring: '#e8c464', made: true });
    if (S.level >= 5 && S.streak >= (S.whiteStreak || st.whiteStreak || 8) && S.white <= 0) { S.white = 4; S.whites++; S.earned = true; S.whiteHeat = true; S.streak = 0; pop({ label: 'WHITE HEAT', gain: 'NO CRACK FOR 4 s', why: 'THE PICK IS YOURS', size: 'bigpop', colour: '#fff2c4', delay: 600, ring: '#fff2c4' }); }
  }
  return { k, dead: false, pops, drop };
}

// Into the fire and out. Going in with any tile turned (or slipped in) brings every tile back, shuffled.
// the true heat's zone as it stands: [from, to] on the meter
export function trueZone(S) {
  const st = S.station || FORGE, top = Math.min(S.band[1], st.over - TRUE_HEAT.belowOver), w = TRUE_HEAT.w + TRUE_HEAT.widen * Math.min(TRUE_HEAT.chainMax, S.trueRun || 0);
  return [Math.max(S.band[0], top - w), top];
}
// out of the fire (or stoked) at this heat: a true heat, or not. Returns true when it is one.
function judgeHeat(S) {
  const [a, b] = trueZone(S), hit = S.meter >= a && S.meter <= b;
  S.trueHeat = hit; S.trueRun = hit ? (S.trueRun || 0) + 1 : 0;
  if (hit) { S.trueHeats = (S.trueHeats || 0) + 1; if (S.level >= 5) S.streak++; }
  return hit;
}
export function toggleFire(S) {
  if (S.phase !== 'work' || S.done) return null;
  const st = S.station || FORGE;
  if (st.stoke) {   // the kettle: STOKE raises the boil at once; it deals the strip again, as a firing does
    S.meter = Math.min(100, S.meter + st.stoke);
    const tru = judgeHeat(S);
    if (S.rack.some(x => x.up || x.added)) { S.heats++; deal(S); return { shuffled: true, stoked: true, trueHeat: tru }; }
    return { shuffled: false, stoked: true, trueHeat: tru };
  }
  S.inFire = !S.inFire;
  if (!S.inFire) return { shuffled: false, trueHeat: judgeHeat(S) };   // taken out: judged
  S.trueHeat = false;
  if (S.rack.some(x => x.up || x.added)) { S.heats++; deal(S); return { shuffled: true }; }
  return { shuffled: false };
}

// The heat over time. Returns { scaled: true } when a face-down GOOD turns to HOLD from being left in past white.
// the grain turns: with the stave for a while, then across it
export function acrossGrain(S) { const g = (S.station || {}).grain; if (!g) return false; return (S.grainT || 0) % (g.with + g.across) >= g.with; }
export function tick(S, dt) {
  if (S.phase !== 'work' || S.done) return {};
  const out = {};
  if (S.station && S.station.grain) { const was = acrossGrain(S); S.grainT = (S.grainT || 0) + dt; if (acrossGrain(S) !== was) out.grain = true; }
  const keep = S.trueHeat ? TRUE_HEAT.cool : 1;   // a true heat cools at half speed
  if ((S.station || FORGE).stoke) { if (S.stirred) S.meter = Math.max(0, S.meter - S.cool * keep * dt); }
  else if (S.inFire) {
    S.meter = Math.min(100, S.meter + S.rise * dt);
    if (S.meter >= S.over) {
      S.overT += dt;
      if (S.overT > 1) { S.overT = 0; const gd = S.rack.find(x => !x.up && x.k === 'GOOD'); if (gd) { gd.k = 'HOLD'; gd.src = 'SCALE'; gd.id += '|scaled'; S.scaled++; out.scaled = true; } }
    } else S.overT = 0;
  } else S.meter = Math.max(0, S.meter - S.cool * keep * dt);
  if (S.white > 0) { S.white -= dt; if (S.white <= 0) out.whiteEnded = true; }
  return out;
}

export function odds(S) {
  if (S.cfg.rework) { const t = reworkTo(S.cfg.rework.from); return { c: t === 0 ? 100 : 0, f: t === 1 ? 100 : 0, r: t === 2 ? 100 : 0, o: t === 3 ? 100 : 0 }; }
  const w = S.worked, l = S.level;
  let r = Math.max(0, Math.min(40, 5 + w * 0.35 + (l - 3))), f = Math.max(0, Math.min(70, 20 + w * 0.9 + (l - 3) * 2 + ((S.cfg.kit || {}).fine || 0)));
  if (S.cracks >= 1 && S.shape >= 100) { f *= 0.85; r *= 0.85; }
  return { c: Math.max(0, 100 - f - r), f, r };
}
export const PLAIN_ODDS = { f: 20, r: 5 };

// The end of a working. how: 'quench' | 'dropped' | 'instant' (MAKE IT, at the plain odds).
// A second crack after it was made drops it a tier; a Common piece that drops is flawed (worth less), never lost.
// Back in the fire (rework): no roll. It takes (the bar filled, quenched): a tier up.
// A second crack after it took: a tier down (a Common piece stays Common, flawed). A rework teaches, but turns up no found tile.
// The last rework, Rare to Old-Blood, takes only with not one crack; else it stays Rare (never lower), the materials spent.
export const reworkTo = from => Math.min(OLD_BLOOD.tier, from + 1);   // past Old-Blood only by a Relic working (a blueprint), never a plain rework
// a master's brew: the kettle's road to Old-Blood, chosen before the working (a batch can't go back on the fire). A master of the
// brew, moonwell water in the pot; it must finish with not one boil-over and WHITE HEAT reached, or it's an ordinary brew.
export function masterBrewGate(patternId, picks, level) {
  const p = PATTERNS[patternId];
  if (!p || !p.batch) return { ok: false, why: ['only the kettle\'s brews'] };
  const why = [];
  if (level < OLD_BLOOD.level) why.push('trade ' + OLD_BLOOD.level + ' in ' + p.trade.toLowerCase());
  if (!((chosenParts(patternId, picks || [])[1] || {}).rare)) why.push('moonwell water in the pot');
  return { ok: !why.length, why };
}
// can this piece go toward Old-Blood at this trade level? { ok, why: [what's missing] }
export function oldBloodGate(card, level) {
  const p = PATTERNS[card.pattern], why = [];
  if (!p || p.batch || p.makes) return { ok: false, why: ['brews and bottles stop at Rare'] };
  if (card.tier !== TIERS[OLD_BLOOD.tier - 1].id) return { ok: false, why: ['Rare first'] };
  if (card.flawed) why.push('not a flawed piece');
  if (level < OLD_BLOOD.level) why.push('trade ' + OLD_BLOOD.level + ' in ' + p.trade.toLowerCase());
  const src = srcOf(card), rare = chosenParts(card.pattern, src.picks).some(o => o.rare);
  if (!rare && !src.whiteHeat) why.push('a ✶ part or WHITE HEAT in its making');
  return { ok: !why.length, why };
}
export function finish(S, how) {
  S.done = true; S.phase = 'done';
  if (S.cfg.rework) {
    const from = S.cfg.rework.from, dropped = how === 'dropped';
    if (S.mythic) {   // WHITE HEAT three times and not one crack: the Mythic; short of it, the Relic as it was
      const took = !dropped && S.cracks === 0 && S.whites >= MYTHIC_WORK.whites;
      S.dropped = dropped;
      return { rework: true, mythic: S.mythic, from, tier: took ? MYTHIC_WORK.tier : from, failed: !took, flawed: false, dropped, instant: false, odds: odds(S),
        worked: Math.round(S.worked), strikes: S.strikes, heats: S.heats, cracks: S.cracks, whiteHeat: S.whiteHeat, whites: S.whites, earned: took && S.earned, clean: false, frost: S.frost };
    }
    if (S.relic) {   // WHITE HEAT twice and not one crack: the Relic; short of it, the piece (Rare or Old-Blood) as it was
      const took = !dropped && S.cracks === 0 && S.whites >= RELIC_WORK.whites;
      S.dropped = dropped;
      return { rework: true, relic: S.relic, from, tier: took ? RELIC_WORK.tier : from, failed: !took, flawed: false, dropped, instant: false, odds: odds(S),
        worked: Math.round(S.worked), strikes: S.strikes, heats: S.heats, cracks: S.cracks, whiteHeat: S.whiteHeat, whites: S.whites, earned: took && S.earned, clean: false, frost: S.frost };
    }
    if (S.oldBlood) {   // not one crack, or it stays as it was
      const took = !dropped && S.cracks === 0;
      S.dropped = dropped;
      return { rework: true, oldBlood: true, from, tier: took ? reworkTo(from) : from, failed: !took, flawed: false, dropped, instant: false, odds: odds(S),
        worked: Math.round(S.worked), strikes: S.strikes, heats: S.heats, cracks: S.cracks, whiteHeat: S.whiteHeat, earned: took && S.earned, clean: false, frost: S.frost };
    }
    const tier = dropped ? Math.max(0, from - 1) : reworkTo(from);
    S.dropped = dropped;
    return { rework: true, from, tier, flawed: dropped && from === 0, dropped, instant: false, odds: odds(S), worked: Math.round(S.worked), strikes: S.strikes, heats: S.heats,
      cracks: S.cracks, whiteHeat: S.whiteHeat, earned: S.earned && !dropped, clean: false, frost: S.frost };
  }
  const instant = how === 'instant', dropped = how === 'dropped';
  // a part of the Nine: made, or not; no piece comes of it
  if (S.part) {
    const took = !instant && !dropped && S.cracks === 0 && S.whites >= PART_WORK.whites;
    S.dropped = dropped;
    return { part: S.part, took, tier: 0, flawed: false, dropped, instant: false, odds: odds(S), worked: Math.round(S.worked), strikes: S.strikes, heats: S.heats,
      cracks: S.cracks, whiteHeat: S.whiteHeat, whites: S.whites, earned: false, clean: false, frost: false };
  }
  // a master's brew that made it: Old-Blood, no roll
  if (S.master && !instant && !dropped && S.boils === 0 && S.whiteHeat) {
    S.dropped = false;
    return { tier: OLD_BLOOD.tier, master: true, oldBlood: true, flawed: false, dropped: false, instant: false, odds: odds(S), worked: Math.round(S.worked), strikes: S.strikes,
      heats: S.heats, cracks: S.cracks, whiteHeat: true, earned: S.earned, clean: S.cracks === 0 || S.earned, frost: S.frost };
  }
  const o = instant ? { f: PLAIN_ODDS.f, r: PLAIN_ODDS.r } : odds(S);
  const roll = S.rng() * 100;
  let tier = roll < o.r ? 2 : roll < o.r + o.f ? 1 : 0, flawed = false;
  if (dropped) { if (tier === 0) flawed = true; else tier--; }
  S.dropped = dropped;
  const earned = !instant && S.earned && tier >= 1;
  // a successful working turns up a found tile: Fine or better and no crack, or WHITE HEAT reached
  const clean = !instant && !dropped && tier >= 1 && (S.cracks === 0 || S.earned);
  return { tier, flawed, dropped, instant, odds: o, worked: instant ? 0 : Math.round(S.worked), strikes: S.strikes, heats: S.heats, cracks: S.cracks,
    whiteHeat: !instant && S.whiteHeat, earned, clean, frost: !instant && S.frost,
    masterShort: S.master && !instant ? (dropped ? 'dropped' : S.boils ? 'boiled' : 'nowhite') : undefined };
}

// ---------- affixes ----------
function rollAffix(id, rng) {
  const a = AFFIXES[id]; let v = Math.round(a.min + rng() * (a.max - a.min));
  if (a.scale) v = (v / a.scale).toFixed(1).replace(/\.0$/, '');
  return [a.word, a.line.replaceAll('{0}', v), id];
}
// n different affixes from the pattern's pool, none of them in `not`
export function rollAffixes(patternId, n, rng, not = []) {
  const pool = shuffle(PATTERNS[patternId].affixes.filter(id => !not.includes(id)), rng);
  return pool.slice(0, n).map(id => rollAffix(id, rng));
}

// ---------- the card: a finished piece, kept as plain data ----------
export const WORKED_CAP = 50;
// What a piece is worth, from how it was made: one sum for the finished card and for the figure rising at the forge (milestone 29)
export function worthOf({ patternId, picks, tier, worked = 0, cracks = 0, flawed = false }) {
  const p = PATTERNS[patternId], parts = chosenParts(patternId, picks), metal = parts[0], t = TIERS[tier];
  const w = Math.min(WORKED_CAP, worked), rareN = parts.filter(o => o.rare).length, partsVal = parts.slice(1).reduce((v, o) => v * (o.val || 1), 1);
  return Math.max(1, Math.round(p.value * metal.val * t.worth * (1 + w / 200) * (1 + 0.25 * rareN) * partsVal * Math.pow(0.9, cracks) * (flawed ? 0.5 : 1)));
}
// The worth as it stands mid-working: { lo, hi, loWord, hiWord } (lo: what it's worth at the least it can come out as; hi: at the
// best it can still come out as), or null for a working that makes no card (a part of the Nine, a Relic or Mythic, a bottle-maker).
// A second crack once it's made drops it a tier: the least is reckoned with that, as finish() does.
export function worthNow(S) {
  if (S.part || S.relic || S.mythic || PATTERNS[S.cfg.patternId].makes) return null;
  const at = (tier, flawed) => worthOf({ patternId: S.cfg.patternId, picks: S.cfg.picks, tier, worked: S.worked, cracks: S.cracks, flawed });
  const word = t => TIERS[t].name.toUpperCase();
  if (S.cfg.rework) {
    const from = S.cfg.rework.from, to = reworkTo(from), down = S.oldBlood ? from : Math.max(0, from - 1);
    return { lo: at(S.oldBlood ? from : down, !S.oldBlood && from === 0), hi: at(to, false), loWord: word(S.oldBlood ? from : down), hiWord: word(to) };
  }
  if (S.master) return { lo: at(0, false), hi: at(OLD_BLOOD.tier, false), loWord: word(0), hiWord: word(OLD_BLOOD.tier) };
  const o = odds(S), top = o.r > 0 ? 2 : o.f > 0 ? 1 : 0;
  // likely (milestone 30): each tier's worth weighed by its odds as they stand; it climbs as the Fine and Rare odds do
  const likely = Math.round((o.c * at(0, false) + o.f * at(1, false) + o.r * at(2, false)) / Math.max(1, o.c + o.f + o.r));
  return { lo: at(0, false), hi: at(top, false), loWord: word(0), hiWord: word(top), likely };
}
// keep: affixes the piece already carries ([word, line]), kept as far as the tier has room; reworked: how many times back in the fire
const AFFIX_BY_WORD = Object.fromEntries(Object.entries(AFFIXES).map(([id, a]) => [a.word, id]));
export const affixIds = list => list.map(a => AFFIX_BY_WORD[a[0]]).filter(Boolean);
export function makePiece({ patternId, picks, result, picked, maker, rng, now, keep = [], reworked = 0 }) {
  const p = PATTERNS[patternId], parts = chosenParts(patternId, picks), metal = parts[0], tier = TIERS[result.tier];
  let affixes = keep.filter(a => AFFIX_BY_WORD[a[0]]).map(a => [a[0], a[1], AFFIX_BY_WORD[a[0]]]);
  if (picked && affixes.length < tier.affixes && !affixes.some(a => a[2] === picked[2])) affixes.push(picked);
  affixes = affixes.slice(0, tier.affixes);
  affixes = affixes.concat(rollAffixes(patternId, Math.max(0, tier.affixes - affixes.length), rng, affixes.map(a => a[2])));
  if (metal.affix) affixes.push(metal.affix);
  if (result.frost) affixes.push(['Frost-kissed', 'a small frost side on the piece']);
  // WORKED adds up to an eighth over the tier's plain numbers, counted to 50 % (the card still shows the true figure)
  const worked = result.worked, w = Math.min(WORKED_CAP, worked), wk = 1 + w / 100 * 0.25;
  const stats = [];
  if (p.clarity) {   // glass: how clear it is
    const cl = Math.max(1, Math.round(p.clarity * metal.dmg * tier.mult * wk));
    stats.push(['Clarity', String(cl), Math.min(1, cl / 20)]);
  }
  if (p.potency) {   // a brew: its potency (what it mends, how long an oil keeps an edge), and the batch
    const po = Math.max(1, Math.round(p.potency * metal.dmg * tier.mult * wk));
    stats.push(['Potency', String(po), Math.min(1, po / 24)]);
    stats.push(['Batch', '×' + (p.batch || 1), null]);
  }
  if (p.dmg) {
    const lo = Math.max(1, Math.round(p.dmg[0] * metal.dmg * tier.mult * wk)), hi = Math.max(lo + 1, Math.round(p.dmg[1] * metal.dmg * tier.mult * wk));
    stats.push(['Damage', lo + '–' + hi, Math.min(1, hi / BARS.damage)]);
    const word = SPEED_WORDS.filter(s => p.speed >= s[0]).pop()[1];
    stats.push(['Speed', word, Math.min(1, p.speed / BARS.speed)]);
    if (p.range) stats.push(['Range', p.range + ' m', Math.min(1, p.range / 60)]);
    else stats.push(['Reach', p.reach.toFixed(1) + ' m', Math.min(1, p.reach / BARS.reach)]);
    stats.push(['Skill', p.skill, null]);
  }
  if (p.armour) {
    const ar = Math.max(1, Math.round(p.armour * metal.dmg * tier.mult * wk));
    stats.push(['Armour', String(ar), Math.min(1, ar / BARS.armour)]);
    stats.push(['Weight', p.weight <= 3 ? 'light' : 'middling', Math.min(1, p.weight / BARS.weight)]);
  }
  if (p.potency) stats.push(['Keeps', result.flawed ? 'a week' : result.cracks ? 'a month' : 'a season', result.flawed ? .2 : result.cracks ? .6 : 1]);
  else stats.push(['Wear', result.flawed ? 'FLAWED' : result.cracks ? 'NOTCHED' : 'KEEN', result.flawed ? .2 : result.cracks ? .6 : 1]);
  const bonus = Math.round((tier.mult * wk - 1) * 100 / 12);
  const dice = p.dice ? p.dice[0] + 'd' + p.dice[1] + (bonus > 0 ? '+' + bonus : '') : '';
  const worth = worthOf({ patternId, picks, tier: result.tier, worked, cracks: result.cracks, flawed: result.flawed });
  const sid = stationOf(patternId).id, leather = sid === 'stretcher', wood = sid === 'bowbench', brew = sid === 'kettle', glass = sid === 'glass';
  const made = [(leather ? 'Stitched by ' : wood ? 'Bent by ' : brew ? 'Brewed by ' : glass ? 'Blown by ' : 'Forged by ') + maker];
  if (result.instant) made.push('made at once, at the plain odds');
  else {
    made.push('WORKED +' + worked + ' %', result.strikes + (leather ? ' stitches · ' : wood ? ' bends · ' : brew ? ' stirs · ' : glass ? ' blows · ' : ' strikes · ') + result.heats + (leather ? ' soak' : wood ? ' steaming' : brew ? ' stoking' : glass ? ' gather' : ' heat') + (result.heats > 1 ? 's' : ''),
      result.cracks ? result.cracks + ' crack' + (result.cracks > 1 ? 's' : '') : 'no crack');
    if (result.whiteHeat) made.push('WHITE HEAT');
  }
  if (reworked) made.push('back in the fire' + (reworked > 1 ? ' ×' + reworked : ''));
  made.push(parts.map(o => o.name.toLowerCase()).filter(n => n !== 'none' && n !== 'plain').join(' · '));
  return { id: now.toString(36) + Math.floor(rng() * 1e6).toString(36), at: now, pattern: patternId, metal: metal.id, tier: tier.id,
    name: (metal.adj || metal.name) + ' ' + p.name, kind: p.kind, art: p.art, tint: metal.tint, dice, stats, affixes: affixes.map(a => [a[0], a[1]]),
    made, lore: p.lore[result.tier], worth, flawed: result.flawed, maker, count: p.batch || undefined,
    src: { picks: (picks || []).slice(), worked, strikes: result.strikes || 0, heats: result.heats || 0, cracks: result.cracks || 0,
      whiteHeat: !!result.whiteHeat, frost: !!result.frost, instant: !!result.instant, reworked } };
}

// How an older piece was made, for one from before cards kept it (milestone 1 and 2): its metal, plain parts, WORKED from its making line.
export function srcOf(card) {
  if (card.src) return card.src;
  const m = Math.max(0, partOptions(card.pattern)[0].opts.findIndex(o => o.id === card.metal));
  const line = (card.made || []).find(x => /^WORKED \+\d+/.test(x)), worked = line ? +line.match(/\d+/)[0] : 0;
  const cr = (card.made || []).find(x => /^\d+ crack/.test(x)), cracks = cr ? +cr.match(/\d+/)[0] : 0;
  return { picks: [m, 0, 0], worked, strikes: 0, heats: 0, cracks, whiteHeat: (card.made || []).includes('WHITE HEAT'), frost: card.affixes.some(a => a[0] === 'Frost-kissed'), instant: false, reworked: 0 };
}
export const makerOf = card => card.maker || ((card.made || [])[0] || '').replace(/^(Forged|Stitched|Bent|Brewed|Blown) by /, '') || 'an old maker';
// a Relic: the piece out of its Relic working, named, with its own lore and power (its three affixes kept)
export function relicPiece(piece, id) {
  const r = RELICS[id];
  const out = { ...piece, name: r.name, relic: id, power: r.power.slice(), lore: r.lore, made: (piece.made || []).concat('the Relic working · ' + r.name) };
  if (PATTERNS[piece.pattern].batch) out.count = 1;   // a relic brew: the batch boiled down to one bottle
  return out;
}
// a Mythic: the Relic out of its Mythic working, named, its three powers in place of the Relic's one
export function mythicPiece(piece, id) {
  const m = MYTHICS[id];
  const out = { ...piece, name: m.name, mythic: id, powers: m.powers.map(w => w.slice()), lore: m.lore, made: (piece.made || []).concat('the Mythic working · ' + m.name) };
  delete out.power;
  return out;
}
// a working that yields materials, not a piece (the glass's bottles): how many, by the tier it came out
export const yieldOf = (patternId, tier) => { const m = PATTERNS[patternId].makes; return m ? { mat: m.mat, n: m.n[Math.min(tier, m.n.length - 1)] } : null; };
// A piece out of the fire again: the same piece (its id, its maker, the affixes it carried), its tier and its making moved on.
export function remakePiece({ card, res, picked, rng, now }) {
  const src = srcOf(card);
  const result = { tier: res.tier, flawed: res.flawed, worked: src.worked + res.worked, strikes: src.strikes + res.strikes, heats: src.heats + res.heats,
    cracks: src.cracks + res.cracks, whiteHeat: src.whiteHeat || res.whiteHeat, frost: src.frost || res.frost, instant: false };
  const piece = makePiece({ patternId: card.pattern, picks: src.picks, result, picked, maker: makerOf(card), rng, now, keep: card.affixes, reworked: (src.reworked || 0) + 1 });
  piece.id = card.id; piece.at = card.at;
  return piece;
}
