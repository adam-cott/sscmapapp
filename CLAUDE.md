# Starving Student Card Map App

## What This Is
A mobile-first PWA for Utah County college students. Turns the physical Starving Student Discount Card into an interactive deal finder — 418 deals, 199 businesses, 1,400+ map pins. Users browse by map or list, filter by category, and track deal usage per card.

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
| Persistence | localStorage (`ssc_usage_v1`) |
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

## Project Structure (key files)
```
src/
  data/deals.json              # 418 deals, all with coords + locations[]
  components/
    Header/Header.jsx          # App bar
    Sidebar/                   # SearchBar, FilterPanel, SortControl
    Map/MapView.jsx            # Map + clustering + spiderfy
    Map/BusinessMarker.jsx     # Pins — React.memo wrapped
    ListView/                  # DealCard list
    Modal/DealModal.jsx        # Desktop deal detail
    BottomSheet/               # Mobile deal detail
    BottomNav/                 # 5-tab bottom navigation
    Tabs/                      # HomeTab, FavesTab, RewardsTab, SettingsTab
    LocationPicker/            # Multi-deal picker per business
    UI/                        # Badge, UsageTracker, Toast, UpdatePrompt, etc.
  hooks/
    useDeals.js                # Merges deals + localStorage usage
    useFilters.js              # Search + category filter + categoryCounts
    useGeolocation.js          # Manual-trigger GPS; exposes coords, permissionDenied, hasRequested
  utils/
    categoryColors.js          # 7 category color/label map
    dealHelpers.js             # getDealUsageState(), filterDeals()
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
- **Stats:** 418 deals · 199 businesses · 1,400+ pins · 0 null coords

---

## Map Logic
- `FALLBACK_COORDS`: coords shared by 8+ different businesses are excluded from map (city-level geocoding fallbacks). Threshold = 8.
- Pins grouped by `businessName + lat + lng` → clustered via MarkerClusterGroup
- Multi-deal pins show count badge → tap opens LocationPicker → then deal detail
- Clusters: `.ssc-cluster` CSS, 3 tiers (sm/md/lg), SSC blue (`#0170B9`)
- AutoSpiderfy at zoom 19; `removeOutsideVisibleBounds={false}` keeps spider open on pan
- Default center: Provo `[40.2468, -111.6490]`, zoom 13

---

## Navigation (Bottom Nav — 5 tabs)
`home` · `map` · `faves` · `rewards` · `settings`

## Rewards Tab — Est. Savings
The "Est. Savings" stat card has been intentionally removed from the Rewards tab for now. The plan is to add a `dealValue` field to each deal in `deals.json` and compute savings from `usageLog`. The code scaffold was: `usageLog.reduce((sum, e) => sum + (dealById[e.dealId]?.deal?.dealValue ?? 0), 0)`. Do not re-add the placeholder "coming soon" UI — only ship it when real `dealValue` data exists.

---

## Performance
- `BusinessMarker` wrapped in `React.memo` — avoids re-rendering all 1,400+ pins on modal open
- `handleSelectDeal`, `handleSelectLocation` wrapped in `useCallback(fn, [])` in App.jsx
- `eventHandlers` memoized inside BusinessMarker — prevents Leaflet rebinding on every render
- Icon cache in `markerIcons.js` — keyed by `category:status:isSelected`

---

## Common Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm test             # Run Vitest tests

# Push to deploy
git add -A && git commit -m "..." && git push
```

---

## Push Workflow (REQUIRED — do this every time before pushing)
1. **Bump the patch version** in `package.json` (e.g. `1.0.3` → `1.0.4`)
2. **Update `src/constants/changelog.js`** — set `version` to match and write a short, friendly, user-facing `description` of what changed (not a commit message — something a student would actually want to read)
3. Then commit and push as normal

This keeps the About screen version and What's New section accurate without any manual effort from the user.
