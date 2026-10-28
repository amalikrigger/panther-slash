// Saves leaderboard entries and the prize log on this device.
//
// Leaderboard entry: { initials, score, mode, date, time }
// Prize log entry:   { station, round, score, tierId, code, date, time, claimedAt }
// Round log entry:   { mode, score, tierId, date }  (every round, for staff stats)
// No names or personal details, ever.

import { LEADERBOARD } from '../config.js';
import { topEntries, qualifies, trimEntries, localDate } from '../core/leaderboard.js';
import { load, save, remove } from './store.js';

// How many all-time scores to keep per mode (today's are always kept).
const KEEP_PER_MODE = 50;
const PRIZE_LOG_SIZE = 200;
const ROUND_LOG_SIZE = 2000;

// Drop any entry that's missing what we need, rather than crashing on it.
const isEntry = (e) => e && typeof e.initials === 'string' && Number.isFinite(e.score) && typeof e.mode === 'string' && typeof e.date === 'string';
const isPrize = (p) => p && typeof p.station === 'string' && Number.isFinite(p.round) && Number.isFinite(p.score);

let entries = load('scores', []).filter(isEntry);
let prizeLog = load('prizes', []).filter(isPrize);
let roundLog = load('rounds', []).filter((r) => r && typeof r.mode === 'string' && Number.isFinite(r.score));

// --- Leaderboard -----------------------------------------------------------------

export function boardFor(mode, { todayOnly = false } = {}) {
  return topEntries(entries, { mode, size: LEADERBOARD.size, date: todayOnly ? localDate() : undefined });
}

export function scoreQualifies(mode, score) {
  return qualifies(entries, { mode, size: LEADERBOARD.size, date: localDate(), score });
}

export function addScore({ initials, score, mode }) {
  const time = Date.now();
  const entry = { initials, score, mode, date: localDate(time), time };
  entries = trimEntries([...entries, entry], { keepPerMode: KEEP_PER_MODE, date: localDate(time) });
  save('scores', entries);
  return entry;
}

/** The best score for a mode, all time. */
export function bestScore(mode) {
  return boardFor(mode)[0]?.score ?? 0;
}

export function resetScores() {
  entries = [];
  remove('scores');
}

// --- Round numbers and the prize log -----------------------------------------------

/** Each Challenge round on this device gets the next number, for the prize screen. */
export function nextRoundNumber() {
  const round = load('roundCounter', 0) + 1;
  save('roundCounter', round);
  return round;
}

export function logPrize(prize) {
  prizeLog = [prize, ...prizeLog].slice(0, PRIZE_LOG_SIZE);
  save('prizes', prizeLog);
}

export function findPrize(station, round) {
  return prizeLog.find((p) => p.station === station && p.round === round) ?? null;
}

export function markClaimed(station, round) {
  const prize = findPrize(station, round);
  if (!prize || prize.claimedAt) return prize;
  prize.claimedAt = Date.now();
  save('prizes', prizeLog);
  return prize;
}

export function recentPrizes(count = 20) {
  return prizeLog.slice(0, count);
}

// --- Round log (for staff stats) ---------------------------------------------------

export function logRound({ mode, score, tierId }) {
  roundLog = [...roundLog, { mode, score, tierId: tierId ?? null, date: localDate() }].slice(-ROUND_LOG_SIZE);
  save('rounds', roundLog);
}

export function roundsOn(date) {
  return roundLog.filter((r) => r.date === date);
}

export function resetPrizeLog() {
  prizeLog = [];
  remove('prizes');
}
