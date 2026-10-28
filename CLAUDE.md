# Panther Slash: project instructions

A browser slicing game for the **GHCDS Boo Bash** Halloween event (Good Hope
Country Day School, Kingshill, St. Croix, USVI; the Panthers). Amali teaches
at GHCDS, and students clone and extend this repo, so it is also a **teaching
codebase**.

- Full brief: `docs/kickoff-prompt.md`. Current plan and status: `docs/plan.md`
  (the plan of record; update it there, don't fork it).
- How to run, play, add enemies, and the student workflow: `README.md`.

## Hard constraints

- **Static and offline.** Vanilla JS ES modules + Canvas 2D + HTML/CSS. No
  bundler, no npm build, no CDN loading. Vendor any approved library with an
  exact pinned version. Must run from any static host **subpath**
  (e.g. `thinkinbits.site/panther-slash/`), so use **relative URLs only**,
  never a leading `/`.
- **No new dependencies, frameworks or services** without Amali's approval.
  The online shared leaderboard and deployment are approval-gated.
- **Privacy:** players are mostly minors. Never collect names, emails or other
  personal data. Leaderboards store 3-letter initials, score and date only.
- **IP:** the repo is public. Every asset needs a known source and license,
  recorded in `assets/CREDITS.md`. Prefer art drawn in code, then CC0/OFL,
  then student-made. **No school logo or marks** until permission is confirmed.
  The legacy Fruit Ninja files in `assets/` are unlicensed and must not be used.
- **Approvals:** ask before any commit, push, deploy, new service/account, or
  deleting/moving files. Propose commits with their messages.

## Architecture (see the README for the file map)

- `src/config.js` holds every value a student might tweak. Keep it that way.
- `src/core/` is the game rules, DOM-free and deterministic given `random`.
  It emits events; `src/main.js` maps them to effects and sound.
  Tests: `node --test` (Node built-in runner, no install).
- Rendering: a single full-viewport canvas in world units. A
  `WORLD.safeWidth × safeHeight` area is always visible and extra space shows
  more world (`src/engine/viewport.js`). Physics is per second (dt-based).
- Menus are an HTML overlay (`index.html`, `src/ui/`); `#ui` has
  `pointer-events: none` so swipes reach the canvas.
- Enemy art is one whole image per enemy (drawn in `src/render/art.js` or a
  student PNG); halves are cut at runtime along the swipe line.
- `sw.js` is the offline cache (stale-while-revalidate). It's skipped on
  localhost (add `?sw` to test it). `tests/offline.test.mjs` fails if a game
  file is missing from its `PRECACHE` list.

## Identity

Theme: Panther gold `#F6BC1B` / maroon `#701114` / charcoal `#58595B` (from
ghcds.org, not yet confirmed official) plus Boo Bash purple night, harvest
moon and pumpkin orange. Fonts: Creepster (display) and Fredoka (UI), bundled.

## Verifying changes

Serve with `python3 -m http.server <free port>` and check desktop, tablet and
phone (portrait and landscape) sizes, touch input, and a clean console. Add
`?debug` to expose `window.pantherSlash` for scripted checks.
