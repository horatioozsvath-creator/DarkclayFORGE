// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// BEHIND THE COUNTER: the shop seen from behind your counter, in four fixed views (the counter facing the door, the left wall, the
// right wall, turned round to the workshop doorway). Each view is a painted backdrop (tools/backdrops.py: the room, and the counter
// cut out to stand in front of the customers), with what changes laid over it in 2D: your cards on the painted shelves (each card's
// face skewed onto its place), the customers as pictures at their standing spots, and the places and the doorway to tap.
// The pure parts (fit, the skew, who stands where) are exported for the tests; create() needs a page.
import { faceCanvas, CW, CH } from './cardface.js?v=44';

export const VIEWS = ['left', 'counter', 'right', 'back'];
export const VIEW_WORD = { left: 'LEFT WALL', counter: 'THE COUNTER', right: 'RIGHT WALL', back: 'THE BACK ROOM' };
const BACKDROPS = 'assets/backdrops/', BACKDROPS_V = '?b=4';   // bump b when tools/backdrops.py renders new pictures
const FOLK = 'assets/folk/', FOLK_V = '?f=1';

// a picture rendered at rw × rh shown to cover a box of w × h: its scale and where its corner lands
export function cover(w, h, rw, rh) { const s = Math.max(w / rw, h / rh); return { s, ox: (w - rw * s) / 2, oy: (h - rh * s) / 2 }; }
// the shape a box wants: the wide pictures for a box wider than it is tall, else the upright ones
export const shapeFor = (w, h) => w / h >= 1.25 ? 'wide' : 'tall';

// the CSS transform that lays a w × h picture onto a quad (its corners in order: bottom-left, bottom-right, top-right, top-left)
export function quadMatrix(w, h, q) {
  // the unit square to the quad (Heckbert): corners (0,0) tl, (1,0) tr, (1,1) br, (0,1) bl
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = [q[3], q[2], q[1], q[0]];
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = den ? (dx3 * dy2 - dx2 * dy3) / den : 0, hh = den ? (dx1 * dy3 - dx3 * dy1) / den : 0;
  const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, c = x0, d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3, f = y0;
  // then the picture's own size into the unit square: divide u by w and v by h
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, c, f, 0, 1];
  return 'matrix3d(' + m.map(v => +v.toFixed(8)).join(',') + ')';
}
// a point through that same mapping (for the tests: the picture's corners land on the quad's)
export function mapPoint(w, h, q, u, v) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = [q[3], q[2], q[1], q[0]];
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3, den = dx1 * dy2 - dx2 * dy1;
  const g = den ? (dx3 * dy2 - dx2 * dy3) / den : 0, hh = den ? (dx1 * dy3 - dx3 * dy1) / den : 0;
  const s = u / w, t = v / h, z = g * s + hh * t + 1;
  return [((x1 - x0 + g * x1) * s + (x3 - x0 + hh * x3) * t + x0) / z, ((y1 - y0 + g * y1) * s + (y3 - y0 + hh * y3) * t + y0) / z];
}

// ---------- the customers: who looks like whom (stand-in pictures until milestone 26), and where each one stands ----------
export const FOLK_LOOKS = { human: 1.8, dwarf: 1.35, goblin: 1.1, orc: 1.95 };   // a picture's height in metres
const BY_TYPE = { guard: 'orc', delver: 'dwarf', traveller: 'goblin' };
const hash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
export function lookOf(c) {
  if (!c) return 'human';
  if (BY_TYPE[c.type] && hash(c.who) % 3) return BY_TYPE[c.type];
  const k = Object.keys(FOLK_LOOKS); return k[hash(c.who) % k.length];
}
// the queue to the spots: the front of it at the counter (spot 0), the rest behind, as many as there are spots
export const standing = (queue, spots) => (queue || []).slice(0, spots).map((c, i) => ({ c, spot: i, look: lookOf(c) }));

// ---------- the view on the page ----------
let data = null;
const load = () => data || (data = fetch(BACKDROPS + 'backdrops.json' + BACKDROPS_V).then(r => r.json()));
const crops = {};
// a picture's drawn part (its transparent margin cut away), as fractions of its size
function cropOf(url) {
  return crops[url] || (crops[url] = new Promise(ok => {
    const im = new Image(); im.onload = () => {
      const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const g = cv.getContext('2d'); g.drawImage(im, 0, 0);
      let px; try { px = g.getImageData(0, 0, im.width, im.height).data; } catch (e) { ok({ im, x0: 0, y0: 0, x1: 1, y1: 1 }); return; }
      let x0 = im.width, y0 = im.height, x1 = 0, y1 = 0;
      for (let y = 0; y < im.height; y += 2) for (let x = 0; x < im.width; x += 2) if (px[(y * im.width + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      ok({ im, x0: x0 / im.width, y0: y0 / im.height, x1: (x1 + 2) / im.width, y1: (y1 + 2) / im.height });
    }; im.onerror = () => ok(null); im.src = url;
  }));
}

// host: an empty element. on: { place(kind, i), workshop(), turned(view) }
export function create(host, on = {}) {
  host.classList.add('cview');
  host.innerHTML = '<div class="cv-stage"><img class="cv-bg" alt=""><div class="cv-cards"></div><div class="cv-folk"></div><img class="cv-fg" alt=""><svg class="cv-hot"></svg></div>'   // back to front: the room, the walls' cards, the customers, the counter
    + '<div class="cv-turns">' + VIEWS.map(v => '<button class="seg" data-cv="' + v + '">' + (v === 'left' ? '◀ ' : '') + VIEW_WORD[v] + (v === 'right' ? ' ▶' : '') + '</button>').join('') + '</div>';
  const stage = host.querySelector('.cv-stage'), bg = host.querySelector('.cv-bg'), fg = host.querySelector('.cv-fg'), folk = host.querySelector('.cv-folk'), cards = host.querySelector('.cv-cards'), hot = host.querySelector('.cv-hot');
  let view = 'counter', last = null, token = 0;
  host.querySelectorAll('[data-cv]').forEach(b => b.onclick = () => turn(b.dataset.cv));
  // a swipe across the picture turns to the next view
  let sx = null;
  stage.addEventListener('pointerdown', e => { sx = e.clientX; });
  stage.addEventListener('pointerup', e => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) { const i = VIEWS.indexOf(view); turn(VIEWS[(i + (dx < 0 ? 1 : -1) + VIEWS.length) % VIEWS.length]); } });
  function turn(v) { if (v === view) return; view = v; stage.classList.add('turning'); setTimeout(() => stage.classList.remove('turning'), 220); draw(); if (on.turned) on.turned(v); }
  async function draw() {
    const save = last; if (!save) return;
    const my = ++token, d = await load(); if (my !== token) return;
    host.querySelectorAll('[data-cv]').forEach(b => b.classList.toggle('go', b.dataset.cv === view));
    const W = stage.clientWidth, H = stage.clientHeight, shape = shapeFor(W, H), rec = d[view] && d[view][shape]; if (!rec) return;
    const [rw, rh] = rec.size, { s, ox, oy } = cover(W, H, rw, rh), at = ([x, y]) => [ox + x * s, oy + y * s];
    bg.src = BACKDROPS + view + '_' + shape + '.webp' + BACKDROPS_V;
    fg.hidden = !rec.fg; if (rec.fg) fg.src = BACKDROPS + view + '_' + shape + '_fg.webp' + BACKDROPS_V;
    for (const im of [bg, fg]) Object.assign(im.style, { width: rw * s + 'px', height: rh * s + 'px', left: ox + 'px', top: oy + 'px' });
    // the customers: the front of the queue at the counter, the rest behind, darker and softer the further back
    folk.innerHTML = ''; hot.innerHTML = ''; cards.innerHTML = '';
    hot.setAttribute('viewBox', '0 0 ' + W + ' ' + H); hot.setAttribute('width', W); hot.setAttribute('height', H);
    for (const st of standing(save.queue, (rec.spots || []).length).reverse()) {
      const sp = rec.spots[st.spot], url = FOLK + st.look + '.webp' + FOLK_V, cr = await cropOf(url); if (my !== token || !cr) continue;
      const hpx = FOLK_LOOKS[st.look] * sp.ppm * s, k = hpx / ((cr.y1 - cr.y0) * cr.im.height), [fx, fy] = at(sp.foot);
      const img = document.createElement('img'); img.src = url; img.alt = st.c.who; img.className = 'cv-who' + (st.spot ? ' back' : '');
      Object.assign(img.style, { width: cr.im.width * k + 'px', height: cr.im.height * k + 'px', left: (fx - ((cr.x0 + cr.x1) / 2) * cr.im.width * k) + 'px', top: (fy - cr.y1 * cr.im.height * k) + 'px', zIndex: 10 - st.spot });
      if (st.spot) img.style.filter = 'brightness(' + (0.82 - st.spot * 0.08) + ') blur(' + (0.6 + st.spot * 0.5) + 'px)';
      folk.appendChild(img);
      const shadow = document.createElement('div'); shadow.className = 'cv-shadow'; const sw = cr.im.width * k * (cr.x1 - cr.x0) * 1.1;
      Object.assign(shadow.style, { width: sw + 'px', height: sw * 0.22 + 'px', left: fx - sw / 2 + 'px', top: fy - sw * 0.11 + 'px', zIndex: 9 - st.spot });
      folk.appendChild(shadow);
    }
    // the cards on the painted places (your shelves on the left wall, your wall's pieces on the right), and the places to tap
    for (const [kind, places] of Object.entries(rec.places || {})) {
      for (const p of places) {
        const q = p.q.map(at), entry = kind === 'shelf' ? save.shelf[p.i] : (save.wall || [])[p.i];
        const id = kind === 'shelf' ? entry && entry.id : entry, c = id && save.cards.find(x => x.id === id);
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute('points', q.map(pt => pt.join(',')).join(' ')); poly.setAttribute('class', 'cv-place' + (c ? '' : ' empty') + (kind === 'shelf' && p.i >= save.slots ? ' none' : ''));
        if (!(kind === 'shelf' && p.i >= save.slots)) poly.addEventListener('click', () => on.place && on.place(kind, p.i));
        hot.appendChild(poly);
        if (!c) continue;
        const price = kind === 'shelf' ? entry.price : c.worth;   // the wall's pieces aren't for sale: their worth
        faceCanvas(c, price).then(cv => { if (my !== token) return; cv.className = 'cv-card'; cv.style.transform = quadMatrix(CW, CH, q); cards.appendChild(cv); });
      }
    }
    for (const [k, q] of Object.entries(rec.hot || {})) {
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('points', q.map(at).map(pt => pt.join(',')).join(' ')); poly.setAttribute('class', 'cv-door');
      poly.addEventListener('click', () => on[k] && on[k]()); hot.appendChild(poly);
    }
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => draw()) : null; if (ro) ro.observe(stage);
  return {
    get view() { return view; },
    turn,
    // the shop as it stands: save (its queue, shelf, wall, cards); priceOf(entry, card) for the shelf's price tags
    show(save, priceOf) { last = { ...save, shelf: (save.shelf || []).map(e => { const c = e && save.cards.find(x => x.id === e.id); return e && c ? { ...e, price: priceOf ? priceOf(c, e.tag) : '' } : e; }) }; draw(); },
    redraw: draw,
  };
}
