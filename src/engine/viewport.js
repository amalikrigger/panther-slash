// Makes the canvas fill the screen and converts between screen pixels and
// world units.
//
// The idea: the game always shows at least a WORLD.safeWidth × safeHeight area.
// We pick the biggest scale that fits that area on screen, and any extra space
// shows more world. So on a wide laptop you see more sky to the sides, and on a
// tall phone you see more sky above, but enemies stay the same size relative
// to the play area.

import { WORLD } from '../config.js';

// Drawing at more than 2× pixel density costs a lot on phones and is hard to
// see, so we cap it.
const MAX_PIXEL_RATIO = 2;

export class Viewport {
  constructor(canvas) {
    this.canvas = canvas;
    this.cssWidth = 0;
    this.cssHeight = 0;
    this.pixelRatio = 1;
    this.scale = 1; // CSS pixels per world unit
    this.bounds = { left: 0, top: 0, right: WORLD.safeWidth, bottom: WORLD.safeHeight };
    this.listeners = [];
    this.maxPixelRatio = MAX_PIXEL_RATIO;

    const onResize = () => this.resize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    // Mobile browsers change the visible size when the address bar hides.
    window.visualViewport?.addEventListener('resize', onResize);
    this.resize();
  }

  /** Used on slow devices: draw fewer pixels. */
  setMaxPixelRatio(ratio) {
    this.maxPixelRatio = ratio;
    this.resize();
  }

  onChange(listener) {
    this.listeners.push(listener);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const pixelRatio = Math.min(window.devicePixelRatio || 1, this.maxPixelRatio);
    if (width === this.cssWidth && height === this.cssHeight && pixelRatio === this.pixelRatio) return;

    this.cssWidth = width;
    this.cssHeight = height;
    this.pixelRatio = pixelRatio;
    this.canvas.width = Math.round(width * pixelRatio);
    this.canvas.height = Math.round(height * pixelRatio);

    this.scale = Math.min(width / WORLD.safeWidth, height / WORLD.safeHeight);
    this.bounds = { left: 0, top: 0, right: width / this.scale, bottom: height / this.scale };
    for (const listener of this.listeners) listener(this);
  }

  /** World width and height currently visible. */
  get worldWidth() {
    return this.bounds.right;
  }

  get worldHeight() {
    return this.bounds.bottom;
  }

  /** Convert a pointer position (CSS pixels from the page's top left) to world units. */
  toWorld(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: (clientX - rect.left) / this.scale, y: (clientY - rect.top) / this.scale };
  }

  /** Set the canvas transform so drawing commands use world units. */
  applyWorldTransform(ctx) {
    const s = this.scale * this.pixelRatio;
    ctx.setTransform(s, 0, 0, s, 0, 0);
  }
}
