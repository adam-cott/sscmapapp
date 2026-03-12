import L from 'leaflet'
import { CATEGORY_COLORS } from './categoryColors'

const CATEGORY_EMOJIS = {
  pizza:         '🍕',
  restaurants:   '🍽️',
  sandwiches:    '🥪',
  treats:        '🧁',
  free:          '🎁',
  entertainment: '🎭',
  retail:        '🚗',
}

// Module-level cache: at most 7 categories × 3 statuses × 2 selected states = 42 entries.
// Icons are pure functions of these three inputs, so the same key always produces
// the same L.divIcon — safe to reuse across renders indefinitely.
const iconCache = new Map()

export function createMarkerIcon(category, usageStatus, isSelected = false) {
  const cacheKey = `${category}:${usageStatus}:${isSelected}`
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey)

  const color =
    usageStatus === 'exhausted' ? '#94a3b8' :
    usageStatus === 'partial'   ? '#f59e0b' :
    (CATEGORY_COLORS[category] ?? '#64748b')

  const emoji = CATEGORY_EMOJIS[category] ?? '?'
  const size = isSelected ? 38 : 30
  const fontSize = isSelected ? 18 : 14
  const selectedClass = isSelected ? 'selected' : ''

  const icon = L.divIcon({
    className: '',
    html: `<div class="ssc-marker ${selectedClass}" style="width:${size}px;height:${size}px;background:${color};font-size:${fontSize}px;">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  })

  iconCache.set(cacheKey, icon)
  return icon
}
