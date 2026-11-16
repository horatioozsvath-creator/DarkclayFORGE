// Handmade clay tiles: every tile its own shape, tilt, clay and thumbprint, the marks scratched in.
// A tile's look is made once and kept, so it looks the same every time it turns over.
import { KC, FOUND } from './data.js?v=4';

const rnd = (a, b) => a + Math.random() * (b - a);
const j = (v, n) => (v + rnd(-n, n)).toFixed(1);
const line = pts => 'M' + pts.map(p => j(p[0], 2.2) + ',' + j(p[1], 2.2)).join(' L');
const ring = (cx, cy, rx, ry, n) => { const p = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2 + 0.3; p.push([cx + Math.cos(a) * rnd(rx - 3, rx + 3), cy + Math.sin(a) * rnd(ry - 3, ry + 3)]); } return line(p); };
const MARK = {
  GOOD: () => [line([[50, 14], [49, 40], [51, 64], [50, 86]])],
  GREAT: () => [line([[38, 14], [37, 50], [39, 86]]), line([[62, 14], [63, 50], [61, 86]])],
  HOLD: () => [ring(50, 50, 27, 29, 12)],
  CRACK: () => [line([[54, 10], [40, 30], [58, 46], [38, 66], [56, 90]])],
  TRUE: () => { const p = []; for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; p.push([50 + Math.cos(a) * 34, 52 + Math.sin(a) * 34]); } return [line(p)]; },
  me: () => [line([[50, 12], [50, 88]]), line([[50, 44], [28, 18]]), line([[50, 44], [72, 18]]), line([[50, 70], [34, 84]])],
  unk: () => [line([[36, 30], [44, 20], [58, 20], [64, 30], [60, 42], [50, 50], [50, 62]]), line([[50, 76], [50, 80]])],
  ember: () => [line([[50, 88], [34, 58], [48, 30], [55, 50], [64, 16], [72, 58], [50, 88]])],
  mender: () => [line([[24, 30], [44, 50], [24, 70]]), line([[76, 30], [56, 50], [76, 70]]), line([[44, 50], [56, 50]])],
  twin: () => [ring(36, 50, 14, 16, 9), ring(64, 50, 14, 16, 9)],
  warden: () => [line([[28, 20], [72, 20], [72, 54], [50, 86], [28, 54], [28, 20]])],
  seer: () => [line([[14, 50], [32, 32], [50, 26], [68, 32], [86, 50], [68, 68], [50, 74], [32, 68], [14, 50]]), ring(50, 50, 8, 8, 7)],
  echo: () => [line([[50, 50], [60, 44], [62, 58], [44, 64], [36, 44], [52, 30], [72, 38], [76, 62], [56, 80], [30, 74]])],
  hollow: () => [line([[18, 72], [24, 30], [38, 54], [50, 22], [62, 54], [76, 30], [82, 72], [18, 72]])],
  frost: () => [line([[50, 12], [50, 88]]), line([[18, 30], [82, 70]]), line([[18, 70], [82, 30]])],
};
const scratch = (k, glaze) => '<svg viewBox="0 0 100 100" aria-hidden="true">' + MARK[k]().map(d =>
  '<path d="' + d + '" fill="none" stroke="rgba(40,18,6,.85)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<path d="' + d + '" fill="none" stroke="' + glaze + '" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(0.6,1.2)"/>').join('') + '</svg>';
const clayStyle = dark => {
  const r = () => rnd(4, 11).toFixed(0) + 'px';
  const l = dark ? rnd(26, 36) : rnd(44, 58), h = rnd(26, 40);
  const bg = dark ? 'radial-gradient(ellipse at 35% 25%, hsl(' + h + ',30%,' + (l + 6) + '%), hsl(' + h + ',34%,' + l + '%) 60%, hsl(' + h + ',36%,' + (l - 8) + '%))'
                  : 'radial-gradient(ellipse at 35% 25%, hsl(' + h + ',42%,' + (l + 10) + '%), hsl(' + h + ',44%,' + l + '%) 60%, hsl(' + h + ',46%,' + (l - 10) + '%))';
  return '--px:' + rnd(30, 70).toFixed(0) + '%; --py:' + rnd(55, 80).toFixed(0) + '%; border-radius:' + r() + ' ' + r() + ' ' + r() + ' ' + r() + '; background:' + bg;
};
function make(t) {
  const f = t.f ? FOUND[t.f] : null;
  const face = '<div class="tile' + (f ? ' found' : '') + '" style="' + clayStyle(false) + '">' + (t.src && t.src !== 'FOUND' ? '<span class="src">' + t.src + '</span>' : '')
    + scratch(f ? t.f : t.k, f ? f.glaze : KC[t.k]) + '<span class="wd">' + (f ? f.short : t.k) + '</span></div>';
  const back = '<div class="tile back" style="' + clayStyle(true) + '">' + scratch('me', '#c99a6c') + '</div>';
  return { face, back, r: rnd(-4, 4).toFixed(1) };
}
const cache = {};
// the look of a strip tile, by its id
export function lookOf(t) { return cache[t.id] || (cache[t.id] = make(t)); }
// the look of a found tile in the bag
export function bagLook(id) { return cache['bag|' + id] || (cache['bag|' + id] = make({ k: 'FOUND', f: id, src: 'FOUND' })); }
export function unknownLook(id) { return cache['unk|' + id] || (cache['unk|' + id] = { face: '<div class="tile back" style="' + clayStyle(true) + '">' + scratch('unk', '#7d725e') + '</div>' }); }
