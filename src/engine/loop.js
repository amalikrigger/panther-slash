// The game loop: calls `update(dt)` and `draw()` once per screen refresh.
//
// `dt` is the real time since the last frame, in seconds, so the game runs at
// the same speed on a 60 Hz tablet and a 120 Hz phone. (The old game moved
// things a fixed amount per frame, so it ran twice as fast on fast screens.)

// If a frame takes longer than this (the tab was busy, or a slow device
// hiccupped) we pretend it was this long, so enemies don't teleport.
const MAX_FRAME_SECONDS = 1 / 20;

export function startLoop({ update, draw }) {
  let lastTime = null;
  let pending = null; // the one frame we've asked the browser for, if any
  let lastError = null;

  // Only ever keep one frame request. Without this, coming back to a hidden
  // tab could start a second loop and make the game run at double speed.
  function schedule() {
    if (pending === null) pending = requestAnimationFrame(frame);
  }

  function frame(now) {
    pending = null;
    // Ask for the next frame first: if this frame throws an error, the game
    // keeps going instead of freezing forever in the middle of a round.
    schedule();
    const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, MAX_FRAME_SECONDS);
    lastTime = now;
    try {
      update(dt);
      draw();
    } catch (error) {
      // Log each different error once, not 60 times a second.
      if (String(error) !== lastError) console.error('[Panther Slash] Frame error:', error);
      lastError = String(error);
    }
  }

  // Stop completely while the tab is hidden: saves battery, and avoids a giant
  // dt when the player comes back.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (pending !== null) cancelAnimationFrame(pending);
      pending = null;
    } else {
      lastTime = null;
      schedule();
    }
  });

  schedule();
}
