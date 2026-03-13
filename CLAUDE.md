# Starving Student Card Map App — Project Guide

## Product Overview

**Job to be Done:**
When I buy a Starving Student Card, I want to quickly find deals that are near me right now, so I can actually use the savings I already paid for — instead of forgetting the card exists or not knowing what's nearby.

**Value Proposition:**
The Starving Student Card Map App turns a physical coupon booklet into a live, location-aware deal finder. Students see all 418 deals on an interactive map, instantly filtered by category and sorted by distance, so they always know what's available nearby and never lose track of how many uses they have left.

**Ideal Customer Profile (ICP):**
- BYU or UVU student, age 18–24, living near or commuting to Utah County
- Already purchased the Starving Student Card (~$25) for the academic year
- Budget-conscious; eats out 3–5 times per week
- Mobile-first (iPhone or Android); does not use a physical wallet for coupons
- Pain point: bought the card but forgets to use it, or doesn't know which businesses are close

**Target User:** A hungry college student standing on BYU campus at noon who wants to know — in under 10 seconds — what deals are within walking distance right now.

---

## What This Is

A mobile-first PWA (installable on iOS/Android) that turns the physical **Starving Student Discount Card** into an interactive map. Users browse 418 real deals across 199 businesses in Utah County and the Wasatch Front, see every valid location as a pin on the map, and track how many times they've used each deal.

The physical card is a booklet of coupon-style deals (BOGO meals, free items, discounts) that students buy once and use throughout the year. This app makes those deals searchable, filterable, and geographically browsable — and keeps track of how many uses remain per deal.

**Live app:** deployed on Vercel via GitHub auto-deploy
**Repo:** https://github.com/adam-cott/sscmapapp
**Dev server:** `npm run dev` → http://localhost:5173

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Vite + React 19 | `npm run dev` to start |
| Map | react-leaflet v4 + Leaflet 1.9 + react-leaflet-cluster | OpenStreetMap tiles, free |
| Styling | Tailwind CSS v3 + inline styles | Sora font for headings, DM Sans for body |
| Data | Static JSON (`src/data/deals.json`) | No backend, no API |
| Persistence | `localStorage` | Key: `ssc_usage_v1` |
| PWA | `vite-plugin-pwa` (generateSW strategy) | Installable on iOS/Android, offline-capable |
| Deploy | Vercel (GitHub integration) | Auto-deploys on push to `master` |

**Critical Leaflet setup note:** Leaflet CSS must be imported *before* Tailwind in `src/index.css` — reversing this order breaks map tile rendering. Markers use `L.divIcon()` (custom HTML div) instead of the default PNG icons, which avoids the Vite+Leaflet asset bundling bug.

---

## Project Structure

```
starvingstudentcardmapapp/
├── src/
│   ├── data/
│   │   └── deals.json              # 418 deals, all with coords + locations[]
│   ├── components/
│   │   ├── Header/
│   │   │   └── Header.jsx          # App bar: title, map/list toggle, reset button
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.jsx         # Container; renders compact or full mode
│   │   │   ├── SearchBar.jsx       # Text search input
│   │   │   ├── FilterPanel.jsx     # Category filter chips (shows per-category deal counts)
│   │   │   └── SortControl.jsx     # Sort by: Default / Nearest / Category; handles pending GPS state
│   │   ├── Map/
│   │   │   ├── MapView.jsx         # MapContainer; groups deals into one pin per business×location
│   │   │   ├── BusinessMarker.jsx  # Leaflet Marker + Popup; handles single and multi-deal pins
│   │   │   └── MapLegend.jsx       # Category color legend overlay
│   │   ├── ListView/
│   │   │   ├── ListView.jsx        # Scrollable list of DealCards
│   │   │   └── DealCard.jsx        # Single deal card (compact)
│   │   ├── Modal/
│   │   │   └── DealModal.jsx       # Full deal detail — desktop (centered modal)
│   │   ├── BottomSheet/
│   │   │   └── BottomSheet.jsx     # Full deal detail — mobile (slides up from bottom)
│   │   ├── LocationPicker/
│   │   │   └── LocationPicker.jsx  # Multi-deal picker — lists all deals at one business location
│   │   └── UI/
│   │       ├── Badge.jsx           # Category color pill
│   │       ├── UsageTracker.jsx    # Dot-based usage indicator
│   │       ├── ConfirmDialog.jsx   # Reusable confirmation modal (used by Reset)
│   │       ├── UseToast.jsx        # 2s green confirmation toast shown after "Use This Deal"
│   │       ├── LocationPrompt.jsx  # One-time prompt asking user to allow location on load
│   │       └── UpdatePrompt.jsx    # PWA update banner: "New version available" + Reload/Later
│   ├── hooks/
│   │   ├── useDeals.js             # Merges deals with localStorage usage state
│   │   ├── useFilters.js           # Search + category filter logic + categoryCounts (memoized)
│   │   ├── useGeolocation.js       # Manual-trigger geolocation; exposes coords, permissionDenied, hasRequested
│   │   └── useLocalStorage.js      # Generic useState-backed localStorage hook
│   ├── utils/
│   │   ├── categoryColors.js       # Color/label/light maps for 7 categories
│   │   ├── dealHelpers.js          # getDealUsageState(), filterDeals()
│   │   └── markerIcons.js          # createMarkerIcon() — L.divIcon factory with module-level cache
│   ├── constants/
│   │   └── categories.js           # ALL_CATEGORIES array
│   ├── App.jsx                     # Root: state, layout, responsive split
│   ├── index.css                   # Global styles, Leaflet CSS import (must be first)
│   └── main.jsx                    # React entry point
├── public/
│   └── icons/
│       └── icon.svg                # PWA app icon (blue background, white map pin)
│
│   # Data pipeline scripts (Python 3, run once to build deals.json)
├── generate_deals.py               # Parsed physical card photos → raw deals.json
├── geocode_deals.py                # First-pass geocoding by business name
├── geocode_by_address.py           # Geocodes 78 businesses by known street address
├── geocode_from_csv.py             # First CSV-based geocoding attempt
├── geocode_retry.py                # Final geocoder: full → stripped suite → city fallback
├── fix_outliers.py                 # Re-geocodes businesses placed in wrong Utah city
├── patch_coords.py                 # One-off hardcoded coordinate patches
├── add_locations.py                # Geocodes ALL CSV locations; adds locations[] to deals
│
│   # Reference data
├── starving_student_businesses.csv # Authoritative: all business locations (via Downloads)
├── phone_website_needed.csv        # 199 businesses awaiting phone/website data entry
├── deals_complete.csv              # Intermediate: all deals before geocoding
├── geocode_review.csv              # Post-geocode audit file
└── manual_geocode_needed.csv       # Businesses that failed automatic geocoding
```

---

## Data Model

Every entry in `src/data/deals.json` represents **one deal offer** from the card:

```json
{
  "id": "restaurants-051",
  "name": "El Pollo Loco",
  "category": "restaurants",
  "address": "76 E University Pkwy, Orem, UT 84058",
  "lat": 40.2734535,
  "lng": -111.693284,
  "locationRestriction": "Orem Lehi & Particip",
  "deal": {
    "title": "Buy 1 Combo Meal Get 2nd FREE! Up to $8!",
    "description": "Valid at: Orem Lehi & Particip",
    "restrictions": "",
    "value": "Buy 1 Get 1 Free",
    "maxUses": 3,
    "expiresAt": "2026-12-31"
  },
  "contact": {
    "phone": null,
    "website": null,
    "hours": null
  },
  "tags": ["restaurants"],
  "locations": [
    { "lat": 40.2734535, "lng": -111.693284,  "address": "76 E University Pkwy, Orem, UT 84058" },
    { "lat": 40.4316523, "lng": -111.8305878, "address": "88 N 1200 E, Lehi, UT 84043" }
  ]
}
```

**Key design decisions:**

- `lat`/`lng`/`address` — primary/best-match location (kept for direct access)
- `locations[]` — **all** valid locations for this deal from the authoritative CSV; the map renders one pin per business×location
- `maxUses: null` means unlimited uses
- `contact.phone` / `contact.website` — currently null; awaiting `phone_website_needed.csv` fill-in
- Multiple deals can share the same business name (e.g., Wendy's has 2 separate deals)

**Stats:** 418 deals · 199 unique businesses · 819 map pins · 0 null coordinates

---

## Categories

Seven categories, each with a distinct color:

| Key | Label | Color | Emoji |
|---|---|---|---|
| `pizza` | Pizza | `#dc2626` red | 🍕 |
| `restaurants` | Restaurants | `#ea580c` orange | 🍽️ |
| `sandwiches` | Sandwiches | `#b45309` amber | 🥪 |
| `treats` | Treats & Drinks | `#db2777` pink | 🧁 |
| `free` | Free Stuff | `#059669` green | 🎁 |
| `entertainment` | Entertainment | `#7c3aed` purple | 🎭 |
| `retail` | Retail & Auto | `#d97706` yellow | 🚗 |

Single-deal pins show the category emoji. Partially-used deals show amber (`#f59e0b`). Fully exhausted deals show gray (`#94a3b8`). Multi-deal pins show a count badge.

---

## How the Map Works

`MapView.jsx` builds one pin per **business × location**, then groups nearby pins with `MarkerClusterGroup`:

1. **Filter fallbacks** — `FALLBACK_COORDS` (computed once at module load from the full dataset) identifies city-level geocoding fallbacks: any coordinate shared by 8+ different business names (to 4 decimal places ≈ 11m) is excluded from map rendering. Affected deals still appear in the sidebar list. Threshold is 8: University Place Mall has 7 businesses at one entrance (legit cluster); true city-level fallbacks have 9–13 (Provo=13, Saratoga Springs=10, Orem=9).
2. **Group** — remaining locations are grouped by `businessName + lat + lng`. A business with 3 deals at the same address = 1 pin. Two different businesses at the same geocoded coordinate = 2 separate pins.
3. **Cluster** — `react-leaflet-cluster` groups nearby pins into styled numbered bubbles. Clicking zooms in and splits them apart.
4. **Spiderfy** — at max zoom (19), clusters fan out automatically via the `AutoSpiderfy` component (listens to `zoomend`, calls `spiderfy()` on all visible clusters). `removeOutsideVisibleBounds={false}` prevents the cluster group from re-rendering on pan, keeping the spider open while panning.
5. **Multi-deal pins** — if a business has 2+ deals at one location, the pin shows a count badge in the business's category color. Tapping opens `LocationPicker` — a sheet (mobile) or modal (desktop) listing all deals for that business. User picks one → full deal detail opens.
6. **Location dot** — user's current position shown as a pulsing blue dot (`LOCATION_ICON` divIcon, `.loc-dot` + `.loc-ring` CSS classes). Uses `Marker` not `CircleMarker` — the SVG pane scales during zoom animations causing visual jitter; the marker pane stays pixel-perfect.

- `maxZoom={19}` on both `MapContainer` and `TileLayer`
- Single-deal pin tap → deal detail directly
- Multi-deal pin tap → `LocationPicker` → deal detail
- The sidebar list still shows each deal once (including fallback-coordinate deals)

Cluster bubbles use `L.divIcon` with `.ssc-cluster` CSS class — three tiers: sm (2–9, 34px), md (10–39, 42px), lg (40+, 50px) in SSC blue (`#0170B9` → `#014370`).

The map is centered on Provo (`[40.2468, -111.6490]`) at zoom 13 by default.

---

## Responsive Layout

**Desktop (md+):**
- Left sidebar (320px): search bar + category filters + sort control + scrollable deal list
- Right main area: full-screen map
- Deal detail: centered modal with backdrop blur

**Mobile:**
- Full-screen map with compact filter bar overlaid at top
- Map/List toggle button in header switches to full-screen list view
- Deal detail: bottom sheet slides up from bottom edge

---

## State Management

All state lives in `App.jsx`. No external state library.

| State | Hook | Persisted |
|---|---|---|
| `usageMap` | `useLocalStorage('ssc_usage_v1', {})` | ✅ localStorage |
| `selectedDeal` | `useState(null)` | ❌ |
| `selectedLocation` | `useState(null)` | ❌ |
| `showResetConfirm` | `useState(false)` | ❌ |
| `activeView` | `useState('map')` | ❌ |
| `showUseToast` | `useState(false)` | ❌ |
| `pendingNearest` | `useState(false)` | ❌ |
| `searchQuery` | `useFilters` → `useState('')` | ❌ |
| `activeCategories` | `useFilters` → `useState([])` | ❌ |
| `coords` | `useGeolocation` | ❌ |

`usageMap` is a plain object: `{ [dealId]: usedCount }`. It never decrements — the card is single-direction (you use it, it's used).

**`pendingNearest` pattern:** When the user taps "Nearest" but GPS hasn't been granted yet, `pendingNearest` is set to `true` and a location request fires. A `useEffect` watches for `coords` to arrive, then calls `setSortBy('nearest')` and clears the flag. If the user picks a different sort while waiting, `handleSetSortBy` clears `pendingNearest` so coords arriving later won't override their choice.

---

## Geolocation

`useGeolocation` hook manages the browser Geolocation API:
- Does **not** fire on mount — only when `requestLocation()` is called explicitly
- Exposes: `coords` (`{lat, lng}`), `loading`, `permissionDenied`, `hasRequested`
- `hasRequested` drives `LocationPrompt` — the one-time "Allow location?" sheet shown on first load
- `decline()` sets `hasRequested = true` without requesting GPS (dismisses the prompt)

---

## Deal Usage Logic

```js
// getDealUsageState(deal, usageMap) → { usedCount, remaining, status }
// status: 'unused' | 'partial' | 'exhausted'
// maxUses: null = unlimited (remaining stays null, never exhausted)
```

When a user taps "Use This Deal," `recordUse(dealId)` increments the count in localStorage. The modal stays open and immediately reflects the new state via an optimistic update in `handleUse()`. A 2-second green `UseToast` confirms the action.

---

## PWA

The app is installable as a PWA on iOS and Android.

- **Plugin:** `vite-plugin-pwa` with `generateSW` strategy and `registerType: 'prompt'`
- **Service worker caches:** JS, CSS, HTML, SVG, fonts (Google Fonts: CacheFirst, 1-year TTL)
- **OSM map tiles are intentionally excluded** from the SW cache (storage quota concern — tiles are large and change frequently)
- **Update flow:** When a new SW is waiting, `UpdatePrompt.jsx` shows a bottom banner: "New version available" + Reload/Later. Uses `useRegisterSW` from `virtual:pwa-register/react`.
- **Icons:** `public/icons/icon.svg` — blue `#0170B9` background, white map pin SVG
- **`index.html` meta tags:** `theme-color`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`, `apple-touch-icon`

To install on iPhone: open in Safari → Share → Add to Home Screen. On Android: open in Chrome → three-dot menu → Add to Home Screen (or install banner).

---

## Performance Notes

With 819 map pins, keeping pan smooth on Android Chrome requires avoiding unnecessary React re-renders:

- **`BusinessMarker` is wrapped in `React.memo`** — only re-renders when its own props change (e.g., `isSelected` toggles). Without this, opening a modal would re-render all 819 markers.
- **Stable callbacks in `App.jsx`** — `handleSelectDeal`, `handleSelectLocation`, `handleSelectFromPicker` are wrapped in `useCallback(fn, [])` so their references never change between renders.
- **`eventHandlers` object is memoized in `BusinessMarker`** — Leaflet compares event handler references; a new object every render causes Leaflet to re-bind click handlers unnecessarily.
- **Module-level icon cache in `markerIcons.js`** — `createMarkerIcon` caches results by `category:status:isSelected` key. Max 42 entries (7 categories × 3 statuses × 2 selected states). Same inputs always return the same `L.divIcon` object.
- **`MapView` passes `onSelectDeal`/`onSelectLocation` directly** — no inline arrow functions in the render loop, which would create new function references on every render and defeat `React.memo`.

---

## Data Pipeline (Python Scripts)

The `src/data/deals.json` file was built through a multi-stage pipeline. You should only need to re-run these if the source card data changes.

### Running order (if rebuilding from scratch):
```
1. generate_deals.py       # Produces raw deals from card images/data
2. geocode_retry.py        # Primary geocoder — reads starving_student_businesses.csv
3. add_locations.py        # Adds locations[] array with ALL CSV addresses per business
4. geocode_by_address.py   # Patches businesses not in CSV (23 businesses)
```

### Key script: `geocode_retry.py`
Matches each deal's business name to `starving_student_businesses.csv` (authoritative address source), then geocodes using a 3-level fallback:
1. Full address + city + state + zip
2. Suite/unit stripped from address
3. City-level fallback

Uses `NAME_OVERRIDES` dict to handle name mismatches between `deals.json` and the CSV (e.g., `"Ike's"` → `"Ike's Love & Sandwiches"`).

### Key script: `add_locations.py`
Geocodes **all** rows in the CSV (not just the best-match per deal) and writes a `locations[]` array to every deal. This is what enables multi-pin display for chains like Jiffy Lube (14 locations), Chili's (11), Wendy's (9).

**Note:** Some locations not in the CSV (e.g., 2 Provo Wendy's at 122 E 1230 N and 1066 S University Ave) were added manually directly to `deals.json` after the script ran.

### External data dependency:
```
C:\Users\adamb\Downloads\starving_student_businesses.csv
```
This is the authoritative business/address database (376 rows). Keep it. All geocoding scripts read from this path.

---

## Pending Work

### Phone numbers + websites
`phone_website_needed.csv` (project root) has all 199 businesses with blank `phone` and `website` columns. Once filled in, run the merge script (to be written) which will read the CSV and stamp `contact.phone` + `contact.website` onto matching deals in `deals.json`.

The modal and deal card already have rendering logic for `deal.contact.phone` (renders as `tel:` link) and `deal.contact.website` (renders as external link). Populating the data is the only remaining step.

### Address Google Maps link
Already implemented. The address row in `DealModal.jsx` links to:
```
https://www.google.com/maps/dir/?api=1&destination={lat},{lng}
```
Opens Google Maps turn-by-turn directions from the user's current location.

---

## Common Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Re-geocode all deals from CSV (takes ~6 min, rate-limited to 1 req/sec)
python3 geocode_retry.py

# Add/refresh all location pins from CSV
python3 add_locations.py

# Commit and push (Vercel auto-deploys)
git add -A && git commit -m "..." && git push
```

---

## Important Notes for AI Assistants

- **Never add the `dist/` or `node_modules/` directories to git** — they are gitignored
- **Leaflet CSS import order is critical** — it must come before Tailwind in `index.css`
- **Do not use default Leaflet PNG markers** — they break in Vite; always use `L.divIcon()`
- **`deals.json` is the source of truth** — all Python scripts write to `src/data/deals.json`
- **The CSV path is hardcoded** — `C:\Users\adamb\Downloads\starving_student_businesses.csv` — Python scripts will fail if it moves
- **`contact.phone` and `contact.website` are null for all 199 businesses** — this is expected and intentional until the CSV is filled in
- **Usage state is client-side only** — there is no backend; each user's usage history is isolated to their browser's localStorage
- **The `locations[]` array is the canonical source for map pins** — `lat`/`lng` at the top level is just the primary location kept for convenience
- **`CATEGORY_EMOJIS` in `markerIcons.js` must match the 7 actual category keys** — (`pizza`, `restaurants`, `sandwiches`, `treats`, `free`, `entertainment`, `retail`). Using wrong keys causes "?" on markers.
- **`FALLBACK_COORDS` threshold is 8** — coordinates shared by 8+ different businesses are excluded from the map as city-level geocoding fallbacks.
- **Do not use `CircleMarker` for the location dot** — it lives in Leaflet's SVG pane and visually resizes during zoom animations. Use `Marker` + `L.divIcon` instead (the `LOCATION_ICON` constant in `MapView.jsx`).
- **`BusinessMarker` must receive `onSelectDeal` and `onSelectLocation` props** — not an `onClick` prop. The parent `MapView` passes the stable callbacks directly; no inline arrow functions in the render loop.
- **`vite-plugin-pwa` is installed** — do not add a manual service worker; it conflicts with the generated one.
