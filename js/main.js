// DarkclayFORGE. The screens: THE FORGE (home), PREPARE, THE WORKING, THE RESULT; THE SHOP and SUPPLIERS.
import { KINDS, KC, TIERS, FORGE, STATIONS, FORGED_PARTS, PATTERNS, FOUND, MATS, SUPPLIERS, TAGS, HAGGLE, PATIENCE, ROLES, ROUTES, FURNITURE, SHELF_LEVELS, ROOM_SIZES, TOOLS, PERKS, RENOWN } from './data.js?v=14';
import * as R from './rules.js?v=14';
import * as Sh from './shop.js?v=14';
import * as St from './staff.js?v=14';
import * as Rm from './room.js?v=14';
import * as G from './growth.js?v=14';
import { decodeCard, linkFor } from './share.js?v=14';
import * as Snd from './sound.js?v=14';
import { lookOf, bagLook, unknownLook } from './tiles.js?v=14';
import { card, ART } from './card.js?v=14';
import { paint, sparksFor, LAYOUTS } from './stage.js?v=14';
import { load, store } from './save.js?v=14';

const $ = id => document.getElementById(id);
const rng = Math.random;
const save = load();
R.convertSave(save); Sh.fixShelf(save); Rm.fixRoom(save); Sh.fixShelf(save); G.fixWall(save);
save.queue = [];   // whoever was at the counter when the page closed has gone
let awaySum = St.catchUp(save, Date.now(), rng);   // the shop while the page was closed
store(save);
const phoneQ = window.matchMedia('(max-width: 600px)');
const TIERC = ['var(--t-common)', 'var(--t-fine)', 'var(--t-rare)'];

let screen = 'home';       // home | shop | supp | prepare | work
let pat = 'falchion';      // the pattern on the bench
let S = null;              // the working
let rw = null;             // back in the fire: { id, from } of the piece on the anvil, or null for a new piece
let paused = false, lastStrike = 0, fresh = null, prevOdds = null;
const view = { flash: 0, ring: 0, ringC: '#fff', sparks: [] };
const timers = [];
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const clearTimers = () => { timers.forEach(clearTimeout); timers.length = 0; };

const levelFor = id => R.levelOf((save.trades[id] || {}).xp || 0);
const lvl = () => levelFor(pat).level;
const picks = () => save.picks[pat] || (save.picks[pat] = PATTERNS[pat].parts.map(() => 0));
const rwCard = () => rw && save.cards.find(c => c.id === rw.id);
const stn = () => S ? S.station : R.stationOf(pat);
const benchPicks = () => rw ? R.srcOf(rwCard()).picks : picks();
const benchName = () => rw ? TIERS[rw.from].name + ' ' + rwCard().name : (S.metal.adj || S.metal.name) + ' ' + PATTERNS[pat].name;
const HUBS = ['home', 'shop', 'supp', 'staff'];
const hour = () => Sh.hourOf(Date.now());
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function show(which) {
  screen = which;
  $('nav').hidden = !HUBS.includes(which);
  document.querySelectorAll('#nav [data-go]').forEach(b => b.dataset.go === which ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  $('vHome').hidden = which !== 'home';
  $('vShop').hidden = which !== 'shop';
  $('vSupp').hidden = which !== 'supp';
  $('vStaff').hidden = which !== 'staff';
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
// sound: woken by the first tap or key; the mute switch kept apart from the save
['pointerdown', 'keydown'].forEach(t => document.addEventListener(t, Snd.unlock, { capture: true }));
function muteLabel() { $('muteBtn').textContent = Snd.isMuted() ? '♪ OFF' : '♪ ON'; $('muteBtn').setAttribute('aria-pressed', String(!Snd.isMuted())); }
$('muteBtn').onclick = () => { Snd.setMuted(!Snd.isMuted()); muteLabel(); Snd.play('coin'); };
muteLabel();
const go = where => where === 'home' ? toHome() : where === 'shop' ? toShop() : where === 'staff' ? toStaff() : toSupp();
document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
// never stuck: broke, nothing made, nothing to make it from
function rescueCheck() {
  if (Sh.rescue(save, hour())) { store(save); toast('<b>The yard\'s scrap bin.</b> Dougal leaves you a bar and a cord, enough for a dagger.'); }
}

// ---------- tabs: the forge's and the shop's pages, one at a time (the chosen one remembered on this device) ----------
const TABKEY = 'darkclayforge.tab.';
let seenLedger = Date.now();
function openTab(group, tab) {
  document.querySelectorAll('[data-group="' + group + '"]').forEach(s => s.toggleAttribute('data-off', s.dataset.tab !== tab));
  document.querySelectorAll('[data-tabs="' + group + '"] [data-tabbtn]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tabbtn === tab)));
  try { localStorage.setItem(TABKEY + group, tab); } catch (e) { /* no storage */ }
  if (group === 'shop' && tab === 'ledger') { seenLedger = (save.ledger[0] || {}).at || 0; tabBadges(); }
}
document.querySelectorAll('[data-tabs]').forEach(bar => {
  bar.setAttribute('role', 'tablist');
  bar.querySelectorAll('[data-tabbtn]').forEach(b => { b.setAttribute('role', 'tab'); b.onclick = () => openTab(bar.dataset.tabs, b.dataset.tabbtn); });
  let t = null; try { t = localStorage.getItem(TABKEY + bar.dataset.tabs); } catch (e) { /* no storage */ }
  openTab(bar.dataset.tabs, t && bar.querySelector('[data-tabbtn="' + t + '"]') ? t : bar.querySelector('[data-tabbtn]').dataset.tabbtn);
});
// the tab bars stick just under the bar at the top, however tall it wraps
new ResizeObserver(() => document.documentElement.style.setProperty('--navh', $('nav').offsetHeight + 'px')).observe($('nav'));
const tabNow = group => (document.querySelector('[data-tabs="' + group + '"] [aria-selected="true"]') || {}).dataset?.tabbtn;
// bring a section into view: its tab first
function reveal(el) {
  const sec = el.closest('[data-tab]');
  if (sec && sec.hasAttribute('data-off')) openTab(sec.dataset.group, sec.dataset.tab);
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function tabBadges() {
  const pts = G.pointsLeft(save);
  $('tabSkills').hidden = !pts; $('tabSkills').textContent = pts;
  const fresh = save.ledger.filter(e => e.at > seenLedger && e.sold).length;
  const onLedger = !$('vShop').hidden && $('tabLedger').closest('[data-tabbtn]').getAttribute('aria-selected') === 'true';
  if (onLedger) seenLedger = (save.ledger[0] || {}).at || seenLedger;
  $('tabLedger').hidden = !fresh || onLedger; $('tabLedger').textContent = fresh;
  const r = St.runnerOf(save), ready = r && !r.trip && !save.unpaid;   // a runner home and waiting to be sent out
  $('tabBooks').hidden = !ready; $('tabBooks').textContent = '1';
}

// ---------- first-time hints: each shown once, in place; all can be turned off ----------
const HINTS = {
  home: 'Welcome to your forge. <i>Pick a pattern</i> to make your first piece: the dagger takes the least.',
  prepare: 'This is your <i>strip</i>: the clay tiles you\'ll turn over as you strike. GOOD and GREAT shape the piece, a CRACK marks it. When you\'re ready, <i>WORK IT</i>.',
  work: 'Put it <i>INTO THE FIRE</i> (R), wait for the <i>gold band</i>, then <i>STRIKE</i> (Space, or tap). Fill SHAPE, then <i>QUENCH</i> (Q).',
  'work-bowbench': 'Put the stave <i>INTO THE STEAM</i> (R) until it\'s <i>pliant</i>, then <i>BEND</i> (Space, or tap) <i>with the grain</i>: watch the arrows under the bench, and wait while it runs across. Fill SHAPE, then <i>STRING</i> it (Q).',
  'work-glass': 'Take a gather from the <i>GLORY HOLE</i> (R) until it\'s <i>soft</i>, then <i>BLOW</i> (Space, or tap). Too stiff, it shatters; too soft, it sags. It cools fastest of all. Fill SHAPE, then <i>SET</i> (Q).',
  'work-kettle': 'Hold it at a <i>simmer</i>. A stir doesn\'t cool it: it settles by itself, and <i>STOKE</i> (R) raises it. <i>STIR</i> (Space, or tap) in the band; too hot, it boils over. Fill SHAPE, then <i>STOP</i> (Q). It makes a batch of three.',
  'work-stretcher': 'Put the hide <i>IN THE SOAK</i> (R) until it\'s <i>supple</i>, then <i>STITCH</i> (Space, or tap). Too dry does nothing, too wet tears; it dries as you work. Fill SHAPE, then <i>SET</i> (Q).',
  result: 'Every piece becomes a card. Put it <i>ON THE SHELF</i> and customers will buy it.',
  shop: 'While you\'re on this screen, customers come to the <i>counter</i>: show them a piece and choose your price. Away from it, they buy from the shelf at its tag: <i>CHEAP, FAIR or DEAR</i>.',
  supp: 'Materials for the forge. <i>Prices change on the hour</i>: the arrows show which way.',
  staff: 'A <i>counter clerk</i> sells while you\'re away (the game closed). A <i>runner</i> goes out for materials.',
  points: 'You have a <i>skill point</i>. Spend it under <i>SKILLS</i>.',
};
function tip(key, before, parent) {
  document.querySelectorAll('.hintcard[data-h="' + key + '"]').forEach(x => x.remove());
  if (save.hintsOff || (save.seen || []).includes(key)) return;
  const el = document.createElement('div'); el.className = 'hintcard'; el.dataset.h = key;
  el.innerHTML = '<span class="k">A HINT</span><span>' + HINTS[key] + '</span><span class="btns"><button class="seg">GOT IT</button><button class="skip">NO MORE HINTS</button></span>';
  el.querySelector('.seg').onclick = () => { save.seen = (save.seen || []).concat(key); store(save); el.remove(); };
  el.querySelector('.skip').onclick = () => { save.hintsOff = true; store(save); document.querySelectorAll('.hintcard').forEach(x => x.remove()); };
  if (before) before.parentNode.insertBefore(el, before); else parent.appendChild(el);
}

// ---------- THE FORGE (home) ----------
function toHome() {
  clearTimers(); S = null; rescueCheck(); show('home'); coins();
  $('maker').value = save.maker;
  const patBtn = ([id, p]) => {
    const l = levelFor(id), n = save.cards.filter(c => c.pattern === id).length;
    return '<button class="pat" data-p="' + id + '"><div class="art">' + ART[p.art](p.station ? '#a07850' : '#c9c5be') + '</div><b>' + p.name + '</b>'
      + '<div class="lv">TRADE ' + l.level + '<span>' + (l.need ? l.into + ' / ' + l.need : 'MASTERED') + '</span></div>'
      + '<div class="xp"><i style="width:' + (l.need ? Math.round(l.into / l.need * 100) : 100) + '%"></i></div>'
      + '<div class="lv"><span>' + n + ' MADE</span></div></button>';
  };
  $('patterns').innerHTML = Object.values(STATIONS).map(st => {
    const pats = Object.entries(PATTERNS).filter(([, p]) => (p.station || 'forge') === st.id);
    const head = '<h3 class="stationhead">' + st.word + '</h3>';
    const parts = st.id === 'bowbench' ? '<div class="setup"><b>Parts from the forge</b><span>Arrows need forged heads, a staff a forged ferrule. Forge them at once from iron, or buy them dearer from Hollin\'s Timber.</span><div class="rbtns left">'
      + Object.entries(FORGED_PARTS).map(([id, f]) => '<button class="seg" data-fp="' + id + '"' + ((save.mats.iron || 0) < f.from.iron ? ' disabled' : '') + '>FORGE ' + f.name.toUpperCase() + ' · ' + f.from.iron + ' IRON → ' + f.makes + ' · HAVE ' + (save.mats[id] || 0) + '</button>').join('') + '</div></div>' : '';
    if (Rm.owns(save, st.id)) return head + pats.map(patBtn).join('') + parts;
    return head + '<div class="setup"><b>Set up a ' + st.name.toLowerCase() + '</b><span>' + pats.map(([, p]) => p.trade.toLowerCase()).join(', ').replace(/^./, x => x.toUpperCase()) + ', from hides. ' + st.twist + '</span>'
      + '<button class="seg go" data-station="' + st.id + '"' + (save.coins < st.cost ? ' disabled' : '') + '>SET IT UP · ' + st.cost + ' c</button><span id="stNote-' + st.id + '"></span></div>';
  }).join('');
  $('patterns').querySelectorAll('.pat').forEach(b => b.onclick = () => { rw = null; pat = b.dataset.p; toPrepare(); });
  $('patterns').querySelectorAll('[data-fp]').forEach(b => b.onclick = () => { if (Sh.forgePart(save, b.dataset.fp)) { store(save); Snd.play('GOOD'); toHome(); } });
  $('patterns').querySelectorAll('[data-station]').forEach(b => b.onclick = () => {
    const r = Rm.buyStation(save, b.dataset.station);
    if (r.item) { store(save); coins(); Snd.play('level'); if (dio) dio.setRoom(viewRoom(), save); toHome(); }
    else $('stNote-' + b.dataset.station).textContent = 'Not yet: ' + r.why + '.';
  });
  $('homeFound').textContent = save.found.length + ' OF ' + Object.keys(FOUND).length + ' FOUND';
  $('homeBag').innerHTML = Object.entries(FOUND).map(([id, f]) => save.found.includes(id)
    ? '<button tabindex="-1" title="' + f.name + ': ' + f.line + '"><div style="aspect-ratio:3/4">' + bagLook(id).face + '</div>' + f.short + '</button>'
    : '<button class="unk" disabled><div style="aspect-ratio:3/4">' + unknownLook(id).face + '</div>NOT FOUND</button>').join('');
  renderMaker(); renderTools(); tabBadges();
  if (!save.made && !save.cards.length) tip('home', $('patterns').closest('section'));
  if (G.pointsLeft(save) > 0) tip('points', document.querySelector('[data-tabs="forge"]'));
  const have = Object.entries(save.mats).filter(([, n]) => n > 0);
  $('storeWord').textContent = have.length ? have.reduce((a, [, n]) => a + n, 0) + ' THINGS' : 'EMPTY';
  $('store').innerHTML = have.length ? have.map(([id, n]) => '<span>' + MATS[id].name + '<b>' + n + '</b></span>').join('')
    : '<span class="empty">Nothing in the store room. The suppliers sell bars, hides and hafts.</span>';
  const back = Sh.inBack(save).length;
  $('toBack').textContent = back + ' IN THE BACK · TO THE SHOP';
}
// ---------- THE MAKER: level, renown, skills; THE WORKSHOP: tools ----------
let perkNote = '', toolNote = '';
function renderMaker() {
  const lv = G.makerLevel(save), pts = G.pointsLeft(save), ren = G.renownOf(save), rg = G.rung(save), nx = G.nextRung(save);
  $('makerWord').textContent = save.maker.toUpperCase();
  $('mkLevel').innerHTML = 'Maker level <b>' + lv.level + '</b>';
  $('mkXp').style.width = (lv.need ? Math.round(lv.into / lv.need * 100) : 100) + '%';
  $('mkPoints').textContent = (pts ? pts + ' SKILL POINT' + (pts > 1 ? 'S' : '') + ' TO SPEND · ' : '') + 'ALL PRACTICE COUNTS: EVERY TRADE AND HAGGLING';
  $('mkRenown').innerHTML = 'Renown <b>' + RENOWN[rg].word + '</b> · ' + ren;
  $('mkRen').style.width = (nx ? Math.round((ren - RENOWN[rg].at) / (nx.at - RENOWN[rg].at) * 100) : 100) + '%';
  $('mkRenNext').textContent = (nx ? nx.word + ' AT ' + nx.at + ' · ' : '') + 'PURSES +' + Math.round((G.purseMult(save) - 1) * 100) + ' % · FROM FAIR SALES, ORDERS, THE WALL';
  $('branches').innerHTML = Object.entries(PERKS).map(([bk, b]) => '<div class="branch"><h3>' + b.word + '</h3>' + b.perks.map((p, i) => {
    const have = G.perked(save, p.id), can = G.canTake(save, bk, i).ok;
    return '<button class="perk' + (have ? ' have' : can ? ' can' : '') + '" data-b="' + bk + '" data-i="' + i + '"' + (have || !can ? ' aria-disabled="true"' : '') + '><b>' + p.word + '</b><span>' + p.line + '</span></button>';
  }).join('') + '</div>').join('');
  $('perkNote').textContent = perkNote || (pts ? 'Spend a point: each branch in order.' : 'Rise a level to earn a point.');
  $('branches').querySelectorAll('.perk').forEach(b => b.onclick = () => {
    if (b.getAttribute('aria-disabled') === 'true') { const w = G.canTake(save, b.dataset.b, +b.dataset.i).why; if (w && w !== 'yours already') { perkNote = 'Not yet: ' + w + '.'; renderMaker(); } return; }
    const r = G.takePerk(save, b.dataset.b, +b.dataset.i);
    perkNote = r.ok ? 'Learned: ' + PERKS[b.dataset.b].perks[+b.dataset.i].word + '.' : 'Not yet: ' + r.why + '.';
    store(save); renderMaker(); tabBadges();
  });
}
function renderTools() {
  $('tools').innerHTML = Object.entries(TOOLS).map(([id, t]) => {
    const have = G.has(save, id), c = G.canBuyTool(save, id);
    return '<div class="fi' + (have ? ' have' : '') + '"><b>' + t.name + '</b><span>' + t.line + '.</span>' + (have ? '' : '<button class="seg" data-tool="' + id + '"' + (c.ok ? '' : ' disabled') + '>BUY · ' + t.cost + ' c</button>' + (c.why && c.why !== 'not enough coin' ? '<span>' + c.why + '</span>' : '')) + '</div>';
  }).join('');
  $('toolNote').textContent = toolNote || 'Tools work on every piece, new or back in the fire.';
  $('tools').querySelectorAll('[data-tool]').forEach(b => b.onclick = () => { const r = G.buyTool(save, b.dataset.tool); toolNote = r.ok ? 'Bought: ' + TOOLS[b.dataset.tool].name + '.' : 'Not bought: ' + r.why + '.'; if (r.ok) { store(save); coins(); } renderTools(); });
}
// a piece to share: the link carries the card itself
async function sharePiece(c) {
  const url = linkFor(c, location.href.split('?')[0]);
  try {
    if (navigator.share) { await navigator.share({ title: c.name, text: c.name + ' · ' + TIERS.find(t => t.id === c.tier).name + ', made by ' + (c.maker || save.maker), url }); return 'Shared.'; }
    await navigator.clipboard.writeText(url); return 'Link copied. Anyone with it sees this card.';
  } catch (e) { return e && e.name === 'AbortError' ? '' : 'Copy this link: ' + url; }
}
function shareBtn(c, where) {
  const b = document.createElement('button'); b.className = 'seg'; b.textContent = 'SHARE THIS CARD';
  b.onclick = async () => { const m = await sharePiece(c); if (m) { let p = where.querySelector('.sharemsg'); if (!p) { p = document.createElement('p'); p.className = 'note sharemsg'; where.appendChild(p); } p.textContent = m; } };
  return b;
}
function openLook(html, acts, wide, shareOf) {
  $('lookCard').innerHTML = html; $('lookActs').innerHTML = acts || ''; $('lookActs').onclick = null;
  if (shareOf) $('lookActs').appendChild(shareBtn(shareOf, $('lookActs')));
  $('look').querySelector('.box').classList.toggle('wide', !!wide);
  $('look').hidden = false; $('look').scrollTop = 0; $('lookClose').focus({ preventScroll: true });
}
$('maker').onchange = () => { save.maker = $('maker').value.trim() || 'the Maker'; $('maker').value = save.maker; store(save); };
$('lookClose').onclick = () => { $('look').hidden = true; };

// ---------- THE SHOP ----------
let floorShown = null;
function toShop() {
  clearTimers(); S = null; rescueCheck(); show('shop'); coins(); $('navSold').hidden = true; renderShop();
  tip('shop', $('floor'));
  if (!dioP) { $('floor').classList.add('loading'); dioP = import('./diorama.js?v=14').then(m => m.create($('floor'), { onTap: dioTap })).catch(() => null).then(d => {
    dio = d; $('floor').classList.remove('loading');
    if (d) { $('floor').classList.add('has3d'); $('dioBar').hidden = false; d.setRoom(viewRoom(), save); d.setShelf(shelfShown()); d.setQueue(save.queue); renderDioBar(); }
    return d;
  }); }
  else if (dio) { dio.setRoom(viewRoom(), save); dio.setQueue(save.queue); dio.redraw(); }
}

// ---------- THE SHOP IN 3D ----------
// the shelf's pieces where they stand in the room, for the card stands
const shelfShown = () => Rm.shelfSpots(save.room).map((p, i) => { const e = save.shelf[i], c = e && save.cards.find(x => x.id === e.id); return c && { slot: i, shelf: p.shelf, spot: p.spot, lv: p.lv, card: c, price: Sh.priceAt(c, e.tag) }; }).filter(Boolean);
let dioP = null, dio = null, arranging = false, picked = null, dioMsg = '', dioView = 'shop';
const viewRoom = () => dioView === 'work' ? save.workshop : save.room;
function setView(v) { if (v === dioView) return; dioView = v; picked = null; dioMsg = ''; if (dio) { dio.setRoom(viewRoom(), save); dio.setQueue(save.queue); } renderDioBar(); renderFurnish(); }
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => setView(b.dataset.view));
function dioTap(t) {
  if (t.door && !arranging) { setView(t.door); return; }
  if (t.slot != null && !arranging) { slotOpen(t.slot); return; }
  if (arranging) {
    if (t.item && t.item !== picked) { picked = t.item; dioMsg = ''; }
    else if (picked && t.tile) {
      const it = save.room.items.find(i => i.id === picked), [fx, fz] = Rm.fpOf(it);
      let ok = false;
      for (let ox = 0; ox < fx && !ok; ox++) for (let oz = 0; oz < fz && !ok; oz++) ok = Rm.move(save, picked, t.tile[0] - ox, t.tile[1] - oz);
      dioMsg = ok ? '' : 'It won\'t fit there.';
      if (ok) { store(save); dio.setRoom(viewRoom(), save); }
    } else if (t.item === picked) picked = null;
    renderDioBar(); return;
  }
  if (t.kind && Rm.homeOf(t.kind) === 'work') toHome();
  else if (t.kind === 'shelf') reveal($('slots2'));
  else if (t.kind === 'counter' || t.person) reveal(save.queue.length ? $('counterBox') : $('ledger'));
  else if (t.item) reveal($('furnish'));
}
function renderDioBar() {
  if (!dio) return;
  $('floor').classList.toggle('arranging', arranging);
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === dioView)));
  dio.arrange(arranging, picked);
  $('arrangeBtn').textContent = arranging ? 'DONE' : 'ARRANGE';
  $('arrangeBtn').classList.toggle('go', arranging);
  const it = picked && save.room.items.find(i => i.id === picked), f = it && FURNITURE[it.kind];
  $('dioHint').textContent = !arranging ? (dioView === 'work' ? 'The forge and every station. Tap one to work; the doorway leads back to the shop.' : 'Tap a card on a shelf to see it, or the counter; the doorway at the back leads to the workshop.') : dioMsg || (it ? f.name + ': tap a free tile to move it there.' : 'Tap a piece to pick it up. Blue tiles stay clear for customers.');
  $('dioActs').innerHTML = arranging && it ? '<button class="seg" id="dioTurn">TURN</button>' + (it.kind === 'shelf' && upgradeWord(it) ? '<button class="seg" id="dioUp"' + (save.coins < SHELF_LEVELS[Rm.levelOf(it) + 1].cost ? ' disabled' : '') + '>' + upgradeWord(it) + '</button>' : '') + (f.fixed ? '' : '<button class="seg" id="dioSell">SELL BACK</button>') : '';
  if ($('dioUp')) $('dioUp').onclick = () => { const r = doUpgrade(picked); dioMsg = shelfNote; renderDioBar(); };
  if ($('dioTurn')) $('dioTurn').onclick = () => { if (!Rm.turn(save, picked)) dioMsg = 'No room to turn it there.'; else { dioMsg = ''; store(save); dio.setRoom(viewRoom(), save); } renderDioBar(); };
  if ($('dioSell')) $('dioSell').onclick = () => {
    const r = Rm.sellBack(save, picked);
    if (r.why) dioMsg = 'It can\'t go: ' + r.why + '.'; else { dioMsg = 'Sold back for ' + r.refund + ' c.'; picked = null; store(save); coins(); dio.setRoom(viewRoom(), save); renderShop(); }
    renderDioBar();
  };
}
$('arrangeBtn').onclick = () => { arranging = !arranging; picked = null; dioMsg = ''; renderDioBar(); };
function renderWall() {
  G.fixWall(save);
  const n = G.wallSlots(save), w = save.wall || [];
  $('wallWord').textContent = w.length + ' OF ' + n + ' · RENOWN +' + G.wallRenown(save);
  $('wall').innerHTML = Array.from({ length: n }, (_, i) => {
    const c = w[i] && save.cards.find(x => x.id === w[i]);
    return c ? '<button data-wall="' + c.id + '" aria-label="' + esc(c.name) + ', on the wall">' + card(c, { short: true, price: 'ON THE WALL' }) + '</button>'
      : '<button class="slot-empty" data-wallempty="1">EMPTY<br>' + (Sh.inBack(save).length ? 'HANG FROM THE BACK' : 'KEEP A FINE PIECE') + '</button>';
  }).join('');
  $('wall').querySelectorAll('[data-wall]').forEach(b => b.onclick = () => {
    const c = save.cards.find(x => x.id === b.dataset.wall);
    openLook(card(c), '<button class="seg" id="unhang">TAKE IT DOWN</button>', false, c);
    $('unhang').onclick = () => { G.unhang(save, c.id); store(save); $('look').hidden = true; renderShop(); };
  });
  $('wall').querySelectorAll('[data-wallempty]').forEach(b => b.onclick = () => reveal($('back')));
}
let furnNote = '';
function renderFurnish() {
  const room = save.room, size = Rm.sizeOf(room), next = Rm.nextSize(room), ws = Rm.sizeOf(save.workshop), wnext = Rm.nextSize(save.workshop);
  $('charmWord').textContent = size.word + ' · ' + size.w + ' × ' + size.d + ' · CHARM ' + Rm.charm(room, save) + ' · ' + ws.word + ' ' + ws.w + ' × ' + ws.d;
  $('furnList').innerHTML = Object.entries(FURNITURE).filter(([, f]) => !f.fixed).map(([k, f]) => {
    const cost = Rm.costOf(room, k), n = room.items.filter(i => i.kind === k).length;
    return '<div class="fi"><b>' + f.name + (n ? ' · ' + n : '') + '</b><span>' + (f.slots ? 'Two places, made better in THE SHELF: three, then six.' : f.line || '') + (f.charm ? ' Charm ' + f.charm + '.' : '') + '</span>'
      + (cost == null ? '<span>As many as a shop can use.</span>' : '<button class="seg" data-buyf="' + k + '"' + (save.coins < cost ? ' disabled' : '') + '>BUY · ' + cost + ' c</button>') + '</div>';
  }).join('');
  $('furnNote').textContent = furnNote || 'New decor goes in the room in view (' + (dioView === 'work' ? 'the workshop' : 'the shop front') + '). Charm in the shop front brings customers in sooner; the workshop\'s is for you. Arrange to move things.';
  $('expandWork').hidden = !wnext;
  if (wnext) { $('expandWork').textContent = 'MAKE THE WORKSHOP BIGGER · ' + wnext.w + ' × ' + wnext.d + ' · ' + wnext.cost + ' c'; $('expandWork').disabled = save.coins < wnext.cost; }
  $('expandBtn').hidden = !next;
  if (next) { $('expandBtn').textContent = 'MAKE THE SHOP FRONT BIGGER · ' + next.w + ' × ' + next.d + ' · +' + next.capH + ' h AWAY · ' + next.cost + ' c'; $('expandBtn').disabled = save.coins < next.cost; }
  $('furnList').querySelectorAll('[data-buyf]').forEach(b => b.onclick = () => {
    const r = Rm.buy(save, b.dataset.buyf, dioView);
    furnNote = r.why ? 'Not bought: ' + r.why + '.' : 'Bought: ' + FURNITURE[b.dataset.buyf].name + '.';
    if (r.item) { store(save); coins(); if (dio) dio.setRoom(viewRoom(), save); }
    renderShop();
  });
}
$('expandWork').onclick = () => { if (Rm.expand(save, 'work')) { furnNote = 'The workshop is bigger: ' + Rm.sizeOf(save.workshop).word.toLowerCase() + '.'; store(save); coins(); if (dio) dio.setRoom(viewRoom(), save); renderShop(); } };
$('expandBtn').onclick = () => { if (Rm.expand(save)) { furnNote = 'The shop is bigger: ' + Rm.sizeOf(save.room).word.toLowerCase() + '.'; store(save); coins(); if (dio) dio.setRoom(viewRoom(), save); renderShop(); } };
function figure(colour) {
  return '<svg class="fig in" viewBox="0 0 46 110" aria-hidden="true"><circle cx="23" cy="14" r="11" fill="' + colour + '" stroke="#000" stroke-width="3"/>'
    + '<path d="M8,32 Q23,24 38,32 L42,78 L33,78 L31,108 L15,108 L13,78 L4,78 Z" fill="' + colour + '" stroke="#000" stroke-width="3"/></svg>';
}
function renderFloor() {
  const e = save.ledger[0], v = $('visitor'), q = save.queue[0];
  if (q) {
    if (floorShown === 'q' + q.who) return;
    floorShown = 'q' + q.who;
    v.innerHTML = figure(q.fig) + '<div class="say"><b>' + esc(q.who) + '</b>' + (q.kind === 'seller' ? 'Has something to sell.' : esc(q.tell || '')) + ' <span class="sold">At the counter.</span></div>';
    return;
  }
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
// ---------- THE COUNTER ----------
let lastSig = '', counterNote = '', counterNoteBad = false, counterNoteAt = 0;
const counterSig = () => { const c = save.queue[0]; return save.queue.length + '|' + (c ? c.who + c.shows + (c.counter ? c.counter.price : '') : '') + '|' + (save.order ? save.order.posted : ''); };
function tickCounter() {
  const c = save.queue[0];
  if (c) $('patience').style.width = (c.counter ? 100 : Math.max(0, c.wait / PATIENCE * 100)) + '%';
  if (save.order) { const left = Math.max(0, Math.ceil(save.order.due - save.clock)); $('orderDue').textContent = 'DUE IN ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') + ' OF OPEN SHOP'; }
}
function renderCounter() {
  const c = save.queue[0], box = $('counterBox');
  lastSig = counterSig();
  box.hidden = !c;
  if (!c) return;
  const hl = Sh.haggleLevel(save), rd = G.readLevels(save);
  $('queueWord').textContent = save.queue.length > 1 ? (save.queue.length - 1) + ' WAITING BEHIND' : 'NO ONE BEHIND';
  const head = '<div class="cust">' + figure(c.fig).replace('class="fig in"', 'class="fig"') + '<div class="nm">' + esc(c.who) + '</div>'
    + (c.tell ? '<div class="tell">' + esc(c.tell) + '</div>' : '')
    + '<div class="meta">' + (c.kind === 'buyer' ? 'Wants <b>' + Sh.wantWord(c.want) + (c.least ? ', Fine or better' : '') + '</b>' : 'Has something to sell')
    + (c.kind === 'buyer' && hl >= rd.mood ? '<span class="mood ' + c.mood + '">' + c.mood + '</span>' : '')
    + (c.kind === 'buyer' && hl >= rd.purse ? '<span>Purse <b>' + c.purse + ' c</b></span>' : '') + '</div></div>';
  let body = '';
  if (c.kind === 'seller') {
    const o = c.offer, h = hour();
    if (o.type === 'mats') body = '<div class="note">' + MATS[o.mat].name + (MATS[o.mat].rare ? ' ✶' : '') + ' × ' + o.n + ' for <b>' + o.price + ' c</b>'
      + (Sh.sells(o.mat, h) ? ' (the suppliers ask ' + Sh.priceOf(o.mat, h) * o.n + ' c)' : ' (no supplier has it this hour)') + '. You have ' + (save.mats[o.mat] || 0) + '.</div>';
    else body = '<div class="offer"><div>' + card(o.card, { short: true, price: o.price + ' c' }) + '</div><div class="choices"><div class="note">' + esc(o.card.name) + ', ' + TIERS.find(t => t.id === o.card.tier).name
      + ', worth ' + o.card.worth + ' c. They\'ll take <b>' + o.price + ' c</b>. It goes in the back: sell it, break it down, or rework it.</div></div></div>';
    body += '<div class="rbtns left"><button class="hbtn go" data-act="buy"' + (save.coins < o.price ? ' disabled' : '') + '>BUY IT<small>' + o.price + ' c</small></button><button class="hbtn" data-act="away">NO THANKS</button></div>';
  } else if (c.counter) {
    const cd = save.cards.find(x => x.id === c.counter.id);
    body = '<div class="note">You asked ' + c.counter.asked + ' c for the ' + esc(cd ? cd.name : 'piece') + '. <b>They offer ' + c.counter.price + ' c.</b> Refuse, and they go.</div>'
      + '<div class="rbtns left"><button class="hbtn go" data-act="take">TAKE IT<small>' + c.counter.price + ' c</small></button><button class="hbtn" data-act="refuse">REFUSE</button></div>';
  } else {
    const list = Sh.showable(save);
    if (!list.length) body = '<div class="note">Nothing on the shelf for them.' + (Sh.inBack(save).some(x => Sh.wants(c.want, x)) ? ' Something in the back would do: put it on the shelf.' : '') + '</div>'
      + '<div class="rbtns left"><button class="hbtn" data-act="away">NOTHING FOR THEM</button></div>';
    else {
      const e = list[c.shows % list.length], hm2 = G.haggleMult(save);
      body = '<div class="offer"><div>' + card(e.card, { short: true, price: Sh.priceAt(e.card, e.tag) + ' c<span class="tagword">' + TAGS[e.tag].word + '</span>' }) + '</div><div class="choices">'
        + '<div class="row3">' + Object.entries(HAGGLE).map(([k, h]) => { const pr = Sh.hagglePrice(e.card, e.tag, k, hm2); return '<button class="hbtn' + (k === 'hold' ? ' go' : '') + '" data-act="h:' + k + '" data-id="' + e.card.id + '">' + h.word + '<small>' + pr + ' c</small></button>'; }).join('') + '</div>'
        + '<div class="rbtns left">' + (list.length > 1 && c.shows < 2 ? '<button class="seg" data-act="another">SHOW ANOTHER</button>' : '') + '<button class="seg" data-act="away">NOTHING FOR THEM</button></div></div></div>';
    }
  }
  if (Date.now() - counterNoteAt > 6000) counterNote = '';
  $('counterBody').innerHTML = head + body + (counterNote ? '<p class="note' + (counterNoteBad ? ' bad' : '') + '">' + counterNote + '</p>' : '')
    + (hl < rd.purse ? '<p class="note" style="color:var(--bone-faint)">Haggling ' + hl + (hl < rd.mood ? ': read their mood from their words. It shows at Haggling ' + rd.mood + ', their purse at ' + rd.purse + '.' : ': their purse shows at Haggling ' + rd.purse + '.') + '</p>' : '');
  tickCounter();
}
$('counterBody').onclick = ev => {
  const b = ev.target.closest('button'); if (!b || b.disabled) return;
  const a = b.dataset.act, now = Date.now(), c = save.queue[0]; if (!c) return;
  counterNote = ''; counterNoteBad = false; counterNoteAt = Date.now();
  if (a === 'buy') { const e = Sh.buyOffer(save, now); if (e) { counterNote = 'Bought: ' + esc(e.bought.what) + '.'; Snd.play('coin'); } }
  else if (a === 'away') Sh.sendAway(save, now);
  else if (a === 'another') c.shows++;
  else if (a === 'take' || a === 'refuse') { const r = Sh.answerCounter(save, a === 'take', now); if (r) { counterNote = r.outcome === 'sold' ? 'Sold for ' + r.price + ' c.' : 'They went.'; counterNoteBad = r.outcome !== 'sold'; if (r.outcome === 'sold') { Snd.play('coin'); if (dio) dio.sold(r.entry); } } }
  else if (a.startsWith('h:')) {
    const r = Sh.haggle(save, b.dataset.id, a.slice(2), now);
    if (r) {
      if (r.outcome === 'sold') { counterNote = 'Sold for ' + r.price + ' c.'; Snd.play('coin'); if (dio) dio.sold(r.entry); }
      else if (r.outcome === 'over') { counterNote = '"' + r.price + ' c? That\'s more than I carry." Show another, or meet them.'; counterNoteBad = true; }
      else if (r.outcome === 'gone') { counterNote = 'They went.'; counterNoteBad = true; }
    }
  }
  store(save); coins(); renderShop();
  const first = $('counterBody').querySelector('button:not(:disabled)'); if (first) first.focus({ preventScroll: true });
};
function renderOrder() {
  const o = save.order;
  $('orderBox').hidden = !o;
  if (!o) return;
  const fit = save.cards.filter(c => Sh.fills(o, c));
  $('orderBody').innerHTML = '<div class="who">FROM ' + esc(o.who.toUpperCase()) + ' · "' + esc(o.line) + '"</div>'
    + '<div class="ask">' + esc(Sh.orderWord(o)).replace(/^./, x => x.toUpperCase()) + '</div>'
    + '<div class="note">Pays <span class="pays">' + o.pays + ' c</span>, twice what such a piece is worth, whatever you hand in.</div>'
    + (fit.length ? '<div class="pickgrid" style="margin-top:10px">' + fit.map(c => '<button data-deliver="' + c.id + '" aria-label="Deliver ' + esc(c.name) + '">' + card(c, { short: true, price: 'DELIVER' }) + '</button>').join('') + '</div>'
      : '<div class="rbtns left"><button class="seg go" id="orderMake">MAKE ONE AT ' + R.stationOf(o.pattern).word + '</button></div>');
  $('orderBody').querySelectorAll('[data-deliver]').forEach(b => b.onclick = () => {
    const c = save.cards.find(x => x.id === b.dataset.deliver);
    if (c.worth * 2 > o.pays * 1.5 && !confirm('The ' + c.name + ' is worth ' + c.worth + ' c. The order pays ' + o.pays + ' c. Hand it over?')) return;
    if (Sh.deliver(save, b.dataset.deliver, Date.now())) { store(save); coins(); renderShop(); toast('<b>Order filled · +' + o.pays + ' c</b><br>' + esc(o.who)); }
  });
  if (!fit.length) $('orderMake').onclick = () => {
    rw = null; pat = o.pattern;
    if (o.metal) { const m = R.partOptions(pat)[0].opts.findIndex(x => x.id === o.metal); picks()[0] = m; }
    toPrepare();
  };
}

const HOW = { meet: 'MET THEM', hold: 'HELD THE PRICE', ask: 'ASKED MORE', counter: 'THEIR OFFER', order: 'SPECIAL ORDER' };
const howWord = t => TAGS[t] ? TAGS[t].word : HOW[t] || '';
function renderShop() {
  if (screen !== 'shop') return;
  renderCounter(); renderOrder();
  const hlv = R.levelOf((save.haggle || {}).xp || 0);
  $('tally').innerHTML = '<b>' + (save.sold || 0) + '</b> sold · <b>' + (save.earned || 0) + '</b> coins taken<br>Haggling <b>' + hlv.level + '</b>' + (hlv.need ? ' · ' + hlv.into + ' / ' + hlv.need : '') + ' · Renown <b>' + RENOWN[G.rung(save)].word + '</b>';
  const filled = save.shelf.filter(Boolean).length;
  $('shelfWord').textContent = filled + ' OF ' + save.slots + ' · CUSTOMERS BUY FROM HERE';
  $('slots2').innerHTML = save.shelf.map((e, i) => {
    if (!e) return '<button class="slot-empty" data-slot="' + i + '">EMPTY<br>' + (Sh.inBack(save).length ? 'TAP TO STOCK' : 'MAKE SOMETHING') + '</button>';
    const c = save.cards.find(x => x.id === e.id);
    return '<button data-slot="' + i + '" aria-label="' + esc(c.name) + ', ' + TAGS[e.tag].word + ' at ' + Sh.priceAt(c, e.tag) + ' coins">'
      + card(c, { short: true, price: Sh.priceAt(c, e.tag) + ' c<span class="tagword">' + TAGS[e.tag].word + '</span>' }) + '</button>';
  }).join('');
  $('slots2').querySelectorAll('button').forEach(b => b.onclick = () => slotOpen(+b.dataset.slot));
  renderShelfUps();
  const cost = Rm.shelfCost(save.room);
  $('buySlot').hidden = cost == null;
  if (cost != null) { $('buySlot').textContent = 'ANOTHER SHELF · TWO PLACES · ' + cost + ' COINS'; $('buySlot').disabled = save.coins < cost; }
  renderFurnish(); renderWall(); tabBadges();
  if (dio) dio.setShelf(shelfShown());
  const back = Sh.inBack(save);
  $('backWord').textContent = back.length + (back.length === 1 ? ' PIECE' : ' PIECES') + ' · NOT FOR SALE YET';
  $('back').innerHTML = back.length ? back.map(c => '<button data-id="' + c.id + '" aria-label="' + esc(c.name) + '">' + card(c, { short: true }) + '</button>').join('')
    : '<div class="empty">Nothing in the back. What you make at the forge comes here.</div>';
  $('back').querySelectorAll('button').forEach(b => b.onclick = () => backOpen(b.dataset.id));
  $('ledger').innerHTML = save.ledger.length ? save.ledger.slice(0, 12).map(e => '<li><span><span class="mood ' + e.mood + '">' + e.mood + '</span><b>' + esc(e.who) + '</b> · wants ' + Sh.wantWord(e.want) + '</span>'
    + (e.sold ? '<span class="amt">+' + e.sold.price + ' c</span>' : e.bought ? '<span class="amt no">−' + e.bought.price + ' c</span>' : '<span class="amt no">' + (e.order === 'posted' ? 'ORDER' : 'NO SALE') + '</span>') + '<span class="ln">' + (e.sold ? 'Bought the ' + esc(e.sold.name) + ' (' + howWord(e.sold.tag) + '). ' : '') + esc(e.line) + '</span></li>').join('')
    : '<li class="empty">No one yet. Customers come in every half a minute or so while the game is open.</li>';
  renderFloor();
}
// each shelf, and what making it better gives
function upgradeWord(it) {
  const next = SHELF_LEVELS[Rm.levelOf(it) + 1];
  return next && 'MAKE IT A ' + next.name.toUpperCase() + ' · ' + next.places + ' PLACES · ' + next.cost + ' c';
}
let shelfNote = '';
function doUpgrade(id) {
  const r = Rm.upgradeShelf(save, id);
  shelfNote = r.why ? 'Not made better: ' + r.why + '.' : 'It\'s a ' + SHELF_LEVELS[r.level].name.toLowerCase() + ' now: ' + r.places + ' places.';
  if (!r.why) { store(save); coins(); Snd.play('level'); if (dio) dio.setRoom(viewRoom(), save); }
  renderShop(); return r;
}
function renderShelfUps() {
  const shelves = save.room.items.filter(i => i.kind === 'shelf');
  $('shelfUps').innerHTML = shelves.map((it, n) => {
    const lv = SHELF_LEVELS[Rm.levelOf(it)], next = SHELF_LEVELS[Rm.levelOf(it) + 1];
    return '<div class="fi"><b>' + lv.name + ' ' + (n + 1) + ' · ' + lv.places + ' places</b><span>' + (next ? next.line : 'As fine as a shelf gets.') + '</span>'
      + (next ? '<button class="seg" data-upshelf="' + it.id + '"' + (save.coins < next.cost ? ' disabled' : '') + '>' + upgradeWord(it) + '</button>' : '') + '</div>';
  }).join('') + (shelfNote ? '<p class="note">' + esc(shelfNote) + '</p>' : '');
  $('shelfUps').querySelectorAll('[data-upshelf]').forEach(b => b.onclick = () => doUpgrade(b.dataset.upshelf));
}
$('buySlot').onclick = () => { const r = Rm.buy(save, 'shelf'); furnNote = r.why ? 'No shelf: ' + r.why + '.' : 'A new shelf: two more places.'; if (r.item) { store(save); coins(); if (dio) dio.setRoom(viewRoom(), save); } renderShop(); };
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
  openLook(card(c), acts(), false, c);
  $('lookActs').onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.tag) {
      if (!save.shelf[slot]) return;
      Sh.setTag(save, slot, b.dataset.tag); store(save); $('lookActs').innerHTML = acts(); $('lookActs').appendChild(shareBtn(c, $('lookActs')));
      $('lookActs').querySelector('[data-tag="' + b.dataset.tag + '"]').focus(); renderShop();
    } else if (b.id === 'takeDown') { Sh.takeDown(save, slot); store(save); $('look').hidden = true; renderShop(); }
  };
}
function backOpen(id) {
  const c = save.cards.find(x => x.id === id), free = save.shelf.findIndex(e => !e);
  const sv = Sh.salvageOf(c), cost = Sh.reworkCost(c), canRw = Sh.canRework(save, c) && Rm.owns(save, R.stationOf(c.pattern).id), haveRw = Sh.canMake(save.mats, cost);
  const toTier = TIERS[R.reworkTo(TIERS.findIndex(t => t.id === c.tier))];
  let acts = free >= 0 ? '<button class="seg go" id="putUp">PUT IT ON THE SHELF · FAIR ' + Sh.priceAt(c, 'fair') + ' c</button>' : '<p>The shelf is full. Take something down, or buy another shelf.</p>';
  acts += (save.wall || []).length < G.wallSlots(save) ? '<button class="seg" id="hangIt">HANG IT ON THE WALL</button>' : '';
  if (save.order && Sh.fills(save.order, c)) acts += '<button class="seg go" id="deliverIt">DELIVER TO ' + esc(save.order.who.toUpperCase()) + ' · ' + save.order.pays + ' c</button>';
  acts += '<div class="row2">'
    + (canRw ? '<button class="seg" id="reworkIt"' + (haveRw ? '' : ' disabled') + '>' + R.stationOf(c.pattern).again + ' · TO ' + toTier.name.toUpperCase() + ' · ' + cost.map(r => MATS[r.mat].name + ' × ' + r.n).join(', ') + '</button>' : '')
    + '<button class="seg" id="breakIt">BREAK IT DOWN · ' + (sv.length ? sv.map(r => MATS[r.mat].name + ' × ' + r.n).join(', ') : 'nothing worth keeping') + '</button></div>'
    + (canRw && !haveRw ? '<p>Back in the fire takes ' + cost.map(r => MATS[r.mat].name + ' × ' + r.n).join(', ') + '. You have ' + (save.mats[cost[0].mat] || 0) + '.</p>' : '');
  openLook(card(c), acts, false, c);
  if ($('hangIt')) $('hangIt').onclick = () => { if (G.hang(save, id)) { store(save); $('look').hidden = true; renderShop(); } };
  if (free >= 0) $('putUp').onclick = () => { Sh.place(save, id, free); store(save); $('look').hidden = true; renderShop(); };
  if ($('deliverIt')) $('deliverIt').onclick = () => { const o = save.order; if (Sh.deliver(save, id, Date.now())) { store(save); coins(); $('look').hidden = true; renderShop(); toast('<b>Order filled · +' + o.pays + ' c</b><br>' + esc(o.who)); } };
  if ($('reworkIt')) $('reworkIt').onclick = () => toRework(id);
  $('breakIt').onclick = () => {
    if (!confirm('Break down the ' + c.name + ' (worth ' + c.worth + ' c)? It gives ' + (sv.length ? sv.map(r => MATS[r.mat].name + ' × ' + r.n).join(', ') : 'nothing worth keeping') + '. It can\'t be undone.')) return;
    if (Sh.salvage(save, id)) { store(save); $('look').hidden = true; renderShop(); }
  };
}

// ---------- STAFF ----------
const hm = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + ' h ' + m + ' min' : m ? m + ' min' : s + ' s'; };
function toStaff() { clearTimers(); S = null; rescueCheck(); show('staff'); coins(); renderStaff(); tip('staff', $('staffList').closest('section')); }
let staffTick = 0;
function personHtml(p, hired) {
  const lv = R.levelOf(p.xp || 0), tr = St.traitOf(p);
  return '<div class="role">' + ROLES[p.role].word + '</div><div class="nm">' + esc(p.name) + '</div>'
    + '<div class="tr"><b>' + tr.word + '</b> · ' + tr.line + '</div>'
    + '<div class="kv2"><span>LEVEL <b>' + lv.level + '</b></span><span>WAGE <b>' + St.wageOf(p) + ' c</b> AN HOUR</span>'
    + (p.role === 'clerk' ? '<span>KEEPS <b>' + Math.round((1 - St.clerkTerms(p).rate) * 100) + ' %</b> AWAY</span>' : '') + (hired ? '' : '<span>TO HIRE <b>' + St.hireFee(p) + ' c</b></span>') + '</div>'
    + (hired ? '<div class="xp"><i style="width:' + (lv.need ? Math.round(lv.into / lv.need * 100) : 100) + '%"></i></div>' : '');
}
function renderStaff() {
  if (screen !== 'staff') return;
  const now = Date.now(), staff = save.staff || [];
  $('staffTally').innerHTML = 'Wages <b>' + St.wages(save) + ' c</b> an hour<br>Kept <b>' + St.awayCap(save) + ' h</b> while you\'re away';
  $('booksWord').textContent = staff.length ? staff.length + ' OF 2' : 'NO ONE YET';
  $('staffList').innerHTML = staff.length ? staff.map(p => {
    let status = '';
    if (save.unpaid && p.role === 'runner') status = '<div class="status bad">Wages behind: won\'t set out until they\'re paid.</div>';
    else if (p.role === 'clerk') status = '<div class="status">Minds the shop while you\'re at the forge (customers buy more readily) and keeps it while you\'re away.</div>';
    else if (p.trip) status = '<div class="status">' + ROUTES[p.trip.route].name + ' · back in <b data-back="' + p.trip.back + '">' + hm((p.trip.back - now) / 1000) + '</b></div>';
    else status = '<div class="status">Ready to go out. Send them on a road:</div><div class="routes">' + Object.entries(ROUTES).map(([id, r]) =>
      '<button class="seg" data-send="' + id + '"' + (save.coins < r.fee ? ' disabled' : '') + '><span>' + r.name + '</span><small>' + hm(St.tripHours(p, id) * 3600) + ' · ' + r.fee + ' c' + (r.rare ? ' · rare things' : '') + (r.tile ? ' · a found tile, maybe' : '') + '</small></button>').join('') + '</div>';
    return '<div class="person">' + personHtml(p, true) + status + '<div class="rbtns left"><button class="seg" data-letgo="' + p.id + '">LET THEM GO</button></div></div>';
  }).join('') : '<div class="empty">No one works here but you. A clerk keeps the shop while you\'re away; a runner goes out for materials. See who\'s <button class="linkish" data-tabjump="hire">looking for work</button>.</div>';
  const cands = St.candidates(save, hour()), mins = 60 - new Date().getMinutes();
  $('candsWord').textContent = 'NEW FACES IN ' + mins + ' MIN';
  $('cands').innerHTML = cands.length ? cands.map(c => {
    const has = staff.some(p => p.role === c.role), fee = St.hireFee(c);
    return '<div class="person">' + personHtml(c, false) + '<div class="tr">' + ROLES[c.role].line + '</div><div class="rbtns left"><button class="seg go" data-hire="' + c.id + '"' + (has || save.coins < fee ? ' disabled' : '') + '>HIRE · ' + fee + ' c</button></div>'
      + (has ? '<div class="status">You have a ' + ROLES[c.role].word.toLowerCase() + ' already.</div>' : '') + '</div>';
  }).join('') : '<div class="empty">No one else this hour.</div>';
  $('vStaff').querySelectorAll('[data-tabjump]').forEach(b => b.onclick = () => openTab('staff', b.dataset.tabjump));
  tabBadges();
  $('vStaff').querySelectorAll('[data-hire]').forEach(b => b.onclick = () => { const c = cands.find(x => x.id === b.dataset.hire); if (St.hire(save, c)) { store(save); coins(); renderStaff(); } });
  $('vStaff').querySelectorAll('[data-send]').forEach(b => b.onclick = () => { if (St.sendRunner(save, b.dataset.send, Date.now())) { store(save); coins(); renderStaff(); } });
  $('vStaff').querySelectorAll('[data-letgo]').forEach(b => b.onclick = () => {
    const p = staff.find(x => x.id === b.dataset.letgo);
    if (!confirm('Let ' + p.name + ' go?' + (p.trip ? ' They\'re on the road: what they bring back is lost.' : ''))) return;
    St.letGo(save, p.id); store(save); renderStaff();
  });
}

// ---------- WHILE YOU WERE AWAY ----------
function haulWords(t) {
  const parts = Object.entries(t.mats).map(([m, n]) => MATS[m].name + ' × ' + n);
  if (t.piece) parts.push('an old ' + t.piece.name);
  if (t.tile) parts.push('a found tile: ' + FOUND[t.tile].name);
  return parts.join(', ');
}
function awayHtml(a) {
  let h = '<div class="away"><div class="k">WHILE YOU WERE AWAY</div><h3>' + hm(a.elapsed) + '</h3>';
  if (a.capped) h += '<p>The staff keep the shop ' + hm(a.counted) + ' at most; the rest went unminded.</p>';
  if (a.sold.length) {
    h += '<p>' + esc(a.clerk) + ' sold <b>' + a.sold.length + '</b> piece' + (a.sold.length > 1 ? 's' : '') + ' for <b>' + a.coins + ' c</b>, keeping ' + a.cut + ' c.</p><ul>'
      + a.sold.slice(0, 8).map(e => '<li><span>' + esc(e.sold.name) + ' to ' + esc(e.who) + '</span><b>+' + e.sold.price + ' c</b></li>').join('') + '</ul>';
  } else if (St.clerkOf(save)) h += '<p>' + esc(St.clerkOf(save).name.split(' ')[0]) + ' kept the shop' + (a.missed ? '; ' + a.missed + ' came in and found nothing for them' : '') + '.</p>';
  else if (a.missed) h += '<p>No one minded the shop: ' + a.missed + ' customer' + (a.missed > 1 ? 's' : '') + ' came and went. A counter clerk sells while you\'re away (Staff).</p>';
  if (a.wages) h += '<p>Wages paid: <b>' + a.wages + ' c</b>.</p>';
  if (a.unpaid) h += '<p class="bad">The wages are behind. The clerk works on for the takings; the runner won\'t set out until they\'re paid.</p>';
  a.trips.forEach(t => { h += '<p>' + esc(t.who) + ' came back from ' + ROUTES[t.route].from + ' with ' + esc(haulWords(t)) + '.</p>'; });
  return h + '</div>';
}
function showAway(a) {
  if (!a) return;
  if (screen === 'work' || screen === 'prepare') {   // never take the keys from a working
    toast('<b>While you were away (' + hm(a.elapsed) + ')</b><br>' + (a.sold.length ? a.sold.length + ' sold, +' + a.coins + ' c' : 'nothing sold') + (a.trips.length ? ' · ' + a.trips.length + ' back from the road' : ''));
    return;
  }
  openLook(awayHtml(a), '', true);
}
// Back after a gap (a hidden tab, a sleeping phone, a page restored from the back button): the first frame finds lastSeen
// seconds behind. Read the save afresh (another tab may have played meanwhile), clear the counter, catch up.
function returning(nowMs) {
  const fresh = load();
  if (fresh.lastSeen && fresh.lastSeen > (save.lastSeen || 0)) { Object.keys(save).forEach(k => delete save[k]); Object.assign(save, fresh); R.convertSave(save); Sh.fixShelf(save); Rm.fixRoom(save); Sh.fixShelf(save); if (dio) dio.setRoom(viewRoom(), save); }
  save.queue = [];
  const a = St.catchUp(save, nowMs, rng);
  store(save); coins();
  if (screen === 'shop') renderShop(); else if (screen === 'staff') renderStaff(); else if (screen === 'home') toHome(); else if (screen === 'supp') renderSupp();
  showAway(a);
}
// on the way out, the time is written down
document.addEventListener('visibilitychange', () => { if (document.hidden) { save.lastSeen = Date.now(); store(save); } });
window.addEventListener('pagehide', () => { save.lastSeen = Date.now(); store(save); });

// ---------- SUPPLIERS ----------
let suppHour = null;
function toSupp() { clearTimers(); S = null; rescueCheck(); show('supp'); coins(); renderSupp(); tip('supp', $('supps')); }
function renderSupp() {
  if (screen !== 'supp') return;
  const h = hour(); suppHour = h;
  const mins = 60 - new Date().getMinutes();
  $('hourWord').innerHTML = 'Prices change on the hour · next in <b>' + mins + ' min</b>';
  $('supps').innerHTML = SUPPLIERS.map(sp => '<section data-group="supp" data-tab="' + sp.id + '" class="card supp"><h2><span>' + sp.kind + '</span><b>' + sp.name.toUpperCase() + '</b></h2><p class="line">' + sp.line + '</p>'
    + Sh.linesOf(sp, h).map(id => {
      const m = MATS[id], pr = Sh.priceOf(id, h), was = Sh.priceOf(id, h - 1);
      const tr = pr > was ? '<i class="up">▲</i>' : pr < was ? '<i class="down">▼</i>' : '';
      return '<div class="buyrow"><span><b class="' + (m.rare ? 'rare' : '') + '">' + m.name + (m.rare ? ' ✶' : '') + '</b><small>HAVE ' + (save.mats[id] || 0) + '</small></span>'
        + '<span class="pr">' + pr + ' c ' + tr + '</span>'
        + '<button class="seg" data-buy="' + id + '" data-n="1"' + (save.coins < pr ? ' disabled' : '') + '>BUY 1</button>'
        + '<button class="seg b5" data-buy="' + id + '" data-n="5"' + (save.coins < pr * 5 ? ' disabled' : '') + '>BUY 5</button></div>';
    }).join('') + '</section>').join('');
  openTab('supp', tabNow('supp') || 'yard');   // the sections are new: show the chosen one again
  $('supps').querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
    if (Sh.buy(save, b.dataset.buy, +b.dataset.n, hour())) { store(save); coins(); renderSupp(); const nb = $('supps').querySelector('[data-buy="' + b.dataset.buy + '"][data-n="' + b.dataset.n + '"]'); if (nb && !nb.disabled) nb.focus(); }
  });
}

// ---------- PREPARE ----------
function newWorking() {
  const n = R.slotsFor(lvl());
  save.chosen = save.chosen.filter(id => save.found.includes(id)).slice(0, n);
  S = R.newWorking({ patternId: pat, picks: benchPicks().slice(), level: lvl(), found: save.chosen.slice(), kit: G.kitOf(save), rework: rw ? { from: rw.from } : null }, rng);
}
function toPrepare() {
  clearTimers(); paused = false;
  if (rw && !rwCard()) rw = null;
  const p = PATTERNS[pat], l = levelFor(pat), opts = R.partOptions(pat);
  // a part that the trade hasn't opened yet falls back to the first
  if (!rw) save.picks[pat] = picks().map((k, i) => (opts[i].opts[k] && (opts[i].opts[k].level || 1) <= l.level) ? k : 0);
  newWorking(); show('prepare');
  $('prepK').textContent = stn().word + ' · ' + (rw ? stn().again : 'PREPARE');
  $('prepT').textContent = benchName();
  $('tradeWord').textContent = p.trade.toUpperCase() + ' · TRADE ' + l.level + (l.need ? ' · ' + l.into + ' / ' + l.need : '');
  $('makeIt').innerHTML = rw ? '<b>LEAVE IT</b>Keep it ' + TIERS[rw.from].name + '. Back to the shop.' : '<b>MAKE IT</b>At once, at the plain odds. It teaches nothing.';
  $('workIt').innerHTML = rw ? '<b>WORK IT AGAIN</b>The tiles turn face down and shuffle.' : '<b>WORK IT</b>The tiles turn face down and shuffle.';
  partSegs(); renderPrep();
  tip('prepare', document.querySelector('#vPrep .prep'));
}
function toRework(id) {
  const c = save.cards.find(x => x.id === id);
  if (!c || !Sh.canRework(save, c)) return;
  rw = { id, from: TIERS.findIndex(t => t.id === c.tier) }; pat = c.pattern;
  $('look').hidden = true; toPrepare();
}
function pieceKv() {
  const l = lvl(), o = R.odds(S);
  if (rw) {
    const to = TIERS[R.reworkTo(rw.from)].name;
    $('pieceKv').innerHTML = '<span>Now</span><b style="color:' + TIERC[rw.from] + '">' + TIERS[rw.from].name + '</b>'
      + '<span>To ' + to + '</span><b>fill the bar and quench: it goes up to ' + to + ', no roll. It keeps what it carries and takes one more.</b>'
      + '<span>The risk</span><b>a second crack after it takes drops it a tier' + (rw.from === 0 ? ' (a Common piece comes out flawed)' : '') + '</b>'
      + '<span>' + stn().meter.replace('THE ', '').replace(/^./, x => x) + '</span><b>' + stn().twist + ' The band now ' + S.band[0] + '–' + S.band[1] + '.</b>'
      + '<span>Walk away</span><b>the piece comes out as it was; the bars are spent</b>';
    return;
  }
  $('pieceKv').innerHTML = '<span>Plain odds</span><b><span style="color:var(--t-fine)">Fine ' + Math.round(o.f) + ' %</span> · <span style="color:var(--t-rare)">Rare ' + Math.round(o.r) + ' %</span></b>'
    + '<span>Worked</span><b>up to Fine 70 % · Rare 40 %</b>'
    + '<span>' + stn().meter.charAt(0) + stn().meter.slice(1).toLowerCase() + '</span><b>' + stn().twist + ' The band now ' + S.band[0] + '–' + S.band[1] + '.</b>'
    + '<span>The pick</span><b>' + (l >= 5 ? 'WHITE HEAT (8 in a row with no crack) or a TRUE' : 'WHITE HEAT or a TRUE · both open at trade 5') + '</b>'
    + '<span>A new tile</span><b>a Fine or better working with no crack, or WHITE HEAT</b>'
    + (l < 3 ? '<span>Learning</span><b>no cracks until trade 3; struck cold, a strike does nothing</b>' : '');
}
function partSegs() {
  const box = $('parts'); box.innerHTML = '';
  if (rw) {
    $('partsHead').textContent = 'THE PIECE\'S OWN';
    box.innerHTML = '<div class="found-lines">' + S.parts.map((o, i) => '<div><b>' + R.partOptions(pat)[i].part + '</b> · ' + o.name + '</div>').join('') + '</div>';
    $('partLine').innerHTML = S.parts.filter(o => o.line).map(o => '<div><b>' + o.name + '</b> · ' + o.line + '</div>').join('');
    return;
  }
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
      b.onclick = () => { ch[i] = k; store(save); newWorking(); $('prepT').textContent = (S.metal.adj || S.metal.name) + ' ' + PATTERNS[pat].name; partSegs(); renderPrep(); };
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
const rec = () => rw ? Sh.reworkCost(rwCard()) : Sh.recipe(pat, picks());
function renderTakes() {
  const r = rec(), h = hour(), sh = Sh.short(save.mats, r), ok = !sh.length;
  $('takesWord').textContent = ok ? 'IN THE STORE ROOM' : 'SHORT';
  $('takes').innerHTML = r.map(x => { const have = save.mats[x.mat] || 0; return '<li><b>' + MATS[x.mat].name + ' × ' + x.n + '</b><em class="' + (have >= x.n ? 'ok' : 'short') + '">have ' + have + '</em></li>'; }).join('');
  $('makeIt').disabled = !ok && !rw; $('workIt').disabled = !ok;
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
  $('workT').textContent = benchName();
  $('cShape').textContent = rw ? '1 · TO ' + TIERS[R.reworkTo(rw.from)].name.toUpperCase() : '1 · SHAPE';
  setFireBtn();
  const st = stn();
  $('workK').textContent = st.word + ' · WORK IT';
  $('cDone').textContent = '3 · ' + st.close;
  $('bStrike').innerHTML = st.strike + '<small>SPACE · TAP THE STAGE</small>';
  popLabel({ label: st.heatIt, gain: st.fire, why: 'then ' + st.strike.toLowerCase() + ' in the ' + st.band_, colour: '#e8c464' });
  render();
  tip(st.id === 'forge' ? 'work' : 'work-' + st.id, null, $('vWork'));
}
function setFireBtn() {
  $('bFire').innerHTML = S.station.stoke ? 'STOKE<small>R · RAISES THE BOIL · RESHUFFLES</small>' : (S.inFire ? S.station.out : S.station.fire) + '<small>' + (S.inFire ? 'R' : 'R · RESHUFFLES THE STRIP') + '</small>';
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
  if (S.strikes >= 3) document.querySelectorAll('#vWork .hintcard').forEach(x => x.remove());
  const now = performance.now();
  if (now - lastStrike < 420) return;
  lastStrike = now;
  const ev = R.strike(S);
  if (!ev) return;
  const sid = S.station.id, soft = { stretcher: ['stitch', 'tear'], bowbench: ['bend', 'split'], kettle: ['stir', 'boil'], glass: ['blow', 'shatter'] }[sid];
  Snd.play(soft ? (ev.dead ? 'dead' : ev.k === 'CRACK' ? soft[1] : ev.k === 'TRUE' || ev.k === 'FOUND' ? ev.k : soft[0]) : ev.dead ? 'dead' : ev.k);
  setFireBtn(); playPops(ev.pops);
  view.flash = 1; view.sparks.push(...sparksFor(ev.k, ev.dead));
  render();
  if (ev.drop) { S.done = true; later(() => finish('dropped'), 700); }
}
function toggleFire() {
  if (screen !== 'work' || !S || S.done || paused) return;
  const r = R.toggleFire(S);
  if (r && r.stoked) Snd.play('stoke');
  else if (S.inFire) Snd.play({ stretcher: 'soak', bowbench: 'steam' }[S.station.id] || 'fire');
  if (r && r.shuffled) popLabel({ label: 'SHUFFLED', gain: 'BACK IN THE FIRE · EVERY TILE RETURNS', size: 'bigpop', colour: '#e8c464' });
  setFireBtn(); render();
}
function quench() {
  if (screen !== 'work' || !S || S.done || paused) return;
  if (S.shape < 100) { popLabel({ label: 'NOT YET', gain: 'FILL THE SHAPE FIRST', size: 'bad', colour: '#8e9bb0' }); return; }
  Snd.play({ stretcher: 'set', bowbench: 'twang', kettle: 'set', glass: 'ring' }[S.station.id] || 'quench'); finish('quench');
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
  $('barLabel').textContent = shaping ? (rw ? 'TO ' + TIERS[R.reworkTo(rw.from)].name.toUpperCase() : 'SHAPE') : 'WORKED';
  $('barVal').textContent = shaping ? Math.round(S.shape) + ' %' : '+' + Math.round(S.worked) + ' %';
  $('bar').classList.toggle('worked', !shaping);
  $('barFill').style.width = (shaping ? S.shape : Math.min(100, S.worked * 2)) + '%';
  $('bar').querySelectorAll('.notch').forEach(n => n.remove());
  if (shaping) S.notches.forEach(p => { const n = document.createElement('span'); n.className = 'notch'; n.style.left = p + '%'; $('bar').appendChild(n); });
  const o = R.odds(S);
  $('oCommon').textContent = Math.round(o.c); $('oFine').textContent = Math.round(o.f); $('oRare').textContent = Math.round(o.r); $('oCracks').textContent = S.cracks;
  $('flags').textContent = [S.twin ? 'TWIN READY' : '', S.warden ? 'WARDEN READY' : '', S.frost ? 'FROST SIDE' : ''].filter(Boolean).join(' · ');
  $('bQuench').disabled = shaping || S.done;
  $('bQuench').innerHTML = S.station.close + '<small>' + (shaping ? (rw ? 'ONCE IT TAKES' : 'ONCE IT\'S SHAPED') : 'Q · WHENEVER YOU CHOOSE') + '</small>';
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
    const st = S.station, wet = st.wetTear, Verb = st.strike.charAt(0) + st.strike.slice(1).toLowerCase(), verb = st.strike.toLowerCase();
    if (S.inFire) h = S.meter >= S.over ? '<i>Past white.</i> Take it out before it scales.' : wet && S.meter > S.band[1] ? '<i>Soaked.</i> Take it out and let it dry back into the band, or a stitch will tear.' : S.meter >= S.band[0] ? '<i>In the band.</i> ' + Verb + ': it comes out on the first ' + verb + '.' : (wet ? 'Soaking…' : 'Heating…') + ' wait for the ' + st.band_ + '.';
    else if (S.meter < S.band[0]) h = (wet ? 'Too dry: <i>' : st.noTake ? 'Too cool: <i>' : st.shatter ? 'Too stiff: <i>' : 'Below the band: <i>') + st.fire + '</i> (every tile returns).';
    else if (st.boilOver && S.meter > S.band[1]) h = '<i>Rolling.</i> Let it settle: a stir now boils over.';
    else if (st.sag && S.meter > S.band[1]) h = '<i>Running.</i> Too soft: a blow now sags. Let it cool a moment.';
    else if (wet && S.meter > S.band[1]) h = '<i>Too wet.</i> Let it dry a moment: a stitch now will tear.';
    else if (R.acrossGrain(S)) h = '<i>Across the grain.</i> Wait for it to turn: a bend now does nothing.';
    else h = S.shape < 100 ? '<i>In the band.</i> ' + Verb + (wet ? '. It dries as you work.' : st.stoke ? '. It settles by itself: STOKE when it cools.' : '. It cools while you wait.') : '<i>It\'s made.</i> Each ' + verb + ' pushes it. Read what\'s left face down, then ' + st.close + '.';
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
    const two = R.rollAffixes(pat, 2, rng, rw ? R.affixIds(rwCard().affixes) : []);
    $('rDone').hidden = true; $('rPick').hidden = false;
    $('rPickWhy').textContent = (res.whiteHeat ? 'WHITE HEAT' : 'A TRUE') + ' earned it. It ' + (res.rework ? 'took: now ' : 'came out ') + TIERS[res.tier].name + '.';
    $('rPicks').innerHTML = two.map((a, i) => '<button data-i="' + i + '"><b>' + a[0] + '</b>' + a[1] + '</button>').join('');
    $('rPicks').querySelectorAll('button').forEach(b => b.onclick = () => complete(res, two[+b.dataset.i]));
    $('rPicks').querySelector('button').focus({ preventScroll: true }); $('result').scrollTop = 0;
  } else complete(res, null);
}
function complete(res, picked) {
  const before = levelFor(pat);
  let piece;
  const yields = R.yieldOf(pat, res.tier);
  if (yields) {   // the glass's bottles: into the store room, no card
    save.mats[yields.mat] = (save.mats[yields.mat] || 0) + yields.n; save.made++;
    piece = { name: yields.n + ' ' + MATS[yields.mat].name.toLowerCase() + 's', tier: TIERS[res.tier].id, worth: 0, id: null };
  } else if (res.rework) {   // the same piece, out of the fire: in the back where it was
    const old = rwCard(), i = save.cards.indexOf(old);
    piece = R.remakePiece({ card: old, res, picked, rng, now: Date.now() });
    save.cards[i] = piece; rw = null;
  } else {
    piece = R.makePiece({ patternId: pat, picks: picks(), result: res, picked, maker: save.maker, rng, now: Date.now() });
    save.cards.unshift(piece); save.made++;
  }
  const xp = R.xpFor(res);
  const tr = save.trades[pat] || (save.trades[pat] = { xp: 0 }); tr.xp += xp;
  const after = levelFor(pat), p = PATTERNS[pat];
  $('rPick').hidden = true; $('rDone').hidden = false;
  $('rCard').innerHTML = yields ? '<div class="yield"><div class="tier" style="color:' + TIERC[res.tier] + '">' + TIERS[res.tier].name.toUpperCase() + ' BLOWING</div><div class="cd-art">' + ART.draught('#cfe8e8') + '</div><h3>' + yields.n + ' bottles</h3><p>Into the store room for the kettle. You have ' + save.mats[yields.mat] + '.</p></div>' : card(piece);
  $('rLine').innerHTML = res.rework ? (res.dropped ? 'A second crack after it took. It came out ' + TIERS[res.tier].name + (res.flawed ? ', flawed.' : '.') : 'It took. ' + TIERS[res.from].name + ' to ' + TIERS[res.tier].name + '.')
    : res.instant ? 'Made at once at the plain odds: Fine ' + res.odds.f + ' % · Rare ' + res.odds.r + ' %.'
    : res.dropped ? (res.flawed ? 'A second crack after it was made. It holds together, flawed, and is worth less.' : 'A second crack after it was made dropped it a tier.')
    : 'WORKED +' + res.worked + ' % · it had Fine ' + Math.round(res.odds.f) + ' % · Rare ' + Math.round(res.odds.r) + ' %';
  $('rWhy').textContent = res.instant ? 'No working, no pick, no found tile, no practice.'
    : (res.cracks ? res.cracks + ' crack' + (res.cracks > 1 ? 's' : '') : 'No cracks') + ' · ' + res.strikes + ' ' + R.stationOf(pat).made[0] + (res.strikes === 1 ? '' : (R.stationOf(pat).made[0] === 'stitch' ? 'es' : 's')) + ' · ' + res.heats + ' ' + R.stationOf(pat).made[1] + (res.heats > 1 ? 's' : '');
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
    if (after.level > before.level) Snd.play('level');
    tEl.innerHTML = '<div><b>' + (after.level > before.level ? p.trade.toUpperCase() + ' · NOW TRADE ' + after.level : 'PRACTICE · ' + p.trade.toUpperCase()) + '</b><span>+' + xp + ' practice · trade ' + after.level
      + (after.need ? ' · ' + after.into + ' of ' + after.need + ' to the next' : ' · mastered') + '.' + opened + '</span></div>';
  }
  // a successful working turns up a found tile
  const missing = Object.keys(FOUND).filter(id => !save.found.includes(id));
  const gEl = $('rGift'); gEl.hidden = true; gEl.className = 'gift';
  if (res.clean && missing.length) {
    const id = missing[Math.floor(rng() * missing.length)];
    save.found.push(id); fresh = id; Snd.play('chime');
    gEl.innerHTML = '<div class="gt">' + bagLook(id).face + '</div><div><b>A NEW FOUND TILE · FOR A ' + (res.cracks === 0 ? 'CLEAN' : 'WHITE-HOT') + ' WORKING</b><strong>' + FOUND[id].name + '</strong><span>'
      + FOUND[id].line + '. In your bag now (' + save.found.length + ' of ' + Object.keys(FOUND).length + ').</span></div>';
    gEl.hidden = false;
  }
  const free = yields ? -1 : save.shelf.findIndex(e => !e);
  $('rShelf').hidden = free < 0;
  $('rShelf').textContent = 'ON THE SHELF · ' + Sh.priceAt(piece, 'fair') + ' c';
  $('rShelf').onclick = () => { Sh.place(save, piece.id, free); store(save); toShop(); };
  if (!store(save)) $('rWhy').textContent += ' · This browser would not save it.';
  const sb = $('rDone').querySelector('.rbtns'); sb.querySelectorAll('.sharebtn').forEach(x => x.remove());
  if (!yields) { const shb = shareBtn(piece, $('rDone')); shb.classList.add('sharebtn'); sb.appendChild(shb); }
  $('rAgain').focus({ preventScroll: true }); $('result').scrollTop = 0;
  if (!res.rework) tip('result', $('rDone').querySelector('.rbtns'));
}
$('rAgain').onclick = () => { rw = null; toPrepare(); };
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
let lastT = performance.now(), lastStore = 0, dioSig = '', lastQ = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  // the shop's clock: only while this page is in front (a hidden tab gets no frames, so no time passes)
  // present: at the counter (the shop screen); customers queue to be served, sellers come in
  const nowMs = Date.now();
  if (save.lastSeen && nowMs - save.lastSeen > 3000) returning(nowMs);
  const present = screen === 'shop' && !document.hidden;
  const clerk = St.clerkOf(save), clerkOn = clerk && !save.unpaid ? St.clerkTerms(clerk) : null;
  const visits = Sh.shopStep(save, dt, rng, nowMs, present, clerkOn);
  visits.forEach(e => { if (e.by && e.sold && clerk) St.gain(clerk, 1); });
  const paid = St.payWages(save, dt);
  if (paid) coins();
  const back = St.resolveTrips(save, nowMs, rng);
  back.forEach(t => toast('<b>' + esc(t.who) + ' is back</b><br>' + esc(haulWords(t))));
  if (back.length) { store(save); if (screen === 'staff') renderStaff(); }
  save.lastSeen = nowMs;
  if (nowMs - lastStore > 5000) { lastStore = nowMs; store(save); }
  if (screen === 'staff' && nowMs - staffTick > 1000) { staffTick = nowMs; document.querySelectorAll('#staffList [data-back]').forEach(b => { b.textContent = hm((+b.dataset.back - nowMs) / 1000); }); }
  const sig = counterSig();
  if (visits.length || sig !== lastSig) {
    if (visits.length || save.queue.length) store(save);
    visits.forEach(e => {
      if (e.sold) { coins(); Snd.play('coin'); if (dio && screen === 'shop') dio.sold(e); if (screen !== 'shop') { toast('<b>Sold: ' + esc(e.sold.name) + ' · +' + e.sold.price + ' c</b><br>to ' + esc(e.who)); $('navSold').hidden = false; } }
      if (e.order === 'posted' && screen !== 'shop') { toast('<b>A special order</b><br>' + esc(e.who) + ': ' + esc(Sh.orderWord(save.order)) + '.'); $('navSold').hidden = false; }
    });
    if (screen === 'shop') renderShop(); else tabBadges();
  } else if (screen === 'shop' && floorShown && save.ledger[0] && Date.now() - save.ledger[0].at > 30000) renderFloor();
  if (screen === 'shop' && save.queue.length > lastQ) Snd.play('bell');
  lastQ = save.queue.length;
  if (screen === 'shop') { tickCounter(); if (dio) { if (sig !== dioSig) { dioSig = sig; dio.setQueue(save.queue); } visits.forEach(e => { if (!e.served && !e.by && !e.sold) dio.walkIn(e); }); dio.tick(); } }
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
$('makeIt').onclick = () => { if (rw) { rw = null; toShop(); } else if (spend()) finish('instant'); };
$('bHome').onclick = () => { if (rw) { rw = null; toShop(); } else toHome(); };
$('bLeave').onclick = () => {
  if (S && !S.done && !confirm(rw ? 'Walk away? The piece comes out as it was, and the bars are spent.' : 'Walk away from this working? The materials are spent.')) return;
  if (rw) { rw = null; toShop(); } else toPrepare();
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

// for testing: open the page with ?debug to reach the save from the console
if (new URLSearchParams(location.search).has('debug')) window.forge = { save, Sh, R, St, renderShop, toShop, toStaff, showAway, dio: () => dio, store: () => store(save), wipe: () => { save.v = 0; store(save); location.reload(); } };

toHome();
// a card shared by link: shown view only, never added to this save; the away summary waits for it to close
const shared = location.hash.startsWith('#card=') ? decodeCard(location.hash.slice(6)) : null;
if (location.hash.startsWith('#card=')) history.replaceState(null, '', location.pathname + location.search);
if (shared) {
  openLook('<div class="sharedhead"><div class="k">A PIECE SHARED WITH YOU</div><p>Made by ' + esc(shared.maker || 'a maker') + ' at their forge.</p></div>' + card(shared),
    '<p>Make your own at the forge.</p>');
  $('lookClose').textContent = 'TO MY FORGE';
  const away = awaySum, close = $('lookClose').onclick;
  $('lookClose').onclick = () => { $('look').hidden = true; $('lookClose').textContent = 'CLOSE'; $('lookClose').onclick = close; showAway(away); };
} else if (location.hash) history.replaceState(null, '', location.pathname + location.search);
if (!shared) showAway(awaySum);
awaySum = null;
requestAnimationFrame(frame);
