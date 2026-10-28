// Shows one menu screen at a time (title, pause, results, ...) and fills in
// their text. The screens themselves are plain HTML in index.html.

const $ = (selector) => document.querySelector(selector);

let current = null;

// Only move focus for keyboard users. Moving it after a tap would show a
// focus ring around a button nobody pressed.
let usingKeyboard = false;
window.addEventListener('keydown', () => (usingKeyboard = true), { capture: true });
window.addEventListener('pointerdown', () => (usingKeyboard = false), { capture: true });

/** Show the screen with id "screen-<name>", or hide all screens with null. */
export function showScreen(name) {
  for (const screen of document.querySelectorAll('.screen')) {
    screen.classList.toggle('active', screen.id === `screen-${name}`);
  }
  current = name;
  // Lets the stylesheet adjust things per screen (e.g. hide corner buttons).
  document.body.dataset.screen = name ?? 'game';
  // Move keyboard focus to the first button, so keyboard and switch users
  // land somewhere useful.
  if (usingKeyboard && name) $(`#screen-${name} button`)?.focus({ preventScroll: true });
}

export const currentScreen = () => current;

/**
 * Call `handler(action, button)` whenever a button with data-action="..."
 * is pressed.
 *
 * We use "click", which fires only when a finger lifts on the same button it
 * pressed. A swipe that starts on a button and slides away (a kid slicing at
 * the enemies on the title screen) doesn't count, so nobody starts a round by
 * accident. Click also covers Enter and Space for keyboard users.
 */
export function onAction(handler) {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    event.preventDefault();
    handler(button.dataset.action, button);
  });
}

export function setText(selector, text) {
  const element = $(selector);
  if (element && element.textContent !== String(text)) element.textContent = text;
}

export function setHidden(selector, hidden) {
  const element = $(selector);
  if (element) element.hidden = hidden;
}

/** Fill a <dl> with label/value pairs. */
export function setStats(selector, pairs) {
  const list = $(selector);
  list.replaceChildren(
    ...pairs.map(([label, value]) => {
      const item = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = value;
      item.append(dt, dd);
      return item;
    }),
  );
}
