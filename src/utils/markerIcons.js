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

export function createMarkerIcon(category, usageStatus, isSelected = false) {
  const color =
    usageStatus === 'exhausted' ? '#94a3b8' :
    usageStatus === 'partial'   ? '#f59e0b' :
    (CATEGORY_COLORS[category] ?? '#64748b')

  const emoji = CATEGORY_EMOJIS[category] ?? '?'
  const size = isSelected ? 38 : 30
  const fontSize = isSelected ? 18 : 14
  const selectedClass = isSelected ? 'selected' : ''

  return L.divIcon({
    className: '',
    html: `<div class="ssc-marker ${selectedClass}" style="width:${size}px;height:${size}px;background:${color};font-size:${fontSize}px;">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  })
}
