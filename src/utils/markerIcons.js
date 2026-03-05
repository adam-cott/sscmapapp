import L from 'leaflet'
import { CATEGORY_COLORS } from './categoryColors'

const CATEGORY_LETTERS = {
  pizza:         'P',
  restaurants:   'R',
  sandwiches:    'S',
  treats:        'T',
  free:          'F',
  entertainment: 'E',
  retail:        'R',
}

export function createMarkerIcon(category, usageStatus, isSelected = false) {
  const color =
    usageStatus === 'exhausted' ? '#94a3b8' :
    usageStatus === 'partial'   ? '#f59e0b' :
    (CATEGORY_COLORS[category] ?? '#64748b')

  const letter = CATEGORY_LETTERS[category] ?? '?'
  const size = isSelected ? 38 : 30
  const selectedClass = isSelected ? 'selected' : ''

  return L.divIcon({
    className: '',
    html: `<div class="ssc-marker ${selectedClass}" style="width:${size}px;height:${size}px;background:${color};">${letter}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  })
}
