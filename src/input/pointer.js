// Turns mouse, touch and pen movement into "blade" movement.
//
// Pointer Events handle all three with one set of events (pointerdown,
// pointermove, pointerup), so there's one code path instead of separate mouse
// and touch handlers like the old game had.
//
// We keep two things for each finger or mouse:
//   - a short trail of recent points, so the renderer can draw the claw swipe
//   - the segments moved since the last frame, so the game can test for slices

// A move shorter than this (in world units) doesn't slice. It stops a plain
// tap from counting as a swipe.
const MIN_SLICE_DISTANCE = 6;

export class PointerInput {
  constructor(canvas, viewport) {
    this.canvas = canvas;
    this.viewport = viewport;
    this.trails = new Map(); // pointerId -> { points: [{x, y, time}], active }
    this.pendingSegments = [];
    this.time = 0;
    this.listeners = { down: [] };

    canvas.addEventListener('pointerdown', (e) => this.onDown(e));
    canvas.addEventListener('pointermove', (e) => this.onMove(e));
    canvas.addEventListener('pointerup', (e) => this.onUp(e));
    canvas.addEventListener('pointercancel', (e) => this.onUp(e));
    canvas.addEventListener('lostpointercapture', (e) => this.onUp(e));
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /** Called with the world position of every new press, e.g. for the secret staff taps. */
  onPress(listener) {
    this.listeners.down.push(listener);
  }

  onDown(e) {
    e.preventDefault();
    // Capture keeps the swipe going even if the finger slides over a button.
    this.canvas.setPointerCapture?.(e.pointerId);
    const p = this.viewport.toWorld(e.clientX, e.clientY);
    this.trails.set(e.pointerId, { points: [{ x: p.x, y: p.y, time: this.time }], active: true });
    for (const listener of this.listeners.down) listener(p);
  }

  onMove(e) {
    const trail = this.trails.get(e.pointerId);
    // A mouse moving without its button pressed isn't swiping.
    if (!trail || !trail.active) return;
    e.preventDefault();
    // Browsers may bundle several moves into one event. Using all of them
    // gives a smoother trail and catches fast swipes.
    const events = e.getCoalescedEvents?.() ?? [];
    for (const ev of events.length ? events : [e]) {
      this.addPoint(trail, this.viewport.toWorld(ev.clientX, ev.clientY));
    }
  }

  addPoint(trail, p) {
    const last = trail.points[trail.points.length - 1];
    const dx = p.x - last.x;
    const dy = p.y - last.y;
    if (dx * dx + dy * dy < MIN_SLICE_DISTANCE * MIN_SLICE_DISTANCE) return;
    trail.points.push({ x: p.x, y: p.y, time: this.time });
    this.pendingSegments.push([last.x, last.y, p.x, p.y]);
  }

  onUp(e) {
    const trail = this.trails.get(e.pointerId);
    if (trail) trail.active = false;
  }

  /** Advance time and drop trail points older than `trailSeconds`. */
  update(dt, trailSeconds) {
    this.time += dt;
    for (const [id, trail] of this.trails) {
      const cutoff = this.time - trailSeconds;
      // Always keep the newest point of an active trail, so the next move
      // connects to where the finger is.
      while (trail.points.length > (trail.active ? 1 : 0) && trail.points[0].time < cutoff) {
        trail.points.shift();
      }
      if (!trail.active && trail.points.length === 0) this.trails.delete(id);
    }
  }

  /** Return the swipe segments since the last call and clear them. */
  takeSegments() {
    const segments = this.pendingSegments;
    this.pendingSegments = [];
    return segments;
  }

  /** Forget everything, e.g. when a screen changes. */
  clear() {
    this.pendingSegments = [];
    for (const trail of this.trails.values()) trail.points.length = Math.min(trail.points.length, 1);
  }
}
