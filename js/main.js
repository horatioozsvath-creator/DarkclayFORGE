// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// DarkclayFORGE. The screens: THE FORGE (home), PREPARE, THE WORKING, THE RESULT; THE SHOP and SUPPLIERS.
import { KINDS, KC, TIERS, APPRENTICE, LEGACY, TRAITS, FORGE, STATIONS, FORGED_PARTS, PATTERNS, FOUND, MATS, SUPPLIERS, TAGS, HAGGLE, PATIENCE, ROLES, ROUTES, FURNITURE, SHELF_LEVELS, OLD_BLOOD, STORIES, BRANCH, RELICS, RELIC_WORK, HALL, MYTHICS, TRAIL, MYTHIC_WORK, PART_WORK, ROOM_SIZES, TOOLS, PERKS, RENOWN, NINE, WEAR, THIEVES, GEAR, MONSTERS, LIVING, TRY_ROLES, TRY_LINE } from './data.js?v=63';
import * as R from './rules.js?v=63';
import * as Sh from './shop.js?v=63';
import * as St from './staff.js?v=63';
import * as Rm from './room.js?v=63';
import * as G from './growth.js?v=63';
import { decodeCard, linkFor, packLink, unpackLink } from './share.js?v=63';
import * as Snd from './sound.js?v=63';
import * as CV from './counter.js?v=63';
import * as Town from './town.js?v=63';
import * as V from './visit.js?v=63';
import * as Br from './branch.js?v=63';
import * as Bank from './bank.js?v=63';
import * as Wear from './wear.js?v=63';
import * as Th from './thieves.js?v=63';
import * as Run from './runner.js?v=63';
import * as Src from './sources.js?v=63';
import * as Mon from './monsters.js?v=63';
import * as Liv from './living.js?v=63';
import * as Hl from './hall.js?v=63';
import * as Trail from './trail.js?v=63';
import * as Disc from './discover.js?v=63';
import { ICONS, emblem, watch } from './icons.js?v=63';
import { drawFlyer, flyerBlob } from './flyer.js?v=63';
import * as Ap from './apprentice.js?v=63';
import * as Leg from './legacy.js?v=63';
import { lookOf, bagLook, unknownLook } from './tiles.js?v=63';
import { card, ART } from './card.js?v=63';
import { paint, sparksFor, LAYOUTS } from './stage.js?v=63';
import { load, store as storeRaw, toCode, fromCode, SLOTS, activeSlot, setActiveSlot, peekSlots, clearSlot } from './save.js?v=63';
// the release: shown on the title; version.json on the site says the newest, so an old page knows to refresh
const VERSION = 63;
// where the game is meant to be played: anywhere else, a banner says it's a copy and where the real one is
const OFFICIAL = { hosts: ['horatioozsvath-creator.github.io', 'localhost', '127.0.0.1', '[::1]', ''], url: 'https://horatioozsvath-creator.github.io/DarkclayZERO_FORGE/' };
// once a loaded save is in storage, nothing writes this game back over it before the page reloads
let replacing = false;
const store = s => replacing ? false : storeRaw(s);

const $ = id => document.getElementById(id);
const rng = Math.random;
const save = load();
Town.refreshTown(save, Date.now());
R.convertSave(save); Sh.fixShelf(save); Rm.fixRoom(save); Sh.fixShelf(save); G.fixWall(save);
// a new game started from the title with the gentler Reach chosen (or not); a save from before the threats gets a week's grace
try { const g = sessionStorage.getItem('darkclayforge.newGentle'); if (g != null) { sessionStorage.removeItem('darkclayforge.newGentle'); if (!save.made && save.threatsFrom == null) { save.gentle = g === '1'; save.threatsFrom = Date.now(); } } } catch (e) { /* none */ }
Bank.fixThreats(save, Date.now());
save.queue = [];   // whoever was at the counter when the page closed has gone
// the first shop's catch-up (staff.js), then the second shop's keeper over the same time
function catchUpAll(nowMs) {
  const from = save.lastSeen; let a = St.catchUp(save, nowMs, rng);
  if (a && save.branch) a.branch = Br.away(save, from, nowMs, rng, St.awayCap(save));
  // the night: a gang about may have tried the shop
  const th = Th.night(save, from, nowMs, rng, a ? a.coins : 0);
  Mon.plan(save, from, rng); const mn = Mon.strike(save, nowMs, rng); Mon.tidy(save, nowMs);
  if (mn) { a = a || { elapsed: (nowMs - from) / 1000, counted: 0, capped: false, sold: [], coins: 0, cut: 0, missed: 0, wages: 0, trips: [], unpaid: false }; a.monster = mn; }
  if (th) { a = a || { elapsed: (nowMs - from) / 1000, counted: 0, capped: false, sold: [], coins: 0, cut: 0, missed: 0, wages: 0, trips: [], unpaid: false }; a.thieves = th; }
  return a;
}
let awaySum = catchUpAll(Date.now());   // the shops while the page was closed
store(save);
const phoneQ = window.matchMedia('(max-width: 600px)');
const TIERC = ['var(--t-common)', 'var(--t-fine)', 'var(--t-rare)', 'var(--t-oldblood)', 'var(--t-relic)', 'var(--t-mythic)'];

let screen = 'home';       // home | shop | supp | prepare | work
let pat = 'falchion';      // the pattern on the bench
let S = null;              // the working
let rw = null;             // back in the fire: { id, from } of the piece on the anvil, or null for a new piece
let master = false;        // a master's brew chosen at the kettle (rules.js masterBrewGate)
let part = null;           // a part of the Nine being worked: { mythic, i } (trail.js partGate)
let paused = false, lastStrike = 0, fresh = null, prevOdds = null, prevWorth = null;
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
const HUBS = ['home', 'shop', 'supp', 'staff', 'branch', 'bank'];
const hour = () => Sh.hourOf(Date.now());
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function show(which) {
  screen = which; Snd.music(MUSIC_OF[which]);
  $('nav').hidden = !HUBS.includes(which);
  document.querySelectorAll('#nav [data-go]').forEach(b => b.dataset.go === which ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  $('vHome').hidden = which !== 'home';
  $('vShop').hidden = which !== 'shop';
  $('vSupp').hidden = which !== 'supp';
  $('vStaff').hidden = which !== 'staff';
  $('vBank').hidden = which !== 'bank';
  $('vVisit').hidden = which !== 'visit';
  $('vBranch').hidden = which !== 'branch';
  $('navBranch').hidden = !save.branch;
  $('screen').hidden = HUBS.includes(which) || which === 'visit';
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
const MUSIC_OF = { home: 'forge', prepare: 'forge', work: 'forge', shop: 'shop', supp: 'shop', staff: 'shop', visit: 'shop', branch: 'shop', bank: 'shop' };
function musicLabel() { $('musicBtn').innerHTML = ICONS.music + (Snd.isMusicOn() ? 'ON' : 'OFF'); $('musicBtn').setAttribute('aria-pressed', String(Snd.isMusicOn())); }
$('musicBtn').onclick = () => { Snd.setMusicOn(!Snd.isMusicOn()); musicLabel(); };
function muteLabel() { $('muteBtn').innerHTML = ICONS.sound + (Snd.isMuted() ? 'OFF' : 'ON'); $('muteBtn').setAttribute('aria-pressed', String(!Snd.isMuted())); }
$('muteBtn').onclick = () => { Snd.setMuted(!Snd.isMuted()); muteLabel(); Snd.play('coin'); };
muteLabel(); musicLabel();
const go = where => where === 'home' ? toHome() : where === 'shop' ? toShop() : where === 'staff' ? toStaff() : where === 'bank' ? toBank() : where === 'branch' ? toBranch() : toSupp();
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
  if (group === 'forge' && tab === 'book' && typeof save !== 'undefined' && save) { Disc.bookOf(save).seen = Date.now(); store(save); tabBadges(); }
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
  { const n = Disc.newClues(save); $('tabBook').hidden = !n; $('tabBook').textContent = n; }
  const pts = G.pointsLeft(save);
  $('tabSkills').hidden = !pts; $('tabSkills').textContent = pts;
  const fresh = save.ledger.filter(e => e.at > seenLedger && e.sold).length;
  const onLedger = !$('vShop').hidden && $('tabLedger').closest('[data-tabbtn]').getAttribute('aria-selected') === 'true';
  if (onLedger) seenLedger = (save.ledger[0] || {}).at || seenLedger;
  $('tabLedger').hidden = !fresh || onLedger; $('tabLedger').textContent = fresh;
  const ready = St.readyRunners(save, Date.now()).length;   // runners home and waiting to be sent out
  $('tabBooks').hidden = !ready; $('tabBooks').textContent = ready;
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
  clearTimers(); S = null; rescueCheck(); show('home'); coins(); backupReminder();
  $('maker').value = save.maker;
  const patBtn = ([id, p]) => {
    const l = levelFor(id), n = save.cards.filter(c => c.pattern === id).length;
    const d = Town.demandOf(save.town, id);
    return '<button class="pat" data-p="' + id + '"><div class="art">' + ART[p.art](p.station ? '#a07850' : '#c9c5be')
      + (d ? '<span class="demand ' + (d > 0 ? 'hot' : 'cold') + '">' + (d > 0 ? 'IN DEMAND' : 'OUT OF FAVOUR') + '</span>' : '') + '</div><b>' + p.name + '</b>'
      + '<div class="lv">TRADE ' + l.level + '<span>' + (l.need ? l.into + ' / ' + l.need : 'MASTERED') + '</span></div>'
      + '<div class="xp"><i style="width:' + (l.need ? Math.round(l.into / l.need * 100) : 100) + '%"></i></div>'
      + '<div class="lv"><span>' + n + ' MADE</span></div></button>';
  };
  $('patterns').innerHTML = Object.values(STATIONS).map(st => {
    const pats = Object.entries(PATTERNS).filter(([id, p]) => (p.station || 'forge') === st.id && Sh.knows(save, id));
    const head = '<h3 class="stationhead">' + st.word + '</h3>';
    // parts forged for the other stations (milestones 30, 33): under the forge for each station you have, and under the station that uses them
    const fps = Object.entries(FORGED_PARTS).filter(([, f]) => st.id === 'forge' ? Rm.owns(save, f.for) : f.for === st.id);
    const parts = fps.length ? '<div class="setup"><b>' + (st.id === 'forge' ? 'For the other stations' : 'Parts from the forge') + '</b><span>' + (st.id === 'forge' ? 'Parts the other stations need: ' + fps.map(([, f]) => f.line).join('; ') : fps.map(([, f]) => f.line).join('; ').replace(/^./, c => c.toUpperCase())) + '. Forged at once from iron (no working), or bought dearer.</span><div class="rbtns left">'
      + fps.map(([id, f]) => '<button class="seg" data-fp="' + id + '"' + ((save.mats.iron || 0) < f.from.iron ? ' disabled' : '') + '>FORGE ' + f.name.replace(/^An? /, '').toUpperCase() + ' · ' + f.from.iron + ' IRON → ' + f.makes + ' · HAVE ' + (save.mats[id] || 0) + '</button>').join('') + '</div></div>' : '';
    // TRY SOMETHING NEW (milestone 31): at a station with patterns still to find
    const left = TRY_ROLES[st.id] ? Disc.toFind(save, st.id).length : 0;
    const tryNew = left ? '<div class="setup trynew"><b>Try something new</b><span>' + (left === 1 ? 'One pattern' : left + ' patterns') + ' at the ' + st.name.toLowerCase() + ' still to find. ' + TRY_LINE[st.id] + ' and see what comes of it: the materials are spent, and every try teaches something.</span><div class="rbtns left"><button class="seg go" data-try="' + st.id + '">TRY SOMETHING NEW</button><button class="seg" data-tobook="1">THE MAKER\'S BOOK</button></div></div>' : '';
    if (Rm.owns(save, st.id)) return head + pats.map(patBtn).join('') + tryNew + parts;
    return head + '<div class="setup"><b>Set up a ' + st.name.toLowerCase() + '</b><span>' + pats.map(([, p]) => p.trade.toLowerCase()).join(', ').replace(/^./, x => x.toUpperCase()) + ', from hides. ' + st.twist + '</span>'
      + '<button class="seg go" data-station="' + st.id + '"' + (save.coins < st.cost ? ' disabled' : '') + '>SET IT UP · ' + st.cost + ' c</button><span id="stNote-' + st.id + '"></span></div>';
  }).join('');
  $('patterns').querySelectorAll('.pat').forEach(b => b.onclick = () => { rw = null; part = null; if (pat !== b.dataset.p) master = false; pat = b.dataset.p; toPrepare(); });
  $('patterns').querySelectorAll('[data-try]').forEach(b => b.onclick = () => tryOpen(b.dataset.try));
  $('patterns').querySelectorAll('[data-tobook]').forEach(b => b.onclick = () => openTab('forge', 'book'));
  renderBook();
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
  $('store').innerHTML = have.length ? have.map(([id, n]) => '<button data-mat="' + id + '">' + MATS[id].name + '<b>' + n + '</b></button>').join('')
    : '<span class="empty">Nothing in the store room. The suppliers sell bars, hides and hafts.</span>';
  $('store').querySelectorAll('[data-mat]').forEach(b => b.onclick = () => matOpen(b.dataset.mat));
  const back = Sh.inBack(save).length;
  $('toBack').textContent = back + ' IN THE BACK · TO THE SHOP';
}
// where a material comes from, and what it goes into
function matOpen(mat) {
  const m = MATS[mat], h = hour(), uses = Object.entries(PATTERNS).filter(([id, p]) => (p.batch && mat === 'bottle') || R.partOptions(id).some(g => g.opts.some(o => (o.mat || o.id) === mat))).map(([, p]) => p.name);
  openLook('<div class="matlook"><h3>' + m.name + (m.rare ? ' ✶' : '') + '</h3><p class="note">You have <b>' + (save.mats[mat] || 0) + '</b>.' + (Sh.sells(mat, h, save) ? ' On sale this hour at <b>' + Sh.priceOf(mat, h) + ' c</b>.' : '') + '</p>'
    + '<h4>WHERE IT COMES FROM</h4><ul>' + Src.sourcesOf(mat).map(x => '<li>' + x.word + '</li>').join('') + '</ul>'
    + (uses.length ? '<h4>WHAT IT GOES INTO</h4><p>' + uses.join(', ') + '</p>' : '') + '</div>');
}
// ---------- TRY SOMETHING NEW and THE MAKER'S BOOK (milestone 31) ----------
let tryPicks = {}, tryOut = null;
function tryOpen(st, keep) {
  if (!keep) { tryPicks = {}; tryOut = null; }
  const roles = TRY_ROLES[st], have = Object.entries(save.mats).filter(([, n]) => n > 0);
  const sel = r => '<label class="tryrole"><span>' + r.word + '</span><select data-role="' + r.id + '"><option value="">' + (r.pick || 'choose') + '</option>'
    + have.filter(([m]) => Disc.fitsRole(st, r.id, m)).map(([m, n]) => '<option value="' + m + '"' + (tryPicks[r.id] === m ? ' selected' : '') + '>' + MATS[m].name + ' (' + n + ')</option>').join('') + '</select></label>';
  const cost = Disc.tryCost(tryPicks), ready = roles.every(r => tryPicks[r.id]);
  const left = Disc.toFind(save, st);
  let out = '';
  if (tryOut) {
    const o = tryOut, P = o.pattern && PATTERNS[o.pattern];
    if (o.result === 'found') out = '<div class="tryres found"><b>FOUND: THE ' + P.name.toUpperCase() + '</b><p>It\'s in your patterns now, at trade 1, and the try left you a Common one (in the back).</p>' + card(o.card) + '</div>';
    else if (o.result === 'close' || (o.result === 'tried' && o.clues.length)) out = '<div class="tryres close"><div class="bookpat mini"><div class="art">' + ART[PATTERNS[o.pattern].art]('#1c1612') + '<i>?</i></div></div><b>' + (o.result === 'tried' ? 'YOU TRIED THIS ONCE: WHAT IT TAUGHT YOU' : 'CLOSE: ONE OF THE PATTERNS STILL TO FIND') + '</b><ul>' + o.clues.map(c => '<li class="' + c.g + '"><em>' + c.role + '</em> ' + esc(c.line) + '</li>').join('') + '</ul></div>';
    else if (o.result === 'nothing' || o.result === 'tried') out = '<div class="tryres"><b>NOTHING CAME OF IT</b><p>' + (o.result === 'tried' ? 'You tried this once: it\'s in the book. Nothing was spent this time.' : 'The materials are spent. It\'s in the book, so you won\'t pay for it twice. Try things nearer to what customers ask for.') + '</p></div>';
    else if (o.result === 'notyet') out = '<div class="tryres close"><b>YOU HAVEN\'T THE HAND FOR IT YET</b><p>That\'s the way to make a ' + P.name.toLowerCase() + ', but it needs ' + o.gate.word + ' first. Nothing was spent.</p></div>';
    else if (o.result === 'known') out = '<div class="tryres"><b>YOU KNOW THIS ONE</b><p>That\'s the ' + P.name.toLowerCase() + '. Make it from the patterns. Nothing was spent.</p></div>';
    else if (o.result === 'short') out = '<div class="tryres"><b>NOT ENOUGH IN THE STORE ROOM</b></div>';
  }
  openLook('<div class="trynew-look"><h3>Try something new · the ' + STATIONS[st].name.toLowerCase() + '</h3><p class="note">' + (left.length ? left.length + ' still to find here. A try takes one of each thing you choose.' : 'Everything at the ' + STATIONS[st].name.toLowerCase() + ' is found.') + '</p>'
    + '<div class="tryroles">' + roles.map(sel).join('') + '</div>' + out + '</div>',
    '<button class="seg go" id="tryGo"' + (ready && left.length ? '' : ' disabled') + '>TRY IT' + (ready ? ' · ' + Object.entries(cost).map(([m, n]) => MATS[m].name + (n > 1 ? ' × ' + n : '')).join(', ') : '') + '</button><button class="seg" id="tryBook">THE BOOK</button>');
  $('lookCard').querySelectorAll('[data-role]').forEach(x => x.onchange = () => { tryPicks[x.dataset.role] = x.value || null; tryOut = null; tryOpen(st, true); });
  $('tryGo').onclick = () => {
    const r = Disc.tryIt(save, st, tryPicks, rng, Date.now()); tryOut = r;
    if (r.result === 'found') { Snd.play('level'); save.made = save.made || 0; }
    else if (r.result === 'close') Snd.play('GOOD'); else if (r.result === 'nothing') Snd.play('dead');
    store(save); coins(); tryOpen(st, true); toHome();
    if (r.result === 'found') { $('look').hidden = false; }
  };
  $('tryBook').onclick = () => { $('look').hidden = true; toHome(); openTab('forge', 'book'); };
}
function renderBook() {
  if (!$('book')) return;
  const b = Disc.bookOf(save), sts = Object.keys(TRY_ROLES).filter(st => Rm.owns(save, st));
  const found = Object.keys(PATTERNS).filter(id => PATTERNS[id].hidden && Sh.knows(save, id)), all = Object.keys(PATTERNS).filter(id => PATTERNS[id].hidden);
  $('bookWord').textContent = found.length + ' OF ' + all.length + ' FOUND';
  const page = st => {
    const ids = Disc.hiddenAt(st);
    return '<h3 class="stationhead">' + STATIONS[st].word + '</h3><div class="bookgrid">' + ids.map(id => {
      const p = PATTERNS[id], k = Sh.knows(save, id), g = Disc.gateOf(save, id);
      return '<div class="bookpat' + (k ? ' known' : '') + '"><div class="art">' + ART[p.art](k ? '#c9c5be' : '#1c1612') + (k ? '' : '<i>?</i>') + '</div><b>' + (k ? p.name : '?') + '</b><small>' + esc(k ? p.kind : p.hidden.look) + '</small>'
        + (k ? '' : '<small class="' + (g.ok ? 'ok' : 'gate') + '">' + (g.ok ? 'your hand is ready' : 'needs ' + g.word) + '</small>') + '</div>';
    }).join('') + '</div>';
  };
  const clues = b.clues.length ? '<h4>WHAT FOLK HAVE ASKED FOR</h4><ul class="clues">' + b.clues.slice(0, 12).map(c => '<li' + (Sh.knows(save, c.pattern) ? ' class="done"' : '') + '>' + esc(c.line) + ' <span>' + esc(c.who) + '</span></li>').join('') + '</ul>' : '<p class="note">No one has asked for anything you don\'t make yet. Listen at the counter.</p>';
  const tries = b.tries.length ? '<h4>YOUR TRIES</h4><ul class="tries">' + b.tries.slice(0, 14).map(t => '<li><b>' + (t.result === 'studied' ? 'Studied ' + esc(t.from) : Object.values(t.picks || {}).filter(Boolean).map(m => MATS[m].name).join(' + ')) + '</b> '
    + (t.result === 'found' ? '<em class="right">found the ' + PATTERNS[t.pattern].name.toLowerCase() + '</em>' : t.result === 'studied' ? '<em class="right">learned the ' + PATTERNS[t.pattern].name.toLowerCase() + '</em>' : t.result === 'close' ? '<em class="near">close</em>' : '<em>nothing</em>')
    + (t.clues && t.clues.length && !Sh.knows(save, t.pattern) ? '<div>' + t.clues.map(c => '<span class="' + c.g + '">' + esc(c.line) + '</span>').join('') + '</div>' : '') + '</li>').join('') + '</ul>' : '';
  $('book').innerHTML = '<p class="note">Some patterns no one teaches you. Find them by trying things at a station (TRY SOMETHING NEW under PATTERNS), by what customers ask for, or by studying an old piece of one: a runner or a seller brings them now and then.</p>'
    + sts.map(page).join('') + clues + tries;
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
// the Relics' blueprints: the ones found, what each needs; the rest, where to look
const BP_WHERE = { corrow: 'Lady Corrow\'s great story (after her first, when the shop is RENOWNED)', marrow: 'Marrow\'s great story (after the first, when the shop is RENOWNED; a kettle)', bram: 'Bram Oakes\'s great story (after his first, when the shop is RENOWNED)', vance: 'Captain Vance\'s great story (after his first, when the shop is RENOWNED)', ketty: 'Ketty Moss\'s great story (after her first, when the shop is RENOWNED)', deep: 'below the deep doors, now and then (a runner\'s road from RENOWNED)' };
function renderBlueprints() {
  const have = save.blueprints || [], made = save.relicsMade || [];
  $('blueprints').innerHTML = Object.entries(RELICS).map(([id, r]) => {
    const p = PATTERNS[r.pattern];
    if (made.includes(id)) return '<div class="fi have"><b style="color:var(--t-relic)">' + esc(r.name) + '</b><span>Made: there\'s only one, and it\'s yours.</span></div>';
    if (!have.includes(id)) return '<div class="fi unknown"><b>A Relic · ' + p.name.toLowerCase() + ' · not yet found</b><span>Its blueprint: ' + BP_WHERE[r.source] + '.</span></div>';
    return '<div class="fi"><b style="color:var(--t-relic)">' + esc(r.name) + '</b><span>' + esc(r.power[0]) + ': ' + esc(r.power[1]) + '. Worked from a Rare or Old-Blood ' + p.name.toLowerCase() + ', by a maker at trade ' + RELIC_WORK.level + ' in something at ' + (p.station && p.station !== 'forge' ? 'the ' + p.station : 'the forge') + ' and trade ' + RELIC_WORK.pattern + ' in ' + p.trade.toLowerCase() + ', with ' + MATS[r.mat].name.toLowerCase() + ' (have ' + (save.mats[r.mat] || 0) + '). Open the piece in the back room.</span></div>';
  }).join('');
}
// the trail of the Nine: each Mythic, its shard, where to look
const SHARD_WHERE = { deep: 'below the deep doors (a runner\'s trip)', court: 'an order from the Court', star: 'the day a star falls on the Reach (IN TOWN), or now and then below the deep doors' };
// THE STATIONS: each one's wear, REPAIR, REBUILD; the dwarven forge
let stationNote = '';
function renderStations() {
  const now = Date.now(), list = ['forge'].concat(save.stations || []).filter(st => STATIONS[st]);
  const spared = !Bank.threatsOn(save, now);
  $('stationsWord').textContent = spared ? (save.gentle ? 'THE GENTLER REACH: NO WEAR' : 'NO WEAR YET') : 'WEAR AND REPAIR';
  $('stations').innerHTML = list.map(st => {
    const w = Wear.wearOf(save, st), br = Wear.isBroken(save, st, now), t = Wear.rebuilding(save, st), nm = Wear.stationName(st);
    const name = (st === 'forge' && save.dwarven ? 'The dwarven forge' : nm.replace(/^./, c => c.toUpperCase()));
    const bar = '<span class="wearbar' + (w >= 75 ? ' worn' : '') + '"><i style="width:' + Math.round(w) + '%"></i></span>';
    let body;
    if (br && t) body = '<span>' + (st === 'forge' && save.dwarven && w === 0 ? 'Going up' : 'Being rebuilt') + ': ready in ' + hm((t - now) / 1000) + '.</span>';
    else if (br) body = '<span class="bad">Broken. Nothing can be worked at it until it\'s rebuilt.</span><button class="seg go" data-rebuild="' + st + '"' + (save.coins < Wear.rebuildCost(save) ? ' disabled' : '') + '>REBUILD · ' + Wear.rebuildCost(save).toLocaleString() + ' c · ' + WEAR.rebuildH + ' HOURS</button>';
    else body = bar + '<span>' + Math.floor(w) + ' % worn' + (w >= 75 ? ': the band is narrower' : '') + '.' + (st === 'forge' && save.dwarven ? ' A wider band, and it wears slower.' : '') + '</span>'
      + (w > 0 ? '<button class="seg" data-repair="' + st + '"' + (save.coins < Wear.repairCost(save, st) ? ' disabled' : '') + '>REPAIR · ' + Wear.repairCost(save, st).toLocaleString() + ' c</button>' : '');
    return '<div class="fi' + (br ? ' broken' : '') + '"><b>' + esc(name) + '</b>' + body + '</div>';
  }).join('') + (save.dwarven ? '' : (() => { const c = Wear.canDwarven(save); return '<div class="fi"><b>The dwarven forge</b><span>Stone-lined and banded with iron: a band ' + Math.round((WEAR.dwarven.band - 1) * 100) + ' % wider, and it wears ' + Math.round((1 - WEAR.dwarven.wear) * 100) + ' % slower. It takes the old forge\'s place: out for ' + WEAR.dwarven.h + ' hours while it goes up.</span>'
    + '<button class="seg" data-dwarven="1"' + (c.ok ? '' : ' disabled') + '>BUILD THE DWARVEN FORGE · ' + WEAR.dwarven.cost.toLocaleString() + ' c</button>' + (c.why && c.why !== 'not enough coin' ? '<span>Needs ' + c.why + '.</span>' : '') + '</div>'; })());
  $('stationNote').textContent = (spared ? (save.gentle ? 'This save is spared wear (the gentler Reach, under the Bank). ' : 'Wear starts after a week\'s grace. ') : 'Every working wears its station; Relic and Mythic workings most. A broken station breaks after a working, never during one. ') + stationNote;
  const done = () => { store(save); coins(); renderStations(); if (dio) dio.setCold(Wear.isBroken(save, 'forge', Date.now())); };
  $('stations').querySelectorAll('[data-repair]').forEach(b => b.onclick = () => { const r = Wear.repair(save, b.dataset.repair); stationNote = r.why ? 'Not repaired: ' + r.why + '.' : 'Repaired, for ' + r.cost + ' c.'; if (r.ok) Snd.play('coin'); done(); });
  $('stations').querySelectorAll('[data-rebuild]').forEach(b => b.onclick = () => { const r = Wear.rebuild(save, b.dataset.rebuild, Date.now()); stationNote = r.why ? 'Not rebuilt: ' + r.why + '.' : 'The rebuilding has begun: ready in ' + WEAR.rebuildH + ' hours.'; if (r.ok) Snd.play('level'); done(); });
  $('stations').querySelectorAll('[data-dwarven]').forEach(b => b.onclick = () => {
    if (!confirm('Build the dwarven forge for ' + WEAR.dwarven.cost.toLocaleString() + ' c? The old forge comes out: nothing can be worked at the forge for ' + WEAR.dwarven.h + ' hours.')) return;
    const r = Wear.buildDwarven(save, Date.now()); stationNote = r.why ? 'Not built: ' + r.why + '.' : 'The old forge is coming out. The dwarven forge will be ready in ' + WEAR.dwarven.h + ' hours.'; if (r.ok) Snd.play('level'); done();
  });
}
// the maker's title, once the Nine are made: on the forge's sign and the shop's
function nineMarks() {
  const n = G.isNine(save) ? ' · ' + NINE.title : '', of = save.lineOf ? ' · OF THE LINE OF ' + save.lineOf.toUpperCase() : '';
  $('forgeKicker').textContent = 'DARKCLAY · THE MAKER\'S SHOP' + n + of; $('shopKicker').textContent = 'THE MAKER\'S SHOP · OPEN' + n + of;
}
// THE ENDING: the ninth Mythic made
const ENDING = [
  'The last of the Nine cools on the anvil. Veric made them once, long before the Reach had a name, and they were broken when the old kingdom fell. Now they are whole again, and every one carries your mark.',
  'By morning the word is out on every road. The Court sends a herald. The Deep goes quiet. Travellers who have never held a hammer come to the door only to see the hands that did it.',
  'Your mark is <b>Maker of the Nine</b>. The Hall shines twice as bright for it, and every link to your shop carries the Nine.',
  'The forge is still warm. There is always more to make.',
];
function showEnding() {
  openLook('<div class="ending"><div class="oldword" style="color:var(--t-mythic)">THE NINE OF VERIC</div><h2>Maker of the Nine</h2>' + ENDING.map(p => '<p>' + p + '</p>').join('')
    + '<ol class="ninelist">' + Object.values(MYTHICS).map(m => '<li>' + esc(m.name) + '</li>').join('') + '</ol>' + handOnWord() + '</div>',
    '<button class="seg go" id="endClose">THE FORGE IS STILL WARM</button><button class="seg" id="endHand">HAND ON THE FORGE</button>', true);
  $('endClose').onclick = () => { $('look').hidden = true; }; $('endHand').onclick = showHandOn;
  Snd.play('level'); Snd.play('chime');
}
// ---------- THE LEGACY (milestone 37): handing on the forge ----------
// a word under the ending: who the forge would go to, or what it waits on
function handOnWord() {
  const c = Leg.canHandOn(save, Date.now());
  return '<p>' + (c.ok ? 'One day the forge will want younger hands. <b>' + esc(c.heir.name) + '</b>, your apprentice, could carry it on: a generation later, in a Reach where the Nine are lost again.'
    : c.heir ? 'One day the forge will want younger hands. ' + esc(c.heir.name) + ' could carry it on, once they\'ve been with you ' + LEGACY.days + ' days (' + c.left + ' more).'
    : 'One day the forge will want younger hands. Take on an apprentice (STAFF › LOOKING FOR WORK), and in time they could carry it on.') + '</p>';
}
let handPicks = [];
const names = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a.join('');
function showHandOn() {
  const c = Leg.canHandOn(save, Date.now());
  if (!c.ok) { openLook('<div class="ending"><div class="oldword">THE LEGACY</div><h2>Hand on the forge</h2>' + handOnWord() + '<p>Not yet: ' + esc(c.why) + '.</p></div>', '<button class="seg go" id="handBack">BACK TO THE FORGE</button>', true); $('handBack').onclick = () => { $('look').hidden = true; }; return; }
  const p = c.heir, list = Leg.heirlooms(save).slice(0, 12), tr = LEGACY.trait[p.trait] || {}, own = Ap.skills(p).filter(x => x.level > LEGACY.rest);
  const n = Leg.heirloomsFor(Leg.gen(save) + 1), next = Leg.gen(save) + 1;
  handPicks = handPicks.filter(id => list.some(x => x.id === id)).slice(0, n);
  if (!handPicks.length) handPicks = list.slice(0, n).map(x => x.id);   // the best, to begin with; then as chosen
  const pick = list.map(x => (handPicks.includes(x.id) ? '<button class="seg go" data-loom="' + x.id + '">✓ <b>' + esc(x.name) + '</b> · ' : '<button class="seg" data-loom="' + x.id + '"><b style="color:var(--t-' + x.tier + ')">' + esc(x.name) + '</b> · ') + Leg.tierName(x.tier).toUpperCase() + '</button>').join(' ');
  const welcome = next >= LEGACY.welcomeFrom ? ' The town remembers the line: the new shop starts ' + RENOWN[LEGACY.welcome].word + '.' : '';
  openLook('<div class="ending"><div class="oldword" style="color:var(--t-mythic)">THE LEGACY</div><h2>Hand on the forge</h2>'
    + '<p>The forge goes to <b>' + esc(p.name) + '</b>, a generation later. The Nine are lost again after your day, their shards scattered to new places, and the Reach is yours to win back: a fresh climb, with what the line has learned.</p>'
    + '<p><b>The line keeps:</b> the book (every pattern found, every try and clue), the blueprints (known, not made), the found tiles, ' + esc(p.name) + '\'s trades (' + (own.length ? own.map(x => esc(PATTERNS[x.id].name) + ' ' + x.level).join(', ') + '; ' : '') + 'trade ' + LEGACY.rest + ' in the rest), their trait for good (' + esc(TRAITS.apprentice.find(t => t.id === p.trait)?.word || p.trait) + ': ' + esc(tr.line || '') + '), and ' + (n > 1 ? 'two heirlooms' : 'one heirloom') + '.' + welcome + '</p>'
    + '<p><b>Starts over:</b> coin (a purse of ' + LEGACY.purse + ' c), renown, the room, the stations (the forge only), the tools and skills, the staff, the shelves and the back room, the Bank, the Hall, the trail and its shards, the regulars, the second shop.</p>'
    + '<div class="oldword" style="margin-top:16px">' + (n > 1 ? 'THE HEIRLOOMS' : 'THE HEIRLOOM') + '</div>' + (list.length ? '<p>' + (n > 1 ? 'Two pieces' : 'One piece') + ' to hang over the new shop\'s door: never for sale, and ' + (n > 1 ? 'they draw' : 'it draws') + ' customers. The rest stays with your shop.</p><div class="handpick">' + pick + '</div>' : '<p>You have no Old-Blood piece, Relic or Mythic in the shop to pass on: the forge goes on without an heirloom.</p>')
    + '<div class="oldword" style="margin-top:16px">YOUR SHOP</div><p>Your shop is kept in the line\'s record, with its save code. Copy the code now too, if you want to keep it somewhere safe.</p><p class="note" id="handNote"></p></div>',
    '<button class="seg" id="handCode">COPY THIS SHOP\'S CODE</button><button class="seg go" id="handGo">HAND ON THE FORGE</button><button class="seg" id="handBack">NOT YET</button>', true);
  $('lookCard').querySelectorAll('[data-loom]').forEach(b => b.onclick = () => { const id = b.dataset.loom;
    handPicks = handPicks.includes(id) ? handPicks.filter(x => x !== id) : n > 1 ? handPicks.concat(id).slice(-n) : [id]; showHandOn(); });
  $('handBack').onclick = () => { $('look').hidden = true; };
  $('handCode').onclick = async () => { save.lastSeen = Date.now(); const code = toCode(save); try { await navigator.clipboard.writeText(code); backedUp(); $('handNote').textContent = 'Copied: ' + Math.round(code.length / 1024) + ' KB of save code.'; } catch (e) { $('handNote').textContent = 'Couldn\'t reach the clipboard: copy it from THE FORGE › SAVE instead.'; } };
  $('handGo').onclick = () => {
    const looms = handPicks.map(id => list.find(x => x.id === id)).filter(Boolean);
    if (looms.length < Math.min(n, list.length)) { $('handNote').textContent = 'Choose ' + (n > 1 ? 'two heirlooms' : 'the heirloom') + ' first.'; return; }
    if (!confirm('Hand on the forge to ' + p.name + (looms.length ? ', with ' + names(looms.map(x => x.name)) + (looms.length > 1 ? ' as the heirlooms' : ' as the heirloom') : '') + '?\n\nYour shop goes into the line\'s record and ' + p.name + ' starts a new one in this slot.')) return;
    if (!confirm('This can\'t be undone. Hand on the forge?')) return;
    save.lastSeen = Date.now();
    const r = Leg.handOn(save, looms.map(x => x.id), Date.now());
    if (!r.ok) { $('handNote').textContent = 'Not handed on: ' + r.why + '.'; return; }
    if (!storeRaw(r.save)) {
      if (!confirm('This browser won\'t hold the old shop\'s save code in the record (it\'s full). Hand on without it? Copy the code first if you want to keep it.') || !storeRaw(Leg.withoutCodes(r.save))) { $('handNote').textContent = 'Not handed on: this browser won\'t store it.'; return; }
    }
    try { sessionStorage.setItem('darkclayforge.skipTitle', '1'); } catch (e) { /* none */ }
    replacing = true; location.reload();
  };
}
// the line's record, the heirlooms, and the new generation's welcome
function renderLine() {
  const line = save.line || [], looms = Leg.loomsOf(save);
  $('lineBox').hidden = !line.length && !looms.length;
  if ($('lineBox').hidden) return;
  $('line').innerHTML = (looms.length ? '<div class="fi have"><b>' + looms.map(h => '<span style="color:var(--t-' + h.tier + ')">' + esc(h.name) + '</span>').join(' · ') + '</b><span>' + (looms.length > 1 ? 'The heirlooms' : 'The heirloom') + ', from ' + esc(names([...new Set(looms.map(h => h.from))])) + ': over the shop door. Never for sale; ' + (looms.length > 1 ? 'they draw' : 'it draws') + ' customers (charm +' + G.heirloomCharm(save) + ').</span></div>' : '')
    + line.map(r => { const passed = r.heirlooms || (r.heirloom ? [r.heirloom] : []);
      return '<div class="fi"><b>' + esc(genWord(r.gen)) + ' OF THE LINE · ' + esc(r.maker) + '</b><span>' + (r.nine >= 9 ? 'Maker of the Nine' + (r.days ? ', in ' + r.days + ' days' : '') : r.nine + ' of the Nine') + '. Renown ' + r.renown.toLocaleString() + '; ' + r.made.toLocaleString() + ' made, ' + r.sold.toLocaleString() + ' sold. '
      + (passed.length ? 'Passed on ' + esc(names(passed.map(x => x.name))) + '.' : 'Passed on no heirloom.') + (r.hall.length ? ' In the Hall: ' + r.hall.map(esc).join(', ') + '.' : '') + '</span>'
      + (r.code ? '<button class="seg" data-linecode="' + (r.gen) + '">COPY ' + esc(r.maker.toUpperCase()) + '\'S SAVE CODE</button><span>Load it into another slot (THE FORGE › SAVE) to play that shop again.</span>' : '') + '</div>'; }).join('')
    + '<div class="fi"><b>' + esc(genWord(Leg.gen(save))) + ' OF THE LINE · ' + esc(save.maker) + '</b><span>Now at the forge' + (save.lineOf ? ', of the line of ' + esc(save.lineOf) : '') + '.</span></div>';
  $('line').querySelectorAll('[data-linecode]').forEach(b => b.onclick = async () => { const r = line.find(x => x.gen === +b.dataset.linecode); try { await navigator.clipboard.writeText(r.code); b.textContent = 'COPIED'; } catch (e) { $('loadText').value = r.code; b.textContent = 'IN THE BOX UNDER THE FORGE › SAVE'; } });
}
const genWord = n => ['FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH', 'SIXTH', 'SEVENTH', 'EIGHTH', 'NINTH'][n - 1] || n + 'TH';
// the heir's first morning
function showHeirWelcome() {
  const looms = Leg.loomsOf(save), known = Leg.gen(save) >= LEGACY.welcomeFrom;
  openLook('<div class="ending"><div class="oldword">' + esc(genWord(Leg.gen(save))) + ' OF THE LINE</div><h2>' + esc(save.maker) + '</h2>'
    + '<p>' + esc(save.lineOf) + ' kept the forge for the rest of their days. They made the Nine of Veric, and the Reach still tells it.</p>'
    + '<p>That was a generation ago. The Nine were lost again after their day: a fire at the Court, a theft on the high road, one gone into the river. Their shards lie scattered, and not where the old stories put them. No one now living has seen one whole. The shop is small again, the shelves are bare, and the purse holds ' + LEGACY.purse + ' coins.</p>'
    + '<p>But the book is on its hook, the blueprints are in the drawer, and your hands remember what you learned at the bench.' + (looms.length ? ' Over the door ' + (looms.length > 1 ? 'hang ' : 'hangs ') + looms.map(h => '<b>' + esc(h.name) + '</b>').join(' and ') + ', from the line\'s own hands (THE FORGE › WORKSHOP, under THE LINE).' : '') + '</p>'
    + (known ? '<p>And the town remembers the line. The old families send their grandchildren to your door: the shop opens <b>' + RENOWN[LEGACY.welcome].word + '</b>.</p>' : '<p>The regulars\' grandchildren will come in, in time. Some of them remember your master.</p>')
    + '<p>The forge is still warm.</p></div>', '<button class="seg go" id="heirGo">LIGHT THE FORGE</button>', true);
  $('heirGo').onclick = () => { $('look').hidden = true; };
  save.heirWelcomed = true; store(save);
}
function renderTrail() {
  const cl = Trail.clues(save), found = cl.filter(c => c.found).length;
  nineMarks(); renderLine();
  if (G.isNine(save)) { $('trailWord').innerHTML = 'All Nine are made, and every one carries your mark. You are the Maker of the Nine. <button class="seg" id="endAgain">READ THE ENDING AGAIN</button> <button class="seg" id="trailHand">HAND ON THE FORGE</button>'; $('endAgain').onclick = showEnding; $('trailHand').onclick = showHandOn; }
  else $('trailWord').textContent = !Trail.open(save) ? 'The Nine of Veric: nine pieces of legend, each a Relic reforged. The trail opens when the shop is ' + RENOWN[TRAIL.rung].word + '.'
    : found + ' of 9 shards of Veric found. Every shard can be looked for now; a Mythic is worked on its Relic, once all three parts are made.';
  $('trail').innerHTML = cl.map(c => {
    const m = MYTHICS[c.id], r = RELICS[c.relic];
    if ((save.mythicsMade || []).includes(c.id)) return '<div class="fi have"><b style="color:var(--t-mythic)">' + esc(m.name) + '</b><span>Made: one of the Nine, and yours.</span></div>';
    if (c.found) return '<div class="fi"><b style="color:var(--t-mythic)">' + esc(m.name) + '</b><span>Its shard is yours. From ' + esc(r.name) + ', with three parts:</span>'
      + m.parts.map((p, i) => { const g = Trail.partGate(save, c.id, i); return Trail.hasPart(save, c.id, i) ? '<span>✓ ' + esc(p[1]) + ' (the ' + p[0] + ')</span>'
        : '<button class="seg" data-part="' + c.id + ':' + i + '"' + (g.ok ? '' : ' disabled') + '>' + esc(p[1].toUpperCase()) + ' · AT THE ' + p[0].toUpperCase() + '</button>' + (g.ok ? '' : '<span>Needs ' + g.why.join(', ') + '.</span>'); }).join('')
      + (Trail.partsDone(save, c.id) ? '<span>All three made: the Mythic working waits on ' + esc(r.name) + ', from the back room.</span>' : '') + '</div>';
    if (!c.open) return '<div class="fi unknown"><b>' + esc(m.name) + '</b><span>Grows from ' + esc(r.name) + '.</span></div>';
    return '<div class="fi"><b style="color:var(--t-mythic)">' + esc(m.name) + '</b><span>A clue: its shard lies with ' + SHARD_WHERE[c.source] + '. It grows from ' + esc(r.name) + ((save.relicsMade || []).includes(c.relic) ? ', which you\'ve made' : ', not made yet') + '.</span></div>';
  }).join('');
  $('trail').querySelectorAll('[data-part]').forEach(b => b.onclick = () => { const [id, i] = b.dataset.part.split(':'); partStart(id, +i); });
}
function partStart(id, i) {
  const g = Trail.partGate(save, id, i); if (!g.ok) return;
  rw = null; master = false; part = { mythic: id, i }; pat = g.pattern; toPrepare();
}
function renderTools() {
  $('tools').innerHTML = Object.entries(TOOLS).map(([id, t]) => {
    const have = G.has(save, id), c = G.canBuyTool(save, id);
    return '<div class="fi' + (have ? ' have' : '') + '"><b>' + t.name + '</b><span>' + t.line + '.</span>' + (have ? '' : '<button class="seg" data-tool="' + id + '"' + (c.ok ? '' : ' disabled') + '>BUY · ' + t.cost + ' c</button>' + (c.why && c.why !== 'not enough coin' ? '<span>' + c.why + '</span>' : '')) + '</div>';
  }).join('');
  $('toolNote').textContent = toolNote || 'Tools work on every piece, new or back in the fire.';
  renderStations(); renderBlueprints(); renderTrail();
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
// BEHIND THE COUNTER (milestone 25): the shop seen from behind your counter, the painted views (js/counter.js); the 3D shop only to
// arrange it, with no customers in it
let cvw = null, cvP = null, iso = false, cvSig = '', cvFront = null;
function counterView() {
  $('cview').hidden = false; $('cvActs').hidden = false; $('floor').hidden = true; $('dioBar').hidden = true;
  if (!cvP) cvP = import('./counter.js?v=63').then(m => { cvw = m.create($('cview'), { place: (k, i) => k === 'shelf' ? (i < save.slots ? slotOpen(i) : null) : wallPlaceOpen(i), workshop: () => toHome() }); cvw.show(save, Sh.priceAt); return cvw; }).catch(() => null);
  else if (cvw) cvw.show(save, Sh.priceAt);
}
// a place on the painted wall: its piece (take it down), or empty (hang one from the back room)
function wallPlaceOpen(i) {
  const id = (save.wall || [])[i], c = id && save.cards.find(x => x.id === id);
  if (!c) { openTab('shop', 'wall'); reveal($('wall')); return; }
  openLook(card(c), '<button class="seg" id="unhang">TAKE IT DOWN</button>', false, c);
  $('unhang').onclick = () => { G.unhang(save, c.id); store(save); $('look').hidden = true; renderShop(); };
}
function toArrange() { iso = true; $('cview').hidden = true; $('cvActs').hidden = true; $('floor').hidden = false; toShop(); }
function toShop() {
  clearTimers(); S = null; rescueCheck(); show('shop'); coins(); $('navSold').hidden = true; renderShop();
  if (!iso) { counterView(); tip('shop', $('cview')); return; }
  tip('shop', $('floor'));
  if (!dioP) { $('floor').classList.add('loading'); dioP = import('./diorama.js?v=63').then(m => m.create($('floor'), { onTap: dioTap, folk: false })).catch(() => null).then(d => {
    dio = d; $('floor').classList.remove('loading');
    if (d) { $('floor').classList.add('has3d'); $('dioBar').hidden = false; d.setRoom(viewRoom(), save); d.setShelf(standsFor()); d.setQueue(save.queue); renderDioBar(); }
    return d;
  }); }
  else if (dio) { dio.setRoom(viewRoom(), save); dio.setQueue(save.queue); dio.redraw(); }
}

// ---------- THE SHOP IN 3D ----------
// the shelf's pieces where they stand in the room, for the card stands
const shelfShown = () => Rm.shelfSpots(save.room).map((p, i) => { const e = save.shelf[i], c = e && save.cards.find(x => x.id === e.id); return c && { slot: i, shelf: p.shelf, spot: p.spot, lv: p.lv, card: c, price: Sh.priceAt(c, e.tag) }; }).filter(Boolean);
let dioP = null, dio = null, arranging = false, picked = null, dioMsg = '', dioView = 'shop';
const viewRoom = () => dioView === 'work' ? save.workshop : dioView === 'hall' && save.hall ? save.hall : save.room;
// the cards on show in the room in view: the shop front's shelves, or the Hall's plinths and cases
const hallShown = () => save.hall ? Rm.hallSpots(save.hall).map((p, i) => { const id = (save.hall.shown || {})[p.key], c = id && save.cards.find(x => x.id === id); return c && { slot: i, shelf: p.item, spot: p.spot, lv: p.kind, card: c, price: c.worth }; }).filter(Boolean) : [];
const standsFor = () => dioView === 'hall' ? hallShown() : shelfShown();
function setView(v) { if (v === dioView) return; dioView = v; picked = null; dioMsg = ''; if (dio) { dio.setRoom(viewRoom(), save); dio.setShelf(standsFor()); dio.setQueue(save.queue); } renderDioBar(); renderFurnish(); }
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => setView(b.dataset.view));
function dioTap(t) {
  if (t.door && !arranging) { setView(t.door); return; }
  if (t.slot != null && !arranging) { if (dioView === 'hall') hallPlaceOpen(t.slot); else slotOpen(t.slot); return; }
  if (arranging) {
    if (t.item && t.item !== picked) { picked = t.item; dioMsg = ''; }
    else if (picked && t.tile) {
      const it = viewRoom().items.find(i => i.id === picked), [fx, fz] = Rm.fpOf(it);
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
  const it = picked && viewRoom().items.find(i => i.id === picked), f = it && FURNITURE[it.kind];
  $('visitor').hidden = true;   // the 3D shop is for arranging: no customers, no visitor's line (they're behind the counter view)
  $('dioHint').textContent = !arranging ? (dioView === 'hall' ? 'Your Hall: tap a piece to see it, or an empty plinth to show one (THE HALL tab lists them all). The doorway leads back to the shop.' : dioView === 'work' ? 'The forge and every station. Tap one to work; the doorway leads back to the shop.' : 'Tap a card on a shelf to see it, or the counter; the doorway at the back leads to the workshop.') : dioMsg || (it ? f.name + ': tap a free tile to move it there.' : 'Tap a piece to pick it up. Blue tiles stay clear for customers.');
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
$('toArrange').onclick = () => { toArrange(); arranging = true; picked = null; renderDioBar(); };
$('toCounter').onclick = () => { iso = false; arranging = false; picked = null; if (dio) renderDioBar(); toShop(); };
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
  $('furnList').innerHTML = Object.entries(FURNITURE).filter(([k, f]) => !f.fixed && (Rm.homeOf(k) === 'hall' ? dioView === 'hall' : !(dioView === 'hall' && Rm.homeOf(k) !== 'any'))).map(([k, f]) => {
    const cost = Rm.costOf(room, k), n = room.items.filter(i => i.kind === k).length;
    return '<div class="fi"><b>' + f.name + (n ? ' · ' + n : '') + '</b><span>' + (f.slots ? 'Two places, made better in THE SHELF: three, then six.' : f.line || '') + (f.charm ? ' Charm ' + f.charm + '.' : '') + '</span>'
      + (cost == null ? '<span>As many as a shop can use.</span>' : '<button class="seg" data-buyf="' + k + '"' + (save.coins < cost ? ' disabled' : '') + '>BUY · ' + cost + ' c</button>') + '</div>';
  }).join('');
  if (!save.branch) {
    const c = Br.canBuy(save);
    $('furnList').insertAdjacentHTML('afterbegin', '<div class="fi branchbuy"><b>A second shop · ' + esc(BRANCH.town) + '</b><span>' + esc(BRANCH.line) + ' Kept by ' + esc(BRANCH.keeper) + ' for ' + BRANCH.wage + ' c an hour and a fifth of each sale; it sells while you\'re away too. A smaller town: fewer customers than here.'
      + (c.ok ? '' : ' Needs ' + esc(c.why) + '.') + '</span><button class="seg go" id="buyBranch"' + (c.ok ? '' : ' disabled') + '>SET IT UP · ' + BRANCH.cost + ' c</button></div>');
    $('buyBranch').onclick = () => { const r = Br.buy(save); if (r.ok) { store(save); coins(); $('navBranch').hidden = false; toast('<b>' + esc(BRANCH.town) + '</b><br>Your second shop is open. Stock its shelves from your back room.'); Snd.play('level'); toBranch(); } };
  }
  if (!save.hall && dioView !== 'work') {
    const c = Hl.canBuy(save);
    $('furnList').insertAdjacentHTML('afterbegin', '<div class="fi branchbuy"><b>The Hall</b><span>A third room: a gallery for your best pieces, Old-Blood and better, each adding renown and charm. It starts with ' + HALL.plinths + ' plinths; it shows in your shop links and flyers.'
      + (c.ok ? '' : ' Needs ' + esc(c.why) + '.') + '</span><button class="seg go" id="buyHall"' + (c.ok ? '' : ' disabled') + '>BUILD IT · ' + HALL.cost + ' c</button></div>');
    $('buyHall').onclick = () => { const r = Hl.buy(save); if (r.ok) { store(save); coins(); Snd.play('level'); toast('<b>The Hall</b><br>Show your best pieces there: THE SHOP › THE HALL.'); setView('hall'); openTab('shop', 'hall'); renderShop(); } };
  }
  const stored = save.stored || [];
  if (stored.length) $('furnList').insertAdjacentHTML('afterbegin', stored.map(k => '<div class="fi have"><b>' + FURNITURE[k].name + '</b><span>A gift, in the store room. ' + (FURNITURE[k].line || '') + ' Charm ' + FURNITURE[k].charm + '.</span><button class="seg go" data-putout="' + k + '">PUT IT OUT</button></div>').join(''));
  $('furnList').querySelectorAll('[data-putout]').forEach(b => b.onclick = () => { const r = Rm.putOut(save, b.dataset.putout); furnNote = r.why ? 'Not put out: ' + r.why + '.' : FURNITURE[b.dataset.putout].name + ': in the shop front.'; if (r.item) { store(save); if (dio) dio.setRoom(viewRoom(), save); } renderShop(); });
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
  if (c) $('patience').style.width = (c.counter ? 100 : Math.max(0, Math.min(100, c.wait / G.patienceOf(save, PATIENCE) * 100))) + '%';
  if (save.order) { const left = Math.max(0, Math.ceil(save.order.due - save.clock)); $('orderDue').textContent = 'DUE IN ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') + ' OF OPEN SHOP'; }
}
function renderCounter() {
  const c = save.queue[0], box = $('counterBox');
  lastSig = counterSig();
  box.hidden = !c;
  const inView = !!(cvw && !iso);   // the counter view holds the piece up and shows who they are; the panel keeps their words and the choices
  let held = '', heldKey = '', heldTag = '';
  if (!c) { if (cvw) cvw.hold(''); return; }
  const hl = Sh.haggleLevel(save), rd = G.readLevels(save);
  $('queueWord').textContent = save.queue.length > 1 ? (save.queue.length - 1) + ' WAITING BEHIND' : 'NO ONE BEHIND';
  const head = '<div class="cust' + (inView ? ' inview' : '') + '">' + (inView ? '' : figure(c.fig).replace('class="fig in"', 'class="fig"')) + '<div class="nm">' + esc(c.who) + '</div>'
    + (c.tell ? '<div class="tell">' + esc(c.tell) + '</div>' : '')
    + '<div class="meta">' + (c.kind === 'buyer' ? 'Wants <b>' + Sh.wantWord(c.want) + (c.least ? ', ' + TIERS[c.least].name + ' or better' : '') + '</b>' : 'Has something to sell')
    + (c.type === 'steward' || c.type === 'master' ? '<span class="wealthy">WEALTHY</span>' : '')
    + (c.kind === 'buyer' && hl >= rd.mood ? '<span class="mood ' + c.mood + '">' + c.mood + '</span>' : '')
    + (c.kind === 'buyer' && hl >= rd.purse ? '<span>Purse <b>' + c.purse + ' c</b></span>' : '') + '</div></div>';
  let body = '';
  if (c.kind === 'seller') {
    const o = c.offer, h = hour();
    if (o.type === 'mats') body = '<div class="note">' + MATS[o.mat].name + (MATS[o.mat].rare ? ' ✶' : '') + ' × ' + o.n + ' for <b>' + o.price + ' c</b>'
      + (Sh.sells(o.mat, h, save) ? ' (the suppliers ask ' + Sh.priceOf(o.mat, h) * o.n + ' c)' : ' (no supplier has it this hour)') + '. You have ' + (save.mats[o.mat] || 0) + '.</div>';
    else { held = card(o.card); heldTag = 'THEY ASK <b>' + o.price + ' c</b>'; heldKey = 'sell:' + o.card.id; }
    if (o.type !== 'mats') body = '<div class="offer' + (inView ? ' inview' : '') + '">' + (inView ? '' : '<div>' + card(o.card, { short: true, price: o.price + ' c' }) + '</div>') + '<div class="choices"><div class="note">' + esc(o.card.name) + ', ' + TIERS.find(t => t.id === o.card.tier).name
      + ', worth ' + o.card.worth + ' c. They\'ll take <b>' + o.price + ' c</b>. It goes in the back: sell it, break it down, or rework it.</div></div></div>';
    body += '<div class="rbtns left"><button class="hbtn go" data-act="buy"' + (save.coins < o.price ? ' disabled' : '') + '>BUY IT<small>' + o.price + ' c</small></button><button class="hbtn" data-act="away">NO THANKS</button></div>';
  } else if (c.counter) {
    const cd = save.cards.find(x => x.id === c.counter.id);
    if (cd) { held = card(cd); heldTag = 'YOU ASKED ' + c.counter.asked + ' c · THEY SAY <b>' + c.counter.price + ' c</b>'; heldKey = 'ask:' + cd.id; }
    const k = c.counter, said = k.final ? (k.price >= c.purse ? '"That\'s everything I\'ve got."' : '"' + k.price + ' c, and that\'s my last word."') : k.over ? '"' + k.asked + ' c? I can do ' + k.price + ' c. No more."' : '"Not ' + k.asked + ' c. ' + k.price + ' c?"';
    body = '<div class="note">' + esc(cd ? cd.name : 'The piece') + ': you asked ' + k.asked + ' c. <b>' + said + '</b>' + (k.final ? ' Take it, or they look elsewhere.' : '') + '</div>'
      + '<div class="rbtns left"><button class="hbtn go" data-act="take">TAKE IT<small>' + k.price + ' c</small></button>'
      + (k.final ? '' : '<button class="hbtn" data-act="split">SPLIT THE DIFFERENCE<small>' + Sh.splitPrice(k) + ' c</small></button>')
      + '<button class="hbtn" data-act="refuse">NO</button></div>';
  } else {
    const list = Sh.showable(save);
    if (!list.length) body = '<div class="note">Nothing on the shelf for them.' + (Sh.inBack(save).some(x => Sh.wants(c.want, x)) ? ' Something in the back would do: put it on the shelf.' : '') + '</div>'
      + '<div class="rbtns left"><button class="hbtn" data-act="away">NOTHING FOR THEM</button></div>';
    else {
      const e = list[c.shows % list.length], hm2 = G.haggleMult(save);
      const tagged = card(e.card, { short: true, price: Sh.priceAt(e.card, e.tag) + ' c<span class="tagword">' + TAGS[e.tag].word + '</span>' });
      held = card(e.card); heldTag = '<b>' + Sh.priceAt(e.card, e.tag) + ' c</b> · ' + TAGS[e.tag].word; heldKey = 'show:' + e.card.id;
      body = '<div class="offer' + (inView ? ' inview' : '') + '">' + (inView ? '' : '<div>' + tagged + '</div>') + '<div class="choices">'
        + '<div class="row3">' + Object.entries(HAGGLE).map(([k, h]) => { const pr = Sh.hagglePrice(e.card, e.tag, k, hm2); return '<button class="hbtn' + (k === 'hold' ? ' go' : '') + '" data-act="h:' + k + '" data-id="' + e.card.id + '">' + h.word + '<small>' + pr + ' c</small></button>'; }).join('') + '</div>'
        + '<div class="rbtns left">' + (list.length > 1 && c.shows < 2 ? '<button class="seg" data-act="another">SHOW ANOTHER</button>' : '') + '<button class="seg" data-act="away">NOTHING FOR THEM</button></div></div></div>';
    }
  }
  if (cvw) cvw.hold(inView ? held : '', heldKey, heldTag);
  if (Date.now() - counterNoteAt > 6000) counterNote = '';
  $('counterBody').innerHTML = head + body + (counterNote ? '<p class="note' + (counterNoteBad ? ' bad' : '') + '">' + counterNote + '</p>' : '')
    + (hl < rd.purse ? '<p class="note" style="color:var(--bone-faint)">Haggling ' + hl + (hl < rd.mood ? ': read their mood from their words. It shows at Haggling ' + rd.mood + ', their purse at ' + rd.purse + '.' : ': their purse shows at Haggling ' + rd.purse + '.') + '</p>' : '');
  tickCounter();
}
// the answer at the counter, in the view: a mark and its sound; the one who goes takes theirs out of the door, a sale's coins to the till
function counterReact(res) {
  const k = res && CV.reactionTo(res); if (!k) return;
  Snd.play(k);
  if (!cvw || iso) return;
  if (res.outcome === 'sold') { cvw.coins(); cvw.leaving('pleased'); }
  else if (res.outcome === 'gone') cvw.leaving('offended');
}
$('counterBody').onclick = ev => {
  const b = ev.target.closest('button'); if (!b || b.disabled) return;
  const a = b.dataset.act, now = Date.now(), c = save.queue[0]; if (!c) return;
  counterNote = ''; counterNoteBad = false; counterNoteAt = Date.now();
  let res = null;   // the answer, for the mark by their head
  if (a === 'buy') { const e = Sh.buyOffer(save, now); if (e) { counterNote = 'Bought: ' + esc(e.bought.what) + '.'; Snd.play('coin'); res = { outcome: 'sold', bought: true }; } }
  else if (a === 'away') { Sh.sendAway(save, now); if (cvw) cvw.leaving(null); }
  else if (a === 'another') c.shows++;
  else if (a === 'take' || a === 'refuse') { const r = Sh.answerCounter(save, a === 'take', now); res = r; if (r) { counterNote = r.outcome === 'sold' ? 'Sold for ' + r.price + ' c.' : r.outcome === 'another' ? 'They look at something else.' : 'They went.'; counterNoteBad = r.outcome === 'gone'; if (r.outcome === 'sold') { Snd.play('coin'); if (dio) dio.sold(r.entry); } } }
  else if (a === 'split') { const r = Sh.split(save, now); res = r; if (r) { if (r.outcome === 'sold') { counterNote = 'Met halfway: sold for ' + r.price + ' c.'; Snd.play('coin'); if (dio) dio.sold(r.entry); } else counterNote = 'They came up to ' + r.price + ' c.'; } }
  else if (a.startsWith('h:')) {
    const r = Sh.haggle(save, b.dataset.id, a.slice(2), now); res = r;
    if (r) {
      if (r.outcome === 'sold') { counterNote = 'Sold for ' + r.price + ' c.'; Snd.play('coin'); if (dio) dio.sold(r.entry); }
      else if (r.outcome === 'gone') { counterNote = 'They went.'; counterNoteBad = true; }
    }
  }
  counterReact(res);
  store(save); coins(); renderShop();
  if (res && cvw && !iso && (res.outcome === 'counter' || res.outcome === 'another')) { const k = CV.reactionTo(res); cvw.show(save, Sh.priceAt).then(() => cvw.react(k, 0)); }
  const first = $('counterBody').querySelector('button:not(:disabled)'); if (first) first.focus({ preventScroll: true });
};
// an order filled: the coin, and a regular's thanks (and their gift, at a story's end)
// the one the order was for comes to the counter for it: pleased, and the coins (milestone 27)
function collects(o) { if (!cvw || iso || screen !== 'shop') return; cvw.visit({ who: o.who }, 'pleased', 'pleased'); setTimeout(() => cvw.coins(9), 1100); Snd.play('pleased'); }
function filledToast(o, e) {
  collects(o);
  const st = e.story;
  toast('<b>Order filled · +' + o.pays + ' c</b><br>' + esc(o.who) + (st ? ': "' + esc(st.thanks) + '"' : '')
    + (st && st.gift ? '<br><b>A gift: ' + esc(FURNITURE[st.gift].name) + '</b> ' + (st.stored ? '(in the store room: put it out from FURNISH)' : 'in your shop front') : '')
    + (st && st.blueprint ? '<br><b>A blueprint: ' + esc(RELICS[st.blueprint].name) + '</b> (THE FORGE › WORKSHOP)' : '')
    + (e.shard ? '<br><b>A shard of Veric: ' + esc(MYTHICS[e.shard].name) + '</b> (THE FORGE › WORKSHOP)' : ''));
  if (e.shard) Snd.play('chime');
  if (st && st.blueprint) { Snd.play('chime'); store(save); }
  if (st && st.gift) { Snd.play('level'); if (dio) dio.setRoom(viewRoom(), save); }
}
function renderOrder() {
  const o = save.order;
  $('orderBox').hidden = !o;
  if (!o) return;
  if (o.mythic) return renderCourtOrder(o);
  const fit = save.cards.filter(c => Sh.fills(o, c) && !G.onWall(save, c.id) && !G.onHall(save, c.id));   // what can be handed over (the wall's and the Hall's stay up)
  const story = o.story && STORIES.find(x => x.id === o.story);
  $('orderBody').innerHTML = (story ? '<div class="storystep">' + esc(Sh.storyWho(save, story).split(',')[0].toUpperCase()) + '\'S STORY · ' + (o.step + 1) + ' OF ' + story.steps.length + '</div>' : '') + '<div class="who">FROM ' + esc(o.who.toUpperCase()) + ' · "' + esc(o.line) + '"</div>'
    + '<div class="ask">' + esc(Sh.orderWord(o)).replace(/^./, x => x.toUpperCase()) + '</div>'
    + '<div class="note">Pays <span class="pays">' + o.pays + ' c</span>, ' + (o.story ? 'two and a half times' : o.court && !o.shard && !o.mythic ? 'three times' : 'twice') + ' what such a piece is worth, whatever you hand in.' + (story && o.step === story.steps.length - 1 ? ' The last of their story: they\'ll leave a gift.' : '') + '</div>'
    + (fit.length ? '<div class="pickgrid" style="margin-top:10px">' + fit.map(c => '<button data-deliver="' + c.id + '" aria-label="Deliver ' + esc(c.name) + '">' + card(c, { short: true, price: 'DELIVER' }) + '</button>').join('') + '</div>'
      : '<div class="rbtns left"><button class="seg go" id="orderMake">MAKE ONE AT ' + R.stationOf(o.pattern).word + '</button></div>');
  $('orderBody').querySelectorAll('[data-deliver]').forEach(b => b.onclick = () => {
    const c = save.cards.find(x => x.id === b.dataset.deliver);
    if (!keepsNine(c, 'It goes to ' + o.who)) return;
    if (!Sh.mythicAtStake(save, c) && c.worth * 2 > o.pays * 1.5 && !confirm('The ' + c.name + ' is worth ' + c.worth + ' c. The order pays ' + o.pays + ' c. Hand it over?')) return;
    { const e = Sh.deliver(save, b.dataset.deliver, Date.now()); if (e) { store(save); coins(); renderShop(); filledToast(o, e); } }
  });
  if (!fit.length) $('orderMake').onclick = () => {
    rw = null; pat = o.pattern;
    if (o.metal) { const m = R.partOptions(pat)[0].opts.findIndex(x => x.id === o.metal); picks()[0] = m; }
    toPrepare();
  };
}
// the Court, for one of the Nine: once. Sell it (it leaves the Hall first) or keep it, and it won't ask again
function renderCourtOrder(o) {
  const c = save.cards.find(x => x.mythic === o.mythic), inHall = c && G.onHall(save, c.id);
  $('orderBody').innerHTML = '<div class="storystep" style="color:var(--t-mythic)">THE COURT · ONCE</div><div class="who">"' + esc(o.line) + '"</div>'
    + '<div class="ask">' + esc(Sh.orderWord(o)) + '</div>'
    + '<div class="note">Pays <span class="pays">' + o.pays.toLocaleString() + ' c</span>, twice its worth. It still counts among the Nine you\'ve made.' + (inHall ? ' It\'s in the Hall: it comes down to go.' : '') + '</div>'
    + (c ? '<div class="pickgrid" style="margin-top:10px"><button data-court="' + c.id + '" aria-label="Sell ' + esc(c.name) + ' to the Court">' + card(c, { short: true, price: 'TO THE COURT' }) + '</button></div>' : '')
    + '<div class="rbtns left"><button class="seg" id="courtKeep">KEEP IT</button></div>';
  const b = $('orderBody').querySelector('[data-court]');
  if (b) b.onclick = () => {
    if (!confirm(c.name + ' goes to the Court for ' + o.pays.toLocaleString() + ' c. There\'s only one: it won\'t come back. Sell it?')) return;
    if (inHall) Object.keys(save.hall.shown).forEach(k => { if (save.hall.shown[k] === c.id) delete save.hall.shown[k]; });
    const e = Sh.deliver(save, c.id, Date.now()); if (e) { store(save); coins(); renderShop(); collects(o); toast('<b>To the Court · +' + o.pays.toLocaleString() + ' c</b><br>' + esc(e.line.replace(/"/g, ''))); Snd.play('coin'); }
  };
  $('courtKeep').onclick = () => {
    if (!confirm('Keep ' + MYTHICS[o.mythic].name + '? The Court won\'t ask for it again.')) return;
    save.order = null; save.orderNext = (save.clock || 0) + 240; store(save); renderShop();
  };
}

// ---------- THE HALL: the gallery's places ----------
let hallNote = '';
function renderHall() {
  const has = !!save.hall;
  $('viewHall').hidden = !has; $('tabHallBtn').hidden = !has;
  if (!has) return;
  Hl.tidy(save);
  const h = save.hall, spots = Rm.hallSpots(h), shown = Object.keys(h.shown || {}).length;
  $('hallWord').textContent = shown + ' OF ' + spots.length + ' · RENOWN +' + G.hallRenown(save) + ' · CHARM +' + G.hallCharm(save);
  $('hallSlots').innerHTML = spots.map((p, i) => {
    const id = (h.shown || {})[p.key], c = id && save.cards.find(x => x.id === id);
    return c ? '<button data-hp="' + i + '" aria-label="' + esc(c.name) + ', in the Hall">' + card(c, { short: true, price: (p.kind === 'plinth' ? 'ON A PLINTH' : 'IN A CASE') }) + '</button>'
      : '<button class="slot-empty" data-hp="' + i + '">' + (p.kind === 'plinth' ? 'A PLINTH' : 'A CASE') + '<br>' + (Hl.candidates(save).length ? 'TAP TO SHOW A PIECE' : 'OLD-BLOOD OR BETTER') + '</button>';
  }).join('');
  $('hallSlots').querySelectorAll('[data-hp]').forEach(b => b.onclick = () => hallPlaceOpen(+b.dataset.hp));
  const pc = FURNITURE.plinth.cost, cc = FURNITURE.hallcase.cost, nx = Rm.nextSize(h);
  $('hallPlinth').textContent = 'ANOTHER PLINTH · ' + pc + ' c'; $('hallPlinth').disabled = save.coins < pc;
  $('hallCase').textContent = 'A GLASS CASE · THREE PLACES · ' + cc + ' c'; $('hallCase').disabled = save.coins < cc;
  $('hallExpand').hidden = !nx; if (nx) { $('hallExpand').textContent = 'A BIGGER HALL · ' + nx.w + ' × ' + nx.d + ' · ' + nx.cost + ' c'; $('hallExpand').disabled = save.coins < nx.cost; }
  $('hallNote').textContent = hallNote;
}
function hallChanged() { store(save); coins(); renderShop(); if (dio && dioView === 'hall') { dio.setRoom(save.hall, save); dio.setShelf(standsFor()); } }
function hallPlaceOpen(i) {
  const p = Rm.hallSpots(save.hall)[i]; if (!p) return;
  const id = (save.hall.shown || {})[p.key], c = id && save.cards.find(x => x.id === id);
  if (c) {
    openLook(card(c), '<button class="seg" id="hallDown">TAKE IT DOWN · BACK TO THE BACK ROOM</button>', false, c);
    $('hallDown').onclick = () => { Hl.takeDown(save, p.key); $('look').hidden = true; hallChanged(); };
    return;
  }
  const can = Hl.candidates(save);
  if (!can.length) { hallNote = 'Nothing fit for the Hall in the back room: Old-Blood, a Relic or a Mythic.'; renderHall(); return; }
  openLook('<div class="pickgrid">' + can.map(x => '<button data-id="' + x.id + '" aria-label="' + esc(x.name) + '">' + card(x, { short: true }) + '</button>').join('') + '</div>', '<p>Show a piece in the Hall. It stays yours, off the shelves.</p>', true);
  $('lookCard').querySelectorAll('button').forEach(b => b.onclick = () => { if (Hl.show(save, p.key, b.dataset.id)) { hallNote = ''; Snd.play('chime'); } $('look').hidden = true; hallChanged(); });
}
$('hallPlinth').onclick = () => { const r = Rm.buy(save, 'plinth'); hallNote = r.why ? 'No plinth: ' + r.why + '.' : 'A new plinth.'; hallChanged(); };
$('hallCase').onclick = () => { const r = Rm.buy(save, 'hallcase'); hallNote = r.why ? 'No case: ' + r.why + '.' : 'A glass case: three places.'; hallChanged(); };
$('hallExpand').onclick = () => { if (Rm.expand(save, 'hall')) { hallNote = 'The Hall is bigger.'; hallChanged(); } };

// the notice board: today's wants in town
// the regulars and how far along their stories are
function regularsHtml() {
  const now = Date.now(), owns = p => PATTERNS[p] && Rm.owns(save, PATTERNS[p].station || 'forge');
  return '<div class="regulars"><h3 class="subhead">THE REGULARS</h3>' + STORIES.map(s => {
    const st = Sh.storyOf(save, s.id), done = st.step >= s.steps.length, step = s.steps[st.step];
    const dots = s.steps.map((_, i) => '<i class="' + (i < st.step ? 'on' : '') + '"></i>').join('');
    const first = s.after && Sh.storyOf(save, s.after).step < STORIES.find(x => x.id === s.after).steps.length;
    if (s.after && (first || G.rung(save) < s.rung) && !st.step) return '<div class="regular"><b>' + esc(Sh.storyWho(save, s)) + '</b><span class="dots"></span><span>A great story, after their first is told, when the shop is ' + RENOWN[s.rung].word + '.</span></div>';
    const word = done ? 'Their story is told. ' + (s.blueprint ? 'Their gift: the blueprint of ' + RELICS[s.blueprint].name + '.' : 'Their gift: ' + FURNITURE[s.gift].name + '.')
      : save.order && save.order.story === s.id ? 'Waiting on their order now.'
      : !step.patterns.some(owns) ? 'Needs what your shop can\'t make yet.'
      : (st.next || 0) > now ? 'Back in ' + hm((st.next - now) / 1000) + '.' : 'Could come in any time.';
    return '<div class="regular"><b>' + esc(Sh.storyWho(save, s)) + '</b><span class="dots">' + dots + '</span><span>' + word + '</span></div>';
  }).join('') + '</div>';
}
// ---------- MONSTERS: the threat on the board, the Watch's order, the night it comes ----------
function monsterHtml() {
  const now = Date.now(), m = save.monster, st = Mon.stageOf(save, now); if (!m || !st) return '';
  const k = Mon.kindOf(m);
  const huntLine = Mon.huntOpen(save, now) ? '<span class="hunt">' + (m.hunting ? 'Your runner is out after it.' : 'It can be hunted: send a runner on HUNT THE BEAST (STAFF), for a bounty, a trophy and ' + MATS[Mon.huntKind(save).mat].name + '.') + '</span>' : '';
  if (st === 'hunted') return '<div class="notice event"><b>BROUGHT DOWN</b><p>' + esc(k.name) + ': hunted down by your runner.</p><span>It won\'t trouble the town again. Its trophy is on your wall.</span></div>';
  if (st === 'kept') return '<div class="notice event"><b>THE WATCH HELD</b><p>' + esc(k.name) + ': driven off.</p><span>Armed with what you made, the Watch kept it off the lanes.</span>' + huntLine + '</div>';
  if (st === 'came') return '<div class="notice cold"><b>IT CAME</b><p>' + esc(k.name) + '.</p><span>' + esc(k.lines[2]) + ' The town is mending.</span>' + huntLine + '</div>';
  const left = Math.max(0, m.comes - now);
  return '<div class="notice hot monster"><b>' + (st === 'rumour' ? 'A RUMOUR' : 'SIGHTED') + ' · ' + esc(k.name.toUpperCase()) + '</b><p>' + esc(k.lines[st === 'rumour' ? 0 : 1]) + '</p>'
    + '<span>The Watch expects it in ' + hm(left / 1000) + '. Arm them in time and it\'s kept off the lanes (+' + k.renown + ' renown); each piece paid half again its worth. Short of it: damage to the shop, customers scared off, and every road twice as dangerous meanwhile.</span>' + huntLine
    + '<div class="watch">' + k.order.map((l, i) => { const need = Mon.lineLeft(save, i), have = Sh.inBack(save).filter(c => Mon.fitsLine(l, c)).length;
      return '<div class="wline' + (need ? '' : ' done') + '"><span>' + (l.n - need) + ' / ' + l.n + ' · ' + esc(l.word) + '</span>' + (need ? '<button class="seg" data-watch="' + i + '"' + (have ? '' : ' disabled') + '>GIVE TO THE WATCH' + (have ? ' · ' + have + ' IN THE BACK' : '') + '</button>' : '<b>✓</b>') + '</div>'; }).join('') + '</div></div>';
}
function watchOpen(i) {
  const l = Mon.kindOf(save.monster).order[i], fits = Sh.inBack(save).filter(c => Mon.fitsLine(l, c)).sort((a, b) => a.worth - b.worth);
  openLook('<div class="pickgrid">' + fits.map(c => '<button data-wgive="' + c.id + '" aria-label="' + esc(c.name) + '">' + card(c, { short: true, price: '+' + Math.round(c.worth * MONSTERS.pays) + ' c' }) + '</button>').join('') + '</div>',
    '<p>For the Watch: ' + esc(l.word) + '. Paid half again its worth.</p>', true);
  $('lookCard').querySelectorAll('[data-wgive]').forEach(b => b.onclick = () => {
    const r = Mon.give(save, i, b.dataset.wgive, Date.now()); if (!r.ok) { toast(esc(r.why)); return; }
    store(save); coins(); Snd.play('coin'); $('look').hidden = true;
    if (r.kept) { toast('<b>The Watch is armed</b><br>With what you made, they\'ll keep it off the lanes. +' + r.renown + ' renown.'); Snd.play('chime'); }
    renderShop();
  });
}
// the night it comes, when it does (while open or on return); and the threat first heard of
function monsterNight(r) {
  if (!r) return;
  toast('<b>' + esc(r.name) + '</b><br>' + esc(r.line) + ' Repairs: ' + r.bill + ' c' + (r.knocked.length ? '; ' + r.knocked.length + ' piece' + (r.knocked.length > 1 ? 's' : '') + ' knocked off a shelf (safe in the back room)' : '') + '.');
  Snd.play('bell'); store(save); coins(); if (screen === 'shop') renderShop();
}
const nightMonsterHtml = r => r ? '<p class="bad"><b>' + esc(r.name) + '.</b> ' + esc(r.line) + ' The repairs cost ' + r.bill + ' c' + (r.knocked.length ? ', and ' + r.knocked.map(esc).join(', ') + (r.knocked.length > 1 ? ' were' : ' was') + ' knocked off a shelf (safe in the back room)' : '') + '. Customers will be scarce for a while.' + (r.cut ? ' Your wards took ' + Math.round(r.cut * 100) + ' % off it.' : '') + '</p>' : '';

// ---------- A LIVING REACH: the season, market days, the guild fair, the word in town ----------
function livingHtml(t) {
  const now = Date.now(), s = Town.seasonOf(t.day), sd = Town.seasonDay(t.day), fairToday = Town.fairOn(t.day), entered = save.fairDay === t.day, last = (save.fairs || []).slice(-1)[0];
  const names = list => list.filter(id => PATTERNS[id]).map(id => PATTERNS[id].name.toLowerCase()).join(', ');
  let h = '<div class="notice season"><b>' + s.name.toUpperCase() + ' · DAY ' + (sd + 1) + ' OF ' + LIVING.seasonD + '</b><p>' + esc(s.line) + '</p><span>Fetching an eighth more: ' + esc(names(s.patterns)) + '.' + (s.gap < 1 ? ' More travellers.' : s.gap > 1 ? ' Fewer travellers.' : '') + '</span></div>';
  if (Town.marketOn(t.day)) h += '<div class="notice event"><b>MARKET DAY</b><p>Stalls in the square from first light.</p><span>Customers come more often today.</span></div>';
  if (fairToday) h += '<div class="notice event fair"><b>THE GUILD FAIR</b><p>The Reach\'s makers lay out their best.</p>'
    + (entered && last ? '<span>You entered ' + esc(last.name) + ': ' + ['', 'first place', 'second place', 'third place'][last.place] + (last.place > 3 ? 'no prize this time' : '') + '.</span>'
      : Liv.fairOpen(save, now) ? '<span>Enter one piece (it stays yours): judged against the Reach\'s makers, with a prize for the first three. Busy all day.</span><button class="seg go" id="toFair">ENTER THE GUILD FAIR</button>'
      : '<span>For a shop that is ' + RENOWN[LIVING.fair.rung].word + ' or better.</span>') + '</div>';
  else h += '<p class="note">The next guild fair is in ' + Liv.daysToFair(now) + ' days.</p>';
  h += '<div class="word"><b>THE WORD IN TOWN</b>' + Liv.rumours(save, now).map(x => '<p>' + esc(x) + '</p>').join('') + '</div>';
  return h;
}
function fairOpenDlg() {
  const pool = save.cards.filter(c => !c.sample).sort((a, b) => b.worth - a.worth).slice(0, 24);
  openLook('<div class="pickgrid">' + pool.map(c => '<button data-fair="' + c.id + '" aria-label="' + esc(c.name) + '">' + card(c, { short: true, price: 'ENTER IT' }) + '</button>').join('') + '</div>',
    '<p>Your best pieces, from the shelf, the back room, the wall or the Hall. It\'s judged on what it\'s worth, and it comes home with you.</p>', true);
  $('lookCard').querySelectorAll('[data-fair]').forEach(b => b.onclick = () => {
    const r = Liv.enterFair(save, b.dataset.fair, Date.now(), rng); if (!r.ok) { toast(esc(r.why)); return; }
    store(save); coins();
    openLook('<div class="away"><div class="k">THE GUILD FAIR</div><h3>' + (r.place <= 3 ? ['', 'First place', 'Second place', 'Third place'][r.place] : 'No prize this time') + '</h3><p>Your ' + esc(r.name) + ' against the Reach\'s makers:</p><ul>'
      + r.rivals.map(x => '<li><span>' + esc(x.who) + '</span><b>' + x.score.toLocaleString() + '</b></li>').join('') + '<li><span><b>You</b>: ' + esc(r.name) + '</span><b>' + r.worth.toLocaleString() + '</b></li></ul>'
      + (r.coins ? '<p>The prize: <b>' + r.coins.toLocaleString() + ' c</b> and <b>+' + r.renown + '</b> renown.</p>' : '<p>Next fair, bring something finer.</p>') + '</div>', '', true);
    if (r.place <= 3) { Snd.play('level'); Snd.play('chime'); }
    renderShop();
  });
}

// THE TOWN BOARD's notice for a pattern still to find (milestone 32): read, it goes in THE MAKER'S BOOK
function boardHtml(t) {
  const c = Disc.boardClue(save, t.day); if (!c) return '';
  if (Disc.noteClue(save, c, 'the town board', Date.now())) { store(save); tabBadges(); }
  return '<div class="notice"><b>ON THE BOARD</b><p>' + esc(c.line) + '</p><span>Something you don\'t make yet: it\'s in THE MAKER\'S BOOK. Try it at the ' + STATIONS[PATTERNS[c.pattern].station || 'forge'].name.toLowerCase() + '.</span></div>';
}
function renderTown() {
  const t = Town.refreshTown(save, Date.now()), n = Town.notices(t);
  const can = id => PATTERNS[id] && Rm.owns(save, PATTERNS[id].station || 'forge');
  const names = list => list.map(id => '<span class="' + (can(id) ? 'can' : 'cant') + '">' + PATTERNS[id].name.toLowerCase() + '</span>').join(', ');
  setTimeout(() => { if ($('toFair')) $('toFair').onclick = fairOpenDlg; }, 0);
  setTimeout(() => { $('townBody').querySelectorAll('[data-watch]').forEach(b => b.onclick = () => watchOpen(+b.dataset.watch)); }, 0);
  setTimeout(() => { if ($('toStar')) $('toStar').onclick = () => { const r = Trail.claimStar(save, Town.refreshTown(save, Date.now())); if (r.shard) { store(save); Snd.play('chime'); toast((r.shards.length > 1 ? '<b>Two shards of Veric</b><br>In the crater, cold to the touch: the shards of ' : '<b>A shard of Veric</b><br>In the crater, cold to the touch: the shard of ') + r.shards.map(id => esc(MYTHICS[id].name)).join(' and ') + '.'); } renderShop(); }; });
  $('townWord').textContent = new Date(t.day * 86400000).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).toUpperCase() + ' · ' + Town.seasonOf(t.day).name.toUpperCase();
  const ev = Town.eventOf(t);
  const star = ev && ev.id === 'starfall' && Trail.pending(save, 'star').length && save.starDay !== t.day;
  $('townBody').innerHTML = (ev ? '<div class="notice event"><b>TODAY IN TOWN</b><p>' + esc(ev.name) + '</p><span>' + esc(ev.line) + '</span><em>' + esc(ev.effect) + '</em>' + (star ? '<button class="seg go" id="toStar">GO OUT TO THE FALLEN STAR</button>' : '') + '</div>' : '') + n.hot.map(h => '<div class="notice hot"><b>IN DEMAND</b><p>' + esc(h.line) + '</p><span>' + names(h.patterns) + '</span></div>').join('')
    + (n.cold ? '<div class="notice cold"><b>OUT OF FAVOUR</b><p>' + esc(n.cold.line) + '</p><span>' + names(n.cold.patterns) + '</span></div>' : '')
    + livingHtml(t)
    + monsterHtml()
    + (save.gang && Date.now() < save.gang.until ? '<div class="notice hot"><b>A RUMOUR</b><p>' + esc(save.gang.name.replace(/^./, c => c.toUpperCase())) + ' are working the lanes.</p><span>Lock up at night (STAFF › THE NIGHT).</span></div>' : '')
    + boardHtml(t)
    + regularsHtml()
    + '<p class="note">In demand: buyers ask for it more often, are keener, and carry a quarter more for it (DEAR sells). Out of favour: no one asks for it and purses for it are thinner. The board changes every day at midnight (UTC), the same in every shop. Struck through: a station you haven\'t set up.</p>';
}
const HOW = { meet: 'MET THEM', hold: 'HELD THE PRICE', ask: 'ASKED MORE', counter: 'THEIR OFFER', split: 'MET HALFWAY', order: 'SPECIAL ORDER' };
const howWord = t => TAGS[t] ? TAGS[t].word : HOW[t] || '';
function renderShop() {
  if (screen !== 'shop') return;
  if (cvw && !iso) cvw.show(save, Sh.priceAt);
  nineMarks(); if (dio) dio.setCold(Wear.isBroken(save, 'forge', Date.now()));
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
  fillBtn($('fillShelf'), save);
  renderShelfUps();
  const cost = Rm.shelfCost(save.room);
  $('buySlot').hidden = cost == null;
  if (cost != null) { $('buySlot').textContent = 'ANOTHER SHELF · TWO PLACES · ' + cost + ' COINS'; $('buySlot').disabled = save.coins < cost; }
  renderFurnish(); renderWall(); renderTown(); renderHall(); tabBadges();
  if (dio) dio.setShelf(standsFor());
  const back = Sh.inBack(save);
  $('backWord').textContent = back.length + (back.length === 1 ? ' PIECE' : ' PIECES') + ' · NOT FOR SALE YET';
  $('back').innerHTML = back.length ? back.map(c => '<button data-id="' + c.id + '"' + (c.keep ? ' class="kept"' : '') + ' aria-label="' + esc(c.name) + (c.keep ? ', kept' : '') + '">' + card(c, { short: true }) + '</button>').join('')
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
// FILL FROM THE BACK: every empty place, best piece first, at FAIR (Relics, Mythics and a piece ready for its Relic stay back)
function fillBtn(b, s) {
  const empty = s.shelf.filter(e => !e).length, can = Sh.inBack(s).filter(c => !Sh.keepBack(s, c) && !c.keep && (!c.sample || s.made)).length;
  b.hidden = !empty; b.disabled = !can;
  b.textContent = can ? 'FILL FROM THE BACK · ' + Math.min(empty, can) + (Math.min(empty, can) === 1 ? ' PIECE' : ' PIECES') : 'NOTHING IN THE BACK TO PUT UP';
}
$('fillShelf').onclick = () => { if (Sh.fillShelf(save).length) { store(save); Snd.play('chime'); } renderShop(); };
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
    $('lookCard').querySelectorAll('button').forEach(b => b.onclick = () => { if (!keepsNine(save.cards.find(x => x.id === b.dataset.id), 'On the shelf, anyone may buy it')) return; Sh.place(save, b.dataset.id, slot); store(save); $('look').hidden = true; renderShop(); });
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
// a Rare piece that can't go toward Old-Blood yet: what it lacks
// a Rare or Old-Blood piece whose kind has a Relic (milestone 34: a Rare too): the Relic working, or what it still needs
function mythicActs(c) {
  const g = Sh.mythicFor(save, c); if (!g.mythic) return '';
  const m = MYTHICS[g.mythic];
  if (g.made) return '';
  if (!g.ok) return '<p class="note"><b style="color:var(--t-mythic)">TOWARD THE NINE · ' + esc(m.name.toUpperCase()) + '</b> · it needs ' + g.why.join(', ') + '.</p>';
  const cost = Sh.mythicCost(c, g.mythic), have = Sh.canMake(save.mats, cost);
  return '<button class="seg go" data-mythic="' + g.mythic + '"' + (have ? '' : ' disabled') + '>THE MYTHIC WORKING · ' + esc(m.name.toUpperCase()) + ' · ' + cost.map(x => MATS[x.mat].name + ' × ' + x.n).join(', ') + '</button>';
}
function toMythic(id, mythic) {
  const c = save.cards.find(x => x.id === id); if (!c || !Sh.mythicFor(save, c).ok) return;
  rw = { id, from: TIERS.findIndex(t => t.id === c.tier), mythic }; part = null; pat = c.pattern; $('look').hidden = true; toPrepare();
}
// a Relic one of the Nine still grows from: asked first before it goes on a shelf or to an order (milestone 34)
function keepsNine(c, doing) {
  const m = Sh.mythicAtStake(save, c); if (!m) return true;
  return confirm(c.name + ' is the Relic ' + MYTHICS[m].name + ' grows from. ' + doing + ', and once it\'s sold it\'s gone for good, and that one of the Nine with it. Go ahead?');
}
const nineNote = c => Sh.mythicAtStake(save, c) ? '<p class="note"><b style="color:var(--t-mythic)">KEEP IT FOR THE NINE</b> · ' + esc(MYTHICS[Sh.mythicAtStake(save, c)].name) + ' grows from it. Sold, it\'s gone for good, and that one of the Nine with it.</p>' : '';
function relicActs(c) {
  if (c.tier === 'relic') return nineNote(c) + mythicActs(c);
  const g = Sh.relicFor(save, c); if (!g.relic) return '';
  const r = RELICS[g.relic];
  if (g.made) return '<p class="note">' + esc(r.name) + ' is made already: there\'s only one.</p>';
  if (!g.ok) return '<p class="note"><b style="color:var(--t-relic)">TOWARD A RELIC · ' + esc(r.name.toUpperCase()) + '</b> · it needs ' + g.why.join(', ') + '.</p>';
  const cost = Sh.relicCost(c, g.relic), have = Sh.canMake(save.mats, cost);
  return '<button class="seg go" data-relic="' + g.relic + '"' + (have ? '' : ' disabled') + '>THE RELIC WORKING · ' + esc(r.name.toUpperCase()) + ' · ' + cost.map(x => MATS[x.mat].name + ' × ' + x.n).join(', ') + '</button>'
    + (have ? '' : '<p class="note">You have ' + cost.map(x => (save.mats[x.mat] || 0) + ' ' + MATS[x.mat].name.toLowerCase()).join(', ') + '.</p>');
}
function toRelic(id, relic) {
  const c = save.cards.find(x => x.id === id);
  if (!c || !Sh.relicFor(save, c).ok) return;
  rw = { id, from: TIERS.findIndex(t => t.id === c.tier), relic }; pat = c.pattern;
  $('look').hidden = true; toPrepare();
}
function oldBloodNeeds(c) {
  const g = R.oldBloodGate(c, levelFor(c.pattern).level);
  if (g.ok || /^brews/.test(g.why[0] || '')) return '';
  return '<p class="note"><b style="color:var(--t-oldblood)">TOWARD OLD-BLOOD</b> · a master\'s last working. It needs ' + g.why.join(', ') + '.</p>';
}
// a copy kept from a friend's flyer: it can go on a shelf (once your first piece is made) and sell, nothing more
function sampleOpen(c) {
  const free = save.shelf.findIndex(e => !e), id = c.id;
  const acts = '<p>A copy from ' + esc(c.flyer || 'a friend') + '\'s flyer. It sells as a plain one of its kind would; it can\'t be reworked, broken down or hung.</p>'
    + (!save.made ? '<p>It waits here until you make your first piece at the forge.</p>'
      : free >= 0 ? '<button class="seg go" id="putUp">PUT IT ON THE SHELF · FAIR ' + Sh.priceAt(c, 'fair') + ' c</button>' : '<p>The shelf is full. Take something down, or buy another shelf.</p>');
  openLook(card(c), acts, false, null);
  if ($('putUp')) $('putUp').onclick = () => { if (!keepsNine(save.cards.find(x => x.id === id), 'On the shelf, anyone may buy it')) return; Sh.place(save, id, free); store(save); $('look').hidden = true; renderShop(); };
}
function backOpen(id) {
  const c0 = save.cards.find(x => x.id === id);
  if (c0 && c0.sample) { sampleOpen(c0); return; }
  const c = c0, free = save.shelf.findIndex(e => !e);
  const sv = Sh.salvageOf(c), cost = Sh.reworkCost(c), canRw = Sh.canRework(save, c) && Rm.owns(save, R.stationOf(c.pattern).id), haveRw = Sh.canMake(save.mats, cost);
  const toTier = TIERS[R.reworkTo(TIERS.findIndex(t => t.id === c.tier))];
  let acts = c.tier === 'mythic' ? '<p>One of the Nine isn\'t for ordinary buyers: the Court asks for it, once. Show it in the Hall, or hang it.</p>'
    : free >= 0 ? '<button class="seg go" id="putUp">PUT IT ON THE SHELF · FAIR ' + Sh.priceAt(c, 'fair') + ' c</button>' : '<p>The shelf is full. Take something down, or buy another shelf.</p>';
  acts += (save.wall || []).length < G.wallSlots(save) ? '<button class="seg" id="hangIt">HANG IT ON THE WALL</button>' : '';
  if (St.clerkOf(save) && c.tier !== 'mythic') acts += Sh.restockable(save, { ...c, keep: false }) ? '<button class="seg" id="keepIt" aria-pressed="' + !!c.keep + '">' + (c.keep ? 'KEPT · THE CLERK WON\'T PUT IT OUT · UNDO' : 'KEEP IT · THE CLERK WON\'T PUT IT OUT') + '</button>'
    : '<p class="note">The clerk never puts out a ' + (TIERS.find(t => t.id === c.tier) || {}).name + ' piece: only you do.</p>';
  if (save.order && Sh.fills(save.order, c)) acts += '<button class="seg go" id="deliverIt">DELIVER TO ' + esc(save.order.who.toUpperCase()) + ' · ' + save.order.pays + ' c</button>';
  acts += '<div class="row2">'
    + (canRw ? '<button class="seg" id="reworkIt"' + (haveRw ? '' : ' disabled') + '>' + R.stationOf(c.pattern).again + ' · TO ' + toTier.name.toUpperCase() + ' · ' + cost.map(r => MATS[r.mat].name + ' × ' + r.n).join(', ') + '</button>' : '')
    + (Disc.canStudy(save, c) ? '<button class="seg go" id="studyIt">STUDY IT · LEARN THE ' + PATTERNS[c.pattern].name.toUpperCase() + '</button>' : '')
    + (c.relic ? '' : '<button class="seg" id="breakIt">BREAK IT DOWN · ' + (sv.length ? sv.map(r => MATS[r.mat].name + ' × ' + r.n).join(', ') : 'nothing worth keeping') + '</button>') + '</div>'
    + (canRw && !haveRw ? '<p>Back in the fire takes ' + cost.map(r => MATS[r.mat].name + ' × ' + r.n).join(', ') + '. You have ' + cost.map(r => (save.mats[r.mat] || 0) + ' ' + MATS[r.mat].name.toLowerCase()).join(', ') + '.</p>' : '')
    + (c.tier === 'rare' && !canRw && Rm.owns(save, R.stationOf(c.pattern).id) ? oldBloodNeeds(c) : '')
    + relicActs(c);
  openLook(card(c), acts, false, c);
  if ($('hangIt')) $('hangIt').onclick = () => { if (G.hang(save, id)) { store(save); $('look').hidden = true; renderShop(); } };
  if ($('putUp')) $('putUp').onclick = () => { if (!keepsNine(save.cards.find(x => x.id === id), 'On the shelf, anyone may buy it')) return; Sh.place(save, id, free); store(save); $('look').hidden = true; renderShop(); };
  if ($('keepIt')) $('keepIt').onclick = () => { c.keep = !c.keep; if (!c.keep) delete c.keep; store(save); backOpen(id); renderShop(); };
  if ($('deliverIt')) $('deliverIt').onclick = () => { const o = save.order; if (!keepsNine(save.cards.find(x => x.id === id), 'It goes to ' + o.who)) return; { const e = Sh.deliver(save, id, Date.now()); if (e) { store(save); coins(); $('look').hidden = true; renderShop(); filledToast(o, e); } } };
  if ($('reworkIt')) $('reworkIt').onclick = () => toRework(id);
  const rb = $('lookActs').querySelector('[data-relic]'); if (rb) rb.onclick = () => toRelic(id, rb.dataset.relic);
  const mb = $('lookActs').querySelector('[data-mythic]'); if (mb) mb.onclick = () => toMythic(id, mb.dataset.mythic);
  if ($('studyIt')) $('studyIt').onclick = () => {
    if (!confirm('Study the ' + c.name + '? You take it apart to see how it was made (it gives ' + (sv.length ? sv.map(r => MATS[r.mat].name + ' × ' + r.n).join(', ') : 'nothing worth keeping') + ') and learn the ' + PATTERNS[c.pattern].name.toLowerCase() + '.')) return;
    const got = Disc.study(save, id);
    if (got) { store(save); Snd.play('level'); $('look').hidden = true; renderShop(); toast('<b>A new pattern: the ' + esc(PATTERNS[got].name) + '</b><br>Taken apart and learned. It\'s under THE FORGE › PATTERNS.'); }
  };
  if ($('breakIt')) $('breakIt').onclick = () => {
    if (!confirm('Break down the ' + c.name + ' (worth ' + c.worth + ' c)? It gives ' + (sv.length ? sv.map(r => MATS[r.mat].name + ' × ' + r.n).join(', ') : 'nothing worth keeping') + '. It can\'t be undone.')) return;
    if (Sh.salvage(save, id)) { store(save); $('look').hidden = true; renderShop(); }
  };
}

// ---------- STAFF ----------
const hm = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + ' h ' + m + ' min' : m ? m + ' min' : s + ' s'; };
// ---------- THE BANK ----------
let bankTick = 0, bankNote = '';
const cn = n => Math.round(n).toLocaleString() + ' c';
function bookLine(line) { const b = Bank.bankOf(save); b.log = [{ at: Date.now(), line }].concat(b.log || []).slice(0, 14); }
// the week's end while the game is open: the letter, in the book and a toast
function bankWeek(now) {
  const w = Bank.weekly(save, now); if (!w) return;
  const bits = [];
  if (w.earned) bits.push('the account earned ' + cn(w.earned));
  if (w.interest) bits.push(w.unpaid ? 'the loan\'s ' + cn(w.interest) + ' was short by ' + cn(w.unpaid) + ': it and a fee of ' + cn(w.fee) + ' went onto the loan' : 'the loan\'s interest, ' + cn(w.interest) + ', was paid');
  if (w.bailiff) bits.push(w.bailiff.took.length ? 'the bailiff came and took ' + w.bailiff.took.map(t => t.name).join(', ') + ', ' + cn(w.bailiff.got) + ' off the loan, and the town talks' : 'the bailiff came, found the shelves bare, and the town talks');
  const line = 'A week: ' + bits.join('; ') + '.';
  bookLine(line); store(save); coins();
  toast('<b>' + (w.bailiff ? 'The bailiff' : w.unpaid ? 'A letter from the bank' : 'The bank\'s week') + '</b><br>' + esc(line));
  if (w.unpaid || w.bailiff) { $('navBank').hidden = false; Snd.play('bell'); }
  if (screen === 'bank') renderBank(); else if (screen === 'shop' && w.bailiff) renderShop();
}
function toBank() { clearTimers(); S = null; show('bank'); coins(); $('navBank').hidden = true; bankNote = ''; renderBank(); }
function renderBank() {
  if (screen !== 'bank') return;
  const b = Bank.bankOf(save), lim = Bank.limitOf(save), now = Date.now(), until = b.due ? Math.max(0, b.due - now) : 0;
  const days = ms => { const d = Math.ceil(ms / 86400000); return d <= 1 ? 'within a day' : 'in ' + d + ' days'; };
  $('bankTally').innerHTML = 'In the bank <b>' + cn(b.deposit) + '</b>' + (b.loan ? '<br>Owed <b>' + cn(b.loan) + '</b>' : '');
  $('bankDep').textContent = cn(b.deposit);
  $('bankDepWord').textContent = 'Coin in the bank can\'t be stolen. It earns 1 % a week, up to 400 c, for each week the game is open at the week\'s end: a long time away counts as one week.'
    + (b.deposit ? ' This week: +' + cn(Bank.depositEarns(save)) + ', ' + days(until) + '.' : '');
  $('bankLoan').textContent = b.loan ? cn(b.loan) + ' OWED' : lim ? 'UP TO ' + cn(lim) : 'NOT YET';
  $('bankLoanWord').textContent = !lim && !b.loan ? 'The bank lends to a shop that is ' + Bank.lendsFrom() + ' or better: from 1,000 c, up to 40,000 c OF THE REACH.'
    : (b.loan ? 'You owe ' + cn(b.loan) + '. Interest is 5 % a week: ' + cn(Bank.interestDue(save)) + ' ' + days(until) + ', from your purse, then your account. Short of it, the unpaid part and a fee go onto the loan; miss twice and the bailiff takes pieces from the shelves (never a Relic or a Mythic). Like the account, a week only counts when the game is open. '
      : 'Borrow up to ' + cn(lim) + ' at your renown. Interest is 5 % a week, only for weeks the game is open. Repay any time. ')
      + (b.missed ? 'One payment is behind: the next missed brings the bailiff.' : b.loan ? 'You can borrow ' + cn(Bank.canBorrow(save)) + ' more.' : '');
  $('bankLoanWord').classList.toggle('bad', !!b.missed);
  $('bankBorrow').disabled = !Bank.canBorrow(save); $('bankRepay').disabled = $('bankRepayAll').disabled = !b.loan || !save.coins;
  $('bankOut').disabled = !b.deposit; $('bankIn').disabled = $('bankAll').disabled = !save.coins;
  $('bankGentle').textContent = save.gentle ? 'ON' : 'OFF';
  $('bankGentleWord').textContent = 'Hard times are coming to the Reach: thieves, monsters, a forge that wears out, danger on the road. They come with warnings, and what\'s lost can be won back. '
    + (save.gentle ? 'This save is spared them.' : 'This save will face them. Turn the gentler Reach on and it\'s spared.');
  $('bankGentleBtn').textContent = save.gentle ? 'LET THE REACH IN' : 'SPARE THIS SAVE';
  $('bankBook').innerHTML = (b.log || []).length ? b.log.map(e => '<li><span class="ln">' + new Date(e.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' · ' + esc(e.line) + '</span></li>').join('') : '<li class="empty">Nothing yet.</li>';
  $('bankNote').textContent = bankNote;
}
const bankN = id => Math.floor(+$(id).value || 0);
function bankDo(r, line) { bankNote = r.why ? 'Not done: ' + r.why + '.' : ''; if (r.ok) { bookLine(line(r.n)); store(save); coins(); Snd.play('coin'); } renderBank(); }
$('bankIn').onclick = () => bankDo(Bank.deposit(save, bankN('bankDepN'), Date.now()), n => 'Put in ' + cn(n) + '.');
$('bankAll').onclick = () => bankDo(Bank.deposit(save, save.coins, Date.now()), n => 'Put in ' + cn(n) + ', the whole purse.');
$('bankOut').onclick = () => bankDo(Bank.withdraw(save, bankN('bankDepN') || Bank.bankOf(save).deposit), n => 'Took out ' + cn(n) + '.');
$('bankBorrow').onclick = () => { const n = bankN('bankLoanN'); if (n > 0 && !confirm('Borrow ' + cn(n) + '? Interest is ' + cn(Math.ceil(n * 0.05)) + ' a week until it\'s repaid.')) return; bankDo(Bank.borrow(save, n, Date.now()), m => 'Borrowed ' + cn(m) + '.'); };
$('bankRepay').onclick = () => bankDo(Bank.repay(save, bankN('bankLoanN')), n => 'Repaid ' + cn(n) + '.');
$('bankRepayAll').onclick = () => bankDo(Bank.repay(save, Bank.bankOf(save).loan), n => 'Repaid ' + cn(n) + (Bank.bankOf(save).loan ? '' : ': the loan is cleared') + '.');
$('bankGentleBtn').onclick = () => {
  if (!save.gentle && !confirm('Spare this save from thieves, monsters, wear and danger on the road?')) return;
  if (save.gentle && !confirm('Let the Reach in? Thieves, monsters, wear and danger on the road will come, with warnings, after a week.')) return;
  save.gentle = !save.gentle; if (!save.gentle) save.threatsFrom = Math.max(save.threatsFrom || 0, Date.now() + 7 * 86400000);
  bookLine(save.gentle ? 'The gentler Reach: this save is spared.' : 'The Reach let in: hard times from a week on.'); store(save); renderBank();
};

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
// the apprentice's card (milestone 36): what's next at the bench, what they're set to, their trades
// "a dagger", "an axe", "arrows": the article a piece's name takes
const aOf = n => /s$/i.test(n) ? '' : /^[aeiou]/i.test(n) ? 'an ' : 'a ';
function apprenticeHtml(p, now) {
  const n = Ap.next(save, p, now), left = Math.max(0, Ap.minutesEach(p) * 60 - (p.benchT || 0));
  const ids = Object.keys(PATTERNS).filter(id => Sh.knows(save, id) && !PATTERNS[id].makes && Rm.owns(save, PATTERNS[id].station || 'forge') && !/rare thing/.test(Ap.gate(save, id, now).why || ''));
  const opt = (v, w) => '<option value="' + v + '"' + ((p.bench || '') === v ? ' selected' : '') + '>' + w + '</option>';
  const sk = Ap.skills(p).slice(0, 6).map(x => esc(PATTERNS[x.id].name) + ' ' + x.level).join(' · ');
  return '<div class="status' + (n.id && !save.unpaid ? '' : ' bad') + '">' + (save.unpaid ? 'Wages behind: they\'ve stopped work until they\'re paid.'
      : n.id ? 'At the bench: next, ' + aOf(PATTERNS[n.id].name) + '<b>' + esc(PATTERNS[n.id].name.toLowerCase()) + '</b> in ' + hm(left) + '.' : 'Idle (' + esc(n.why) + ').') + '</div>'
    + '<label class="tryrole"><span>AT THE BENCH</span><select data-bench="' + p.id + '">' + opt('', 'WHAT\'S SHORT') + opt('rest', 'REST')
    + ids.map(id => opt(id, esc(PATTERNS[id].name) + ' · trade ' + Ap.skillOf(p, id))).join('') + '</select></label>'
    + '<div class="rbtns left"><button class="seg' + (Ap.buys(p) ? ' go' : '') + '" data-buys="' + p.id + '" aria-pressed="' + Ap.buys(p) + '">BUYS WHAT\'S SHORT · ' + (Ap.buys(p) ? 'ON' : 'OFF') + '</button></div>'
    + '<div class="status small">WHAT\'S SHORT: the pattern fewest of in the back, never more than ' + APPRENTICE.most + ' of a kind waiting. A piece every ' + Ap.minutesEach(p) + ' minutes of the shop\'s clock, here or while you\'re away: Common, Fine now and then, from common things in the back (never a rare thing or a relic material)' + (Ap.buys(p) ? ', buying what\'s short while ' + APPRENTICE.keep + ' c stays in the purse' + (p.spent ? ' (spent ' + p.spent + ' c so far)' : '') : '') + '. '
    + 'Their trade' + (sk ? ': ' + sk : ': nothing yet') + '. They learn twice as fast while you work a piece yourself, and never pass trade ' + APPRENTICE.top + '. Made <b>' + (p.made || 0) + '</b>.</div>';
}
function renderStaff() {
  if (screen !== 'staff') return;
  const now = Date.now(), staff = save.staff || [];
  $('staffTally').innerHTML = 'Wages <b>' + St.wages(save) + ' c</b> an hour<br>Kept <b>' + St.awayCap(save) + ' h</b> while you\'re away';
  $('booksWord').textContent = staff.length ? staff.length + ' OF ' + Object.keys(ROLES).filter(r => !ROLES[r].rung || G.rung(save) >= ROLES[r].rung).reduce((a, r) => a + St.roleCap(save, r), 0) : 'NO ONE YET';
  renderNight();
  $('staffList').innerHTML = staff.length ? staff.map(p => {
    let status = '';
    if (save.unpaid && p.role === 'runner') status = '<div class="status bad">Wages behind: won\'t set out until they\'re paid.</div>';
    else if (p.role === 'guard') status = '<div class="status">Keeps the shop at night: turns most thieves away, and catches some. See THE NIGHT.</div>';
    else if (p.role === 'clerk') status = '<div class="status">Minds the shop while you\'re at the forge (customers buy more readily) and keeps it while you\'re away.</div>'
      + '<div class="rbtns left"><button class="seg' + (p.restock !== false ? ' go' : '') + '" data-restock="' + p.id + '" aria-pressed="' + (p.restock !== false) + '">RESTOCKS THE SHELF · ' + (p.restock !== false ? 'ON' : 'OFF') + '</button></div>'
      + '<div class="status small">' + (p.restock !== false ? (p.trait === 'tidy' ? 'Tidy: fills every empty place from the back as customers come in, and' : 'Fills') + ' a place they sell from with a piece from the back: the same kind first, then the cheapest. Never a Rare or better, or one you\'ve marked KEEP.' : 'They leave the shelf to you.') + '</div>';
    else if (p.role === 'apprentice') status = apprenticeHtml(p, now);
    else if (p.role === 'runner' && Run.hurtNow(p, now)) status = gearHtml(p) + '<div class="status bad">Hurt, resting: back on their feet in ' + hm((p.hurt - now) / 1000) + '.</div>';
    else if (p.trip) status = (p.role === 'runner' ? gearHtml(p) : '') + '<div class="status">' + ROUTES[p.trip.route].name + ' · back in <b data-back="' + p.trip.back + '">' + hm((p.trip.back - now) / 1000) + '</b></div>';
    else status = gearHtml(p) + '<div class="status">Ready to go out. Send them on a road:</div><div class="routes">' + Object.entries(ROUTES).filter(([id, r]) => (!r.hunt || (Run.huntOpen(save, now) && !save.robbery.hunting)) && (!r.beast || (Mon.huntOpen(save, now) && !save.monster.hunting))).map(([id, r]) =>
      '<button class="seg" data-send="' + id + '" data-who="' + p.id + '"' + (save.coins < r.fee || (r.rung && G.rung(save) < r.rung) ? ' disabled' : '') + '><span>' + r.name + '</span>' + riskBadge(p, id, now) + '<small>' + (r.rung && G.rung(save) < r.rung ? 'opens when the shop is ' + RENOWN[r.rung].word + ' · ' : '') + hm(St.tripHours(p, id) * 3600) + ' · ' + r.fee + ' c' + (r.beast ? ' · after ' + esc(Mon.kindOf(save.monster).name.toLowerCase()) + ': brought down ' + pct(Run.beastOdds(save, p)) + ' of the time · a bounty, a trophy, ' + MATS[Mon.huntKind(save).mat].name + ' · dangerous' : '') + (r.hunt ? ' · after ' + esc(save.robbery.gang) + ': ' + save.robbery.took.map(c => esc(c.name)).join(', ') + ' back, and a bounty, if they catch them · dangerous' : r.relic ? ' · relic materials, maybe · it can come back empty' : r.rare ? ' · rare things' : '') + (r.tile ? ' · a found tile, maybe' : '') + '</small></button>').join('') + '</div>';
    return '<div class="person">' + personHtml(p, true) + status + '<div class="rbtns left"><button class="seg" data-letgo="' + p.id + '">LET THEM GO</button></div></div>';
  }).join('') + memorialHtml() : '<div class="empty">No one works here but you. A clerk keeps the shop while you\'re away; a runner goes out for materials. See who\'s <button class="linkish" data-tabjump="hire">looking for work</button>.</div>' + memorialHtml();
  const cands = St.candidates(save, hour()), mins = 60 - new Date().getMinutes();
  $('candsWord').textContent = 'NEW FACES IN ' + mins + ' MIN';
  $('cands').innerHTML = cands.length ? cands.map(c => {
    const has = !St.canHireRole(save, c.role), fee = St.hireFee(c), nx = c.role === 'runner' && St.nextRunner(save);
    const why = c.role !== 'runner' ? 'You have ' + (/^[aeiou]/i.test(ROLES[c.role].word) ? 'an ' : 'a ') + ROLES[c.role].word.toLowerCase() + ' already.'
      : 'You have ' + (St.runnerCap(save) === 1 ? 'a runner' : St.runnerCap(save) + ' runners') + ' already' + (nx ? ': ' + (nx.n === 2 ? 'a second' : 'a third') + ' when the shop is ' + nx.word + '.' : ', as many as a shop takes on.');
    return '<div class="person">' + personHtml(c, false) + '<div class="tr">' + ROLES[c.role].line + '</div><div class="rbtns left"><button class="seg go" data-hire="' + c.id + '"' + (has || save.coins < fee ? ' disabled' : '') + '>HIRE · ' + fee + ' c</button></div>'
      + (has ? '<div class="status">' + why + '</div>' : '') + '</div>';
  }).join('') : '<div class="empty">No one else this hour.</div>';
  $('vStaff').querySelectorAll('[data-tabjump]').forEach(b => b.onclick = () => openTab('staff', b.dataset.tabjump));
  tabBadges();
  $('vStaff').querySelectorAll('[data-hire]').forEach(b => b.onclick = () => { const c = cands.find(x => x.id === b.dataset.hire); if (St.hire(save, c)) { store(save); coins(); renderStaff(); } });
  $('vStaff').querySelectorAll('[data-send]').forEach(b => b.onclick = () => {
    const p = St.runners(save).find(x => x.id === b.dataset.who), route = b.dataset.send, k = p && Run.risk(save, p, route, Date.now());
    const lv = p && Run.riskLevel(save, p, route, Date.now());
    if (k && (k.die || lv.word === 'HIGH') && !confirm(ROUTES[route].name + ' is ' + lv.word.toLowerCase() + ' risk. ' + p.name + ' could be hurt (' + pct(k.hurt) + ')' + (k.die ? ' or killed (' + pct(k.die) + ')' : '') + '. Armour, a weapon and potions you give them make it safer. Send them?')) return;
    if (p && St.sendRunner(save, route, Date.now(), p.id)) { store(save); coins(); renderStaff(); }
  });
  $('vStaff').querySelectorAll('[data-gear]').forEach(b => b.onclick = () => gearOpen(b.dataset.gear, b.dataset.gwho));
  $('vStaff').querySelectorAll('[data-bench]').forEach(b => b.onchange = () => { const p = staff.find(x => x.id === b.dataset.bench); if (!p) return; if (b.value) p.bench = b.value; else delete p.bench; store(save); renderStaff(); });
  $('vStaff').querySelectorAll('[data-buys]').forEach(b => b.onclick = () => { const p = staff.find(x => x.id === b.dataset.buys); if (!p) return; if (p.buys === false) delete p.buys; else p.buys = false; store(save); renderStaff(); });
  $('vStaff').querySelectorAll('[data-restock]').forEach(b => b.onclick = () => { const p = staff.find(x => x.id === b.dataset.restock); if (!p) return; if (p.restock === false) delete p.restock; else p.restock = false; store(save); renderStaff(); });
  $('vStaff').querySelectorAll('[data-letgo]').forEach(b => b.onclick = () => {
    const p = staff.find(x => x.id === b.dataset.letgo);
    if (!confirm('Let ' + p.name + ' go?' + (p.trip ? ' They\'re on the road: what they bring back is lost.' : ''))) return;
    St.letGo(save, p.id); store(save); renderStaff();
  });
}

// ---------- THE RUNNER'S GEAR: what you made, carried on the road ----------
const pct = x => (x >= 0.01 ? Math.round(x * 100) : Math.round(x * 1000) / 10) + ' %';
function gearHtml(p) {
  if (p.role !== 'runner') return '';
  const g = Run.gearOf(p), pots = Run.potionsOf(p), s = Run.strength(p), now = Date.now(), k = Run.riskLevel(save, p, 'below', now);
  const slot = k2 => '<button class="gslot' + (g[k2] ? ' on' : '') + '" data-gwho="' + p.id + '" data-gear="' + k2 + '" style="' + (g[k2] ? '--tc:var(--t-' + g[k2].tier + ')' : '') + '"><small>' + GEAR.slotWord[k2] + '</small><b>' + (g[k2] ? esc(g[k2].name) : '+') + '</b></button>';
  const pot = i => '<button class="gslot pot' + (pots[i] ? ' on' : '') + '" data-gwho="' + p.id + '" data-gear="pot' + i + '"><small>POTION</small><b>' + (pots[i] ? esc(pots[i].name) : '+') + '</b></button>';
  return '<div class="gear">' + Object.keys(GEAR.slots).map(slot).join('') + pot(0) + pot(1) + '</div>'
    + '<div class="status small">Guard <b>' + s.guard + '</b> · fight <b>' + s.fight + '</b>' + (k.spared ? ' · the gentler Reach: no road is dangerous' : ' · this gear takes every road\'s risk down <b>' + Math.round(k.cut * 100) + ' %</b>') + (Run.huntOpen(save, now) ? ' · after the gang: caught ' + pct(Run.huntOdds(save, p)) : '') + '</div>';
}
// the ones who didn't come back
const trophyHtml = () => Mon.trophiesOf(save).length ? '<div class="memorial trophies"><b>TROPHIES</b>' + Mon.trophiesOf(save).map(t => '<span><i>' + esc(t.name) + '</i> · ' + esc(t.lore) + ' ' + new Date(t.at).toLocaleDateString(undefined, { day: 'numeric', month: 'long' }) + '</span>').join('') + '</div>' : '';
const memorialHtml = () => trophyHtml() + ((save.memorials || []).length ? '<div class="memorial"><b>REMEMBERED</b>' + save.memorials.map(m => '<span>' + esc(m.name) + ', lost ' + esc(m.where) + ', ' + new Date(m.at).toLocaleDateString(undefined, { day: 'numeric', month: 'long' }) + '</span>').join('') + '</div>' : '');
// a road's risk, as the runner is kitted now (and what it would be bare, if gear brings it down)
function riskBadge(p, route, now) {
  const k = Run.riskLevel(save, p, route, now); if (k.spared) return '<em class="risk risk-none">NO RISK</em>';
  return '<em class="risk risk-' + k.cls + '">RISK ' + k.word + (k.bare !== k.word ? ' <s>' + k.bare + '</s>' : '') + '</em><em class="riskn">hurt ' + pct(k.hurt) + (k.die ? ' · killed ' + pct(k.die) : '') + '</em>';
}
function gearOpen(which, who) {
  const p = St.runners(save).find(x => x.id === who) || St.runnerOf(save); if (!p) return;
  if (p.trip) { toast('<b>' + esc(p.name) + ' is on the road</b><br>Their gear goes with them.'); return; }
  const isPot = which.startsWith('pot'), i = isPot ? +which.slice(3) : -1, g = Run.gearOf(p), pots = Run.potionsOf(p);
  const now = isPot ? pots[i] : g[which];
  const fits = Sh.inBack(save).filter(c => !c.sample && (isPot ? Run.isPotion(c) : Run.slotOf(c) === which)).sort((a, b) => b.worth - a.worth);
  const lead = isPot ? '<p>A bottle from a batch you brewed. ' + ({ salve: 'A salve heals a wound on the road.', draught: 'A draught keeps a dying runner alive.', tonic: 'A tonic: a better chance on the hunt.', oil: 'An oil: the weapon half as strong again.' }[now && now.pattern] || 'A salve heals a wound; a draught keeps a dying runner alive; a tonic helps on the hunt; an oil sharpens the weapon. Used up on a hard road.') + '</p>'
    : '<p>' + (which === 'weapon' ? 'A weapon fights: a better hunt, fewer trips below that come to nothing, and less danger.' : which === 'ring' ? 'A ring guards a little.' : 'Armour guards: less chance of being hurt or killed.') + ' Carried, it\'s off your shelves; a hard blow can break armour (never a Relic or Mythic).</p>';
  openLook((now ? '<div class="note">Carrying: <b>' + esc(now.name) + '</b></div>' : '') + (fits.length ? '<div class="pickgrid">' + fits.map(c => '<button data-give="' + c.id + '" aria-label="' + esc(c.name) + '">' + card(c, { short: true, price: 'GIVE IT' }) + '</button>').join('') + '</div>' : '<p class="note">Nothing in the back room fits. ' + (isPot ? 'Brew a salve, draught, tonic or oil at the kettle.' : 'Make one at your stations.') + '</p>'),
    lead + (now ? '<button class="seg" id="gearBack">TAKE IT BACK</button>' : ''), true);
  $('lookCard').querySelectorAll('[data-give]').forEach(b => b.onclick = () => { const g = save.cards.find(x => x.id === b.dataset.give), m = g && Run.isPotion(g) && Sh.mythicAtStake(save, g);
    if (m && !confirm(g.name + ' is the Relic ' + MYTHICS[m].name + ' grows from. Carried, it\'s drunk on the road, and then it\'s gone for good, and that one of the Nine with it. Go ahead?')) return;
    const r = Run.equip(save, p, b.dataset.give); if (r.ok) { store(save); $('look').hidden = true; renderStaff(); } else toast(esc(r.why)); });
  if ($('gearBack')) $('gearBack').onclick = () => { if (isPot) Run.takePotion(save, p, i); else Run.unequip(save, p, which); store(save); $('look').hidden = true; renderStaff(); };
}

// ---------- THE NIGHT: thieves, the lock, the strongbox, the guard ----------
function nightHtml(t) {
  if (!t) return '';
  if (t.robbed) return '<p class="bad"><b>Broken into.</b> ' + esc(t.gang.replace(/^./, c => c.toUpperCase())) + ' forced the door in the night and took '
    + t.took.map(c => '<b>' + esc(c.name) + '</b>').join(', ') + (t.till ? ', and ' + t.till + ' c from the till' : '') + '. The Watch says they went ' + esc(t.where) + '; the trail stays warm two days.</p>';
  if (t.caught) return '<p><b>A night on watch.</b> ' + esc(t.guard) + ' caught one of ' + esc(t.gang) + ' at the door; the rest ran, and won\'t be back. The town is grateful (+' + THIEVES.caughtRenown + ' renown).</p>';
  if (t.turned) return '<p>' + esc(t.gang.replace(/^./, c => c.toUpperCase())) + ' tried the door in the night; ' + esc(t.by) + ' turned them away.</p>';
  return '';
}
let nightNote = '';
function renderNight() {
  const now = Date.now(), g = save.gang && now < save.gang.until ? save.gang : null, r = save.robbery, guard = St.guardOf(save);
  $('nightWord').textContent = 'RISK ' + Th.riskWord(save, now);
  $('nightBody').innerHTML = (g ? '<div class="notice hot"><b>A RUMOUR</b><p>' + esc(g.name.replace(/^./, c => c.toUpperCase())) + ' are working the lanes.</p><span>' + (now < g.from ? 'From tomorrow night, a night away' : 'Any night you\'re away') + ' (four hours or more), they may try your door, till ' + new Date(g.until).toLocaleDateString(undefined, { weekday: 'long' }) + '.</span></div>' : '')
    + (r && now < r.trail ? '<p class="note bad">Robbed ' + hm((now - r.at) / 1000) + ' ago by ' + esc(r.gang) + ': ' + r.took.map(c => esc(c.name)).join(', ') + '. Their trail is warm for ' + hm((r.trail - now) / 1000) + '.</p>' : '')
    + '<p class="note">' + (Th.dailyOdds(save) ? 'A shop of your renown draws a gang now and then, more often with a rich shelf. They come at night, when you\'re away: the wall, the Hall and the bank are never touched; the shelves and the till are.' : 'Thieves come for a shop that is ' + Th.fromRung() + ' or better.')
    + ' ' + (guard ? esc(guard.name) + ', your night guard, turns most of them away and catches some.' : 'A night guard (LOOKING FOR WORK, from ' + Th.fromRung() + ') turns most of them away.') + '</p>';
  const item = (k, name, line) => { const have = Th.has(save, k), c = THIEVES[k].cost; return '<div class="fi' + (have ? ' have' : '') + '"><b>' + name + '</b><span>' + line + '</span>' + (have ? '' : '<button class="seg" data-sec="' + k + '"' + (save.coins < c ? ' disabled' : '') + '>' + (k === 'lock' ? 'FIT A LOCK' : 'A STRONGBOX') + ' · ' + c.toLocaleString() + ' c</button>') + '</div>'; };
  $('security').innerHTML = item('lock', 'A good lock', 'Fewer of them get in: ' + Math.round((1 - THIEVES.lock.x) * 100) + ' % fewer.') + item('strongbox', 'A strongbox', 'The night\'s takings are locked away: thieves get nothing from the till.');
  $('security').querySelectorAll('[data-sec]').forEach(b => b.onclick = () => { const x = Th.buySecurity(save, b.dataset.sec); nightNote = x.why ? 'Not bought: ' + x.why + '.' : 'Fitted, for ' + x.cost + ' c.'; if (x.ok) { store(save); coins(); Snd.play('coin'); } renderNight(); });
  $('nightNote').textContent = nightNote;
  const w = Mon.wardsOf(save);
  $('wards').innerHTML = [0, 1, 2].map(i => '<button class="gslot' + (w[i] ? ' on' : '') + '" data-ward="' + i + '" style="' + (w[i] ? '--tc:var(--t-' + w[i].tier + ')' : '') + '"><small>WARD</small><b>' + (w[i] ? esc(w[i].name) : '+') + '</b></button>').join('');
  const glassWards = ['lens', 'pane'].concat(['mirror', 'lantern'].filter(id => Sh.knows(save, id))).map(id => PATTERNS[id].name.toLowerCase()), lit = St.lanternHours(save);
  $('wardWord').textContent = 'An oil from the kettle (one bottle), ' + glassWards.slice(0, -1).map(x => 'a ' + x).join(', ') + ' or a ' + glassWards[glassWards.length - 1] + ' from the glass, set about the shop: they soften what a monster does (now ' + Math.round(Mon.wardCut(save) * 100) + ' % off) and keep some thieves away. Set, they\'re off your shelves.'
    + (Sh.knows(save, 'lantern') ? ' A lantern hung by the door keeps the shop an hour longer while you\'re away' + (lit ? ' (it\'s lit)' : '') + '; one is enough, a second adds no more.' : '');
  $('wards').querySelectorAll('[data-ward]').forEach(b => b.onclick = () => wardOpen(+b.dataset.ward));
}
function wardOpen(i) {
  const w = Mon.wardsOf(save)[i], fits = Sh.inBack(save).filter(Mon.canWard).sort((a, b) => b.worth - a.worth);
  openLook((w ? '<div class="note">Set: <b>' + esc(w.name) + '</b></div>' : '') + (fits.length ? '<div class="pickgrid">' + fits.map(c => '<button data-ward-set="' + c.id + '" aria-label="' + esc(c.name) + '">' + card(c, { short: true, price: 'SET IT' }) + '</button>').join('') + '</div>' : '<p class="note">Nothing in the back room to ward with: brew an oil at the kettle, or make a lens or a pane at the glass.</p>'),
    w ? '<button class="seg" id="wardDown">TAKE THE WARD DOWN</button>' : '', true);
  $('lookCard').querySelectorAll('[data-ward-set]').forEach(b => b.onclick = () => { if (w) Mon.takeWard(save, i); const r = Mon.addWard(save, b.dataset.wardSet); if (!r.ok) toast(esc(r.why)); store(save); $('look').hidden = true; renderNight(); });
  if ($('wardDown')) $('wardDown').onclick = () => { Mon.takeWard(save, i); store(save); $('look').hidden = true; renderNight(); };
}

// ---------- WHILE YOU WERE AWAY ----------
const endDot = w => /[.!]$/.test(w) ? w : w + '.';
function roadWords(t) {
  const d = t.road; if (!d) return '';
  if (d.died) return ' ' + t.who + ' didn\'t come back. The Watch found them ' + ROUTES[t.route].from + ', and brought home what they carried.';
  let w = d.used.length ? ' Used: ' + d.used.join(', ') + '.' : '';
  if (d.hurt) w += ' Hurt on the road: resting ' + d.days + (d.days === 1 ? ' day' : ' days') + (d.poultice ? ' (the poultice halved it)' : '') + (d.bill ? ', the healer paid ' + d.bill + ' c' : '') + (d.broke ? '; the ' + d.broke + ' was broken' : '') + '.';
  return w;
}
function haulWords(t) {
  if (t.road && t.road.died) return roadWords(t).trim();
  if (t.beast) return (t.beast.won ? 'they brought it down: ' + t.beast.name.replace(/^./, c => c.toLowerCase()) + ' is done. A bounty of ' + t.beast.bounty + ' c, +' + t.beast.renown + ' renown, ' + MATS[t.beast.mat].name + ' × ' + t.beast.n + ', and a trophy: ' + t.beast.trophy + '.' : 'it got away from them.') + roadWords(t);
  if (t.hunt) return (t.hunt.won ? 'they caught ' + t.hunt.gang + '. ' + t.hunt.pieces.join(', ') + ' back in the back room, and a bounty of ' + t.hunt.bounty + ' c.' : t.hunt.again ? 'the trail went cold, but the Watch is keeping it warm for the Relic: send them again.' : 'the trail went cold and ' + (t.hunt.gang || 'the gang') + ' got away.') + roadWords(t);
  const parts = Object.entries(t.mats).map(([m, n]) => MATS[m].name + ' × ' + n);
  if (t.piece) parts.push('an old ' + t.piece.name);
  if (t.tile) parts.push('a found tile: ' + FOUND[t.tile].name);
  if (t.blueprint) parts.push('a blueprint: ' + RELICS[t.blueprint].name);
  if (t.shard) parts.push('a shard of Veric, for ' + MYTHICS[t.shard].name);
  return (t.empty ? 'little: the road below went badly. ' : '') + parts.join(', ') + roadWords(t);
}
// "a dagger, iron dagger × 4": names counted
const listWords = names => Object.entries(names.reduce((o, n) => (o[n] = (o[n] || 0) + 1, o), {})).map(([n, k]) => k > 1 ? n.toLowerCase() + ' × ' + k : (/^[aeiou]/i.test(n) ? 'an ' : 'a ') + n.toLowerCase()).join(', ');
function awayHtml(a) {
  let h = '<div class="away"><div class="k">WHILE YOU WERE AWAY</div><h3>' + hm(a.elapsed) + '</h3>' + nightMonsterHtml(a.monster) + nightHtml(a.thieves);
  if (a.capped) h += '<p>The staff keep the shop ' + hm(a.counted) + ' at most; the rest went unminded.</p>';
  if (a.sold.length) {
    h += '<p>' + esc(a.clerk) + ' sold <b>' + a.sold.length + '</b> piece' + (a.sold.length > 1 ? 's' : '') + ' for <b>' + a.coins + ' c</b>, keeping ' + a.cut + ' c.</p><ul>'
      + a.sold.slice(0, 8).map(e => '<li><span>' + esc(e.sold.name) + ' to ' + esc(e.who) + '</span><b>+' + e.sold.price + ' c</b></li>').join('') + '</ul>';
    if ((a.restocked || []).length) h += '<p>' + esc(a.clerk) + ' put out <b>' + a.restocked.length + '</b> piece' + (a.restocked.length > 1 ? 's' : '') + ' from the back: ' + esc(listWords(a.restocked)) + '.</p>';
  } else if (St.clerkOf(save)) h += '<p>' + esc(St.clerkOf(save).name.split(' ')[0]) + ' kept the shop' + (a.missed ? '; ' + a.missed + ' came in and found nothing for them' : '') + '.</p>';
  else if (a.missed) h += '<p>No one minded the shop: ' + a.missed + ' customer' + (a.missed > 1 ? 's' : '') + ' came and went. A counter clerk sells while you\'re away (Staff).</p>';
  if ((a.made || []).length) h += '<p>' + esc(a.apprentice) + ' made <b>' + a.made.length + '</b> piece' + (a.made.length > 1 ? 's' : '') + ' at the bench: ' + esc(listWords(a.made.map(c => c.name))) + '. They\'re in the back.</p>';
  if (a.wages) h += '<p>Wages paid: <b>' + a.wages + ' c</b>.</p>';
  if (a.unpaid) h += '<p class="bad">The wages are behind. The clerk works on for the takings; the runner won\'t set out until they\'re paid.</p>';
  if (a.branch && (a.branch.sold.length || a.branch.wages)) h += '<p>At ' + esc(BRANCH.town) + ', ' + esc(BRANCH.keeper) + ' sold <b>' + a.branch.sold.length + '</b> for <b>' + a.branch.coins + ' c</b>' + (a.branch.wages ? ' (wages ' + a.branch.wages + ' c)' : '') + '.</p>';
  a.trips.forEach(t => { h += t.road && t.road.died ? '<p class="bad">' + esc(haulWords(t)) + '</p>' : t.hunt || t.beast ? '<p>' + esc(t.who) + ' came back from the hunt: ' + esc(haulWords(t)) + '</p>' : '<p>' + esc(t.who) + ' came back from ' + ROUTES[t.route].from + ' with ' + esc(endDot(haulWords(t))) + '</p>'; });
  return h + '</div>';
}
function showAway(a) {
  if (!a) return;
  if (a.thieves) { Snd.play(a.thieves.robbed ? 'bell' : 'chime'); $('tabNight').hidden = !a.thieves.robbed; if (screen === 'shop') renderShop(); }
  if (screen === 'work' || screen === 'prepare') {   // never take the keys from a working
    if (a.thieves && a.thieves.robbed) toast('<b>Broken into in the night</b><br>' + esc(a.thieves.gang) + ' took ' + a.thieves.took.length + ' piece' + (a.thieves.took.length > 1 ? 's' : '') + '. See STAFF › THE NIGHT.');
    toast('<b>While you were away (' + hm(a.elapsed) + ')</b><br>' + (a.sold.length ? a.sold.length + ' sold, +' + a.coins + ' c' : 'nothing sold') + (a.trips.length ? ' · ' + a.trips.length + ' back from the road' : '') + ((a.made || []).length ? ' · ' + a.made.length + ' made at the bench' : ''));
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
  const a = catchUpAll(nowMs);
  store(save); coins();
  if (screen === 'shop') renderShop(); else if (screen === 'staff') renderStaff(); else if (screen === 'home') toHome(); else if (screen === 'supp') renderSupp(); else if (screen === 'bank') renderBank();
  showAway(a);
}
// on the way out, the time is written down
document.addEventListener('visibilitychange', () => { if (document.hidden && !replacing) { save.lastSeen = Date.now(); store(save); } });
window.addEventListener('pagehide', () => { if (!replacing) { save.lastSeen = Date.now(); store(save); } });

// ---------- SUPPLIERS ----------
let suppHour = null;
function toSupp() { clearTimers(); S = null; rescueCheck(); show('supp'); coins(); renderSupp(); tip('supp', $('supps')); }
function renderSupp() {
  if (screen !== 'supp') return;
  const h = hour(); suppHour = h;
  const mins = 60 - new Date().getMinutes();
  $('hourWord').innerHTML = 'Prices change on the hour · next in <b>' + mins + ' min</b>';
  $('factorTab').hidden = !Sh.suppliersFor(save).some(s => s.id === 'factor');
  $('supps').innerHTML = Sh.suppliersFor(save).map(sp => '<section data-group="supp" data-tab="' + sp.id + '" class="card supp"><h2><span>' + sp.kind + '</span><b>' + sp.name.toUpperCase() + '</b></h2><p class="line">' + sp.line + '</p>'
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
  if (master && (rw || !R.masterBrewGate(pat, benchPicks(), lvl()).ok)) master = false;
  S = R.newWorking({ patternId: pat, picks: benchPicks().slice(), level: lvl(), found: save.chosen.slice(), kit: G.kitOf(save), bandX: Wear.bandMult(save, R.stationOf(pat).id), rework: rw ? { from: rw.from, relic: rw.relic, mythic: rw.mythic } : null, master, part }, rng);
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
  if (part) {
    const m = MYTHICS[part.mythic], pn = m.parts[part.i][1];
    $('pieceKv').innerHTML = '<span>A part of the Nine</span><b style="color:var(--t-mythic)">' + esc(pn) + ', for ' + esc(m.name) + ': worked as a ' + PATTERNS[pat].name.toLowerCase() + '. Fill the bar and finish with WHITE HEAT reached and not one crack.</b>'
      + '<span>Fall short</span><b>the stuff is spent; try again.</b>'
      + '<span>' + stn().meter.replace('THE ', '') + '</span><b>narrowed: the band now ' + S.band[0] + '–' + S.band[1] + '. ' + stn().twist + '</b>'
      + '<span>White heat</span><b>after ' + PART_WORK.whiteStreak + ' clean in a row, or a TRUE</b>';
    return;
  }
  if (rw && rw.mythic) {
    const m = MYTHICS[rw.mythic];
    $('pieceKv').innerHTML = '<span>Now</span><b style="color:var(--t-relic)">' + esc(RELICS[m.relic].name) + ', a Relic</b>'
      + '<span>To the Nine</span><b style="color:var(--t-mythic)">' + esc(m.name) + ': fill the bar and quench with WHITE HEAT reached three times and not one crack. It takes its three powers.</b>'
      + '<span>The risk</span><b>short of it, the Relic stays as it was. The shard and the parts are kept; the bars and the relic material are spent.</b>'
      + '<span>' + stn().meter.replace('THE ', '') + '</span><b>the narrowest in the game: the band now ' + S.band[0] + '–' + S.band[1] + '. ' + stn().twist + '</b>'
      + '<span>White heat</span><b>after ' + MYTHIC_WORK.whiteStreak + ' clean in a row, or a TRUE: three times in the one working (' + (S.whites || 0) + ' so far)</b>';
    return;
  }
  if (rw && rw.relic) {
    const r = RELICS[rw.relic];
    const fromWord = TIERS[rw.from].name;
    $('pieceKv').innerHTML = '<span>Now</span><b style="color:' + TIERC[rw.from] + '">' + fromWord + '</b>'
      + '<span>To a Relic</span><b style="color:var(--t-relic)">' + esc(r.name) + ': fill the bar and quench with WHITE HEAT reached twice and not one crack. It takes its name, its lore and its power: ' + esc(r.power[0]) + '.</b>'
      + '<span>The risk</span><b>short of it, the piece stays ' + fromWord + ', as it was; the bars and the ' + esc(MATS[r.mat].name.toLowerCase()) + ' are spent.</b>'
      + '<span>' + stn().meter.replace('THE ', '') + '</span><b>the narrowest yet: the band now ' + S.band[0] + '–' + S.band[1] + '. ' + stn().twist + '</b>'
      + '<span>White heat</span><b>after ' + RELIC_WORK.whiteStreak + ' clean in a row, or a TRUE: twice in the one working (' + (S.whites || 0) + ' so far)</b>';
    return;
  }
  if (rw && R.reworkTo(rw.from) === OLD_BLOOD.tier && rw.from < OLD_BLOOD.tier) {
    $('pieceKv').innerHTML = '<span>Now</span><b style="color:' + TIERC[rw.from] + '">' + TIERS[rw.from].name + '</b>'
      + '<span>To Old-Blood</span><b style="color:var(--t-oldblood)">fill the bar and quench with not one crack: it goes up to Old-Blood and takes a third affix.</b>'
      + '<span>The risk</span><b>one crack, or dropped, and it stays Rare; the materials are spent. It never goes lower.</b>'
      + '<span>' + stn().meter.replace('THE ', '') + '</span><b>narrower for a master: the band now ' + S.band[0] + '–' + S.band[1] + '. ' + stn().twist + '</b>'
      + '<span>White heat</span><b>after ' + OLD_BLOOD.whiteStreak + ' clean in a row (not 8): it holds off a crack for 4 s.</b>'
      + '<span>Walk away</span><b>the piece comes out as it was; the materials are spent</b>';
    return;
  }
  if (!rw && S.master) {
    $('pieceKv').innerHTML = '<span>A master\'s brew</span><b style="color:var(--t-oldblood)">not one boil-over, and WHITE HEAT reached: the batch comes out Old-Blood, no roll, three affixes.</b>'
      + '<span>Fall short</span><b>a boil-over, no WHITE HEAT, or spilled: an ordinary brew, rolled as usual. The extra herb and water are spent.</b>'
      + '<span>The boil</span><b>narrower for a master: the simmer now ' + S.band[0] + '–' + S.band[1] + '. ' + stn().twist + '</b>'
      + '<span>White heat</span><b>after ' + OLD_BLOOD.whiteStreak + ' clean stirs in a row (not 8)</b>'
      + '<span>Plain odds if it falls short</span><b><span style="color:var(--t-fine)">Fine ' + Math.round(o.f) + ' %</span> · <span style="color:var(--t-rare)">Rare ' + Math.round(o.r) + ' %</span></b>';
    return;
  }
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
  // the kettle: a master's brew, toward Old-Blood
  if (PATTERNS[pat].batch) {
    const g = R.masterBrewGate(pat, picks(), l), row = document.createElement('div'); row.className = 'row master';
    row.innerHTML = '<span style="color:var(--t-oldblood)">MASTER\'S BREW</span><div class="group"><button class="seg" aria-pressed="' + master + '"' + (g.ok ? '' : ' disabled') + '>'
      + (master ? 'ON · TOWARD OLD-BLOOD' : 'OFF') + '</button></div>'
      + '<p class="note">' + (g.ok ? 'Not one boil-over, and WHITE HEAT: the batch comes out Old-Blood. Fall short, and it\'s an ordinary brew. It takes a second measure of the herb and one more moonwell water.'
        : 'A master\'s brew can come out Old-Blood. It needs ' + g.why.join(', ') + '.') + '</p>';
    row.querySelector('button').onclick = () => { master = !master; newWorking(); partSegs(); renderPrep(); };
    box.appendChild(row);
  }
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
const rec = () => rw ? (rw.mythic ? Sh.mythicCost(rwCard(), rw.mythic) : rw.relic ? Sh.relicCost(rwCard(), rw.relic) : Sh.reworkCost(rwCard()))
  : part ? Sh.recipe(pat, picks()).concat([Trail.partExtra(MYTHICS[part.mythic].parts[part.i][0])]) : Sh.recipe(pat, picks(), master);
const toWord = () => part ? MYTHICS[part.mythic].parts[part.i][1].toUpperCase() : rw.mythic ? MYTHICS[rw.mythic].name.toUpperCase() : rw.relic ? RELICS[rw.relic].name.toUpperCase() : TIERS[R.reworkTo(rw.from)].name.toUpperCase();
function renderTakes() {
  renderTakes0();
  const st = R.stationOf(pat).id, nm = Wear.stationName(st), w = Wear.wearOf(save, st);
  const label = rw ? '<b>WORK IT AGAIN</b>The tiles turn face down and shuffle.' : '<b>WORK IT</b>The tiles turn face down and shuffle.';
  if (Wear.isBroken(save, st, Date.now())) {
    $('workIt').disabled = true; if (!rw) $('makeIt').disabled = true;
    const t = Wear.rebuilding(save, st);
    $('workIt').innerHTML = '<b>' + (t ? 'REBUILDING' : 'BROKEN') + '</b>' + (t ? 'Ready in ' + hm((t - Date.now()) / 1000) + '.' : 'Rebuild ' + nm + ': THE FORGE › WORKSHOP.');
    $('takesBtns').insertAdjacentHTML('afterbegin', '<p class="note bad">' + nm.replace(/^./, c => c.toUpperCase()) + (t ? ' is being rebuilt: ready in ' + hm((t - Date.now()) / 1000) + '.' : ' is broken: nothing can be worked at it until it\'s rebuilt (THE FORGE › WORKSHOP).') + '</p>');
    return;
  }
  $('workIt').innerHTML = label;
  if (w >= 75) $('takesBtns').insertAdjacentHTML('afterbegin', '<p class="note">' + nm.replace(/^./, c => c.toUpperCase()) + ' is ' + Math.floor(w) + ' % worn: the band is narrower. Repair it under THE FORGE › WORKSHOP.</p>');
}
function renderTakes0() {
  const r = rec(), h = hour(), sh = Sh.short(save.mats, r), ok = !sh.length;
  $('takesWord').textContent = ok ? 'IN THE STORE ROOM' : 'SHORT';
  $('takes').innerHTML = r.map(x => { const have = save.mats[x.mat] || 0; return '<li><b>' + MATS[x.mat].name + ' × ' + x.n + '</b><em class="' + (have >= x.n ? 'ok' : 'short') + '">have ' + have + '</em></li>'; }).join('');
  $('makeIt').disabled = (!ok || master || !!part) && !rw; $('workIt').disabled = !ok;
  $('takesCard').style.borderColor = ok ? '' : 'var(--blood)';
  if (ok) { $('takesBtns').innerHTML = '<span class="small" style="color:var(--bone-faint)">Taken when you begin. Walk away from a working and they\'re spent.</span>'; return; }
  const gone = sh.filter(x => !Sh.sells(x.mat, h, save));
  const cost = sh.reduce((c, x) => c + Sh.priceOf(x.mat, h) * (x.n - x.have), 0);
  $('takesBtns').innerHTML = (gone.length ? '' : '<button class="seg go" id="buyShort"' + (save.coins < cost ? ' disabled' : '') + '>BUY WHAT\'S SHORT · ' + cost + ' c</button>'
      + (save.coins < cost ? '<span class="small" style="color:var(--bone-faint)">You have ' + save.coins + ' coins.</span>' : ''))
    + '<div class="ways">' + sh.map(x => wayHtml(x.mat, x.n - x.have, h)).join('') + '</div>';
  if (!gone.length) $('buyShort').onclick = () => { sh.forEach(x => Sh.buy(save, x.mat, x.n - x.have, hour())); store(save); renderTakes(); };
  $('takesBtns').querySelectorAll('[data-fpshort]').forEach(b => b.onclick = () => { const id = b.dataset.fpshort; if (Sh.forgePart(save, id, +b.dataset.bars)) { store(save); Snd.play('GOOD'); renderTakes(); } });
  $('takesBtns').querySelectorAll('[data-makepat]').forEach(b => b.onclick = () => { rw = null; part = null; master = false; pat = b.dataset.makepat; toPrepare(); });
  $('takesBtns').querySelectorAll('[data-tostaff]').forEach(b => b.onclick = () => toStaff());
}
// WHERE THINGS COME FROM (milestone 30): for a material you're short of, the ways to get it, the quickest one a button
function wayHtml(mat, need, h) {
  const src = Src.sourcesOf(mat), nm = MATS[mat].name, lines = [];
  for (const x of src) {
    if (x.kind === 'forged') {
      const bars = Math.ceil(need / x.makes), [from, k] = Object.entries(x.from)[0], have = save.mats[from] || 0, enough = have >= k * bars;
      lines.push('<button class="seg" data-fpshort="' + mat + '" data-bars="' + bars + '"' + (enough ? '' : ' disabled') + '>FORGE ' + (x.makes * bars) + ' ' + nm.toUpperCase() + ' · ' + k * bars + ' ' + MATS[from].name.toUpperCase() + '</button>'
        + '<span>at once, no working' + (enough ? '' : ': you have ' + have + ' ' + MATS[from].name.toLowerCase()) + '</span>');
    } else if (x.kind === 'made') {
      const owns = Rm.owns(save, x.station);
      lines.push(owns ? '<button class="seg" data-makepat="' + x.pattern + '">MAKE ' + PATTERNS[x.pattern].name.toUpperCase() + ' AT THE ' + STATIONS[x.station].name.toUpperCase() + '</button><span>' + x.word.replace(/^Made at [^:]+: [^,]+, /, '') + '</span>'
        : '<span>' + x.word + ' Set up the ' + STATIONS[x.station].name.toLowerCase() + ' first.</span>');
    } else if (x.kind === 'sold' || x.kind === 'pedlar') {
      if (Sh.sells(mat, h, save)) continue;
      const n = Src.nextSold(mat, h);
      lines.push('<span>' + x.who + (n == null ? ' hasn\'t had it lately' : ' has it again in about ' + n + ' h') + '.</span>');
    } else if (x.kind === 'runner' || x.kind === 'deep') {
      if (src.some(y => y.kind === 'sold') && x.kind === 'runner' && !MATS[mat].rare) continue;   // a common thing: buy it
      const r = St.runners(save).length;
      lines.push('<span>' + x.word + '</span>' + (r ? '<button class="seg" data-tostaff="1">SEND A RUNNER</button>' : '<button class="seg" data-tostaff="1">HIRE A RUNNER</button>'));
    }
  }
  return lines.length ? '<div class="way"><b>' + nm + ' × ' + need + '</b>' + lines.join('') + '</div>' : '';
}
function spend() {   // take the materials as a working begins; false if they're not all there
  if (!Sh.takeMats(save, rec())) { renderTakes(); return false; }
  store(save); return true;
}

// ---------- THE WORKING ----------
function toWork() {
  if (!spend()) return;
  R.begin(S); paused = false; prevOdds = null; prevWorth = null; lastStrike = 0;
  view.flash = 0; view.ring = 0; view.sparks = [];
  show('work');
  $('workT').textContent = benchName();
  $('cShape').textContent = rw || part ? '1 · TO ' + toWord() : '1 · SHAPE';
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
  if (r && r.trueHeat) { Snd.play('chime'); popLabel({ label: 'A TRUE HEAT', gain: 'IT HOLDS ITS HEAT' + (S.trueRun > 1 ? ' · ' + S.trueRun + ' IN A ROW' : ''), why: 'IT COOLS SLOWLY TILL IT GOES BACK IN', size: 'bigpop', colour: '#ffd25a' }); }
  else if (r && r.shuffled) popLabel({ label: 'SHUFFLED', gain: 'BACK IN THE FIRE · EVERY TILE RETURNS', size: 'bigpop', colour: '#e8c464' });
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
  $('barLabel').textContent = shaping ? (rw || part ? 'TO ' + toWord() : 'SHAPE') : 'WORKED';
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
  renderWorth();
  $('rowRack').style.setProperty('--n', S.rack.length);
  $('rowRack').innerHTML = S.rack.map((x, i) => tileHtml(x, i, true)).join('');
  S.rack.forEach(x => x.isNew = false);
  $('streak').innerHTML = Array.from({ length: 8 }, (_, i) => '<i class="' + (i < S.streak || S.white > 0 ? 'on' : '') + '"></i>').join('');
  $('streakVal').textContent = S.level < 5 ? 'AT TRADE 5' : S.white > 0 ? 'WHITE HEAT' : Math.min(8, S.streak) + ' / 8';
  if (paused) renderSheet();
}
// what the piece is worth as it stands (milestone 29): the least it can come out as, rising with every strike that works it once it's
// made, down with a crack; and the most it can still come out as. A brew's is a bottle's.
function renderWorth() {
  const w = S.done ? null : R.worthNow(S), tag = $('worthTag');
  tag.hidden = !w; if (!w) return;
  // the big figure: what it's likely worth (milestone 30), or for a rework and a master's brew, the least it can come out as
  const big = w.likely != null ? w.likely : w.lo, bottle = PATTERNS[S.cfg.patternId].batch ? 'A BOTTLE, ' : '';
  $('wWord').textContent = bottle + (w.likely != null ? 'LIKELY WORTH' : 'WORTH AT LEAST');
  $('wLo').textContent = big + ' c';
  $('wHi').innerHTML = (w.likely != null ? 'AT LEAST <b>' + w.lo + ' c</b>' + (w.hi > w.lo ? ' · ' : '') : '') + (w.hi > w.lo ? 'UP TO <b>' + w.hi + ' c</b> ' + w.hiWord : '');
  if (prevWorth !== null && big !== prevWorth) {
    const d = big - prevWorth, n = document.createElement('em');
    n.className = 'wdelta' + (d < 0 ? ' down' : ''); n.textContent = (d > 0 ? '+' : '−') + Math.abs(d) + ' c';
    tag.appendChild(n); setTimeout(() => n.remove(), 1300);
    $('wLo').classList.remove('bump'); void $('wLo').offsetWidth; $('wLo').classList.add(d > 0 ? 'bump' : 'dip');
  }
  prevWorth = big;
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
    const tz = R.trueZone(S), inTrue = S.meter >= tz[0] && S.meter <= tz[1];
    if (S.inFire) h = S.meter >= S.over ? '<i>Past white.</i> Take it out before it scales.' : wet && S.meter > S.band[1] ? '<i>Soaked.</i> Take it out and let it dry back into the band, or a stitch will tear.' : inTrue ? '<i>Now: the true heat.</i> Take it out or ' + verb + ' now and it holds its heat.' : S.meter >= S.band[0] ? '<i>In the band.</i> Wait for the <i>true heat</i> at the top, then take it out or ' + verb + '.' : (wet ? 'Soaking…' : 'Heating…') + ' wait for the ' + st.band_ + '.';
    else if (S.trueHeat && S.meter >= S.band[0]) h = '<i>A true heat:</i> it cools slowly. ' + Verb + ' on.';
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
  $('result').classList.toggle('oldblood', !!(res.oldBlood && !res.failed));
  $('result').classList.toggle('relic', !!((res.relic || res.mythic) && !res.failed) || !!(res.part && res.took));
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
  const yields = res.part ? null : R.yieldOf(pat, res.tier);
  if (res.part) {   // a part of the Nine: made, or not; no card
    const m = MYTHICS[res.part.mythic];
    if (res.took) { Trail.makePart(save, res.part.mythic, res.part.i); Snd.play('chime'); }
    piece = { name: m.parts[res.part.i][1], tier: 'mythic', worth: 0, id: null };
    part = null;
  } else if (yields) {   // the glass's bottles: into the store room, no card
    save.mats[yields.mat] = (save.mats[yields.mat] || 0) + yields.n; save.made++;
    piece = { name: yields.n + ' ' + MATS[yields.mat].name.toLowerCase() + 's', tier: TIERS[res.tier].id, worth: 0, id: null };
  } else if (res.rework) {   // the same piece, out of the fire: in the back where it was
    const old = rwCard(), i = save.cards.indexOf(old);
    if (res.failed) piece = old;   // the last working didn't take: the piece exactly as it was (its cracks aren't its)
    else {
      piece = R.remakePiece({ card: old, res, picked, rng, now: Date.now() });
      if (res.relic) { piece = R.relicPiece(piece, res.relic); save.relicsMade = [...new Set((save.relicsMade || []).concat(res.relic))]; }
      if (res.mythic) { piece = R.mythicPiece({ ...piece, tier: 'mythic' }, res.mythic); save.mythicsMade = [...new Set((save.mythicsMade || []).concat(res.mythic))]; if (G.isNine(save) && !save.nineAt) { save.nineAt = Date.now(); setTimeout(showEnding, 1400); } }
      save.cards[i] = piece;
    }
    rw = null;
  } else {
    piece = R.makePiece({ patternId: pat, picks: picks(), result: res, picked, maker: save.maker, rng, now: Date.now() });
    save.cards.unshift(piece); save.made++;
  }
  const xp = R.xpFor(res);
  save.benchAt = Date.now();   // working beside the apprentice: they learn faster for a while (milestone 36)
  { // the station's wear: worn from three quarters; broken at full, after this working
    const st = R.stationOf(pat).id, wr = Wear.addWear(save, st, Wear.kindOf(res), Date.now()), nm = Wear.stationName(st);
    if (wr && wr.broke) { setTimeout(() => toast('<b>' + nm.toUpperCase() + ' HAS BROKEN</b><br>It held for this working, then gave out. Rebuild it under THE FORGE › WORKSHOP.'), 900); Snd.play('bell'); if (dio) dio.setCold(Wear.isBroken(save, 'forge', Date.now())); }
    else if (wr && wr.worn) setTimeout(() => toast('<b>' + esc(nm.replace(/^./, c => c.toUpperCase())) + ' is wearing</b><br>Three quarters worn: the band is narrower. Repair it under THE FORGE › WORKSHOP.'), 900);
  }
  const tr = save.trades[pat] || (save.trades[pat] = { xp: 0 }); tr.xp += Math.round(xp * G.xpMult(save));   // a Bright heir learns a little faster
  const after = levelFor(pat), p = PATTERNS[pat];
  $('rPick').hidden = true; $('rDone').hidden = false;
  $('rCard').innerHTML = res.part ? '<div class="yield"><div class="tier" style="color:var(--t-mythic)">' + (res.took ? 'A PART OF THE NINE' : 'NOT THIS TIME') + '</div><h3>' + esc(piece.name) + '</h3><p>For ' + esc(MYTHICS[res.part.mythic].name) + '. ' + (res.took ? (Trail.partsDone(save, res.part.mythic) ? 'All three parts are made: the Mythic working waits, on the Relic, in the back room.' : 'Kept with the shard.') : 'The stuff is spent.') + '</p></div>'
    : yields ? '<div class="yield"><div class="tier" style="color:' + TIERC[res.tier] + '">' + TIERS[res.tier].name.toUpperCase() + ' BLOWING</div><div class="cd-art">' + ART.draught('#cfe8e8') + '</div><h3>' + yields.n + ' bottles</h3><p>Into the store room for the kettle. You have ' + save.mats[yields.mat] + '.</p></div>' : card(piece);
  if (res.oldBlood && !res.failed) { $('rCard').insertAdjacentHTML('afterbegin', '<div class="oldword">OLD-BLOOD · ' + esc(piece.name.toUpperCase()) + '</div>'); Snd.play('level'); }
  if (res.mythic && !res.failed) { $('rCard').insertAdjacentHTML('afterbegin', '<div class="oldword" style="color:var(--t-mythic)">ONE OF THE NINE · ' + esc(piece.name.toUpperCase()) + '</div>'); Snd.play('level'); Snd.play('chime'); }
  if (res.relic && !res.failed) { $('rCard').insertAdjacentHTML('afterbegin', '<div class="oldword">A RELIC · ' + esc(piece.name.toUpperCase()) + '</div>'); Snd.play('level'); Snd.play('chime'); }
  const short = { boiled: 'it boiled over', nowhite: 'no WHITE HEAT', dropped: 'it spilled' }[res.masterShort];
  $('rLine').innerHTML = res.part ? (res.took ? 'WHITE HEAT and not one crack: the part is made.' : (res.dropped ? 'Dropped.' : res.cracks ? 'A crack.' : 'No WHITE HEAT.') + ' It didn\'t take; the stuff is spent.')
    : res.mythic ? (res.failed ? (res.dropped ? 'Dropped. ' : res.cracks ? 'A crack in the Mythic working. ' : 'WHITE HEAT ' + (res.whites || 0) + ' time' + (res.whites === 1 ? '' : 's') + ', not three. ') + 'The Relic stays as it was; the shard and the parts are kept.' : 'WHITE HEAT three times, not one crack. ' + esc(MYTHICS[res.mythic].name) + ': one of the Nine.')
    : res.relic ? (res.failed ? (res.dropped ? 'Dropped. ' : res.cracks ? 'A crack in the Relic working. ' : 'WHITE HEAT only ' + (res.whites || 0) + ' time' + (res.whites === 1 ? '' : 's') + ', not twice. ') + 'It stays ' + TIERS[res.from].name + ', as it was; the bars and the relic material are spent.' : 'WHITE HEAT twice, not one crack. It\'s ' + esc(RELICS[res.relic].name) + ' now: there\'s only one.')
    : res.master ? 'A master\'s brew: not one boil-over, WHITE HEAT. Old-Blood, three bottles of it.'
    : short ? 'Short of a master\'s brew (' + short + '): an ordinary batch. WORKED +' + res.worked + ' % · it had Fine ' + Math.round(res.odds.f) + ' % · Rare ' + Math.round(res.odds.r) + ' %'
    : res.oldBlood ? (res.failed ? (res.dropped ? 'Dropped. ' : 'A crack in the last working. ') + 'It wouldn\'t take Old-Blood: it stays Rare, and the materials are spent.' : 'It took. Rare to Old-Blood: a master\'s piece.')
    : res.rework ? (res.dropped ? 'A second crack after it took. It came out ' + TIERS[res.tier].name + (res.flawed ? ', flawed.' : '.') : 'It took. ' + TIERS[res.from].name + ' to ' + TIERS[res.tier].name + '.')
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
  const free = yields || res.part || piece.tier === 'mythic' ? -1 : save.shelf.findIndex(e => !e);
  $('rShelf').hidden = free < 0;
  $('rShelf').textContent = 'ON THE SHELF · ' + Sh.priceAt(piece, 'fair') + ' c';
  $('rShelf').onclick = () => { if (!keepsNine(save.cards.find(x => x.id === piece.id) || piece, 'On the shelf, anyone may buy it')) return; Sh.place(save, piece.id, free); store(save); toShop(); };
  if (!store(save)) $('rWhy').textContent += ' · This browser would not save it.';
  const sb = $('rDone').querySelector('.rbtns'); sb.querySelectorAll('.sharebtn').forEach(x => x.remove());
  if (!yields && !res.part) { const shb = shareBtn(piece, $('rDone')); shb.classList.add('sharebtn'); sb.appendChild(shb); }
  $('rAgain').focus({ preventScroll: true }); $('result').scrollTop = 0;
  if (!res.rework) tip('result', $('rDone').querySelector('.rbtns'));
}
$('rAgain').onclick = () => { rw = null; toPrepare(); };
$('rHome').onclick = toHome;

// ---------- the clock ----------
const cv = $('cv'), g = cv.getContext('2d');
let layout = LAYOUTS.wide;
// the stage's drawing: on a phone, whichever of the two (wide, tall) shows the piece larger in the room the stage has
function fitStage() {
  const box = cv.parentElement.getBoundingClientRect();
  let tall = phoneQ.matches && window.innerHeight > window.innerWidth;
  if (phoneQ.matches && box.width > 0 && box.height > 0) {
    const size = L => Math.min(box.width / L.W, box.height / L.H) * L.sc;
    tall = size(LAYOUTS.tall) > size(LAYOUTS.wide);
  }
  layout = tall ? LAYOUTS.tall : LAYOUTS.wide;
  if (cv.width !== layout.W || cv.height !== layout.H) { cv.width = layout.W; cv.height = layout.H; }
}
window.addEventListener('resize', fitStage); new ResizeObserver(fitStage).observe(cv.parentElement); fitStage();
let lastT = performance.now(), lastStore = 0, dioSig = '', lastQ = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  // the shop's clock: only while this page is in front (a hidden tab gets no frames, so no time passes)
  // present: at the counter (the shop screen); customers queue to be served, sellers come in
  const nowMs = Date.now();
  if (save.lastSeen && nowMs - save.lastSeen > 3000) returning(nowMs);
  const present = screen === 'shop' && !document.hidden;
  const clerk = St.clerkOf(save), clerkOn = clerk && !save.unpaid ? St.clerkTerms(clerk) : null;
  const frontWas = save.queue[0] && save.queue[0].who;
  const visits = Sh.shopStep(save, dt, rng, nowMs, present, clerkOn);
  visits.forEach(e => { if (e.by && e.sold && clerk) St.gain(clerk, 1); });
  const paid = St.payWages(save, dt);
  if (paid) coins();
  const benched = Ap.step(save, dt, rng, nowMs);   // the apprentice at the bench (milestone 36)
  if (benched.length) { store(save); benched.forEach(r => toast('<b>' + esc(Ap.apprenticeOf(save).name.split(' ')[0]) + ' made ' + aOf(r.piece.name) + esc(r.piece.name) + '</b><br>' + TIERS.find(x => x.id === r.piece.tier).name + (r.piece.flawed ? ', flawed' : '') + (r.spared ? ', from scraps (it cost nothing)' : '') + '. It\'s in the back.')); if (screen === 'staff') renderStaff(); }
  const back = St.resolveTrips(save, nowMs, rng);
  back.forEach(t => { toast('<b>' + esc(t.who) + (t.road && t.road.died ? ' was killed on the road' : ' is back') + '</b><br>' + esc(haulWords(t))); if (t.road && (t.road.died || t.road.hurt)) Snd.play('bell'); if ((t.hunt && t.hunt.won) || (t.beast && t.beast.won)) Snd.play('chime'); });
  if (back.length) { store(save); if (screen === 'staff') renderStaff(); }
  save.lastSeen = nowMs;
  if (nowMs - lastStore > 5000) { lastStore = nowMs; store(save); }
  if (nowMs - bankTick > 2000) { bankTick = nowMs; bankWeek(nowMs); Mon.tidy(save, nowMs); const mon = Mon.plan(save, nowMs, rng); if (mon) { store(save); toast('<b>' + esc(Mon.kindOf(mon).name) + '</b><br>' + esc(Mon.kindOf(mon).lines[0]) + ' The Watch has posted an order on the board (THE SHOP › IN TOWN).'); Snd.play('bell'); } monsterNight(Mon.strike(save, nowMs, rng)); const gang = Th.plan(save, nowMs, rng); if (gang) { store(save); toast('<b>A rumour in the lanes</b><br>' + esc(gang.name.replace(/^./, c => c.toUpperCase())) + ' are working the town. Lock up at night (STAFF › THE NIGHT).'); $('tabNight').hidden = false; } }
  if (screen === 'staff' && nowMs - staffTick > 1000) { staffTick = nowMs; document.querySelectorAll('#staffList [data-back]').forEach(b => { b.textContent = hm((+b.dataset.back - nowMs) / 1000); }); }
  const sig = counterSig();
  if (visits.length || sig !== lastSig) {
    if (visits.length || save.queue.length) store(save);
    visits.forEach(e => {
      if (e.sold) { coins(); Snd.play('coin'); if (dio && screen === 'shop') dio.sold(e); if (screen !== 'shop') { toast('<b>Sold: ' + esc(e.sold.name) + ' · +' + e.sold.price + ' c</b><br>to ' + esc(e.who)); $('navSold').hidden = false; } }
      if (screen === 'shop' && cvw && !iso) {
        if (e.order === 'posted') { cvw.visit({ who: e.who }, 'eager', null); Snd.play('eager'); }   // a regular (or the Court's herald) comes to leave it
        else if (e.who === frontWas && !e.served && !e.by) cvw.leaving(e.sold ? 'pleased' : 'offended');   // tired of waiting: they went
      }
      if (e.order === 'posted' && screen !== 'shop') { toast('<b>A special order</b><br>' + esc(e.who) + ': ' + esc(Sh.orderWord(save.order)) + '.'); $('navSold').hidden = false; }
    });
    if (screen === 'shop') renderShop(); else tabBadges();
  } else if (screen === 'shop' && floorShown && save.ledger[0] && Date.now() - save.ledger[0].at > 30000) renderFloor();
  if (screen === 'shop' && save.queue.length > lastQ) Snd.play('bell');
  lastQ = save.queue.length;
  if (save.branch) {
    const bs = Br.step(save, dt, rng, nowMs);
    if (bs.some(e => e.sold)) { coins(); if (screen === 'branch') renderBranch(); }
    if (screen === 'branch' && branchDio) { if (bs.length) branchDio.setShelf(branchShown()); bs.forEach(e => { if (e.sold) branchDio.sold(e); else branchDio.walkIn(e); }); branchDio.tick(); }
  }
  if (screen === 'visit' && visitDio) { visitTick(); visitDio.tick(); }
  if (screen === 'shop' && cvw && !iso && sig !== cvSig) {
    cvSig = sig; const f = save.queue[0], fresh = f && f.id !== cvFront; cvFront = f && f.id;
    const p = cvw.show(save, Sh.priceAt);
    // someone new at the counter who wants something badly: a gold "!" (once you can read a mood)
    if (fresh && f.kind === 'buyer' && f.mood === 'EAGER' && Sh.haggleLevel(save) >= G.readLevels(save).mood) p.then(() => { cvw.react('eager'); Snd.play('eager'); });
  }
  if (screen === 'shop') { tickCounter(); if (dio && iso) { if (sig !== dioSig) { dioSig = sig; dio.setQueue(save.queue); } visits.forEach(e => { if (!e.served && !e.by && !e.sold) dio.walkIn(e); }); dio.tick(); } }
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
$('workIt').onclick = () => { if (Wear.isBroken(save, R.stationOf(pat).id, Date.now())) { renderTakes(); return; } toWork(); };
$('makeIt').onclick = () => { if (rw) { rw = null; toShop(); } else if (Wear.isBroken(save, R.stationOf(pat).id, Date.now())) renderTakes(); else if (spend()) finish('instant'); };
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
// ---------- THE SAVE CODE: a backup, and loading one ----------
const saveNote = (t, bad) => { $('saveNote').textContent = t; $('saveNote').classList.toggle('bad', !!bad); };
const backedUp = () => { save.backupAt = Date.now(); store(save); };
$('saveCopy').onclick = async () => {
  save.lastSeen = Date.now(); const code = toCode(save);
  try { await navigator.clipboard.writeText(code); backedUp(); saveNote('Copied: ' + Math.round(code.length / 1024) + ' KB of save code. Paste it somewhere safe (a note, an email to yourself).'); }
  catch (e) { $('loadText').value = code; $('loadText').select(); saveNote('Couldn\'t reach the clipboard: the code is in the box below, selected. Copy it from there.'); }
};
$('saveFile').onclick = () => {
  save.lastSeen = Date.now();
  const url = URL.createObjectURL(new Blob([toCode(save)], { type: 'text/plain' })), a = document.createElement('a');
  a.href = url; a.download = 'darkclay-forge-' + new Date().toISOString().slice(0, 10) + '.txt'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000); backedUp(); saveNote('Saved as a file. Keep it somewhere safe.');
};
function loadFrom(text) {
  const next = fromCode(text);
  if (!next) { saveNote('That code won\'t read: it may be cut short, or not a Darkclay Forge save.', true); return; }
  const lv = s => (s.cards || []).length + ' pieces, ' + s.coins + ' coins';
  if (!confirm('Load the save from ' + (next.lastSeen ? new Date(next.lastSeen).toLocaleString() : 'the code') + ' (' + esc(next.maker || 'the Maker') + ': ' + lv(next) + ')?\n\nIt replaces this game (' + lv(save) + '). Copy a code of this one first if you want to keep it.')) return;
  next.backupAt = Date.now();
  if (!storeRaw(next)) { saveNote('This browser won\'t store it (a private window?).', true); return; }
  replacing = true; location.reload();
}
$('loadBtn').onclick = () => loadFrom($('loadText').value);
$('loadPick').onclick = () => $('loadFile').click();
$('loadFile').onchange = () => { const f = $('loadFile').files[0]; if (f) f.text().then(loadFrom); $('loadFile').value = ''; };
// once a week of play, a quiet word about keeping a code
let backupHinted = false;
function backupReminder() {
  if (backupHinted || save.made < 5) return;
  if (!save.backupAt) { save.backupAt = Date.now(); return; }
  if (Date.now() - save.backupAt > 7 * 86400000) { backupHinted = true; toast('<b>Keep a save code somewhere safe</b><br>THE FORGE › SAVE copies your whole game.'); }
}

if (new URLSearchParams(location.search).has('debug')) window.forge = { save, Sh, R, St, renderShop, toShop, toStaff, showAway, dio: () => dio, store: () => store(save), wipe: () => { save.v = 0; store(save); location.reload(); } };

// ---------- THE SECOND SHOP: Osk's Landing, kept by a keeper ----------
let branchDio = null, branchDioP = null, branchNote = '';
const bview = () => Br.viewOf(save);
const branchShown = () => { const v = bview(); return Rm.shelfSpots(v.room).map((p, i) => { const e = v.shelf[i], c = e && save.cards.find(x => x.id === e.id); return c && { slot: i, shelf: p.shelf, spot: p.spot, lv: p.lv, card: c, price: Sh.priceAt(c, e.tag) }; }).filter(Boolean); };
function toBranch() {
  if (!save.branch) { toShop(); return; }
  show('branch'); coins(); renderBranch();
  if (!branchDioP) branchDioP = import('./diorama.js?v=63').then(m => m.create($('branchFloor'), { onTap: t => { if (t.slot != null) branchSlotOpen(t.slot); } })).catch(() => null).then(d => (branchDio = d));
  branchDioP.then(d => { if (d) { d.setRoom(save.branch.room, { staff: [] }); d.setShelf(branchShown()); d.setQueue([]); d.redraw(); } });
}
function renderBranch() {
  if (screen !== 'branch' || !save.branch) return;
  const v = bview(), b = save.branch, size = Rm.sizeOf(b.room), t = Town.refreshTown(v, Date.now()), ev = Town.eventOf(t), n = Town.notices(t);
  $('branchKicker').textContent = 'YOUR SECOND SHOP · KEPT BY ' + BRANCH.keeper.toUpperCase();
  $('branchName').textContent = BRANCH.town;
  $('branchTally').innerHTML = '<b>' + (b.sold || 0) + '</b> sold · <b>' + (b.earned || 0) + '</b> coins taken<br>' + size.word.toLowerCase() + ' · the keeper\'s wage <b>' + BRANCH.wage + ' c</b> an hour and <b>' + Math.round(BRANCH.cut * 100) + ' %</b> of each sale';
  $('branchHint').textContent = b.closed ? 'Closed: the keeper\'s wage can\'t be paid. Earn some coin and it opens again.' : BRANCH.line + ' Stock its shelves from your back room; ' + BRANCH.keeper.split(' ')[0] + ' sells while you\'re away too.';
  const filled = v.shelf.filter(Boolean).length;
  $('branchShelfWord').textContent = filled + ' OF ' + v.slots + ' · ITS CUSTOMERS BUY FROM HERE';
  $('branchSlots').innerHTML = v.shelf.map((e, i) => {
    if (!e) return '<button class="slot-empty" data-bslot="' + i + '">EMPTY<br>' + (Sh.inBack(save).length ? 'TAP TO STOCK' : 'NOTHING IN THE BACK') + '</button>';
    const c = save.cards.find(x => x.id === e.id);
    return '<button data-bslot="' + i + '" aria-label="' + esc(c.name) + '">' + card(c, { short: true, price: Sh.priceAt(c, e.tag) + ' c<span class="tagword">' + TAGS[e.tag].word + '</span>' }) + '</button>';
  }).join('');
  $('branchSlots').querySelectorAll('[data-bslot]').forEach(x => x.onclick = () => branchSlotOpen(+x.dataset.bslot));
  fillBtn($('branchFill'), v);
  const cost = Rm.shelfCost(b.room);
  $('branchBuySlot').hidden = cost == null; if (cost != null) { $('branchBuySlot').textContent = 'ANOTHER SHELF · ' + cost + ' c'; $('branchBuySlot').disabled = save.coins < cost; }
  const next = Rm.nextSize(b.room); $('branchExpand').hidden = !next; if (next) { $('branchExpand').textContent = 'BIGGER · ' + next.w + ' × ' + next.d + ' · ' + next.cost + ' c'; $('branchExpand').disabled = save.coins < next.cost; }
  $('branchUps').innerHTML = b.room.items.filter(i => i.kind === 'shelf').map((it, k) => { const nx = SHELF_LEVELS[Rm.levelOf(it) + 1]; return '<div class="fi"><b>' + SHELF_LEVELS[Rm.levelOf(it)].name + ' ' + (k + 1) + ' · ' + Rm.placesOf(it) + ' places</b>' + (nx ? '<button class="seg" data-bup="' + it.id + '"' + (save.coins < nx.cost ? ' disabled' : '') + '>MAKE IT A ' + nx.name.toUpperCase() + ' · ' + nx.cost + ' c</button>' : '<span>As fine as a shelf gets.</span>') + '</div>'; }).join('');
  $('branchUps').querySelectorAll('[data-bup]').forEach(x => x.onclick = () => { const r = Rm.upgradeShelf(v, x.dataset.bup); branchNote = r.why ? 'Not made better: ' + r.why + '.' : 'A ' + SHELF_LEVELS[r.level].name.toLowerCase() + ' now.'; branchChanged(); });
  $('branchNote').textContent = branchNote;
  $('branchTownWord').textContent = 'TODAY AT THE LANDING';
  $('branchTown').innerHTML = (ev ? '<div class="notice event"><b>TODAY IN TOWN</b><p>' + esc(ev.name) + '</p><span>' + esc(ev.line) + '</span><em>' + esc(ev.effect) + '</em></div>' : '')
    + n.hot.map(h => '<div class="notice hot"><b>IN DEMAND</b><p>' + esc(h.line) + '</p><span>' + esc(h.patterns.map(p => PATTERNS[p].name.toLowerCase()).join(', ')) + '</span></div>').join('')
    + (n.cold ? '<div class="notice cold"><b>OUT OF FAVOUR</b><p>' + esc(n.cold.line) + '</p><span>' + esc(n.cold.patterns.map(p => PATTERNS[p].name.toLowerCase()).join(', ')) + '</span></div>' : '')
    + '<p class="note">The Landing has its own board, and more delvers, travellers and hunters than the old town. What it wants may not be what your first shop\'s town wants today.</p>';
  $('branchLedger').innerHTML = (b.ledger || []).length ? b.ledger.slice(0, 12).map(e => '<li><span><span class="mood ' + e.mood + '">' + e.mood + '</span><b>' + esc(e.who) + '</b> · wants ' + Sh.wantWord(e.want) + '</span>'
    + (e.sold ? '<span class="amt">+' + e.sold.price + ' c</span>' : '<span class="amt no">NO SALE</span>') + '<span class="ln">' + (e.sold ? 'Bought the ' + esc(e.sold.name) + '. ' : '') + esc(e.line) + '</span></li>').join('')
    : '<li class="empty">No one yet. Customers come in through the day.</li>';
}
$('branchFill').onclick = () => { const n = Sh.fillShelf(bview()).length; branchNote = n ? n + (n === 1 ? ' piece' : ' pieces') + ' sent to ' + BRANCH.town + ', at FAIR.' : ''; branchChanged(); };
function branchChanged() { store(save); coins(); renderBranch(); if (branchDio) { branchDio.setRoom(save.branch.room, { staff: [] }); branchDio.setShelf(branchShown()); } }
function branchSlotOpen(slot) {
  const v = bview(), e = v.shelf[slot];
  if (!e) {
    const back = Sh.inBack(save).filter(c => !c.sample || save.made);
    if (!back.length) { branchNote = 'Nothing in the back room to send. Make something at the forge.'; renderBranch(); return; }
    openLook('<div class="pickgrid">' + back.map(c => '<button data-id="' + c.id + '" aria-label="' + esc(c.name) + '">' + card(c, { short: true }) + '</button>').join('') + '</div>', '<p>Send a piece to ' + esc(BRANCH.town) + '. It goes up at FAIR.</p>', true);
    $('lookCard').querySelectorAll('button').forEach(x => x.onclick = () => { if (!keepsNine(save.cards.find(c => c.id === x.dataset.id), 'At ' + BRANCH.town + ', anyone may buy it')) return; Sh.place(v, x.dataset.id, slot); $('look').hidden = true; branchChanged(); });
    return;
  }
  const c = save.cards.find(x => x.id === e.id);
  const acts = () => '<div class="group">' + Object.entries(TAGS).map(([id, t]) => '<button class="seg" data-tag="' + id + '" aria-pressed="' + (v.shelf[slot] && v.shelf[slot].tag === id) + '">' + t.word + ' · ' + Sh.priceAt(c, id) + ' c</button>').join('') + '</div><button class="seg" id="bTakeDown">BRING IT BACK</button>';
  openLook(card(c), acts());
  $('lookActs').onclick = ev2 => {
    const x = ev2.target.closest('button'); if (!x) return;
    if (x.dataset.tag) { Sh.setTag(v, slot, x.dataset.tag); $('lookActs').innerHTML = acts(); branchChanged(); }
    else if (x.id === 'bTakeDown') { Sh.takeDown(v, slot); $('look').hidden = true; branchChanged(); }
  };
}
$('branchBuySlot').onclick = () => { const r = Rm.buy(bview(), 'shelf'); branchNote = r.why ? 'No shelf: ' + r.why + '.' : 'A new shelf: two more places.'; branchChanged(); };
$('branchExpand').onclick = () => { if (Rm.expand(bview())) { branchNote = 'The Landing\'s shop is bigger.'; branchChanged(); } };

// ---------- A FRIEND'S SHOP: a #shop= link, to look at; and sharing your own ----------
let visitDio = null, visitDioP = null, visiting = null, visitNext = 0;
function toVisit(shop, away) {
  visiting = shop; show('visit');
  const d = new Date(shop.at);
  $('visitKicker').textContent = 'A SHOP SHARED WITH YOU · ' + (isNaN(d) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()) + (shop.nine ? ' · ' + NINE.title : '') + (shop.gen > 1 ? ' · ' + genWord(shop.gen) + ' OF THE LINE' : '');
  $('visitName').textContent = shop.maker + (/s$/i.test(shop.maker) ? '\' shop' : '\'s shop');
  $('visitTally').innerHTML = 'Renown <b>' + esc(shop.renown) + '</b> · ' + esc(shop.size.word.toLowerCase()) + '<br>Charm <b>' + shop.charm + '</b> · <b>' + shop.made + '</b> made · <b>' + shop.sold + '</b> sold';
  $('visitStations').innerHTML = '<span style="border:0;background:none;padding-left:0">IN THE WORKSHOP</span>' + shop.stations.map(id => '<span>' + esc(STATIONS[id].word.replace(/^THE /, '')) + '</span>').join('');
  $('visitWallWord').textContent = shop.wall.length ? shop.wall.length + (shop.wall.length === 1 ? ' PIECE' : ' PIECES') + ' · THEIR BEST' : 'NOTHING HUNG YET';
  $('visitWall').innerHTML = shop.wall.length ? shop.wall.map((c, i) => '<button data-vw="' + i + '" aria-label="' + esc(c.name) + '">' + card(c, { short: true, price: 'ON THE WALL' }) + '</button>').join('')
    : '<div class="empty">Their wall is bare: pieces they keep would hang here.</div>';
  $('visitWall').querySelectorAll('[data-vw]').forEach(b => b.onclick = () => openLook(card(shop.wall[+b.dataset.vw]), ''));
  $('visitHallBox').hidden = !shop.hall.length;
  $('visitHallWord').textContent = shop.hall.length + (shop.hall.length === 1 ? ' PIECE' : ' PIECES') + ' · THE BEST THEY HAVE';
  $('visitHall').innerHTML = shop.hall.map((c, i) => '<button data-vh="' + i + '" aria-label="' + esc(c.name) + '">' + card(c, { short: true, price: 'IN THE HALL' }) + '</button>').join('');
  $('visitHall').querySelectorAll('[data-vh]').forEach(b => b.onclick = () => openLook(card(shop.hall[+b.dataset.vh]), ''));
  renderVisitFlyer(shop);
  const mine = save.made > 0 || save.cards.length > 0;
  $('visitBack').textContent = mine ? 'BACK TO MY FORGE' : 'START YOUR OWN FORGE';
  $('visitBack').onclick = () => { visiting = null; toHome(); if (away) { showAway(away); away = null; } };
  const ready = d3 => { if (!d3) { $('visitHint').textContent = 'This browser can\'t draw the shop in 3D: their wall is below.'; return; } d3.setRoom(shop.room, { staff: [] }); d3.setShelf(shop.stands); d3.setQueue([]); d3.redraw(); };
  if (!visitDioP) visitDioP = import('./diorama.js?v=63').then(m => m.create($('visitFloor'), { onTap: visitTap })).catch(() => null).then(d => (visitDio = d));
  visitDioP.then(ready);
  visitNext = performance.now() + 1500;
}
// the flyer's piece, and keeping a copy of it
function renderVisitFlyer(shop) {
  const box = $('visitFlyer'); box.hidden = !shop.featured;
  if (!shop.featured) return;
  const owner = esc(shop.maker), state = shop.uid && shop.uid === save.uid ? 'own' : !shop.uid ? 'old' : (save.kept || []).includes(shop.uid) ? 'kept' : 'new';
  const words = {
    own: 'This is your own flyer: send it to someone, and they can keep a copy.',
    old: 'This link is from before flyers carried a copy.',
    kept: 'You have ' + owner + '\'s copy already. It\'s in your back room' + (save.made ? '.' : ', waiting for your first piece.'),
    new: 'Pinned to it, a copy of their ' + esc(shop.featured.name) + '. Keep it: it goes in your back room, ready for your own shelf. It sells as a plain one of its kind would.',
  };
  box.innerHTML = '<div>' + card(shop.featured, { short: true, price: 'ON THE FLYER' }) + '</div><div><div class="kicker">A FLYER FROM ' + owner.toUpperCase() + '\'S SHOP</div>'
    + '<p>' + words[state] + '</p><div class="rbtns left">' + (state === 'new' ? '<button class="seg go" id="keepCopy">KEEP THE COPY</button>' : '')
    + '<button class="seg" id="walkIn">WALK IN</button></div><p class="note" id="keepNote"></p></div>';
  box.querySelector('.cd').onclick = () => openLook(card(shop.featured), '');
  $('walkIn').onclick = () => $('visitFloor').scrollIntoView({ behavior: 'smooth', block: 'center' });
  if ($('keepCopy')) $('keepCopy').onclick = () => {
    const r = V.keepCopy(save, shop);
    if (!r.card) { renderVisitFlyer(shop); return; }
    store(save); Snd.play('chime');
    $('keepCopy').remove();
    $('keepNote').textContent = save.made ? 'Kept: it\'s in your back room. Put it on a shelf from THE SHOP.' : 'Kept: it waits in your back room. Make your first piece at the forge and your shelf opens.';
  };
}
function visitTap(t) {
  if (!visiting || t.slot == null) return;
  const st = visiting.stands.find(x => x.slot === t.slot); if (!st) return;
  openLook(card({ ...st.card, kind: '' }, { short: true, price: st.price + ' c' }), '<p>On their shelf at ' + st.price + ' c.</p>');
}
// a few townsfolk wander in and out, so it looks open
function visitTick() {
  if (performance.now() < visitNext) return;
  visitNext = performance.now() + 6000 + Math.random() * 8000;
  visitDio.walkIn({ at: Date.now(), type: ['folk', 'guard', 'traveller', 'delver'][Math.floor(Math.random() * 4)] });
}
// sharing your shop: the flyer (a card with your best piece pinned to it) and the link with it
async function shareShop() {
  const url = location.origin + location.pathname + '#shop=' + await packLink(V.packShop(save));
  const choices = V.showable(save), shown = save.shelf.filter(Boolean).length;
  let cv = null;
  const draw = async () => { cv = await drawFlyer({ maker: save.maker, gen: Leg.gen(save), renown: G.isNine(save) ? NINE.title : RENOWN[G.rung(save)].word, shown, charm: Rm.charm(save.room, save) }, V.featuredOf(save)); $('flyerImg').src = cv.toDataURL('image/png'); };
  openLook('<div class="sharedhead"><div class="k">YOUR FLYER</div><p>Send it with the link. Whoever opens it walks into your shop front as it stands now, and can keep a copy of the piece pinned to it.</p></div>'
    + '<img id="flyerImg" class="flyer" alt="Your shop\'s flyer">',
    '<button class="seg go" id="flyerShare">SHARE IT</button>' + (choices.length > 1 ? '<button class="seg" id="flyerNext">ANOTHER PIECE ON IT</button>' : '') + '<button class="seg" id="flyerSave">SAVE THE FLYER</button><p class="note" id="flyerNote"></p>');
  await draw();
  if ($('flyerNext')) $('flyerNext').onclick = async () => { const i = choices.findIndex(c => c.id === (V.featuredOf(save) || {}).id); save.flyerPick = choices[(i + 1) % choices.length].id; store(save); await draw(); };
  const name = 'darkclay-forge-' + (save.maker || 'shop').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png';
  $('flyerSave').onclick = () => { const a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = name; document.body.appendChild(a); a.click(); a.remove(); };
  $('flyerShare').onclick = async () => {
    const text = 'Come and see my shop in Darkclay Forge: ' + url, note = t => { $('flyerNote').textContent = t; };
    try {
      const file = new File([await flyerBlob(cv)], name, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text, title: save.maker + '\'s shop' }); return; }
      if (navigator.share) { await navigator.share({ title: save.maker + '\'s shop', text: 'Come and see my shop in Darkclay Forge.', url }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(url); note('Link copied. Save the flyer too, and send them together.'); }
    catch (e) {
      $('lookActs').insertAdjacentHTML('beforeend', '<textarea class="linkbox" readonly rows="4"></textarea>');
      const box = $('lookActs').querySelector('.linkbox'); box.value = url; box.select(); note('Copy the link from the box. Save the flyer too, and send them together.');
    }
  };
}
$('visitMine').onclick = shareShop; $('visitMine2').onclick = shareShop; $('visitMine3').onclick = shareShop;
// a shop or card link opened with the game already open in this tab: open it as a fresh page does (the game saves as it goes)
window.addEventListener('hashchange', () => { if (/^#(shop|card)=/.test(location.hash)) { save.lastSeen = Date.now(); store(save); location.reload(); } });

toHome();
// a card shared by link: shown view only, never added to this save; the away summary waits for it to close
const shared = location.hash.startsWith('#card=') ? decodeCard(location.hash.slice(6)) : null, visitLink = location.hash.startsWith('#shop=');
if (location.hash.startsWith('#card=')) history.replaceState(null, '', location.pathname + location.search);
if (shared) {
  openLook('<div class="sharedhead"><div class="k">A PIECE SHARED WITH YOU</div><p>Made by ' + esc(shared.maker || 'a maker') + ' at their forge.</p></div>' + card(shared),
    '<p>Make your own at the forge.</p>');
  $('lookClose').textContent = 'TO MY FORGE';
  const away = awaySum, close = $('lookClose').onclick;
  $('lookClose').onclick = () => { $('look').hidden = true; $('lookClose').textContent = 'CLOSE'; $('lookClose').onclick = close; showAway(away); };
} else if (location.hash.startsWith('#shop=')) {
  const token = location.hash.slice(6), away = awaySum;
  history.replaceState(null, '', location.pathname + location.search);
  unpackLink(token).then(o => V.unpackShop(o)).then(shop => {
    if (shop) toVisit(shop, away);
    else { toast('<b>This shop link won\'t open</b><br>It may be cut short. Ask for it again.'); showAway(away); }
  });
} else if (location.hash) history.replaceState(null, '', location.pathname + location.search);
// ---------- THE TITLE: three slots, the version, the licence ----------
let titleAway = null, newest = null;
const ago = ms => { const d = (Date.now() - ms) / 1000; return d < 120 ? 'just now' : d < 7200 ? Math.round(d / 60) + ' min ago' : d < 172800 ? Math.round(d / 3600) + ' hours ago' : Math.round(d / 86400) + ' days ago'; };
function showTitle(away) {
  titleAway = away || titleAway;
  save.lastSeen = Date.now(); store(save);
  const slots = peekSlots(), on = activeSlot();
  // each slot: the anvil emblem hot in its renown's colour (cold and dashed when empty), the maker, their renown, what they've done
  const HEAT = ['#8a8070', '#b8b0a2', '#8fc46a', '#6fb1ec', '#b48cf0', '#e8913a', '#e4505e'];
  $('tSlots').innerHTML = slots.map((p, i) => {
    const n = i + 1, here = n === on;
    if (!p) return '<div class="tslot empty' + (here ? ' on' : '') + '"><div class="ttop">' + emblem('', true) + '<div class="tinfo"><div class="n">SLOT ' + n + (here ? ' · THIS ONE' : '') + '</div><b>Empty</b><div class="tren">A cold forge and sixty coins.</div></div></div>'
      + '<label class="tgentle"><input type="checkbox" data-tgentle="' + n + '"> A gentler Reach: no thieves, monsters or dangers</label>'
      + '<div class="tacts"><button class="seg go" data-tplay="' + n + '">' + ICONS.flame + 'LIGHT THE FORGE</button></div></div>';
    const rung = RENOWN.reduce((a, r, k) => p.renown >= r.at ? k : a, 0);
    return '<div class="tslot' + (here ? ' on' : '') + '" style="--heat:' + HEAT[rung] + '"><div class="ttop">' + emblem(HEAT[rung]) + '<div class="tinfo"><div class="n">SLOT ' + n + (here ? ' · PLAYING' : '') + '</div><b>' + esc(p.maker) + '</b>'
      + '<div class="tren">' + ICONS.renown + (p.nine ? NINE.title : RENOWN[rung].word) + '</div></div></div>'
      + '<div class="tstats"><span title="Coins">' + ICONS.coin + p.coins.toLocaleString() + '</span><span title="Pieces made">' + ICONS.made + p.made + ' made</span><span title="Pieces sold">' + ICONS.sold + p.sold + ' sold</span>'
      + (p.lastSeen ? '<span title="Last played">' + ICONS.clock + ago(p.lastSeen) + '</span>' : '') + '</div>'
      + '<div class="tacts"><button class="seg go" data-tplay="' + n + '">' + ICONS.hammer + (here ? 'CONTINUE' : 'PLAY') + '</button><button class="seg del" data-tdel="' + n + '" aria-label="Delete slot ' + n + '">' + ICONS.sweep + 'DELETE</button></div></div>';
  }).join('');
  $('tSlots').querySelectorAll('[data-tplay]').forEach(b => b.onclick = () => playSlot(+b.dataset.tplay));
  $('tSlots').querySelectorAll('[data-tdel]').forEach(b => b.onclick = () => deleteSlot(+b.dataset.tdel));
  $('tVersion').textContent = 'VERSION ' + VERSION;
  renderUpdate();
  $('title').hidden = false; document.body.style.overflow = 'hidden';
  const first = $('tSlots').querySelector('.tslot.on [data-tplay]'); if (first) first.focus({ preventScroll: true });
  checkUpdate();
}
function closeTitle() { $('title').hidden = true; document.body.style.overflow = ''; const a = titleAway; titleAway = null; if (a) showAway(a); }
// another slot: this one written down, then the page opens again on that one (straight in, no title)
function playSlot(n) {
  const gb = $('tSlots').querySelector('[data-tgentle="' + n + '"]');
  if (gb) { if (n === activeSlot() && !save.made) { save.gentle = gb.checked; save.threatsFrom = Date.now(); store(save); } else try { sessionStorage.setItem('darkclayforge.newGentle', gb.checked ? '1' : '0'); } catch (e) { /* none */ } }
  if (n === activeSlot()) { Snd.unlock(); closeTitle(); return; }
  save.lastSeen = Date.now(); store(save); replacing = true;
  setActiveSlot(n); try { sessionStorage.setItem('darkclayforge.skipTitle', '1'); } catch (e) { /* none */ }
  location.reload();
}
function deleteSlot(n) {
  const p = peekSlots()[n - 1]; if (!p) return;
  if (!confirm('Delete slot ' + n + ' (' + p.maker + ': ' + p.coins + ' coins, ' + p.made + ' made)? It can\'t be undone. Copy a save code first if you might want it back.')) return;
  if (n === activeSlot()) { replacing = true; clearSlot(n); location.reload(); return; }
  clearSlot(n); showTitle();
}
function renderUpdate() {
  $('tUpdate').innerHTML = newest && newest > VERSION ? '<span class="new">VERSION ' + newest + ' IS OUT</span> <button class="seg go" id="tRefresh">' + ICONS.refresh + 'REFRESH</button>' : newest ? 'UP TO DATE' : '';
  if ($('tRefresh')) $('tRefresh').onclick = refreshGame;
}
// the newest release, from the site itself (never cached); a newer one than this page: offer the refresh
async function checkUpdate() {
  try {
    const j = await (await fetch('version.json?t=' + Date.now(), { cache: 'no-store' })).json();
    if (Number.isFinite(j.v)) { const was = newest; newest = j.v; renderUpdate(); if (newest > VERSION && was !== newest && $('title').hidden) toast('<b>Version ' + newest + ' is out</b><br>Open ☰ and refresh to get it.'); }
  } catch (e) { /* offline: no news */ }
}
async function refreshGame() {
  save.lastSeen = Date.now(); store(save); replacing = true;
  try { await fetch('./', { cache: 'reload' }); } catch (e) { /* the reload still comes */ }
  location.reload();
}
setInterval(checkUpdate, 15 * 60 * 1000);
$('tLicense').onclick = () => openLook('<div class="licence"><div class="sharedhead"><div class="k">THE LICENCE</div></div>'
  + '<p><b>Darkclay Forge</b> · © 2026 the author of Darkclay Forge (github.com/horatioozsvath-creator). All rights reserved.</p>'
  + '<p>The game, its code, art, 3D models, music and sounds, writing, names and look are the author\'s own work (with art and models from the author\'s game Darkclay Zero). Play it at its official address, <b>' + OFFICIAL.url + '</b>, and share links to it and to the cards and shops made in it.</p>'
  + '<p>Without the author\'s written permission, you may not copy, host or mirror it anywhere else; rename, rebrand, reskin or sell it, or present it as your own; or take its code, art, models, sounds or writing for another work. Copies found elsewhere are reported to their hosts for removal.</p>'
  + '<h3>MADE WITH</h3><p><b>three.js</b> · © 2010–2024 three.js authors · MIT License.<br><b>Alegreya</b> · © 2011 The Alegreya Project Authors · <b>Alegreya Sans</b> · © 2013 The Alegreya Sans Project Authors · <b>Cinzel</b> · © 2020 The Cinzel Project Authors · SIL Open Font License 1.1.</p>'
  + '<p>The full text is in the LICENSE file at the game\'s address.</p></div>', '');
$('titleBtn').onclick = () => showTitle();
watch(document.body);   // every button its icon, as it's drawn
$('titleBtn').innerHTML = ICONS.exit + 'EXIT';
$('tLicense').innerHTML = ICONS.scroll + 'LICENCE';
// a copy on someone else's site: say so, and where the real game is
if (!OFFICIAL.hosts.includes(location.hostname)) {
  $('copyBanner').hidden = false;
  $('copyBanner').innerHTML = 'This is an unofficial copy of Darkclay Forge. The real game, by its author, is at <a href="' + OFFICIAL.url + '">' + OFFICIAL.url + '</a>.';
}
let skipTitle = false; try { skipTitle = sessionStorage.getItem('darkclayforge.skipTitle') === '1'; sessionStorage.removeItem('darkclayforge.skipTitle'); } catch (e) { /* none */ }
if (!shared && !visitLink) { if (skipTitle) showAway(awaySum); else showTitle(awaySum); }
if (!shared && !visitLink && skipTitle && Leg.gen(save) > 1 && !save.heirWelcomed) showHeirWelcome();
awaySum = null;
requestAnimationFrame(frame);
