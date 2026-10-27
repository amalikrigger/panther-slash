// Tracks how long since anyone touched the screen or pressed a key. Kiosk
// mode uses it to send an abandoned results screen back to the title, so the
// next player in line starts fresh.

let lastActivity = performance.now();

const markActive = () => (lastActivity = performance.now());
window.addEventListener('pointerdown', markActive, { capture: true });
window.addEventListener('pointermove', markActive, { capture: true, passive: true });
window.addEventListener('keydown', markActive, { capture: true });

export const idleSeconds = () => (performance.now() - lastActivity) / 1000;
export const resetIdle = markActive;
