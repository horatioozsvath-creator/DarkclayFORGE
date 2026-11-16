// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// The forge's sounds, made on the spot with WebAudio: no sound files. Silent until the first tap or key (browsers ask for that),
// and the mute setting kept apart from the save so a new save or another tab doesn't change it.
const KEY = 'darkclayforge.mute';
let ctx = null, master = null;
let muted = (() => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } })();
export const isMuted = () => muted;
export function setMuted(m) { muted = m; try { localStorage.setItem(KEY, m ? '1' : '0'); } catch (e) { /* no storage */ } applyMusic(); }
export function unlock() {
  const first = !ctx;
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); } catch (e) { ctx = null; } }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  if (first && ctx) applyMusic();
}
function tone(f, dur, { type = 'sine', gain = 0.3, at = 0, to = null, attack = 0.004 } = {}) {
  const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
let noiseBuf = null;
function noise(dur, { gain = 0.3, at = 0, freq = 2000, q = 0.8, type = 'bandpass', attack = 0.003 } = {}) {
  if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t = ctx.currentTime + at, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
}
const SOUNDS = {
  GOOD: () => { tone(880, 0.35, { type: 'triangle', gain: 0.25 }); tone(1320, 0.25, { gain: 0.08 }); noise(0.06, { gain: 0.25, freq: 3500 }); },
  GREAT: () => { tone(988, 0.5, { type: 'triangle', gain: 0.28 }); tone(1480, 0.4, { gain: 0.12 }); noise(0.07, { gain: 0.3, freq: 4000 }); },
  HOLD: () => { tone(220, 0.18, { type: 'triangle', gain: 0.25 }); noise(0.05, { gain: 0.15, freq: 900 }); },
  CRACK: () => { noise(0.25, { gain: 0.4, freq: 700, type: 'lowpass' }); tone(160, 0.3, { type: 'sawtooth', gain: 0.12, to: 70 }); },
  TRUE: () => { tone(1320, 0.8, { gain: 0.18 }); tone(1760, 0.9, { gain: 0.14, at: 0.08 }); tone(2640, 0.7, { gain: 0.06, at: 0.16 }); noise(0.06, { gain: 0.2, freq: 4000 }); },
  FOUND: () => SOUNDS.TRUE(),
  dead: () => tone(140, 0.12, { type: 'triangle', gain: 0.2 }),
  blow: () => { noise(0.35, { gain: 0.25, freq: 600, q: 0.5, attack: 0.08 }); tone(520, 0.2, { gain: 0.04, to: 620 }); },
  shatter: () => { noise(0.45, { gain: 0.45, freq: 6000, q: 0.4 }); for (let i = 0; i < 5; i++) tone(2000 + Math.random() * 3000, 0.15, { gain: 0.06, at: i * 0.04 }); },
  ring: () => { tone(1760, 1.2, { gain: 0.14 }); tone(2637, 0.9, { gain: 0.06, at: 0.02 }); },
  stir: () => { noise(0.3, { gain: 0.22, freq: 900, q: 1.5, attack: 0.05 }); tone(260, 0.2, { gain: 0.05, to: 320 }); },
  boil: () => { for (let i = 0; i < 6; i++) tone(180 + Math.random() * 300, 0.12, { gain: 0.1, at: i * 0.05, to: 500 }); noise(0.5, { gain: 0.3, freq: 1500, q: 0.6 }); },
  stoke: () => { noise(0.5, { gain: 0.3, freq: 400, type: 'lowpass', attack: 0.06 }); tone(90, 0.4, { type: 'triangle', gain: 0.12 }); },
  bend: () => { tone(140, 0.25, { type: 'sawtooth', gain: 0.06, to: 190 }); noise(0.12, { gain: 0.18, freq: 700, q: 3 }); },
  split: () => { noise(0.2, { gain: 0.45, freq: 2200, q: 0.6 }); tone(300, 0.15, { type: 'square', gain: 0.06, to: 120 }); },
  steam: () => noise(1.0, { gain: 0.28, freq: 3500, q: 0.4, attack: 0.15 }),
  twang: () => { tone(196, 0.9, { type: 'triangle', gain: 0.22, to: 180 }); tone(392, 0.6, { gain: 0.06 }); },
  stitch: () => { noise(0.08, { gain: 0.3, freq: 1800, q: 2 }); tone(320, 0.08, { type: 'triangle', gain: 0.12 }); },
  tear: () => { noise(0.35, { gain: 0.4, freq: 1200, q: 0.5 }); tone(200, 0.25, { type: 'sawtooth', gain: 0.08, to: 90 }); },
  soak: () => { noise(0.8, { gain: 0.25, freq: 800, q: 0.7, attack: 0.08 }); tone(180, 0.4, { gain: 0.06, to: 120 }); },
  set: () => { tone(110, 0.3, { type: 'triangle', gain: 0.25 }); noise(0.15, { gain: 0.15, freq: 600, type: 'lowpass' }); },
  fire: () => noise(0.6, { gain: 0.25, freq: 500, type: 'lowpass', attack: 0.1 }),
  quench: () => noise(1.4, { gain: 0.35, freq: 5000, q: 0.6, attack: 0.02 }),
  coin: () => { tone(1568, 0.18, { gain: 0.2 }); tone(2093, 0.35, { gain: 0.18, at: 0.07 }); },
  bell: () => { tone(1046, 1.4, { gain: 0.16 }); tone(1568, 1.0, { gain: 0.06, at: 0.01 }); },
  chime: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.6, { gain: 0.14, at: i * 0.09 })),
  level: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.45, { type: 'triangle', gain: 0.16, at: i * 0.11 })),
};
export function play(name) { if (muted || !ctx || ctx.state !== 'running' || !SOUNDS[name]) return; try { SOUNDS[name](); } catch (e) { /* never break the game for a sound */ } }

// ---------- the music: made on the spot too, a quiet loop for each place. A drone under a lute-like line drawn from the place's scale,
// a short phrase played and then varied, so it never quite repeats. Its own setting (on unless turned off), under the mute.
const MKEY = 'darkclayforge.music';
let musicOn = (() => { try { return localStorage.getItem(MKEY) !== '0'; } catch (e) { return true; } })();
let place = null, playing = null, bus = null, drones = [], timer = null, nextAt = 0, phrase = [], pos = 0, bar = 0;
export const isMusicOn = () => musicOn;
export function setMusicOn(m) { musicOn = m; try { localStorage.setItem(MKEY, m ? '1' : '0'); } catch (e) { /* no storage */ } applyMusic(); }
const midi = n => 440 * Math.pow(2, (n - 69) / 12);
const PLACES = {
  forge: { root: 38, scale: [0, 3, 5, 7, 10], drone: [38, 45], step: [0.9, 1.6], octave: 12, voice: 'triangle', gain: 0.5 },   // D, a minor pentatonic, slow
  shop: { root: 43, scale: [0, 2, 4, 7, 9], drone: [43, 50], step: [0.45, 0.8], octave: 24, voice: 'triangle', gain: 0.4 },    // G, a major pentatonic, lighter
};
export function music(where) { place = PLACES[where] ? where : null; applyMusic(); }
function applyMusic() {
  const want = ctx && musicOn && !muted ? place : null;
  if (want === playing) return;
  stopMusic(); playing = want;
  if (want) startMusic(PLACES[want]);
}
function stopMusic() {
  clearInterval(timer); timer = null;
  if (bus) { const b = bus, ds = drones; const t = ctx.currentTime; b.gain.cancelScheduledValues(t); b.gain.setValueAtTime(b.gain.value, t); b.gain.linearRampToValueAtTime(0, t + 1.2);
    setTimeout(() => { ds.forEach(o => { try { o.stop(); } catch (e) { /* stopped */ } }); b.disconnect(); }, 1400); }
  bus = null; drones = [];
}
function startMusic(P) {
  bus = ctx.createGain(); bus.gain.value = 0; bus.connect(master);
  const t = ctx.currentTime; bus.gain.linearRampToValueAtTime(0.16 * P.gain * 2, t + 2.5);
  // the drone: two soft voices through a low filter, breathing slowly
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.connect(bus);
  P.drone.forEach((n, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = midi(n); o.detune.value = i ? 4 : -4; g.gain.value = 0.05;
    lfo.frequency.value = 0.07 + i * 0.03; lg.gain.value = 0.025; lfo.connect(lg); lg.connect(g.gain);
    o.connect(g); g.connect(lp); o.start(); lfo.start(); drones.push(o, lfo);
  });
  phrase = []; pos = 0; bar = 0; nextAt = ctx.currentTime + 1.5;
  timer = setInterval(() => schedule(P), 200);
}
function newPhrase(P) {
  // eight steps from the scale, a rest or two, ending home
  const out = []; let d = Math.floor(Math.random() * P.scale.length);
  for (let i = 0; i < 8; i++) { d = Math.max(0, Math.min(P.scale.length * 2 - 1, d + [-2, -1, -1, 1, 1, 2, 0][Math.floor(Math.random() * 7)])); out.push(Math.random() < 0.18 && i > 0 && i < 7 ? null : d); }
  out[7] = 0; return out;
}
function pluck(P, deg, at) {
  const n = P.root + P.octave + P.scale[deg % P.scale.length] + 12 * Math.floor(deg / P.scale.length), f = midi(n);
  const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
  o.type = P.voice; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 2; lp.type = 'lowpass'; lp.frequency.value = 2200;
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.18, at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + 1.6);
  const g2 = ctx.createGain(); g2.gain.value = 0.25; o2.connect(g2); g2.connect(g);
  o.connect(g); g.connect(lp); lp.connect(bus); o.start(at); o2.start(at); o.stop(at + 1.7); o2.stop(at + 1.7);
}
function schedule(P) {
  if (!bus || typeof document !== 'undefined' && document.hidden) return;
  while (nextAt < ctx.currentTime + 0.6) {
    if (pos === 0) { if (!phrase.length || bar % 4 === 0) phrase = newPhrase(P); else phrase = phrase.map(d => d == null || Math.random() < 0.7 ? d : Math.max(0, d + (Math.random() < 0.5 ? 1 : -1))); bar++; }
    const d = phrase[pos];
    if (d != null) pluck(P, d, nextAt);
    pos = (pos + 1) % phrase.length;
    nextAt += P.step[0] + Math.random() * (P.step[1] - P.step[0]) * (pos === 0 ? 2.5 : 1);
  }
}
