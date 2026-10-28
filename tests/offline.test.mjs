// Checks that the offline cache list in sw.js includes every game file.
// If this fails after you added a file, add its path to PRECACHE in sw.js
// and bump CACHE_VERSION.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

function filesIn(dir) {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const path = join(dir, name);
    return statSync(join(root, path)).isDirectory() ? filesIn(path) : [path];
  });
}

const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const precache = [...sw.matchAll(/^\s*'([^']+)',$/gm)].map((m) => m[1]);

test('every source file, font and icon is in the offline cache list', () => {
  const needed = [...filesIn('src'), ...filesIn('assets/fonts'), ...filesIn('assets/icons')]
    .map((p) => relative(root, join(root, p)))
    .filter((p) => !p.endsWith('.txt')); // license texts aren't needed to play
  const missing = needed.filter((p) => !precache.includes(p));
  assert.deepEqual(missing, [], `Add these to PRECACHE in sw.js: ${missing.join(', ')}`);
});

test('every path in the offline cache list exists and is relative', () => {
  for (const path of precache) {
    assert.ok(!path.startsWith('/'), `${path} must be relative (no leading /) to work in a website subfolder`);
    if (path === './') continue;
    assert.doesNotThrow(() => statSync(join(root, path)), `${path} is in PRECACHE but doesn't exist`);
  }
});
