// The prize screen: tier, score, verification code, live clock, and the
// "hold to claim" box for booth staff.

import { setText } from './screens.js';
import { roundLabel } from '../core/prizes.js';
import { makeDrawnSprite } from '../render/art.js';

// How long staff must hold the claim box. Long enough that a tap, or a kid
// poking at it, won't claim the prize by accident. The label doesn't say
// "hold", so only volunteers who read the booth guide know the trick.
const HOLD_SECONDS = 2.5;

const panel = document.querySelector('#prize-panel');
const claimBox = document.querySelector('#prize-claim');
const claimFill = document.querySelector('#prize-claim-fill');

const CONTINUE_DELAY_MS = 3000;

let clockTimer = null;
let continueTimer = null;
let holdStart = null;
let holdFrame = null;
let onClaim = null;
let claimed = false;

// The medal is the Golden Panther drawing, turned into an image once.
const medalImage = `url(${makeDrawnSprite('panther').toDataURL()})`;
document.querySelector('#prize-medal').style.setProperty('--medal-image', medalImage);

function formatClock(time) {
  return new Date(time).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatTime(time) {
  return new Date(time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/**
 * @param {object} prize  { tier, score, station, round, code, claimedAt }
 * @param {(prize) => object} claim  called when staff finish holding; returns the updated prize
 */
export function showPrize(prize, claim) {
  panel.style.setProperty('--tier', prize.tier.color);
  panel.dataset.tier = prize.tier.id;
  setText('#prize-tier', prize.tier.name);
  setText('#prize-score', prize.score);
  setText('#prize-round', roundLabel(prize.station, prize.round));
  setText('#prize-code', prize.code);
  onClaim = claim;
  setClaimed(prize.claimedAt);

  // Hold off "Continue" for a moment: kids are still tapping wildly when the
  // round ends, and one stray tap shouldn't whisk the prize away.
  const continueButton = document.querySelector('#prize-continue');
  continueButton.disabled = true;
  clearTimeout(continueTimer);
  continueTimer = setTimeout(() => (continueButton.disabled = false), CONTINUE_DELAY_MS);

  // The clock ticks every second, so a volunteer can tell a live screen from
  // a screenshot someone saved earlier.
  const tick = () => setText('#prize-clock', formatClock(Date.now()));
  tick();
  clearInterval(clockTimer);
  clockTimer = setInterval(tick, 1000);
}

export function hidePrize() {
  clearInterval(clockTimer);
  clockTimer = null;
  cancelHold();
}

function setClaimed(claimedAt) {
  claimed = !!claimedAt;
  claimBox.classList.toggle('claimed', claimed);
  setText('#prize-claim-text', claimed ? `✓ CLAIMED ${formatTime(claimedAt)}` : 'Prize desk use only');
  claimFill.style.transform = 'scaleX(0)';
}

// --- Hold to claim ------------------------------------------------------------

function startHold(event) {
  if (claimed || !onClaim) return;
  event.preventDefault();
  claimBox.setPointerCapture?.(event.pointerId);
  holdStart = performance.now();
  const step = (now) => {
    const progress = Math.min(1, (now - holdStart) / 1000 / HOLD_SECONDS);
    claimFill.style.transform = `scaleX(${progress})`;
    if (progress >= 1) {
      holdStart = null;
      const prize = onClaim();
      setClaimed(prize?.claimedAt ?? Date.now());
      return;
    }
    holdFrame = requestAnimationFrame(step);
  };
  holdFrame = requestAnimationFrame(step);
}

function cancelHold() {
  if (holdFrame) cancelAnimationFrame(holdFrame);
  holdFrame = null;
  holdStart = null;
  if (!claimed) claimFill.style.transform = 'scaleX(0)';
}

claimBox.addEventListener('pointerdown', startHold);
claimBox.addEventListener('pointerup', cancelHold);
claimBox.addEventListener('pointercancel', cancelHold);
claimBox.addEventListener('lostpointercapture', cancelHold);
claimBox.addEventListener('contextmenu', (e) => e.preventDefault());
