// Tests for problems found in the pre-event review. Each one checks a way the
// game could break on event night. Run with: node --test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as CONFIG from '../src/config.js';
import { artKeysFromConfig } from '../src/render/sprites.js';
import { DRAWN_NAMES } from '../src/render/art.js';
import { summarizeRounds, percentile } from '../src/core/stats.js';

// --- Pictures ------------------------------------------------------------------

test('every thing that can be thrown has its picture loaded at startup', () => {
  // A missing picture (the Frost Orb's, once) froze the game the moment one
  // was thrown.
  const loaded = artKeysFromConfig(CONFIG);
  const thrown = [...CONFIG.ENEMIES, CONFIG.BOMB, CONFIG.GOLDEN_PANTHER, CONFIG.FROST_ORB];
  for (const thing of thrown) assert.ok(loaded.includes(thing.art), `${thing.art} is never loaded`);
});

test('every "drawn:" picture in config.js exists in art.js', () => {
  for (const key of artKeysFromConfig(CONFIG).filter((k) => k.startsWith('drawn:'))) {
    assert.ok(DRAWN_NAMES.includes(key.slice('drawn:'.length)), `${key} has no drawing in src/render/art.js`);
  }
});

test('picture paths are relative, so they work in a website subfolder', () => {
  for (const key of artKeysFromConfig(CONFIG).filter((k) => !k.startsWith('drawn:'))) {
    assert.ok(!key.startsWith('/'), `${key} must not start with /`);
  }
});

// --- Saved data -----------------------------------------------------------------

test('damaged saved data falls back to defaults instead of crashing', async () => {
  // Pretend localStorage holds values in the wrong format.
  const stored = {
    'pantherSlash.v1.scores': 'null',
    'pantherSlash.v1.prizes': '{"oops":1}',
    'pantherSlash.v1.best': '[1,2]',
    'pantherSlash.v1.roundCounter': '"seven"',
    'pantherSlash.v1.bad': '{not json',
  };
  globalThis.localStorage = { getItem: (k) => stored[k] ?? null, setItem() {}, removeItem() {} };
  const { load } = await import('../src/storage/store.js');
  assert.deepEqual(load('scores', []), []);
  assert.deepEqual(load('prizes', []), []);
  assert.deepEqual(load('best', {}), {});
  assert.equal(load('roundCounter', 0), 0);
  assert.equal(load('bad', 5), 5);
  delete globalThis.localStorage;
});

// --- Staff stats -------------------------------------------------------------------

test('stats count only Challenge rounds as paid plays, and count prizes by tier', () => {
  const rounds = [
    { mode: 'challenge', score: 100, tierId: null },
    { mode: 'challenge', score: 500, tierId: 'bronze' },
    { mode: 'challenge', score: 900, tierId: 'silver' },
    { mode: 'challenge', score: 450, tierId: 'bronze' },
    { mode: 'classic', score: 9999, tierId: null },
  ];
  const stats = summarizeRounds(rounds);
  assert.equal(stats.challengeRounds, 4);
  assert.equal(stats.classicRounds, 1);
  assert.deepEqual(stats.prizes, { bronze: 2, silver: 1 });
  assert.equal(stats.best, 900); // the Classic 9999 doesn't count
});

test('stats with no rounds show nothing instead of a wrong number', () => {
  const stats = summarizeRounds([]);
  assert.equal(stats.median, null);
  assert.equal(stats.best, null);
  assert.equal(percentile([], 0.5), null);
});

test('the middle score is the median', () => {
  assert.equal(percentile([10, 20, 30, 40, 50], 0.5), 30);
  assert.equal(percentile([10, 20, 30, 40, 50], 0), 10);
  assert.equal(percentile([10, 20, 30, 40, 50], 1), 50);
});
