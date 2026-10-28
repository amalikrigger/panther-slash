// Visual-only effects: sliced halves, juice drops, splats, sparks, score
// popups, screen shake and flashes.
//
// None of this affects the score. The game rules (core/game.js) say what
// happened, and this file makes it look good.

import { EFFECTS, THEME } from '../config.js';
import { drawSprite } from './draw.js';

const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
export const prefersReducedMotion = () => !!reducedMotion?.matches;

export class Effects {
  constructor() {
    this.halves = [];    // the two pieces of each sliced enemy
    this.particles = []; // juice drops and sparks
    this.splats = [];    // splashes left on the "wall" behind the action
    this.texts = [];     // floating "+10", "COMBO", ...
    this.shakeTime = 0;
    this.shakeStrength = 0;
    this.flashTime = 0;
    this.flashColor = '#fff';
    this.maxParticles = EFFECTS.maxParticles;
    this.juicePerSlice = EFFECTS.juicePerSlice;
  }

  /** Slow device: fewer particles. */
  setLowQuality() {
    this.maxParticles = Math.round(EFFECTS.maxParticles / 2);
    this.juicePerSlice = Math.round(EFFECTS.juicePerSlice / 2);
  }

  clear() {
    this.halves.length = 0;
    this.particles.length = 0;
    this.splats.length = 0;
    this.texts.length = 0;
    this.shakeTime = 0;
    this.flashTime = 0;
  }

  // --- Reactions to game events ---------------------------------------------

  slice(entity, angle, sprite) {
    // Pieces fly apart sideways from the cut, keeping the enemy's own motion.
    const normalX = -Math.sin(angle);
    const normalY = Math.cos(angle);
    for (const side of [-1, 1]) {
      this.halves.push({
        sprite,
        x: entity.x,
        y: entity.y,
        vx: entity.vx * 0.6 + normalX * side * 170,
        vy: Math.min(entity.vy * 0.6, 0) + normalY * side * 170 - 120,
        rotation: entity.rotation,
        spin: entity.spin + side * 3,
        // The cut angle as seen from inside the sprite (which is rotated).
        cutAngle: angle - entity.rotation,
        side,
        radius: entity.radius,
        juice: entity.type.juice,
      });
    }

    // Cap the pieces too, in case someone slices a huge pile at once.
    if (this.halves.length > 40) this.halves.splice(0, this.halves.length - 40);

    const drops = prefersReducedMotion() ? 4 : this.juicePerSlice;
    for (let i = 0; i < drops; i++) {
      const speed = 120 + Math.random() * 380;
      const spread = angle + (Math.random() - 0.5) * 1.6 + (Math.random() < 0.5 ? 0 : Math.PI);
      this.addParticle({
        x: entity.x,
        y: entity.y,
        vx: Math.cos(spread) * speed,
        vy: Math.sin(spread) * speed - 80,
        size: 3 + Math.random() * 6,
        life: 0.5 + Math.random() * 0.5,
        color: entity.type.juice,
        gravity: true,
      });
    }

    this.splats.push({
      x: entity.x,
      y: entity.y,
      radius: entity.radius * (1.1 + Math.random() * 0.4),
      color: entity.type.juice,
      life: 1.4,
      maxLife: 1.4,
      seed: Math.random() * 1000,
    });
    if (this.splats.length > 12) this.splats.shift();
  }

  bomb(entity) {
    const sparks = prefersReducedMotion() ? 20 : 70;
    for (let i = 0; i < sparks; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 600;
      this.addParticle({
        x: entity.x,
        y: entity.y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        size: 3 + Math.random() * 5,
        life: 0.4 + Math.random() * 0.6,
        color: Math.random() < 0.5 ? '#ff2d3d' : '#ffd23f',
        gravity: false,
      });
    }
    this.shake(0.5, 18);
    this.flash('#ff2d3d', 0.35);
  }

  shake(seconds, strength) {
    if (!EFFECTS.screenShake || prefersReducedMotion()) return;
    this.shakeTime = Math.max(this.shakeTime, seconds);
    this.shakeStrength = strength;
  }

  flash(color, seconds) {
    if (prefersReducedMotion()) return;
    this.flashColor = color;
    this.flashTime = seconds;
  }

  /** A floating text that rises and fades, like "+10" or "COMBO ×4". */
  popup(text, x, y, { color = '#fff', size = 34, life = 0.9, font = THEME.uiFont } = {}) {
    this.texts.push({ text, x, y, color, size, life, maxLife: life, font });
  }

  addParticle(p) {
    // Hard cap: on a slow tablet, too many particles is the first thing to
    // make the game stutter.
    if (this.particles.length >= this.maxParticles) this.particles.shift();
    p.maxLife = p.life;
    this.particles.push(p);
  }

  // --- Update ---------------------------------------------------------------

  update(dt, gravity, bounds) {
    for (const h of this.halves) {
      h.vy += gravity * dt;
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.rotation += h.spin * dt;
    }
    this.halves = this.halves.filter((h) => h.y - h.radius < bounds.bottom + 40);

    for (const p of this.particles) {
      if (p.gravity) p.vy += gravity * 0.8 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    for (const s of this.splats) s.life -= dt;
    this.splats = this.splats.filter((s) => s.life > 0);

    for (const t of this.texts) {
      t.y -= 60 * dt;
      t.life -= dt;
    }
    this.texts = this.texts.filter((t) => t.life > 0);

    this.shakeTime = Math.max(0, this.shakeTime - dt);
    this.flashTime = Math.max(0, this.flashTime - dt);
  }

  /** How far to offset the whole scene this frame for screen shake. */
  shakeOffset() {
    if (this.shakeTime <= 0) return { x: 0, y: 0 };
    const strength = this.shakeStrength * Math.min(1, this.shakeTime * 3);
    return { x: (Math.random() - 0.5) * strength, y: (Math.random() - 0.5) * strength };
  }

  // --- Draw -----------------------------------------------------------------

  drawSplats(ctx) {
    for (const s of this.splats) {
      ctx.globalAlpha = 0.5 * (s.life / s.maxLife);
      ctx.fillStyle = s.color;
      // One big drop with a ring of smaller drops around it.
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius * 0.7, 0, Math.PI * 2);
      for (let i = 0; i < 7; i++) {
        const a = s.seed + i * 2.4;
        const distance = s.radius * (0.75 + 0.35 * Math.sin(s.seed * 3 + i));
        const x = s.x + Math.cos(a) * distance;
        const y = s.y + Math.sin(a) * distance;
        const r = s.radius * (0.12 + 0.1 * Math.abs(Math.sin(s.seed + i * 1.7)));
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawHalves(ctx) {
    const big = 1000;
    for (const h of this.halves) {
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rotation + h.cutAngle);
      // Keep only one side of the cut line.
      ctx.beginPath();
      ctx.rect(-big, h.side > 0 ? 0 : -big, big * 2, big);
      ctx.clip();
      ctx.rotate(-h.cutAngle);
      drawSprite(ctx, h.sprite, 0, 0, 0, h.radius);
      ctx.rotate(h.cutAngle);
      // The juicy inside along the cut.
      ctx.strokeStyle = h.juice;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-h.radius * 0.8, 0);
      ctx.lineTo(h.radius * 0.8, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawParticles(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.min(1, (p.life / p.maxLife) * 1.5);
      ctx.fillStyle = p.color;
      const size = p.size * (0.5 + 0.5 * (p.life / p.maxLife));
      // Squares are much cheaper to draw than circles, and at this size
      // nobody can tell.
      ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  }

  drawTexts(ctx) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of this.texts) {
      const age = 1 - t.life / t.maxLife;
      // Pop in big, then settle.
      const scale = age < 0.15 ? 0.6 + (age / 0.15) * 0.6 : 1.2 - Math.min(0.2, (age - 0.15) * 0.5);
      ctx.globalAlpha = Math.min(1, (t.life / t.maxLife) * 2.5);
      ctx.font = `700 ${Math.round(t.size * scale)}px ${t.font}`;
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(18, 5, 31, 0.85)';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  drawFlash(ctx, width, height) {
    if (this.flashTime <= 0) return;
    ctx.globalAlpha = Math.min(0.5, this.flashTime * 1.5);
    ctx.fillStyle = this.flashColor;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
  }
}
