// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// WHERE THINGS COME FROM (milestone 30), with no page access: for any material, every way to get it (a seller, a station that makes
// it, a part forged at once, a runner's roads, the Deep), and when a seller who doesn't have it this hour next will.
import { MATS, SUPPLIERS, FORGED_PARTS, PATTERNS, ROUTES, STATIONS } from './data.js?v=55';
import { linesOf, sells } from './shop.js?v=55';
import { COMMONS } from './staff.js?v=55';
import { partOptions } from './rules.js?v=55';

const roadNames = test => Object.values(ROUTES).filter(r => !r.hunt && test(r)).map(r => r.name);
// [{ kind: 'forged' | 'made' | 'sold' | 'pedlar' | 'runner' | 'deep', word, ...}] in the order worth trying
export function sourcesOf(mat) {
  const m = MATS[mat], out = [];
  if (!m) return out;
  const f = FORGED_PARTS[mat];
  if (f) out.push({ kind: 'forged', from: f.from, makes: f.makes, word: 'Forged at once at the forge: ' + Object.entries(f.from).map(([k, n]) => n + ' ' + MATS[k].name.toLowerCase()).join(', ') + ' makes ' + f.makes + '. No working.' });
  Object.entries(PATTERNS).filter(([, p]) => p.makes && p.makes.mat === mat).forEach(([id, p]) =>
    out.push({ kind: 'made', pattern: id, station: p.station, word: 'Made at the ' + STATIONS[p.station].name.toLowerCase() + ': ' + p.name.toUpperCase() + ', ' + p.makes.n[0] + '–' + p.makes.n[p.makes.n.length - 1] + ' a working.' }));
  SUPPLIERS.filter(s => s.lines.includes(mat)).forEach(s => out.push({ kind: 'sold', who: s.name, word: 'Sold by ' + s.name + ', about ' + m.price + ' c.' }));
  SUPPLIERS.filter(s => (s.rare || []).includes(mat)).forEach(s => out.push({ kind: 'pedlar', who: s.name, word: s.name + ' has it some hours (' + (s.pick || 1) + ' of the rare things each hour), about ' + m.price + ' c.' }));
  if (m.relic) out.push({ kind: 'deep', roads: roadNames(r => r.relic), word: 'Only from below the deep doors: a runner\'s longest road, from RENOWNED.' });
  else if (m.rare) out.push({ kind: 'runner', roads: roadNames(r => r.rare > 0), word: 'A runner finds it on the longer roads: ' + roadNames(r => r.rare > 0).join(', ') + '.' });
  else if (COMMONS.includes(mat)) out.push({ kind: 'runner', roads: roadNames(r => r.commons[1] > 0), word: 'A runner brings it back from any road.' });
  if (mat === 'gem') out.push({ kind: 'runner', roads: roadNames(r => r.gem), word: 'A runner finds one now and then at ' + roadNames(r => r.gem).join(', ').toLowerCase() + '.' });
  return out;
}
// hours until someone sells it (0: now), looking two days ahead; null if no seller ever has it
export function nextSold(mat, hour) {
  for (let h = 0; h <= 48; h++) if (sells(mat, hour + h)) return h;
  return null;
}
// every material a pattern can call for (its parts' options, and a batch's bottles)
export function neededMats() {
  const need = new Set();
  for (const p of Object.values(PATTERNS)) if (p.batch) need.add('bottle');
  for (const id of Object.keys(PATTERNS)) for (const g of partOptions(id)) for (const o of g.opts) { const m = o.mat || o.id; if (m && MATS[m]) need.add(m); }
  return [...need];
}
