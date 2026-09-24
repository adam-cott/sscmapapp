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

// Both of these resolve locations via getMapFocusLocations(deal) rather than
// reading deal.locations directly, so a restricted deal can't be sorted as
// "nearest" to, or show a distance for, a store that doesn't honor it.
// Unrestricted deals and callers that pass a plain { locations } object
// (no locationRestriction field, e.g. HomeTab's pooled-nearest-location
// lookup) are unaffected — see getMapFocusLocations.

export function getNearestDistance(deal, userCoords) {
  const locations = getMapFocusLocations(deal) ?? []
  if (!userCoords || !locations.length) return null
  let min = Infinity
  for (const loc of locations) {
    const d = haversineDistance(userCoords.lat, userCoords.lng, Number(loc.lat), Number(loc.lng))
    if (d < min) min = d
  }
  return min === Infinity ? null : min
}

export function getNearestLocation(deal, userCoords) {
  const locations = getMapFocusLocations(deal) ?? []
  if (!userCoords || !locations.length) return null
  let best = null
  let bestDist = Infinity
  for (const loc of locations) {
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
// them — and locations[] isn't filtered to match. The functions below
// resolve a restriction's text (e.g. "Lehi & Bluffdale",
// "All Utah County, excluding Eagle Mountain & Spanish Fork") down to the
// specific locations it names, so the map, "Nearest", "Get Directions" and
// "View on map" only use locations that actually honor the deal.
//
// This relies on locationRestriction using full city names ("Eagle Mountain",
// not "EM") and "&" between places — keep it that way when editing
// deals.json. See reports/map-focus-restrictions-report.md for the data audit.

// Wording that means "every location honors this deal" rather than naming
// specific cities: starts with "All" ("All Locations", "All Utah County"),
// starts with "Participating", or mentions a county-level scope.
export const BROAD_RESTRICTION = /^all\b|^participating\b|county/i

// "All Utah County" is narrower than the business's full locations[] (many
// chains also have Salt Lake County or Tooele stores), so it matches these
// cities plus any extra places named after it ("All Utah County & Bluffdale").
const UTAH_COUNTY = /\b(all )?utah county\b/i
const UTAH_COUNTY_CITIES = new Set([
  'Alpine', 'American Fork', 'Cedar Fort', 'Cedar Hills', 'Eagle Mountain', 'Elk Ridge',
  'Fairfield', 'Genola', 'Goshen', 'Highland', 'Lehi', 'Lindon', 'Mapleton', 'Orem',
  'Payson', 'Pleasant Grove', 'Provo', 'Salem', 'Santaquin', 'Saratoga Springs',
  'Spanish Fork', 'Spring Lake', 'Springville', 'Vineyard', 'Woodland Hills',
])

// Splits "All Utah County, excluding Eagle Mountain & Spanish Fork" into an
// include clause and an exclude clause; restrictions with no exclusion
// wording are all include, no exclude.
const EXCLUSION_SPLIT = /\b(excluding|except|not)\b/i

export function splitRestrictionClauses(restrictionText) {
  const parts = restrictionText.split(EXCLUSION_SPLIT)
  if (parts.length === 1) return { includeText: restrictionText, excludeText: null }
  return { includeText: parts[0], excludeText: parts.slice(2).join(' ') }
}

function normalizePlace(text) {
  return text.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()
}

// Words that ride along with a place name but aren't part of it
// ("Spanish Fork & Participating Locations").
const FILLER_WORD = /\b(locations?|participating)\b/gi

// Breaks a restriction clause into place names: splits on "&", ",", "and",
// "/", "-" and strips filler words.
export function expandPlaceTokens(text) {
  return text.toLowerCase()
    .replace(/[().]/g, ' ')
    .split(/&|,|\band\b|\/|-/)
    .map(t => t.replace(FILLER_WORD, ' ').trim())
    .filter(Boolean)
    .map(normalizePlace)
    .filter(Boolean)
}

// The city is the part just before "UT 84xxx" — not always parts[1], since
// some addresses carry a venue or suite first ("South Towne Center, ...").
export function cityFromAddress(address) {
  if (!address) return null
  const parts = address.split(',').map(s => s.trim())
  const state = parts.findIndex(p => /^UT\b/.test(p))
  if (state > 0) return parts[state - 1]
  return parts.length >= 2 ? parts[1] : null
}

// Venue names the card uses instead of a city, matched against the address.
const VENUES = {
  uvu: /800 W University Pkwy/i,
  'uvu campus': /800 W University Pkwy/i,
  'traverse mountain': /Traverse Pkwy|Digital Dr/i,
}

function placeMatchesLocation(placeToken, location) {
  const c = normalizePlace(cityFromAddress(location.address) || '')
  return (!!c && (c.includes(placeToken) || placeToken.includes(c))) ||
    !!VENUES[placeToken]?.test(location.address)
}

/**
 * Filters a business's locations[] down to the ones a locationRestriction
 * actually names. Returns null if nothing can be confidently matched.
 */
export function matchLocationsToRestriction(locations, restrictionText) {
  if (!restrictionText) return locations
  const { includeText, excludeText } = splitRestrictionClauses(restrictionText)
  const utahCounty = UTAH_COUNTY.test(includeText)
  const isBroad = !utahCounty && BROAD_RESTRICTION.test(includeText.trim())
  const includeTokens = isBroad ? null : expandPlaceTokens(includeText.replace(UTAH_COUNTY, ''))
  const excludeTokens = excludeText ? expandPlaceTokens(excludeText) : []

  let included = isBroad
    ? locations
    : locations.filter(l =>
      (utahCounty && UTAH_COUNTY_CITIES.has(cityFromAddress(l.address))) ||
      includeTokens.some(t => placeMatchesLocation(t, l)))

  if (excludeTokens.length) {
    included = included.filter(l => !excludeTokens.some(t => placeMatchesLocation(t, l)))
  }

  return included.length ? included : null
}

/**
 * Locations to show for a deal's "View on map" focus mode, or null if none
 * can be shown with confidence.
 */
export function getMapFocusLocations(deal) {
  if (!deal.locationRestriction) return deal.locations
  return matchLocationsToRestriction(deal.locations, deal.locationRestriction)
}

/**
 * The location a deal's "Get Directions" link should point to — nearest to
 * the user among the deal's honoring locations if several and userCoords
 * is known, otherwise the first match. Returns null if none can be shown
 * with confidence (same gate as getMapFocusLocations), so callers should
 * hide the Directions row entirely rather than fall back to deal.lat/lng.
 */
export function getDirectionsLocation(deal, userCoords) {
  const locations = getMapFocusLocations(deal)
  if (!locations?.length) return null
  if (locations.length === 1 || !userCoords) return locations[0]
  return getNearestLocation({ locations }, userCoords) ?? locations[0]
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
