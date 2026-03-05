# Starving Student Card Map App — Project Guide

## What This Is

A mobile-first web app that turns the physical **Starving Student Discount Card** into an interactive map. Users browse 418 real deals across 199 businesses in Utah County and the Wasatch Front, see every valid location as a pin on the map, and track how many times they've used each deal.

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
│   │   │   └── FilterPanel.jsx     # Category filter chips
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
│   │       └── UsageTracker.jsx    # Dot-based usage indicator
│   ├── hooks/
│   │   ├── useDeals.js             # Merges deals with localStorage usage state
│   │   ├── useFilters.js           # Search + category filter logic (memoized)
│   │   └── useLocalStorage.js      # Generic useState-backed localStorage hook
│   ├── utils/
│   │   ├── categoryColors.js       # Color/label/icon maps for 7 categories
│   │   ├── dealHelpers.js          # getDealUsageState(), filterDeals()
│   │   └── markerIcons.js          # createMarkerIcon() — L.divIcon factory
│   ├── constants/
│   │   └── categories.js           # ALL_CATEGORIES array
│   ├── App.jsx                     # Root: state, layout, responsive split
│   ├── index.css                   # Global styles, Leaflet CSS import (must be first)
│   └── main.jsx                    # React entry point
├── public/
│   └── vite.svg
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
- `locations[]` — **all** valid locations for this deal from the authoritative CSV; the map renders one pin per entry
- `maxUses: null` means unlimited uses
- `contact.phone` / `contact.website` — currently null; awaiting `phone_website_needed.csv` fill-in
- Multiple deals can share the same business name (e.g., Wendy's has 2 separate deals)

**Stats:** 418 deals · 199 unique businesses · 819 map pins · 0 null coordinates

---

## Categories

Seven categories, each with a distinct color:

| Key | Label | Color |
|---|---|---|
| `pizza` | Pizza | `#dc2626` red |
| `restaurants` | Restaurants | `#ea580c` orange |
| `sandwiches` | Sandwiches | `#b45309` amber |
| `treats` | Treats & Drinks | `#db2777` pink |
| `free` | Free Stuff | `#059669` green |
| `entertainment` | Entertainment | `#7c3aed` purple |
| `retail` | Retail & Auto | `#d97706` yellow |

Marker color follows category. Partially-used deals show amber (`#f59e0b`). Fully exhausted deals show gray (`#94a3b8`).

---

## How the Map Works

`MapView.jsx` builds one pin per **business × location**, then groups nearby pins with `MarkerClusterGroup`:

1. **Group** — deals are grouped by `businessName + lat + lng`. A business with 3 deals at the same address = 1 pin. Two different businesses at the same geocoded coordinate = 2 separate pins (handled by spiderfy).
2. **Cluster** — `react-leaflet-cluster` groups nearby pins into styled numbered bubbles. Clicking zooms in and splits them apart.
3. **Spiderfy** — at max zoom (19), clusters fan out automatically via the `AutoSpiderfy` component (listens to `zoomend`, calls `spiderfy()` on all visible clusters). `removeOutsideVisibleBounds={false}` prevents the cluster group from re-rendering on pan, keeping the spider open while panning.
4. **Multi-deal pins** — if a business has 2+ deals at one location, the pin shows a count badge in the business's category color. Tapping opens `LocationPicker` — a sheet (mobile) or modal (desktop) listing all deals for that business. User picks one → full deal detail opens.

- `maxZoom={19}` on both `MapContainer` and `TileLayer`
- Single-deal pin tap → deal detail directly
- Multi-deal pin tap → `LocationPicker` → deal detail
- The sidebar list still shows each deal once

Cluster bubbles use `L.divIcon` with `.ssc-cluster` CSS class — three tiers: sm (2–9, 34px), md (10–39, 42px), lg (40+, 50px) in SSC blue (`#0170B9` → `#014370`).

The map is centered on Provo (`[40.2468, -111.6490]`) at zoom 13 by default.

---

## Responsive Layout

**Desktop (md+):**
- Left sidebar (320px): search bar + category filters + scrollable deal list
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
| `activeView` | `useState('map')` | ❌ |
| `searchQuery` | `useFilters` → `useState('')` | ❌ |
| `activeCategories` | `useFilters` → `useState([])` | ❌ |

`usageMap` is a plain object: `{ [dealId]: usedCount }`. It never decrements — the card is single-direction (you use it, it's used).

---

## Deal Usage Logic

```js
// getDealUsageState(deal, usageMap) → { usedCount, remaining, status }
// status: 'unused' | 'partial' | 'exhausted'
// maxUses: null = unlimited (remaining stays null, never exhausted)
```

When a user taps "Use This Deal," `recordUse(dealId)` increments the count in localStorage. The modal immediately reflects the new state via an optimistic update in `handleUse()`.

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
