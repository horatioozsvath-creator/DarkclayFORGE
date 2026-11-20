// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// A card's face as it stands on a shelf (the tier's frame, its picture, the price), drawn on a 2D canvas. Shared by the shop in 3D
// (js/diorama.js, as a texture) and the counter view (js/counter.js, laid over the painted shelves). No page access beyond a canvas.
import { TIERS } from './data.js?v=74';
import { ART } from './card.js?v=74';

const TIER = Object.fromEntries(TIERS.map(t => [t.id, t]));
export const CW = 256, CH = 360;
const arts = {};
const LONG = new Set(['falchion', 'dagger', 'axe', 'shortbow', 'longbow', 'staff', 'arrows']);
const CROP = { warhammer: 0.7, mace: 0.66, ring: 0.36, helm: 0.4, goblet: 0.32, pane: 0.45, salve: 0.42, lens: 0.72, cloak: 0.5, satchel: 0.45, mirror: 0.32, ink: 0.6, poultice: 0.6, beads: 0.66, sling: 0.6, shield: 0.36, lantern: 0.26 };   // how much of a wide picture's middle the piece fills
function artImage(p) {
  const tint = /^#[0-9a-f]{6}$/i.test(p.tint || '') ? p.tint : '#c9c5be', key = (p.art || 'falchion') + tint;
  if (arts[key]) return arts[key];
  const svg = (ART[p.art] || ART.falchion)(tint).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  return arts[key] = new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function fitText(g, text, max, size, weight) {
  let s = size; do { g.font = weight + ' ' + s + 'px Alegreya, Georgia, serif'; s -= 1; } while (g.measureText(text).width > max && s > 12);
}
// a canvas texture of the card's front: the tier's frame, its picture, its name, the price on the shelf
// draws into a canvas of its own (CW × CH) and returns it; onDraw(cv) is called after each drawing (the first without the picture,
// then with it)
export async function faceCanvas(c, price, onDraw = () => {}) {
  const t = TIER[c.tier] || TIER.common, cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
  const g = cv.getContext('2d');
  const draw = im => {
    g.clearRect(0, 0, CW, CH);
    roundRect(g, 0, 0, CW, CH, 22); g.fillStyle = '#0e0b09'; g.fill();
    roundRect(g, 6, 6, CW - 12, CH - 12, 18); g.fillStyle = t.c; g.fill();
    roundRect(g, 16, 16, CW - 32, CH - 32, 12); g.fillStyle = '#140e0a'; g.fill();
    g.fillStyle = t.c; g.textAlign = 'center'; g.textBaseline = 'middle';
    fitText(g, t.name.toUpperCase(), CW - 50, 24, 800); g.fillText(t.name.toUpperCase(), CW / 2, 40);
    // the picture, large: a long piece (a blade, a bow) set corner to corner, as it would hang on a display
    const ax = 26, ay = 60, aw = CW - 52, ah = 196;
    g.fillStyle = '#2a1c12'; g.fillRect(ax, ay, aw, ah);
    if (im) {
      const ar = im.width / im.height || 3; g.save(); g.beginPath(); g.rect(ax, ay, aw, ah); g.clip(); g.translate(ax + aw / 2, ay + ah / 2);
      if (LONG.has(c.art)) { g.rotate(-Math.atan2(ah, aw)); const w = Math.hypot(aw, ah) * 0.98; g.drawImage(im, -w / 2, -w / ar / 2, w, w / ar); }
      else {   // the rest sit in the middle of a wide picture: only that middle is drawn, as large as it goes
        const f = CROP[c.art] || 0.62, sw = im.width * f, sar = sw / im.height, w = Math.min(aw * 0.92, ah * 0.92 * sar);
        g.drawImage(im, (im.width - sw) / 2, 0, sw, im.height, -w / 2, -w / sar / 2, w, w / sar);
      }
      g.restore();
    }
    if (c.count > 0) { g.fillStyle = '#0e0b09'; g.fillRect(CW - 86, ay + 4, 56, 38); g.fillStyle = '#ece0c6'; g.font = '800 30px Alegreya, Georgia, serif'; g.fillText('×' + c.count, CW - 58, ay + 24); }
    g.fillStyle = '#e8c464'; fitText(g, price + ' c', CW - 44, 62, 800); g.fillText(price + ' c', CW / 2, 302);
    if (t.foil) {   // Old-Blood's foil, still: a sheen across the frame (only the frame)
      g.save(); g.beginPath(); g.roundRect(6, 6, CW - 12, CH - 12, 18); g.roundRect(16, 16, CW - 32, CH - 32, 12); g.clip('evenodd');
      const sh = g.createLinearGradient(0, 0, CW, CH);
      sh.addColorStop(0.25, 'rgba(255,255,255,0)'); sh.addColorStop(0.42, 'rgba(255,255,255,.75)'); sh.addColorStop(0.5, 'rgba(225,205,255,.5)'); sh.addColorStop(0.62, 'rgba(255,255,255,0)');
      g.fillStyle = sh; g.fillRect(0, 0, CW, CH); g.restore();
    }
    onDraw(cv);
  };
  draw(null);
  draw(await artImage(c));
  return cv;
}
