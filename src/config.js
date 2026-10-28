// =============================================================================
// PANTHER SLASH: GAME CONFIG
// =============================================================================
// This is the one file to edit if you want to change how the game looks or
// plays. Every value has a comment saying what it does. Change one thing, save,
// reload the page, and see what happens!
//
// Units:
//   - "world units" are the game's own measuring system. The screen always
//     shows at least WORLD.safeWidth × WORLD.safeHeight units, whatever the
//     device, so the game feels the same on a phone and on a laptop.
//   - Times are in seconds unless the name says otherwise.
// =============================================================================

export const THEME = {
  // School colors (from ghcds.org; not yet confirmed as official).
  gold: '#F6BC1B',
  maroon: '#701114',
  charcoal: '#58595B',

  // Halloween colors (from the Boo Bash 2026 flyer).
  skyTop: '#12051f',      // top of the night sky
  skyBottom: '#3d1466',   // horizon glow
  moon: '#ffd75e',        // giant harvest moon
  pumpkin: '#ff7a1a',
  silhouette: '#0a0410',  // haunted house, trees, hills

  // Claw blade colors.
  clawGlow: 'rgba(246, 188, 27, 0.55)',
  clawCore: '#fff6d6',

  // Fonts. These are bundled in assets/fonts so they work offline.
  displayFont: '"Creepster", "Impact", fantasy',
  uiFont: '"Fredoka", "Trebuchet MS", system-ui, sans-serif',
};

export const WORLD = {
  // The area that is always visible on every screen. Extra screen space just
  // shows more sky.
  safeWidth: 640,
  safeHeight: 560,
  gravity: 1400, // world units per second², pulls everything down
};

// -----------------------------------------------------------------------------
// ENEMIES: the things you slice.
// -----------------------------------------------------------------------------
// Each enemy needs:
//   id      a unique name
//   art     either "drawn:<name>" (drawn in code, see src/render/art.js)
//           or a path to a PNG with a transparent background,
//           for example "assets/enemies/my-zombie.png" (see README).
//   radius  hit size in world units (about half the enemy's width)
//   points  score for slicing it
//   juice   splash color when sliced
//   weight  how often it appears compared to the others (bigger = more often)
export const ENEMIES = [
  { id: 'pumpkin', art: 'drawn:pumpkin', radius: 46, points: 10, juice: '#ff8a1f', weight: 4 },
  { id: 'ghost', art: 'drawn:ghost', radius: 44, points: 10, juice: '#cfe9ff', weight: 3 },
  { id: 'bat', art: 'drawn:bat', radius: 42, points: 15, juice: '#a259ff', weight: 2 },
  { id: 'candy', art: 'drawn:candy', radius: 38, points: 15, juice: '#ffe14d', weight: 2 },
  { id: 'eyeball', art: 'drawn:eyeball', radius: 38, points: 20, juice: '#ff3355', weight: 1 },
];

// The Golden Panther: a rare bonus target worth a lot of points.
export const GOLDEN_PANTHER = {
  art: 'drawn:panther',
  radius: 50,
  points: 100,
  juice: '#F6BC1B',
  chancePerThrow: 0.04, // 4% of throws include one
};

// Power-up: the Frost Orb. Slicing it slows everything down for a few
// seconds (the Challenge timer keeps running at normal speed).
export const FROST_ORB = {
  art: 'drawn:frost',
  radius: 42,
  points: 10,
  juice: '#9fe8ff',
  chancePerThrow: 0.05, // 5% of throws include one
  seconds: 4,           // how long the slow-down lasts
  slowFactor: 0.45,     // 0.45 = things move at 45% speed
};

// The bomb. Slicing it is bad! It's drawn as a spiky black skull so you can
// tell it apart by shape, not just color.
export const BOMB = {
  art: 'drawn:bomb',
  radius: 40,
  classicEndsGame: true, // Classic mode: slicing a bomb ends the game
  challengePenalty: 50, // Challenge mode: points lost instead
};

// -----------------------------------------------------------------------------
// SPAWNING: how enemies get thrown up from the bottom of the screen.
// -----------------------------------------------------------------------------
export const SPAWN = {
  firstThrowDelay: 0.8,  // seconds before the first throw
  startInterval: 1.6,    // seconds between throws at the start
  minInterval: 0.75,     // fastest it ever gets
  intervalShrink: 0.012, // how much faster per second of play (difficulty ramp)
  minPerThrow: 1,
  maxPerThrow: 3,        // grows to maxPerThrowLate as the game goes on
  maxPerThrowLate: 5,
  lateGameAfter: 30,     // seconds until "late game"
  bombChanceStart: 0.08, // chance each thrown thing is a bomb
  bombChanceLate: 0.2,
  apexMin: 0.15,         // highest point of the throw, as a fraction of screen height from the top
  apexMax: 0.5,
  spinMax: 4,            // max spin, radians per second
};

// PANTHER FRENZY: the last few seconds of a Boo Bash Challenge round go wild,
// with more throws and no bombs, so every round ends with a bang.
export const FRENZY = {
  lastSeconds: 10,      // starts when this many seconds are left
  intervalFactor: 0.5,  // 0.5 = throws come twice as often
  bombs: false,         // no bombs during the frenzy
};

// Attract mode: slow, harmless enemies drift across the title screen so
// people walking past see the game and can try a swipe.
export const ATTRACT = {
  startInterval: 1.5,   // seconds between throws
  maxPerThrow: 2,
};

// -----------------------------------------------------------------------------
// SCORING
// -----------------------------------------------------------------------------
export const SCORING = {
  comboWindow: 0.35, // seconds: slices this close together count as one combo
  comboMin: 3,       // smallest combo that earns a bonus
  comboBonusPerHit: 10, // bonus = hits × this, for combos of comboMin or more
  criticalChance: 0.08, // chance a slice is a CRITICAL slice (2× points)
};

// -----------------------------------------------------------------------------
// MODES
// -----------------------------------------------------------------------------
export const MODES = {
  classic: {
    lives: 3, // misses allowed before game over
  },
  challenge: {
    roundSeconds: 60, // Boo Bash Challenge length (staff can change it)
  },
};

// -----------------------------------------------------------------------------
// PRIZES (Boo Bash Challenge only). Staff can change these in staff mode.
// -----------------------------------------------------------------------------
// The highest tier whose minScore you reach is the prize you win.
export const PRIZE_TIERS = [
  { id: 'bronze', name: 'Bronze Panther', minScore: 400, color: '#cd7f32' },
  { id: 'silver', name: 'Silver Panther', minScore: 800, color: '#d9dde3' },
  { id: 'gold', name: 'Gold Panther', minScore: 1300, color: '#F6BC1B' },
  { id: 'legendary', name: 'Legendary Panther', minScore: 2000, color: '#c77dff' },
];

// -----------------------------------------------------------------------------
// LEADERBOARD
// -----------------------------------------------------------------------------
export const LEADERBOARD = {
  size: 10, // how many scores to show
  // Initials that can't be entered. Keep this list short and obvious.
  blockedInitials: ['ASS', 'FUK', 'FUC', 'FCK', 'SEX', 'KKK', 'DIK', 'DIC', 'CUM', 'TIT', 'FAG', 'NIG', 'XXX', 'WTF', 'POO', 'PEE', 'GAY', 'JIZ', 'COK', 'KOK', 'SHT', 'SHI', 'HOE', 'PUS', 'VAG', 'NAZ'],
};

// -----------------------------------------------------------------------------
// STAFF MODE
// -----------------------------------------------------------------------------
export const STAFF = {
  // Secret gesture: tap the moon this many times quickly on the title screen.
  secretTaps: 5,
  // Default PIN. Change it in staff mode on each booth device before the event.
  // This repo is public, so everyone can read this one!
  defaultPin: '1031',
  // Default "event word" used to make prize verification codes. Set the same
  // new word on every booth device in staff mode, so codes from one device can
  // be checked on another. (Again: everyone can read this default.)
  defaultEventWord: 'PANTHERS',
  // Kiosk mode: after this many idle seconds on a results screen, return to
  // the title screen.
  kioskIdleSeconds: 25,
};

// -----------------------------------------------------------------------------
// EFFECTS
// -----------------------------------------------------------------------------
export const EFFECTS = {
  maxParticles: 260,   // hard cap so older tablets stay smooth
  juicePerSlice: 14,   // droplets per slice
  clawTrailSeconds: 0.18, // how long the claw trail lingers
  clawMarks: 3,        // number of parallel claw scratches
  screenShake: true,
};
