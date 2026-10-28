# Panther Slash 🐾🎃

A Halloween slicing game made for the **Good Hope Country Day School Boo Bash**
(#BooBash #PantherPride #SpookySeason). Swipe with your panther claws to slice
pumpkins, ghosts, bats and other spooks. Don't hit the skull bombs!

It runs in any modern web browser on laptops, tablets and phones, and needs no
internet once it's loaded.

## Run it on your computer

The game is a folder of plain files with no build step. You do need a small
local web server, because browsers won't load JavaScript modules from a file
you just double-click.

```bash
cd panther-slash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in Chrome, Edge, Firefox or Safari.
(If port 8000 is busy, use another number, like 8123.)

No Python? In VS Code, install the "Live Server" extension and click
**Go Live**.

## How to play

- **Swipe** across enemies to slice them. A mouse, a finger or a pen all work.
- **Boo Bash Challenge:** 60 seconds. Score as much as you can. Skull bombs
  cost you points. This is the prize mode.
- **Classic:** 3 lives. Every enemy that falls past you costs a paw. Slice a
  skull bomb and it's over.
- **Combos:** slice 3 or more in one quick swipe for bonus points.
- **Critical slices** randomly score double.
- **The Golden Panther** is rare and worth 100 points. Don't let it get away!
- **The Frost Orb** (a snowflake ball) slows everything down for 4 seconds,
  but the clock keeps ticking.
- **PANTHER FRENZY!** In the last 10 seconds of a Challenge round, enemies
  come twice as fast and there are no bombs. Go wild!

## What's in the folder

```
index.html            the page: the game canvas plus the menus
manifest.webmanifest  lets phones "Add to Home Screen" and play full screen
src/
  config.js           ⭐ all the numbers and colors you can tweak
  main.js             connects everything; screen changes
  core/               game rules (no drawing, so you can test them)
    game.js           throwing, slicing, scoring, lives, timer
    prizes.js         prize tiers and verification codes
    leaderboard.js    ranking scores, checking initials
    geometry.js       math helpers
  reactions.js        game events → effects and sounds
  render/             drawing
    art.js            enemies drawn with code
    background.js     the night scene
    renderer.js       draws each frame, including the claw swipe
    effects.js        halves, juice, splats, popups, shake
    sprites.js        loads enemy pictures
  input/pointer.js    mouse, touch and pen → blade swipes
  audio/sound.js      sound effects made with code
  storage/            saves scores, prizes and staff settings on this device
  ui/                 menus, score display, prize, leaderboard, staff mode
  styles.css          how the menus look
assets/               fonts, icons, and any picture files
tests/                tests for the game rules
docs/                 plan, booth guide, student tasks, proposals
```

## Change the game

Open **`src/config.js`**. Every setting has a comment. Try changing the
`gravity`, how often bombs appear, the points per enemy, or the round length.
Save the file and reload the browser.

The game also works **offline**: on a real website it saves itself after the
first visit (see `sw.js`). That's switched off on `localhost`, so your changes
always show up when you refresh.

Tip: add `?debug` to the address (`http://localhost:8000/?debug`), open
the browser console (F12), and type `pantherSlash.game` while playing to look
inside the game.

## Add a new enemy (your own drawing!)

1. **Make the picture.**
   - PNG with a **transparent background** (no white box around it).
   - **Square**, ideally **256 × 256 pixels** (anything from 128 to 512 works).
   - The creature is **centered** and **fills the square**, with a small gap at
     the edges. It should be upright and facing you.
   - Give it a **dark outline**. The sky is dark purple, so dark creatures
     disappear without one.
   - Draw it **whole**. Don't cut it in half yourself: the game slices it along
     the exact line of each swipe.
   - Keep the file under about 200 KB.
2. **Name it** in lowercase with dashes, like `zombie-hand.png`, and put it in
   `assets/enemies/` (create the folder if it isn't there yet).
3. **Add it to `ENEMIES`** in `src/config.js`:
   ```js
   { id: 'zombie-hand', art: 'assets/enemies/zombie-hand.png', radius: 42, points: 15, juice: '#7CFC00', weight: 2 },
   ```
   - `radius`: the hit size. 38–46 matches the other enemies.
   - `juice`: the splash color when it's sliced.
   - `weight`: how often it shows up compared to the others.
4. **Credit yourself** in `assets/CREDITS.md`.
5. Reload. If the picture can't be found, the game shows a pumpkin instead and
   prints a warning in the console, so check the console if your enemy is
   missing.

## Prizes, leaderboard and staff mode

- **Boo Bash Challenge** rounds can win a prize tier. The prize screen shows
  a verification code that booth staff can check. See
  [`docs/booth-guide.md`](docs/booth-guide.md).
- The **leaderboard** is saved on each device: top 10 for today and for all
  time, with 3-letter initials only.
- **Staff mode:** tap the moon 5 times on the title screen, then enter the
  PIN. From there staff can set the round length, prize scores, station letter,
  kiosk mode and PIN, check prize codes, and reset the board.

## Run the tests

The game rules have automatic tests. If you have Node.js installed:

```bash
node --test
```

Run them after you change anything in `src/core/`.

## Student git workflow

1. **Pull first**, every time you sit down: `git pull`
2. Make **one small change** and test it in the browser.
3. **Commit** with your name in the message:
   `git commit -am "Add zombie hand enemy (Jada)"`
4. **Push:** `git push`
5. If `git pull` reports a conflict, stop and ask your teacher before going on.

Ideas for what to work on are in [`docs/student-tasks.md`](docs/student-tasks.md).

## Rules we always follow

- **No personal data.** The game never asks for names, emails or photos of
  players. The leaderboard uses three-letter initials only.
- **Only use art, sound and fonts we're allowed to use**, and credit them in
  `assets/CREDITS.md`. Things you made yourself are best.
- **No school logo** until the school says we can use it.
