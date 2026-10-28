# Panther Slash: rebuild plan

This is the plan of record for the Boo Bash 2026 rebuild. It holds current state
only. When something changes, edit it here instead of adding a new section.

**Target:** event-ready by the evening of Oct 29, 2026. (Open question: the brief
says "Thursday, October 30", but Oct 30, 2026 is a Friday. If the event is
really Thursday Oct 29, everything below moves up one day.)

## Orientation (Phase 0, done Oct 27)

**How the old engine worked.** Seven minified files (about 890 lines once
reformatted) shared one global namespace. A small particle library (`spp.min.js`)
ran everything: each enemy, half, juice drop and blade point was a particle.
Physics was counted per frame instead of per second, so on a 120 Hz screen the
game ran twice as fast. Slicing worked by testing each blade segment against each
enemy's ellipse. Three stacked canvases were fixed at 750×500.

**Decision: rewrite the core in clean ES modules and keep the ideas.**
- Every asset is being replaced, so the asset loader and sprite variants
  (`-w/-l/-r/-s/-j`) would change anyway.
- Making it responsive touches every draw call and every coordinate.
- The four vendored libraries (PreloadJS, SoundJS, TweenLite/EasePack, spp;
  about 145 KB of minified code) can each be replaced by a few dozen readable lines.
- Keep: the game flow (title → slice to start → play → game over), the
  segment-vs-shape slice test, and the juice ideas (halves flying apart, splats,
  sparks).

**Known problems, confirmed in headless Chrome:** fixed at 750×500 (on a 390 px
phone the canvas spills off-screen), touch uses unscaled `pageX/pageY` with no
`touchstart`/`touchend`, `storage = {}` resets the high score on every load,
leftover "more games" code, and the "FRUIT NINJA – Halloween Edition" title.
**Also found:**
- Frame-based physics. The game speed depends on the screen's refresh rate.
- The wood background, title, "new game" ring, lives, and miss X are
  recognizable Fruit Ninja art. The ghost, bat and Frankenstein sprites look like
  stock clip art with no known license.
- Every sliced enemy splashes the same yellow juice.
- It requires a right-click guard and an old `event` global, and has dead WebGL
  helpers in `utils.js`.

**Risks.**
1. ES modules don't load from `file://`, so each booth device needs either a
   local static server or the hosted site plus a service worker for offline play.
   That matters a lot if the booth devices are Chromebooks or iPads.
2. Prize thresholds can't be calibrated without real kids. Defaults are guesses,
   so staff mode can change them on the spot.
3. There is little time for testing on real devices. Plan a 30-minute booth
   rehearsal on the actual hardware.

## Architecture

- `index.html`: one full-viewport canvas for gameplay, plus an HTML overlay for
  the screens (title, results, prize, leaderboard, staff). The overlay gives us
  real buttons, crisp text, CSS transitions and accessibility for free.
- `src/config.js`: every value a student might tweak.
- `src/core/`: game rules with no DOM, such as spawning, slicing, scoring,
  lives, the timer and prize tiers.
- `src/render/`: the sky, moon, enemies drawn in code, the claw trail, particles.
- `src/input/`, `src/audio/`, `src/storage/`, `src/ui/`: the shells around the core.
- World coordinates: a 640×560 "safe area" that always fits on screen and grows
  to fill the rest, so gameplay feels the same on any device.
- Enemies are single images (drawn in code, or a student's PNG). The engine cuts
  them in half along the actual swipe line, so no pre-cut halves are needed.

## Phases

| Phase | Scope | Estimate | Target |
|---|---|---|---|
| 1. Event-ready core | modules, responsive and fullscreen, Pointer Events, saved best score, full rebrand, new screens, claw blade, theme, synthesized sound | ~6–8 h | Tue Oct 27 night |
| 2. Winning | Challenge mode, prize tiers and prize screen, verification code, local leaderboard and today's best, initials, staff/PIN, kiosk | ~5–6 h | Wed Oct 28 |
| 3. Polish | combos, Golden Panther bonus, power-ups, reduced motion, perf on low-end devices, service worker for offline | ~4 h | Wed night to Thu morning |
| Rehearsal | play on the real booth devices, fix what breaks | ~1–2 h | Thu Oct 29 by afternoon |

Post-event, approval needed: shared online leaderboard, deploy to
thinkinbits.site, school logo once permission is confirmed.

## Status

- [x] Phase 0: orientation and plan
- [x] Phase 1: built and verified Oct 27 (headless Chrome at 1280×800, 1024×768
  touch, 844×390 touch, 390×844 touch; rotation mid-round; 4× CPU throttle
  holds 60 fps; `node --test` 16/16).
- [x] Phase 2: built and verified Oct 27 on branch `boo-bash-rebuild` (25-step
  booth-flow script passes at 390×844, 844×390 and 1280×800 touch; prize
  screen fits without scrolling down to 375×667; `node --test` 33/33).
  Committed on `boo-bash-rebuild` (not pushed); legacy Fruit Ninja files deleted.
- [x] Phase 3: built and verified Oct 27 (uncommitted, awaiting approval). Added
  an offline service worker (verified with a reload while offline), attract mode
  on the title, Panther Frenzy, the Frost Orb power-up, adaptive low-quality
  mode for slow devices, buttons that fire on click so swipes can't start
  rounds, a frost/frenzy screen tint, and rounder panther ears.
  `node --test` 39/39; booth flow 25/25 on phone and desktop.
- [x] Event hardening, Oct 28: an independent review found 2 blockers (Frost
  Orb sprite never loaded, which froze the game; pause screen id mismatch,
  which soft-locked touch devices) plus 6 more issues. All fixed, with tests.
  Also added staff "Today" stats (rounds, prizes, score spread) and a cache-first
  service worker with a fingerprinted version. `node --test` 47/47; booth flow
  38/38 on three viewports; Frost Orb soak test clean; offline reload verified.
  Rehearsal checklist and deployment proposal in `docs/`.
- [ ] Next (needs Amali): real-device rehearsal (`docs/rehearsal-checklist.md`),
  calibrate prize thresholds with students, push the branch, and decide on
  deployment (`docs/deployment-proposal.md`).
