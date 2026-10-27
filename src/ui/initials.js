// Arcade-style initials entry: three letters, each changed with ▲ ▼ buttons
// or by typing on a keyboard. Initials only, never names.

import { LEADERBOARD } from '../config.js';
import { checkInitials, INITIALS_LENGTH } from '../core/leaderboard.js';
import { setText } from './screens.js';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

let letters = [0, 0, 0]; // index into ALPHABET for each slot
let typingSlot = 0;      // which slot the next typed letter goes into
let active = false;

function render() {
  for (let i = 0; i < INITIALS_LENGTH; i++) setText(`#initial-${i}`, ALPHABET[letters[i]]);
  // Any change clears an old "pick different initials" message.
  setText('#initials-message', '');
}

export function showInitials() {
  letters = [0, 0, 0];
  typingSlot = 0;
  active = true;
  render();
}

export function hideInitials() {
  active = false;
}

/** Step one slot's letter up or down, wrapping Z → A. */
export function stepLetter(slot, direction) {
  letters[slot] = (letters[slot] + direction + ALPHABET.length) % ALPHABET.length;
  render();
}

export const currentInitials = () => letters.map((i) => ALPHABET[i]).join('');

/**
 * Check the initials before saving.
 * @returns {string | null} the initials, or null (with a message shown) if they can't be used
 */
export function validInitialsOrNull() {
  const initials = currentInitials();
  const result = checkInitials(initials, LEADERBOARD.blockedInitials);
  if (result === 'blocked') {
    setText('#initials-message', 'Please pick different initials.');
    return null;
  }
  if (result === 'too-short') {
    setText('#initials-message', 'Pick 3 letters.');
    return null;
  }
  return initials;
}

// Keyboard: type letters directly, Backspace to go back. Enter is handled in
// main.js like the Save button.
window.addEventListener('keydown', (e) => {
  if (!active) return;
  const key = e.key.toUpperCase();
  if (key.length === 1 && ALPHABET.includes(key)) {
    letters[typingSlot] = ALPHABET.indexOf(key);
    typingSlot = Math.min(typingSlot + 1, INITIALS_LENGTH - 1);
    render();
  } else if (e.key === 'Backspace') {
    typingSlot = Math.max(0, typingSlot - 1);
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
    stepLetter(typingSlot, e.key === 'ArrowUp' ? 1 : -1);
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    typingSlot = Math.min(INITIALS_LENGTH - 1, Math.max(0, typingSlot + (e.key === 'ArrowRight' ? 1 : -1)));
  }
});
