// Milestone 43: Saltby's own counter view. The coast's painted backdrops (tools/backdrops.py SEA=1): every view, shape, shelf place,
// overlay and gift the Reach's has, in assets/backdrops/sea/; a coastal save's counter view draws them (js/counter.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { dirOf } from '../js/counter.js';

const ROOT = new URL('../assets/backdrops/', import.meta.url);
const read = p => JSON.parse(fs.readFileSync(new URL(p, ROOT), 'utf8'));
const has = p => fs.existsSync(new URL(p, ROOT));

test('the coast\'s backdrops: the same views, shapes, shelves and overlays as the Reach\'s, and every picture there', () => {
  for (const size of [0, 1, 2]) {
    const reach = read(`s${size}/backdrops.json`), sea = read(`sea/s${size}/backdrops.json`);
    assert.deepEqual(Object.keys(sea).sort(), Object.keys(reach).sort());
    for (const view of Object.keys(reach)) for (const shape of Object.keys(reach[view])) {
      const a = reach[view][shape], b = sea[view] && sea[view][shape]; assert.ok(b, `${size} ${view} ${shape}`);
      assert.deepEqual(Object.keys(b.over || {}).sort(), Object.keys(a.over || {}).sort(), `${size} ${view} ${shape}: overlays`);
      assert.deepEqual((b.units || []).map(u => u.k), (a.units || []).map(u => u.k), `${size} ${view} ${shape}: shelf places`);
      const dir = `sea/s${size}/${view}_${shape}`;
      assert.ok(has(dir + '.webp'), dir);
      if (b.fg) assert.ok(has(dir + '_fg.webp'), dir + '_fg');
      if (b.cold) assert.ok(has(dir + '_cold.webp'), dir + '_cold');
      for (const o of Object.keys(b.over || {})) assert.ok(has(`${dir}_${o}.webp`), `${dir}_${o}`);
      for (const u of b.units || []) for (const m of Object.keys(u.sprites)) assert.ok(has(`${dir}_u${u.k}_${m}.webp`), `${dir}_u${u.k}_${m}`);
    }
  }
});

test('a coastal save draws the coast\'s pictures; the Reach and the second shop (no region) draw the Reach\'s', () => {
  assert.equal(dirOf({ region: 'greyshore' }, 1), 'assets/backdrops/sea/s1/');
  assert.equal(dirOf({}, 1), 'assets/backdrops/s1/'); assert.equal(dirOf({ region: 'reach' }, 2), 'assets/backdrops/s2/');
});
