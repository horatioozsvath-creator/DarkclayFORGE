// DarkclayFORGE. The screens: THE FORGE (home), PREPARE, THE WORKING, THE RESULT; THE SHOP and SUPPLIERS.
import { KINDS, KC, TIERS, FORGE, PATTERNS, FOUND, MATS, SUPPLIERS, TAGS } from './data.js?v=2';
import * as R from './rules.js?v=2';
import * as Sh from './shop.js?v=2';
import { lookOf, bagLook, unknownLook } from './tiles.js?v=2';
import { card, ART } from './card.js?v=2';
import { paint, sparksFor, LAYOUTS } from './stage.js?v=2';
import { load, store } from './save.js?v=2';

const $ = id => document.getElementById(id);
const save = load();
Sh.fixShelf(save);
const rng = Math.random;
const phoneQ = window.matchMedia('(max-width: 600px)');
const TIERC = ['var(--t-common)', 'var(--t-fine)', 'var(--t-rare)'];

let screen = 'home';       // home | shop | supp | prepare | work
let pat = 'falchion';      // the pattern on the bench
let S = null;              // the working
let paused = false, lastStrike = 0, fresh = null, prevOdds = null;
const view = { flash: 0, ring: 0, ringC: '#fff', sparks: [] };
const timers = [];
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const clearTimers = () => { timers.forEach(clearTimeout); timers.length = 0; };

const levelFor = id => R.levelOf((save.trades[id] || {}).xp || 0);
const lvl = () => levelFor(pat).level;
const picks = () => save.picks[pat] || (save.picks[pat] = PATTERNS[pat].parts.map(() => 0));
const HUBS = ['home', 'shop', 'supp'];
const hour = () => Sh.hourOf(Date.now());
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function show(which) {
  screen = which;
  $('nav').hidden = !HUBS.includes(which);
  document.querySelectorAll('#nav [data-go]').forEach(b => b.dataset.go === which ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  $('vHome').hidden = which !== 'home';
  $('vShop').hidden = which !== 'shop';
  $('vSupp').hidden = which !== 'supp';
  $('screen').hidden = HUBS.includes(which);
  $('vPrep').hidden = which !== 'prepare';
  $('vWork').hidden = which !== 'work';
  $('result').hidden = true; $('look').hidden = true; $('sheet').hidden = true;
  document.body.style.overflow = which === 'work' && phoneQ.matches ? 'hidden' : '';
  if (which !== 'work') window.scrollTo(0, 0);
}

let shownCoins = null;
function coins() {
  const el = $('coins');
  if (shownCoins !== null && save.coins > shownCoins) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  shownCoins = save.coins; el.textContent = save.coins;
}
function toast(html) {
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html;
  $('toasts').appendChild(t); setTimeout(() => t.remove(), 4300);
  while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
}
const go = where => where === 'home' ? toHome() : where === 'shop' ? toShop() : toSupp();
document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
// never stuck: broke, nothing made, nothing to make it from
function rescueCheck() {
  if (Sh.rescue(save, hour())) { store(save); toast('<b>The yard\'s scrap bin.</b> Dougal leaves you a bar and a cord, enough for a dagger.'); }
}

// ---------- THE FORGE (home) ----------
function toHome() {
  clearTimers(); S = null; rescueCheck(); show('home'); coins();
  $('maker').value = save.maker;
  $('patterns').innerHTML = Object.entries(PATTERNS).map(([id, p]) => {
    const l = levelFor(id), n = save.cards.filter(c => c.pattern === id).length;
    return '<button class="pat" data-p="' + id + '"><div class="art">' + ART[p.art]('#c9c5be') + '</div><b>' + p.name + '</b>'
      + '<div class="lv">TRADE ' + l.level + '<span>' + (l.need ? l.into + ' / ' + l.need : 'MASTERED') + '</span></div>'
      + '<div class="xp"><i style="width:' + (l.need ? Math.round(l.into / l.need * 100) : 100) + '%"></i></div>'
      + '<div class="lv"><span>' + n + ' MADE</span></div></button>';
  }).join('');
  $('patterns').querySelectorAll('button').forEach(b => b.onclick = () => { pat = b.dataset.p; toPrepare(); });
  $('homeFound').textContent = save.found.length + ' OF ' + Object.keys(FOUND).length + ' FOUND';
  $('homeBag').innerHTML = Object.entries(FOUND).map(([id, f]) => save.found.includes(id)
    ? '<button tabindex="-1" title="' + f.name + ': ' + f.line + '"><div style="aspect-ratio:3/4">' + bagLook(id).face + '</div>' + f.short + '</button>'
    : '<button class="unk" disabled><div style="aspect-ratio:3/4">' + unknownLook(id).face + '</div>NOT FOUND</button>').join('');
  const have = Object.entries(save.mats).filter(([, n]) => n > 0);
  $('storeWord').textContent = have.length ? have.reduce((a, [, n]) => a + n, 0) + ' THINGS' : 'EMPTY';
  $('store').innerHTML = have.length ? have.map(([id, n]) => '<span>' + MATS[id].name + '<b>' + n + '</b></span>').join('')
    : '<span class="empty">Nothing in the store room. The suppliers sell bars, hides and hafts.</span>';
  const back = Sh.inBack(save).length;
  $('toBack').textContent = back + ' IN THE BACK · TO THE SHOP';
}
function openLook(html, acts, wide) {
  $('lookCard').innerHTML = html; $('lookActs').innerHTML = acts || ''; $('lookActs').onclick = null;
  $('look').querySelector('.box').classList.toggle('wide', !!wide);
  $('look').hidden = false; $('look').scrollTop = 0; $('lookClose').focus({ preventScroll: true });
}
$('maker').onchange = () => { save.maker = $('maker').value.trim() || 'the Maker'; $('maker').value = save.maker; store(save); };
$('lookClose').onclick = () => { $('look').hidden = true; };

// ---------- THE SHOP ----------
let floorShown = null;
function toShop() { clearTimers(); S = null; rescueCheck(); show('shop'); coins(); $('navSold').hidden = true; renderShop(); }
function figure(colour) {
  return '<svg class="fig in" viewBox="0 0 46 110" aria-hidden="true"><circle cx="23" cy="14" r="11" fill="' + colour + '" stroke="#000" stroke-width="3"/>'
    + '<path d="M8,32 Q23,24 38,32 L42,78 L33,78 L31,108 L15,108 L13,78 L4,78 Z" fill="' + colour + '" stroke="#000" stroke-width="3"/></svg>';
}
function renderFloor() {
  const e = save.ledger[0], v = $('visitor');
  if (!e || Date.now() - e.at > 30000) {
    const n = save.shelf.filter(Boolean).length;
    v.innerHTML = '<div class="idle">The door\'s open. ' + (n ? n + ' on the shelf.' : 'The shelf is bare: put something out.') + '</div>';
    floorShown = null; return;
  }
  if (floorShown === e.at) return;
  floorShown = e.at;
  v.innerHTML = figure(e.fig) + '<div class="say"><b><span class="mood ' + e.mood + '">' + e.mood + '</span>' + esc(e.who) + '</b>'
    + 'Wants ' + Sh.wantWord(e.want) + '. ' + esc(e.line) + (e.sold ? ' <span class="sold">Sold: ' + esc(e.sold.name) + ', ' + e.sold.price + ' c.</span>' : '') + '</div>';
}
function renderShop() {
  if (screen !== 'shop') return;
  $('tally').innerHTML = '<b>' + (save.sold || 0) + '</b> sold · <b>' + (save.earned || 0) + '</b> coins taken';
  const filled = save.shelf.filter(Boolean).length;
  $('shelfWord').textContent = filled + ' OF ' + save.slots + ' · CUSTOMERS BUY FROM HERE';
  $('slots2').innerHTML = save.shelf.map((e, i) => {
    if (!e) return '<button class="slot-empty" data-slot="' + i + '">EMPTY<br>' + (Sh.inBack(save).length ? 'TAP TO STOCK' : 'MAKE SOMETHING') + '</button>';
    const c = save.cards.find(x => x.id === e.id);
    return '<button data-slot="' + i + '" aria-label="' + esc(c.name) + ', ' + TAGS[e.tag].word + ' at ' + Sh.priceAt(c, e.tag) + ' coins">'
      + card(c, { short: true, price: Sh.priceAt(c, e.tag) + ' c<span class="tagword">' + TAGS[e.tag].word + '</span>' }) + '</button>';
  }).join('');
  $('slots2').querySelectorAll('button').forEach(b => b.onclick = () => slotOpen(+b.dataset.slot));
  const cost = Sh.nextSlotCost(save);
  $('buySlot').hidden = cost == null;
  if (cost != null) { $('buySlot').textContent = 'ANOTHER SHELF · ' + cost + ' COINS'; $('buySlot').disabled = save.coins < cost; }
  const back = Sh.inBack(save);
  $('backWord').textContent = back.length + (back.length === 1 ? ' PIECE' : ' PIECES') + ' · NOT FOR SALE YET';
  $('back').innerHTML = back.length ? back.map(c => '<button data-id="' + c.id + '" aria-label="' + esc(c.name) + '">' + card(c, { short: true }) + '</button>').join('')
    : '<div class="empty">Nothing in the back. What you make at the forge comes here.</div>';
  $('back').querySelectorAll('button').forEach(b => b.onclick = () => backOpen(b.dataset.id));
  $('ledger').innerHTML = save.ledger.length ? save.ledger.slice(0, 12).map(e => '<li><span><span class="mood ' + e.mood + '">' + e.mood + '</span><b>' + esc(e.who) + '</b> · wants ' + Sh.wantWord(e.want) + '</span>'
    + (e.sold ? '<span class="amt">+' + e.sold.price + ' c</span>' : '<span class="amt no">NO SALE</span>') + '<span class="ln">' + (e.sold ? 'Bought the ' + esc(e.sold.name) + ' (' + TAGS[e.sold.tag].word + '). ' : '') + esc(e.line) + '</span></li>').join('')
    : '<li class="empty">No one yet. Customers come in every half a minute or so while the game is open.</li>';
  renderFloor();
}
$('buySlot').onclick = () => { if (Sh.buySlot(save)) { store(save); coins(); renderShop(); } };
function tagSegs(slot) {
  const e = save.shelf[slot], c = save.cards.find(x => x.id === e.id);
  return '<p>The price on it. Cheaper sells sooner; dearer waits for the right purse.</p><div class="group">'
    + Object.entries(TAGS).map(([id, t]) => '<button class="seg" data-tag="' + id + '" aria-pressed="' + (e.tag === id) + '">' + t.word + ' · ' + Sh.priceAt(c, id) + ' c</button>').join('') + '</div>';
}
function slotOpen(slot) {
  const e = save.shelf[slot];
  if (!e) {
    const back = Sh.inBack(save);
    if (!back.length) { toHome(); return; }
    openLook('<div class="pickgrid">' + back.map(c => '<button data-id="' + c.id + '" aria-label="' + esc(c.name) + '">' + card(c, { short: true }) + '</button>').join('') + '</div>',
      '<p>Choose a piece for the shelf. It goes up at FAIR.</p>', true);
    $('lookCard').querySelectorAll('button').forEach(b => b.onclick = () => { Sh.place(save, b.dataset.id, slot); store(save); $('look').hidden = true; renderShop(); });
    return;
  }
  const c = save.cards.find(x => x.id === e.id);
  const acts = () => tagSegs(slot) + '<button class="seg" id="takeDown">TAKE IT DOWN</button>';
  openLook(card(c), acts());
  $('lookActs').onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.tag) {
      if (!save.shelf[slot]) return;
      Sh.setTag(save, slot, b.dataset.tag); store(save); $('lookActs').innerHTML = acts();
      $('lookActs').querySelector('[data-tag="' + b.dataset.tag + '"]').focus(); renderShop();
    } else if (b.id === 'takeDown') { Sh.takeDown(save, slot); store(save); $('look').hidden = true; renderShop(); }
  };
}
function backOpen(id) {
  const c = save.cards.find(x => x.id === id), free = save.shelf.findIndex(e => !e);
  openLook(card(c), free >= 0 ? '<button class="seg go" id="putUp">PUT IT ON THE SHELF · FAIR ' + Sh.priceAt(c, 'fair') + ' c</button>' : '<p>The shelf is full. Take something down, or buy another shelf.</p>');
  if (free >= 0) $('putUp').onclick = () => { Sh.place(save, id, free); store(save); $('look').hidden = true; renderShop(); };
}

// ---------- SUPPLIERS ----------
let suppHour = null;
function toSupp() { clearTimers(); S = null; rescueCheck(); show('supp'); coins(); renderSupp(); }
function renderSupp() {
  if (screen !== 'supp') return;
  const h = hour(); suppHour = h;
  const mins = 60 - new Date().getMinutes();
  $('hourWord').innerHTML = 'Prices change on the hour · next in <b>' + mins + ' min</b>';
  $('supps').innerHTML = SUPPLIERS.map(sp => '<section class="card supp"><h2><span>' + sp.kind + '</span><b>' + sp.name.toUpperCase() + '</b></h2><p class="line">' + sp.line + '</p>'
    + Sh.linesOf(sp, h).map(id => {
      const m = MATS[id], pr = Sh.priceOf(id, h), was = Sh.priceOf(id, h - 1);
      const tr = pr > was ? '<i class="up">▲</i>' : pr < was ? '<i class="down">▼</i>' : '';
      return '<div class="buyrow"><span><b class="' + (m.rare ? 'rare' : '') + '">' + m.name + (m.rare ? ' ✶' : '') + '</b><small>HAVE ' + (save.mats[id] || 0) + '</small></span>'
        + '<span class="pr">' + pr + ' c ' + tr + '</span>'
        + '<button class="seg" data-buy="' + id + '" data-n="1"' + (save.coins < pr ? ' disabled' : '') + '>BUY 1</button>'
        + '<button class="seg b5" data-buy="' + id + '" data-n="5"' + (save.coins < pr * 5 ? ' disabled' : '') + '>BUY 5</button></div>';
    }).join('') + '</section>').join('');
  $('supps').querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
    if (Sh.buy(save, b.dataset.buy, +b.dataset.n, hour())) { store(save); coins(); renderSupp(); const nb = $('supps').querySelector('[data-buy="' + b.dataset.buy + '"][data-n="' + b.dataset.n + '"]'); if (nb && !nb.disabled) nb.focus(); }
  });
}

// ---------- PREPARE ----------
function newWorking() {
  const n = R.slotsFor(lvl());
  save.chosen = save.chosen.filter(id => save.found.includes(id)).slice(0, n);
  S = R.newWorking({ patternId: pat, picks: picks().slice(), level: lvl(), found: save.chosen.slice(), kit: {} }, rng);
}
function toPrepare() {
  clearTimers(); paused = false;
  const p = PATTERNS[pat], l = levelFor(pat), opts = R.partOptions(pat);
  // a part that the trade hasn't opened yet falls back to the first
  save.picks[pat] = picks().map((k, i) => (opts[i].opts[k] && (opts[i].opts[k].level || 1) <= l.level) ? k : 0);
  newWorking(); show('prepare');
  $('prepT').textContent = S.metal.name + ' ' + p.name;
  $('tradeWord').textContent = p.trade.toUpperCase() + ' · TRADE ' + l.level + (l.need ? ' · ' + l.into + ' / ' + l.need : '');
  partSegs(); renderPrep();
}
function pieceKv() {
  const l = lvl(), o = R.odds(S);
  $('pieceKv').innerHTML = '<span>Plain odds</span><b><span style="color:var(--t-fine)">Fine ' + Math.round(o.f) + ' %</span> · <span style="color:var(--t-rare)">Rare ' + Math.round(o.r) + ' %</span></b>'
    + '<span>Worked</span><b>up to Fine 70 % · Rare 40 %</b>'
    + '<span>Heat</span><b>' + FORGE.twist + ' The band now ' + S.band[0] + '–' + S.band[1] + '.</b>'
    + '<span>The pick</span><b>' + (l >= 5 ? 'WHITE HEAT (8 in a row with no crack) or a TRUE' : 'WHITE HEAT or a TRUE · both open at trade 5') + '</b>'
    + '<span>A new tile</span><b>a Fine or better working with no crack, or WHITE HEAT</b>'
    + (l < 3 ? '<span>Learning</span><b>no cracks until trade 3; struck cold, a strike does nothing</b>' : '');
}
function partSegs() {
  const box = $('parts'); box.innerHTML = '';
  const P = R.partOptions(pat), ch = picks(), l = lvl();
  $('partsHead').textContent = 'THE ' + P[0].part.toUpperCase() + ' SETS YOUR STRIP';
  P.forEach((p, i) => {
    const row = document.createElement('div'); row.className = 'row';
    row.innerHTML = '<span>' + p.part.toUpperCase() + '</span><div class="group"></div>';
    box.appendChild(row);
    p.opts.forEach((o, k) => {
      const b = document.createElement('button'), locked = (o.level || 1) > l;
      b.className = 'seg'; b.textContent = o.name + (o.rare ? ' ✶' : '') + (locked ? ' · TRADE ' + o.level : '');
      b.disabled = locked; b.setAttribute('aria-pressed', String(k === ch[i]));
      b.onclick = () => { ch[i] = k; store(save); newWorking(); $('prepT').textContent = S.metal.name + ' ' + PATTERNS[pat].name; partSegs(); renderPrep(); };
      row.querySelector('.group').appendChild(b);
    });
  });
  $('partLine').innerHTML = S.parts.filter(o => o.line).map(o => '<div><b>' + o.name + '</b> · ' + o.line + '</div>').join('');
}
function oddsHtml(cn, tot, prev) {
  return KINDS.map(k => {
    const v = tot ? Math.round(cn[k] / tot * 100) : 0, had = prev ? prev[k] : v;
    let dir = v > had ? 'up' : v < had ? 'down' : '';
    if (k === 'CRACK') dir = dir === 'up' ? 'down' : dir === 'down' ? 'up' : '';
    if (k === 'HOLD') dir = '';
    return '<div class="' + (cn[k] ? '' : 'off') + '"><span style="color:' + KC[k] + '">' + k + '</span><b class="' + dir + '">' + v + '%</b></div>';
  }).join('');
}
const linesHtml = ls => ls.map(l => '<li><b>' + l.what + '</b><em style="color:' + l.col + '">' + l.how + '</em></li>').join('');
function renderPrep() {
  const n = R.slotsFor(lvl()), total = Object.keys(FOUND).length;
  pieceKv();
  $('slotWord').textContent = n === 0 ? 'OPEN AT TRADE 3' : save.chosen.length + ' OF ' + n + ' SLOT' + (n > 1 ? 'S' : '') + ' · ' + save.found.length + ' OF ' + total + ' FOUND';
  $('slots').innerHTML = Array.from({ length: 3 }, (_, i) => '<i class="' + (i < save.chosen.length ? 'on' : '') + '" style="' + (i >= n ? 'opacity:.25' : '') + '"></i>').join('')
    + '<span>' + (n < 3 ? 'Trade ' + (n === 0 ? 3 : n === 1 ? 5 : 7) + ' opens ' + (n === 0 ? 'the first' : 'another') : 'All three open') + ' · each takes a plain GOOD\'s place</span>';
  $('bag').innerHTML = Object.entries(FOUND).map(([id, f]) => {
    if (!save.found.includes(id)) return '<button class="unk" disabled><div style="aspect-ratio:3/4">' + unknownLook(id).face + '</div>NOT FOUND</button>';
    const on = save.chosen.includes(id), full = !on && save.chosen.length >= n;
    return '<button data-f="' + id + '" class="' + (full || n === 0 ? 'full' : '') + (fresh === id ? ' fresh' : '') + '" aria-pressed="' + on + '"' + (full || n === 0 ? ' disabled' : '')
      + ' title="' + f.name + ': ' + f.line + '"><div style="aspect-ratio:3/4">' + bagLook(id).face + '</div>' + f.short + '</button>';
  }).join('');
  fresh = null;
  $('bag').querySelectorAll('button[data-f]').forEach(b => b.onclick = () => {
    const id = b.dataset.f; save.chosen = save.chosen.includes(id) ? save.chosen.filter(x => x !== id) : save.chosen.concat(id);
    store(save); newWorking(); renderPrep();
  });
  $('foundLines').innerHTML = save.chosen.length ? save.chosen.map(id => '<div><b>' + FOUND[id].name + '</b> · ' + FOUND[id].line + '</div>').join('')
    : '<div style="color:var(--bone-faint)">' + (n ? 'Tap a found tile to bring it.' : 'Your found tiles wait in the bag until trade 3.') + '</div>';
  const order = { GOOD: 0, GREAT: 1, HOLD: 2, CRACK: 3, TRUE: 4, FOUND: 5 };
  const sorted = S.rack.slice().sort((a, b) => order[a.k] - order[b.k] || (a.src > b.src ? 1 : -1));
  $('prepRack').innerHTML = sorted.map(x => { const L = lookOf(x); return '<div class="tkt up" style="--r:' + L.r + 'deg; opacity:1"><div class="in"><div class="b">' + L.back + '</div><div class="f">' + L.face + '</div></div></div>'; }).join('');
  renderTakes();
  $('prepCount').textContent = S.rack.length + ' TILES';
  $('prepOdds').innerHTML = oddsHtml(R.counts(S.rack), S.rack.length, null);
  $('prepLines').innerHTML = linesHtml(S.lines);
}

// what this pattern with these parts takes, against the store room
const rec = () => Sh.recipe(pat, picks());
function renderTakes() {
  const r = rec(), h = hour(), sh = Sh.short(save.mats, r), ok = !sh.length;
  $('takesWord').textContent = ok ? 'IN THE STORE ROOM' : 'SHORT';
  $('takes').innerHTML = r.map(x => { const have = save.mats[x.mat] || 0; return '<li><b>' + MATS[x.mat].name + ' × ' + x.n + '</b><em class="' + (have >= x.n ? 'ok' : 'short') + '">have ' + have + '</em></li>'; }).join('');
  $('makeIt').disabled = !ok; $('workIt').disabled = !ok;
  $('takesCard').style.borderColor = ok ? '' : 'var(--blood)';
  if (ok) { $('takesBtns').innerHTML = '<span class="small" style="color:var(--bone-faint)">Taken when you begin. Walk away from a working and they\'re spent.</span>'; return; }
  const gone = sh.filter(x => !Sh.sells(x.mat, h));
  const cost = sh.reduce((c, x) => c + Sh.priceOf(x.mat, h) * (x.n - x.have), 0);
  $('takesBtns').innerHTML = gone.length ? '<span class="small" style="color:var(--bone-faint)">' + gone.map(x => MATS[x.mat].name).join(', ') + ': not in the pedlar\'s pack this hour.</span>'
    : '<button class="seg go" id="buyShort"' + (save.coins < cost ? ' disabled' : '') + '>BUY WHAT\'S SHORT · ' + cost + ' c</button>'
      + (save.coins < cost ? '<span class="small" style="color:var(--bone-faint)">You have ' + save.coins + ' coins.</span>' : '');
  if (!gone.length) $('buyShort').onclick = () => { sh.forEach(x => Sh.buy(save, x.mat, x.n - x.have, hour())); store(save); renderTakes(); };
}
function spend() {   // take the materials as a working begins; false if they're not all there
  if (!Sh.takeMats(save, rec())) { renderTakes(); return false; }
  store(save); return true;
}

// ---------- THE WORKING ----------
function toWork() {
  if (!spend()) return;
  R.begin(S); paused = false; prevOdds = null; lastStrike = 0;
  view.flash = 0; view.ring = 0; view.sparks = [];
  show('work');
  $('workT').textContent = S.metal.name + ' ' + PATTERNS[pat].name;
  setFireBtn();
  popLabel({ label: 'HEAT IT', gain: FORGE.fire, why: 'then strike in the gold band', colour: '#e8c464' });
  render();
}
function setFireBtn() {
  $('bFire').innerHTML = (S.inFire ? FORGE.out : FORGE.fire) + '<small>' + (S.inFire ? 'R' : 'R · RESHUFFLES THE STRIP') + '</small>';
  $('bFire').setAttribute('aria-pressed', S.inFire ? 'true' : 'false');
}
function showPop(html, size) {
  const el = $('pop'); el.className = 'pop' + (size ? ' ' + size : ''); el.innerHTML = html;
  void el.offsetWidth; el.classList.add('go');
}
function popLabel(p) {
  showPop('<span class="lbl" style="background:' + p.colour + '">' + p.label + '</span>' + (p.gain ? '<span class="gain" style="color:' + p.colour + '">' + p.gain + '</span>' : '') + (p.why ? '<span class="why">' + p.why + '</span>' : ''), p.size);
}
function popTile(p) {
  const L = lookOf(p.tile);
  showPop('<div class="big" style="transform:rotate(' + L.r + 'deg)">' + L.face + '</div>'
    + (p.gain ? '<span class="gain" style="color:' + (p.colour || KC[p.tile.k]) + '">' + p.gain + '</span>' : '') + (p.why ? '<span class="why">' + p.why + '</span>' : ''), p.size);
}
function playPops(pops) {
  pops.forEach(p => {
    const go = () => {
      if (!S || screen !== 'work') return;
      if (p.ring) { view.ring = 1; view.ringC = p.ring; }
      if (p.made) { $('bar').classList.add('flash'); later(() => $('bar').classList.remove('flash'), 900); }
      p.tile ? popTile(p) : popLabel(p);
    };
    p.delay ? later(go, p.delay) : go();
  });
}
function strike() {
  if (screen !== 'work' || !S || S.done || paused) return;
  const now = performance.now();
  if (now - lastStrike < 420) return;
  lastStrike = now;
  const ev = R.strike(S);
  if (!ev) return;
  setFireBtn(); playPops(ev.pops);
  view.flash = 1; view.sparks.push(...sparksFor(ev.k, ev.dead));
  render();
  if (ev.drop) { S.done = true; later(() => finish('dropped'), 700); }
}
function toggleFire() {
  if (screen !== 'work' || !S || S.done || paused) return;
  const r = R.toggleFire(S);
  if (r && r.shuffled) popLabel({ label: 'SHUFFLED', gain: 'BACK IN THE FIRE · EVERY TILE RETURNS', size: 'bigpop', colour: '#e8c464' });
  setFireBtn(); render();
}
function quench() {
  if (screen !== 'work' || !S || S.done || paused) return;
  if (S.shape < 100) { popLabel({ label: 'NOT YET', gain: 'FILL THE SHAPE FIRST', size: 'bad', colour: '#8e9bb0' }); return; }
  finish('quench');
}
function toggleSheet(on) {
  if (screen !== 'work' || !S || S.done) return;
  paused = on === undefined ? !paused : on;
  $('sheet').hidden = !paused;
  if (paused) { renderSheet(); $('bClose').focus(); }
}
function tileHtml(x, i, anim) {
  const L = lookOf(x);
  const cls = 'tkt' + (x.up ? ' up' : '') + (x.up && x.n === S.strikes ? ' last' : '') + (x.isNew && anim ? ' new' : '') + (x.added && !x.up ? ' slip' : '') + (x.peek && !x.up ? ' peek' : '');
  const back = x.peek && !x.up ? L.back.replace('class="tile back"', 'class="tile back" data-peek="' + (x.f ? FOUND[x.f].short : x.k) + '"') : L.back;
  return '<div class="' + cls + '" style="--r:' + L.r + 'deg; --d:' + (i * 0.02).toFixed(2) + 's"><div class="in"><div class="b">' + back + '</div><div class="f">' + L.face + '</div></div></div>';
}
function render() {
  if (screen !== 'work' || !S) return;
  const shaping = S.shape < 100;
  if (!S.done) { $('cShape').className = shaping ? 'on' : 'done'; $('cPush').className = shaping ? '' : 'on'; $('cDone').className = ''; }
  $('barLabel').textContent = shaping ? 'SHAPE' : 'WORKED';
  $('barVal').textContent = shaping ? Math.round(S.shape) + ' %' : '+' + Math.round(S.worked) + ' %';
  $('bar').classList.toggle('worked', !shaping);
  $('barFill').style.width = (shaping ? S.shape : Math.min(100, S.worked * 2)) + '%';
  $('bar').querySelectorAll('.notch').forEach(n => n.remove());
  if (shaping) S.notches.forEach(p => { const n = document.createElement('span'); n.className = 'notch'; n.style.left = p + '%'; $('bar').appendChild(n); });
  const o = R.odds(S);
  $('oCommon').textContent = Math.round(o.c); $('oFine').textContent = Math.round(o.f); $('oRare').textContent = Math.round(o.r); $('oCracks').textContent = S.cracks;
  $('flags').textContent = [S.twin ? 'TWIN READY' : '', S.warden ? 'WARDEN READY' : '', S.frost ? 'FROST SIDE' : ''].filter(Boolean).join(' · ');
  $('bQuench').disabled = shaping || S.done;
  $('bQuench').innerHTML = FORGE.close + '<small>' + (shaping ? 'ONCE IT\'S SHAPED' : 'Q · WHENEVER YOU CHOOSE') + '</small>';
  const L = R.left(S), cn = R.counts(L), tot = L.length;
  $('leftWord').textContent = tot + ' OF ' + S.rack.length + ' FACE DOWN';
  const nowOdds = {}; KINDS.forEach(k => nowOdds[k] = tot ? Math.round(cn[k] / tot * 100) : 0);
  $('workOdds').innerHTML = oddsHtml(cn, tot, prevOdds); prevOdds = nowOdds;
  $('rowRack').style.setProperty('--n', S.rack.length);
  $('rowRack').innerHTML = S.rack.map((x, i) => tileHtml(x, i, true)).join('');
  S.rack.forEach(x => x.isNew = false);
  $('streak').innerHTML = Array.from({ length: 8 }, (_, i) => '<i class="' + (i < S.streak || S.white > 0 ? 'on' : '') + '"></i>').join('');
  $('streakVal').textContent = S.level < 5 ? 'AT TRADE 5' : S.white > 0 ? 'WHITE HEAT' : Math.min(8, S.streak) + ' / 8';
  if (paused) renderSheet();
}
function renderSheet() {
  const L = R.left(S);
  $('sheetCount').textContent = (S.rack.length - L.length) + ' turned · ' + L.length + ' face down';
  $('sheetOdds').innerHTML = oddsHtml(R.counts(L), L.length, null);
  $('sheetRack').innerHTML = S.rack.map((x, i) => tileHtml(x, i, false)).join('');
  $('sheetLines').innerHTML = linesHtml(S.lines);
  const hl = S.heatLines.slice();
  if (S.scaled) hl.push({ what: 'Left in past white', how: S.scaled + ' GOOD → HOLD (stays)', col: KC.HOLD });
  hl.push({ what: 'Back in the fire', how: 'every tile returns · the slipped-in go', col: 'var(--bone)' });
  $('heatLines').innerHTML = linesHtml(hl);
}
function hint() {
  let h = '';
  if (!S.done) {
    if (S.inFire) h = S.meter >= S.over ? '<i>Past white.</i> Take it out before it scales.' : S.meter >= S.band[0] ? '<i>In the band.</i> Strike: it comes out on the first strike.' : 'Heating… wait for the gold band.';
    else if (S.meter < S.band[0]) h = 'Below the band: <i>' + FORGE.fire + '</i> (every tile returns).';
    else h = S.shape < 100 ? '<i>In the band.</i> Strike. It cools while you wait.' : '<i>It\'s made.</i> Each strike pushes it. Read what\'s left face down, then QUENCH.';
  }
  if ($('hint').innerHTML !== h) $('hint').innerHTML = h;
}

// ---------- THE RESULT ----------
function finish(how) {
  if (!S) return;
  clearTimers(); paused = false; $('sheet').hidden = true;
  const res = R.finish(S, how);
  if (screen === 'work') { $('cDone').className = 'on'; $('cPush').className = 'done'; render(); }
  $('result').hidden = false; document.body.style.overflow = 'hidden';
  if (res.earned) {
    const two = R.rollAffixes(pat, 2, rng);
    $('rDone').hidden = true; $('rPick').hidden = false;
    $('rPickWhy').textContent = (res.whiteHeat ? 'WHITE HEAT' : 'A TRUE') + ' earned it. It came out ' + TIERS[res.tier].name + '.';
    $('rPicks').innerHTML = two.map((a, i) => '<button data-i="' + i + '"><b>' + a[0] + '</b>' + a[1] + '</button>').join('');
    $('rPicks').querySelectorAll('button').forEach(b => b.onclick = () => complete(res, two[+b.dataset.i]));
    $('rPicks').querySelector('button').focus({ preventScroll: true }); $('result').scrollTop = 0;
  } else complete(res, null);
}
function complete(res, picked) {
  const before = levelFor(pat);
  const piece = R.makePiece({ patternId: pat, picks: picks(), result: res, picked, maker: save.maker, rng, now: Date.now() });
  save.cards.unshift(piece); save.made++;
  const xp = R.xpFor(res);
  const tr = save.trades[pat] || (save.trades[pat] = { xp: 0 }); tr.xp += xp;
  const after = levelFor(pat), p = PATTERNS[pat];
  $('rPick').hidden = true; $('rDone').hidden = false;
  $('rCard').innerHTML = card(piece);
  $('rLine').innerHTML = res.instant ? 'Made at once at the plain odds: Fine ' + res.odds.f + ' % · Rare ' + res.odds.r + ' %.'
    : res.dropped ? (res.flawed ? 'A second crack after it was made. It holds together, flawed, and is worth less.' : 'A second crack after it was made dropped it a tier.')
    : 'WORKED +' + res.worked + ' % · it had Fine ' + Math.round(res.odds.f) + ' % · Rare ' + Math.round(res.odds.r) + ' %';
  $('rWhy').textContent = res.instant ? 'No working, no pick, no found tile, no practice.'
    : (res.cracks ? res.cracks + ' crack' + (res.cracks > 1 ? 's' : '') : 'No cracks') + ' · ' + res.strikes + ' strikes · ' + res.heats + ' heat' + (res.heats > 1 ? 's' : '');
  // practice
  const tEl = $('rTrade'); tEl.hidden = xp === 0; tEl.className = 'gift plain';
  if (xp) {
    let opened = '';
    if (after.level > before.level) {
      const got = [];
      const sl = R.slotsFor(after.level) - R.slotsFor(before.level); if (sl > 0) got.push('a found-tile slot');
      if (before.level < 3 && after.level >= 3) got.push('cracks are in your strip now, and the pick can be won');
      if (before.level < 5 && after.level >= 5) got.push('WHITE HEAT');
      if (before.level < 7 && after.level >= 7) got.push('a TRUE tile of your own');
      R.partOptions(pat).forEach(pp => pp.opts.forEach(o => { if ((o.level || 1) > before.level && o.level <= after.level) got.push(o.name); }));
      opened = got.length ? ' It opens: ' + got.join(', ') + '.' : '';
    }
    tEl.innerHTML = '<div><b>' + (after.level > before.level ? p.trade.toUpperCase() + ' · NOW TRADE ' + after.level : 'PRACTICE · ' + p.trade.toUpperCase()) + '</b><span>+' + xp + ' practice · trade ' + after.level
      + (after.need ? ' · ' + after.into + ' of ' + after.need + ' to the next' : ' · mastered') + '.' + opened + '</span></div>';
  }
  // a successful working turns up a found tile
  const missing = Object.keys(FOUND).filter(id => !save.found.includes(id));
  const gEl = $('rGift'); gEl.hidden = true; gEl.className = 'gift';
  if (res.clean && missing.length) {
    const id = missing[Math.floor(rng() * missing.length)];
    save.found.push(id); fresh = id;
    gEl.innerHTML = '<div class="gt">' + bagLook(id).face + '</div><div><b>A NEW FOUND TILE · FOR A ' + (res.cracks === 0 ? 'CLEAN' : 'WHITE-HOT') + ' WORKING</b><strong>' + FOUND[id].name + '</strong><span>'
      + FOUND[id].line + '. In your bag now (' + save.found.length + ' of ' + Object.keys(FOUND).length + ').</span></div>';
    gEl.hidden = false;
  }
  const free = save.shelf.findIndex(e => !e);
  $('rShelf').hidden = free < 0;
  $('rShelf').textContent = 'ON THE SHELF · ' + Sh.priceAt(piece, 'fair') + ' c';
  $('rShelf').onclick = () => { Sh.place(save, piece.id, free); store(save); toShop(); };
  if (!store(save)) $('rWhy').textContent += ' · This browser would not save it.';
  $('rAgain').focus({ preventScroll: true }); $('result').scrollTop = 0;
}
$('rAgain').onclick = toPrepare;
$('rHome').onclick = toHome;

// ---------- the clock ----------
const cv = $('cv'), g = cv.getContext('2d');
let layout = LAYOUTS.wide;
function fitStage() {   // a phone held upright gets the tall drawing
  const tall = phoneQ.matches && window.innerHeight > window.innerWidth;
  layout = tall ? LAYOUTS.tall : LAYOUTS.wide;
  if (cv.width !== layout.W || cv.height !== layout.H) { cv.width = layout.W; cv.height = layout.H; }
}
window.addEventListener('resize', fitStage); fitStage();
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  // the shop's clock: only while this page is in front (a hidden tab gets no frames, so no time passes)
  const visits = Sh.shopStep(save, dt, rng, Date.now());
  if (visits.length) {
    store(save);
    visits.forEach(e => { if (e.sold) { coins(); if (screen !== 'shop') { toast('<b>Sold: ' + esc(e.sold.name) + ' · +' + e.sold.price + ' c</b><br>to ' + esc(e.who)); $('navSold').hidden = false; } } });
    if (screen === 'shop') renderShop();
  } else if (screen === 'shop' && floorShown && save.ledger[0] && Date.now() - save.ledger[0].at > 30000) renderFloor();
  if (screen === 'supp' && suppHour !== hour()) renderSupp();
  if (S && screen === 'work') {
    if (!paused && !S.done) {
      const out = R.tick(S, dt);
      if (out.scaled) { popLabel({ label: 'IT SCALES', gain: 'A FACE-DOWN GOOD TURNS TO HOLD', why: 'TAKE IT OUT', size: 'bad', colour: KC.HOLD }); render(); }
      if (out.whiteEnded) render();
    }
    if (!paused) { view.flash = Math.max(0, view.flash - dt * 4); view.ring = Math.max(0, view.ring - dt * 1.2); }
    paint(g, S, view, paused ? 0 : dt, layout);
    hint();
  }
  requestAnimationFrame(frame);
}

// ---------- wiring ----------
$('workIt').onclick = toWork;
$('makeIt').onclick = () => { if (spend()) finish('instant'); };
$('bHome').onclick = toHome;
$('bLeave').onclick = () => {
  if (S && !S.done && !confirm('Walk away from this working? The materials are spent.')) return;
  toPrepare();
};
$('bStrike').onclick = strike;
$('bFire').onclick = toggleFire;
$('bQuench').onclick = quench;
$('bStrip').onclick = () => toggleSheet();
$('bClose').onclick = () => toggleSheet(false);
cv.addEventListener('pointerdown', e => { e.preventDefault(); strike(); });
document.addEventListener('keydown', e => {
  if (e.target instanceof HTMLInputElement) return;
  if (!$('look').hidden) { if (e.key === 'Escape') $('look').hidden = true; return; }
  if (!$('result').hidden) return;                       // the result's own buttons take the keys
  const onButton = document.activeElement && document.activeElement.tagName === 'BUTTON';
  if (screen === 'work') {
    if (e.code === 'Space' || (e.code === 'Enter' && !onButton)) { paused ? toggleSheet(false) : strike(); e.preventDefault(); }
    else if (/^[rRbB]$/.test(e.key)) { paused ? toggleSheet(false) : toggleFire(); }
    else if (/^[qQxX]$/.test(e.key)) quench();
    else if (/^[yY]$/.test(e.key)) toggleSheet();
    else if (e.key === 'Escape') toggleSheet(false);
  } else if (screen === 'prepare' && e.code === 'Space' && !onButton) { if (!$('workIt').disabled) toWork(); e.preventDefault(); }
});
if (!phoneQ.matches && !save.made) $('howd').open = true;

toHome();
requestAnimationFrame(frame);
