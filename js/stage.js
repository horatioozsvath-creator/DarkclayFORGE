// The stage: the fire, the anvil, the piece taking shape, the hammer and the heat meter, drawn on a 1280 × 720 canvas.
import { FORGE, KC } from './data.js?v=7';

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
  else drawForge(g, S, view, L, heat, now, c);
  for (const s of view.sparks) { if (!s.init) { s.x = L.ax; s.y = L.ay - (c.id === 'stretcher' ? 200 : 80) * L.sc; s.init = 1; } s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 900 * dt; s.t -= dt; }
  view.sparks = view.sparks.filter(s => s.t > 0);
  for (const s of view.sparks) { g.fillStyle = s.c; g.globalAlpha = Math.min(1, s.t * 2); if (c.id === 'stretcher') { g.beginPath(); g.arc(s.x, s.y, 3, 0, 7); g.fill(); } else g.fillRect(s.x, s.y, 6, 6); }
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
    g.fillStyle = '#5a4030'; g.strokeStyle = '#000'; g.lineWidth = 3; g.fillRect(30, 20, 240, 18); g.strokeRect(30, 20, 240, 18);
    g.fillStyle = '#4a4a50'; g.fillRect(-50, 0, 100, 60); g.strokeRect(-50, 0, 100, 60);
    g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(-47, 48, 94, 10);
    g.restore();
  }
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
  g.fillStyle = 'rgba(236,224,198,.85)'; g.font = '800 20px "Alegreya Sans", sans-serif'; g.textAlign = 'center';
  g.fillText(c.meter, mx + mw / 2, my - 18);
  g.textAlign = 'right'; g.font = '700 15px "Alegreya Sans", sans-serif'; g.fillStyle = 'rgba(185,170,140,.9)';
  c.labels.forEach(([v, l]) => g.fillText(l, mx - 24, my + mh - v / 100 * mh - 4));
  g.save(); g.translate(mx + mw + 20, (by0 + by1) / 2); g.rotate(Math.PI / 2); g.textAlign = 'center'; g.fillStyle = '#e8c464'; g.font = '800 14px "Alegreya Sans", sans-serif'; g.fillText(c.id === 'stretcher' ? 'STITCH HERE' : 'STRIKE HERE', 0, 0); g.restore();
  if (S.white > 0) { g.fillStyle = 'rgba(255,242,196,' + (0.1 + 0.06 * Math.sin(now / 90)) + ')'; g.fillRect(0, 0, L.W, L.H); }
}

export function sparksFor(k, dead) {
  const n = k === 'CRACK' ? 8 : k === 'GREAT' || k === 'FOUND' ? 26 : k === 'TRUE' ? 40 : dead ? 3 : 14, out = [];
  for (let i = 0; i < n; i++) out.push({ x: 0, y: 0, vx: (Math.random() - .5) * 620, vy: -Math.random() * 480 - 80, t: .6 + Math.random() * .5, c: KC[k], init: 0 });
  return out;
}
