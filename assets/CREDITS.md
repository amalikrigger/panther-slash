# Credits and licenses

Every file the game uses must be listed here with where it came from and its
license. If you add art, sound or a font, add a row in the same commit.

## Fonts

| File | Source | Author | License |
|---|---|---|---|
| `fonts/creepster-latin.woff2` | [Google Fonts: Creepster](https://fonts.google.com/specimen/Creepster) | Font Diner (Sideshow) | SIL Open Font License 1.1 (`fonts/OFL-Creepster.txt`) |
| `fonts/fredoka-latin-variable.woff2` | [Google Fonts: Fredoka](https://fonts.google.com/specimen/Fredoka) | The Fredoka Project Authors (Milena Brandão, Hafontia) | SIL Open Font License 1.1 (`fonts/OFL-Fredoka.txt`) |

Both were downloaded on Oct 27, 2026 (Latin subset only) and are bundled so the
game works offline.

## Art drawn in code (no image files)

Original work for Panther Slash, made with Canvas drawing code. These are part
of this project's own code and carry no third-party license.

| What | Where |
|---|---|
| Pumpkin, ghost, bat, candy corn, eyeball, Golden Panther medallion, Frost Orb, skull bomb | `src/render/art.js` |
| Night sky, harvest moon, haunted house, trees, gravestones, spiderweb | `src/render/background.js` |
| Claw trail, juice, splats, sparks | `src/render/renderer.js`, `src/render/effects.js` |
| HUD paw icons, button icons | inline SVG in `index.html` and `src/ui/hud.js` |
| App icons `icons/icon-*.png` | rendered from the Golden Panther drawing in `src/render/art.js` |

## Sound

All sound effects are synthesized live with the Web Audio API in
`src/audio/sound.js`. There are no sound files.

## Student contributions

| File | Made by | Notes |
|---|---|---|
| *(none yet)* | | |

## Removed legacy files

The project started from an HTML5 port of Halfbrick's *Fruit Ninja*
(minified scripts, fruit sprites, sounds and UI images). Those files were not
licensed for our use. They were never used by Panther Slash and were deleted
on Oct 27, 2026. They still exist in this repo's early git history.
