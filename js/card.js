// THE CARD: a piece of gear drawn as a collector's card framed by its tier (Darkclay Zero, docs/THE-CARD.md).
import { TIERS } from './data.js?v=15';

const TIER = Object.fromEntries(TIERS.map(t => [t.id, t]));
// the picture of each kind of piece; m is the metal's tint
export const ART = {
  falchion: m => '<svg viewBox="-330 -70 650 140"><path d="M-230,-14 L-60,-20 L90,-30 L210,-44 L300,-8 L250,24 L130,30 L0,24 L-120,18 L-230,14 Z" fill="' + m + '" stroke="#000" stroke-width="7"/><path d="M-200,0 L270,-4" stroke="rgba(0,0,0,.3)" stroke-width="3"/><rect x="-320" y="-15" width="80" height="30" fill="#4a3020" stroke="#000" stroke-width="5"/><rect x="-246" y="-44" width="18" height="88" fill="#7a6a50" stroke="#000" stroke-width="5"/></svg>',
  dagger: m => '<svg viewBox="-330 -70 650 140"><path d="M-120,-16 L250,-6 L300,0 L250,6 L-120,16 Z" fill="' + m + '" stroke="#000" stroke-width="7"/><rect x="-250" y="-13" width="110" height="26" rx="6" fill="#6a4a2a" stroke="#000" stroke-width="5"/><path d="M-140,-46 L-112,-46 L-112,46 L-140,46 Z" fill="#9a96a0" stroke="#000" stroke-width="5"/></svg>',
  axe: m => '<svg viewBox="-330 -90 650 180"><rect x="-300" y="-10" width="470" height="20" fill="#6a4a2a" stroke="#000" stroke-width="6"/><path d="M120,-12 L150,-80 Q230,-60 250,0 Q230,60 150,80 L120,12 Z" fill="' + m + '" stroke="#000" stroke-width="7"/></svg>',
  helm: m => '<svg viewBox="-420 -140 840 220"><path d="M-120,40 Q-130,-110 0,-120 Q130,-110 120,40 L90,60 L-90,60 Z" fill="' + m + '" stroke="#000" stroke-width="8"/><rect x="-14" y="-30" width="28" height="90" fill="rgba(0,0,0,.28)" stroke="#000" stroke-width="5"/></svg>',
  lens: m => '<svg viewBox="-420 -130 840 260"><ellipse cx="0" cy="0" rx="110" ry="110" fill="' + m + '" fill-opacity=".55" stroke="#000" stroke-width="10"/><ellipse cx="0" cy="0" rx="124" ry="124" fill="none" stroke="#6a4a2a" stroke-width="14"/><ellipse cx="-36" cy="-40" rx="24" ry="44" fill="rgba(255,255,255,.4)" transform="rotate(30 -36 -40)"/><rect x="118" y="-12" width="150" height="24" fill="#6a4a2a" stroke="#000" stroke-width="6"/></svg>',
  goblet: m => '<svg viewBox="-420 -140 840 280"><path d="M-90,-110 L90,-110 L80,-20 Q50,25 16,30 L16,90 L70,110 L-70,110 L-16,90 L-16,30 Q-50,25 -80,-20 Z" fill="' + m + '" fill-opacity=".6" stroke="#000" stroke-width="9" stroke-linejoin="round"/><path d="M-50,-90 Q-60,-40 -30,-10" stroke="rgba(255,255,255,.5)" stroke-width="10" fill="none" stroke-linecap="round"/></svg>',
  pane: m => '<svg viewBox="-420 -130 840 260"><rect x="-160" y="-110" width="320" height="220" fill="' + m + '" fill-opacity=".5" stroke="#4a3020" stroke-width="16"/><path d="M0,-110 L0,110 M-160,0 L160,0" stroke="#4a3020" stroke-width="10"/><path d="M-130,-80 L-60,-30 M60,20 L130,70" stroke="rgba(255,255,255,.5)" stroke-width="8" stroke-linecap="round"/></svg>',
  draught: m => bottleArt(m, 'M-44,90 L-44,-10 Q-44,-50 -14,-64 L-14,-110 L14,-110 L14,-64 Q44,-50 44,-10 L44,90 Z'),
  salve: m => '<svg viewBox="-420 -120 840 240"><ellipse cx="0" cy="60" rx="150" ry="34" fill="#4a3424" stroke="#000" stroke-width="8"/><path d="M-150,60 L-150,0 L150,0 L150,60" fill="#6a5040" stroke="#000" stroke-width="8"/><ellipse cx="0" cy="0" rx="150" ry="34" fill="' + m + '" stroke="#000" stroke-width="8"/><ellipse cx="-40" cy="-6" rx="40" ry="8" fill="rgba(255,255,255,.3)"/></svg>',
  oil: m => bottleArt(m, 'M-30,90 L-60,20 L-24,-60 L-24,-110 L24,-110 L24,-60 L60,20 L30,90 Z'),
  tonic: m => bottleArt(m, 'M-60,90 Q-80,0 -20,-40 L-20,-110 L20,-110 L20,-40 Q80,0 60,90 Z'),
  shortbow: m => '<svg viewBox="-420 -150 840 300"><path d="M-260,40 Q0,-210 260,40" fill="none" stroke="#000" stroke-width="30" stroke-linecap="round"/><path d="M-260,40 Q0,-210 260,40" fill="none" stroke="' + m + '" stroke-width="20" stroke-linecap="round"/><path d="M-260,40 L260,40" stroke="#ece0c6" stroke-width="4"/><rect x="-22" y="-92" width="44" height="34" fill="#4a3020" stroke="#000" stroke-width="5"/></svg>',
  longbow: m => '<svg viewBox="-420 -150 840 300"><path d="M-380,30 Q0,-170 380,30" fill="none" stroke="#000" stroke-width="28" stroke-linecap="round"/><path d="M-380,30 Q0,-170 380,30" fill="none" stroke="' + m + '" stroke-width="18" stroke-linecap="round"/><path d="M-380,30 L380,30" stroke="#ece0c6" stroke-width="4"/><rect x="-22" y="-82" width="44" height="34" fill="#4a3020" stroke="#000" stroke-width="5"/></svg>',
  staff: m => '<svg viewBox="-420 -110 840 220"><path d="M-370,8 L340,-8" stroke="#000" stroke-width="34" stroke-linecap="round"/><path d="M-370,8 L340,-8" stroke="' + m + '" stroke-width="24" stroke-linecap="round"/><rect x="-395" y="-6" width="40" height="28" fill="#6e6b70" stroke="#000" stroke-width="5"/><circle cx="352" cy="-8" r="24" fill="#cfe8ff" stroke="#000" stroke-width="6"/></svg>',
  arrows: m => '<svg viewBox="-420 -150 840 300"><g stroke-linecap="round">' + [-60, -30, 0, 30, 60].map(y => '<path d="M-300,' + y + ' L280,' + (y * 0.6) + '" stroke="#000" stroke-width="14"/><path d="M-300,' + y + ' L280,' + (y * 0.6) + '" stroke="' + m + '" stroke-width="8"/><path d="M280,' + (y * 0.6 - 10) + ' L320,' + (y * 0.6) + ' L280,' + (y * 0.6 + 10) + ' Z" fill="#c9c5be" stroke="#000" stroke-width="4"/><path d="M-300,' + y + ' L-250,' + (y - 14) + ' L-230,' + y + ' L-250,' + (y + 14) + ' Z" fill="#e8e0d0" stroke="#000" stroke-width="3"/>').join('') + '</g><rect x="-60" y="-80" width="40" height="160" rx="8" fill="#4a3020" stroke="#000" stroke-width="5"/></svg>',
  jerkin: m => '<svg viewBox="-420 -150 840 300"><path d="M-70,-120 L-150,-100 L-230,20 L-180,50 L-120,-20 L-120,120 L120,120 L120,-20 L180,50 L230,20 L150,-100 L70,-120 Q0,-70 -70,-120 Z" fill="' + m + '" stroke="#000" stroke-width="9" stroke-linejoin="round"/><path d="M0,-80 L0,115" stroke="rgba(0,0,0,.45)" stroke-width="5" stroke-dasharray="12 10"/><path d="M-120,60 L120,60" stroke="#3b2414" stroke-width="16"/></svg>',
  hood: m => '<svg viewBox="-420 -150 840 300"><path d="M-130,110 Q-150,-40 -40,-120 Q60,-150 120,-60 Q160,10 140,110 Q60,80 0,90 Q-70,80 -130,110 Z" fill="' + m + '" stroke="#000" stroke-width="9" stroke-linejoin="round"/><path d="M-80,100 Q-90,0 0,-30 Q80,0 80,100" fill="#1a120c" stroke="#000" stroke-width="6"/></svg>',
  gloves: m => '<svg viewBox="-420 -150 840 300"><g stroke="#000" stroke-width="8" stroke-linejoin="round" fill="' + m + '"><path d="M-190,120 L-190,10 L-215,-60 L-185,-70 L-165,-10 L-165,-110 L-140,-110 L-135,-20 L-125,-120 L-100,-118 L-100,-15 L-85,-100 L-62,-96 L-70,20 L-60,120 Z"/><path d="M60,120 L50,20 L42,-96 L65,-100 L80,-15 L80,-118 L105,-120 L115,-20 L120,-110 L145,-110 L145,-10 L165,-70 L195,-60 L170,10 L170,120 Z"/></g><path d="M-190,95 L-60,95 M60,95 L170,95" stroke="#3b2414" stroke-width="14"/></svg>',
  boots: m => '<svg viewBox="-420 -150 840 300"><g stroke="#000" stroke-width="8" stroke-linejoin="round" fill="' + m + '"><path d="M-200,-120 L-110,-120 L-110,60 L-30,80 L-30,120 L-210,120 Z"/><path d="M40,-120 L130,-120 L130,60 L210,80 L210,120 L30,120 Z"/></g><path d="M-210,108 L-30,108 M30,108 L210,108" stroke="#2a1c12" stroke-width="16"/></svg>',
  ring: m => '<svg viewBox="-420 -110 840 220"><ellipse cx="0" cy="14" rx="78" ry="70" fill="none" stroke="#000" stroke-width="34"/><ellipse cx="0" cy="14" rx="78" ry="70" fill="none" stroke="' + m + '" stroke-width="22"/><path d="M-22,-62 L0,-92 L22,-62 L0,-44 Z" fill="#cfe8ff" stroke="#000" stroke-width="6"/></svg>',
};
// a bottle with its brew in it, three of them for a batch
function bottleArt(m, d) {
  const one = x => '<g transform="translate(' + x + ',0)"><path d="' + d + '" fill="rgba(200,230,220,.22)" stroke="#000" stroke-width="8" stroke-linejoin="round"/><clipPath id="bt' + x + '_' + d.length + '"><path d="' + d + '"/></clipPath><rect x="-90" y="-10" width="180" height="110" fill="' + m + '" clip-path="url(#bt' + x + '_' + d.length + ')" opacity=".9"/><rect x="-16" y="-128" width="32" height="22" fill="#6a4a2a" stroke="#000" stroke-width="5"/></g>';
  return '<svg viewBox="-420 -140 840 250">' + one(-150) + one(0) + one(150) + '</svg>';
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// card(piece, { short: the top only, price: show the worth on a corner })
export function card(p, o = {}) {
  const t = TIER[p.tier] || TIER.common, art = ART[p.art] || ART.falchion, tint = /^#[0-9a-f]{6}$/i.test(p.tint || '') ? p.tint : '#c9c5be';
  const bar = v => '<span class="cd-bar"><i style="width:' + Math.round(Math.max(0, Math.min(1, +v || 0)) * 100) + '%;background:' + t.c + '"></i></span>';
  const stats = (p.stats || []).map(r => '<div class="cd-st"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b>' + (r[2] != null ? bar(r[2]) : '<span></span>') + '</div>').join('');
  const aff = (p.affixes || []).map(a => '<div class="cd-af"><b style="color:' + t.c + '">' + esc(a[0]) + '</b> ' + esc(a[1]) + '</div>').join('');
  const made = '<div class="cd-sec">THE MAKING</div><div class="cd-made">' + (p.made || []).map(m => '<span>' + esc(m) + '</span>').join('') + '</div>';
  return '<div class="cd' + (o.short ? ' cd-short' : '') + (t.foil ? ' cd-foil' : '') + '" style="--tc:' + t.c + ';--tg:' + t.glow + '">' +
    '<div class="cd-in">' +
    '<div class="cd-top"><span class="cd-tier">' + t.name.toUpperCase() + '</span><span class="cd-kind">' + esc(p.kind) + '</span></div>' +
    '<div class="cd-name">' + esc(p.name) + '</div>' +
    '<div class="cd-art">' + art(tint) + (p.dice ? '<span class="cd-dice">' + esc(p.dice) + '</span>' : '') + (p.count > 0 ? '<span class="cd-dice cd-count">×' + esc(p.count) + '</span>' : '') + '</div>' +
    (o.short ? '<div class="cd-price">' + (o.price || esc(p.worth) + ' c') + '</div>'
      : '<div class="cd-body">' + stats + (aff ? '<div class="cd-sec">AFFIXES</div>' + aff : '') + made +
        '<div class="cd-lore">' + esc(p.lore) + '</div><div class="cd-worth"><span>WORTH</span><b>' + esc(p.worth) + ' coins</b></div></div>') +
    '</div></div>';
}
