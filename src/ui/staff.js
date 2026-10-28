// Staff mode: the PIN keypad and the settings panel.
//
// Staff get here by tapping the moon 5 times on the title screen (see
// main.js), then entering the PIN. The PIN keeps curious kids out; it isn't
// strong security, since anyone with the device could clear its storage.

import { PRIZE_TIERS, STAFF } from '../config.js';
import { getSettings, updateSettings, prizeTiers } from '../storage/settings.js';
import { recentPrizes, findPrize, resetScores, roundsOn } from '../storage/scores.js';
import { summarizeRounds } from '../core/stats.js';
import { verificationCode, tierFor, roundLabel } from '../core/prizes.js';
import { localDate } from '../core/leaderboard.js';
import { setText } from './screens.js';

const MAX_PIN_LENGTH = 8;
const MAX_TRIES = 5;
const LOCKOUT_SECONDS = 30;

// --- PIN -------------------------------------------------------------------------

let pinDigits = '';
let wrongTries = 0;
let lockedUntil = 0;

function renderPinDots() {
  const dots = document.querySelector('#pin-dots');
  dots.replaceChildren(...[...pinDigits].map(() => document.createElement('span')));
}

export function showPin() {
  pinDigits = '';
  setText('#pin-message', '');
  renderPinDots();
}

export function pressPinDigit(digit) {
  if (pinDigits.length < MAX_PIN_LENGTH) pinDigits += digit;
  renderPinDots();
}

export function pressPinBack() {
  pinDigits = pinDigits.slice(0, -1);
  renderPinDots();
}

/** @returns {boolean} true if the PIN was right */
export function submitPin() {
  const now = Date.now();
  if (now < lockedUntil) {
    setText('#pin-message', `Too many tries. Wait ${Math.ceil((lockedUntil - now) / 1000)} seconds.`);
    return false;
  }
  if (pinDigits === getSettings().pin) {
    wrongTries = 0;
    return true;
  }
  wrongTries++;
  if (wrongTries >= MAX_TRIES) {
    wrongTries = 0;
    lockedUntil = now + LOCKOUT_SECONDS * 1000;
  }
  pinDigits = '';
  renderPinDots();
  setText('#pin-message', 'Wrong PIN');
  const panel = document.querySelector('.pin-panel');
  panel.classList.remove('shake');
  requestAnimationFrame(() => panel.classList.add('shake'));
  return false;
}

// --- Settings panel -------------------------------------------------------------------

const form = document.querySelector('#staff-form');
let resetArmedUntil = 0;

function fillStationOptions() {
  const select = document.querySelector('#staff-station');
  if (select.options.length) return;
  for (const letter of 'ABCDEFGHJKMNPQRSTUVWXYZ') {
    const option = document.createElement('option');
    option.value = option.textContent = letter;
    select.append(option);
  }
}

function fillTierInputs() {
  const container = document.querySelector('#staff-tiers');
  const scores = getSettings().tierScores;
  container.replaceChildren(
    ...PRIZE_TIERS.map((tier) => {
      const label = document.createElement('label');
      label.textContent = `${tier.name}: minimum score`;
      const input = document.createElement('input');
      input.type = 'number';
      input.inputMode = 'numeric';
      input.min = '1';
      input.step = '50';
      input.name = `tier-${tier.id}`;
      input.value = scores[tier.id];
      label.append(input);
      return label;
    }),
  );
}

function renderPrizeLog() {
  const list = document.querySelector('#prize-log');
  const prizes = recentPrizes(30);
  if (!prizes.length) {
    const empty = document.createElement('li');
    empty.textContent = 'No prizes yet.';
    list.replaceChildren(empty);
    return;
  }
  const time = (t) => new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  list.replaceChildren(
    ...prizes.map((p) => {
      const item = document.createElement('li');
      const tierName = PRIZE_TIERS.find((t) => t.id === p.tierId)?.name ?? p.tierId;
      item.textContent = `${roundLabel(p.station, p.round)} · ${tierName} · ${p.score} · code ${p.code} · ${p.date} ${time(p.time)}`;
      if (p.claimedAt) {
        const claimed = document.createElement('strong');
        claimed.className = 'claimed';
        claimed.textContent = ` · claimed ${time(p.claimedAt)}`;
        item.append(claimed);
      }
      return item;
    }),
  );
}

function renderStats() {
  const stats = summarizeRounds(roundsOn(localDate()));
  const list = document.querySelector('#staff-stats');
  const tierNames = PRIZE_TIERS.map((t) => `${t.name.split(' ')[0]} ${stats.prizes[t.id] ?? 0}`).join(' · ');
  const rows = [
    ['Challenge rounds', stats.challengeRounds],
    ['Classic rounds', stats.classicRounds],
    ['Prizes won', tierNames],
    ['Scores', stats.median === null ? '—' : `low ${stats.low} · middle ${stats.median} · high ${stats.high} · best ${stats.best}`],
  ];
  list.replaceChildren(
    ...rows.flatMap(([label, value]) => {
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = value;
      return [dt, dd];
    }),
  );
  // "low" and "high" are the scores a quarter of players fall below / above.
  setText(
    '#staff-stats-hint',
    stats.challengeRounds >= 5
      ? 'Tip: Bronze near "low" lets most players win something; Silver near "middle"; Gold near "high".'
      : 'Play at least 5 Challenge rounds to get useful score numbers.',
  );
}

export function showStaff() {
  const settings = getSettings();
  fillStationOptions();
  fillTierInputs();
  form.station.value = settings.station;
  form.eventWord.value = settings.eventWord;
  form.kiosk.checked = settings.kiosk;
  form.kioskIdleSeconds.value = settings.kioskIdleSeconds;
  form.allowClassic.checked = settings.allowClassic;
  form.roundSeconds.value = settings.roundSeconds;
  form.newPin.value = '';
  form.verifyRound.value = '';
  form.verifyScore.value = '';
  form.verifyDate.value = localDate();
  setText('#verify-result', '');
  setText('#staff-message', settings.pin === STAFF.defaultPin ? '⚠️ Still using the default PIN. Set a new one below.' : '');
  resetArmedUntil = 0;
  setText('#staff-reset-scores .button-title', 'Reset leaderboard');
  renderPrizeLog();
  renderStats();
}

/** A number from a form field, kept between min and max. A blank or invalid field keeps `fallback`. */
const clampNumber = (value, min, max, fallback) => {
  if (String(value).trim() === '') return fallback; // Number('') is 0, which would wipe the setting
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/** Read the form and save it. @returns {boolean} true if saved */
export function saveStaff() {
  const settings = getSettings();
  const message = document.querySelector('#staff-message');
  message.classList.remove('ok');

  const tierScores = {};
  for (const tier of PRIZE_TIERS) {
    // At least 1, so a score of 0 can never win a prize.
    tierScores[tier.id] = clampNumber(form[`tier-${tier.id}`].value, 1, 100000, settings.tierScores[tier.id]);
  }
  // Tiers must go up in order, or "Gold" could be easier than "Silver".
  const ordered = PRIZE_TIERS.map((t) => tierScores[t.id]);
  if (ordered.some((score, i) => i > 0 && score <= ordered[i - 1])) {
    message.textContent = 'Each prize tier needs a higher score than the one before it.';
    return false;
  }

  const newPin = form.newPin.value.trim();
  if (newPin && !/^\d{4,8}$/.test(newPin)) {
    message.textContent = 'The PIN must be 4 to 8 digits.';
    return false;
  }

  const eventWord = form.eventWord.value.trim() || settings.eventWord;
  updateSettings({
    station: form.station.value,
    eventWord,
    kiosk: form.kiosk.checked,
    kioskIdleSeconds: clampNumber(form.kioskIdleSeconds.value, 10, 300, settings.kioskIdleSeconds),
    allowClassic: form.allowClassic.checked,
    roundSeconds: clampNumber(form.roundSeconds.value, 15, 300, settings.roundSeconds),
    tierScores,
    ...(newPin ? { pin: newPin } : {}),
  });
  showStaff();
  message.textContent = 'Saved ✓';
  message.classList.add('ok');
  return true;
}

/**
 * Two taps to erase, so nobody wipes the board by accident.
 * @returns {boolean} true if the scores were erased
 */
export function pressResetScores() {
  const button = document.querySelector('#staff-reset-scores .button-title');
  if (Date.now() > resetArmedUntil) {
    resetArmedUntil = Date.now() + 4000;
    button.textContent = 'Tap again to erase ALL scores';
    return false;
  }
  resetScores();
  resetArmedUntil = 0;
  button.textContent = 'Leaderboard erased';
  return true;
}

// --- Checking a prize code -----------------------------------------------------------

function updateVerify() {
  const result = document.querySelector('#verify-result');
  const match = form.verifyRound.value.trim().toUpperCase().match(/^([A-Z])\s*-?\s*(\d+)$/);
  const score = Number(form.verifyScore.value);
  if (!match || form.verifyScore.value === '' || !Number.isFinite(score)) {
    result.textContent = 'Enter the round (like B-047) and the score.';
    return;
  }
  const station = match[1];
  const round = Number(match[2]);
  const date = form.verifyDate.value || localDate();
  const tier = tierFor(score, prizeTiers());
  if (!tier) {
    result.textContent = 'That score is below every prize tier.';
    return;
  }
  const code = verificationCode({ eventWord: getSettings().eventWord, station, round, score, tierId: tier.id, date });
  let text = `Code should be ${code} (${tier.name}).`;
  // If this device ran that round, compare with what it actually recorded.
  const logged = findPrize(station, round);
  if (logged && logged.date === date) {
    if (logged.score !== score) {
      text += ` ⚠️ This device recorded that round with a score of ${logged.score} (code ${logged.code}).`;
    } else if (logged.claimedAt) {
      text += ' ⚠️ This device says it was ALREADY CLAIMED.';
    } else {
      text += ' ✓ Matches this device’s record. Not claimed yet.';
    }
  }
  result.textContent = text;
}

for (const name of ['verifyRound', 'verifyScore', 'verifyDate']) form[name].addEventListener('input', updateVerify);
form.addEventListener('submit', (e) => e.preventDefault());
