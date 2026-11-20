// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// WHERE THINGS COME FROM (milestone 30), with no page access: for any material, every way to get it (a seller, a station that makes
// it, a part forged at once, a runner's roads, the Deep), and when a seller who doesn't have it this hour next will.
import { MATS, FORGED_PARTS, PATTERNS, STATIONS, REGIONS, MINE, GROWBED } from './data.js?v=81';
import * as Rg from './region.js?v=81';
import { linesOf, sells } from './shop.js?v=81';
import { COMMONS } from './staff.js?v=81';
import { partOptions } from './rules.js?v=81';
import { atBottom } from './mine.js?v=81';

// the first gallery a material is dug in, in either mine (milestone 46)
// every region's mine (milestone 54: the High Snow's too, once it isn't hidden, or for a shop up there), and where each is
const digsFor = save => Object.entries(MINE.dig).filter(([r]) => !REGIONS[r].hidden || r === Rg.regionId(save)).map(([, id]) => id), MINE_AT = { dig: 'the mine under the shop (the Reach)', wheal: 'Wheal Isel, under Saltby', delving: 'Aud\'s Delving, under Hearthold' };
const gallery = (mat, save) => Math.min(...digsFor(save).flatMap(id => partOptions(id)[0].opts.filter(o => o.ore === mat).map(o => o.gallery)));
// in the save's region (milestone 39): its suppliers, its roads' names, what its runners bring back; none: the Reach
const roadsOf = save => test => Object.values(Rg.routes(save)).filter(r => !r.hunt && (!r.bottom || atBottom(save)) && test(r)).map(r => r.name);
// [{ kind: 'forged' | 'made' | 'sold' | 'pedlar' | 'runner' | 'deep', word, ...}] in the order worth trying
export function sourcesOf(mat, save) {
  const m = MATS[mat], out = [], roadNames = roadsOf(save), SUPPLIERS = Rg.suppliers(save);
  if (!m) return out;
  const f = FORGED_PARTS[mat];
  if (f) out.push({ kind: 'forged', from: f.from, makes: f.makes, word: 'Forged at once at the forge: ' + Object.entries(f.from).map(([k, n]) => n + ' ' + MATS[k].name.toLowerCase()).join(', ') + ' makes ' + f.makes + '. No working.' });
  Object.entries(PATTERNS).filter(([, p]) => p.makes && p.makes.mat === mat).forEach(([id, p]) =>
    out.push({ kind: 'made', pattern: id, station: p.station, word: 'Made at the ' + STATIONS[p.station].name.toLowerCase() + ': ' + p.name.toUpperCase() + ', ' + p.makes.n[0] + '–' + p.makes.n[p.makes.n.length - 1] + ' a working.' }));
  SUPPLIERS.filter(s => s.lines.includes(mat)).forEach(s => out.push({ kind: 'sold', who: s.name, word: 'Sold by ' + s.name + ', about ' + m.price + ' c.' }));
  SUPPLIERS.filter(s => (s.rare || []).includes(mat)).forEach(s => out.push({ kind: 'pedlar', who: s.name, word: s.name + ' has it some hours (' + (s.pick || 1) + ' of the rare things each hour), about ' + m.price + ' c.' }));
  // the mine's (milestone 45): an ore dug at the face, in this region's mine or another's; a sand dug there too; a bar smelted from ore
  if (digsFor(save).some(id => partOptions(id)[0].opts.some(o => o.ore === mat))) {   // (milestone 46: and what the deep galleries bring up as it is)
    const here = digsFor(save).filter(id => partOptions(id)[0].opts.some(o => o.ore === mat)), mine = id => MINE_AT[id];
    if (here.length) out.push({ kind: 'dug', word: 'Dug at the face: ' + here.map(mine).join(', or ') + '. ' + (gallery(mat, save) > 2 ? 'Gallery ' + gallery(mat, save) + ', from trade ' + MINE.galleries[gallery(mat, save)].level + ' in mining.' : 'Open the trapdoor from KNOWN.') });
  }
  if (mat === 'gem') out.push({ kind: 'dug', word: 'Dug at the face now and then: a Rare haul from a silver vein brings one.' });
  const smelted = partOptions('smelt')[0].opts.filter(o => o.bar === mat);
  if (smelted.length) out.push({ kind: 'smelted', word: 'Smelted at the forge from ' + smelted.map(o => o.name.toLowerCase()).join(' or ') + ', dug in the mine.' });
  // sold only in another region: where (over the pass)
  if (!out.some(x => x.kind === 'sold' || x.kind === 'pedlar')) Object.values(REGIONS).filter(g => g.id !== Rg.regionId(save) && !g.hidden && Rg.soldIn(g.id, mat)).forEach(g =>
    out.push({ kind: 'away', region: g.id, word: 'Sold in ' + g.name + (g.where || (g.id === Rg.REACH ? '' : ', over the pass')) + ', not here.' }));
  if (m.relic) out.push({ kind: 'deep', roads: roadNames(r => r.relic), word: 'Only from below the deep doors: a runner\'s longest road, from RENOWNED.' });
  if (m.relic && atBottom(save)) out.push({ kind: 'dug', word: 'Now and then in the rock at the bottom of the mine, to your own hand at the face; and a runner can go below through the mine.' });
  else if (m.rare && Rg.raresIn(Rg.regionId(save)).includes(mat)) out.push({ kind: 'runner', roads: roadNames(r => r.rare > 0), word: 'A runner finds it on the longer roads: ' + roadNames(r => r.rare > 0).join(', ') + '.' });
  else if (!m.rare && Rg.commons(save, COMMONS).includes(mat)) out.push({ kind: 'runner', roads: roadNames(r => r.commons[1] > 0), word: 'A runner brings it back from any road.' });
  if (mat === 'gem') out.push({ kind: 'runner', roads: roadNames(r => r.gem), word: 'A runner finds one now and then at ' + roadNames(r => r.gem).join(', ').toLowerCase() + '.' });
  // a living cutting for the grow-bed (milestone 52): a runner turns them up on these roads, once there's a bed
  const fd = (GROWBED.finds || {})[mat];
  if (fd) { const rs = roadNames(r => Object.keys(fd).some(k => Rg.routes(save)[k] === r)); out.push({ kind: 'runner', roads: rs, word: (m.below ? 'Only from below the deep doors: a' : 'A') + ' runner turns one up now and then, once there\'s a grow-bed: ' + rs.join(', ').toLowerCase() + '.' }); }
  return out;
}
// hours until someone sells it (0: now), looking two days ahead; null if no seller ever has it
export function nextSold(mat, hour, save) {
  for (let h = 0; h <= 48; h++) if (sells(mat, hour + h, save)) return h;
  return null;
}
// every material a pattern can call for (its parts' options, and a batch's bottles)
export function neededMats() {
  const need = new Set();
  for (const p of Object.values(PATTERNS)) if (p.batch) need.add('bottle');
  for (const id of Object.keys(PATTERNS)) for (const g of partOptions(id)) for (const o of g.opts) { const m = o.mat || o.id; if (m && MATS[m]) need.add(m); }
  return [...need];
}
