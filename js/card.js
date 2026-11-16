// THE CARD: a piece of gear drawn as a collector's card framed by its tier (Darkclay Zero, docs/THE-CARD.md).
import { TIERS } from './data.js?v=3';

const TIER = Object.fromEntries(TIERS.map(t => [t.id, t]));
// the picture of each kind of piece; m is the metal's tint
export const ART = {
  falchion: m => '<svg viewBox="-330 -70 650 140"><path d="M-230,-14 L-60,-20 L90,-30 L210,-44 L300,-8 L250,24 L130,30 L0,24 L-120,18 L-230,14 Z" fill="' + m + '" stroke="#000" stroke-width="7"/><path d="M-200,0 L270,-4" stroke="rgba(0,0,0,.3)" stroke-width="3"/><rect x="-320" y="-15" width="80" height="30" fill="#4a3020" stroke="#000" stroke-width="5"/><rect x="-246" y="-44" width="18" height="88" fill="#7a6a50" stroke="#000" stroke-width="5"/></svg>',
  dagger: m => '<svg viewBox="-330 -70 650 140"><path d="M-120,-16 L250,-6 L300,0 L250,6 L-120,16 Z" fill="' + m + '" stroke="#000" stroke-width="7"/><rect x="-250" y="-13" width="110" height="26" rx="6" fill="#6a4a2a" stroke="#000" stroke-width="5"/><path d="M-140,-46 L-112,-46 L-112,46 L-140,46 Z" fill="#9a96a0" stroke="#000" stroke-width="5"/></svg>',
  axe: m => '<svg viewBox="-330 -90 650 180"><rect x="-300" y="-10" width="470" height="20" fill="#6a4a2a" stroke="#000" stroke-width="6"/><path d="M120,-12 L150,-80 Q230,-60 250,0 Q230,60 150,80 L120,12 Z" fill="' + m + '" stroke="#000" stroke-width="7"/></svg>',
  helm: m => '<svg viewBox="-420 -140 840 220"><path d="M-120,40 Q-130,-110 0,-120 Q130,-110 120,40 L90,60 L-90,60 Z" fill="' + m + '" stroke="#000" stroke-width="8"/><rect x="-14" y="-30" width="28" height="90" fill="rgba(0,0,0,.28)" stroke="#000" stroke-width="5"/></svg>',
  ring: m => '<svg viewBox="-420 -110 840 220"><ellipse cx="0" cy="14" rx="78" ry="70" fill="none" stroke="#000" stroke-width="34"/><ellipse cx="0" cy="14" rx="78" ry="70" fill="none" stroke="' + m + '" stroke-width="22"/><path d="M-22,-62 L0,-92 L22,-62 L0,-44 Z" fill="#cfe8ff" stroke="#000" stroke-width="6"/></svg>',
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// card(piece, { short: the top only, price: show the worth on a corner })
export function card(p, o = {}) {
  const t = TIER[p.tier];
  const bar = v => '<span class="cd-bar"><i style="width:' + Math.round(v * 100) + '%;background:' + t.c + '"></i></span>';
  const stats = p.stats.map(r => '<div class="cd-st"><span>' + r[0] + '</span><b>' + esc(r[1]) + '</b>' + (r[2] != null ? bar(r[2]) : '<span></span>') + '</div>').join('');
  const aff = p.affixes.map(a => '<div class="cd-af"><b style="color:' + t.c + '">' + esc(a[0]) + '</b> ' + esc(a[1]) + '</div>').join('');
  const made = '<div class="cd-sec">THE MAKING</div><div class="cd-made">' + p.made.map(m => '<span>' + esc(m) + '</span>').join('') + '</div>';
  return '<div class="cd' + (o.short ? ' cd-short' : '') + '" style="--tc:' + t.c + ';--tg:' + t.glow + '">' +
    '<div class="cd-in">' +
    '<div class="cd-top"><span class="cd-tier">' + t.name.toUpperCase() + '</span><span class="cd-kind">' + p.kind + '</span></div>' +
    '<div class="cd-name">' + esc(p.name) + '</div>' +
    '<div class="cd-art">' + ART[p.art](p.tint) + (p.dice ? '<span class="cd-dice">' + p.dice + '</span>' : '') + '</div>' +
    (o.short ? '<div class="cd-price">' + (o.price || p.worth + ' c') + '</div>'
      : '<div class="cd-body">' + stats + (aff ? '<div class="cd-sec">AFFIXES</div>' + aff : '') + made +
        '<div class="cd-lore">' + esc(p.lore) + '</div><div class="cd-worth"><span>WORTH</span><b>' + p.worth + ' coins</b></div></div>') +
    '</div></div>';
}
