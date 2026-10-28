// Booth settings that staff can change in staff mode. They're saved on each
// device and start from the values in config.js.

import { MODES, PRIZE_TIERS, STAFF } from '../config.js';
import { load, save } from './store.js';

function defaults() {
  return {
    roundSeconds: MODES.challenge.roundSeconds,
    tierScores: Object.fromEntries(PRIZE_TIERS.map((t) => [t.id, t.minScore])),
    station: 'A', // set a different letter on each booth device
    eventWord: STAFF.defaultEventWord,
    pin: STAFF.defaultPin,
    kiosk: false,
    kioskIdleSeconds: STAFF.kioskIdleSeconds,
    allowClassic: true,
  };
}

// Start from the defaults and keep only saved values of the right kind, so a
// damaged or outdated setting falls back to its default instead of breaking.
const saved = load('settings', {});
let current = defaults();
for (const [key, fallback] of Object.entries(current)) {
  const value = saved[key];
  if (value !== undefined && (typeof value === typeof fallback) && (typeof value !== 'number' || Number.isFinite(value))) current[key] = value;
}
// Make sure tiers added to config.js later still get a score.
current.tierScores = { ...defaults().tierScores, ...(typeof saved.tierScores === 'object' && saved.tierScores ? saved.tierScores : {}) };

export function getSettings() {
  return current;
}

export function updateSettings(patch) {
  current = { ...current, ...patch };
  save('settings', current);
  return current;
}

/** The prize tiers from config.js with the staff-set scores, lowest first. */
export function prizeTiers() {
  return PRIZE_TIERS.map((tier) => ({ ...tier, minScore: current.tierScores[tier.id] ?? tier.minScore })).sort(
    (a, b) => a.minScore - b.minScore,
  );
}
