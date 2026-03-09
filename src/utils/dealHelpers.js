const EARTH_RADIUS_MILES = 3958.8

export function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = deg => deg * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_MILES * 2 * Math.asin(Math.sqrt(a))
}

export function getNearestDistance(deal, userCoords) {
  if (!userCoords || !deal.locations?.length) return null
  let min = Infinity
  for (const loc of deal.locations) {
    const d = haversineDistance(userCoords.lat, userCoords.lng, Number(loc.lat), Number(loc.lng))
    if (d < min) min = d
  }
  return min === Infinity ? null : min
}

export function formatDistance(miles) {
  if (miles < 0.1) return '< 0.1 mi'
  if (miles < 10) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}

/**
 * Compute derived usage state for a deal.
 * maxUses === null means unlimited (can never be exhausted).
 */
export function getDealUsageState(deal, usageMap) {
  const usedCount = usageMap[deal.id] ?? 0
  if (deal.deal.maxUses === null) {
    return { usedCount, remaining: null, status: usedCount > 0 ? 'partial' : 'unused' }
  }
  const remaining = Math.max(0, deal.deal.maxUses - usedCount)
  let status = 'unused'
  if (usedCount >= deal.deal.maxUses) status = 'exhausted'
  else if (usedCount > 0) status = 'partial'
  return { usedCount, remaining, status }
}

/**
 * Filter deals by active categories and search query.
 */
export function filterDeals(deals, searchQuery, activeCategories) {
  let result = deals

  if (activeCategories.length > 0) {
    result = result.filter(d => activeCategories.includes(d.category))
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    result = result.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.deal.title.toLowerCase().includes(q) ||
      (d.deal.description || '').toLowerCase().includes(q) ||
      (d.locationRestriction || '').toLowerCase().includes(q) ||
      (d.tags || []).some(t => t.toLowerCase().includes(q))
    )
  }

  return result
}
