// Saves things on this device (best scores, settings) with localStorage.
//
// localStorage can fail: private browsing, storage turned off, or a full
// disk. If it does, the game keeps working with an in-memory copy for the
// current visit, and nothing crashes.
//
// Privacy rule: never save names, emails or anything personal here. Most
// players are kids. Three-letter initials and scores only.

const PREFIX = 'pantherSlash.v1.';
const memory = new Map();

/** Same kind of value as the fallback? (list, plain object, number, text, true/false) */
function sameShape(value, fallback) {
  if (Array.isArray(fallback)) return Array.isArray(value);
  if (fallback !== null && typeof fallback === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (typeof fallback === 'number') return Number.isFinite(value);
  return typeof value === typeof fallback;
}

/**
 * Read a saved value. If it's missing, unreadable, or the wrong kind (for
 * example an old version saved it differently, or someone edited it by
 * hand), return `fallback` instead, so bad data can't break the game.
 */
export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw !== null) {
      const value = JSON.parse(raw);
      if (sameShape(value, fallback)) return value;
      console.warn(`[Panther Slash] Ignoring saved "${key}": it isn't in the expected format.`);
    }
  } catch {
    // Unreadable or blocked storage: fall through to memory.
  }
  return memory.has(key) ? memory.get(key) : fallback;
}

export function save(key, value) {
  memory.set(key, value);
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage blocked or full: the in-memory copy still works for this visit.
  }
}

export function remove(key) {
  memory.delete(key);
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // Nothing to do.
  }
}
