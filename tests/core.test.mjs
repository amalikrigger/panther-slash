// Tests for the game rules. Run from the project folder with:
//   node --test tests/
// No install needed: these only use Node's built-in test runner, because the
// rules in src/core/ don't depend on the browser.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/game.js';
import { segmentHitsCircle } from '../src/core/geometry.js';

/** Repeatable random numbers, so a test does the same thing every run. */
function seeded(seed = 1) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const enemyType = { id: 'pumpkin', radius: 40, points: 10, juice: '#f80', weight: 1 };

function makeRules(overrides = {}) {
  return {
    gravity: 1400,
    spawn: {
      firstThrowDelay: 999, // tests place enemies by hand unless they ask for spawning
      startInterval: 1.6, minInterval: 0.75, intervalShrink: 0.01,
      minPerThrow: 1, maxPerThrow: 3, maxPerThrowLate: 5, lateGameAfter: 30,
      bombChanceStart: 0.1, bombChanceLate: 0.2, apexMin: 0.15, apexMax: 0.5, spinMax: 4,
    },
    scoring: { comboWindow: 0.35, comboMin: 3, comboBonusPerHit: 10, criticalChance: 0 },
    enemies: [enemyType],
    bomb: { radius: 40, classicEndsGame: true, challengePenalty: 50 },
    goldenPanther: { radius: 50, points: 100, chancePerThrow: 0 },
    lives: 3,
    roundSeconds: 60,
    ...overrides,
  };
}

const BOUNDS = { left: 0, top: 0, right: 800, bottom: 560 };

/** Put a motionless thing on screen at (x, y). Gravity is set to 0 so it stays put. */
function place(game, kind, x, y) {
  const entity = {
    id: game.nextId++, kind, x, y, vx: 0, vy: 0, rotation: 0, spin: 0,
    hasRisen: true, sliced: false, radius: 40,
    type: kind === 'bomb' ? { id: 'bomb' } : enemyType,
    points: kind === 'bomb' ? 0 : 10,
  };
  game.entities.push(entity);
  return entity;
}

/** A horizontal swipe straight through (x, y). */
const swipeThrough = (x, y) => [[x - 100, y, x + 100, y]];

// --- Geometry -----------------------------------------------------------------

test('a fast swipe that jumps over an enemy between two frames still hits it', () => {
  // Neither end of the segment is inside the circle, but the middle is.
  assert.equal(segmentHitsCircle(0, 100, 400, 100, 200, 100, 30), true);
});

test('a swipe that stops just short of an enemy misses', () => {
  assert.equal(segmentHitsCircle(0, 100, 165, 100, 200, 100, 30), false);
});

test('a swipe passing just outside the edge misses', () => {
  assert.equal(segmentHitsCircle(0, 131, 400, 131, 200, 100, 30), false);
});

// --- Slicing and scoring ------------------------------------------------------

test('slicing an enemy scores its points once, even if the swipe crosses it twice', () => {
  const game = new Game({ mode: 'challenge', rules: makeRules({ gravity: 0 }), random: seeded() });
  place(game, 'enemy', 300, 300);
  game.update(0.016, [...swipeThrough(300, 300), ...swipeThrough(300, 300)], BOUNDS);
  assert.equal(game.score, 10);
  assert.equal(game.stats.sliced, 1);
});

test('three quick slices make a combo and earn the bonus', () => {
  const game = new Game({ mode: 'challenge', rules: makeRules({ gravity: 0 }), random: seeded() });
  for (const x of [100, 300, 500]) place(game, 'enemy', x, 300);
  game.update(0.016, [[0, 300, 700, 300]], BOUNDS);
  // Combo bonus is paid when the combo window closes.
  game.update(0.5, [], BOUNDS);
  assert.equal(game.score, 3 * 10 + 3 * 10);
  assert.equal(game.stats.bestCombo, 3);
});

test('two slices are not enough for a combo bonus', () => {
  const game = new Game({ mode: 'challenge', rules: makeRules({ gravity: 0 }), random: seeded() });
  for (const x of [100, 300]) place(game, 'enemy', x, 300);
  game.update(0.016, [[0, 300, 700, 300]], BOUNDS);
  game.update(0.5, [], BOUNDS);
  assert.equal(game.score, 20);
});

test('a combo still in progress when time runs out still counts', () => {
  const game = new Game({ mode: 'challenge', rules: makeRules({ gravity: 0, roundSeconds: 1 }), random: seeded() });
  for (const x of [100, 300, 500]) place(game, 'enemy', x, 300);
  game.update(0.9, [[0, 300, 700, 300]], BOUNDS);
  game.update(0.2, [], BOUNDS); // time runs out inside the combo window
  assert.equal(game.isOver, true);
  assert.equal(game.score, 60);
});

// --- Bombs --------------------------------------------------------------------

test('Classic: slicing a bomb ends the game', () => {
  const game = new Game({ mode: 'classic', rules: makeRules({ gravity: 0 }), random: seeded() });
  place(game, 'bomb', 300, 300);
  const events = game.update(0.016, swipeThrough(300, 300), BOUNDS);
  assert.equal(game.isOver, true);
  assert.equal(game.endReason, 'bomb');
  assert.ok(events.some((e) => e.type === 'end'));
});

test('Challenge: a bomb costs points but never takes the score below zero', () => {
  const game = new Game({ mode: 'challenge', rules: makeRules({ gravity: 0 }), random: seeded() });
  game.score = 30;
  place(game, 'bomb', 300, 300);
  game.update(0.016, swipeThrough(300, 300), BOUNDS);
  assert.equal(game.isOver, false);
  assert.equal(game.score, 0);
});

test('Challenge: a bomb breaks a combo in progress', () => {
  const game = new Game({ mode: 'challenge', rules: makeRules({ gravity: 0 }), random: seeded() });
  place(game, 'enemy', 100, 300);
  place(game, 'enemy', 300, 300);
  place(game, 'bomb', 500, 300);
  place(game, 'enemy', 650, 300);
  game.update(0.016, [[0, 300, 700, 300]], BOUNDS);
  game.update(0.5, [], BOUNDS);
  // 2 slices (+20), the bomb (-20, can't go below 0), 1 more slice (+10).
  // Three slices, but the bomb split them, so no combo bonus.
  assert.equal(game.score, 10);
  assert.equal(game.stats.bestCombo, 2);
});

// --- Misses, lives and the timer ------------------------------------------------

test('Classic: an enemy falling off the bottom costs a life; three misses end the game', () => {
  const game = new Game({ mode: 'classic', rules: makeRules(), random: seeded() });
  for (let i = 0; i < 3; i++) {
    const e = place(game, 'enemy', 200 + i * 100, 500);
    e.vy = 400; // falling
  }
  for (let i = 0; i < 30 && !game.isOver; i++) game.update(0.05, [], BOUNDS);
  assert.equal(game.lives, 0);
  assert.equal(game.endReason, 'lives');
});

test('an enemy that was thrown up from below the screen is not a miss before it appears', () => {
  const game = new Game({ mode: 'classic', rules: makeRules(), random: seeded() });
  const e = place(game, 'enemy', 300, BOUNDS.bottom + 40);
  e.hasRisen = false;
  e.vy = -900; // still on its way up
  game.update(0.016, [], BOUNDS);
  assert.equal(game.lives, 3);
});

test('Challenge: missing an enemy costs nothing', () => {
  const game = new Game({ mode: 'challenge', rules: makeRules(), random: seeded() });
  const e = place(game, 'enemy', 300, 550);
  e.vy = 400;
  for (let i = 0; i < 10; i++) game.update(0.05, [], BOUNDS);
  assert.equal(game.lives, 3);
  assert.equal(game.isOver, false);
});

test('Challenge: the round ends exactly once when the timer reaches zero, and nothing scores after', () => {
  const game = new Game({ mode: 'challenge', rules: makeRules({ gravity: 0, roundSeconds: 2 }), random: seeded() });
  let ends = 0;
  for (let i = 0; i < 50; i++) ends += game.update(0.05, [], BOUNDS).filter((e) => e.type === 'end').length;
  assert.equal(ends, 1);
  assert.equal(game.endReason, 'time');
  place(game, 'enemy', 300, 300);
  game.update(0.016, swipeThrough(300, 300), BOUNDS);
  assert.equal(game.score, 0);
});

// --- Throwing -----------------------------------------------------------------

test('thrown enemies peak inside the visible screen on wide and tall screens', () => {
  for (const bounds of [BOUNDS, { left: 0, top: 0, right: 640, bottom: 1385 }]) {
    const rules = makeRules();
    rules.spawn = { ...rules.spawn, firstThrowDelay: 0 };
    const game = new Game({ mode: 'challenge', rules, random: seeded(7) });
    game.update(0.001, [], bounds);
    assert.ok(game.entities.length > 0);
    for (const e of game.entities) {
      const apexY = e.y - (e.vy * e.vy) / (2 * rules.gravity);
      assert.ok(apexY > bounds.top, `apex ${apexY} is above the screen`);
      assert.ok(apexY < bounds.bottom * 0.6, `apex ${apexY} is too low to reach`);
    }
  }
});

test('the first thing in every volley is never a bomb', () => {
  const rules = makeRules();
  rules.spawn = { ...rules.spawn, firstThrowDelay: 0, bombChanceStart: 1, bombChanceLate: 1 };
  const game = new Game({ mode: 'challenge', rules, random: seeded(3) });
  game.update(0.001, [], BOUNDS);
  assert.equal(game.entities[0].kind, 'enemy');
});
