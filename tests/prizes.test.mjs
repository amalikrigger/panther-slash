// Tests for prize tiers, verification codes and the leaderboard rules.
// Run with: node --test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tierFor, nextTier, verificationCode, roundLabel, CODE_LENGTH } from '../src/core/prizes.js';
import { topEntries, qualifies, trimEntries, normalizeInitials, checkInitials, localDate } from '../src/core/leaderboard.js';

const TIERS = [
  { id: 'bronze', minScore: 400 },
  { id: 'silver', minScore: 800 },
  { id: 'gold', minScore: 1300 },
  { id: 'legendary', minScore: 2000 },
];

// --- Tiers --------------------------------------------------------------------

test('a score exactly on a threshold earns that tier; one point less does not', () => {
  assert.equal(tierFor(800, TIERS).id, 'silver');
  assert.equal(tierFor(799, TIERS).id, 'bronze');
  assert.equal(tierFor(399, TIERS), null);
});

test('scores above the top tier stay at the top tier', () => {
  assert.equal(tierFor(99999, TIERS).id, 'legendary');
  assert.equal(nextTier(99999, TIERS), null);
});

test('the next tier is the first one not reached yet', () => {
  assert.equal(nextTier(0, TIERS).id, 'bronze');
  assert.equal(nextTier(800, TIERS).id, 'gold');
});

// --- Verification codes ---------------------------------------------------------

const ROUND = { eventWord: 'pumpkin', station: 'B', round: 47, score: 1420, tierId: 'gold', date: '2026-10-29' };

test('the same round always gives the same code, on any device', () => {
  assert.equal(verificationCode(ROUND), verificationCode({ ...ROUND }));
  assert.equal(verificationCode(ROUND).length, CODE_LENGTH);
});

test('the event word ignores case and stray spaces, so staff typing it on another device still matches', () => {
  assert.equal(verificationCode(ROUND), verificationCode({ ...ROUND, eventWord: '  PUMPKIN ' }));
});

test('changing the score, round, station, tier, date or event word changes the code', () => {
  const original = verificationCode(ROUND);
  const changes = [{ score: 1421 }, { round: 48 }, { station: 'C' }, { tierId: 'legendary' }, { date: '2026-10-30' }, { eventWord: 'ghost' }];
  for (const change of changes) {
    assert.notEqual(verificationCode({ ...ROUND, ...change }), original, `code did not change for ${JSON.stringify(change)}`);
  }
});

test('codes never use easily confused characters', () => {
  for (let score = 0; score < 3000; score += 7) {
    assert.doesNotMatch(verificationCode({ ...ROUND, score }), /[0O1IL2Z5S8B]/);
  }
});

test('round labels are zero-padded so they line up', () => {
  assert.equal(roundLabel('A', 7), 'A-007');
  assert.equal(roundLabel('A', 1234), 'A-1234');
});

// --- Leaderboard ----------------------------------------------------------------

const entry = (initials, score, extra = {}) => ({ initials, score, mode: 'challenge', date: '2026-10-29', time: score, ...extra });

test('the board is sorted highest first, and a tie goes to whoever scored first', () => {
  const entries = [entry('AAA', 500, { time: 2 }), entry('BBB', 900), entry('CCC', 500, { time: 1 })];
  assert.deepEqual(topEntries(entries, { mode: 'challenge', size: 10 }).map((e) => e.initials), ['BBB', 'CCC', 'AAA']);
});

test('the board keeps modes and days separate', () => {
  const entries = [entry('AAA', 500), entry('BBB', 900, { mode: 'classic' }), entry('CCC', 700, { date: '2026-10-28' })];
  assert.deepEqual(topEntries(entries, { mode: 'challenge', size: 10, date: '2026-10-29' }).map((e) => e.initials), ['AAA']);
});

test('a score qualifies while the board has space, then only if it beats the lowest', () => {
  const full = Array.from({ length: 10 }, (_, i) => entry('AAA', 100 * (i + 1)));
  assert.equal(qualifies(full.slice(0, 9), { mode: 'challenge', size: 10, date: '2026-10-29', score: 1 }), true);
  assert.equal(qualifies(full, { mode: 'challenge', size: 10, date: '2026-10-29', score: 100 }), false); // tie with lowest
  assert.equal(qualifies(full, { mode: 'challenge', size: 10, date: '2026-10-29', score: 101 }), true);
});

test("a score that misses the all-time board can still make today's board", () => {
  const oldDay = Array.from({ length: 10 }, (_, i) => entry('OLD', 1000 + i, { date: '2026-10-28' }));
  assert.equal(qualifies(oldDay, { mode: 'challenge', size: 10, date: '2026-10-29', score: 50 }), true);
});

test('a score of zero never asks for initials', () => {
  assert.equal(qualifies([], { mode: 'challenge', size: 10, date: '2026-10-29', score: 0 }), false);
});

test("trimming keeps all of today's scores and the best of the rest", () => {
  const entries = [entry('NEW', 10), ...Array.from({ length: 5 }, (_, i) => entry('OLD', 500 + i, { date: '2026-10-01' }))];
  const kept = trimEntries(entries, { keepPerMode: 3, date: '2026-10-29' });
  assert.equal(kept.length, 4);
  assert.ok(kept.some((e) => e.initials === 'NEW'));
  assert.ok(!kept.some((e) => e.score === 500));
});

test('initials are cleaned to three uppercase letters', () => {
  assert.equal(normalizeInitials('a.b-c d'), 'ABC');
  assert.equal(normalizeInitials('ab'), 'AB');
});

test('short and blocked initials are rejected', () => {
  assert.equal(checkInitials('AB', ['XXX']), 'too-short');
  assert.equal(checkInitials('XXX', ['XXX']), 'blocked');
  assert.equal(checkInitials('PAW', ['XXX']), 'ok');
});

test('the date for "today" uses local time, not UTC', () => {
  // 11:30 PM local time must still be "today" (UTC would say tomorrow in the USVI).
  const late = new Date(2026, 9, 29, 23, 30).getTime();
  assert.equal(localDate(late), '2026-10-29');
});
