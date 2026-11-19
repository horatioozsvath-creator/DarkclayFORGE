// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// BEHIND THE COUNTER: the shop seen from behind your counter, in four fixed views (the counter facing the door, the left wall, the
// right wall, turned round to the workshop doorway). Each view is a painted backdrop (tools/backdrops.py: the room, and the counter
// cut out to stand in front of the customers), with what changes laid over it in 2D: your cards on the painted shelves (each card's
// face skewed onto its place), the customers as pictures at their standing spots, and the places and the doorway to tap.
// The pure parts (fit, the skew, who stands where) are exported for the tests; create() needs a page.
import { faceCanvas, CW, CH } from './cardface.js?v=69';
import { LOOKS, POOLS, REGULARS } from './folk.js?v=69';
import { FURNITURE, TIERS } from './data.js?v=69';
import { shelfSpots } from './room.js?v=69';
import { isBroken } from './wear.js?v=69';
import { threatsOn } from './bank.js?v=69';

export const VIEWS = ['left', 'counter', 'right', 'back'];
export const VIEW_WORD = { left: 'LEFT WALL', counter: 'THE COUNTER', right: 'RIGHT WALL', back: 'THE BACK ROOM' };
// the reaction marks (looktest/reactions.html), drawn by a customer's head
export const MARKS = {
  offended: '<svg viewBox="0 0 120 110"><g class="shake"><path class="vein" d="M70 22 l10 -12 l4 10 l12 -4 l-6 12 l10 6 l-12 2 l2 12 l-10 -8 l-8 10 l-2 -12 l-12 0 l8 -8 z"/><text x="6" y="88" class="bang">!!</text><path class="zap" d="M100 50 l14 -6 M102 64 l16 2 M98 78 l12 10"/></g></svg>',
  pleased: '<svg viewBox="0 0 120 110"><g class="tw"><path class="spark" d="M30 40 l5 -16 l5 16 l16 5 l-16 5 l-5 16 l-5 -16 l-16 -5 z"/></g><g class="tw t2"><path class="spark" d="M84 20 l3 -10 l3 10 l10 3 l-10 3 l-3 10 l-3 -10 l-10 -3 z"/></g><g class="tw t3"><path class="spark" d="M92 70 l4 -12 l4 12 l12 4 l-12 4 l-4 12 l-4 -12 l-12 -4 z"/></g><text x="50" y="96" class="note">♪</text><text x="66" y="80" class="note n2">♫</text></svg>',
  wary: '<svg viewBox="0 0 120 110"><path class="cloud" d="M20 58 q-14 -22 10 -30 q6 -20 30 -12 q20 -12 34 6 q22 2 16 26 q10 18 -14 24 q-12 14 -34 6 q-24 8 -32 -6 q-20 -4 -10 -14 z"/><circle class="tail" cx="18" cy="88" r="6"/><circle class="tail" cx="8" cy="102" r="3.5"/><circle class="dot" cx="44" cy="52" r="6"/><circle class="dot d2" cx="62" cy="52" r="6"/><circle class="dot d3" cx="80" cy="52" r="6"/><text x="96" y="30" class="q">?</text></svg>',
  eager: '<svg viewBox="0 0 120 110"><g class="burst"><path class="ray" d="M60 8 v14 M92 20 l-10 10 M104 52 h-14 M28 20 l10 10 M16 52 h14 M90 84 l-10 -8 M30 84 l10 -8"/></g><text x="44" y="82" class="gold">!</text></svg>',
};
// ---------- the room as it stands (milestone 28): which pictures, which shelves, what's laid over them ----------
export const DOOR_MEND_H = 24, PATCH_H = 48;   // hours the door stays boarded after a break-in; the wall's new boards show after a monster
const HOUR = 3600000;
// save, now -> { size: the shop's size (its pictures), cold: the forge broke, over: what's laid over the room (boards on the door,
// the wall mended, the regulars' gifts put out), wards: the cards hung over the door, shelves: [{ lv, places: [shelf index] }] in the
// room's order (the first nearest the counter on the left wall) }
export function dressingOf(save, now) {
  const room = save.room || { items: [] }, size = Math.max(0, Math.min(2, room.size | 0)), threats = threatsOn(save, now), over = [];
  const r = save.robbery, m = save.monster;
  if (threats && r && r.at && now >= r.at && now - r.at < DOOR_MEND_H * HOUR) over.push('boards');
  if (threats && m && m.done === 'came' && m.doneAt && now - m.doneAt < PATCH_H * HOUR) over.push('mended');
  // a gift's picture: its own, or the one it borrows (look: the Greyshore's gifts are drawn as the Reach's, milestone 40)
  for (const it of room.items || []) { const f = FURNITURE[it.kind], k = f && (f.look || it.kind); if (f && f.gift && !over.includes(k)) over.push(k); }
  const shelves = [];
  shelfSpots(room).forEach((sp, i) => { let s = shelves[shelves.length - 1]; if (!s || s.id !== sp.shelf) shelves.push(s = { id: sp.shelf, lv: sp.lv, places: [] }); s.places.push(i); });
  return { size, cold: isBroken(save, 'forge', now), over, wards: (save.wards || []).filter(Boolean), shelves };
}
// the painted shelf places (k: 0 by the door, the last nearest the counter) to your shelves: your first shelf nearest the counter
export const shelfAt = (k, K, shelves) => shelves[K - 1 - k] || null;
// what a haggle's answer shows: sold pleased, gone offended, a counter-offer wary (offended when you asked past their purse)
export const reactionTo = r => !r ? null : r.outcome === 'sold' ? 'pleased' : r.outcome === 'gone' ? 'offended' : r.outcome === 'counter' ? (r.over ? 'offended' : 'wary') : r.outcome === 'another' ? 'wary' : null;
const BACKDROPS = 'assets/backdrops/', BACKDROPS_V = '?b=5';   // bump b when tools/backdrops.py renders new pictures
const FOLK = 'assets/folk/', FOLK_V = '?f=2';   // bump f when tools/folk.sh renders new pictures

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

// ---------- the customers: who looks like whom (tools/folk.json), and where each one stands ----------
export const FOLK_LOOKS = LOOKS;   // a picture's height in metres (js/folk.js, from tools/folk.json)
const hash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
// a regular always the same (by name); anyone else from their kind's pool, the same picture for the same name
export function lookOf(c) {
  if (!c) return POOLS.folk[0];
  const who = String(c.who || '');
  for (const [re, k] of REGULARS) if (re.test(who)) return k;
  const pool = POOLS[c.type] || POOLS.folk;
  return pool[hash(who) % pool.length];
}
// the step at the counter: the small folk (a goblin, a hedgefolk) climb it to be seen over the counter; further back, their own height
export const STEP_TO = 1.5;   // metres: anyone shorter at the counter stands this tall
export const stepUp = (height, spot) => spot === 0 ? Math.max(0, STEP_TO - height) : 0;
// the queue to the spots: the front of it at the counter (spot 0), the rest behind, as many as there are spots
export const standing = (queue, spots) => (queue || []).slice(0, spots).map((c, i) => ({ c, spot: i, look: lookOf(c) }));

// ---------- the view on the page ----------
const datas = {};
// a shop on the coast has its own pictures (milestone 43: tools/backdrops.py SEA=1, assets/backdrops/sea/)
export const dirOf = (save, size) => BACKDROPS + (save && save.region && save.region !== 'reach' ? 'sea/' : '') + 's' + size + '/';
const load = dir => datas[dir] || (datas[dir] = fetch(dir + 'backdrops.json' + BACKDROPS_V).then(r => r.json()).then(d => {
  // how many shelf places the left wall has (every view shows some of them)
  d.K = 1 + Math.max(...Object.values(d).flatMap(v => Object.values(v).flatMap(r => (r.units || []).map(u => u.k))));
  return d;
}));
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
  host.innerHTML = '<div class="cv-stage"><img class="cv-bg" alt=""><div class="cv-cards"></div><div class="cv-folk"></div><div class="cv-gone"></div><img class="cv-fg" alt=""><svg class="cv-hot"></svg><div class="cv-over"><div class="cv-held"></div></div></div>'   // back to front: the room, the walls' cards, the customers, the counter
    + '<div class="cv-turns">' + VIEWS.map(v => '<button class="seg" data-cv="' + v + '">' + (v === 'left' ? '◀ ' : '') + VIEW_WORD[v] + (v === 'right' ? ' ▶' : '') + '</button>').join('') + '</div>';
  const stage = host.querySelector('.cv-stage'), bg = host.querySelector('.cv-bg'), fg = host.querySelector('.cv-fg'), folk = host.querySelector('.cv-folk'), cards = host.querySelector('.cv-cards'), hot = host.querySelector('.cv-hot');
  const gone = host.querySelector('.cv-gone'), over = host.querySelector('.cv-over'), held = host.querySelector('.cv-held');
  let view = 'counter', last = null, token = 0, were = null;
  let front = null;            // the one at the counter as drawn: { key, img, x, y (their head), w (their width), W, H }
  let parting = undefined;     // the mark the one at the counter leaves with, when they go (set just before the queue moves)
  let extra = null, extraT = 0; // a visitor for a moment (a regular leaving an order, coming for it): they stand at the counter
  let heldHtml = '', heldKey = '', markT = 0;   // were: where each customer stood last time (key → spot), to walk them
  host.querySelectorAll('[data-cv]').forEach(b => b.onclick = () => turn(b.dataset.cv));
  // a swipe across the picture turns to the next view
  let sx = null;
  stage.addEventListener('pointerdown', e => { sx = e.clientX; });
  stage.addEventListener('pointerup', e => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) { const i = VIEWS.indexOf(view); turn(VIEWS[(i + (dx < 0 ? 1 : -1) + VIEWS.length) % VIEWS.length]); } });
  function turn(v) { if (v === view) return; view = v; stage.classList.add('turning'); setTimeout(() => stage.classList.remove('turning'), 220); draw(); if (on.turned) on.turned(v); }
  async function draw() {
    const save = last; if (!save) return;
    const dr = dressingOf(save, Date.now()), dir = dirOf(save, dr.size);
    const my = ++token, d = await load(dir); if (my !== token) return;
    host.querySelectorAll('[data-cv]').forEach(b => b.classList.toggle('go', b.dataset.cv === view));
    const W = stage.clientWidth, H = stage.clientHeight, shape = shapeFor(W, H), rec = d[view] && d[view][shape]; if (!rec) return;
    const [rw, rh] = rec.size, { s, ox, oy } = cover(W, H, rw, rh), at = ([x, y]) => [ox + x * s, oy + y * s];
    const pic = name => dir + view + '_' + shape + name + '.webp' + BACKDROPS_V;
    bg.src = pic(view === 'back' && dr.cold && rec.cold ? '_cold' : '');
    fg.hidden = !rec.fg; if (rec.fg) fg.src = pic('_fg');
    for (const im of [bg, fg]) Object.assign(im.style, { width: rw * s + 'px', height: rh * s + 'px', left: ox + 'px', top: oy + 'px' });
    // the customers: the front of the queue at the counter, the rest behind, darker and softer the further back
    const queue = extra ? [extra, ...(save.queue || [])] : (save.queue || []);
    const keys = new Set(queue.map(c => c.id || c.who));
    // whoever was at the counter and isn't in the queue now goes out of the door (with their mark, if they leave one)
    if (front && !keys.has(front.key) && front.img.isConnected && view === 'counter') depart(front, parting);
    else if (front && !keys.has(front.key)) front.img.remove();
    parting = undefined;
    if (!front || front.key !== (queue[0] && (queue[0].id || queue[0].who))) { clearMark(); }
    front = null;
    folk.innerHTML = ''; hot.innerHTML = ''; cards.innerHTML = '';
    hot.setAttribute('viewBox', '0 0 ' + W + ' ' + H); hot.setAttribute('width', W); hot.setAttribute('height', H);
    const now = new Map();
    for (const st of standing(queue, (rec.spots || []).length).reverse()) {
      const sp = rec.spots[st.spot], url = FOLK + st.look + '.webp' + FOLK_V, cr = await cropOf(url); if (my !== token || !cr) continue;
      const hpx = FOLK_LOOKS[st.look] * sp.ppm * s, k = hpx / ((cr.y1 - cr.y0) * cr.im.height), [fx, fy0] = at(sp.foot), fy = fy0 - stepUp(FOLK_LOOKS[st.look], st.spot) * sp.ppm * s;
      const img = document.createElement('img'); img.src = url; img.alt = st.c.who; img.className = 'cv-who' + (st.spot ? ' back' : '');
      Object.assign(img.style, { width: cr.im.width * k + 'px', height: cr.im.height * k + 'px', left: (fx - ((cr.x0 + cr.x1) / 2) * cr.im.width * k) + 'px', top: (fy - cr.y1 * cr.im.height * k) + 'px', zIndex: 10 - st.spot });
      if (st.spot) img.style.filter = 'brightness(' + (0.82 - st.spot * 0.08) + ') blur(' + (0.6 + st.spot * 0.5) + 'px)';
      // walking: someone new comes in from the door, someone moving up steps forward (a bob); not on the view's first drawing
      const key = st.c.id || st.c.who, was = were && were.get(key); now.set(key, st.spot);
      if (were && was == null) img.classList.add('cv-in'); else if (were && was > st.spot) img.classList.add('cv-step');
      folk.appendChild(img);
      if (!st.spot) front = { key, img, x: fx, y: fy - hpx, w: cr.im.width * k * (cr.x1 - cr.x0), W, H };
      const shadow = document.createElement('div'); shadow.className = 'cv-shadow'; const sw = cr.im.width * k * (cr.x1 - cr.x0) * 1.1;
      Object.assign(shadow.style, { width: sw + 'px', height: sw * 0.22 + 'px', left: fx - sw / 2 + 'px', top: fy0 - sw * 0.11 + 'px', zIndex: 9 - st.spot });
      folk.appendChild(shadow);
    }
    if (my === token && rec.spots && rec.spots.length) were = now;
    placeHeld();
    // the room's state laid over it: the boards on the door, the wall mended, the regulars' gifts (in front of the shelves)
    const sprite = (name, b, z) => { const im = document.createElement('img'); im.src = pic(name); im.alt = ''; im.className = 'cv-sprite';
      Object.assign(im.style, { left: ox + b[0] * s + 'px', top: oy + b[1] * s + 'px', width: (b[2] - b[0]) * s + 'px', height: (b[3] - b[1]) * s + 'px', zIndex: z }); cards.appendChild(im); };
    for (const name of dr.over) if (rec.over && rec.over[name]) sprite('_' + name, rec.over[name], 90);
    // the wards, hung along the lintel over the door
    if (rec.wards && dr.wards.length) {
      const [a, b] = rec.wards.map(at), n = Math.min(dr.wards.length, 6), sz = Math.max(10, Math.hypot(b[0] - a[0], b[1] - a[1]) / 5);
      dr.wards.slice(0, n).forEach((c, i) => {
        const t = (i + 1) / (n + 1), el = document.createElement('i'), tier = TIERS.find(x => x.id === c.tier);
        el.className = 'cv-ward'; el.title = c.name; el.style.setProperty('--wc', tier ? tier.c : '#e8c464');
        Object.assign(el.style, { left: a[0] + (b[0] - a[0]) * t - sz / 2 + 'px', top: a[1] + (b[1] - a[1]) * t + 'px', width: sz + 'px', height: sz * 1.6 + 'px', zIndex: 91 });
        cards.appendChild(el);
      });
    }
    // your shelves on the left wall's painted places (far ones first), each as its level's model, your cards on its places
    const place = (q, i, kind, z) => {
      const entry = kind === 'shelf' ? save.shelf[i] : (save.wall || [])[i];
      const id = kind === 'shelf' ? entry && entry.id : entry, c = id && save.cards.find(x => x.id === id);
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('points', q.map(pt => pt.join(',')).join(' ')); poly.setAttribute('class', 'cv-place' + (c ? '' : ' empty'));
      poly.addEventListener('click', () => on.place && on.place(kind, i)); hot.appendChild(poly);
      if (!c) return;
      const price = kind === 'shelf' ? entry.price : c.worth;   // the wall's pieces aren't for sale: their worth
      faceCanvas(c, price).then(cv => { if (my !== token) return; cv.className = 'cv-card'; cv.style.transform = quadMatrix(CW, CH, q); cv.style.zIndex = z; cards.appendChild(cv); });
    };
    for (const u of (rec.units || []).slice().sort((a, b) => a.k - b.k)) {
      const sh = shelfAt(u.k, d.K, dr.shelves); if (!sh) continue;
      const model = sh.lv >= 2 ? 'cardcase' : 'cardshelf', b = u.sprites[model]; if (!b) continue;
      sprite('_u' + u.k + '_' + model, b, u.k * 2);
      // the cards only from the left wall's own view (seen side on from the counter, they'd skew past their places)
      if (view === 'left') (u.quads[String(Math.min(2, sh.lv))] || []).forEach((q, j) => { if (sh.places[j] != null) place(q.map(at), sh.places[j], 'shelf', u.k * 2 + 1); });
    }
    // the wall's pieces, hung on the right wall
    for (const p of rec.wall || []) place(p.q.map(at), p.i, 'wall', 80);
    for (const [k, q] of Object.entries(rec.hot || {})) {
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('points', q.map(at).map(pt => pt.join(',')).join(' ')); poly.setAttribute('class', 'cv-door');
      poly.addEventListener('click', () => on[k] && on[k]()); hot.appendChild(poly);
    }
  }
  // the piece they're looking at, held up as your forged card: to the left of the one at the counter, at the card's own proportions
  const TAG_H = 30;   // the price tag hanging under the held card
  function placeHeld() {
    const show = view === 'counter' && front && !extra && heldHtml;
    held.hidden = !show; if (!show) return;
    const tall = front.W / front.H < 1.25;
    // a phone held upright: a smaller card, so the room and the customer still show (release 50); its tag hangs under it
    let cw = Math.max(90, Math.min(250, front.W * (tall ? 0.29 : 0.24)));
    held.style.width = cw + 'px';
    const room = front.H * (tall ? 0.62 : 1) - 12 - TAG_H;
    if (held.offsetHeight > room) { cw = Math.max(70, cw * room / held.offsetHeight); held.style.width = cw + 'px'; }   // a short view: the card fits its height
    const left = Math.max(front.W * 0.02, Math.min(front.x - front.w * 0.42 - cw, front.W - cw - 4));
    held.style.left = left + 'px';
    held.style.top = Math.max(4, Math.min(front.y - cw * 0.05, front.H - held.offsetHeight - 8 - TAG_H)) + 'px';   // held up by their head, never out of the view
  }
  // the comic marks by a head: offended (red !! that shake), pleased (gold sparkles, a tune), wary (a thought bubble), eager (a gold !)
  function markAt(layer, kind, x, y, W) {
    const el = document.createElement('div'), sz = Math.max(54, Math.min(118, W * 0.12));
    el.className = 'cv-mark cv-' + kind; el.innerHTML = MARKS[kind] || '';
    Object.assign(el.style, { width: sz + 'px', height: sz * 0.92 + 'px', left: x + 'px', top: (y - sz * 0.75) + 'px' });
    layer.appendChild(el); return el;
  }
  function clearMark() { over.querySelectorAll('.cv-mark').forEach(m => m.remove()); clearTimeout(markT); }
  function depart(f, kind) {
    const img = f.img; img.classList.remove('cv-in', 'cv-step'); img.classList.add('cv-out'); gone.appendChild(img);
    if (kind) markAt(gone, kind, f.x + f.w * 0.12, f.y, f.W);
    setTimeout(() => { gone.innerHTML = ''; }, 1500);
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => draw()) : null; if (ro) ro.observe(stage);
  return {
    get view() { return view; },
    turn,
    // the shop as it stands: save (its queue, shelf, wall, cards); priceOf(entry, card) for the shelf's price tags
    show(save, priceOf) { last = { ...save, shelf: (save.shelf || []).map(e => { const c = e && save.cards.find(x => x.id === e.id); return e && c ? { ...e, price: priceOf ? priceOf(c, e.tag) : '' } : e; }) }; return draw(); },
    redraw: draw,
    // the piece at the counter, as the forged card's HTML (or '' for none); key: which piece, so a new one rises into the hand; tag: the price
    // on it at the counter (HTML: a price, a word)
    hold(html, key = html, tag = '') { const h = html && tag ? html + '<div class="cv-tag">' + tag + '</div>' : html; if (h === heldHtml && key === heldKey) return; if (key !== heldKey) { heldKey = key; held.classList.remove('cv-rise'); void held.offsetWidth; if (html) held.classList.add('cv-rise'); } heldHtml = h; held.innerHTML = h; placeHeld(); },
    // a mark by the head of the one at the counter, for a while (ms; 0: until the next)
    react(kind, ms = 2600) { clearMark(); if (!kind || !front || view !== 'counter') return; markAt(over, kind, front.x + front.w * 0.12, front.y, front.W); if (ms) markT = setTimeout(clearMark, ms); },
    // the one at the counter goes with this mark, when the queue next moves
    leaving(kind) { parting = kind; },
    // coins from the piece to the till
    coins(n = 7) {
      if (!front || view !== 'counter') return;
      const r = held.hidden ? { x: front.x, y: front.y + front.w } : { x: held.offsetLeft + held.offsetWidth / 2, y: held.offsetTop + held.offsetHeight / 2 };
      for (let i = 0; i < n; i++) {
        const c = document.createElement('i'); c.className = 'cv-coin';
        Object.assign(c.style, { left: r.x + 'px', top: r.y + 'px', animationDelay: i * 70 + 'ms' });
        c.style.setProperty('--dx', (front.W * 0.5 - r.x + (i - n / 2) * 9) + 'px'); c.style.setProperty('--dy', (front.H * 0.93 - r.y) + 'px');
        over.appendChild(c); setTimeout(() => c.remove(), 1400 + i * 70);
      }
    },
    // someone stops by for a moment (who, type): they come to the counter, wear their mark, and go with the other
    visit(c, kind, then, ms = 3800) {
      clearTimeout(extraT); extra = { ...c, id: 'visit:' + c.who }; draw();
      setTimeout(() => this.react(kind, ms - 600), 950);
      extraT = setTimeout(() => { parting = then; extra = null; draw(); }, ms);
    },
  };
}
