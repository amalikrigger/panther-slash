// Draws one frame: background, splats, enemies, halves, particles, the claw
// swipe and the floating texts, in that order (back to front).

import { THEME, EFFECTS } from '../config.js';
import { Background } from './background.js';
import { drawSprite } from './draw.js';

export class Renderer {
  constructor(canvas, viewport, sprites) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.viewport = viewport;
    this.sprites = sprites;
    this.background = new Background();
    this.time = 0;
    this.background.build(viewport);
    viewport.onChange(() => this.background.build(viewport));
  }

  spriteFor(entity) {
    return this.sprites.get(entity.type.art);
  }

  draw({ dt, entities, effects, trails }) {
    const { ctx, viewport } = this;
    this.time += dt;

    this.background.draw(ctx);

    viewport.applyWorldTransform(ctx);
    const shake = effects.shakeOffset();
    ctx.translate(shake.x, shake.y);

    effects.drawSplats(ctx);
    for (const e of entities) this.drawEntity(e);
    effects.drawHalves(ctx);
    effects.drawParticles(ctx);
    for (const trail of trails) this.drawClaw(trail.points, trail.now);
    effects.drawTexts(ctx);

    viewport.applyWorldTransform(ctx);
    effects.drawFlash(ctx, viewport.worldWidth, viewport.worldHeight);
  }

  drawEntity(e) {
    const { ctx } = this;
    // Bombs pulse red and the Golden Panther shimmers, so both stand out
    // before you get close.
    if (e.kind === 'bomb' || e.kind === 'panther') {
      const pulse = 0.5 + 0.5 * Math.sin(this.time * (e.kind === 'bomb' ? 12 : 5));
      const color = e.kind === 'bomb' ? '255, 45, 61' : '246, 188, 27';
      const halo = ctx.createRadialGradient(e.x, e.y, e.radius * 0.6, e.x, e.y, e.radius * (1.5 + pulse * 0.3));
      halo.addColorStop(0, `rgba(${color}, ${0.35 + pulse * 0.3})`);
      halo.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = halo;
      ctx.fillRect(e.x - e.radius * 2, e.y - e.radius * 2, e.radius * 4, e.radius * 4);
    }
    drawSprite(ctx, this.spriteFor(e), e.x, e.y, e.rotation, e.radius);
    if (e.kind === 'bomb') this.drawFuse(e);
  }

  /** A short fuse with a flickering spark, attached to the top of the bomb. */
  drawFuse(e) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.rotation);
    const top = -e.radius * 0.95;
    ctx.strokeStyle = '#c9a26b';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, top + 6);
    ctx.quadraticCurveTo(e.radius * 0.25, top - 8, e.radius * 0.1, top - 18);
    ctx.stroke();
    const flicker = 6 + Math.random() * 6;
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.arc(e.radius * 0.1, top - 18, flicker, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(e.radius * 0.1, top - 18, flicker * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * The panther claw swipe: a few parallel scratches that follow the pointer
   * and taper off at the old end. Each scratch is drawn twice, a wide gold
   * glow and then a thin bright core.
   */
  drawClaw(points, now) {
    if (points.length < 2) return;
    const { ctx } = this;
    const marks = EFFECTS.clawMarks;
    const spacing = 15;
    const maxAge = EFFECTS.clawTrailSeconds;
    ctx.lineCap = 'round';

    for (const pass of ['glow', 'core']) {
      ctx.strokeStyle = pass === 'glow' ? THEME.clawGlow : THEME.clawCore;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const length = Math.hypot(dx, dy) || 1;
        // The perpendicular direction, for spacing the scratches apart.
        const nx = -dy / length;
        const ny = dx / length;
        const freshness = Math.max(0, 1 - (now - b.time) / maxAge);
        // Newest part of the trail is widest.
        const along = i / (points.length - 1);
        const width = (pass === 'glow' ? 20 : 7) * freshness * (0.3 + 0.7 * along);
        if (width <= 0.2) continue;
        ctx.lineWidth = width;
        for (let m = 0; m < marks; m++) {
          const offset = (m - (marks - 1) / 2) * spacing;
          ctx.beginPath();
          ctx.moveTo(a.x + nx * offset, a.y + ny * offset);
          ctx.lineTo(b.x + nx * offset, b.y + ny * offset);
          ctx.stroke();
        }
      }
    }
  }
}
