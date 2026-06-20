# Starving Student Card Map

A mobile-first PWA that turns the physical Starving Student Discount Card into an interactive map and deal tracker for Utah County college students (BYU/UVU).

The official app lists 400+ deals as a flat category list with no map, and chains with multiple locations get split across categories or duplicated — making it hard to tell what's actually nearby. This app fixes that: **418 deals, 199 businesses, 1,400+ map pins**, all browsable on a live, clustered map.

**Live app:** https://sscmapapp.vercel.app/

## Features

- Interactive, clustered map of every deal location (react-leaflet)
- Category filters
- Nearest-first sort with location permission
- Per-deal usage tracking with undo
- Favorites tab
- Rewards tab
- Swipe-to-redeem flow with countdown
- Cross-device sync via Firestore

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Vite + React 19 |
| Map | react-leaflet (OpenStreetMap) |
| Styling | Tailwind CSS |
| Data sync | Firebase / Firestore |
| PWA | vite-plugin-pwa |

## Getting Started

### Prerequisites

- Node.js and npm installed

### Installation

```bash
git clone https://github.com/adam-cott/sscmapapp.git
cd sscmapapp
npm install
```

### Development

```bash
npm run dev
```

App runs at http://localhost:5173

### Other Scripts

```bash
npm run build     # Production build
npm run lint       # Lint
npm run preview   # Preview production build
npm test           # Run tests
```
