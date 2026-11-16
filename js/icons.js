// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// The game's own small icons, drawn here as SVG (24 × 24, in the text's colour), for buttons and the title's slots.
const svg = (body, extra = '') => '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' + extra + '>' + body + '</svg>';
export const ICONS = {
  // an anvil: the horn to the left, the face, the waist, the feet
  anvil: svg('<path d="M2.5 7.5h15.5v2.2c0 1.6-1.3 2.8-2.9 2.8H13v2.3l2.6 3.7H6.4L9 14.8v-2.3H7.4C4.7 12.5 2.5 10.3 2.5 7.5z"/><path d="M18 7.5l3.5-1.2v3.2L18 9.2"/>'),
  // a hammer striking: the head, the haft, a spark
  hammer: svg('<path d="M5.2 4.8l4-3 4.2 4.4-4 3z"/><path d="M11.3 7.6l8.2 8.6a1.5 1.5 0 0 1-2.1 2.1l-8.4-8.4"/><path d="M3 12l1.6.4M4.8 15.2l1-1.3M2.6 8.8l1.5-.4"/>'),
  // a flame: a cold forge lit
  flame: svg('<path d="M12 2.8c.6 3 4.9 4.9 4.9 10.1a4.9 4.9 0 0 1-9.8 0c0-2.6 1.4-3.6 1.8-6 1.3.9 1.9 2.1 1.9 3.3.4-2.3.5-4.6 1.2-7.4z"/><path d="M12 20.1c-1.5 0-2.4-1-2.4-2.4 0-1.5 1.4-2.2 2.4-3.9 1 1.7 2.4 2.4 2.4 3.9 0 1.4-.9 2.4-2.4 2.4z"/>'),
  // a coin, stamped
  coin: svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5.2"/><path d="M12 9.5v5"/>'),
  // renown: a hanging banner with a star
  renown: svg('<path d="M6 3h12v15l-6-3.2L6 18z"/><path d="M12 6.4l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z"/>'),
  // made: a piece on the anvil's face (a small blade)
  made: svg('<path d="M3 15.5h18"/><path d="M5 13.2L17.5 9l2 1.2-1.6 1.7L6.3 15.5"/><path d="M5.8 18.5h12.4"/>'),
  // sold: the shop's scales
  sold: svg('<path d="M12 4v15M7 19.5h10M5 7.5h14M12 4.5l-.5 3"/><path d="M5 7.5L2.5 13a2.5 2.5 0 0 0 5 0zM19 7.5L16.5 13a2.5 2.5 0 0 0 5 0z"/>'),
  // last played: an hourglass
  clock: svg('<path d="M6.5 3h11M6.5 21h11"/><path d="M7.5 3c0 4.5 4.5 6 4.5 9s-4.5 4.5-4.5 9M16.5 3c0 4.5-4.5 6-4.5 9s4.5 4.5 4.5 9"/><path d="M9.5 19h5"/>'),
  // delete: the slot's ashes swept away (a brush over embers)
  sweep: svg('<path d="M14.5 3.5l-6 9"/><path d="M6.8 11.3l4.9 3.2-1.9 3c-.8 1.2-2.5 1.6-3.7.8l-1.6-1c-1.2-.8-1.5-2.4-.7-3.6z"/><path d="M15 19.5h.01M18 17h.01M20 20h.01"/>'),
  // the licence: a sealed scroll
  scroll: svg('<path d="M6 4h11a2.5 2.5 0 0 1 0 5H16v9.5a2.5 2.5 0 0 1-2.5 2.5H5a2.5 2.5 0 0 1-2.5-2.5V17H13"/><path d="M6 4a2.5 2.5 0 0 0-2.5 2.5V17"/><circle cx="9.5" cy="12.5" r="2"/>'),
  // exit: an open door, the way out marked
  exit: svg('<path d="M13.5 3.5H5.5v17h8"/><path d="M5.5 3.5l6 2v15l-6-2"/><path d="M16 12h6M19 9l3 3-3 3"/><path d="M9 12.5h.01"/>'),
  // the shop: a front with its awning
  shop: svg('<path d="M3.5 9.5v10.5h17V9.5"/><path d="M2.5 9.5l2-5h15l2 5"/><path d="M2.5 9.5c0 1.4 1.1 2.5 2.5 2.5s2.4-1.1 2.4-2.5c0 1.4 1.1 2.5 2.4 2.5s2.6-1.1 2.6-2.5c0 1.4 1.1 2.5 2.6 2.5s2.4-1.1 2.4-2.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5"/><path d="M10 20v-5h4v5"/>'),
  // the suppliers: a laden crate
  crate: svg('<path d="M3.5 8.5h17v11h-17z"/><path d="M3.5 8.5l2.5-4h12l2.5 4"/><path d="M3.5 14h17M9 8.5v11M15 8.5v11"/>'),
  // the staff: two figures
  people: svg('<circle cx="9" cy="7.5" r="3"/><path d="M3.5 20c0-3.3 2.4-6 5.5-6s5.5 2.7 5.5 6"/><circle cx="16.5" cy="8.5" r="2.4"/><path d="M15 13.6c3 0 5.5 2.2 5.5 5.6"/>'),
  // the Landing: a riverboat on the water
  boat: svg('<path d="M3 13.5h18l-2.5 4.5h-13z"/><path d="M12 13.5V3.5l6 7.5h-6"/><path d="M2.5 21c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"/>'),
  // a shelf with things on it
  shelf: svg('<path d="M3 4v16M21 4v16M3 11.5h18M3 19h18"/><path d="M6 11.5V8h3v3.5M13 11.5V7.5l3.5 1v3M6.5 19v-4h3.5v4M14 19v-3h4v3"/>'),
  // the wall: a framed piece
  frame: svg('<rect x="4" y="5" width="16" height="15" rx="1"/><rect x="7" y="8" width="10" height="9"/><path d="M9 3l3-1 3 1M8 15l3-3 2 2 2-1"/>'),
  // furnish: a lamp on its stand
  lamp: svg('<path d="M8 3h8l2 6H6z"/><path d="M12 9v9M8 21h8M10 18h4"/>'),
  // the ledger: a bound book
  book: svg('<path d="M5 4.5h11.5a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2z"/><path d="M5 18a2 2 0 0 1 2-2h11.5"/><path d="M9 8h6M9 11h4"/>'),
  // in town: a notice pinned up
  notice: svg('<path d="M5 6h14v14H5z"/><circle cx="12" cy="6" r="1.6"/><path d="M8 11h8M8 14h8M8 17h5"/>'),
  // the Hall: a column
  column: svg('<path d="M5 4h14M6.5 6.5h11M5 21h14M6.5 18.5h11"/><path d="M8 6.5v12M12 6.5v12M16 6.5v12"/>'),
  // money in: a coin and a plus
  buy: svg('<circle cx="9" cy="13" r="6"/><path d="M9 10.5v5"/><path d="M18.5 4v6M15.5 7h6"/>'),
  // the haggle: down, level, up
  down: svg('<path d="M12 4v15M6 13l6 6 6-6"/>'),
  level: svg('<path d="M4 9h16M4 15h16"/>'),
  up: svg('<path d="M12 20V5M6 11l6-6 6 6"/>'),
  split: svg('<path d="M12 3v6M12 9l-6 6v6M12 9l6 6v6"/>'),
  check: svg('<path d="M4 12.5l5 5L20 6.5"/>'),
  cross: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  swap: svg('<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/>'),
  // share: a card sent on its way
  share: svg('<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>'),
  copy: svg('<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>'),
  download: svg('<path d="M12 4v11M7 10.5l5 5 5-5M4.5 19.5h15"/>'),
  upload: svg('<path d="M12 16V5M7 9.5l5-5 5 5M4.5 19.5h15"/>'),
  folder: svg('<path d="M3.5 6.5h6l2 2h9v10.5h-17z"/>'),
  // people come and go
  hire: svg('<circle cx="9.5" cy="7.5" r="3.2"/><path d="M3.5 20c0-3.4 2.7-6 6-6s6 2.6 6 6"/><path d="M19 8v6M16 11h6"/>'),
  letgo: svg('<circle cx="9.5" cy="7.5" r="3.2"/><path d="M3.5 20c0-3.4 2.7-6 6-6s6 2.6 6 6"/><path d="M16 11h6"/>'),
  road: svg('<path d="M8 21l2.5-18M16 21L13.5 3"/><path d="M12 6v2M12 11v2.5M12 17v3"/>'),
  // the back room's workings
  rework: svg('<path d="M12 3c.6 2.6 4 4.2 4 8.2a4 4 0 0 1-8 0c0-2 1.1-2.9 1.4-4.8 1 .7 1.5 1.6 1.5 2.6.3-1.9.4-3.7 1.1-6z"/><path d="M4 18.5a8.5 8.5 0 0 0 16 0"/><path d="M4 21v-2.5h2.5"/>'),
  broken: svg('<path d="M4 14l6-6 2.5 2.5L8 15"/><path d="M14.5 8.5L20 4M13 13l2.5 2.5L20 11"/><path d="M5 19.5h.01M9 20h.01M16 20h.01M19.5 18h.01"/>'),
  parcel: svg('<path d="M4 8l8-4 8 4v9l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v9M8 6l8 4"/>'),
  takedown: svg('<path d="M5 5h14M12 8v11M7.5 14.5L12 19l4.5-4.5"/>'),
  arrange: svg('<path d="M12 3v18M3 12h18M12 3l-2.5 2.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5"/>'),
  turn: svg('<path d="M19 12a7 7 0 1 1-2-4.9"/><path d="M19 4.5V9h-4.5"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  back: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  next: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  tiles: svg('<rect x="3.5" y="5" width="5" height="7" rx="1"/><rect x="9.5" y="5" width="5" height="7" rx="1"/><rect x="15.5" y="5" width="5" height="7" rx="1"/><rect x="6.5" y="13" width="5" height="7" rx="1"/><rect x="12.5" y="13" width="5" height="7" rx="1"/>'),
  star: svg('<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/>'),
  build: svg('<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M12 11v6M9 14h6"/>'),
  expand: svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  gem: svg('<path d="M6 3.5h12l3 5-9 12-9-12z"/><path d="M3 8.5h18M9 3.5l-1.5 5L12 20.5l4.5-12L15 3.5"/>'),
  crown: svg('<path d="M3.5 18.5l-1-11 5.5 4.5L12 5l4 7 5.5-4.5-1 11z"/><path d="M4 21h16"/>'),
  cauldron: svg('<path d="M4 10h16c0 5-3.6 9-8 9s-8-4-8-9z"/><path d="M3 10h18M7 21l1.5-2.5M17 21l-1.5-2.5"/><path d="M9 7c0-1.5 1.5-1.5 1.5-3M13.5 7c0-1.5 1.5-1.5 1.5-3"/>'),
  bookmark: svg('<path d="M6 3.5h12V21l-6-4-6 4z"/>'),
  door: svg('<path d="M6 21V4h12v17"/><path d="M3.5 21h17"/><circle cx="14.5" cy="12.5" r=".9"/>'),
  bubble: svg('<path d="M4 5h16v11H11l-5 4v-4H4z"/><path d="M4 4l16 16"/>'),
  skills: svg('<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/><path d="M12 8v5"/>'),
  scroll2: svg('<path d="M7 3.5h10v17H7z"/><path d="M10 7.5h4M10 11h4M10 14.5h3"/>'),
  music: svg('<path d="M9 17.5V5.5l11-2v12"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/>'),
  sound: svg('<path d="M4 9.5h4l5-4v13l-5-4H4z"/><path d="M16.5 9a4.5 4.5 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>'),
  // refresh: a turning arrow
  refresh: svg('<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/>'),
};
// a slot's emblem: the anvil, hot in the colour of the maker's renown, or cold and dashed for an empty slot
export function emblem(heat, empty) {
  if (empty) return '<svg class="emblem cold" viewBox="0 0 64 64" aria-hidden="true"><rect x="3" y="3" width="58" height="58" rx="10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4"/>'
    + '<path d="M10 26h34v4c0 3.5-2.8 6-6.2 6H34v5l5.5 8H20.5L26 41v-5h-3.4C15.7 36 10 32.3 10 26z" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"/><path d="M44 26l8-2.5v6.5L44 29" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"/></svg>';
  return '<svg class="emblem" viewBox="0 0 64 64" aria-hidden="true" style="--heat:' + heat + '"><defs><radialGradient id="eg' + heat.replace(/[^a-z0-9]/gi, '') + '" cx="50%" cy="38%" r="60%"><stop offset="0" stop-color="' + heat + '" stop-opacity=".55"/><stop offset="1" stop-color="' + heat + '" stop-opacity="0"/></radialGradient></defs>'
    + '<rect x="3" y="3" width="58" height="58" rx="10" fill="#140e0a" stroke="' + heat + '" stroke-width="2"/><rect x="3" y="3" width="58" height="58" rx="10" fill="url(#eg' + heat.replace(/[^a-z0-9]/gi, '') + ')"/>'
    + '<path d="M32 9c.8 3.6 5.6 5.3 5.6 10.6a5.6 5.6 0 0 1-11.2 0c0-2.8 1.6-4 2-6.6 1.4 1 2.1 2.3 2.1 3.6.5-2.5.7-5 1.5-7.6z" fill="' + heat + '" opacity=".9"/>'
    + '<path d="M10 28h34v4c0 3.5-2.8 6-6.2 6H34v5l5.5 8H20.5L26 43v-5h-3.4C15.7 38 10 34.3 10 28z" fill="#4a4440" stroke="#0e0b09" stroke-width="2"/><path d="M44 28l8-2.5v6.5L44 31z" fill="#4a4440" stroke="#0e0b09" stroke-width="2"/>'
    + '<path d="M12 28h32" stroke="' + heat + '" stroke-width="2" opacity=".8"/></svg>';
}

// ---------- every button its icon: matched on what it says, first match wins ----------
const RULES = [
  [/^EXIT\b/, 'exit'], [/^SKILLS\b/, 'skills'], [/^BANK\b/, 'coin'], [/^PUT IN$/, 'down'], [/^TAKE OUT$/, 'up'], [/^ALL MY PURSE$/, 'coin'], [/^BORROW$/, 'scroll'], [/^REPAY/, 'check'], [/^SPARE THIS SAVE|^LET THE REACH IN/, 'lamp'], [/^THE FORGE IS STILL WARM/, 'flame'], [/^READ THE ENDING/, 'book'], [/^KEEP IT$/, 'crown'], [/^FILL FROM THE BACK/, 'crate'], [/^LEDGER\b/, 'book'], [/^ON THE BOOKS\b/, 'scroll2'], [/^BUY WHAT'S SHORT/, 'buy'], [/^MAKE IT/, 'hammer'], [/^THE FORGE$|^TO THE FORGE|^TO MY FORGE|^BACK TO MY FORGE/, 'anvil'], [/^THE SHOP( FRONT)?$|^TO THE SHOP|IN THE BACK · TO THE SHOP/, 'shop'],
  [/^SUPPLIERS$|^TO THE SUPPLIERS/, 'crate'], [/^STAFF$/, 'people'], [/^THE LANDING$/, 'boat'], [/^THE WORKSHOP$|^WORKSHOP$/, 'anvil'], [/^THE HALL$/, 'column'],
  [/^STRIKE/, 'hammer'], [/^INTO THE FIRE|^OUT OF THE FIRE|^STOKE|^HEAT IT|^SOAK IT|^INTO THE STEAM|^BACK TO THE GLORY/, 'flame'], [/QUENCH|^STOP|^SET$|^STRING$|^LET IT DRY/, 'check'],
  [/^WORK IT|^WORK ANOTHER|^CONTINUE|^PLAY$/, 'hammer'], [/^MAKE IT$/, 'anvil'], [/^LEAVE IT/, 'back'], [/^LIGHT THE FORGE|^NEW GAME/, 'flame'],
  [/^THE RELIC WORKING/, 'gem'], [/^THE MYTHIC WORKING/, 'crown'], [/^MASTER|TOWARD OLD-BLOOD/, 'cauldron'], [/BACK IN THE FIRE|BACK ON THE FIRE|BACK INTO THE STEAM|BACK TO THE FRAME|^REWORK/, 'rework'],
  [/^BREAK IT DOWN/, 'broken'], [/^DELIVER/, 'parcel'], [/^TAKE IT DOWN|^BRING IT BACK/, 'takedown'], [/^PUT IT ON THE SHELF|^ON THE SHELF|^ANOTHER SHELF|^MAKE IT A /, 'shelf'],
  [/^HANG IT|^THE WALL$/, 'frame'], [/^SHELF$|^ITS SHELVES/, 'shelf'], [/^FURNISH$|^BUY · /, 'lamp'], [/^LEDGER$/, 'book'], [/^IN TOWN$|^ITS TOWN$/, 'notice'],
  [/^ANOTHER PLINTH|^A GLASS CASE/, 'column'], [/BIGGER/, 'expand'], [/^SET IT UP|^BUILD IT/, 'build'], [/^ARRANGE|^DONE$/, 'arrange'], [/^TURN$/, 'turn'], [/^SELL BACK/, 'sold'],
  [/^MEET THEM/, 'down'], [/^HOLD/, 'level'], [/^ASK MORE/, 'up'], [/^SPLIT THE DIFFERENCE/, 'split'], [/^TAKE IT\b|^GOT IT$/, 'check'], [/^NO$|^REFUSE|^NOTHING FOR THEM|^NO THANKS/, 'cross'],
  [/^SHOW ANOTHER|^ANOTHER PIECE ON IT/, 'swap'], [/^BUY IT/, 'buy'], [/^SHARE|^VISIT MY SHOP/, 'share'], [/^COPY SAVE CODE/, 'copy'], [/^SAVE AS A FILE|^SAVE THE FLYER/, 'download'],
  [/^LOAD THIS CODE/, 'upload'], [/^OPEN A SAVE FILE/, 'folder'], [/^HIRE/, 'hire'], [/^LET THEM GO/, 'letgo'], [/^SEND|DOWN TO THE YARD|THE FORD VILLAGES|OUT TO THE REACH|DEEP DOORS/, 'road'],
  [/^THE STRIP/, 'tiles'], [/^CLOSE$|^✕$/, 'close'], [/^←$/, 'back'], [/^LICENCE/, 'scroll'], [/^REFRESH/, 'refresh'], [/^DELETE/, 'sweep'], [/^KEEP THE COPY/, 'bookmark'],
  [/^WALK IN/, 'door'], [/^GO OUT TO THE FALLEN STAR/, 'star'], [/^NO MORE HINTS/, 'bubble'], [/^SKILLS$|^LEARN/, 'skills'], [/^PATTERNS$/, 'scroll2'], [/^FOUND TILES$/, 'tiles'],
  [/^ON THE BOOKS$/, 'people'], [/^LOOKING FOR WORK$/, 'hire'], [/^SAVE$/, 'download'], [/^THE YARD$|^TANNERY$|^TIMBER$|^SANDPIT$|^HERBS$|^PEDLAR$/, 'crate'],
];
const SKIP = '.pat, .slot-empty, .bag button, .pickgrid button, .shelf.slots > button, .kit .seg, [data-tag], .tslot .seg, .buyrow .seg, .mute:not(.exitbtn), .stripbtn, .unk';
export function iconFor(text) { const t = text.trim().toUpperCase(); const r = RULES.find(([re]) => re.test(t)); return r ? ICONS[r[1]] : null; }
export function decorate(root) {
  root.querySelectorAll('button').forEach(b => {
    if (b.querySelector('.ico') || b.matches(SKIP) || b.closest('.cd')) return;
    const t = (b.textContent || '').trim(), ic = iconFor(t); if (!ic) return;
    if (/^[✕←]$/.test(t)) b.innerHTML = ic; else b.insertAdjacentHTML('afterbegin', ic);   // a bare symbol: the icon instead
    b.classList.add('has-ico');
  });
}
// buttons drawn later get theirs as they appear
export function watch(root) {
  decorate(root);
  let queued = false;
  new MutationObserver(() => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; decorate(root); }); }).observe(root, { childList: true, subtree: true, characterData: true });
}
