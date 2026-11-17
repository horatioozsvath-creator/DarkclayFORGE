// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// THE FLYER: a shop's invitation drawn as a card (600 × 840), shared as an image with the shop's link. Page only (a canvas).
import { TIERS } from './data.js?v=39';
import { ART } from './card.js?v=39';

const TIER = Object.fromEntries(TIERS.map(t => [t.id, t]));
const W = 600, H = 840;
const LONG = new Set(['falchion', 'dagger', 'axe', 'shortbow', 'longbow', 'staff', 'arrows']);
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function fit(g, text, max, size, weight, family = 'Alegreya, Georgia, serif') {
  let s = size; do { g.font = weight + ' ' + s + 'px ' + family; s -= 1; } while (g.measureText(text).width > max && s > 12);
}
function artImage(card) {
  const tint = /^#[0-9a-f]{6}$/i.test(card.tint || '') ? card.tint : '#c9c5be';
  const svg = (ART[card.art] || ART.falchion)(tint).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  return new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
}
// shop: { maker, renown, shown (pieces on the shelves), charm }, card: the featured piece (or null)
export async function drawFlyer(shop, card) {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), t = TIER[(card || {}).tier] || TIER.common;
  g.fillStyle = '#0e0b09'; rr(g, 0, 0, W, H, 40); g.fill();
  g.fillStyle = t.c; rr(g, 12, 12, W - 24, H - 24, 34); g.fill();
  const inner = g.createRadialGradient(W / 2, 260, 40, W / 2, 360, 520); inner.addColorStop(0, '#2a1c12'); inner.addColorStop(1, '#120c08');
  g.fillStyle = inner; rr(g, 32, 32, W - 64, H - 64, 24); g.fill();
  if (t.foil) {   // Old-Blood's sheen across the frame
    g.save(); g.beginPath(); g.roundRect(12, 12, W - 24, H - 24, 34); g.roundRect(32, 32, W - 64, H - 64, 24); g.clip('evenodd');
    const sh = g.createLinearGradient(0, 0, W, H); sh.addColorStop(.3, 'rgba(255,255,255,0)'); sh.addColorStop(.45, 'rgba(255,255,255,.7)'); sh.addColorStop(.6, 'rgba(255,255,255,0)');
    g.fillStyle = sh; g.fillRect(0, 0, W, H); g.restore();
  }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#e8c464'; g.font = '800 22px Alegreya, Georgia, serif'; g.fillText('NOW OPEN · ' + shop.renown, W / 2, 84);
  const name = shop.maker + (/s$/i.test(shop.maker) ? '\'' : '\'s');
  g.fillStyle = '#ece0c6'; fit(g, name, W - 110, 56, 800); g.fillText(name, W / 2, 146);
  g.font = '500 34px Alegreya, Georgia, serif'; g.fillText('forge & shop', W / 2, 196);
  // the featured piece
  const ax = 66, ay = 236, aw = W - 132, ah = 270;
  g.fillStyle = '#2a1c12'; g.fillRect(ax, ay, aw, ah);
  g.setLineDash([10, 8]); g.strokeStyle = 'rgba(240,190,110,.45)'; g.lineWidth = 3; g.strokeRect(ax + 6, ay + 6, aw - 12, ah - 12); g.setLineDash([]);
  if (card) {
    const im = await artImage(card);
    if (im) {
      const ar = im.width / im.height || 3; g.save(); g.beginPath(); g.rect(ax, ay, aw, ah); g.clip(); g.translate(ax + aw / 2, ay + ah / 2);
      if (LONG.has(card.art)) { g.rotate(-Math.atan2(ah, aw)); const w = Math.hypot(aw, ah) * 0.95; g.drawImage(im, -w / 2, -w / ar / 2, w, w / ar); }
      else { const sw = im.width * 0.62, sar = sw / im.height, w = Math.min(aw * 0.9, ah * 0.9 * sar); g.drawImage(im, (im.width - sw) / 2, 0, sw, im.height, -w / 2, -w / sar / 2, w, w / sar); }
      g.restore();
    }
    g.fillStyle = t.c; g.font = '800 22px Alegreya, Georgia, serif'; g.fillText(t.name.toUpperCase() + ' · ' + (card.kind ? String(card.kind).split('·')[0].trim() : 'A PIECE'), W / 2, 548);
    g.fillStyle = '#ece0c6'; fit(g, card.name, W - 120, 42, 800); g.fillText(card.name, W / 2, 594);
    g.fillStyle = '#c8b89a'; g.font = 'italic 500 22px Alegreya, Georgia, serif'; g.fillText('A copy of it is pinned to this flyer', W / 2, 636);
  } else {
    g.fillStyle = '#c8b89a'; g.font = 'italic 500 26px Alegreya, Georgia, serif'; g.fillText('The shelves are waiting', W / 2, ay + ah / 2);
  }
  g.strokeStyle = '#3b2a1c'; g.lineWidth = 2; g.beginPath(); g.moveTo(80, 676); g.lineTo(W - 80, 676); g.stroke();
  g.fillStyle = '#c8b89a'; g.font = '600 24px Alegreya, Georgia, serif'; g.fillText(shop.shown + (shop.shown === 1 ? ' piece' : ' pieces') + ' on the shelves · charm ' + shop.charm, W / 2, 712);
  g.fillStyle = '#e8c464'; g.font = '800 30px Alegreya, Georgia, serif'; g.fillText('Tap the link to walk in →', W / 2, 762);
  g.fillStyle = 'rgba(236,224,198,.4)'; g.font = '700 16px Alegreya, Georgia, serif'; g.fillText('DARKCLAY FORGE', W / 2, 800);
  return cv;
}
export const flyerBlob = cv => new Promise(ok => cv.toBlob(ok, 'image/png'));
