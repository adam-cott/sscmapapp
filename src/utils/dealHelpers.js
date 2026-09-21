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
// them — and locations[] isn't filtered to match. The functions below
// resolve a restriction's free text (e.g. "Lehi & Bluffdale",
// "All Ut Cnty excl. EM & SF") down to the specific locations it names, so
// "View on map" only shows pins we're confident actually honor the deal.
// See reports/map-focus-restrictions-report.md for the full data audit
// this logic was validated against (dated 2026-09-21).

const PLACE_ABBREVIATIONS = {
  sf: 'spanish fork', pg: 'pleasant grove', em: 'eagle mountain', wj: 'west jordan',
  af: 'american fork', saratoga: 'saratoga springs', mtn: 'mountain', mt: 'mountain',
  ut: 'utah', cnty: 'county', crs: 'crossing',
}

// Wording that means "every location honors this deal" rather than naming
// specific cities — "All ...", any "county"-level phrasing, "Participating
// Locations", "Same Locations", or a bare "Northern UT".
export const BROAD_RESTRICTION = /^all\b|county|participating locs?\.?|participating locations?|same locations?|^northern ut\b/i

// Splits "All Ut Cnty excl. EM & SF" into an include clause and an exclude
// clause; restrictions with no exclusion wording are all include, no exclude.
const EXCLUSION_SPLIT = /\b(excl\.?|exclude[sd]?|except|not)\b/i

export function splitRestrictionClauses(restrictionText) {
  const parts = restrictionText.split(EXCLUSION_SPLIT)
  if (parts.length === 1) return { includeText: restrictionText, excludeText: null }
  return { includeText: parts[0], excludeText: parts.slice(2).join(' ') }
}

function normalizePlace(text) {
  return text.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()
}

// Filler words that ride along with a place name but aren't part of it
// ("Saratoga Only", "SF & partic. locs") — stripped wherever they appear
// inside a token, not just when a token is exactly one of these.
const FILLER_WORD = /\b(only|locs?|locations?|partic\w*|stores?)\b/gi

// Expands abbreviations word-by-word (not just whole-token) so compound
// phrases like "Eagle Mtn" resolve to "eagle mountain", not just a bare "Mtn".
function expandAbbreviations(token) {
  return token.split(' ').map(w => PLACE_ABBREVIATIONS[w] || w).join(' ')
}

// Breaks a restriction clause into place names: splits on "&", ",", "and",
// "/", "-", strips filler words ("Only", "Locations", "Participating",
// etc.), and expands known abbreviations (SF, PG, EM, Mtn, ...).
export function expandPlaceTokens(text) {
  return text.toLowerCase()
    .replace(/[().]/g, ' ')
    .split(/&|,|\band\b|\/|-/)
    .map(t => t.replace(FILLER_WORD, ' ').trim())
    .filter(Boolean)
    .map(expandAbbreviations)
    .map(normalizePlace)
    .filter(Boolean)
}

export function cityFromAddress(address) {
  if (!address) return null
  const parts = address.split(',').map(s => s.trim())
  return parts.length >= 2 ? parts[1] : null
}

function placeMatchesCity(placeToken, city) {
  const c = normalizePlace(city || '')
  return !!c && (c.includes(placeToken) || placeToken.includes(c))
}

/**
 * Filters a business's locations[] down to the ones a locationRestriction
 * actually names. Returns null if nothing can be confidently matched.
 */
export function matchLocationsToRestriction(locations, restrictionText) {
  if (!restrictionText) return locations
  const { includeText, excludeText } = splitRestrictionClauses(restrictionText)
  const isBroad = BROAD_RESTRICTION.test(includeText.trim())
  const includeTokens = isBroad ? null : expandPlaceTokens(includeText)
  const excludeTokens = excludeText ? expandPlaceTokens(excludeText) : []

  let included = isBroad
    ? locations
    : locations.filter(l => {
      const city = cityFromAddress(l.address)
      return city && includeTokens.some(t => placeMatchesCity(t, city))
    })

  if (excludeTokens.length) {
    included = included.filter(l => {
      const city = cityFromAddress(l.address)
      return !(city && excludeTokens.some(t => placeMatchesCity(t, city)))
    })
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
