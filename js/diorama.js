// The shop in 3D: a cut-away room seen from the front corner, the furniture where the room rules put it, customers walking
// in to the counter. Loaded only when the shop is opened. Three.js comes through the page's import map as 'three'.
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/three/loaders/GLTFLoader.js';
import { FURNITURE, DOOR_Z } from './data.js?v=9';
import { sizeOf, tilesOf, fpOf, kept, fits } from './room.js?v=9';

const MODELS = 'assets/models/', M = '?m=4';   // bump m when tools/models.sh rebuilds them
const FIGURES = { folk: 'folk', guard: 'dwarf', traveller: 'carter', delver: 'bard', factor: 'chandler', collector: 'herbalist', seller: 'carter', maker: 'smith', clerk: 'chandler' };
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

export async function create(host, { onTap } = {}) {
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
  const roomG = new THREE.Group(), itemsG = new THREE.Group(), peopleG = new THREE.Group(), markG = new THREE.Group();
  scene.add(roomG, itemsG, peopleG, markG);
  let room = null, dirty = true, arranging = false, selected = null, size = { w: 6, d: 5 };
  const itemObjs = new Map();   // item id → its group
  const people = new Map();     // customer id → { obj, path, at, gone }

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

  // the floor, the back and left walls with the doorway, a grid for arranging
  function buildRoom() {
    roomG.clear();
    const { w, d } = size;
    const floor = toonBox(w, 0.12, d, '#4a3424'); floor.position.set(w / 2, -0.06, d / 2); floor.userData.floor = true; roomG.add(floor);
    for (let x = 0; x < w; x++) for (let z = 0; z < d; z++) if ((x + z) % 2) { const t = toonBox(0.98, 0.01, 0.98, '#54392a'); t.position.set(x + 0.5, 0.005, z + 0.5); roomG.add(t); }
    const back = toonBox(w + 0.2, 2.6, 0.2, '#6a5040'); back.position.set(w / 2, 1.3, -0.1); roomG.add(back);
    const beam = toonBox(w + 0.2, 0.18, 0.26, '#3b2414'); beam.position.set(w / 2, 2.62, -0.1); roomG.add(beam);
    // the left wall, cut for the door at DOOR_Z
    const segA = toonBox(0.2, 2.6, DOOR_Z, '#5e4636'); segA.position.set(-0.1, 1.3, DOOR_Z / 2); roomG.add(segA);
    const restD = d - DOOR_Z - 1; if (restD > 0) { const segB = toonBox(0.2, 2.6, restD, '#5e4636'); segB.position.set(-0.1, 1.3, DOOR_Z + 1 + restD / 2); roomG.add(segB); }
    const lintel = toonBox(0.24, 0.5, 1.1, '#3b2414'); lintel.position.set(-0.1, 2.35, DOOR_Z + 0.5); roomG.add(lintel);
    const step = toonBox(0.6, 0.06, 1, '#2a1c12'); step.position.set(-0.3, 0.03, DOOR_Z + 0.5); roomG.add(step);
    ember.position.set(1, 1.2, 1.2);
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
      if (!o) {
        o = new THREE.Group(); o.userData.item = it.id; itemObjs.set(it.id, o); itemsG.add(o);
        model(FURNITURE[it.kind].model).then(src => { const p = placed(src, FURNITURE[it.kind].fp); p.traverse(m => { m.userData.item = it.id; }); o.add(p); dirty = true; }).catch(() => {});
      }
      const [fx, fz] = fpOf(it);
      o.position.set(it.x + fx / 2, 0, it.z + fz / 2);
      o.rotation.y = -it.rot * Math.PI / 2;
    }
    const forge = room.items.find(i => i.kind === 'forge'); if (forge) { const [fx, fz] = fpOf(forge); ember.position.set(forge.x + fx / 2, 1.0, forge.z + fz + 0.3); }
    dirty = true;
  }

  // ---------- people ----------
  const counterFront = () => { const k = [...kept(room)].filter(t => t !== '0,' + DOOR_Z).map(t => t.split(',').map(Number)); return k.length ? k : [[2, DOOR_Z]]; };
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
    const item = hits.find(h => h.object.userData.item);
    const person = hits.find(h => { let o = h.object; while (o && !o.parent?.isScene) { if (peopleG.children.includes(o)) return true; o = o.parent; } return false; });
    // the floor tile under the tap: where the ray meets y = 0
    const t = ray.ray.origin.y / -ray.ray.direction.y, fx = ray.ray.origin.x + ray.ray.direction.x * t, fz = ray.ray.origin.z + ray.ray.direction.z * t;
    const tile = fx >= 0 && fz >= 0 && fx < size.w && fz < size.d ? [Math.floor(fx), Math.floor(fz)] : null;
    if (onTap) onTap({ item: item && item.object.userData.item, kind: item && room.items.find(i => i.id === item.object.userData.item)?.kind, person: !!person && !item, tile });
  });

  let last = performance.now();
  return {
    setRoom(r, save) {
      room = r; const s = sizeOf(r);
      if (s.w !== size.w || s.d !== size.d || !roomG.children.length) { size = { w: s.w, d: s.d }; buildRoom(); fitCamera(); }
      syncItems(); setStaff(save); drawMarks(); setQueue(lastQueue);
    },
    setQueue, walkIn,
    arrange(on, sel = null) { arranging = on; selected = sel; drawMarks(); dirty = true; },
    canPlace(it) { return fits(room, it, it.id); },
    tick() {
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      const moving = stepPeople(dt);
      if (moving || dirty) { renderer.render(scene, camera); dirty = false; }
    },
    redraw() { dirty = true; },
  };
}
