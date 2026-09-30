# Handoff — Starving Student Card Map App

_Written 2026-09-30, moving from Claude Code in VS Code to the Claude Code desktop app. Read this, then `CLAUDE.md` (the full project rules)._

## Where things stand
- **Live:** v2.1.4 (commit `fdf880f`), `master` = production. Vercel auto-deploys on push. Working tree clean.
- **Data:** 2026–27 card (expires Oct 1, 2027). 439 deals · 214 businesses · 479 map pins (stores that honor each deal). Every deal has a pin except HiddenHunts.com (online-only, on purpose) and SSCDeals.com (hidden).
- **Checks:** `npx vitest run` (37 tests) · `npx eslint .` (0 problems — keep it there) · `npm run build`.
- **To-do list:** empty. Waiting on Adam's phone check of v2.1.4 (below).

## What was done in this chat (Sept 24–30, 2026)
- **v2.0.0 — card-year switch** to 2026–27: new converter `scripts/import-card.js`, usage/favorites reset via `CARD_YEAR`, Featured cleared (Adam re-picks in Admin tab).
- **Deal text cleanup:** "Valid at" duplicate removed, "Details:" label, abbreviations and day names spelled out, value labels fixed ("Buy 1 Get 1 50% Off", "Buy 2 Get 1 Free", "Kids Eat Free").
- **Logos:** every business has one (hand-picked images in `scripts/manual-logos/`).
- **Full pin audit:** all pins checked against Google — 53 wrong-address pins fixed, 9 closed stores moved to `closedLocations`, 25 pins snapped onto the building, KFC/Oil Rig/Sub Zero/Wendy's/Guru's UVU stores added. Final: 670/671 on the building. Reusable: `scripts/audit-pins.js`.
- **Code cleanup:** 63 lint problems → 0 (intentional exceptions are commented).
- **v2.1.0 — location search:** type a city, venue (UVU, BYU, University Place, Provo Towne Centre, Riverwoods, Traverse Mountain, Thanksgiving Point, Fashion Place) or nickname ("af ", "pg ", "slc ", "sf ", "em " — only with a trailing space; no "SS"). Spec: `specs/location-search-plan.md`. Venue tags: `scripts/tag-venues.js` + `scripts/venue-overrides.json`.
- **v2.1.3–2.1.4 fixes:** map chip counts skip pinless deals; map search no longer deletes the first letter.

## Adam's decisions to keep following
- **Restriction wording:** "All Utah County" = Utah County cities only. "Participating Locations" / "All Wasatch Front" = every store in Utah, Salt Lake, Davis, Weber counties (to Ogden) **plus Heber City and Park City** (not Tooele/Nephi), plus any named city. "All Locations" = every store. (Also in CLAUDE.md.)
- **Any `deals.json` change:** dry run + before/after list first, wait for Adam's OK.
- **Versions:** patch bump per push; minor for features (2.1.0); major for card-year switches.
- **Every push:** bump `package.json` + `src/constants/changelog.js` (shown to users — keep it plain and accurate).
- **Explain in plain English**, show proof for every "done", ask before bigger changes, never use browser testing without asking.
- Provo Canyon Adventures' pin (on US-189 near their turnoff) is "good enough" — don't raise it again.

## Waiting on Adam
1. Phone check of v2.1.4: Map tab search "Lehi" typed slowly (should stick and zoom), category chips on the map, "UVU" shows Guru's at its UVU café.
2. Re-pick Featured deals in the Admin tab.

## Parked (only if Adam asks)
- Logo padding/cropping list (Adam was going to send one).
- Home-tab scroll jank (needs a phone screen recording).
- `STATUS.md` is stale (last updated for v1.0.36) — this file and CLAUDE.md are current.

## Gotchas
- Google Maps key is in the repo's `.env` (gitignored, never commit or print it). A local hook blocks any shell command that *mentions* `.env` — scripts load it with `process.loadEnvFile`, so run them normally (`node scripts/audit-pins.js`).
- Claude's saved memory for this project lived under the `my-new-app` working folder. If the desktop app opens `starvingstudentcardmapapp` directly, that memory won't load automatically — this file and CLAUDE.md cover what matters.
- Next card year: follow CLAUDE.md "New Card Year" steps 1–9 (includes the pin audit and venue tagging).
