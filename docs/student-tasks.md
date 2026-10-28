# Student tasks

Good first tasks for improving Panther Slash. Pick one, tell your teacher
which one you're taking, and follow the git workflow in the README.
⭐ = beginner, ⭐⭐ = some coding, ⭐⭐⭐ = a challenge.

## Art and design

- ⭐ **Draw a new enemy.** A zombie hand, a witch hat, a spider, a skeleton,
  a black cat... Follow "Add a new enemy" in the README (256×256 PNG,
  transparent background, dark outline).
- ⭐ **Design prize-tier badges** for Bronze, Silver, Gold and Legendary
  Panther. Same PNG rules as enemies.
- ⭐⭐ **Draw a new enemy in code.** Copy `drawGhost` in `src/render/art.js`,
  change the shapes, and register it in `DRAWINGS`.
- ⭐⭐ **Redesign the night scene** in `src/render/background.js`: add a
  graveyard fence, a witch flying across the moon, or a St. Croix touch like
  palm-tree silhouettes or a windmill tower.

## Tuning the game

- ⭐ **Tune the spawn rates.** In `src/config.js`, change `SPAWN` until a
  60-second round feels fair for a 3rd grader *and* a challenge for a senior.
  Write down what you tried.
- ⭐ **Tune the prize thresholds** in `PRIZE_TIERS` after watching
  classmates play. What score should a first-timer usually reach?
- ⭐⭐ **Add a new color theme** (Christmas? Carnival?) by copying `THEME`.

## Sound

- ⭐ **Record sound effects:** a panther growl, a "BOO!", a crowd cheer.
  Record on a phone, trim it, and save it as a short `.mp3`. (Hooking recorded
  files into `src/audio/sound.js` is a ⭐⭐ follow-up.)
- ⭐⭐ **Make a new synthesized sound** in `src/audio/sound.js`. Try changing
  the `from`/`to` pitches of the combo sound.

## Code

- ⭐⭐ **Add a new power-up.** Copy how the Frost Orb works (`FROST_ORB` in
  `config.js`, `makeFrostOrb` in `core/game.js`). Ideas: a "double points"
  candy, or a magnet that pulls enemies to the middle.
- ⭐⭐ **Show a "Perfect!" message** when a round ends with zero misses.
- ⭐⭐⭐ **Write a new test** in `tests/core.test.mjs` for something you
  changed. Check that it fails when the code is wrong!
- ⭐⭐⭐ **Add a boss**: a giant pumpkin that takes 5 slices to break.

## Rules

- No personal data in the game (initials only, never names or photos of
  players).
- Only use art and sounds you made or that are clearly free to use, and
  credit them in `assets/CREDITS.md`.
