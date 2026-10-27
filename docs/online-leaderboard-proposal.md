# Proposal: shared online leaderboard (not built, needs approval)

**Status:** proposal only. Nothing here is built or set up. It needs Amali's
approval before any account, service or code is added.

**Recommendation:** don't build it for Boo Bash 2026. Event Wi-Fi is
unreliable, the local per-device boards already work offline, and every new
service is one more thing that can fail on the night. Revisit afterwards as a
student project.

## If we do build it later

**Service:** Supabase free tier (Postgres + auto REST API + row-level
security). Firebase Firestore is a fine alternative. Supabase's SQL makes
moderation queries and a student lesson on databases easier.

- **Cost:** $0 on the free tier (500 MB database, more than enough).
  Free projects pause after a week of no use and wake on the next request.
- **Keys:** only the public "anon" key ships in the game. Row-level security
  allows **insert** and **select** on one table and nothing else, so no
  update or delete from the browser.

**Data stored:** `initials` (3 letters), `score`, `mode`, `station`, `round`,
`created_at`. **Nothing else**: no names, emails, device IDs, IP logging in
our table, or cookies. That matters because most players are minors
(COPPA-style data minimisation).

**Moderation of initials:**
- The same block list the game uses (`LEADERBOARD.blockedInitials`), enforced
  again in the database with a check constraint, so it can't be bypassed.
- A `hidden` column staff can set from the Supabase dashboard to remove an
  entry without deleting it.

**Anti-cheat basics** (enough for a school game, not a bank):
- Database check constraints: score from 0 to a sane maximum, initials
  `^[A-Z]{3}$`, mode in (`challenge`, `classic`).
- Accept only Challenge scores that carry a valid prize-style verification
  code (station, round, score, date and event word), checked by a small
  Supabase Edge Function that holds the event word as a secret.
- Rate limit per station: an Edge Function rejects more than about 1
  submission every 30 seconds per station.
- Booth devices submit; phones that aren't booth devices can be view-only.

**Offline-first behaviour:** the game keeps saving locally as it does now.
Online submission is queued and retried, and the local board is always the
fallback. The game never waits on the network to start or finish a round.

**Rough effort:** ~4–6 hours including the Edge Function, policies and tests.
