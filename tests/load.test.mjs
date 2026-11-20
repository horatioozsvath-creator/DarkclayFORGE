// main.js runs the catch-up as the page loads (catchUpAll), near the top of the file: everything it calls on the way must be a
// function declaration (hoisted), never a const or let defined further down, or the page stops dead for anyone back after a while
// (release 78: grewOf and esc were consts, and the game wouldn't start for a player with staff who'd been away).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
// a function's body, to its matching brace (strings and regexes in it are few enough here not to matter)
const body = name => {
  const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' is a function declaration');
  let k = src.indexOf('{', src.indexOf(')', i)), depth = 0;
  for (let j = k; j < src.length; j++) { if (src[j] === '{') depth++; else if (src[j] === '}' && --depth === 0) return src.slice(i, j + 1); }
  return src.slice(i);
};

// each root, and where the page calls it as it loads: what it reaches must be defined before that point
for (const [root, call] of [['catchUpAll', 'let awaySum = catchUpAll('], ['toHome', '\ntoHome();']]) test('what ' + root + ' reaches at load is defined by then', () => {
  const at = src.indexOf(call);
  assert.ok(at > 0, call);
  const seen = new Set(), todo = [root];
  while (todo.length) {
    const name = todo.pop(); if (seen.has(name)) continue; seen.add(name);
    const b = body(name);
    for (const [, id] of b.matchAll(/(?<![.\w])([a-zA-Z_$][\w$]*)\(/g)) {
      const decl = src.match(new RegExp('^(const|let) ' + id.replace('$', '\\$') + ' =', 'm'));
      if (decl) assert.ok(decl.index < at, id + ' (called at load by ' + name + ') is a ' + decl[1] + ' defined after ' + root + ' runs: make it a function');
      if (new RegExp('^function ' + id + '\\(', 'm').test(src)) todo.push(id);
    }
    for (const [, id] of b.matchAll(/(?<![.\w])([a-zA-Z_$][\w$]*)\b/g)) {
      const decl = src.match(new RegExp('^(const|let) ' + id.replace('$', '\\$') + ' =', 'm'));
      if (decl && !/^(const|let) (save|rng|\$)\b/.test(decl[0])) assert.ok(decl.index < at, id + ' (used at load by ' + name + ') is defined after ' + root + ' runs');
    }
  }
});
