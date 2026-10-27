// Loads every enemy picture before the game starts.
//
// An `art` value in config.js is either:
//   "drawn:pumpkin"              drawn with code (see art.js)
//   "assets/enemies/zombie.png"  a picture file (see README: "Add a new enemy")
//
// If a picture file is missing or broken, we use the drawn pumpkin instead and
// print a warning in the browser console, so a typo never crashes the booth.

import { makeDrawnSprite } from './art.js';

const FALLBACK_ART = 'drawn:pumpkin';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src; // relative path, so it works from any subfolder on the website
  });
}

/**
 * @param {string[]} artKeys
 * @returns {Promise<Map<string, CanvasImageSource>>}
 */
export async function loadSprites(artKeys) {
  const sprites = new Map();
  await Promise.all(
    [...new Set(artKeys)].map(async (key) => {
      if (key.startsWith('drawn:')) {
        const sprite = makeDrawnSprite(key.slice('drawn:'.length));
        if (sprite) {
          sprites.set(key, sprite);
          return;
        }
        console.warn(`[Panther Slash] No drawing named "${key}". Using a pumpkin instead.`);
      } else {
        try {
          sprites.set(key, await loadImage(key));
          return;
        } catch (error) {
          console.warn(`[Panther Slash] ${error.message}. Using a pumpkin instead.`);
        }
      }
      sprites.set(key, makeDrawnSprite(FALLBACK_ART.slice('drawn:'.length)));
    }),
  );
  return sprites;
}
