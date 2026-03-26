import L from 'leaflet'
import { CATEGORY_COLORS } from './categoryColors'

// Raw SVG inner paths extracted from lucide-react via renderToStaticMarkup.
// Rendered at 14px inside a 24x24 viewBox, white stroke, no fill.
const CATEGORY_SVG_PATHS = {
  pizza: `<path d="m12 14-1 1"/><path d="m13.75 18.25-1.25 1.42"/><path d="M17.775 5.654a15.68 15.68 0 0 0-12.121 12.12"/><path d="M18.8 9.3a1 1 0 0 0 2.1 7.7"/><path d="M21.964 20.732a1 1 0 0 1-1.232 1.232l-18-5a1 1 0 0 1-.695-1.232A19.68 19.68 0 0 1 15.732 2.037a1 1 0 0 1 1.232.695z"/>`,
  restaurants: `<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>`,
  sandwiches: `<path d="m2.37 11.223 8.372-6.777a2 2 0 0 1 2.516 0l8.371 6.777"/><path d="M21 15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5.25"/><path d="M3 15a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h9"/><path d="m6.67 15 6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2"/><rect width="20" height="4" x="2" y="11" rx="1"/>`,
  treats: `<path d="m7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11"/><path d="M17 7A5 5 0 0 0 7 7"/><path d="M17 7a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4"/>`,
  free: `<path d="M12 7v14"/><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"/><rect x="3" y="7" width="18" height="4" rx="1"/>`,
  entertainment: `<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>`,
  retail: `<path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/>`,
}

function makeSvg(paths, iconSize) {
  const s = Math.round(iconSize * 0.52)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
}

// Module-level cache: at most 7 categories × 3 statuses × 2 selected states = 42 entries.
const iconCache = new Map()

export function createMarkerIcon(category, usageStatus, isSelected = false) {
  const cacheKey = `${category}:${usageStatus}:${isSelected}`
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey)

  const color =
    usageStatus === 'exhausted' ? '#94a3b8' :
    usageStatus === 'partial'   ? '#f59e0b' :
    (CATEGORY_COLORS[category] ?? '#64748b')

  const size = isSelected ? 38 : 30
  const selectedClass = isSelected ? 'selected' : ''
  const paths = CATEGORY_SVG_PATHS[category] ?? ''

  const icon = L.divIcon({
    className: '',
    html: `<div class="ssc-marker ${selectedClass}" style="width:${size}px;height:${size}px;background:${color};display:flex;align-items:center;justify-content:center;">${makeSvg(paths, size)}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  })

  iconCache.set(cacheKey, icon)
  return icon
}
