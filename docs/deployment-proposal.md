# Proposal: hosting Panther Slash (needs approval)

**Status:** proposal only. Nothing has been deployed, and no hosting or
GitHub settings have been changed.

## What gets deployed

The game is a self-contained static folder. Deploy only these:

```
index.html
manifest.webmanifest
sw.js
src/
assets/
```

Leave out `tests/`, `docs/`, `CLAUDE.md` and `README.md`; they're harmless if
included, but players don't need them.

Every path is relative, so the folder works at any URL, for example
`https://thinkinbits.site/panther-slash/`.

## Option A: GitHub Pages preview (recommended first)

This repo is public and named `panther-slash`, so GitHub Pages would serve it
at `https://<github-user>.github.io/panther-slash/`. That's the **same
kind of subfolder** it will live in on thinkinbits.site, which makes it a
realistic test.

- Free, HTTPS (required for the offline cache), nothing to maintain.
- Turn it on in the repo's Settings → Pages → "Deploy from a branch". That's a
  GitHub setting change, so it needs your approval.
- Good for: testing on phones before the event, and letting students share
  their changes.

## Option B: thinkinbits.site/panther-slash/

Copy the five items above into a `panther-slash/` folder in the site's
static files and deploy the site as usual. I haven't looked at the website's
repo. To plan the exact steps I'd need to know how the site is built
(plain static, Next.js, Astro, ...) and where its static files live.

Things to check whichever way the site is built:
- **HTTPS** must be on (the offline cache only works on HTTPS).
- **`sw.js` should not be cached for long** by the server or CDN
  (`Cache-Control: no-cache` for that one file is ideal). Otherwise updates
  can take a day to reach players. Everything else can be cached normally.
- The site's own service worker, if it has one, must not also control
  `/panther-slash/`.

## Visitors playing on their own phones

- Print a **QR code** with the game's URL for the booth table.
- Recommended: **prizes only on booth devices**. The local leaderboard on a
  phone is only that phone's, and prize claims can't be checked across
  devices.
- Phones on bad event Wi-Fi: once loaded, the offline cache keeps it working.

## After the event

The same deploy keeps working for students as a portfolio piece. Each `git
push` to the deployed branch updates the game, and players get it on their
next visit.
