// The spooky night scene behind the game: sky, stars, the giant harvest moon,
// and black silhouettes of hills, trees and a haunted house.
//
// It's drawn once into its own canvas whenever the screen size changes, and
// then copied every frame. Copying one picture is much faster than redrawing
// a hundred shapes 60 times a second.

import { THEME } from '../config.js';

/** Tiny repeatable random numbers, so the stars don't jump around on resize. */
function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export class Background {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.moon = { x: 0, y: 0, radius: 0 }; // in world units, used for the secret staff taps
  }

  /** Redraw for a new screen size. */
  build(viewport) {
    const { canvas, ctx } = this;
    canvas.width = viewport.canvas.width;
    canvas.height = viewport.canvas.height;
    viewport.applyWorldTransform(ctx);

    const W = viewport.worldWidth;
    const H = viewport.worldHeight;
    const random = seededRandom(31);

    this.drawSky(ctx, W, H);
    this.drawStars(ctx, W, H, random);
    this.drawMoon(ctx, W, H);
    this.drawHills(ctx, W, H, random);
    this.drawSpiderWeb(ctx, Math.min(W, H) * 0.32);
  }

  drawSky(ctx, W, H) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, THEME.skyTop);
    sky.addColorStop(0.65, THEME.skyBottom);
    sky.addColorStop(1, '#6b2a5e');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
  }

  drawStars(ctx, W, H, random) {
    const count = Math.round((W * H) / 3500);
    for (let i = 0; i < count; i++) {
      const size = random() * 1.8 + 0.4;
      ctx.globalAlpha = 0.3 + random() * 0.7;
      ctx.fillStyle = random() < 0.15 ? '#ffe9a8' : '#ffffff';
      ctx.beginPath();
      ctx.arc(random() * W, random() * H * 0.75, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawMoon(ctx, W, H) {
    const radius = Math.min(W, H) * 0.2;
    const x = W * 0.74;
    const y = Math.min(H * 0.27, radius * 1.6);
    this.moon = { x, y, radius };

    // Soft glow around the moon.
    const glow = ctx.createRadialGradient(x, y, radius * 0.8, x, y, radius * 2.6);
    glow.addColorStop(0, 'rgba(255, 215, 94, 0.45)');
    glow.addColorStop(1, 'rgba(255, 215, 94, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius * 3, y - radius * 3, radius * 6, radius * 6);

    const face = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
    face.addColorStop(0, '#fff3b8');
    face.addColorStop(0.7, THEME.moon);
    face.addColorStop(1, '#f2a93b');
    ctx.fillStyle = face;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Craters.
    ctx.fillStyle = 'rgba(214, 140, 40, 0.28)';
    for (const [cx, cy, cr] of [[-0.35, -0.2, 0.18], [0.25, 0.3, 0.22], [0.4, -0.35, 0.1], [-0.1, 0.45, 0.09], [0.05, -0.05, 0.07]]) {
      ctx.beginPath();
      ctx.arc(x + cx * radius, y + cy * radius, cr * radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bats flying across the moon.
    this.drawBatSilhouette(ctx, x - radius * 0.25, y + radius * 0.05, radius * 0.22);
    this.drawBatSilhouette(ctx, x + radius * 0.4, y - radius * 0.45, radius * 0.12);
  }

  drawBatSilhouette(ctx, x, y, size) {
    ctx.fillStyle = THEME.silhouette;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - size * 0.5, y - size * 0.6, x - size, y - size * 0.2);
    ctx.quadraticCurveTo(x - size * 0.7, y - size * 0.1, x - size * 0.6, y + size * 0.15);
    ctx.quadraticCurveTo(x - size * 0.35, y - size * 0.05, x - size * 0.15, y + size * 0.2);
    ctx.lineTo(x, y + size * 0.05);
    ctx.lineTo(x + size * 0.15, y + size * 0.2);
    ctx.quadraticCurveTo(x + size * 0.35, y - size * 0.05, x + size * 0.6, y + size * 0.15);
    ctx.quadraticCurveTo(x + size * 0.7, y - size * 0.1, x + size, y - size * 0.2);
    ctx.quadraticCurveTo(x + size * 0.5, y - size * 0.6, x, y);
    ctx.fill();
  }

  drawHills(ctx, W, H, random) {
    const groundY = H * 0.86;

    // Far hills: purple, a little lighter, for depth.
    ctx.fillStyle = '#2a0e3d';
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, groundY - H * 0.05);
    for (let x = 0; x <= W; x += W / 6) {
      ctx.quadraticCurveTo(x + W / 12, groundY - H * (0.08 + random() * 0.06), x + W / 6, groundY - H * 0.04);
    }
    ctx.lineTo(W, H);
    ctx.fill();

    // Haunted house on the left hill.
    const houseX = W * 0.14;
    const houseBase = groundY - H * 0.035;
    const unit = Math.min(W, H) * 0.06;
    this.drawHouse(ctx, houseX, houseBase, unit);

    // Bare trees.
    this.drawTree(ctx, W * 0.42, groundY, unit * 1.5, random);
    this.drawTree(ctx, W * 0.93, groundY, unit * 2.2, random);

    // Near ground.
    ctx.fillStyle = THEME.silhouette;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, groundY);
    ctx.quadraticCurveTo(W * 0.25, groundY - H * 0.06, W * 0.5, groundY);
    ctx.quadraticCurveTo(W * 0.75, groundY + H * 0.04, W, groundY - H * 0.03);
    ctx.lineTo(W, H);
    ctx.fill();

    // Little gravestones along the ground.
    for (let i = 0; i < 5; i++) {
      const gx = W * (0.55 + i * 0.07);
      const gh = unit * (0.5 + random() * 0.4);
      ctx.beginPath();
      ctx.moveTo(gx - unit * 0.22, groundY + H * 0.02);
      ctx.lineTo(gx - unit * 0.22, groundY - gh + unit * 0.22);
      ctx.arc(gx, groundY - gh + unit * 0.22, unit * 0.22, Math.PI, 0);
      ctx.lineTo(gx + unit * 0.22, groundY + H * 0.02);
      ctx.fill();
    }
  }

  drawHouse(ctx, x, base, u) {
    ctx.fillStyle = THEME.silhouette;
    // Main house, tower, roofs.
    ctx.fillRect(x - u * 1.6, base - u * 2.2, u * 3.2, u * 2.2);
    ctx.fillRect(x + u * 0.8, base - u * 3.6, u * 1.1, u * 1.6);
    ctx.beginPath();
    ctx.moveTo(x - u * 1.9, base - u * 2.2);
    ctx.lineTo(x - u * 0.2, base - u * 3.4);
    ctx.lineTo(x + u * 1.2, base - u * 2.2);
    ctx.moveTo(x + u * 0.6, base - u * 3.6);
    ctx.lineTo(x + u * 1.35, base - u * 4.9);
    ctx.lineTo(x + u * 2.1, base - u * 3.6);
    ctx.fill();
    // Glowing windows.
    ctx.fillStyle = '#ffb627';
    for (const [wx, wy] of [[-1.1, -1.7], [-0.3, -1.7], [1.15, -3.0], [-0.7, -2.7]]) {
      ctx.fillRect(x + wx * u, base + wy * u, u * 0.4, u * 0.5);
    }
    ctx.fillStyle = '#ff7a1a';
    ctx.fillRect(x + 0.35 * u, base - u * 0.9, u * 0.5, u * 0.9); // door
  }

  drawTree(ctx, x, base, height, random) {
    ctx.strokeStyle = THEME.silhouette;
    ctx.lineCap = 'round';
    const branch = (bx, by, angle, length, width, depth) => {
      const ex = bx + Math.cos(angle) * length;
      const ey = by + Math.sin(angle) * length;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      if (depth === 0) return;
      branch(ex, ey, angle - 0.4 - random() * 0.3, length * 0.68, width * 0.62, depth - 1);
      branch(ex, ey, angle + 0.35 + random() * 0.3, length * 0.62, width * 0.62, depth - 1);
    };
    branch(x, base, -Math.PI / 2, height, height * 0.12, 4);
  }

  drawSpiderWeb(ctx, size) {
    ctx.strokeStyle = 'rgba(230, 220, 255, 0.28)';
    ctx.lineWidth = 1.4;
    const spokes = 6;
    for (let i = 0; i <= spokes; i++) {
      const a = (i / spokes) * (Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
      ctx.stroke();
    }
    for (let ring = 1; ring <= 5; ring++) {
      const r = (ring / 5) * size * 0.95;
      ctx.beginPath();
      for (let i = 0; i <= spokes; i++) {
        const a = (i / spokes) * (Math.PI / 2);
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        // Sag slightly between spokes, like a real web.
        else {
          const mid = a - Math.PI / 4 / spokes;
          ctx.quadraticCurveTo(Math.cos(mid) * r * 0.9, Math.sin(mid) * r * 0.9, x, y);
        }
      }
      ctx.stroke();
    }
  }

  draw(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.canvas, 0, 0);
  }
}
