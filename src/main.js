// Panther Slash: where everything gets connected.
//
// Startup order:
//   1. load fonts and enemy pictures
//   2. create the viewport, input, renderer and effects
//   3. start the game loop and show the title screen
//
// The app is always on exactly one screen (app.screen):
//
//   title ──► playing ⇄ paused
//               │
//               ▼
//            ending (pieces finish falling)
//               │
//               ├─► prize ──┐   (Challenge, if a prize tier was reached)
//               └─► results ┤
//                           ├─► initials ─► leaderboard   (if the score made the board)
//                           └─► title / playing
//
//   title ──(tap the moon 5×)──► pin ──► staff
//
// Buttons in index.html have data-action="..." and are handled in onButton().

import * as CONFIG from './config.js';
import { WORLD, SPAWN, SCORING, ENEMIES, BOMB, GOLDEN_PANTHER, FROST_ORB, FRENZY, ATTRACT, MODES, EFFECTS, STAFF } from './config.js';
import { Game } from './core/game.js';
import { tierFor, nextTier, verificationCode } from './core/prizes.js';
import { localDate } from './core/leaderboard.js';
import { Viewport } from './engine/viewport.js';
import { startLoop } from './engine/loop.js';
import { PointerInput } from './input/pointer.js';
import { loadSprites, artKeysFromConfig } from './render/sprites.js';
import { Renderer } from './render/renderer.js';
import { Effects } from './render/effects.js';
import { reactToEvents } from './reactions.js';
import { sounds, unlock as unlockAudio, setMuted, isMuted } from './audio/sound.js';
import { load, save } from './storage/store.js';
import { getSettings, prizeTiers } from './storage/settings.js';
import { addScore, scoreQualifies, boardFor, nextRoundNumber, logPrize, markClaimed, logRound } from './storage/scores.js';
import { showScreen, onAction, setText, setHidden, setStats } from './ui/screens.js';
import { Hud } from './ui/hud.js';
import { setupFullscreen } from './ui/fullscreen.js';
import { showPrize, hidePrize } from './ui/prize.js';
import { showInitials, hideInitials, stepLetter, validInitialsOrNull } from './ui/initials.js';
import { renderBoard } from './ui/board.js';
import { showPin, pressPinDigit, pressPinBack, submitPin, showStaff, saveStaff, pressResetScores } from './ui/staff.js';
import { idleSeconds, resetIdle } from './ui/kiosk.js';

// How long to wait after the game ends before showing the results, so the
// player sees the last explosion.
const RESULTS_DELAY = 1.4;
// The secret moon taps must all happen within this many seconds.
const SECRET_TAP_WINDOW = 3;
// Staff screens always close after this long untouched, kiosk mode or not,
// so settings are never left open at a busy booth.
const STAFF_IDLE_SECONDS = 90;

const app = {
  screen: 'loading',
  game: null,
  lastMode: 'challenge',
  resultsTimer: null,
  bestScores: { classic: 0, challenge: 0, ...load('best', {}) },
  lastSlice: { x: 0, y: 0 },
  round: null,       // { number, station, date } for the current Challenge round
  prize: null,       // the prize won this round, if any
  savedEntry: null,  // the leaderboard entry just saved, to highlight it
  moonTaps: [],
  attract: null,     // the harmless game drifting behind the title screen
};

/** The game rules for one round, built from config.js and staff settings. */
function buildRules() {
  return {
    gravity: WORLD.gravity,
    spawn: SPAWN,
    scoring: SCORING,
    enemies: ENEMIES,
    bomb: BOMB,
    goldenPanther: GOLDEN_PANTHER,
    frostOrb: FROST_ORB,
    frenzy: FRENZY,
    lives: MODES.classic.lives,
    roundSeconds: getSettings().roundSeconds,
  };
}

/** Slower, steadier throws for the title screen. */
function buildAttractRules() {
  const rules = buildRules();
  rules.spawn = {
    ...SPAWN,
    firstThrowDelay: 0.3,
    startInterval: ATTRACT.startInterval,
    minInterval: ATTRACT.startInterval,
    intervalShrink: 0,
    maxPerThrow: ATTRACT.maxPerThrow,
    maxPerThrowLate: ATTRACT.maxPerThrow,
  };
  return rules;
}

async function loadFonts() {
  if (!document.fonts?.load) return;
  const fonts = Promise.all([document.fonts.load('400 40px Creepster'), document.fonts.load('700 40px Fredoka')]);
  // Never let a font problem stop the game from starting.
  const timeout = new Promise((resolve) => setTimeout(resolve, 2500));
  await Promise.race([fonts.catch(() => {}), timeout]);
}

async function start() {
  showScreen('loading');
  const canvas = document.querySelector('#game');
  const viewport = new Viewport(canvas);
  const [sprites] = await Promise.all([loadSprites(artKeysFromConfig(CONFIG)), loadFonts()]);

  const input = new PointerInput(canvas, viewport);
  const renderer = new Renderer(canvas, viewport, sprites);
  const effects = new Effects();
  const hud = new Hud();
  Object.assign(app, { viewport, input, renderer, effects, hud });

  setupControls();
  input.onPress(onCanvasPress);
  showTitle();

  // Add ?debug to the address to poke at the game from the browser console,
  // for example: pantherSlash.game.score = 9999
  if (new URLSearchParams(location.search).has('debug')) window.pantherSlash = app;

  startLoop({ update, draw });
}

function update(dt) {
  const { input, viewport, effects, hud } = app;
  input.update(dt, EFFECTS.clawTrailSeconds);
  const segments = input.takeSegments();

  // The game keeps running after it ends (so pieces can fall), until a new
  // round starts or we go back to the title.
  if (app.game && app.screen !== 'paused') {
    const events = app.game.update(dt, app.screen === 'playing' ? segments : [], viewport.bounds);
    reactToEvents(events, { ...app, lastSlice: app.lastSlice });
    if (events.some((e) => e.type === 'end')) finishRound();
    if (app.screen === 'playing' && hud.update(app.game)) sounds.tick();
  }

  if (app.attract) {
    const events = app.attract.update(dt, app.screen === 'title' ? segments : [], viewport.bounds);
    reactToEvents(events, { ...app, game: app.attract, lastSlice: app.lastSlice });
  }

  if (app.resultsTimer !== null) {
    app.resultsTimer -= dt;
    if (app.resultsTimer <= 0) {
      app.resultsTimer = null;
      afterRound();
    }
  }

  if (app.screen !== 'paused') effects.update(dt, WORLD.gravity, viewport.bounds);
  checkIdle();
  watchFrameRate(dt);
  app.frameDt = dt;
}

// If the device can't keep up (an old tablet or Chromebook), switch to lower
// quality once: fewer pixels and fewer particles. Smooth beats sharp.
const SLOW_FRAME = 1 / 40;
const SLOW_SECONDS_BEFORE_DOWNGRADE = 3;
let slowFor = 0;
let averageDt = 1 / 60;

function watchFrameRate(dt) {
  if (app.lowQuality || dt === 0) return;
  averageDt = averageDt * 0.95 + dt * 0.05;
  slowFor = averageDt > SLOW_FRAME ? slowFor + dt : 0;
  if (slowFor > SLOW_SECONDS_BEFORE_DOWNGRADE) setLowQuality();
}

function setLowQuality() {
  app.lowQuality = true;
  app.viewport.setMaxPixelRatio(1);
  app.effects.setLowQuality();
  console.info('[Panther Slash] Slow device detected: switched to low quality.');
}

function draw() {
  const { input, renderer, effects } = app;
  const trails = [...input.trails.values()].map((t) => ({ points: t.points, now: input.time }));
  const game = app.game ?? app.attract;
  const inRound = app.screen === 'playing' || app.screen === 'paused';
  const mood = { frost: inRound && app.game.slowTimeLeft > 0, frenzy: inRound && app.game.inFrenzy };
  renderer.draw({ dt: app.frameDt ?? 0, entities: game?.entities ?? [], effects, trails, mood });
}

// --- Title and rounds ----------------------------------------------------------------

function goTo(screen) {
  if (app.screen === 'prize' && screen !== 'prize') hidePrize();
  if (app.screen === 'initials' && screen !== 'initials') hideInitials();
  app.screen = screen;
  showScreen(screen === 'playing' || screen === 'ending' ? null : screen);
  resetIdle();
}

function showTitle() {
  app.game = null;
  app.savedEntry = null;
  app.prize = null;
  app.resultsTimer = null;
  app.effects.clear();
  app.hud.hide();
  app.attract = new Game({ mode: 'attract', rules: buildAttractRules() });

  const settings = getSettings();
  setText('#challenge-sub', `${settings.roundSeconds} seconds · win prizes!`);
  setHidden('#classic-button', !settings.allowClassic);
  const todayBest = boardFor('challenge', { todayOnly: true })[0];
  const best = Math.max(app.bestScores.challenge ?? 0, boardFor('challenge')[0]?.score ?? 0);
  setText(
    '#best-line',
    todayBest ? `Today's best: ${todayBest.initials} · ${todayBest.score}` : best ? `Best score: ${best}` : 'Swipe to slice. Avoid the skull bombs!',
  );
  goTo('title');
}

function startRound(mode) {
  if (mode === 'classic' && !getSettings().allowClassic) mode = 'challenge';
  unlockAudio();
  app.lastMode = mode;
  app.game = new Game({ mode, rules: buildRules() });
  app.prize = null;
  app.savedEntry = null;
  app.attract = null;
  // Every Challenge round gets a number, so each prize screen is unique.
  app.round = mode === 'challenge' ? { number: nextRoundNumber(), station: getSettings().station, date: localDate() } : null;
  app.effects.clear();
  app.input.clear();
  app.resultsTimer = null;
  goTo('playing');
  app.hud.show(app.game);
  sounds.start();
}

function pause() {
  if (app.screen !== 'playing') return;
  goTo('paused');
}

function resume() {
  if (app.screen !== 'paused') return;
  app.input.clear();
  goTo('playing');
}

function finishRound() {
  app.hud.hide();
  app.screen = 'ending';
  app.resultsTimer = RESULTS_DELAY;

  const game = app.game;
  if (game.score > (app.bestScores[game.mode] ?? 0)) {
    app.isNewBest = true;
    app.bestScores = { ...app.bestScores, [game.mode]: game.score };
    save('best', app.bestScores);
  } else {
    app.isNewBest = false;
  }

  // Work out and record the prize right away, so it's logged even if the
  // player walks off before the prize screen appears.
  const tier = game.mode === 'challenge' ? tierFor(game.score, prizeTiers()) : null;
  if (tier) {
    const { station, number, date } = app.round;
    const { eventWord } = getSettings();
    const code = verificationCode({ eventWord, station, round: number, score: game.score, tierId: tier.id, date });
    app.prize = { tier, score: game.score, station, round: number, code, date, claimedAt: null };
    logPrize({ station, round: number, score: game.score, tierId: tier.id, code, date, time: Date.now(), claimedAt: null });
  }
  logRound({ mode: game.mode, score: game.score, tierId: tier?.id });
}

function afterRound() {
  if (app.prize) {
    openPrize();
  } else {
    showResults();
  }
}

/** Show (or show again) this round's prize screen. */
function openPrize() {
  showPrize(app.prize, () => {
    const logged = markClaimed(app.prize.station, app.prize.round);
    app.prize.claimedAt = logged?.claimedAt ?? Date.now(); // the kiosk timer reads this
    return app.prize;
  });
  if (!app.prize.claimedAt) sounds.fanfare();
  goTo('prize');
}

function showResults() {
  const game = app.game;
  const titles = {
    time: ["Time's up!", 'Nice slicing, Panther!'],
    lives: ['Game over', 'Too many spooks got away.'],
    bomb: ['Kaboom!', 'You sliced a skull bomb.'],
  };
  const [title, reason] = titles[game.endReason] ?? titles.lives;
  setText('#results-title', title);
  setText('#results-reason', reason);
  setText('#results-score', game.score);
  setHidden('#results-new-best', !app.isNewBest);

  // Encourage another go: how far to the next prize?
  const next = game.mode === 'challenge' ? nextTier(game.score, prizeTiers()) : null;
  setHidden('#results-next-tier', !next);
  if (next) setText('#results-next-tier', `${next.minScore - game.score} more points for ${next.name}!`);

  setStats('#results-stats', [
    ['Sliced', game.stats.sliced],
    ['Best combo', game.stats.bestCombo],
    ['Best', app.bestScores[game.mode] ?? game.score],
  ]);

  const canSave = !app.savedEntry && scoreQualifies(game.mode, game.score);
  setHidden('#results-save', !canSave);
  setHidden('#results-play-again', canSave);
  setHidden('#results-show-prize', !app.prize);
  goTo('results');
}

// --- Leaderboard ---------------------------------------------------------------------

function openInitials() {
  showInitials();
  goTo('initials');
}

function saveInitials() {
  const initials = validInitialsOrNull();
  if (!initials) return;
  app.savedEntry = addScore({ initials, score: app.game.score, mode: app.game.mode });
  showLeaderboard({ mode: app.game.mode, todayOnly: true });
}

function showLeaderboard(options = {}) {
  renderBoard({ ...options, highlight: app.savedEntry, tiers: prizeTiers(), allowClassic: getSettings().allowClassic });
  setText('#board-play .button-title', app.game ? 'Play again' : 'Play');
  // From the title screen there's no prize (showTitle clears it).
  setHidden('#board-show-prize', !app.prize);
  goTo('leaderboard');
}

// --- Staff mode ----------------------------------------------------------------------

/** Five quick taps on the moon, on the title screen, opens the staff PIN. */
function onCanvasPress(point) {
  if (app.screen !== 'title') return;
  const { moon } = app.renderer.background;
  if (Math.hypot(point.x - moon.x, point.y - moon.y) > moon.radius) return;
  const now = performance.now() / 1000;
  app.moonTaps = [...app.moonTaps.filter((t) => now - t < SECRET_TAP_WINDOW), now];
  if (app.moonTaps.length >= STAFF.secretTaps) {
    app.moonTaps = [];
    showPin();
    goTo('pin');
  }
}

function checkIdle() {
  const idle = idleSeconds();
  const { kiosk, kioskIdleSeconds } = getSettings();
  if ((app.screen === 'pin' || app.screen === 'staff') && idle > STAFF_IDLE_SECONDS) return showTitle();
  if (!kiosk) return;
  // Give volunteers longer on an unclaimed prize screen.
  const limits = {
    results: kioskIdleSeconds,
    leaderboard: kioskIdleSeconds,
    initials: kioskIdleSeconds * 2,
    prize: app.prize?.claimedAt ? kioskIdleSeconds : kioskIdleSeconds * 4,
    paused: kioskIdleSeconds * 2,
  };
  if (limits[app.screen] && idle > limits[app.screen]) showTitle();
}

// --- Buttons, keys and the tab being hidden ----------------------------------------------

function onButton(action, button) {
  unlockAudio();
  sounds.click();
  switch (action) {
    case 'play-challenge':
      return startRound('challenge');
    case 'play-classic':
      return startRound('classic');
    case 'play-again':
      return startRound(app.lastMode);
    case 'resume':
      return resume();
    case 'quit':
    case 'menu':
      return showTitle();

    case 'prize-continue':
      return scoreQualifies(app.game.mode, app.game.score) && !app.savedEntry ? openInitials() : showResults();
    case 'enter-initials':
      return openInitials();
    case 'show-prize':
      return app.prize && openPrize();
    case 'initial-up':
      return stepLetter(Number(button.dataset.slot), 1);
    case 'initial-down':
      return stepLetter(Number(button.dataset.slot), -1);
    case 'initials-save':
      return saveInitials();
    case 'initials-skip':
      return showLeaderboard({ mode: app.game.mode, todayOnly: true });

    case 'leaderboard':
      return showLeaderboard({ mode: 'challenge', todayOnly: true });
    case 'board-today':
      return renderBoard({ todayOnly: true });
    case 'board-all':
      return renderBoard({ todayOnly: false });
    case 'board-challenge':
      return renderBoard({ mode: 'challenge' });
    case 'board-classic':
      return renderBoard({ mode: 'classic' });

    case 'pin-digit':
      return pressPinDigit(button.dataset.digit);
    case 'pin-back':
      return pressPinBack();
    case 'pin-enter':
      if (submitPin()) {
        showStaff();
        goTo('staff');
      }
      return;
    case 'staff-save':
      return saveStaff();
    case 'staff-reset-scores':
      return pressResetScores();
  }
}

function setupControls() {
  onAction(onButton);

  // The first tap anywhere unlocks sound on phones.
  window.addEventListener('pointerdown', unlockAudio, { capture: true });

  document.querySelector('#pause-button').addEventListener('click', pause);

  window.addEventListener('keydown', (e) => {
    // Enter saves initials, unless a button has focus (then Enter presses that button).
    if (app.screen === 'initials' && e.key === 'Enter' && document.activeElement?.tagName !== 'BUTTON') {
      e.preventDefault();
      return saveInitials();
    }
    if (app.screen === 'pin') {
      if (/^\d$/.test(e.key)) pressPinDigit(e.key);
      else if (e.key === 'Backspace') pressPinBack();
      else if (e.key === 'Enter') onButton('pin-enter');
      return;
    }
    if (e.key === 'Escape' || e.key === 'p') {
      if (app.screen === 'playing') pause();
      else if (app.screen === 'paused') resume();
    }
  });

  // Switching tabs or locking the phone mid-round pauses the game.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });

  const muteButton = document.querySelector('#mute-button');
  setMuted(load('muted', false));
  muteButton.setAttribute('aria-pressed', String(isMuted()));
  muteButton.addEventListener('click', () => {
    setMuted(!isMuted());
    save('muted', isMuted());
    muteButton.setAttribute('aria-pressed', String(isMuted()));
    muteButton.setAttribute('aria-label', isMuted() ? 'Unmute sound' : 'Mute sound');
  });

  setupFullscreen({
    button: document.querySelector('#fullscreen-button'),
    iosHint: document.querySelector('#ios-hint'),
  });
}

/**
 * Turn on the offline cache (sw.js). It's skipped on localhost so students
 * always see their latest changes when they refresh; add ?sw to the address
 * to test it locally anyway.
 */
function registerOfflineCache() {
  if (!('serviceWorker' in navigator)) return;
  const isLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  if (isLocal && !new URLSearchParams(location.search).has('sw')) return;
  navigator.serviceWorker.register('sw.js').catch((error) => console.warn('[Panther Slash] Offline cache unavailable:', error));
}

start();
registerOfflineCache();
