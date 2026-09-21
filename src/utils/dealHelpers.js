export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatPhone(raw) {
  if (!raw) return raw
  const digits = raw.replace(/\D/g, '')
  const local = digits.length === 11 && digits[0] === '1' ? digits.slice(1) : digits
  if (local.length !== 10) return raw
  return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`
}

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

export function getNearestLocation(deal, userCoords) {
  if (!userCoords || !deal.locations?.length) return null
  let best = null
  let bestDist = Infinity
  for (const loc of deal.locations) {
    if (loc.lat == null || loc.lng == null) continue
    const d = haversineDistance(userCoords.lat, userCoords.lng, Number(loc.lat), Number(loc.lng))
    if (d < bestDist) { bestDist = d; best = loc }
  }
  return best
}

export function formatDistance(miles) {
  if (miles < 0.1) return '< 0.1 mi'
  if (miles < 10) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}

const TERMINAL_PUNCT = /[.!?)'"]\s*$/

/**
 * deal.deal.value is meant to be a short label ("2 for 1", "Free Item"), but
 * an upstream import bug hard-cut some longer deal copy at ~30 characters
 * into deal.value instead of leaving the full text in deal.title. Detect
 * that case (value is an exact, unterminated prefix of title) and return
 * null so callers can skip rendering the mangled fragment rather than show
 * it. See reports/truncated-deals-report.md for the affected deals.
 */
export function getDisplayValue(deal) {
  const value = deal.deal.value
  const title = deal.deal.title
  if (value && title && title !== value && title.startsWith(value) && !TERMINAL_PUNCT.test(value)) {
    return null
  }
  return value
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

// deal.locations[] lists every physical location for the business, but
// locationRestriction (when set) means the deal only honors a subset of
// them — and locations[] isn't filtered to match. For a restricted deal we
// can only be sure the deal's own primary lat/lng/address is valid, so
// "View on map" shows just that one pin. These four businesses' primary
// address doesn't even match their own locationRestriction text (verified
// against deals.json on 2026-09-21 — e.g. The Picklr's restriction is
// "Lehi & Bluffdale" but its primary address is in Kaysville), so we can't
// show a pin for them at all without risking a wrong location.
const UNVERIFIABLE_RESTRICTED_DEAL_IDS = new Set([
  'entertainment-150', 'free-268', // The Picklr — "Lehi & Bluffdale"
  'treats-338', // Rocky Mountain Chocolate Factory — "Lehi"
  'treats-358', 'treats-359', 'treats-360', // Twisted Sugar — "PG & Saratoga Only"
  'treats-366', 'treats-367', 'treats-368', // Yonutz — "Saratoga Springs"
])

/**
 * Locations to show for a deal's "View on map" focus mode, or null if none
 * can be shown with confidence. See UNVERIFIABLE_RESTRICTED_DEAL_IDS above.
 */
export function getMapFocusLocations(deal) {
  if (deal.locationRestriction) {
    if (UNVERIFIABLE_RESTRICTED_DEAL_IDS.has(deal.id)) return null
    return [{ lat: deal.lat, lng: deal.lng, address: deal.address, phone: deal.contact?.phone }]
  }
  return deal.locations
}

const TIEBREAKER = ['restaurants', 'sandwiches', 'pizza', 'treats', 'free', 'entertainment', 'retail']

export function getPrimaryCategory(deals) {
  const counts = {}
  for (const deal of deals) {
    counts[deal.category] = (counts[deal.category] || 0) + 1
  }
  const maxCount = Math.max(...Object.values(counts))
  const tied = Object.keys(counts).filter(k => counts[k] === maxCount)
  if (tied.length === 1) return tied[0]
  return TIEBREAKER.find(t => tied.includes(t)) ?? tied[0]
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
