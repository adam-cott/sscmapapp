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

// "Participating Locations" and "All Wasatch Front" mean every store on the
// Wasatch Front — Utah, Salt Lake, Davis and Weber counties up to Ogden — plus
// any city named alongside (Adam, Sept 2026). Heber, Park City, Tooele and
// Nephi stores don't count.
const WASATCH_FRONT = /\bparticipating\b|\b(all )?wasatch front\b/i
const WASATCH_FRONT_CITIES = new Set([
  ...UTAH_COUNTY_CITIES,
  'Bluffdale', 'Cottonwood Heights', 'Draper', 'Herriman', 'Holladay', 'Kearns', 'Magna', 'Midvale',
  'Millcreek', 'Murray', 'Riverton', 'Salt Lake City', 'Sandy', 'South Jordan', 'South Salt Lake',
  'Taylorsville', 'West Jordan', 'West Valley City',
  'Bountiful', 'Centerville', 'Clearfield', 'Clinton', 'Farmington', 'Fruit Heights', 'Kaysville',
  'Layton', 'North Salt Lake', 'Syracuse', 'West Bountiful', 'Woods Cross',
  'North Ogden', 'Ogden', 'Riverdale', 'Roy', 'South Ogden', 'Washington Terrace',
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
    !!VENUES[placeToken]?.test(location.address) ||
    SEARCH_VENUES.some(v => v.venue === location.venue && v.terms.includes(placeToken))
}

/**
 * Filters a business's locations[] down to the ones a locationRestriction
 * actually names. Returns null if nothing can be confidently matched.
 */
export function matchLocationsToRestriction(locations, restrictionText) {
  if (!restrictionText) return locations
  const { includeText, excludeText } = splitRestrictionClauses(restrictionText)
  const utahCounty = UTAH_COUNTY.test(includeText)
  const wasatchFront = WASATCH_FRONT.test(includeText)
  const isBroad = !utahCounty && !wasatchFront && BROAD_RESTRICTION.test(includeText.trim())
  const includeTokens = isBroad ? null : expandPlaceTokens(includeText.replace(UTAH_COUNTY, '').replace(WASATCH_FRONT, ''))
  const excludeTokens = excludeText ? expandPlaceTokens(excludeText) : []

  let included = isBroad
    ? locations
    : locations.filter(l =>
      (utahCounty && UTAH_COUNTY_CITIES.has(cityFromAddress(l.address))) ||
      (wasatchFront && WASATCH_FRONT_CITIES.has(cityFromAddress(l.address))) ||
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

// Location search: a query naming a city or venue ("American Fork",
// "UVU pizza") matches deals honored at a store there. See
// specs/location-search-plan.md for the rules.

// Venues are matched through the `venue` tag on each store (set by
// scripts/tag-venues.js); `city` is the fallback for deals that only name the
// venue in their valid-at text.
export const SEARCH_VENUES = [
  { venue: 'UVU', city: 'Orem', terms: ['uvu', 'utah valley university'] },
  { venue: 'BYU', city: 'Provo', terms: ['byu', 'brigham young university'] },
  { venue: 'University Place', city: 'Orem', terms: ['university place'] },
  { venue: 'Provo Towne Centre', city: 'Provo', terms: ['provo towne centre', 'towne centre'] },
  { venue: 'The Shops at Riverwoods', city: 'Provo', terms: ['riverwoods', 'shops at riverwoods', 'the shops at riverwoods'] },
  { venue: 'Traverse Mountain', city: 'Lehi', terms: ['traverse mountain'] },
  { venue: 'Thanksgiving Point', city: 'Lehi', terms: ['thanksgiving point'] },
  { venue: 'Fashion Place', city: 'Murray', terms: ['fashion place'] },
]

// Only count when followed by a space ("pg pizza"), so "pg" or "pgs" alone don't.
const NICKNAMES = { slc: 'Salt Lake City', af: 'American Fork', pg: 'Pleasant Grove', sf: 'Spanish Fork', em: 'Eagle Mountain' }

export function searchCities(deals) {
  const cities = new Set()
  for (const d of deals) for (const l of d.locations ?? []) {
    const c = cityFromAddress(l.address)
    if (c && !/\d|^UT\b/.test(c)) cities.add(c)
  }
  return [...cities]
}

/**
 * Finds the place a query names. Returns null, or
 * { full: true, places: [one place], rest: 'other words' } for a whole name or
 * nickname, or { full: false, places: [...], rest: '' } for a partial name
 * (the query is the start of a name, at least 40% of it and 3+ letters).
 * A place is { city } or { venue, city }.
 */
export function parsePlaceQuery(query, cities) {
  const spaced = query.toLowerCase().replace(/\s+/g, ' ').replace(/^ /, '')
  const q = spaced.trim()
  if (!q) return null
  const places = [
    ...cities.map(c => ({ place: { city: c }, terms: [c.toLowerCase()] })),
    ...SEARCH_VENUES.map(v => ({ place: { venue: v.venue, city: v.city }, terms: v.terms })),
  ]

  let best = null
  for (const { place, terms } of places) for (const t of terms) {
    if (!` ${q} `.includes(` ${t} `) || (best && best.term.length >= t.length)) continue
    best = { place, term: t }
  }
  const nickname = spaced.match(/(?:^| )(slc|af|pg|sf|em) /)
  if (!best && nickname) best = { place: { city: NICKNAMES[nickname[1]] }, term: nickname[1] }
  if (best) {
    const rest = ` ${q} `.replace(` ${best.term} `, ' ').trim()
    return { full: true, places: [best.place], rest }
  }

  if (q.length < 3) return null
  const partial = places.filter(({ terms }) => terms.some(t => t.startsWith(q) && q.length >= 0.4 * t.length)).map(p => p.place)
  return partial.length ? { full: false, places: partial, rest: '' } : null
}

// Only the "valid at" part of a restriction counts — "All Utah County,
// excluding UVU" must not come up for "UVU".
function textMatches(d, q) {
  return d.name.toLowerCase().includes(q) ||
    d.deal.title.toLowerCase().includes(q) ||
    (d.deal.description || '').toLowerCase().includes(q) ||
    splitRestrictionClauses(d.locationRestriction || '').includeText.toLowerCase().includes(q) ||
    d.category.includes(q) ||
    (d.tags || []).some(t => t.toLowerCase().includes(q))
}

// The deal's honoring stores at a place. A deal whose valid-at text names the
// venue (Wendy's "Traverse Mountain") falls back to its stores in the venue's
// city, then to all its honoring stores, so it never ends up with none.
function storesAt(d, place) {
  const honoring = getMapFocusLocations(d) ?? []
  if (!place.venue) return honoring.filter(l => cityFromAddress(l.address) === place.city)
  const tagged = honoring.filter(l => l.venue === place.venue)
  if (tagged.length) return tagged
  const v = SEARCH_VENUES.find(x => x.venue === place.venue)
  const include = d.locationRestriction ? splitRestrictionClauses(d.locationRestriction).includeText.toLowerCase() : ''
  if (!v.terms.some(t => include.includes(t))) return []
  const inCity = honoring.filter(l => cityFromAddress(l.address) === place.city)
  return inCity.length ? inCity : honoring
}

/**
 * Filter deals by active categories and search query. A deal found through a
 * place comes back as a copy whose `locations` are only its stores there (same
 * id; the original is untouched), so pins, distance and directions follow.
 */
export function filterDeals(deals, searchQuery, activeCategories, cities = searchCities(deals)) {
  let result = deals

  if (activeCategories.length > 0) {
    result = result.filter(d => activeCategories.includes(d.category))
  }

  const q = searchQuery.toLowerCase().replace(/\s+/g, ' ').trim()
  if (!q) return result

  const match = parsePlaceQuery(searchQuery, cities)
  return result.flatMap(d => {
    if (match) {
      const stores = [...new Set(match.places.flatMap(p => storesAt(d, p)))]
      if (stores.length && (!match.rest || textMatches(d, match.rest))) return [{ ...d, locations: stores }]
    }
    return textMatches(d, q) ? [d] : []
  })
}
