// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// The shop in 3D: a cut-away room seen from the front corner, the furniture where the room rules put it, customers walking
// in to the counter. Loaded only when the shop is opened. Three.js comes through the page's import map as 'three'.
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/three/loaders/GLTFLoader.js';
import { FURNITURE, DOOR_Z, WORK_DOOR_X, TIERS, SHELF_LEVELS } from './data.js?v=73';
import { ART } from './card.js?v=73';
import { faceCanvas, CW, CH } from './cardface.js?v=73';
import { sizeOf, tilesOf, fpOf, kept, fits } from './room.js?v=73';

const MODELS = 'assets/models/', M = '?m=10';   // bump m when tools/models.sh rebuilds them
const FIGURES = { folk: 'folk', guard: 'dwarf', traveller: 'carter', delver: 'bard', factor: 'chandler', collector: 'herbalist', steward: 'chandler', master: 'herbalist', seller: 'carter', maker: 'smith', clerk: 'chandler' };
const WALK = 1.5;   // metres a second

// ---------- the cel look (Darkclay Zero's celkit: three bands, a glow, the baked inverted-hull outline drawn black) ----------
const ramp = (() => { const t = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]), 3, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
let palette = {};
const mats = {};
function matFor(name) {
  const key = name.replace(/\.\d+$/, ''), p = palette[key] || { hex: '#808080', kind: key.startsWith('Ink') ? 'ink' : 'toon' };
  if (mats[key]) return mats[key];
  const c = new THREE.Color(p.hex);
  return mats[key] = p.kind === 'ink' ? new THREE.MeshBasicMaterial({ color: 0x0e0b09, side: THREE.FrontSide })
    : p.kind === 'glow' ? new THREE.MeshBasicMaterial({ color: c, side: THREE.FrontSide })
    : new THREE.MeshToonMaterial({ color: c.multiplyScalar(1.25), gradientMap: ramp, side: THREE.FrontSide });
}
function toonBox(w, h, d, hex) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshToonMaterial({ color: new THREE.Color(hex).multiplyScalar(1.2), gradientMap: ramp })); }

// ---------- models: loaded once, each placed copy a clone, sat on the floor and centred on its tiles ----------
const loader = new GLTFLoader(), cache = {};
function model(name) {
  return cache[name] || (cache[name] = new Promise((ok, no) => loader.load(MODELS + name + '.glb' + M, g => {
    // a painted model keeps its texture, drawn in the same toon bands; the rest take their palette colours
    const re = m => m.map ? new THREE.MeshToonMaterial({ map: m.map, gradientMap: ramp, side: THREE.FrontSide }) : matFor(m.name);
    g.scene.traverse(o => { if (o.isMesh) o.material = Array.isArray(o.material) ? o.material.map(re) : re(o.material); });
    ok(g.scene);
  }, undefined, no)));
}
// a copy wrapped so that its footprint's long side runs along x, its base on y = 0 and its middle at the wrapper's origin
function placed(src, fp) {
  const inner = src.clone(true), wrap = new THREE.Group();
  wrap.add(inner);
  let b = new THREE.Box3().setFromObject(inner), s = b.getSize(new THREE.Vector3());
  if (fp && fp[0] !== fp[1] && (fp[0] > fp[1]) !== (s.x >= s.z)) { inner.rotation.y = Math.PI / 2; b = new THREE.Box3().setFromObject(inner); }
  const c = b.getCenter(new THREE.Vector3());
  inner.position.x -= c.x; inner.position.z -= c.z; inner.position.y -= b.min.y;
  return wrap;
}

// ---------- the card stands: each shelf place shows its piece as a small upright card, drawn onto a canvas ----------
const TIER = Object.fromEntries(TIERS.map(t => [t.id, t]));
const CARD_W = 0.56, CARD_H = CARD_W * CH / CW;
// the card shelf's baize slope (tools/station_props.py SLOPE_FRONT, SLOPE_BACK, BOARD): a card rests on it against the front lip
const SLOPE = (() => {
  const [fz, fy] = [0.38, 0.76], [bz, by] = [-0.32, 1.22], B = 0.04, L = Math.hypot(fz - bz, by - fy);
  const n = [(by - fy) / L, (fz - bz) / L], u = [(bz - fz) / L, (by - fy) / L];   // up off the cloth; up the slope
  const z = 0.365, t = (fz + n[0] * B - z) / -u[0], y = fy + n[1] * B + u[1] * t;
  return { z: z + n[0] * 0.008, y: y + n[1] * 0.008 + 0.017, lean: Math.asin(-u[0]) };   // 0.017: the model is lifted by its ink below the floor
})();
// each shelf level's places: where a card rests (x across, its bottom's z and y), how far it leans back, how wide it is. The
// display case's rows: tools/station_props.py CASE_ROWS and CASE_LEAN (its baize sits 0.008 behind the card; 0.017 the ink lift)
const ROW = (z, y, lean, w, xs) => xs.map(x => ({ x, z, y, lean, w }));
const CASE = Math.PI / 6, cz = (z, y) => [z, y + 0.017];
const LAYOUTS = [
  ROW(SLOPE.z, SLOPE.y, SLOPE.lean, 0.56, [-0.46, 0.46]),
  ROW(SLOPE.z, SLOPE.y, SLOPE.lean, 0.54, [-0.6, 0, 0.6]),
  [...ROW(...cz(0.36, 0.55), CASE, 0.5, [-0.6, 0, 0.6]), ...ROW(...cz(-0.02, 1.24), CASE, 0.5, [-0.6, 0, 0.6])],
];
// the Hall's: a plinth's one card (tools/station_props.py PLINTH_REST, PLINTH_LEAN), a glass case's front row of three
LAYOUTS.plinth = ROW(0.12, 1.02 + 0.017, Math.PI * 40 / 180, 0.42, [0]);
LAYOUTS.hallcase = LAYOUTS[2].slice(0, 3);
const placeOf = e => (LAYOUTS[e.lv] || LAYOUTS[0])[e.spot] || LAYOUTS[0][0];
const modelOf = it => it.kind === 'shelf' ? (SHELF_LEVELS[it.lv | 0] || SHELF_LEVELS[0]).model : FURNITURE[it.kind].model;
// a card's face: js/cardface.js draws it; here it's a texture, updated when the picture comes in
export async function cardFace(c, price) {
  let tex = null;
  await faceCanvas(c, price, cv => { if (!tex) { tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; } tex.needsUpdate = true; });
  return tex;
}
// the "+N c" that rises over the counter when a piece sells
function coinText(n) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96;
  const g = cv.getContext('2d'); g.font = '800 64px Alegreya, Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 10; g.strokeStyle = '#0e0b09'; g.strokeText('+' + n + ' c', 128, 50); g.fillStyle = '#e8c464'; g.fillText('+' + n + ' c', 128, 50);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })); sp.scale.set(1.6, 0.6, 1); sp.renderOrder = 10;
  return sp;
}
const standGeo = { face: new THREE.PlaneGeometry(CARD_W, CARD_H) };
function makeStand(slot, shelfId, tex, at) {
  const s = new THREE.Group(), lean = new THREE.Group();
  const face = new THREE.Mesh(standGeo.face, new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.05 }));
  const back = new THREE.Mesh(standGeo.face, new THREE.MeshBasicMaterial({ color: 0x2a1c12 })); back.rotation.y = Math.PI; back.position.z = -0.003;
  face.position.y = back.position.y = CARD_H / 2;
  lean.add(face, back); lean.rotation.x = -at.lean; lean.position.set(0, at.y, at.z); lean.scale.setScalar(at.w / CARD_W);
  s.add(lean);
  s.traverse(m => { m.userData.slot = slot; m.userData.item = shelfId; });
  return s;
}

export async function create(host, { onTap, folk = true } = {}) {   // folk: false, no customers (arranging only)
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return null; }
  try { palette = (await (await fetch(MODELS + 'palette.json' + M)).json()).slots; } catch (e) { palette = {}; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.domElement.className = 'dio';
  host.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffe6c8, 0x3a2414, 1.1));
  const sun = new THREE.DirectionalLight(0xffd9a8, 2.2); sun.position.set(-3, 8, 6); scene.add(sun);
  const ember = new THREE.PointLight(0xff8a3a, 6, 7, 1.6); scene.add(ember);
  const camera = new THREE.OrthographicCamera(-5, 5, 3, -3, 0.1, 100);
  const roomG = new THREE.Group(), itemsG = new THREE.Group(), peopleG = new THREE.Group(), markG = new THREE.Group(), flyG = new THREE.Group();
  scene.add(roomG, itemsG, peopleG, markG, flyG);
  let room = null, dirty = true, arranging = false, selected = null, size = { w: 6, d: 5 }, view = 'shop', cold = false, sea = false;   // sea: a shop on the coast (milestone 40)   // cold: the forge broken, its fire out
  const itemObjs = new Map();   // item id → its group
  const people = new Map();     // customer id → { obj, path, at, gone }
  let shown = [];               // the shelf's pieces: [{ slot, shelf, side, card, price }]
  const stands = new Map();     // slot → { key, id, obj, tex }
  const lately = new Map();     // card id → a stand just taken off its shelf, kept a few seconds for a sale to carry away
  const flights = [];           // pieces on their way to the counter, and the coins over it

  function fitCamera() {
    const w = host.clientWidth || 600, h = host.clientHeight || 300;
    renderer.setSize(w, h, false);
    const { w: rw, d: rd } = size, cx = rw / 2, cz = rd / 2;
    const dir = new THREE.Vector3(0.75, 1.0, 1.35).normalize();
    camera.position.set(cx + dir.x * 30, dir.y * 30, cz + dir.z * 30);
    camera.lookAt(cx, 0.6, cz);
    camera.updateMatrixWorld();
    // fit the room's corners (and a wall's height) into the view
    const pts = [];
    for (const [x, z] of [[0, 0], [rw, 0], [0, rd], [rw, rd]]) for (const y of [0, 2.6]) pts.push(new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse));
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    let hw = (Math.max(...xs) - Math.min(...xs)) / 2 * 1.06, hh = (Math.max(...ys) - Math.min(...ys)) / 2 * 1.08;
    const mx = (Math.max(...xs) + Math.min(...xs)) / 2, my = (Math.max(...ys) + Math.min(...ys)) / 2;
    if (hw / hh > w / h) hh = hw * h / w; else hw = hh * w / h;
    camera.left = mx - hw; camera.right = mx + hw; camera.top = my + hh; camera.bottom = my - hh;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  new ResizeObserver(fitCamera).observe(host);

  // the floor, the back and left walls with their doorways, a grid for arranging. The shop front: boards, plastered walls, the
  // street door at the left and the way through to the workshop in the back wall; the workshop: flagstones, bare stone, its door
  // at the left back through to the shop.
  function buildRoom() {
    roomG.clear();
    const { w, d } = size, hall = view === 'hall', work = view === 'work' || hall;   // the Hall: a gallery, its door back to the shop as the workshop's
    // the shop front on the coast: scrubbed boards and whitewashed walls
    const [f1, f2, wb, wl] = hall ? ['#6a6258', '#7a7266', '#8a8070', '#827868'] : work ? ['#3e3a36', '#48433e', '#5a524a', '#524a42'] : sea ? ['#5e5244', '#685a4a', '#bdb6a6', '#b1aa9a'] : ['#4a3424', '#54392a', '#6a5040', '#5e4636'];
    const floor = toonBox(w, 0.12, d, f1); floor.position.set(w / 2, -0.06, d / 2); floor.userData.floor = true; roomG.add(floor);
    for (let x = 0; x < w; x++) for (let z = 0; z < d; z++) if ((x + z) % 2) { const t = toonBox(0.98, 0.01, 0.98, f2); t.position.set(x + 0.5, 0.005, z + 0.5); roomG.add(t); }
    if (work) { const back = toonBox(w + 0.2, 2.6, 0.2, wb); back.position.set(w / 2, 1.3, -0.1); roomG.add(back); }
    else {   // the back wall, cut for the way through at WORK_DOOR_X; the workshop's glow beyond it
      const a = WORK_DOOR_X, b = w - WORK_DOOR_X - 1;
      if (a > 0) { const s1 = toonBox(a + 0.1, 2.6, 0.2, wb); s1.position.set((a - 0.1) / 2, 1.3, -0.1); roomG.add(s1); }
      if (b > 0) { const s2 = toonBox(b + 0.1, 2.6, 0.2, wb); s2.position.set(a + 1 + (b + 0.1) / 2 - 0.05, 1.3, -0.1); roomG.add(s2); }
      const l2 = toonBox(1.1, 0.5, 0.24, '#3b2414'); l2.position.set(a + 0.5, 2.35, -0.1); roomG.add(l2);
      const glowIn = new THREE.Mesh(new THREE.PlaneGeometry(1, 2.1), new THREE.MeshBasicMaterial({ color: 0x5a2a12 })); glowIn.position.set(a + 0.5, 1.05, -0.2); glowIn.userData.door = 'work'; roomG.add(glowIn);
    }
    const beam = toonBox(w + 0.2, 0.18, 0.26, '#3b2414'); beam.position.set(w / 2, 2.62, -0.1); roomG.add(beam);
    // the left wall, cut for the door at DOOR_Z
    const segA = toonBox(0.2, 2.6, DOOR_Z, wl); segA.position.set(-0.1, 1.3, DOOR_Z / 2); roomG.add(segA);
    const restD = d - DOOR_Z - 1; if (restD > 0) { const segB = toonBox(0.2, 2.6, restD, wl); segB.position.set(-0.1, 1.3, DOOR_Z + 1 + restD / 2); roomG.add(segB); }
    if (work) { const through = new THREE.Mesh(new THREE.PlaneGeometry(1, 2.1), new THREE.MeshBasicMaterial({ color: 0x3a2414 })); through.rotation.y = Math.PI / 2; through.position.set(-0.22, 1.05, DOOR_Z + 0.5); through.userData.door = 'shop'; roomG.add(through); }
    const lintel = toonBox(0.24, 0.5, 1.1, '#3b2414'); lintel.position.set(-0.1, 2.35, DOOR_Z + 0.5); roomG.add(lintel);
    const step = toonBox(0.6, 0.06, 1, '#2a1c12'); step.position.set(-0.3, 0.03, DOOR_Z + 0.5); roomG.add(step);
    if (sea && !work) {   // on the coast: grey sea through the street door, and a ship's lantern hung by it
      const out = new THREE.Mesh(new THREE.PlaneGeometry(1, 2.1), new THREE.MeshBasicMaterial({ color: 0x7d929a })); out.rotation.y = Math.PI / 2; out.position.set(-0.5, 1.05, DOOR_Z + 0.5); roomG.add(out);
      const lamp = toonBox(0.16, 0.24, 0.16, '#d4b04a'); lamp.position.set(0.12, 2.0, DOOR_Z - 0.18); roomG.add(lamp);
      const glow = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.1), new THREE.MeshBasicMaterial({ color: 0xffd27a })); glow.position.copy(lamp.position); roomG.add(glow);
    }
    ember.position.set(hall ? w / 2 : work ? 1 : WORK_DOOR_X + 0.5, hall ? 2.2 : 1.2, hall ? d / 2 : work ? 1.2 : 0.4);
    ember.intensity = hall ? 4 : work ? (cold ? 0.35 : 6) : (cold ? 0.6 : 2.5);
  }
  function drawMarks() {
    markG.clear();
    if (!arranging) return;
    const { w, d } = size, k = kept(room);
    const g = new THREE.Group();
    for (let x = 0; x < w; x++) for (let z = 0; z < d; z++) {
      const keep = k.has(x + ',' + z);
      const q = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.92), new THREE.MeshBasicMaterial({ color: keep ? 0x8fb8d8 : 0xe8c464, transparent: true, opacity: keep ? 0.28 : 0.1, depthWrite: false }));
      q.rotation.x = -Math.PI / 2; q.position.set(x + 0.5, 0.02, z + 0.5); g.add(q);
    }
    if (selected) {
      const it = room.items.find(i => i.id === selected);
      if (it) for (const [x, z] of tilesOf(it)) {
        const q = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.96), new THREE.MeshBasicMaterial({ color: 0xf0a35c, transparent: true, opacity: 0.55, depthWrite: false }));
        q.rotation.x = -Math.PI / 2; q.position.set(x + 0.5, 0.03, z + 0.5); g.add(q);
      }
    }
    markG.add(g);
  }
  async function syncItems() {
    const want = new Set(room.items.map(i => i.id));
    for (const [id, o] of itemObjs) if (!want.has(id)) { itemsG.remove(o); itemObjs.delete(id); }
    for (const it of room.items) {
      let o = itemObjs.get(it.id);
      if (!o) { o = new THREE.Group(); o.userData.item = it.id; itemObjs.set(it.id, o); itemsG.add(o); }
      const name = modelOf(it);
      if (o.userData.model !== name) {   // new, or a shelf made better: its model (not its card stands) swapped
        o.userData.model = name;
        o.children.filter(c => c.userData.isModel).forEach(c => o.remove(c));
        model(name).then(src => {
          if (o.userData.model !== name) return;
          const p = placed(src, FURNITURE[it.kind].fp); p.userData.isModel = true;
          if (FURNITURE[it.kind].scale) p.scale.setScalar(FURNITURE[it.kind].scale);
          p.traverse(m => { m.userData.item = it.id; }); o.add(p); dirty = true;
        }).catch(() => {});
      }
      const [fx, fz] = fpOf(it);
      o.position.set(it.x + fx / 2, 0, it.z + fz / 2);
      o.rotation.y = -it.rot * Math.PI / 2;
    }
    const forge = room.items.find(i => i.kind === 'forge'); if (forge) { const [fx, fz] = fpOf(forge); ember.position.set(forge.x + fx / 2, 1.0, forge.z + fz + 0.3); }
    drawStands();
    dirty = true;
  }
  // the card stands: one per filled shelf place, sat on its shelf (a child of the shelf, so it moves and turns with it)
  const standKey = e => [e.shelf, e.lv, e.spot, e.card.id, e.card.tier, e.card.count || 0, e.price, e.card.name].join('|');
  function dropStand(slot) {
    const s = stands.get(slot); if (!s) return;
    stands.delete(slot);
    if (s.obj.parent) { s.obj.updateMatrixWorld(true); s.world = s.obj.matrixWorld.clone(); s.obj.parent.remove(s.obj); }
    s.at = performance.now(); lately.set(s.id, s);
  }
  function drawStands() {
    const want = new Map((view === 'shop' || view === 'hall') && room ? shown.map(e => [e.slot, e]) : []);
    for (const [slot, s] of [...stands]) { const e = want.get(slot); if (!e || standKey(e) !== s.key || !itemObjs.has(e.shelf) || s.obj.parent !== itemObjs.get(e.shelf)) dropStand(slot); }
    for (const [slot, e] of want) {
      if (stands.has(slot)) continue;
      const host = itemObjs.get(e.shelf); if (!host) continue;
      const s = { key: standKey(e), id: e.card.id, obj: new THREE.Group(), tex: null };
      const at = placeOf(e); s.obj.position.set(at.x, 0, 0);
      host.add(s.obj); stands.set(slot, s);
      cardFace(e.card, e.price).then(tex => { s.tex = tex; s.obj.add(makeStand(slot, e.shelf, tex, at)); dirty = true; });
    }
    dirty = true;
  }
  function forget(s) { if (s.tex) s.tex.dispose(); s.obj.traverse(m => { if (m.material) m.material.dispose(); }); }
  // a piece sold: the customer walks to its shelf (a walk-in), it lifts off, flies to the counter and turns into coins
  function sold(entry) {
    if (view !== 'shop' || !entry.sold || !room) return;
    const id = entry.sold.id, live = [...stands.values()].find(s => s.id === id), was = lately.get(id);
    let piece, world;
    if (was && !was.flying) { lately.delete(id); was.flying = true; piece = was.obj; world = was.world; }
    else if (live && live.obj.children.length) { live.obj.updateMatrixWorld(true); world = live.obj.matrixWorld.clone(); piece = live.obj.clone(true); piece.traverse(m => { if (m.material) m.material = m.material.clone(); }); piece.userData.keepMap = true; }
    const counter = room.items.find(i => i.kind === 'counter');
    const top = new THREE.Vector3(size.w / 2, 1.2, 1.5);
    if (counter) { const o = itemObjs.get(counter.id), b = o && new THREE.Box3().setFromObject(o); if (b && !b.isEmpty()) b.getCenter(top).setY(b.max.y + 0.05); else { const [fx, fz] = fpOf(counter); top.set(counter.x + fx / 2, 1.2, counter.z + fz / 2); } }
    let wait = 0, walker = null;
    if (piece) {
      piece.matrixAutoUpdate = true; world.decompose(piece.position, piece.quaternion, piece.scale);
      piece.position.add(new THREE.Vector3(0, 0, 0.03).applyQuaternion(piece.quaternion));
      piece.traverse(m => { delete m.userData.slot; delete m.userData.item; });
      flyG.add(piece);
      if (!entry.served && !entry.by) {   // a walk-in: to the front of that shelf, and the piece goes when they get there
        const front = new THREE.Vector3(0, 0, 0.75).applyQuaternion(piece.quaternion);
        const to = [Math.min(size.w - 0.4, Math.max(0.4, piece.position.x + front.x)), Math.min(size.d - 0.4, Math.max(0.4, piece.position.z + front.z))];
        walker = 'walk:' + entry.at + Math.random();
        spawn(walker, entry.type || 'folk', to, false);
        const path = doorIn().concat([to]); for (let i = 1; i < path.length; i++) wait += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]) / WALK;
        wait += 0.4;
      }
    }
    flights.push({ piece, from: piece ? piece.position.clone() : null, q: piece ? piece.quaternion.clone() : null, to: top, t: -wait, price: entry.sold.price, coins: null, walker });
    dirty = true;
  }
  function stepFlights(dt) {
    for (let i = flights.length - 1; i >= 0; i--) {
      const f = flights[i]; f.t += dt;
      if (f.t < 0) continue;
      const LIFT = 0.35, FLY = 0.75;
      if (f.piece) {
        if (f.t < LIFT) { const k = f.t / LIFT; f.piece.position.copy(f.from).y += 0.3 * Math.sin(k * Math.PI / 2); }
        else if (f.t < LIFT + FLY) {
          const k = (f.t - LIFT) / FLY, e = k * k * (3 - 2 * k), a = f.from.clone().setY(f.from.y + 0.3);
          f.piece.position.lerpVectors(a, f.to, e); f.piece.position.y += Math.sin(e * Math.PI) * 0.6;
          f.piece.scale.setScalar(1 - 0.55 * e); f.piece.rotation.y += dt * 6;
        } else if (f.piece.parent) { flyG.remove(f.piece); forgetPiece(f.piece); f.piece = null; }
      }
      const tc = f.from ? LIFT + FLY : 0;
      if (f.t >= tc && !f.coins) { f.coins = coinText(f.price); f.coins.position.copy(f.to); flyG.add(f.coins); if (f.walker) setTimeout(() => leave(f.walker), 500); }
      if (f.coins) {
        const k = (f.t - tc) / 1.4; f.coins.position.y = f.to.y + 0.2 + k * 0.7; f.coins.material.opacity = Math.min(1, 3 * (1 - k));
        if (k >= 1) { flyG.remove(f.coins); f.coins.material.map.dispose(); f.coins.material.dispose(); flights.splice(i, 1); }
      }
    }
    // stands taken off a shelf and never sold (taken down, moved): let them go
    const now = performance.now();
    for (const [id, s] of [...lately]) if (now - s.at > 4000) { lately.delete(id); forget(s); }
    return flights.length > 0;
  }
  function forgetPiece(p) { const keep = p.userData.keepMap; p.traverse(m => { if (m.material) { if (m.material.map && !keep) m.material.map.dispose(); m.material.dispose(); } }); }

  // ---------- people ----------
  // where a customer stands: the kept tiles before the counter (not the doorways)
  const counterFront = () => { const k = [...kept(room)].filter(t => t !== '0,' + DOOR_Z && t !== WORK_DOOR_X + ',0').map(t => t.split(',').map(Number)); return k.length ? k : [[2, DOOR_Z]]; };
  const doorIn = () => [[-1.2, DOOR_Z + 0.5], [0.6, DOOR_Z + 0.5]];
  function spawn(id, kind, to, stay) {
    if (people.has(id)) return;
    const p = { obj: new THREE.Group(), path: doorIn().concat([to]), at: 0, stay, gone: false };
    p.obj.position.set(p.path[0][0], 0, p.path[0][1]);
    people.set(id, p); peopleG.add(p.obj);
    model(FIGURES[kind] || 'folk').then(src => { p.obj.add(placed(src)); dirty = true; }).catch(() => {});
  }
  function leave(id) {
    const p = people.get(id); if (!p || p.gone) return;
    p.gone = true; const here = [p.obj.position.x, p.obj.position.z];
    p.path = [here, [0.6, DOOR_Z + 0.5], [-1.4, DOOR_Z + 0.5]]; p.at = 0;
  }
  // the queue at the counter: the first at its front, the rest waiting behind them toward the door
  let lastQueue = [];
  function setQueue(queue) {
    lastQueue = queue.map(c => ({ id: c.id, type: c.type }));
    if (view !== 'shop') queue = [];   // customers are in the shop front
    const front = counterFront(), ids = new Set(queue.map(c => c.id));
    for (const id of people.keys()) if (!id.startsWith('staff:') && !ids.has(id)) leave(id);
    queue.forEach((c, i) => {
      const spot = i === 0 ? [front[0][0] + 0.5, front[0][1] + 0.5] : [Math.max(0.6, front[0][0] + 0.5 - i * 0.9), front[0][1] + 0.5 + Math.min(1, i * 0.3)];
      if (!people.has(c.id)) spawn(c.id, c.type === 'seller' ? 'seller' : c.type, spot, true);
      else { const p = people.get(c.id); if (!p.gone) { const last = p.path[p.path.length - 1]; if (last[0] !== spot[0] || last[1] !== spot[1]) { p.path = [[p.obj.position.x, p.obj.position.z], spot]; p.at = 0; } } }
    });
  }
  // a walk-in who served themselves: in to a shelf, a moment, out again
  function walkIn(entry) {
    if (view !== 'shop') return;
    const shelves = room.items.filter(i => i.kind === 'shelf'); if (!shelves.length) return;
    const s = shelves[Math.floor(Math.random() * shelves.length)], [fx, fz] = fpOf(s), id = 'walk:' + entry.at + Math.random();
    const to = [Math.min(size.w - 0.5, Math.max(0.5, s.x + fx / 2)), Math.min(size.d - 0.5, s.z + fz + 0.4)];
    spawn(id, entry.type || 'folk', to, false);
    setTimeout(() => leave(id), 2600);
  }
  function setStaff(save) {
    const want = { 'staff:maker': 'maker' }, c = (save.staff || []).find(p => p.role === 'clerk');
    if (c) want['staff:clerk'] = 'clerk';
    for (const id of [...people.keys()].filter(i => i.startsWith('staff:'))) if (!want[id]) { peopleG.remove(people.get(id).obj); people.delete(id); }
    const anvil = room.items.find(i => i.kind === 'anvil'), counter = room.items.find(i => i.kind === 'counter');
    const place = (id, x, z, face) => {
      let p = people.get(id);
      if (!p) { p = { obj: new THREE.Group(), path: null, stay: true }; people.set(id, p); peopleG.add(p.obj); model(FIGURES[want[id]]).then(src => { p.obj.add(placed(src)); dirty = true; }).catch(() => {}); }
      p.obj.position.set(x, 0, z); p.obj.rotation.y = face; dirty = true;
    };
    if (!anvil) { const m = people.get('staff:maker'); if (m) { peopleG.remove(m.obj); people.delete('staff:maker'); } }
    if (!counter) { const k = people.get('staff:clerk'); if (k) { peopleG.remove(k.obj); people.delete('staff:clerk'); } }
    if (anvil) place('staff:maker', anvil.x + 0.5, anvil.z + 1.25, Math.PI);
    if (c && counter) { const [fx] = fpOf(counter); place('staff:clerk', counter.x + fx / 2, Math.max(0.4, counter.z - 0.45), 0); }
  }
  function stepPeople(dt) {
    let moving = false;
    for (const [id, p] of people) {
      if (!p.path || p.at >= p.path.length - 1) { if (p.gone) { peopleG.remove(p.obj); people.delete(id); } continue; }
      moving = true;
      const [tx, tz] = p.path[p.at + 1], dx = tx - p.obj.position.x, dz = tz - p.obj.position.z, dist = Math.hypot(dx, dz);
      const go = WALK * dt;
      if (dist <= go) { p.obj.position.x = tx; p.obj.position.z = tz; p.at++; }
      else { p.obj.position.x += dx / dist * go; p.obj.position.z += dz / dist * go; }
      if (dist > 0.01) p.obj.rotation.y = Math.atan2(dx, dz);
      p.obj.position.y = Math.abs(Math.sin(performance.now() / 120)) * 0.04;
    }
    return moving;
  }

  // ---------- taps: a short press without much movement ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  renderer.domElement.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  renderer.domElement.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10 || performance.now() - down.t > 500) { down = null; return; }
    down = null;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects([itemsG, peopleG, roomG], true);
    const item = hits.find(h => h.object.userData.item), stand = hits.find(h => h.object.userData.slot != null);
    const person = hits.find(h => { let o = h.object; while (o && !o.parent?.isScene) { if (peopleG.children.includes(o)) return true; o = o.parent; } return false; });
    // the floor tile under the tap: where the ray meets y = 0
    const t = ray.ray.origin.y / -ray.ray.direction.y, fx = ray.ray.origin.x + ray.ray.direction.x * t, fz = ray.ray.origin.z + ray.ray.direction.z * t;
    const tile = fx >= 0 && fz >= 0 && fx < size.w && fz < size.d ? [Math.floor(fx), Math.floor(fz)] : null;
    const door = hits.find(h => h.object.userData.door);
    if (onTap) onTap({ slot: stand ? stand.object.userData.slot : null, door: door && !item ? door.object.userData.door : null, item: item && item.object.userData.item, kind: item && room.items.find(i => i.id === item.object.userData.item)?.kind, person: !!person && !item, tile });
  });

  let last = performance.now();
  return {
    // show the shop front or the workshop: everything in view rebuilt for that room
    setRoom(r, save) {
      const v = r.kind === 'work' || r.kind === 'hall' ? r.kind : 'shop', changed = v !== view || r !== room;
      if (changed) { for (const slot of [...stands.keys()]) dropStand(slot); for (const o of itemObjs.values()) itemsG.remove(o); itemObjs.clear(); for (const [id, p] of [...people]) { peopleG.remove(p.obj); people.delete(id); } }
      const coast = !!(save && save.region && save.region !== 'reach'), seaChanged = coast !== sea; sea = coast;
      view = v; room = r; const s = sizeOf(r);
      if (changed || seaChanged || s.w !== size.w || s.d !== size.d || !roomG.children.length) { size = { w: s.w, d: s.d }; buildRoom(); fitCamera(); }
      syncItems(); setStaff(save); drawMarks(); if (folk) setQueue(lastQueue);
    },
    get view() { return view; },
    setQueue: folk ? setQueue : () => {}, walkIn: folk ? walkIn : () => {}, sold: folk ? sold : () => {},
    setShelf(list) { shown = list; drawStands(); },
    arrange(on, sel = null) { arranging = on; selected = sel; drawMarks(); dirty = true; },
    canPlace(it) { return fits(room, it, it.id); },
    tick() {
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      const moving = stepPeople(dt) | stepFlights(dt);
      if (moving || dirty) { renderer.render(scene, camera); dirty = false; }
    },
    redraw() { dirty = true; },
    setCold(on) { if (on === cold) return; cold = on; ember.intensity = view === 'hall' ? 4 : view === 'work' ? (cold ? 0.35 : 6) : (cold ? 0.6 : 2.5); dirty = true; },
  };
}
