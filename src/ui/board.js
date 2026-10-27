// The leaderboard screen: Today / All time, Challenge / Classic.

import { boardFor } from '../storage/scores.js';
import { tierFor } from '../core/prizes.js';
import { setHidden } from './screens.js';

const list = document.querySelector('#board');

let view = { todayOnly: true, mode: 'challenge', highlight: null };

function select(id, selected) {
  document.querySelector(id).setAttribute('aria-selected', String(selected));
}

/**
 * @param {object} options
 * @param {'challenge' | 'classic'} [options.mode]
 * @param {boolean} [options.todayOnly]
 * @param {object | null} [options.highlight]  an entry to highlight (the one just saved)
 * @param {Array} options.tiers  prize tiers, for the badges
 * @param {boolean} options.allowClassic
 */
export function renderBoard(options) {
  view = { ...view, ...options };
  const { mode, todayOnly, highlight, tiers, allowClassic } = view;
  select('#tab-today', todayOnly);
  select('#tab-all', !todayOnly);
  select('#tab-challenge', mode === 'challenge');
  select('#tab-classic', mode === 'classic');
  setHidden('#board-mode-tabs', !allowClassic);

  const entries = boardFor(mode, { todayOnly });
  setHidden('#board-empty', entries.length > 0);
  list.replaceChildren(
    ...entries.map((entry, index) => {
      const item = document.createElement('li');
      if (highlight && entry.time === highlight.time && entry.initials === highlight.initials) item.classList.add('highlight');

      const rank = document.createElement('span');
      rank.className = 'rank';
      rank.textContent = `${index + 1}.`;
      const who = document.createElement('span');
      who.className = 'who';
      who.textContent = entry.initials;
      const score = document.createElement('span');
      score.textContent = entry.score;

      // Prize badge (Challenge only): the first letter of the tier.
      const badge = document.createElement('span');
      const tier = mode === 'challenge' ? tierFor(entry.score, tiers) : null;
      if (tier) {
        badge.className = 'tier-badge';
        badge.style.setProperty('--tier', tier.color);
        badge.textContent = tier.name[0];
        badge.title = tier.name;
      }
      item.append(rank, who, score, badge);
      return item;
    }),
  );
}

export const boardView = () => view;
