# Starving Student Card Map App

## What This Is
A mobile-first PWA for Utah County college students. Turns the physical Starving Student Discount Card into an interactive deal finder — 439 deals, 214 businesses, 710 map pins (2026–27 card). Users browse via Home tab carousels/search or the Map tab's pins (Filter menu + Near Me), filter by category, and track deal usage per card.

**Live:** Vercel via GitHub auto-deploy (`master` branch)
**Repo:** https://github.com/adam-cott/sscmapapp
**Dev:** `npm run dev` → http://localhost:5173

---

## Tech Stack
| Layer | Choice |
|---|---|
| Framework | Vite + React 19 |
| Map | react-leaflet v5 + react-leaflet-cluster v4 + Leaflet 1.9 |
| Styling | Tailwind CSS v3, Sora (headings), DM Sans (body) |
| Icons | lucide-react |
| Data | Static `src/data/deals.json` — no backend |
| Persistence | localStorage + Firestore, keyed by card year (`CARD_YEAR` in `src/constants/storageKeys.js`) |
| PWA | vite-plugin-pwa (generateSW) — installable iOS/Android |
| Deploy | Vercel, auto-deploy on push to master |

---

## Critical Rules
- **Leaflet CSS must import before Tailwind** in `src/index.css` — reversing breaks map tiles
- **Never use default Leaflet PNG markers** — use `L.divIcon()` always (Vite asset bug)
- **Never use `CircleMarker` for location dot** — lives in SVG pane, jitters on zoom; use `Marker` + `L.divIcon`
- **`deals.json` is the source of truth** — all scripts write to `src/data/deals.json`
- **Do not add a manual service worker** — conflicts with vite-plugin-pwa generated one
- **Never commit `dist/` or `node_modules/`** — gitignored

---

## Styling Gotchas
- **Percentage padding resolves against the parent's content *width*, not the element's own size** (even for `padding-top`/`padding-bottom`). This cost real debugging time on `BusinessLogo.jsx`: `padding: '10%'` collapsed images to 0x0 on the 56px list tile and ate a third of the 84px Home tile. On small fixed-size elements, use fixed pixel padding instead.
- Same family of mistake: **don't use percentage heights to force a square** — but CSS `aspect-ratio` isn't the fix either. Once a real `<img>` loads inside it, Chrome lets the image's own intrinsic ratio win over the declared `aspect-ratio`, silently forcing the box back to the image's shape (reproduced on the live production page). Use the padding-top-percentage trick instead: it always resolves against the box's own width, so it can't be hijacked by a loaded image (see `BusinessLogo.jsx`).
- `BusinessLogo`'s alignment is controlled by its `align` prop (defaults to `flex-start` for DealCard rows, `center` for HomeCard) — don't hardcode `alignSelf` inside the component.
- Logos use `object-fit: contain`, not `cover` — they should never be cropped.
- **Logo tiles are iPhone-style squircles** (Home cards and deal lists; map pins stay round). `border-radius` can't draw one, so `BusinessLogo.jsx` masks each layer with an SVG superellipse. A mask clips `box-shadow` and `border` too, so the shadow is a `filter: drop-shadow` on the outer box and the hairline border is a squircle "frame" layer with the tile inset 1px. List tiles use `padding={0}` — any padding shows a full-color logo as a square inside a white squircle.
- **Overlays on the desktop phone panel:** on desktop the app is a centered 480px panel (`--app-panel-width` in `App.css`). A `position: fixed` overlay must use `left: 50%; transform: translateX(-50%); max-width: var(--app-panel-width)` (see `RedemptionScreen.jsx`, `MapFilterMenu.jsx`), not `inset: 0`, or it covers the whole browser window.
- **Debugging rule:** if a style change doesn't appear to take effect, verify which file actually renders the element before editing again — don't assume and re-edit blind.
- **A thin accent bar can't match a panel's corner radius by giving it the same `border-radius` value.** CSS clamps a box's radius to half its own dimension, so a 4px-tall bar's vertical radius silently clamps to 2px regardless of what you set — it'll never visually match a 16-20px panel curve, leaving a sliver. The working pattern (see `DealModal.jsx`, `LocationPrompt.jsx`, `UndoToast.jsx`): `overflow: hidden` + `border-radius` on the panel, no radius on the bar — the bar just gets clipped to whatever shape the panel is.
- **A static (`position: static`, the default) element always paints BEHIND any sibling with `position: absolute`/`relative`/etc., even with no `z-index` set and even if the static element comes later in the DOM.** This isn't a bug in any one component, it's plain CSS stacking order. It cost real damage once: the Map tab's `Header` (app title, deal-count pill, a map/list toggle, a Reset button) was a static element sitting before `position: absolute; inset: 0` map/list panels — so the map's opaque tiles painted directly over the entire header strip, on every screen size, for as long as that layout existed. The toggle and Reset button were completely unclickable and nobody noticed because nothing looked visually "broken" — the map just filled the screen like it was supposed to. When overlaying `position: absolute` content near a static header/toolbar, either give the static element `position: relative` (or a real stacking context) too, or don't assume "it renders in the JSX before the overlay" means "it renders on top."

---

## Project Structure (key files)
```
src/
  data/deals.json              # 440 deals (439 active), all with coords + locations[]
  components/
    Sidebar/                   # Sidebar = Map and Home top bar (SearchBar + Near Me / Filter buttons); MapFilterMenu = full-screen category grid
    Map/MapView.jsx            # Map + clustering + spiderfy
    Map/BusinessMarker.jsx     # Pins — React.memo wrapped
    ListView/                  # DealCard list
    Modal/DealModal.jsx        # Desktop deal detail
    BottomSheet/               # Mobile deal detail
    BottomNav/                 # 5-tab bottom navigation
    Tabs/                      # HomeTab, FavesTab, RewardsTab, SettingsTab
    LocationPicker/            # Multi-deal picker per business
    UI/                        # DealDetails (shared deal sheet/popup body), FaveButton, BusinessLogo, Toast, etc.
  hooks/
    useDeals.js                # Merges deals + localStorage usage
    useFilters.js              # Search + category filter + categoryCounts
    useGeolocation.js          # Manual-trigger GPS; exposes coords, permissionDenied, hasRequested
  utils/
    categoryColors.js          # 7 category color/label map
    dealHelpers.js             # getDealUsageState(), filterDeals(), getMapFocusLocations()
    markerIcons.js             # createMarkerIcon() — module-level cache (42 max entries)
  App.jsx                      # Root state + layout
  index.css                    # Global styles (Leaflet CSS first!)
```

---

## Data Model (deals.json)
- `locations[]` is canonical for map pins — `lat`/`lng` at top level is just primary location
- `maxUses: null` = unlimited
- `contact.phone` stored per-location in `locations[]`, not at deal level
- `contact.website` is null for all businesses — intentionally left empty for now. Do not ask about this or treat it as a gap to fix. It is a deliberate decision to revisit later.
- Python geocode scripts read from `C:\Users\adamb\Downloads\starving_student_businesses.csv` (hardcoded path — keep that file in place)
- **Stats:** 439 deals · 214 businesses · 710 pins (stores that honor each deal, counted once per business) · every deal has at least one pin except online-only HiddenHunts.com (on purpose) and SSCDeals.com (hidden)
- **Closed businesses/locations are hidden, not deleted.** A whole business that's gone: set `"active": false` (filtered once at the top of `App.jsx`) plus `"closedReason": "Permanently closed"`. Just one location of a multi-location business closed: move it out of `locations[]` into `closedLocations[]` on each of that business's deals, with its own `closedReason` — the app never reads `closedLocations`, so it's invisible but easy to restore. (Examples: The Yard Milkshake Bar, Sub Zero Ice Cream's downtown Provo store.)
- **Keep `locationRestriction` wording standardized** — full city names (never "EM", "SF", "PG", "WJ", "Mtn"), "&" between places (comma-separated for 3+: "Orem, Vineyard, Eagle Mountain & Santaquin"), "All ..." for broad scopes ("All Locations", "All Utah County"), and "excluding" for exclusions. The matcher parses this text, so odd wording silently changes which pins show. `locationRestriction` is the only place the restriction lives — `deal.description` holds just the extra conditions ("Carryout Only"), never a "Valid at:" copy; the deal sheet shows the restriction in its own info row. If a restriction has no extra conditions, `description` is `""` and the sheet hides the description paragraph.
- **`deals.json` edits for data cleanup are allowed**, but only via a dry run: write the cleaned data to a separate file (scratchpad, not the repo), produce a report flagging anything unexpected, show before/after examples, and get Adam's explicit approval before overwriting `src/data/deals.json`.
- **`locationRestriction` isn't reflected in `locations[]`** — a restricted deal's `locations[]` still lists every physical location for the business, not just the ones that honor that specific deal. Never read `deal.locations` directly when the result needs to be restriction-aware (map pins, nearest-sort, "Get Directions"). Use `getMapFocusLocations(deal)` (or `getDirectionsLocation(deal, userCoords)` for a single target) from `dealHelpers.js` instead — see `reports/map-focus-restrictions-report.md` for how that matching was derived and verified.
- **`LocationPicker.jsx` overrides `deal.lat`/`deal.lng`/`deal.address`** with a specific location when a multi-deal business is opened (from both the Map tab and Home) — and that override location is a business-wide "nearest to user" pick that ignores the specific deal's own `locationRestriction`. Nothing currently reads `deal.address`/`deal.lat`/`deal.lng` after that override (verified by grep), but if something new needs to, use `getMapFocusLocations()`/`getDirectionsLocation()` instead of trusting those fields directly.

---

## New Card Year (import process — used for the 2026–27 card, Sept 2026)
The card runs Oct 1 → Oct 1. Each year the whole deal list is replaced from a new transcription; do it as a hard switch.

**Google API calls cost Adam real money** — the Sept 2026 audit, venue tagging and store sweeps together went past Google's free allowance and he was charged ~$12. Every step below that hits Google (4, 7, 9, and any ad-hoc lookup) needs Adam's explicit OK first, with the request count, fields requested, and estimated cost stated up front. Requesting phone numbers puts a request in Google's pricier tier — leave them out unless needed. Adam has a daily quota cap set in Google Cloud; if a script hits it, stop and tell him rather than retrying.
1. **Transcribe** the card (separate claude.ai chat, from photos) into a CSV with columns `business,category,title,value,conditions,valid_at,max_uses,address,photo,note` — text kept **raw, exactly as printed** (the converter does all expanding/cleanup). Save it plus its Unsure list in `data-archive/`.
2. **Archive** last year's `src/data/deals.json` as `data-archive/deals-YYYY-YY.json` (the converter reads last year from here, never from `src/data`).
3. **Update `scripts/import-card.js`** constants (file names, `ID_PREFIX`, `EXPIRES`), `RENAMES`/`MERGED` (ask Adam which dropped/new pairs are the same business), and add `OVERRIDES` for lines the parser gets wrong. It matches businesses ignoring punctuation and carries over `locations[]`, `closedLocations[]`, contact info and logos.
4. `node scripts/import-card.js` (dry run) → `node scripts/lookup-new-locations.js` (Google Places for new businesses; needs `GOOGLE_MAPS_API_KEY` in `.env`; ~60 requests) → `node scripts/import-card.js` again. Review `reports/card-import-YYYY-YY.md` (every card line → headline / valid at / details / value / uses, plus flags). If re-running the lookup, delete its output file first.
5. **Logos:** add the new businesses to `scripts/domains-output.json`, run `node scripts/fetch-logos.js --live`, then eyeball them — about 1 in 6 auto-fetched logos is wrong (photos, badges, blank). Delete bad ones; a missing logo shows a placeholder icon. Hand-picked files go in `scripts/manual-logos/` — they beat every scraped source, so the ~70 logos polished in Nov 2026 survive re-runs. Only run `--force` on specific businesses (`--only=`), never everything. See "Logos" below for fixing individual logos.
6. `DEALS_FILE=reports/card-import-YYYY-YY.preview.json npx vitest run` must pass (`src/data/deals.test.js`: every deal has a pin, no abbreviations, etc.).
7. **Pin audit:** `DEALS_FILE=reports/card-import-YYYY-YY.preview.json node scripts/audit-pins.js` (~750 Google requests) → read `reports/pin-audit.md`. Continuing businesses keep last year's pins, so wrong or closed stores carry over unless this catches them (the Sept 2026 audit found 53 wrong-address pins and 9 closed stores). Fix "Misplaced" and "Closed" with a dry run + Adam's approval; `--snap` moves 50–150 m near-misses onto Google's spot.
8. **Switch:** `node scripts/import-card.js --write`, bump `CARD_YEAR` in `src/constants/storageKeys.js` (resets everyone's usage/history/favorites; old data stays under the old keys/fields, never deleted), update counts (About screen, README, this file), push. Old Featured picks stop matching any deal and vanish from Home on their own; Adam re-picks in the Admin tab.
9. **Venue tags:** `node scripts/tag-venues.js` (dry run, ~300 Google requests) → show Adam `reports/venue-tags.md` → `--write`. Tags stores Google says are *inside* UVU, BYU, and the malls, for location search. Hand fixes go in `scripts/venue-overrides.json` (survive re-runs); Adam's rule: roadside stores near a mall don't count.

Parser rules worth knowing: a trailing location on the card line becomes `locationRestriction` (lookup table `TAILS`); text after the offer that looks like a condition becomes `deal.description` ("Details:"); headline = the offer. When one card line has a separate bubble per item (CLAS Ropes Course), split it into one deal per item via an `OVERRIDES` array. When a store is branded with one city but its address is in another (The Picklr "Lehi" in Saratoga Springs), write the restriction as "Lehi/Saratoga Springs" so the matcher finds it.

---

## Restriction wording (Adam's rules)
- "All Utah County" = Utah County cities only (plus any city named with it).
- "Participating Locations" (alone or after named cities) and "All Wasatch Front" = every Wasatch Front store — Utah, Salt Lake, Davis, Weber counties up to Pleasant View (the northern edge) — plus named cities. Heber City and Park City count too; Tooele and Nephi don't. Assume all stores participate unless told otherwise.
- Chains with these deals need every Wasatch Front store in `locations[]`, not just Utah County ones — the pin audit only checks stores we already have, so missing stores go unnoticed. Leave out stores that aren't their own building (Pizza Hut Express counters in theaters/Target/gas stations), BYU campus food (Wendy's, Jamba — they don't take coupons), and Lagoon.
- "All Locations" / "All Utah Locations" / "All Northern Utah" = every store.
- No location on the card = every store too (Adam, Sept 2026). So chains with "All ..." or blank deals also need every Wasatch Front store (up to Pleasant View) in `locations[]` — the Sept 30, 2026 sweep added ~100 (Wingstop, Carl's Jr, Sonic, etc.).

## Location Search
Typing a city, venue, or nickname finds deals honored at a store there; full rules in `specs/location-search-plan.md`, logic in `filterDeals` / `parsePlaceQuery` (`src/utils/dealHelpers.js`).
- Cities come from store addresses (no list to maintain); venues are `SEARCH_VENUES` + the `venue` tag on stores; nicknames SLC/AF/PG/SF/EM count only when followed by a space. No "SS" (Adam).
- A deal found by place is a **copy** whose `locations` are only its honoring stores there (same id), so pins, distance, and Directions follow. Never mutate the original.
- Partial names match from the start of the name (≥40% and 3+ letters) and add to normal text results. Only full matches zoom the map, once per place (`fitKey`).
- Results always include plain text matches of the whole query (brands like "Provo Beach"); text search reads only the "valid at" part of a restriction, not "excluding …".

## Map Logic
- `FALLBACK_COORDS`: coords shared by 8+ different businesses are excluded from map (city-level geocoding fallbacks). Threshold = 8.
- Pins grouped by `businessName + lat + lng` → clustered via MarkerClusterGroup
- Multi-deal pins show count badge → tap opens LocationPicker → then deal detail
- Clusters: `.ssc-cluster` CSS, 3 tiers (sm/md/lg), SSC blue (`#0170B9`)
- AutoSpiderfy at zoom 19; `removeOutsideVisibleBounds={false}` keeps spider open on pan
- Default center: Provo `[40.2468, -111.6490]`, zoom 13

---

- **Map tab top bar (v2.2.0):** search, then **Near Me** and **Filter** buttons. Filter opens `MapFilterMenu` (7 category cards, multi-select, Clear all, Back to map); the button shows the category name in its color when one is picked, "Filter · N" for several. **Near Me** is a toggle: asks for location if needed (shows "Turn on location to use Near Me" if that fails), zooms to a 3-mile circle (`NEAR_ME_MILES` in `dealHelpers.js`), and fades pins outside it to 50%. A cluster bubble fades only if *every* pin in it is far; the cluster group remounts on toggle so bubbles redraw. Priority for the map's auto-zoom: "View on map" focus > place search > Near Me. **Home (v2.4.0)** uses the same bar: there Near Me turns Home into a list of deals with an honoring store within 3 miles, nearest first ("Within 3 miles" label), and the menu says "Back to deals". Switching tabs, Home's back arrow, re-tapping Home, or the phone's back button reset search, Filter and Near Me together (`resetFilters` in `App.jsx`).

## Navigation (Bottom Nav — 5 tabs)
`home` · `map` · `faves` · `rewards` · `settings`

## Rewards Tab — Est. Savings
The "Est. Savings" stat card has been intentionally removed from the Rewards tab for now. The plan is to add a `dealValue` field to each deal in `deals.json` and compute savings from `usageLog`. The code scaffold was: `usageLog.reduce((sum, e) => sum + (dealById[e.dealId]?.deal?.dealValue ?? 0), 0)`. Do not re-add the placeholder "coming soon" UI — only ship it when real `dealValue` data exists.

---

## Performance
- `BusinessMarker` wrapped in `React.memo` — avoids re-rendering all 500+ pins on modal open
- `handleSelectDeal`, `handleSelectLocation` wrapped in `useCallback(fn, [])` in App.jsx
- `eventHandlers` memoized inside BusinessMarker — prevents Leaflet rebinding on every render
- Icon cache in `markerIcons.js` — keyed by `category:status:isSelected`

---

## Common Commands
```bash
npm run dev          # Start dev server (in the desktop app: preview "dev" from .claude/launch.json)
npm run build        # Production build
npm test             # Run Vitest tests (or `npx vitest run` for a single pass)
npx eslint .         # Lint — currently 0 problems; keep it there

# Push to deploy
git add -A && git commit -m "..." && git push
```

---

## Push Workflow (REQUIRED — do this every time before pushing)
1. **Bump the patch version** in `package.json` (e.g. `1.0.3` → `1.0.4`) — minor for new features (`2.1.0`), major for card-year switches (`2.0.0`)
2. **Update `src/constants/changelog.js`** — set `version` to match and write a short, friendly, user-facing `description` of what changed (not a commit message — something a student would actually want to read)
3. Then commit and push as normal

This keeps the About screen version and What's New section accurate without any manual effort from the user.

---

## Gotchas
- The Google Maps key lives in the repo's `.env` (gitignored — never commit or print it). A local hook blocks any shell command that *mentions* `.env`; scripts load it with `process.loadEnvFile`, so just run them normally (`node scripts/audit-pins.js`).
- Provo Canyon Adventures' pin (on US-189 near their turnoff) is "good enough" — don't raise it again.
- Marnell's Country Dance's pin (480 N 900 E, Provo — just north of Vasa Fitness) is correct; Adam has seen it in person. Their website says "488 N 800 E", which is wrong — don't move the pin to match it.

## Logos
Every logo is a 512×512 PNG in `public/logos/<slug>.png` (slug = `slugify(name)`), shown in a squircle. In Nov 2026 Adam went category by category and ~70 were fixed (v2.2.3, v2.2.4). Workflow for a logo Adam flags:
1. Look at the file. Common problems: a colored band letterboxed between white bars, a tiny mark with lots of padding, a mark cut off at the edge, a photo or banner instead of a logo, white artwork on a transparent background (vanishes on white).
2. Re-frame locally: `node scripts/reframe-logos.js <scratchDir> '<spec>'` (fit-to-background-color, zoom, or banner crop — see the script header), then `node scripts/logo-preview.js <sheet.png> before.png after.png …` and show Adam the squircle before/after sheet.
3. If the file itself is bad, find a better source: the business's own website header logo, or its App Store icon via Apple's free search (`https://itunes.apple.com/search?term=<name>&entity=software&country=us` → `artworkUrl512`). **Ask Adam before downloading** (filename, source, size). White-on-transparent art goes on a dark slate (`#1f2937`) or its brand color.
4. After Adam OKs: copy the final file into **both** `public/logos/` and `scripts/manual-logos/` (remove any older `.jpg`/`.avif` of the same slug there), commit per category, push with the patch bump.

Adam's logo decisions: Bahama Buck's and Voltage eBike use icon-only marks (snow cone, blue "V") on purpose — the name shows beside the logo. Zipline Utah uses the **Utah Adventure Park** logo (that's what ziplineutah.com shows). Carrabba's image is fine as is (its big cropped "C" is the design). The Place Pizza has no square logo (its App Store icon is the same banner); it's the banner full-width on black, per Adam. El Pollo Loco and Cinnabon fill the tile with their own circle color; Thai Evergreen, Bajio and Game Grid sit on black/dark navy. Craving's Bistro (stacked heart + wordmark) and Cravings Alisha's Cupcakes (wordmark recolored brand brown) come from their own sites. Brazuca Pizza's only source art crops the last "A" — needs a better image from Adam.

## Juice (v2.3.0 — Adam wants "polished & subtle", haptics only at key moments)
Built one step per commit so each can be reverted alone: `.press` tap squish (`index.css`; apply to cards/main buttons, not full-width rows), bottom-nav sliding highlight + icon pop (`BottomNav.jsx` — every tab renders its own BottomNav, so the highlight's last spot is a module variable), `FaveButton.jsx` heart pop/burst/15ms buzz, Rewards count-up + Places Visited, and 5 Rewards badges (`BADGES` in `RewardsTab.jsx`; seen ones in `ssc_badges_seen_<year>`, so newly earned ones shine + buzz once). Every animation is off under prefers-reduced-motion. Vibration only works on Android. The test account has never used a deal, so its Rewards tab only shows the empty state — check badge logic with a throwaway render test instead of redeeming.

## Where things stand (Nov 9, 2026)
- **Live:** v2.4.5 on `master`. The Nov 2026 code review is in `reports/code-review-2026-11.md` (kept out of git; the repo is public). All four planned batches of its fixes are shipped (v2.4.2–2.4.5). Still open in the report if Adam asks: M5, M6, M9, M12 and deleting the risky leftover scripts. Adam phone-checked through v2.2.7 (logos, Map buttons) and tried the v2.3.0 fave heart before release; a phone check of the rest of v2.3.0 is still his to do.
- Recent releases: v2.1.5–2.1.11 data fixes (MTECH Lehi pin, Wasatch Front store sweep — ~230 stores added, Chubby's Cafe, Marnell's pin), v2.2.0 Map Filter menu + Near Me, v2.2.2 squircle logos, v2.2.3–2.2.4 logo polish, v2.2.5 GetOut/Domino's/The Place Pizza logos + PNG home-screen icons (`public/icons/` — regenerate the PNGs from `icon.svg` with sharp if the icon ever changes; iOS ignores SVG touch icons), v2.2.6–2.2.7 fifteen more logo fixes, v2.3.0 juice (see "Juice" below).
- `docs/ROADMAP.md` is from March 2026 and out of date — this file is the current guide.

## Parked (only if Adam asks)
- **Home tab scroll jank:** needs a screen recording from Adam's phone before investigating.
- **Near Me radius:** 3 miles, to be tested on phone; may need tuning for students outside Provo/Orem.

## Browser Testing
- **Never drive the Claude in Chrome browser tools against this app without asking first** — Adam tests on his own phone (Galaxy A36) after each deploy and would rather do that than have the app clicked through on his behalf
- Even when he says yes, keep it minimal — verify the one thing in question, don't wander into unrelated flows or edge cases on your own initiative
- This app requires sign-in against a real Firestore test account (login not kept in the repo; ask Adam) — any state changed during a browser session (profile name, usage log, etc.) is real, persists, and needs to be reverted before moving on

## Sync (v2.4.3)
`useFirestoreSync` treats the cloud copy as official: each launch reads it and replaces the phone's usage, faves and history. Firestore's offline cache (`firebase.js`) queues changes made with no signal. Saves use `mergeFields` so a whole field is replaced; plain `merge: true` would keep deals removed by Undo. `STORAGE_KEYS.synced` means "this phone holds nothing the cloud lacks"; without it (first launch of a version with this key, or a change made before the launch read finished) the two copies are merged, highest count per deal. Tests: `useFirestoreSync.test.jsx`.
