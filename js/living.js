// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// A LIVING REACH, with no page access: the word in town each day (some true, some not: what's coming, who's about, what's selling,
// how the regulars are doing after what happened), and the guild fair (one piece entered, judged, a prize for the first three).
import { LIVING, SEASONS, PATTERNS } from './data.js?v=57';
import { rung } from './growth.js?v=57';
import { seasonOf, seasonDay, fairOn } from './town.js?v=57';

const D = 24 * 3600000;
const dayOf = ms => Math.floor(ms / D);
function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (a, rng) => a[Math.floor(rng() * a.length)];
const GOSSIP = [
  'A dragon sleeps under the old quarry, says a man who has never been there.',
  'The ferryman swears the river ran backwards for an hour on Tuesday.',
  'The miller\'s daughter is to marry a delver. The miller is not pleased.',
  'Two drovers came to blows over a goat at the Bell. The goat won.',
  'Someone has been leaving honey cakes on the gallows oak. No one knows who.',
  'The Abbey bells are to be recast, and the abbot wants a maker who can work bronze.',
  'A tinker is selling maps to the deep doors. Every one of them is different.',
  'The Landing has a new inn, and they say the beer is worse than ours.',
  'Lady Corrow\'s steward was seen buying lace. A wedding, or a funeral.',
  'There\'s talk of a toll on the ford road. There\'s always talk of a toll on the ford road.',
  'A crow has learned to say "coin". It lives above the counting house.',
  'The old smith at Dunmere has put down his hammer for good, they say.',
];
// the word in town today: one or two true things first, then a bit of gossip
export function rumours(save, now) {
  const d = dayOf(now), rng = seeded(d * 4099 + 7), out = [], s = seasonOf(d), sd = seasonDay(d);
  const g = save.gang && now < save.gang.until ? save.gang : null, m = save.monster, r = save.robbery;
  if (sd < 2) out.push('The season has turned: ' + s.name.toLowerCase() + '. ' + s.line);
  else if (sd >= LIVING.seasonD - 2) out.push('They say ' + SEASONS[(SEASONS.indexOf(s) + 1) % SEASONS.length].name.toLowerCase() + ' comes early this year.');
  const toFair = (LIVING.fair.at - (d % LIVING.fair.every) + LIVING.fair.every) % LIVING.fair.every;
  if (toFair > 0 && toFair <= 3) out.push('The guild fair is in ' + toFair + (toFair === 1 ? ' day' : ' days') + '. The judges like a piece worth looking at twice.');
  if (g) out.push('Someone saw ' + g.name + ' counting doors on Bridge Street.');
  if (m && m.done === 'kept') out.push('Sergeant Vance has been made captain of the night watch, they say, for holding the lanes.');
  if (m && m.done === 'came') out.push('The carpenters can\'t keep up: half the lanes have something to mend.');
  if (r && r.done && now - r.at < 5 * D) out.push('The Watch drank to your runner at the Bell last night.');
  else if (r && !r.done && now < r.trail) out.push('Ketty Moss\'s stall was turned over by the same lot that robbed you.');
  // what's selling: the pattern you've sold most of lately
  const sold = {}; (save.ledger || []).slice(0, 30).forEach(e => { if (e.sold && e.want && PATTERNS[e.want]) sold[e.want] = (sold[e.want] || 0) + 1; });
  const top = Object.entries(sold).sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] >= 3 && rng() < 0.6) out.push('Your ' + PATTERNS[top[0]].name.toLowerCase() + 's are the talk of the lanes.');
  if (save.branch && rng() < 0.4) out.push('They talk of your shop at the Landing, too.');
  const true2 = out.sort(() => rng() - 0.5).slice(0, 2);
  return true2.concat(pick(GOSSIP, rng));
}
// ---------- the guild fair ----------
const RIVALS = ['Garran Steelhand of the Landing', 'the Ashby sisters', 'Old Wyn of Dunmere', 'Hob the bowyer', 'a journeyman from the Abbey'];
export const fairOpen = (save, now) => fairOn(dayOf(now)) && rung(save) >= LIVING.fair.rung && save.fairDay !== dayOf(now);
export const daysToFair = now => (LIVING.fair.at - (dayOf(now) % LIVING.fair.every) + LIVING.fair.every) % LIVING.fair.every;
// one piece entered (it stays yours): judged on its worth against three of the Reach's makers; a prize for the first three
export function enterFair(save, cardId, now, rng) {
  if (!fairOpen(save, now)) return { why: save.fairDay === dayOf(now) ? 'you\'ve entered this fair' : 'the fair isn\'t on' };
  const c = save.cards.find(x => x.id === cardId); if (!c || c.sample) return { why: 'not one of yours' };
  const rg = rung(save), base = LIVING.fair.rivals[rg], [lo, hi] = LIVING.fair.spread;
  const rivals = [0, 1, 2].map(i => ({ who: RIVALS[(dayOf(now) + i) % RIVALS.length], score: Math.round(base * (lo + rng() * (hi - lo))) })).sort((a, b) => b.score - a.score);
  const place = 1 + rivals.filter(x => x.score > c.worth).length, p = LIVING.fair.prizes[place - 1];
  const coins = p ? p[0] * (1 + rg) : 0, renown = p ? p[1] : 0;
  save.coins += coins; save.renown = (save.renown || 0) + renown; save.fairDay = dayOf(now);
  save.fairs = (save.fairs || []).concat({ day: dayOf(now), place, name: c.name }).slice(-12);
  return { ok: true, place, rivals, coins, renown, name: c.name, worth: c.worth };
}
