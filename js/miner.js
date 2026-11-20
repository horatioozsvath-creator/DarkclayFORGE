// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// THE MINERS (milestone 47, docs/MINE-PLAN.md), with no page access: staff who dig at the face on the shop's clock (open, and away up
// to the cap), as the apprentice works at the bench. A haul every `every` minutes from the seam you set them to (or the dearest
// open one), Common or Fine, never Rare: slower than your own hand, and no pockets. Their workings wear the gallery's shoring as
// yours do; a roof that comes in on them, or something out of the old workings (gallery 4), can hurt them, as the road hurts a
// runner. Armour, a weapon, a lantern and a night guard keep them safer. None of the danger on a gentler Reach or in the week of grace.
import { MINERS, MATS, GEAR, GROWN } from './data.js?v=79';
import { levelOf, yieldOf } from './rules.js?v=79';
import * as Mine from './mine.js?v=79';
import * as Run from './runner.js?v=79';
import { rung } from './growth.js?v=79';
import { threatsOn } from './bank.js?v=79';
import * as Rg from './region.js?v=79';

const M = MINERS, D = 24 * 3600000;
export const minersOf = save => (save.staff || []).filter(p => p.role === 'miner');
// how many the mine takes: none till the trapdoor's open, one, a second once the third gallery is
export const cap = save => !Mine.isOpen(save) ? 0 : Mine.galleries(save) >= M.second ? 2 : 1;
export const minutesEach = p => M.every * (p.trait === 'strong' ? M.strong : 1);
const levelOfP = p => levelOf(p.xp || 0).level;
// the odds of a Fine haul, by their level
export const fineOdds = p => Math.min(M.fine[2], M.fine[0] + M.fine[1] * (levelOfP(p) - 1) + (p.trait === 'canny' ? M.canny : 0));
// what a Common haul of a seam is worth as it comes up (the dearest open seam is where an unset miner goes)
export const haulWorth = (save, s) => { const y = yieldOf(Mine.digOf(save), 0, [s.i]); return y.n * ((MATS[y.mat] || {}).price || 0); };
// where they'll dig, and why not: the seam set (p.seam, its id), or the dearest one that can be worked now
export function where(save, p, now) {
  if (!Mine.isOpen(save)) return { why: 'the mine isn\'t open' };
  if (save.unpaid) return { why: 'wages behind: they won\'t go down till they\'re paid' };
  if (Run.hurtNow(p, now)) return { why: 'hurt, resting' };
  if (p.seam === 'rest') return { why: 'resting: you\'ve set them to rest' };
  const all = Mine.seams(save);
  if (p.seam) {
    const s = all.find(x => x.id === p.seam); if (!s) return { why: 'that seam isn\'t in this mine' };
    const c = Mine.canDig(save, s.i, now); return c.ok ? { seam: s } : { why: s.seam.name + ': ' + c.why };
  }
  const can = all.filter(s => Mine.canDig(save, s.i, now).ok).sort((a, b) => haulWorth(save, b) - haulWorth(save, a) || a.i - b.i);
  return can.length ? { seam: can[0] } : { why: 'every open seam is shut (fallen in, or under water)' };
}
// how much the face can hurt them, as they're kitted: armour and a weapon as on the road, a lantern a little more
export const shield = p => { const s = Run.strength(p); return 6 / (6 + s.guard + s.fight / 2) * Run.lightCut(p); };
const guarded = save => (save.staff || []).some(x => x.role === 'guard');
// the odds, as they're kitted now: { fall: hurt if the roof comes in on them, beast: something comes up (gallery 4 and below), hurt by it }
export function risk(save, p, g, now) {
  if (!threatsOn(save, now)) return { fall: 0, beast: 0, hurt: 0 };
  const f = shield(p);
  return { fall: Math.min(0.95, M.hurtFall * f), beast: g >= M.beast.from ? M.beast.odds * (guarded(save) ? M.beast.guard : 1) : 0, hurt: Math.min(0.95, M.beast.hurt * f) };
}
// hurt: off their feet some days, the healer paid; a salve heals it, a poultice halves it
function harm(save, p, rng, now, out) {
  const pots = Run.potionsOf(p), use = name => { const i = pots.findIndex(x => x.pattern === name); if (i < 0) return false; out.used.push(pots[i].name); pots.splice(i, 1); return true; };
  if (use('salve')) return;
  const poultice = use('poultice');
  const days = (GEAR.hurtDays[0] + rng() * (GEAR.hurtDays[1] - GEAR.hurtDays[0])) * (poultice ? GEAR.poultice : 1);
  p.hurt = now + days * D; out.hurt = true; out.days = Math.max(1, Math.round(days));
  out.bill = Math.min(save.coins, Math.round(GEAR.healer * (1 + rung(save)) * (poultice ? GEAR.poultice : 1))); save.coins -= out.bill;
}
// one haul at seam s: { who, seam, mat, n, tier, fell, worn, beast, hurt, days, bill, used, lost }
export function dig(save, p, s, rng, now) {
  const tier = rng() < fineOdds(p) ? 1 : 0, y = yieldOf(Mine.digOf(save), tier, [s.i]);
  const out = { who: p.name, seam: s.seam.name, mat: y.mat, n: y.n, tier, used: [] };
  const k = risk(save, p, s.gallery, now);
  // something out of the old workings: hurt, they drop the haul and get out; kept off, they finish it
  if (k.beast && rng() < k.beast) { out.beast = M.beast.words[Rg.regionId(save)] || M.beast.words.reach; if (rng() < k.hurt) { harm(save, p, rng, now, out); out.lost = true; } }
  if (!out.lost) save.mats[y.mat] = (save.mats[y.mat] || 0) + y.n;
  const sh = Mine.afterDig(save, s.gallery, rng() < M.fall * (p.trait === 'steady' ? M.steady : 1) ? 1 : 0, rng, now);
  if (sh) { out.worn = sh.worn; if (sh.fell) { out.fell = s.gallery; if (!out.hurt && rng() < k.fall) harm(save, p, rng, now, out); } }
  p.xp = (p.xp || 0) + (p.trait === 'quick' ? 1.5 : 1);
  p.hauls = (p.hauls || 0) + 1;
  const grew = Run.growGear(p, GROWN.haul, rng); if (grew.length) out.grew = grew;   // what they carry grows at the face too (milestone 51)
  return out;
}
// the shop's clock runs on by dt seconds: a haul each time their minutes come round. Unpaid, hurt or with nowhere to dig, they wait.
export function step(save, dt, rng, now) {
  const out = [];
  for (const p of minersOf(save)) {
    const need = minutesEach(p) * 60;
    p.digT = (p.digT || 0) + dt;
    while (p.digT >= need) {
      const w = where(save, p, now);
      if (!w.seam) { p.digT = need - 60; break; }   // they look again a minute of the clock later
      p.digT -= need;
      const r = dig(save, p, w.seam, rng, now); out.push(r);
      if (r.hurt) break;
    }
  }
  return out;
}
