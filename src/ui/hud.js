// The in-game score, timer and lives display.
//
// It only touches the page when a number actually changes. Rewriting the
// page 60 times a second for no reason can make slow tablets stutter.

import { setText, setHidden } from './screens.js';

const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');

const PAW_PATH =
  'M12 21c-2.6 0-5.2-1.4-5.2-3.6 0-2.3 2.6-5.4 5.2-5.4s5.2 3.1 5.2 5.4c0 2.2-2.6 3.6-5.2 3.6z' +
  'M5.2 11.6a2.1 2.6 -20 1 0 .1 0zM9 8.4a2.1 2.7 0 1 0 .1 0zM15 8.4a2.1 2.7 0 1 0 .1 0zM18.8 11.6a2.1 2.6 20 1 0 .1 0z';

export class Hud {
  constructor() {
    this.element = document.querySelector('#hud');
    this.scoreElement = document.querySelector('#hud-score');
    this.timerElement = document.querySelector('#hud-timer');
    this.livesElement = document.querySelector('#hud-lives');
    this.shown = { score: null, seconds: null, lives: null };
  }

  show(game) {
    this.element.hidden = false;
    this.shown = { score: null, seconds: null, lives: null };
    setHidden('#hud-timer', game.mode !== 'challenge');
    setHidden('#hud-lives', game.mode !== 'classic');
    this.update(game);
  }

  hide() {
    this.element.hidden = true;
  }

  /** @returns {boolean} true when the visible seconds changed in the last 10 seconds (for the tick sound) */
  update(game) {
    if (game.score !== this.shown.score) {
      const wentUp = this.shown.score !== null && game.score > this.shown.score;
      setText('#hud-score', game.score);
      if (wentUp && !reducedMotion?.matches) {
        // A little "bump" each time the score goes up.
        this.scoreElement.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 250 });
      }
      this.shown.score = game.score;
    }

    let ticked = false;
    if (game.mode === 'challenge') {
      const seconds = Math.ceil(game.timeLeft);
      if (seconds !== this.shown.seconds) {
        setText('#hud-timer', seconds);
        this.timerElement.classList.toggle('urgent', seconds <= 10);
        ticked = this.shown.seconds !== null && seconds <= 10 && seconds > 0;
        this.shown.seconds = seconds;
      }
    }

    if (game.mode === 'classic' && game.lives !== this.shown.lives) {
      this.renderLives(game.lives, game.rules.lives);
      this.shown.lives = game.lives;
    }
    return ticked;
  }

  renderLives(lives, maxLives) {
    const icons = [];
    for (let i = 0; i < maxLives; i++) {
      const lost = i >= lives;
      icons.push(
        `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="life${lost ? ' lost' : ''}" d="${PAW_PATH}"/>` +
          (lost ? '<path class="life-slash" d="M4 20L20 4"/>' : '') +
          '</svg>',
      );
    }
    this.livesElement.innerHTML = icons.join('');
    this.livesElement.setAttribute('aria-label', `${lives} of ${maxLives} lives left`);
  }
}
