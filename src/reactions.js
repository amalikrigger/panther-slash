// Turns game events (from core/game.js) into things you see and hear.
// The rules decide WHAT happened; this file decides how it looks and sounds.

import { THEME } from './config.js';
import { sounds } from './audio/sound.js';

/**
 * @param {Array} events      from game.update()
 * @param {object} context    { game, effects, renderer, viewport, lastSlice }
 */
export function reactToEvents(events, { game, effects, renderer, viewport, lastSlice }) {
  for (const event of events) {
    switch (event.type) {
      case 'throw':
        // Quiet on the title screen, so the booth isn't whooshing all night.
        if (game.mode !== 'attract') sounds.throw();
        break;

      case 'slice': {
        const { entity, angle, points, critical } = event;
        effects.slice(entity, angle, renderer.spriteFor(entity));
        lastSlice.x = entity.x;
        lastSlice.y = entity.y;
        sounds.slice();
        if (entity.kind === 'panther') {
          sounds.panther();
          effects.flash(THEME.gold, 0.3);
          effects.popup('GOLDEN PANTHER!', entity.x, entity.y - 50, { color: THEME.gold, size: 40, life: 1.4, font: THEME.displayFont });
        }
        if (critical && game.mode !== 'attract') {
          sounds.critical();
          effects.popup('CRITICAL!', entity.x, entity.y - 40, { color: '#ff9cf0', size: 30 });
        }
        if (game.mode !== 'attract') effects.popup(`+${points}`, entity.x, entity.y, { color: critical ? '#ff9cf0' : '#fff' });
        break;
      }

      case 'frost':
        sounds.frost();
        effects.flash('#9fe8ff', 0.3);
        effects.popup('FREEZE!', event.entity.x, event.entity.y - 60, { color: '#bff0ff', size: 46, life: 1.3, font: THEME.displayFont });
        break;

      case 'frenzy':
        sounds.frenzy();
        effects.flash(THEME.gold, 0.25);
        effects.popup('PANTHER FRENZY!', viewport.worldWidth / 2, viewport.worldHeight * 0.32, {
          color: THEME.gold,
          size: 64,
          life: 2,
          font: THEME.displayFont,
        });
        break;

      case 'combo':
        if (game.mode === 'attract') break;
        effects.popup(`${event.count}× COMBO!`, lastSlice.x, lastSlice.y - 70, { color: THEME.gold, size: 44, life: 1.2, font: THEME.displayFont });
        effects.popup(`+${event.bonus}`, lastSlice.x, lastSlice.y - 30, { color: THEME.gold, size: 30, life: 1.2 });
        effects.shake(0.15, 6);
        sounds.combo(event.count);
        break;

      case 'bomb':
        effects.bomb(event.entity);
        sounds.bomb();
        if (event.penalty > 0) {
          effects.popup(`-${event.penalty}`, event.entity.x, event.entity.y, { color: '#ff6b78', size: 44, life: 1.2 });
        }
        break;

      case 'miss':
        // Misses only matter in Classic, so only show them there.
        if (game.mode === 'classic') {
          sounds.miss();
          const x = Math.min(Math.max(event.entity.x, 40), viewport.worldWidth - 40);
          effects.popup('✕', x, viewport.worldHeight - 50, { color: '#ff6b78', size: 56, life: 1 });
        }
        break;

      case 'end':
        if (event.reason !== 'bomb') sounds.end();
        break;
    }
  }
}
