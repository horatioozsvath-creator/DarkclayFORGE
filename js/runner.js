// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// THE RUNNER'S GEAR AND THE ROAD'S DANGER, with no page access: pieces you made, carried by the runner (off the shelves while they're
// carried), potions used up on the road, the chance of harm on the hard roads, and the hunt for a gang. Spared on a gentler Reach.
import { GEAR, ROUTES, TIERS, MONSTERS } from './data.js?v=81';
import { rung } from './growth.js?v=81';
import { threatsOn } from './bank.js?v=81';
import { levelOf, growBy } from './rules.js?v=81';
import { roadX, huntKind } from './monsters.js?v=81';
import * as Rg from './region.js?v=81';
import * as Who from './who.js?v=81';

const D = 24 * 3600000;
const TIER_N = Object.fromEntries(TIERS.map((t, i) => [t.id, i]));
export const slotOf = card => Object.keys(GEAR.slots).find(k => GEAR.slots[k].includes(card.pattern)) || null;
export const isPotion = card => GEAR.potions.includes(card.pattern);
export const gearOf = p => p.gear || (p.gear = {});
export const potionsOf = p => p.potions || (p.potions = []);
const powerOf = c => c ? Math.max(0, GEAR.power[c.tier] - (c.flawed ? 1 : 0)) : 0;
const oiled = p => potionsOf(p).some(x => x.pattern === 'oil');
export function strength(p) {
  const g = gearOf(p);
  const guard = ['head', 'body', 'hands', 'feet', 'offhand'].reduce((a, k) => a + powerOf(g[k]), 0) + powerOf(g.ring) / 2;   // a shield in the off hand guards (milestone 33)
  return { guard, fight: powerOf(g.weapon) * (oiled(p) ? 1.5 : 1) };
}
// a satchel in the PACK slot (milestone 32): how much more of the common things they bring home (1.1 for a Common one, 1.2 a Fine...)
export const packBonus = p => 1 + GEAR.pack * powerOf(gearOf(p).pack);
// a lantern in the LIGHT slot (milestone 33): the road's hurt this much less (0.9 for a Common one, 0.8 a Fine... never below half)
export const lightCut = p => 1 - Math.min(GEAR.lightMax, GEAR.light * powerOf(gearOf(p).light));
// on a road: the chance of being hurt, and of being killed
const dangerOf = (save, route) => route === 'beast' ? (huntKind(save) || {}).danger : GEAR.danger[route];   // the hunt: as dangerous as what's hunted
export function risk(save, p, route, now) {
  const d = dangerOf(save, route); if (!d || !threatsOn(save, now)) return { hurt: 0, die: 0 };
  const s = strength(p), f = 6 / (6 + s.guard + s.fight / 2), x = route === 'beast' ? 1 : roadX(save, now);   // a monster about: every road twice as dangerous
  return { hurt: Math.min(0.9, d.hurt * f * x * lightCut(p) * Who.hurtGift(save)), die: d.die * f * f * x };   // an Orc's gift (milestone 53)
}
// the road's risk level, as the runner is kitted now, and bare: { word, cls, hurt, die, bare, cut } (cut: how much the gear takes off)
export function riskLevel(save, p, route, now) {
  const k = risk(save, p, route, now), d = dangerOf(save, route);
  if (!d) return { word: 'NONE', cls: 'none', hurt: 0, die: 0, bare: 'NONE', cut: 0 };
  if (!threatsOn(save, now)) return { word: 'NONE', cls: 'none', hurt: 0, die: 0, bare: 'NONE', cut: 0, spared: true };
  const lvl = x => GEAR.levels.find(([at]) => x < at)[1];
  const score = k.hurt + 8 * k.die, bareScore = d.hurt + 8 * d.die, word = lvl(score);
  return { word, cls: word.toLowerCase(), hurt: k.hurt, die: k.die, bare: lvl(bareScore), cut: bareScore ? 1 - score / bareScore : 0 };
}
export const hurtNow = (p, now) => !!(p.hurt && now < p.hurt);
// ---------- what they carry: off the shelves while they're carried; a potion is one bottle from a batch ----------
// a grown heirloom (milestone 51) can be taken down from over the door and carried, to grow in this generation's hands; it goes back
// over the door, never to the back room or a shelf
export const carriableLooms = save => (save.heirlooms || []).filter(c => c.grown && slotOf(c));
export function stow(save, c) { if (c.heirloom) save.heirlooms = (save.heirlooms || []).concat(c); else save.cards.unshift(c); }
export function equip(save, p, cardId) {
  const loom = !save.cards.some(x => x.id === cardId) && carriableLooms(save).find(x => x.id === cardId);
  if (loom) {
    const k = slotOf(loom), g = gearOf(p); if (g[k]) stow(save, g[k]);
    g[k] = loom; save.heirlooms = save.heirlooms.filter(x => x !== loom); return { ok: true, slot: k };
  }
  const c = save.cards.find(x => x.id === cardId); if (!c) return { why: 'not found' };
  if (c.sample) return { why: 'a flyer\'s copy is for the shelf' };
  if (isPotion(c)) {
    if (potionsOf(p).length >= GEAR.carry) return { why: 'they carry two at most' };
    potionsOf(p).push({ pattern: c.pattern, name: c.name, tier: c.tier, card: { ...c, id: c.id + '-' + Math.floor(Math.random() * 1e9).toString(36), count: 1 } });
    if ((c.count || 1) > 1) c.count--; else save.cards = save.cards.filter(x => x !== c);
    return { ok: true, potion: true };
  }
  const k = slotOf(c); if (!k) return { why: 'not something to carry' };
  const g = gearOf(p); if (g[k]) stow(save, g[k]);   // the one it replaces back in the back room (an heirloom over the door)
  g[k] = c; save.cards = save.cards.filter(x => x !== c);
  return { ok: true, slot: k };
}
export function unequip(save, p, slot) {
  const g = gearOf(p); if (!g[slot]) return { why: 'nothing there' };
  stow(save, g[slot]); delete g[slot]; return { ok: true };
}
// a bottle taken back: one bottle of its batch, back in the back room
export function takePotion(save, p, i) { const x = potionsOf(p)[i]; if (!x) return { why: 'nothing there' }; potionsOf(p).splice(i, 1); if (x.card) save.cards.unshift(x.card); return { ok: true }; }
// what can be given them: pieces in the back room that fit a slot, and bottles
export const canCarry = c => !c.sample && (isPotion(c) || !!slotOf(c));
// ---------- the road: after a hard trip, what happened to them ----------
export function road(save, p, route, rng, now) {
  const out = { hurt: false, died: false, broke: null, used: [] };
  if (!dangerOf(save, route) || !threatsOn(save, now)) return out;
  const use = name => { const i = potionsOf(p).findIndex(x => x.pattern === name); if (i < 0) return false; out.used.push(potionsOf(p)[i].name); potionsOf(p).splice(i, 1); return true; };
  const r = risk(save, p, route, now);
  use('tonic'); use('oil');   // used up on any hard road
  let died = rng() < r.die, hurt = !died && rng() < r.hurt;
  if (died && use('draught')) { died = false; hurt = true; }
  if (hurt && use('salve')) hurt = false;
  const poultice = hurt && use('poultice');   // a poultice: the hurt mends in half the days, and the healer's paid half
  if (died) { out.died = true; return out; }
  if (hurt) {
    out.hurt = true;
    const days = (GEAR.hurtDays[0] + rng() * (GEAR.hurtDays[1] - GEAR.hurtDays[0])) * (poultice ? GEAR.poultice : 1); p.hurt = now + days * D; out.days = Math.max(1, Math.round(days));
    out.bill = Math.min(save.coins, Math.round(GEAR.healer * (1 + rung(save)) * (poultice ? GEAR.poultice : 1))); save.coins -= out.bill;
    if (poultice) out.poultice = true;
    const g = gearOf(p), armour = ['head', 'body', 'hands', 'feet'].filter(k => g[k] && TIER_N[g[k].tier] < TIER_N.relic && !g[k].heirloom && !g[k].grown);   // never an heirloom, or a piece that grows (milestone 51)
    if (armour.length) { const k = armour[Math.floor(rng() * armour.length)]; out.broke = g[k].name; delete g[k]; }
  }
  return out;
}
// killed: gone from the staff, remembered; the Watch brings back what they carried (not the potions)
export function lose(save, p, route, now) {
  const g = gearOf(p); Object.values(g).forEach(c => stow(save, c));
  save.staff = (save.staff || []).filter(x => x !== p);
  save.memorials = (save.memorials || []).concat({ name: p.name, at: now, where: Rg.routes(save)[route].from });
}
// ---------- the hunt: after the gang, while the trail is warm ----------
export const huntOpen = (save, now) => !!(save.robbery && !save.robbery.done && now < save.robbery.trail);
export function huntOdds(save, p) {
  const h = GEAR.hunt, tonic = potionsOf(p).some(x => x.pattern === 'tonic');
  return Math.min(h.max, h.base + h.fight * strength(p).fight + h.level * (levelOf(p.xp || 0).level - 1) + (tonic ? h.tonic : 0));
}
// the runner back from the hunt (odds taken as they set out): the pieces back and a bounty; or the trail gone cold. A Relic among them:
// the Watch keeps the trail warm until it's found (the hunt can go again)
export function hunt(save, p, rng, now, odds) {
  const r = save.robbery; if (!r || r.done) return { cold: true, pieces: [] };
  if (rng() < odds) {
    r.took.forEach(c => save.cards.unshift(c));
    const bounty = GEAR.bounty * (1 + rung(save)); save.coins += bounty; save.renown = (save.renown || 0) + GEAR.bountyRenown;
    r.done = true; return { won: true, gang: r.gang, pieces: r.took.map(c => c.name), bounty };
  }
  if (r.took.some(c => c.tier === 'relic')) { r.trail = now + 2 * D; return { cold: true, again: true, gang: r.gang, pieces: [] }; }
  r.done = true; return { cold: true, gang: r.gang, pieces: [] };
}
// the odds of bringing the beast down (milestone 34): the kind's, the weapon, their level, a tonic; silver against the wight
export function beastOdds(save, p) {
  const h = MONSTERS.hunt, k = huntKind(save); if (!k) return 0;
  // the bane: silver against the grave-wight (and the drowned); against the High Snow's frozen dead, a lantern (bane: 'light', milestone 54)
  const tonic = potionsOf(p).some(x => x.pattern === 'tonic'), w = gearOf(p).weapon, bane = k.bane || (save.monster.id === 'wight' ? 'silver' : null);
  const silver = bane === 'silver' ? !!(w && w.metal === 'silver') : bane === 'light' ? !!gearOf(p).light : false;
  return Math.min(h.max, k.odds + h.fight * strength(p).fight + h.level * (levelOf(p.xp || 0).level - 1) + (tonic ? h.tonic : 0) + (silver ? h.silver : 0));
}
// what they carry grows (milestone 51): `amount` (a Reach trip's worth) on each grown piece. Returns what grew: [{ who, piece, stage, ... }]
export function growGear(p, amount, rng) {
  const out = [];
  Object.values(gearOf(p)).forEach(c => { if (c && c.grown) growBy(c, p.name, amount, rng).forEach(e => out.push({ who: p.name, ...e })); });
  return out;
}
