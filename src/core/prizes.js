// Prize tiers and the verification code shown on the prize screen.
//
// How a booth volunteer checks a prize:
//   1. The prize screen shows the tier, the score, a live ticking clock, the
//      station letter and round number (like "B-047"), and a 4-character code.
//   2. The code is made by scrambling ("hashing") the event word, station,
//      round, score, tier and date together. Change any one of them, for
//      example by faking a higher score, and the code no longer matches.
//   3. Any booth device can recompute the code in staff mode to check it.
//   4. The volunteer holds the code box to stamp the round CLAIMED, so the
//      same round can't be claimed twice on that device.
//   The live clock makes an old screenshot easy to spot.
//
// This is not bank-level security: anyone who reads this public code and
// knows the event word could make a valid code. Staff should set their own
// event word in staff mode before the event. For a $2 game, that's plenty.

/** The best tier reached by `score`, or null. `tiers` must be sorted lowest first. */
export function tierFor(score, tiers) {
  let best = null;
  for (const tier of tiers) {
    if (score >= tier.minScore) best = tier;
  }
  return best;
}

/** The next tier above `score`, or null if the top tier is already reached. */
export function nextTier(score, tiers) {
  return tiers.find((tier) => score < tier.minScore) ?? null;
}

// Letters and digits that are hard to mix up when read aloud or squinted at
// in a crowd: no 0/O, 1/I/L, 2/Z, 5/S, 8/B.
const CODE_ALPHABET = 'ACDEFGHJKMNPQRTUVWXY34679';
export const CODE_LENGTH = 4;

/** FNV-1a: a simple, fast hash that turns any text into a 32-bit number. */
function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * @param {object} round
 * @param {string} round.eventWord  shared secret word set in staff mode
 * @param {string} round.station    device letter, e.g. "B"
 * @param {number} round.round      round number on that device
 * @param {number} round.score
 * @param {string} round.tierId
 * @param {string} round.date       local date, "YYYY-MM-DD"
 */
export function verificationCode({ eventWord, station, round, score, tierId, date }) {
  // Hash twice with different inputs so we have enough bits for 4 characters.
  const base = [eventWord.trim().toUpperCase(), station, round, score, tierId, date].join('|');
  let value = hash(base) ^ (hash(`${base}|panther`) << 7);
  value >>>= 0;
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[value % CODE_ALPHABET.length];
    value = Math.floor(value / CODE_ALPHABET.length);
  }
  return code;
}

/** "B-047": station letter plus a zero-padded round number. */
export function roundLabel(station, round) {
  return `${station}-${String(round).padStart(3, '0')}`;
}
