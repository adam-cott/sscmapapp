# Location Search — Build Plan

**Status:** Built 2026-09-28 (v2.1.0). Venue decisions: 3 roadside stores by University Place excluded via `scripts/venue-overrides.json`; Thanksgiving Point has no tagged stores (JCW's is on the campus but in its own building — still found by "Lehi").
**Goal:** Typing a city or venue ("American Fork", "UVU", "American Fork pizza") finds every deal honored at a store there — and the map, distance, and directions follow that store.

---

## Why
Search today only matches business name, deal text, valid-at text, and tags. "American Fork" misses chains like KFC whose deal says "All Utah Locations" but who have an American Fork store. Store addresses are now verified (pin audit, Sept 2026), so they can drive search.

## Core idea
When a search names a place, each matching deal becomes a **narrowed copy** whose `locations` are only its honoring stores in that place. Pins, "Nearest" distance, Directions, and "View on map" already run off `locations` (through `getMapFocusLocations`), so they follow with no per-screen changes. Clearing the search restores the full store lists. Copies keep the original `id`, so using a deal always records against the real deal; originals are never mutated.

---

## Matching rules

### Places
- **Cities:** built automatically from store addresses (`cityFromAddress` — the part before `UT 84xxx`). 47 today, all confirmed as real cities by Google in the pin audit. Nothing to maintain.
- **Venues:** UVU, BYU, University Place, Provo Towne Centre, The Shops at Riverwoods, Traverse Mountain (outlets), Thanksgiving Point, Fashion Place. Matched through a `venue` tag on each store (see Venue tagging).
- **Nicknames:** SLC → Salt Lake City, AF → American Fork, PG → Pleasant Grove, SF → Spanish Fork, EM → Eagle Mountain. (No SS.) **Only count when followed by a space**: "pg pizza" and "pg " match; "pg", "pgs" don't. A nickname match counts as a full city match.

### Full match (whole city/venue name, or nickname + space)
- The place can be anywhere in the query: "American Fork", "American Fork pizza", "pizza American Fork".
- Deals with an honoring store in that place are kept; any other words must also match (name, deal text, category label). No match → "no results" (no silent fallback to every deal in the city).
- Exact names only: "Salt Lake City" ≠ South Salt Lake; "West Jordan" ≠ South Jordan.

### Partial match (still typing)
- The query is a prefix of the **start** of a city/venue name, is **≥ 40%** of the name's length, and is **≥ 3 letters**. "Americ" → American Fork; "Pro" → Provo; "ork" and "Fork" → nothing.
- Several cities fit ("San" → Sandy, Santaquin): include all of them.
- Partial results are added **on top of** normal text results ("sand" shows sandwich deals *and* Sandy).

### Always
- Results = place matches **∪** plain text search of the whole query, so a brand containing a city ("Provo Beach") is never filtered away.
- A deal found by place → narrowed copy. A deal found only by plain text → full store list.
- Case and extra spaces don't matter.
- Deals with no stores (HiddenHunts.com, online-only) never match a place — deliberate.
- "Participating Locations" / "All locations" deals: every store counts (Adam: assume all participate unless told otherwise).

### Deals that name a venue in their valid-at text (e.g. Wendy's "Traverse Mountain")
They match that venue. Their narrowed copy is, in order, never empty:
1. honoring stores tagged for that venue;
2. else honoring stores in the venue's city (Traverse Mountain → Lehi);
3. else the full honoring list.

---

## Map
- Only the narrowed stores' pins show while a place search is active.
- **Auto-zoom only on a full match**, fit to the results' pins. Fires **once per place** — typing on from "American Fork" to "American Fork pizza" does not re-zoom or fight panning; it zooms again only when the matched place changes.
- No zoom on partial matches.
- Clearing the search returns the map to normal.

## Deal sheet
- Opened from a place search, the sheet looks up the deal by id in the **current search results first**, then the full data — so Directions stay on the searched city's store even after "Use".

---

## Venue tagging
- New `scripts/tag-venues.js`: for each store in the venue cities, asks Google Places whether it's **located inside** one of the venues (`containingPlaces`), and tags `"venue": "<name>"` on that store in `deals.json`. No guessing from street addresses.
- New `scripts/venue-overrides.json`: hand fixes (`add` / `remove` per venue, keyed by business + address). The script merges these in every run, so fixes survive yearly re-tagging.
- First run is a **dry run**: full list of tagged stores per venue for Adam to approve before `deals.json` is written.
- Added to CLAUDE.md "New Card Year" checklist next to the pin audit.

## Known limitation
Search uses the store's **mailing** city. A store whose mailing city differs from where people think it is (The Picklr "Lehi" has a Saratoga Springs address) won't match that city by address. Softened by the plain-text union (The Picklr's valid-at text says Lehi) and by venue tags. Not fixing with city-boundary data.

---

## Files
| File | Change |
|---|---|
| `src/utils/dealHelpers.js` | Place list, nickname map, query parsing, narrowed copies, new `filterDeals` |
| `src/hooks/useFilters.js` | Use new search; expose the matched place (for map zoom); category chip counts follow |
| `src/App.jsx` | Map zoom on full place match (once per place); deal sheet looks up current results first |
| `src/components/Map/MapView.jsx` | Only if needed for once-per-place zoom (reuse existing `FitBounds`) |
| `scripts/tag-venues.js`, `scripts/venue-overrides.json` | New — venue tagging |
| `src/data/deals.json` | `venue` tags on stores (after dry-run approval) |
| `src/utils/dealHelpers.test.js`, `src/data/deals.test.js` | Tests below |
| `CLAUDE.md` | Search rules + checklist step |

## Tests
- City search finds KFC through its American Fork store address.
- Crumbl (Orem-only deal) is **not** found for "American Fork".
- "American Fork pizza" and "pizza American Fork"; city + word that matches nothing → no results.
- Partials: "Americ" matches, "ork"/"Fork" don't, 2-letter queries don't, "San" matches Sandy + Santaquin.
- Salt Lake City vs South Salt Lake; West vs South Jordan.
- Nicknames: "pg pizza" matches, "pg" and "pgs" don't; "SS " does nothing.
- Brand containing a city ("Provo Beach") still found.
- Venue with zero tagged stores falls back per the rules; Wendy's found for "Traverse Mountain".
- Narrowed copies don't mutate the original deals; copies keep the original id.
- Case and extra whitespace.
- Data: no city name contains digits or "UT".

## Order of work
1. Search logic + tests (cities and nicknames work immediately).
2. Map zoom + deal sheet lookup.
3. Venue tagging script → dry run → Adam approves → write tags.
4. Lint, tests, build, push; update CLAUDE.md.
