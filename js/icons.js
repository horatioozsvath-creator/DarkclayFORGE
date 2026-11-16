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
