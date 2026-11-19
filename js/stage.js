// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// The stage: the fire, the anvil, the piece taking shape, the hammer and the heat meter, drawn on a 1280 × 720 canvas.
import { FORGE, KC } from './data.js?v=67';
import { trueZone } from './rules.js?v=67';

// two layouts: wide (a desktop, a phone on its side) and tall (a phone held upright), the same drawing moved and scaled
export const LAYOUTS = {
  wide: { W: 1280, H: 720, fx: 150, fy: 470, ax: 680, ay: 520, sc: 1, mx: 1160, my: 110 },
  tall: { W: 760, H: 860, fx: 150, fy: 650, ax: 318, ay: 450, sc: 0.78, mx: 676, my: 90 },
};
const lerp = (a, b, t) => a + (b - a) * t;
function mix(cols, t) {
  t = Math.max(0, Math.min(1, t)) * (cols.length - 1);
  const i = Math.min(cols.length - 2, Math.floor(t)), f = t - i;
  const a = parseInt(cols[i].slice(1), 16), b = parseInt(cols[i + 1].slice(1), 16);
  const ch = s => Math.round(lerp((a >> s) & 255, (b >> s) & 255, f));
  return 'rgb(' + ch(16) + ',' + ch(8) + ',' + ch(0) + ')';
}
// each piece from the bar to its shape: ten points, the top edge left to right then the bottom edge right to left
const BAR = [[-150, -32], [-75, -34], [0, -34], [75, -34], [150, -32], [150, 32], [75, 34], [0, 34], [-75, 34], [-150, 32]];
const SHAPES = {
  falchion: { to: [[-230, -14], [-60, -20], [90, -30], [210, -44], [300, -8], [250, 24], [130, 30], [0, 24], [-120, 18], [-230, 14]] },
  dagger: { to: [[-150, -18], [-40, -16], [70, -13], [190, -9], [300, 0], [300, 2], [190, 10], [70, 14], [-40, 16], [-150, 18]] },
  axe: { to: [[-70, -28], [0, -38], [70, -66], [130, -92], [180, -56], [180, 30], [130, 34], [70, 34], [0, 34], [-70, 28]] },
  helm: { to: [[-130, 34], [-122, -70], [0, -150], [122, -70], [130, 34], [100, 34], [50, 34], [0, 34], [-50, 34], [-100, 34]] },
  ring: { to: [[-74, -8], [-52, -62], [0, -82], [52, -62], [74, -8], [74, 8], [52, 34], [0, 34], [-52, 34], [-74, 8]], hole: true },
};

// view: { flash, ring, ringC, sparks } — the moment-to-moment effects the page keeps
export function paint(g, S, view, dt, L = LAYOUTS.wide) {
  const c = S.station || FORGE, W = L.W, H = L.H;
  g.clearRect(0, 0, W, H);
  const heat = S.meter / 100, now = performance.now();
  if (c.id === 'stretcher') drawStretcher(g, S, view, L, heat, now, c);
  else if (c.id === 'bowbench') drawBench(g, S, view, L, heat, now, c);
  else if (c.id === 'kettle') drawKettle(g, S, view, L, heat, now, c);
  else if (c.id === 'glass') drawGlass(g, S, view, L, heat, now, c);
  else drawForge(g, S, view, L, heat, now, c);
  for (const s of view.sparks) { if (!s.init) { s.x = L.ax; s.y = L.ay - (c.id === 'stretcher' ? 200 : 80) * L.sc; s.init = 1; } s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 900 * dt; s.t -= dt; }
  view.sparks = view.sparks.filter(s => s.t > 0);
  for (const s of view.sparks) { g.fillStyle = s.c; g.globalAlpha = Math.min(1, s.t * 2); if (c.id !== 'forge') { g.beginPath(); g.arc(s.x, s.y, 3, 0, 7); g.fill(); } else g.fillRect(s.x, s.y, 6, 6); }
  g.globalAlpha = 1;
  drawMeter(g, S, L, heat, now, c);
}

function drawForge(g, S, view, L, heat, now, c) {
  const shape = SHAPES[S.cfg.patternId];
  const fx = 150, fy = 470;
  g.save(); g.translate(L.fx - fx, L.fy - fy);   // the fire
  const glow = g.createRadialGradient(fx, fy, 10, fx, fy, 260);
  const strong = S.inFire ? 0.6 : 0.18;
  glow.addColorStop(0, 'rgba(255,120,40,' + strong + ')'); glow.addColorStop(1, 'rgba(255,120,40,0)');
  g.fillStyle = glow; g.fillRect(0, 160, 420, 560);
  g.fillStyle = '#1a1210'; g.fillRect(60, 510, 200, 120);
  g.fillStyle = '#ff8a2a';
  for (let i = 0; i < 6; i++) { const f = Math.sin(now / 180 + i) * 8; g.globalAlpha = 0.35 + strong * 0.6; g.beginPath(); g.ellipse(90 + i * 28, 490 - f, 14, 30 + f, 0, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1;
  g.fillStyle = 'rgba(236,224,198,.6)'; g.font = '800 22px "Alegreya Sans", sans-serif'; g.textAlign = 'center';
  g.fillText('THE FIRE', 160, 665);
  g.restore();

  // the anvil
  const ax = 680, ay = 520;
  const onAnvil = () => { g.translate(L.ax, L.ay); g.scale(L.sc, L.sc); g.translate(-ax, -ay); };
  g.save(); onAnvil();
  g.fillStyle = '#2a2420';
  g.beginPath(); g.moveTo(ax - 300, ay); g.lineTo(ax + 260, ay); g.lineTo(ax + 330, ay - 30); g.lineTo(ax + 200, ay - 40); g.lineTo(ax - 300, ay - 40); g.closePath(); g.fill();
  g.fillRect(ax - 140, ay, 260, 60); g.fillRect(ax - 200, ay + 60, 380, 40);
  g.restore();

  // the piece
  const t = Math.min(1, S.shape / 100), col = mix(c.colours, heat), inFire = S.inFire;
  const px = inFire ? 300 : ax, py = inFire ? 470 : ay - 74;
  g.save(); if (inFire) g.translate(L.fx - fx, L.fy - fy); else onAnvil();
  g.translate(px, py);
  if (view.flash > 0 && !inFire) g.translate((Math.random() - .5) * 10 * view.flash, (Math.random() - .5) * 10 * view.flash);
  if (inFire) g.scale(0.55, 0.55);
  if (view.ring > 0) { g.save(); g.strokeStyle = view.ringC; g.globalAlpha = view.ring; g.lineWidth = 10 * view.ring; g.beginPath(); g.arc(0, 0, 80 + (1 - view.ring) * 420, 0, 7); g.stroke(); g.restore(); }
  if (t < 1 && !inFire) {   // where it is going
    g.save(); g.setLineDash([10, 8]); g.strokeStyle = 'rgba(232,196,100,.45)'; g.lineWidth = 3; g.beginPath();
    shape.to.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.stroke(); g.restore();
  }
  g.shadowColor = S.white > 0 ? '#fff2c4' : heat > 0.45 ? col : 'transparent';
  g.shadowBlur = S.white > 0 ? 60 : heat > 0.45 ? 40 * heat : 0;
  g.fillStyle = S.white > 0 ? '#fff6dc' : col; g.strokeStyle = '#0e0b09'; g.lineWidth = 6;
  g.beginPath(); BAR.forEach((p, i) => { const x = lerp(p[0], shape.to[i][0], t), y = lerp(p[1], shape.to[i][1], t); i ? g.lineTo(x, y) : g.moveTo(x, y); });
  g.closePath(); g.fill(); g.stroke(); g.shadowBlur = 0;
  if (shape.hole && t > 0.2) { const k = (t - 0.2) / 0.8; g.fillStyle = '#17110d'; g.beginPath(); g.ellipse(0, -22, 44 * k, 36 * k, 0, 0, 7); g.fill(); g.stroke(); }
  if (S.cfg.patternId === 'falchion' && t > 0.85) { g.globalAlpha = Math.min(1, (t - 0.85) / 0.15); g.fillStyle = '#4a3020'; g.fillRect(-320, -15, 80, 30); g.fillStyle = '#7a6a50'; g.fillRect(-246, -40, 16, 80); g.globalAlpha = 1; }
  if (S.frost) { g.strokeStyle = 'rgba(207,232,255,.9)'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { const x = -100 + i * 50; g.beginPath(); g.moveTo(x - 8, -8); g.lineTo(x + 8, 8); g.moveTo(x + 8, -8); g.lineTo(x - 8, 8); g.stroke(); } }
  if (S.crackMarks.length) {
    g.strokeStyle = '#120806'; g.lineWidth = 4;
    S.crackMarks.forEach(r => { const x = -100 + r * 200; g.beginPath(); g.moveTo(x, -22); g.lineTo(x + 8, -6); g.lineTo(x - 4, 6); g.lineTo(x + 6, 22); g.stroke(); });
  }
  g.restore();

  // the hammer: it lands on the strike and rises again
  if (S.phase === 'work' && !inFire) {
    const f = view.flash, top = ay - 170 - (S.cfg.patternId === 'helm' ? 110 * t : S.cfg.patternId === 'ring' || S.cfg.patternId === 'axe' ? 50 * t : 0);
    const hy = top - (1 - f) * 150, tilt = -0.04 - (1 - f) * 0.18;
    g.save(); onAnvil(); g.translate(ax - 20, hy); g.rotate(tilt);
    if (f > 0.5) { g.strokeStyle = 'rgba(255,240,220,.5)'; g.lineWidth = 5; g.lineCap = 'round'; [-30, 0, 30].forEach(x => { g.beginPath(); g.moveTo(x, -80); g.lineTo(x, -20); g.stroke(); }); }
    drawHammer(g);
    g.restore();
  }
}

// a dwarven forging hammer, its striking face down at y 60: a flared iron head with a gold band of runes and two bosses,
// an iron collar, a haft wrapped in leather between brass bands, an iron cap at its end
let HEAD, CAP, RUNES;   // made on the first draw (a page has Path2D; the tests don't)
function drawHammer(g) {
  if (!HEAD) {
    HEAD = new Path2D('M-54 -10 H54 L46 0 V50 L54 60 H-54 L-46 50 V0 Z'); CAP = new Path2D('M254 12 H270 L278 20 V30 L270 38 H254 Z');
    RUNES = new Path2D('M-34 18 v16 M-34 18 l6 6 M-18 18 v16 M-18 26 l6 -8 M-18 26 l6 8 M-2 34 l6 -16 l6 16 M20 18 v16 M20 22 l8 -4 M20 28 l8 -4 M34 18 l-4 8 l4 8');
  }
  g.lineJoin = 'round'; g.strokeStyle = '#0a0807';
  g.fillStyle = '#6b4a2e'; g.lineWidth = 3; g.fillRect(40, 18, 220, 14); g.strokeRect(40, 18, 220, 14);
  g.fillStyle = '#3b2516'; [92, 124, 156, 188, 220].forEach(x => g.fillRect(x, 17, 12, 16));          // the leather wrap
  g.fillStyle = '#c9923e'; g.lineWidth = 2; [[70, 12], [240, 10]].forEach(([x, w]) => { g.fillRect(x, 14, w, 22); g.strokeRect(x, 14, w, 22); });   // brass bands
  g.fillStyle = '#4a4642'; g.lineWidth = 3; g.fill(CAP); g.stroke(CAP);
  g.fillStyle = '#5a5552'; g.fillRect(46, 8, 16, 34); g.strokeRect(46, 8, 16, 34);                  // the collar
  g.fillStyle = '#55514d'; g.lineWidth = 3.5; g.fill(HEAD); g.stroke(HEAD);
  g.strokeStyle = '#9a948c'; g.lineWidth = 3; g.beginPath(); g.moveTo(-50, 57); g.lineTo(50, 57); g.stroke();   // the bright striking face
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(-48, -6); g.lineTo(48, -6); g.stroke();
  g.strokeStyle = '#0a0807'; g.fillStyle = '#c9923e'; g.lineWidth = 3; g.fillRect(-46, 12, 92, 26); g.strokeRect(-46, 12, 92, 26);
  g.strokeStyle = '#3a2408'; g.lineWidth = 2.4; g.lineCap = 'square'; g.stroke(RUNES); g.lineCap = 'butt';
  g.strokeStyle = '#0a0807'; g.fillStyle = '#46423e'; g.lineWidth = 2.5;
  [1, 41].forEach(y => { g.fillRect(-14, y, 28, 9); g.strokeRect(-14, y, 28, 9); });               // the bosses
  g.fillStyle = '#9a948c'; [5.5, 45.5].forEach(y => { g.beginPath(); g.arc(0, y, 2.4, 0, Math.PI * 2); g.fill(); });
}

// the stretcher: the soak tub where the fire was, a laced frame where the anvil was, the hide drawn into its cut
const HIDE = [[-200, -150], [-100, -158], [0, -150], [100, -158], [200, -150], [206, 150], [100, 158], [0, 150], [-100, 158], [-206, 150]];
const CUTS = {
  jerkin: [[-150, -130], [-60, -150], [0, -112], [60, -150], [150, -130], [122, 150], [60, 150], [0, 150], [-60, 150], [-122, 150]],
  hood: [[-112, 140], [-122, -40], [0, -150], [122, -40], [112, 140], [60, 118], [30, 108], [0, 104], [-30, 108], [-60, 118]],
  gloves: [[-140, -140], [-60, -152], [0, -140], [60, -152], [140, -140], [152, 40], [120, 150], [0, 150], [-120, 150], [-152, 40]],
  boots: [[-110, -150], [0, -150], [20, -150], [40, -150], [62, -150], [62, 60], [182, 92], [182, 150], [0, 150], [-110, 150]],
};
function drawStretcher(g, S, view, L, heat, now, c) {
  const cut = CUTS[S.cfg.patternId] || CUTS.jerkin, t = Math.min(1, S.shape / 100), inSoak = S.inFire;
  const fx = 150, fy = 470;
  g.save(); g.translate(L.fx - fx, L.fy - fy);   // the soak
  const glow = g.createRadialGradient(fx, fy, 10, fx, fy, 240);
  glow.addColorStop(0, 'rgba(90,150,210,' + (inSoak ? 0.45 : 0.12) + ')'); glow.addColorStop(1, 'rgba(90,150,210,0)');
  g.fillStyle = glow; g.fillRect(0, 200, 420, 520);
  g.fillStyle = '#4a3020'; g.strokeStyle = '#0e0b09'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(50, 500); g.lineTo(270, 500); g.lineTo(250, 640); g.lineTo(70, 640); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#2a4a6a'; g.beginPath(); g.ellipse(160, 500, 110, 22, 0, 0, 7); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(200,230,255,.35)'; g.lineWidth = 2;
  for (let i = 0; i < 3; i++) { const r = ((now / 900 + i / 3) % 1); g.globalAlpha = 1 - r; g.beginPath(); g.ellipse(160, 500, 20 + r * 80, 4 + r * 16, 0, 0, 7); g.stroke(); }
  g.globalAlpha = 1;
  g.fillStyle = 'rgba(236,224,198,.6)'; g.font = '800 22px "Alegreya Sans", sans-serif'; g.textAlign = 'center';
  g.fillText('THE SOAK', 160, 680);
  g.restore();

  const ax = 680, ay = 520, cy = ay - 200;
  const onFrame = () => { g.translate(L.ax, L.ay); g.scale(L.sc, L.sc); g.translate(-ax, -ay); };
  g.save(); onFrame();   // the frame
  g.fillStyle = '#3b2414'; g.strokeStyle = '#0e0b09'; g.lineWidth = 5;
  for (const x of [ax - 290, ax + 270]) { g.fillRect(x, cy - 230, 22, 470); g.strokeRect(x, cy - 230, 22, 470); }
  g.fillRect(ax - 300, cy - 230, 600, 22); g.strokeRect(ax - 300, cy - 230, 600, 22);
  g.fillRect(ax - 300, cy + 200, 600, 20); g.strokeRect(ax - 300, cy + 200, 600, 20);
  g.restore();

  // the hide: pale dry, dark and blue soaked; drawn into its cut as SHAPE fills
  const col = mix(c.colours, heat);
  g.save();
  if (inSoak) { g.translate(L.fx - fx, L.fy - fy); g.translate(160, 470); g.scale(0.32, 0.18); }
  else { onFrame(); g.translate(ax, cy); if (view.flash > 0) g.translate((Math.random() - .5) * 4 * view.flash, (Math.random() - .5) * 4 * view.flash); }
  if (view.ring > 0) { g.save(); g.strokeStyle = view.ringC; g.globalAlpha = view.ring; g.lineWidth = 10 * view.ring; g.beginPath(); g.arc(0, 0, 120 + (1 - view.ring) * 380, 0, 7); g.stroke(); g.restore(); }
  if (!inSoak) {   // the laces to the frame, and the cut it's going to
    g.strokeStyle = '#5c4b33'; g.lineWidth = 4;
    for (const [hx, hy, fx2, fy2] of [[-200, -150, -280, -220], [200, -150, 280, -220], [-206, 150, -280, 210], [206, 150, 280, 210], [0, -150, 0, -220], [0, 150, 0, 210]]) { g.beginPath(); g.moveTo(hx, hy); g.lineTo(fx2, fy2); g.stroke(); }
    if (t < 1) { g.save(); g.setLineDash([10, 8]); g.strokeStyle = 'rgba(232,196,100,.55)'; g.lineWidth = 3; g.beginPath(); cut.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.stroke(); g.restore(); }
  }
  g.fillStyle = S.white > 0 ? '#f4e6c0' : col; g.strokeStyle = '#0e0b09'; g.lineWidth = 6;
  if (S.white > 0) { g.shadowColor = '#fff2c4'; g.shadowBlur = 50; }
  g.beginPath(); HIDE.forEach((p, i) => { const x = lerp(p[0], cut[i][0], t), y = lerp(p[1], cut[i][1], t); i ? g.lineTo(x, y) : g.moveTo(x, y); });
  g.closePath(); g.fill(); g.stroke(); g.shadowBlur = 0;
  // stitches along the seams as it takes shape; tears where it tore
  const n = Math.floor(t * 18);
  g.fillStyle = '#e8c464';
  for (let i = 0; i < n; i++) { const k = i / 18, x = lerp(-120, 120, k), y = 120 - Math.abs(Math.sin(k * 3.1)) * 10; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }
  if (S.frost) { g.strokeStyle = 'rgba(207,232,255,.9)'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { const x = -100 + i * 50; g.beginPath(); g.moveTo(x - 8, -40); g.lineTo(x + 8, -24); g.moveTo(x + 8, -40); g.lineTo(x - 8, -24); g.stroke(); } }
  g.strokeStyle = '#2a0e08'; g.lineWidth = 5;
  S.crackMarks.forEach(r => { const x = -120 + r * 240; g.beginPath(); g.moveTo(x, -60); g.lineTo(x + 10, -30); g.lineTo(x - 6, 0); g.lineTo(x + 8, 30); g.stroke(); });
  g.restore();

  // the awl: down through the hide on a stitch, up again
  if (S.phase === 'work' && !inSoak) {
    const f = view.flash, y = cy - 40 - (1 - f) * 120;
    g.save(); onFrame(); g.translate(ax + 60, y); g.rotate(0.25);
    g.fillStyle = '#5a4030'; g.strokeStyle = '#000'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(0, -70, 18, 34, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#c9c5be'; g.beginPath(); g.moveTo(-5, -38); g.lineTo(5, -38); g.lineTo(1, 60); g.lineTo(-1, 60); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
}

// the bench: a steam box where the fire was, a long bench where the anvil was, the stave bent toward its line, the grain shown
function drawBench(g, S, view, L, heat, now, c) {
  const t = Math.min(1, S.shape / 100), inSteam = S.inFire, id = S.cfg.patternId, col = mix(c.colours, heat);
  const fx = 150, fy = 470;
  g.save(); g.translate(L.fx - fx, L.fy - fy);   // the steam box
  g.fillStyle = '#4a3020'; g.strokeStyle = '#0e0b09'; g.lineWidth = 6;
  g.fillRect(40, 470, 240, 150); g.strokeRect(40, 470, 240, 150);
  g.fillStyle = '#2a1c12'; g.fillRect(60, 490, 200, 30);
  g.fillStyle = 'rgba(240,240,240,' + (inSteam ? 0.5 : 0.18) + ')';
  for (let i = 0; i < 7; i++) { const r = ((now / 1400 + i / 7) % 1), x = 80 + (i * 37) % 170 + Math.sin(now / 500 + i) * 10; g.globalAlpha = (1 - r) * (inSteam ? 0.6 : 0.25); g.beginPath(); g.arc(x, 470 - r * 200, 16 + r * 28, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  g.fillStyle = 'rgba(236,224,198,.6)'; g.font = '800 22px "Alegreya Sans", sans-serif'; g.textAlign = 'center';
  g.fillText('THE STEAM', 160, 660);
  g.restore();

  const ax = 680, ay = 520, py = ay - 120;
  const onBench = () => { g.translate(L.ax, L.ay); g.scale(L.sc, L.sc); g.translate(-ax, -ay); };
  g.save(); onBench();   // the bench
  g.fillStyle = '#3b2414'; g.strokeStyle = '#0e0b09'; g.lineWidth = 5;
  g.fillRect(ax - 380, ay - 40, 760, 36); g.strokeRect(ax - 380, ay - 40, 760, 36);
  for (const x of [ax - 340, ax + 300]) { g.fillRect(x, ay - 4, 34, 130); g.strokeRect(x, ay - 4, 34, 130); }
  // the form: two pegs the stave is bent around
  g.fillStyle = '#6e6b70'; for (const x of [ax - 300, ax, ax + 300]) { g.beginPath(); g.arc(x, ay - 52, 12, 0, 7); g.fill(); g.stroke(); }
  g.restore();

  g.save();
  if (inSteam) { g.translate(L.fx - fx, L.fy - fy); g.translate(160, 505); g.scale(0.32, 0.32); }
  else { onBench(); g.translate(ax, py); if (view.flash > 0) g.translate((Math.random() - .5) * 5 * view.flash, 0); }
  if (view.ring > 0) { g.save(); g.strokeStyle = view.ringC; g.globalAlpha = view.ring; g.lineWidth = 10 * view.ring; g.beginPath(); g.arc(0, 0, 120 + (1 - view.ring) * 380, 0, 7); g.stroke(); g.restore(); }
  g.lineCap = 'round'; g.shadowBlur = 0;
  const wood = S.white > 0 ? '#f4e6c0' : col;
  if (id === 'arrows') {   // a sheaf: shafts straightened, fletched as it takes shape
    for (let i = -2; i <= 2; i++) {
      const y = i * 22, bend = (1 - t) * 14 * Math.sin(i + 1);
      g.strokeStyle = '#0e0b09'; g.lineWidth = 12; g.beginPath(); g.moveTo(-300, y); g.quadraticCurveTo(0, y - bend, 300, y); g.stroke();
      g.strokeStyle = wood; g.lineWidth = 7; g.stroke();
      if (t > 0.3) { g.fillStyle = '#c9c5be'; g.beginPath(); g.moveTo(300, y - 8); g.lineTo(330, y); g.lineTo(300, y + 8); g.fill(); }
      if (t > 0.6) { g.fillStyle = '#d8d0c0'; g.beginPath(); g.moveTo(-300, y); g.lineTo(-260, y - 10); g.lineTo(-240, y); g.lineTo(-260, y + 10); g.fill(); }
    }
  } else if (id === 'staff') {   // a staff: straightened, tapered, a ferrule at its foot
    const w = 30 - t * 8;
    g.strokeStyle = '#0e0b09'; g.lineWidth = w + 8; g.beginPath(); g.moveTo(-340, 0); g.quadraticCurveTo(0, (1 - t) * -40, 340, 0); g.stroke();
    g.strokeStyle = wood; g.lineWidth = w; g.stroke();
    if (t > 0.6) { g.fillStyle = '#6e6b70'; g.fillRect(-350, -w / 2 - 2, 30, w + 4); }
  } else {   // a bow: bent toward its line, strung when it's made
    const bend = t * (id === 'longbow' ? 110 : 130), half = id === 'longbow' ? 360 : 300;
    if (t < 1 && !inSteam) { g.save(); g.setLineDash([10, 8]); g.strokeStyle = 'rgba(232,196,100,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-half, -(id === 'longbow' ? 110 : 130) * 0.2); g.quadraticCurveTo(0, -20 - (id === 'longbow' ? 110 : 130), half, -(id === 'longbow' ? 110 : 130) * 0.2); g.stroke(); g.restore(); }
    if (S.white > 0) { g.shadowColor = '#fff2c4'; g.shadowBlur = 40; }
    g.strokeStyle = '#0e0b09'; g.lineWidth = 30; g.beginPath(); g.moveTo(-half, -bend * 0.2); g.quadraticCurveTo(0, -20 - bend, half, -bend * 0.2); g.stroke();
    g.strokeStyle = wood; g.lineWidth = 22; g.stroke(); g.shadowBlur = 0;
    if (t >= 1) { g.strokeStyle = '#ece0c6'; g.lineWidth = 2; g.beginPath(); g.moveTo(-half, -bend * 0.2); g.lineTo(half, -bend * 0.2); g.stroke(); }
  }
  // splits where it split
  g.strokeStyle = '#2a0e08'; g.lineWidth = 4;
  S.crackMarks.forEach(r => { const x = -200 + r * 400; g.beginPath(); g.moveTo(x - 20, -6); g.lineTo(x, 2); g.lineTo(x + 24, -4); g.stroke(); });
  if (S.frost) { g.strokeStyle = 'rgba(207,232,255,.9)'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { const x = -100 + i * 50; g.beginPath(); g.moveTo(x - 8, -60); g.lineTo(x + 8, -44); g.moveTo(x + 8, -60); g.lineTo(x - 8, -44); g.stroke(); } }
  g.restore();

  // the grain: arrows along the stave, green with it, red across it
  if (S.phase === 'work' && !inSteam) {
    const across = S.station.grain && (S.grainT || 0) % (S.station.grain.with + S.station.grain.across) >= S.station.grain.with;
    g.save(); onBench(); g.translate(ax, ay + 60);
    g.strokeStyle = across ? '#c4483a' : '#8fc46a'; g.lineWidth = 5; g.lineCap = 'round';
    for (let i = -3; i <= 3; i++) { g.beginPath(); if (across) { g.moveTo(i * 44, -16); g.lineTo(i * 44, 16); } else { g.moveTo(i * 44 - 16, 0); g.lineTo(i * 44 + 16, 0); } g.stroke(); }
    g.fillStyle = across ? '#c4483a' : '#8fc46a'; g.font = '800 24px "Alegreya Sans", sans-serif'; g.textAlign = 'center';
    g.fillText(across ? 'ACROSS THE GRAIN · WAIT' : 'WITH THE GRAIN', 0, 52);
    g.restore();
    // the drawknife: two handles, a blade drawn along the stave on a bend
    const f = view.flash, x = ax - 120 + (1 - f) * 240;
    g.save(); onBench(); g.translate(x, py - 70 + f * 30);
    g.fillStyle = '#5a4030'; g.strokeStyle = '#000'; g.lineWidth = 3;
    g.fillRect(-90, -10, 30, 60); g.strokeRect(-90, -10, 30, 60); g.fillRect(60, -10, 30, 60); g.strokeRect(60, -10, 30, 60);
    g.fillStyle = '#c9c5be'; g.fillRect(-62, 30, 124, 12); g.strokeRect(-62, 30, 124, 12);
    g.restore();
  }
}

// the kettle: the pot over its fire where the anvil was, the brew coloured by the boil, three bottles filling as it takes shape
function drawKettle(g, S, view, L, heat, now, c) {
  const t = Math.min(1, S.shape / 100), herb = S.metal.tint || '#7ac46a';
  const fx = 150, fy = 470;
  g.save(); g.translate(L.fx - fx, L.fy - fy);   // the bottles, filling
  g.fillStyle = '#3b2414'; g.fillRect(40, 560, 240, 20);
  for (let i = 0; i < 3; i++) {
    const x = 80 + i * 80, fill = Math.max(0, Math.min(1, t * 3 - i));
    g.fillStyle = 'rgba(200,230,220,.18)'; g.strokeStyle = '#0e0b09'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(x - 22, 560); g.lineTo(x - 22, 500); g.quadraticCurveTo(x - 22, 480, x - 8, 470); g.lineTo(x - 8, 450); g.lineTo(x + 8, 450); g.lineTo(x + 8, 470); g.quadraticCurveTo(x + 22, 480, x + 22, 500); g.lineTo(x + 22, 560); g.closePath(); g.fill(); g.stroke();
    if (fill > 0) { g.fillStyle = herb; g.globalAlpha = 0.85; g.fillRect(x - 19, 558 - fill * 70, 38, fill * 70); g.globalAlpha = 1; }
    g.fillStyle = '#6a4a2a'; g.fillRect(x - 9, 442, 18, 10);
  }
  g.fillStyle = 'rgba(236,224,198,.6)'; g.font = '800 22px "Alegreya Sans", sans-serif'; g.textAlign = 'center';
  g.fillText('THE BATCH', 160, 620);
  g.restore();

  const ax = 680, ay = 520;
  g.save(); g.translate(L.ax, L.ay); g.scale(L.sc, L.sc); g.translate(-ax, -ay);
  // the fire under the pot
  const glow = g.createRadialGradient(ax, ay + 40, 10, ax, ay + 40, 260);
  glow.addColorStop(0, 'rgba(255,120,40,' + (0.15 + heat * 0.5) + ')'); glow.addColorStop(1, 'rgba(255,120,40,0)');
  g.fillStyle = glow; g.fillRect(ax - 300, ay - 200, 600, 400);
  g.fillStyle = '#ff8a2a';
  for (let i = 0; i < 7; i++) { const f = Math.sin(now / 160 + i) * 6; g.globalAlpha = 0.3 + heat * 0.6; g.beginPath(); g.ellipse(ax - 120 + i * 40, ay + 50 - f, 14, 22 + f + heat * 14, 0, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  g.fillStyle = '#2a2420'; g.strokeStyle = '#0e0b09'; g.lineWidth = 6;
  g.beginPath(); g.ellipse(ax, ay + 80, 200, 30, 0, 0, 7); g.fill(); g.stroke();
  // the pot
  if (view.flash > 0) g.translate((Math.random() - .5) * 4 * view.flash, 0);
  g.fillStyle = '#1e1a18';
  g.beginPath(); g.moveTo(ax - 210, ay - 140); g.quadraticCurveTo(ax - 240, ay + 40, ax, ay + 50); g.quadraticCurveTo(ax + 240, ay + 40, ax + 210, ay - 140); g.closePath(); g.fill(); g.stroke();
  // the brew: the herb's colour turning to the boil's as it takes, bubbles with the heat
  const brew = mix([herb, mix(c.colours, heat)], 0.35 + t * 0.4);
  if (view.ring > 0) { g.save(); g.strokeStyle = view.ringC; g.globalAlpha = view.ring; g.lineWidth = 10 * view.ring; g.beginPath(); g.arc(ax, ay - 140, 120 + (1 - view.ring) * 380, 0, 7); g.stroke(); g.restore(); }
  g.fillStyle = S.white > 0 ? '#f4e6c0' : brew;
  g.beginPath(); g.ellipse(ax, ay - 140, 205, 46, 0, 0, 7); g.fill(); g.stroke();
  const nb = Math.floor(heat * 16);
  g.fillStyle = 'rgba(255,240,220,.55)';
  for (let i = 0; i < nb; i++) { const bx = ax + Math.sin(i * 7.1 + now / (320 - heat * 160)) * 170, by = ay - 140 + Math.cos(i * 3.3 + now / 210) * 30; g.beginPath(); g.arc(bx, by, 5 + heat * 7, 0, 7); g.fill(); }
  if (S.meter > S.band[1]) {   // rolling: it's about to boil over
    g.fillStyle = brew; for (let i = 0; i < 5; i++) { const x = ax - 200 + i * 100, d = (now / 6 + i * 37) % 60; g.beginPath(); g.ellipse(x, ay - 130 + d, 10, 16, 0, 0, 7); g.fill(); }
  }
  g.strokeStyle = '#2a0e08'; g.lineWidth = 4;
  S.crackMarks.forEach(r => { const x = ax - 160 + r * 320; g.beginPath(); g.moveTo(x, ay - 100); g.lineTo(x + 8, ay - 70); g.lineTo(x - 4, ay - 40); g.stroke(); });
  // the spoon, round on a stir
  if (S.phase === 'work') {
    const a = now / 300 + view.flash * 3, x = ax + Math.cos(a) * 120, y = ay - 150 + Math.sin(a) * 26;
    g.strokeStyle = '#000'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 70, y - 220); g.stroke();
    g.strokeStyle = '#8a6a42'; g.lineWidth = 10; g.stroke();
  }
  g.restore();
}

// the glass: the glory hole where the fire was, the marver where the anvil was, the gather on its pipe blown into its shape
// the gather: each point of the shape, pulled in to a round blob along its own direction, so the blowing swells outward
const blobOf = to => to.map(([x, y]) => { const a = Math.atan2(y, x); return [Math.cos(a) * 70, Math.sin(a) * 60]; });
const GLASSES = {
  lens: Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return [Math.cos(a) * 30, Math.sin(a) * 110]; }),
  goblet: [[-90, -110], [-40, -110], [40, -110], [90, -110], [80, -20], [20, 20], [16, 90], [70, 110], [-70, 110], [-16, 90], [-20, 20], [-80, -20]],
  pane: [[-150, -100], [-50, -100], [50, -100], [150, -100], [150, 0], [150, 100], [50, 100], [-50, 100], [-150, 100], [-150, 0], [-150, -60], [-150, -80]],
  bottles: [[-20, -120], [20, -120], [20, -70], [60, -40], [70, 20], [70, 110], [0, 115], [-70, 110], [-70, 20], [-60, -40], [-20, -70], [-20, -100]],
};
function drawGlass(g, S, view, L, heat, now, c) {
  const t = Math.min(1, S.shape / 100), inHole = S.inFire, to = GLASSES[S.cfg.patternId] || GLASSES.lens;
  const fx = 150, fy = 470;
  g.save(); g.translate(L.fx - fx, L.fy - fy);   // the glory hole
  const glow = g.createRadialGradient(160, 480, 10, 160, 480, 240);
  glow.addColorStop(0, 'rgba(255,150,60,' + (inHole ? 0.65 : 0.3) + ')'); glow.addColorStop(1, 'rgba(255,150,60,0)');
  g.fillStyle = glow; g.fillRect(0, 220, 420, 500);
  g.fillStyle = '#4a3a34'; g.strokeStyle = '#0e0b09'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(40, 640); g.lineTo(40, 420); g.quadraticCurveTo(160, 330, 280, 420); g.lineTo(280, 640); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = inHole ? '#ffd27a' : '#f08a2a'; g.beginPath(); g.ellipse(160, 480, 52, 44, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = 'rgba(236,224,198,.6)'; g.font = '800 22px "Alegreya Sans", sans-serif'; g.textAlign = 'center';
  g.fillText('THE GLORY HOLE', 160, 680);
  g.restore();

  const ax = 680, ay = 520;
  const onMarver = () => { g.translate(L.ax, L.ay); g.scale(L.sc, L.sc); g.translate(-ax, -ay); };
  g.save(); onMarver();   // the marver: a flat iron slab on a stand
  g.fillStyle = '#2a2420'; g.strokeStyle = '#0e0b09'; g.lineWidth = 5;
  g.fillRect(ax - 260, ay - 30, 520, 34); g.strokeRect(ax - 260, ay - 30, 520, 34);
  g.fillStyle = '#6e6b70'; g.fillRect(ax - 250, ay - 40, 500, 12);
  for (const x of [ax - 220, ax + 190]) { g.fillStyle = '#2a2420'; g.fillRect(x, ay + 4, 30, 120); g.strokeRect(x, ay + 4, 30, 120); }
  g.restore();

  // the gather, blown toward its shape; it glows with the heat and sags when it runs
  const col = mix(c.colours, heat), cobalt = S.parts && S.parts[2] && S.parts[2].name === 'Cobalt';
  g.save();
  if (inHole) { g.translate(L.fx - fx, L.fy - fy); g.translate(160, 480); g.scale(0.4, 0.4); }
  else { onMarver(); g.translate(ax - 40, ay - 170); if (view.flash > 0) g.scale(1 + view.flash * 0.06, 1 - view.flash * 0.04); }
  if (view.ring > 0) { g.save(); g.strokeStyle = view.ringC; g.globalAlpha = view.ring; g.lineWidth = 10 * view.ring; g.beginPath(); g.arc(0, 0, 120 + (1 - view.ring) * 380, 0, 7); g.stroke(); g.restore(); }
  if (!inHole) {   // the blowpipe, out to the right
    g.strokeStyle = '#0e0b09'; g.lineWidth = 16; g.beginPath(); g.moveTo(90, 0); g.lineTo(520, -60); g.stroke();
    g.strokeStyle = '#8a8680'; g.lineWidth = 9; g.stroke();
    if (t < 1) { g.save(); g.setLineDash([10, 8]); g.strokeStyle = 'rgba(232,196,100,.55)'; g.lineWidth = 3; g.beginPath(); to.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.stroke(); g.restore(); }
  }
  const sag = S.meter > S.band[1] ? (S.meter - S.band[1]) * 0.6 : 0;
  g.shadowColor = S.white > 0 ? '#fff2c4' : col; g.shadowBlur = S.white > 0 ? 60 : 20 + heat * 30;
  g.fillStyle = S.white > 0 ? '#fff6dc' : col; g.globalAlpha = 0.92; g.strokeStyle = '#0e0b09'; g.lineWidth = 5;
  const BLOB = blobOf(to);
  g.beginPath(); BLOB.forEach((p, i) => { const q = to[i], x = lerp(p[0], q[0], t), y = lerp(p[1], q[1], t) + (y0 => y0 > 0 ? sag * (y0 / 110) : 0)(lerp(p[1], q[1], t)); i ? g.lineTo(x, y) : g.moveTo(x, y); });
  g.closePath(); g.fill(); g.globalAlpha = 1; g.stroke(); g.shadowBlur = 0;
  if (cobalt) { g.fillStyle = 'rgba(40,80,200,.35)'; g.fill(); }
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-20, -30, 10, 26, 0.3, 0, 7); g.fill();
  g.strokeStyle = '#120806'; g.lineWidth = 3;
  S.crackMarks.forEach(r => { const x = -50 + r * 100; g.beginPath(); g.moveTo(x, -40); g.lineTo(x + 12, -10); g.lineTo(x - 8, 14); g.lineTo(x + 10, 40); g.moveTo(x + 12, -10); g.lineTo(x + 30, -16); g.stroke(); });
  g.restore();
}

function drawMeter(g, S, L, heat, now, c) {
  // the meter, with the band to strike in
  const mx = L.mx, my = L.my, mh = 470, mw = 44;
  g.fillStyle = '#0b0807'; g.fillRect(mx, my, mw, mh);
  for (let i = 0; i < 40; i++) { g.fillStyle = mix(c.colours, i / 40); g.globalAlpha = 0.35; g.fillRect(mx, my + mh - (i + 1) * mh / 40, mw, mh / 40 + 1); }
  g.globalAlpha = 1;
  const by0 = Math.max(my, my + mh - S.band[1] / 100 * mh), by1 = my + mh - S.band[0] / 100 * mh;
  g.strokeStyle = '#e8c464'; g.lineWidth = 3; g.strokeRect(mx - 6, by0, mw + 12, by1 - by0);
  const yv = my + mh - S.meter / 100 * mh;
  g.fillStyle = mix(c.colours, heat); g.fillRect(mx, yv, mw, my + mh - yv);
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(mx - 18, yv); g.lineTo(mx - 4, yv - 10); g.lineTo(mx - 4, yv + 10); g.fill();
  // the true heat (release 51): the narrow zone at the top of the band to take it out in, drawn over the heat; it glows while one holds
  if (!S.done && S.phase === 'work') {
    const tz = trueZone(S), ty0 = my + mh - tz[1] / 100 * mh, ty1 = my + mh - tz[0] / 100 * mh, on = S.trueHeat;
    g.fillStyle = on ? 'rgba(255,240,170,' + (0.45 + 0.2 * Math.sin(now / 160)) + ')' : 'rgba(255,240,170,.28)'; g.fillRect(mx - 6, ty0, mw + 12, ty1 - ty0);
    g.strokeStyle = '#fff3c4'; g.lineWidth = 3; g.setLineDash([7, 4]); g.strokeRect(mx - 6, ty0, mw + 12, ty1 - ty0); g.setLineDash([]);
    g.save(); g.textAlign = 'center'; g.font = '900 12px "Alegreya Sans", sans-serif'; g.fillStyle = '#2a1608';
    g.fillText(on ? 'HELD' : 'TRUE', mx + mw / 2, (ty0 + ty1) / 2 - 1); if (!on) g.fillText('HEAT', mx + mw / 2, (ty0 + ty1) / 2 + 12); g.restore();
  }
  g.fillStyle = 'rgba(236,224,198,.85)'; g.font = '800 20px "Alegreya Sans", sans-serif'; g.textAlign = 'center';
  g.fillText(c.meter, mx + mw / 2, my - 18);
  g.textAlign = 'right'; g.font = '700 15px "Alegreya Sans", sans-serif'; g.fillStyle = 'rgba(185,170,140,.9)';
  c.labels.forEach(([v, l]) => g.fillText(l, mx - 24, my + mh - v / 100 * mh - 4));
  g.save(); g.translate(mx + mw + 20, (by0 + by1) / 2); g.rotate(Math.PI / 2); g.textAlign = 'center'; g.fillStyle = '#e8c464'; g.font = '800 14px "Alegreya Sans", sans-serif'; g.fillText(c.id === 'stretcher' ? 'STITCH HERE' : c.id === 'bowbench' ? 'BEND HERE' : c.id === 'kettle' ? 'STIR HERE' : c.id === 'glass' ? 'BLOW HERE' : 'STRIKE HERE', 0, 0); g.restore();
  if (S.white > 0) { g.fillStyle = 'rgba(255,242,196,' + (0.1 + 0.06 * Math.sin(now / 90)) + ')'; g.fillRect(0, 0, L.W, L.H); }
}

export function sparksFor(k, dead) {
  const n = k === 'CRACK' ? 8 : k === 'GREAT' || k === 'FOUND' ? 26 : k === 'TRUE' ? 40 : dead ? 3 : 14, out = [];
  for (let i = 0; i < n; i++) out.push({ x: 0, y: 0, vx: (Math.random() - .5) * 620, vy: -Math.random() * 480 - 80, t: .6 + Math.random() * .5, c: KC[k], init: 0 });
  return out;
}
