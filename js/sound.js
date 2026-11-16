// The forge's sounds, made on the spot with WebAudio: no sound files. Silent until the first tap or key (browsers ask for that),
// and the mute setting kept apart from the save so a new save or another tab doesn't change it.
const KEY = 'darkclayforge.mute';
let ctx = null, master = null;
let muted = (() => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } })();
export const isMuted = () => muted;
export function setMuted(m) { muted = m; try { localStorage.setItem(KEY, m ? '1' : '0'); } catch (e) { /* no storage */ } }
export function unlock() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); } catch (e) { ctx = null; } }
  if (ctx && ctx.state === 'suspended') ctx.resume();
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
