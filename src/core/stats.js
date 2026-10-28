// Simple numbers about the rounds played today, for the staff screen:
// how many Challenge rounds (to check against the cash box), how many prizes,
// and what scores players are getting (to set fair prize scores).

/** The value below which `fraction` of the sorted numbers fall (0.5 = median). */
export function percentile(sortedNumbers, fraction) {
  if (sortedNumbers.length === 0) return null;
  const index = Math.min(sortedNumbers.length - 1, Math.max(0, Math.round(fraction * (sortedNumbers.length - 1))));
  return sortedNumbers[index];
}

/**
 * @param {Array<{mode: string, score: number, tierId: string | null}>} rounds
 * @returns {{challengeRounds: number, classicRounds: number, prizes: object, low: number|null, median: number|null, high: number|null, best: number|null}}
 */
export function summarizeRounds(rounds) {
  const challenge = rounds.filter((r) => r.mode === 'challenge');
  const scores = challenge.map((r) => r.score).sort((a, b) => a - b);
  const prizes = {};
  for (const round of challenge) {
    if (round.tierId) prizes[round.tierId] = (prizes[round.tierId] ?? 0) + 1;
  }
  return {
    challengeRounds: challenge.length,
    classicRounds: rounds.filter((r) => r.mode === 'classic').length,
    prizes,
    low: percentile(scores, 0.25),
    median: percentile(scores, 0.5),
    high: percentile(scores, 0.75),
    best: scores.length ? scores[scores.length - 1] : null,
  };
}
