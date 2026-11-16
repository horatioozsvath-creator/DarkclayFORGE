// Growth, with no page access: tools, the maker's level and perks, renown, the display wall.
import { TOOLS, PERKS, RENOWN, PURSE_STEP, WALL_RENOWN, WALL_SLOTS, PATTERNS, TIERS } from './data.js?v=9';
import { levelOf, MAX_LEVEL } from './rules.js?v=9';

// ---------- tools ----------
export const has = (save, id) => (save.tools || []).includes(id);
export function canBuyTool(save, id) {
  const t = TOOLS[id];
  if (!t || has(save, id)) return { why: 'yours already' };
  if (t.needs && !has(save, t.needs)) return { why: 'needs ' + TOOLS[t.needs].name.toLowerCase() };
  if (save.coins < t.cost) return { why: 'not enough coin' };
  return { ok: true };
}
export function buyTool(save, id) {
  const c = canBuyTool(save, id); if (!c.ok) return c;
  save.coins -= TOOLS[id].cost; save.tools = (save.tools || []).concat(id);
  return { ok: true };
}

// ---------- the maker: level from all practice, a point a level, perks in order ----------
export const practice = save => Object.values(save.trades || {}).reduce((a, t) => a + (t.xp || 0), 0) + ((save.haggle || {}).xp || 0);
export const makerLevel = save => levelOf(Math.floor(practice(save) / 2));
export const perked = (save, id) => (save.perks || []).includes(id);
export const pointsLeft = save => Math.max(0, makerLevel(save).level - 1 - (save.perks || []).length);
export function canTake(save, branch, i) {
  const b = PERKS[branch]; if (!b || !b.perks[i]) return { why: 'no such skill' };
  if (perked(save, b.perks[i].id)) return { why: 'yours already' };
  if (i > 0 && !perked(save, b.perks[i - 1].id)) return { why: 'take ' + b.perks[i - 1].word + ' first' };
  if (pointsLeft(save) < 1) return { why: 'no points: practise to rise a level' };
  return { ok: true };
}
export function takePerk(save, branch, i) {
  const c = canTake(save, branch, i); if (!c.ok) return c;
  save.perks = (save.perks || []).concat(PERKS[branch].perks[i].id);
  return { ok: true };
}
const ALL = Object.values(PERKS).flatMap(b => b.perks);

// what the maker brings to the anvil: tools and perks, gathered in one place for every working (new or rework)
export function kitOf(save) {
  const kit = { hammer: 0, gloves: 0, good: 0, widen: 1, coolX: 1, fine: 0 };
  const add = k => { if (!k) return; for (const [key, v] of Object.entries(k)) kit[key] = key === 'widen' || key === 'coolX' ? kit[key] * v : key === 'hammer' ? Math.max(kit.hammer, v) : kit[key] + v; };
  (save.tools || []).forEach(id => TOOLS[id] && add(TOOLS[id].kit));
  ALL.forEach(p => perked(save, p.id) && add(p.kit));
  return kit;
}

// ---------- renown ----------
export const wallRenown = save => (save.wall || []).reduce((a, id) => { const c = save.cards.find(x => x.id === id); return a + (c ? WALL_RENOWN[c.tier] || 0 : 0); }, 0);
export const renownOf = save => Math.floor(save.renown || 0) + wallRenown(save);
export function rung(save) { const r = renownOf(save); let i = 0; RENOWN.forEach((x, k) => { if (r >= x.at) i = k; }); return i; }
export const nextRung = save => RENOWN[rung(save) + 1] || null;
export const purseMult = save => 1 + PURSE_STEP * rung(save);
// renown earned: a sale at a fair price or better, an order filled
export function fame(save, n) { save.renown = (save.renown || 0) + n * (perked(save, 'word') ? 1.5 : 1); }

// ---------- the display wall: pieces kept, not for sale; they add renown and charm ----------
export const wallSlots = save => WALL_SLOTS + ((save.room || {}).size || 0);
export const onWall = (save, id) => (save.wall || []).includes(id);
export function fixWall(save) {
  const ids = new Set(save.cards.map(c => c.id));
  save.wall = (save.wall || []).filter(id => ids.has(id)).slice(0, wallSlots(save));
}
// a pane hung on the wall goes in the window: twice the charm
export const wallCharm = save => (save.wall || []).reduce((a, id) => { const c = save.cards.find(x => x.id === id); return a + (c ? (TIERS.findIndex(t => t.id === c.tier) + 1) * ((PATTERNS[c.pattern] || {}).windowed ? 2 : 1) : 0); }, 0);
export function hang(save, id) {
  if (onWall(save, id) || !save.cards.some(c => c.id === id) || (save.shelf || []).some(e => e && e.id === id)) return false;
  if ((save.wall || []).length >= wallSlots(save)) return false;
  save.wall = (save.wall || []).concat(id);
  return true;
}
export function unhang(save, id) { save.wall = (save.wall || []).filter(x => x !== id); }

// ---------- perks the shop reads ----------
export const patienceOf = (save, base) => base + (perked(save, 'patient') ? 20 : 0);
export const haggleMult = save => perked(save, 'tongue') ? 1.05 : 1;
export const wageMult = save => perked(save, 'wages') ? 0.8 : 1;
export const capBonus = save => perked(save, 'hours') ? 2 : 0;
// on the slower curve (milestone 7): the mood at Haggling 3 (about twenty haggles), the purse at 4 (about as many as Haggling 6 took before)
export const readLevels = save => perked(save, 'read') ? { mood: 1, purse: 2 } : { mood: 3, purse: 4 };
