# Panther Slash: kickoff prompt

You are taking over **Panther Slash**, a browser slicing game we are rebuilding for the **Good Hope Country Day School (GHCDS) Boo Bash** Halloween event. I teach at GHCDS. My students will clone this repo and keep improving the game with me, so the code is also a teaching codebase. Read this whole brief, orient yourself in the repo, give me a plan, and then start building Phase 0 right away. Stop only at the checkpoints below or for a decision that really is mine.

---

## 1. The event (hard deadline)

- **Boo Bash 2026:** Thursday, **October 30, 2026, 4–7 PM**, on the GHCDS campus in Kingshill, St. Croix, USVI. "All of Saint Croix is welcome."
- Activities: student-led games ($2/game), a creepy haunted house ($5), trunk-or-treat, prizes, and a food/bake sale. Hashtags: #BooBash #PantherPride #SpookySeason.
- Sources: https://www.ghcds.org/apps/news/article/2234832?categoryId=22434 (the 2026 flyer) and https://www.ghcds.org/apps/news/article/2129005 (the 2025 event).
- Check today's date. The game must be **event-ready by the evening of Oct 29**. Anything that can't be finished and tested by then is post-event work, so plan scope against the time we actually have.
- Likely event setup (confirm with me): one or more school laptops/tablets as play stations at a booth, plus visitors possibly playing on their own phones. Event Wi-Fi is not reliable, so **the core game must work fully offline.**
- **Where it will live:** the game will eventually be hosted on my website, **thinkinbits.site**, for the school. It will probably be served from a subpath (for example `thinkinbits.site/panther-slash/`), so use **relative URLs only**: no root-absolute `/assets/...` paths and no assumptions about the domain. Keep the game a self-contained static folder that can be dropped into any static host. Don't touch the website's own repo or deploy anything without my approval.

## 2. Identity and visual direction

**School:** GHCDS, home of the **Panthers** (#PantherPride).
- Colors seen on ghcds.org (confirm with me before treating them as official): gold `#F6BC1B`, maroon `#701114`, charcoal `#58595B`.
- The school logo is a gold tree silhouette: https://www.ghcds.org/pics/school_logo.png. **Do not use the school logo or other school marks in the game** until I confirm we have permission. Use the colors and the panther theme freely.

**Halloween / Boo Bash:** the 2026 flyer uses deep purple skies, a huge harvest-moon yellow, pumpkin orange, black silhouettes (haunted house, bats, spiderweb), and a drippy horror display font (Creepster on Google Fonts is a close match).

**Direction:** a modern, polished arcade game, not a 2012 Flash port. Combine the Panther gold/maroon with the Halloween purple/orange into one coherent theme. The player's blade becomes a **panther claw swipe**. The UI should feel bold and juicy: smooth transitions, good typography, satisfying slice feedback, and clear contrast for a booth with crowds and outdoor light.

## 3. What is in the repo today

- Static site, no build step: `index.html` plus `assets/`. Run it with `python3 -m http.server <port>` from the repo root. (Port 8080 may already be taken by another session; pick a free port.)
- It started as a copy of a "Fruit Ninja Halloween" HTML5 port. **All game JS is minified onto single lines:** `assets/Main.js`, `Assets.js`, `utils.js`, `Module_fruit.js`, `Module_bomb.js`, `Module_collide.js`, `Module_blade.js`, plus `spp.min.js` (a small particle-system library). Third-party libs: CreateJS PreloadJS/SoundJS 0.6 and GSAP TweenLite/EasePack.
- Rendering: three stacked `<canvas>` layers (`bottom`, `middle`, `top`), **hard-coded at 750×500 px** and absolutely positioned at the top-left.
- Sprites in `assets/fruits/`: bat, frankenstein, ghost, pumpkin, each with `-w`, `-l`, `-r`, `-s`, `-j` variants (these look like whole / left half / right half / splash / juice; verify). UI images: `gametitle.png`, `newgame.png`, `gameover.png`, `gamelife-0..3.png`, `score.png`, `bomb.png`, `star.png`, `shadow.png`, `miss.png`, `bg.jpg`, `loading.png`. Sounds in `assets/sound/`.
- Known problems I've already found (verify them and look for more):
  - It is not responsive or full-screen; the canvas is fixed at 750×500.
  - Touch input uses unscaled `pageX/pageY`, there is no `touchstart`/`touchend`, and mouse and touch use separate code paths.
  - The high score is never saved (`storage = {}` is rebuilt on every load).
  - Leftover "more games" portal code (`#moreGames`, `moregames.png`).
  - `assets/gametitle.png` still shows the **"FRUIT NINJA – Halloween Edition"** logo.
- **IP:** the name, logo, art and sounds come from Halfbrick's Fruit Ninja, and this repo is **public**. Replacing every Halfbrick-derived asset and name with original or properly licensed material is a real requirement, not polish. Do it before the event if at all possible.

## 4. Technical approach

- **Start simple with what we have.** Vanilla JS and Canvas 2D, no bundler, no npm build. It must open from a static server and work offline.
- First, un-minify the game code into readable source and understand it. Then decide, and tell me why: refactor the existing engine into clean modules, or rewrite the core loop in clean vanilla JS while reusing what is worth keeping. Either way, the result should be readable ES modules (`<script type="module">`) that a student can follow.
- Three.js, Pixi or another framework is allowed **only if** you can show a concrete need that Canvas 2D can't meet. Propose it with the trade-off; don't just add it.
- Keep anything a student might want to tweak (colors, fonts, enemy list, spawn rates, scoring, prize thresholds, timer length) in one well-commented config/theme file.
- Responsive and full-screen across desktop, tablet and phone:
  - Fill the viewport and scale the canvas for `devicePixelRatio`.
  - Use logical world coordinates so gameplay feels the same at any size.
  - Handle resizes and orientation changes, and add a full-screen button using the Fullscreen API. Have a fallback for iOS Safari, which limits fullscreen; at minimum add-to-home-screen meta tags and `100dvh`.
  - Use **Pointer Events** for mouse, touch and pen in one code path. Prevent scrolling, zooming and the context menu during play.
  - Unlock audio on the first tap, since mobile browsers block autoplay.
- Performance target: smooth on an older school tablet or Chromebook. Cap particle counts, avoid layout thrash, and pause when the tab is hidden.
- Accessibility: big touch targets, readable text, `prefers-reduced-motion` support, and bombs that are distinguishable by shape, not just color.

## 5. Winning, prizes, and leaderboard

Boo Bash charges $2 per game and gives prizes, so the game needs a fair, booth-friendly way to win:

- **Boo Bash Challenge mode:** a fixed-length round (start with 60 seconds, configurable) so every paid play is equal and the line keeps moving. Keep classic mode as well.
- **Prize tiers:** score thresholds such as Bronze / Silver / Gold / Legendary Panther, all configurable. At the end of a round, show a big, clear **prize screen** a booth volunteer can verify at a glance: tier, score, time, and a short verification code. It must be hard for a kid to fake with a screenshot of someone else's win. Propose a simple scheme.
- **Leaderboard:** offline-first and local to each device, using `localStorage`. Show the top 10 with **arcade-style 3-letter initials only. Never collect names, emails or other personal data; most players are minors.** Include "today's best" for the event night.
- **Staff/admin mode:** behind a hidden gesture plus a PIN. Lets staff reset the board, set prize thresholds and the round length, and switch to kiosk mode (auto-return to the title screen after inactivity).
- **Shared online leaderboard across devices:** design for it but **don't build it without my approval**. When you propose it, cover the service (for example Supabase or Firebase), the cost, how to moderate initials, anti-cheat basics, and keeping minors' data out.
- Gameplay depth beyond that is welcome: combos, critical slices, multi-slice bonuses, power-ups, a Panther-themed special enemy or boss moment, and difficulty ramping. Event-night clarity comes before features.

## 6. Assets: where they come from

Every asset must have a known source and license. Keep `assets/CREDITS.md` up to date with the file, source, author, license and link.

In order of preference:
1. **Drawn in code** (Canvas/SVG shapes, gradients, particles). No licensing risk, and great for the moon, the sky, the claw trail and the UI.
2. **CC0 / openly licensed sources:** Kenney.nl (CC0) and OpenGameArt (check each file's license). Google Fonts (OFL): Creepster for display text, plus a clean sans-serif for UI. Sounds: generate effects with jsfxr/sfxr, or use CC0 sounds from Freesound.
3. **Student-made art:** drawings, photos, voice recordings of a panther growl or a "BOO!". This is the best option for the classroom. Build the asset pipeline so a student can drop in a PNG with a transparent background and register it in the config. Write down the exact sprite specs (size, transparent background, and how the halves are cut).
4. **AI-generated images:** acceptable for placeholders or with my sign-off. Note it in CREDITS.

School marks are off-limits until permission is confirmed (see section 2).

## 7. Students and maintainability

- Code should be readable by a motivated high-school student: clear names, small files, and comments that explain *why* where it isn't obvious.
- Write or refresh `README.md`: what the game is, how to run it locally, how to play, and the student git workflow (`git pull` first, small commits with your name in the message, then `git push`), plus how to add a new enemy sprite.
- Write a project `CLAUDE.md` that captures the durable context from this brief (event, identity, constraints, architecture, asset rules, privacy rules), so future sessions, including ones on the school computer, start fully informed. Keep it concise and point to the docs instead of duplicating them.
- Keep a `docs/student-tasks.md` list of good first tasks for students, for example: draw a new enemy, tune the spawn rates, design a prize-tier badge, record sound effects.

## 8. Phases and checkpoints

**Phase 0: orient and plan (do this first, then keep going).** Un-minify and read the code, run the game, and confirm the known problems. Give me a short orientation report (how the engine works, what to keep and what to replace, risks) and a phased plan with rough time estimates checked against the Oct 29 event-ready target. Ask me only the questions that block work. Likely questions: what the actual prizes are, what devices the booth will use, and whether we have school-logo permission. Use sensible, clearly labeled defaults for everything else and continue.

**Phase 1: event-ready core.** Readable modular code, responsive full-screen on all devices, unified pointer input, saved high score, full Panther Slash rebrand with every Fruit Ninja name and asset replaced, new title/menu/game-over screens, the claw blade, and the new color theme. → **Checkpoint:** show it working at phone, tablet and desktop sizes.

**Phase 2: winning.** Challenge mode, prize tiers and the prize screen, local leaderboard with initials, and staff/admin plus kiosk mode. → **Checkpoint.**

**Phase 3: polish.** Juice, sound, combos, power-ups, accessibility, and performance tuning on low-end devices. → **Checkpoint.**

**Later, only with my approval:** an online shared leaderboard, deploying to thinkinbits.site so visitors can play on their phones (propose how it fits into the site, and whether a GitHub Pages preview is useful before then), and frameworks such as Three.js.

At each checkpoint, report what changed, how you verified it (actually run it in a browser at several viewport sizes, test touch, and check the console for errors), what is still rough, and what's next.

## 9. Ground rules

- My standing rules apply: **ask before any commit, push, deploy, new external service or account, or deleting/moving files.** Group work into logical commits and propose each one with its message when ready.
- Don't add dependencies or services I haven't approved. Pin exact versions and vendor the files into `assets/` or `lib/`. Do not use CDN-only loading, because the game has to work offline.
- Never collect personal data from players.
- If something in this brief turns out to be wrong once you read the code, tell me and adjust. Don't silently work around it.

Start now with Phase 0.
