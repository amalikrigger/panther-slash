// Leaderboard rules: ranking scores and checking initials.
//
// This file only works with plain lists, never with storage. src/storage/
// scores.js does the saving. Keeping them apart lets the tests check the
// rules without a browser.
//
// An entry looks like:
//   { initials: 'ABC', score: 1420, mode: 'challenge', date: '2026-10-29', time: 1730000000000 }
// That's all we keep: no names, no emails, nothing personal.

export const INITIALS_LENGTH = 3;

/** Highest score first; for a tie, whoever got it first ranks higher. */
function compareEntries(a, b) {
  return b.score - a.score || a.time - b.time;
}

/**
 * The top `size` entries for a mode, optionally only from one date.
 * @param {Array} entries
 * @param {{mode: string, size: number, date?: string}} options
 */
export function topEntries(entries, { mode, size, date }) {
  return entries
    .filter((e) => e.mode === mode && (!date || e.date === date))
    .sort(compareEntries)
    .slice(0, size);
}

/**
 * Would this score make it onto the all-time or today's board? Zero never
 * qualifies, so nobody is asked for initials after a round where nothing
 * was sliced.
 */
export function qualifies(entries, { mode, size, date, score }) {
  if (score <= 0) return false;
  const beats = (list) => list.length < size || score > list[list.length - 1].score;
  return beats(topEntries(entries, { mode, size })) || beats(topEntries(entries, { mode, size, date }));
}

/**
 * Keep the list from growing forever: per mode, keep everything from today
 * plus the best `keepPerMode` of all time.
 */
export function trimEntries(entries, { keepPerMode, date }) {
  const keep = new Set();
  const modes = new Set(entries.map((e) => e.mode));
  for (const mode of modes) {
    for (const e of topEntries(entries, { mode, size: keepPerMode })) keep.add(e);
    for (const e of entries) if (e.mode === mode && e.date === date) keep.add(e);
  }
  return entries.filter((e) => keep.has(e));
}

/** Clean up typed initials: uppercase letters only, exactly 3. */
export function normalizeInitials(text) {
  return String(text).toUpperCase().replace(/[^A-Z]/g, '').slice(0, INITIALS_LENGTH);
}

/**
 * @returns {'ok' | 'too-short' | 'blocked'}
 */
export function checkInitials(initials, blockedList) {
  if (initials.length !== INITIALS_LENGTH) return 'too-short';
  if (blockedList.includes(initials)) return 'blocked';
  return 'ok';
}

/** "YYYY-MM-DD" in the device's own time zone (not UTC), for "today's best". */
export function localDate(time = Date.now()) {
  const d = new Date(time);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
