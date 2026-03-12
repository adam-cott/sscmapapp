# AGENTS.md

## Project
starvingstudentcardmapapp — Interactive map of Starving Student Discount Card deals for Utah County students

## Stack
- Vite + React 19, react-leaflet v4 + react-leaflet-cluster, Tailwind CSS v3
- Static JSON data (no backend), localStorage for usage persistence
- Deployed on Vercel via GitHub (push to master = auto-deploy)

## Structure
```
src/
  data/deals.json        # Source of truth — 418 deals, 819 map pins
  components/            # UI components (Map, Sidebar, Modal, BottomSheet, etc.)
  hooks/                 # useDeals, useFilters, useLocalStorage
  utils/                 # categoryColors, dealHelpers, markerIcons
  constants/categories.js
docs/
  ROADMAP.md
  decisions/             # Architecture decision records
```

## Key Commands
- **Dev:** `npm run dev` → http://localhost:5173
- **Build:** `npm run build`
- **Lint:** `npm run lint`

## Notes for AI Agents
- Leaflet CSS must be imported BEFORE Tailwind in src/index.css — reversing breaks map tiles
- Always use L.divIcon() for markers — default Leaflet PNG icons break in Vite
- deals.json is the source of truth; never overwrite it without explicit instruction
- src/data/ is sensitive — ask before editing deals.json
- Map pins come from locations[] array on each deal, not top-level lat/lng
- FALLBACK_COORDS in MapView.jsx filters city-level geocoding fallbacks (threshold: 8+ businesses at same coord)
- Usage state is localStorage only — no backend, no sync across devices
