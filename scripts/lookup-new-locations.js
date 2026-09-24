/* global process */
// Looks up locations for businesses the card import couldn't carry over from
// last year (new businesses, plus LOOKUP_AGAIN), via Google Places Text Search.
// Writes data-archive/new-locations-2026-27.json, which scripts/import-card.js
// reads. Never touches deals.json.
//
//   node scripts/import-card.js              (builds reports/card-import-2026-27.preview.json)
//   node scripts/lookup-new-locations.js     (needs GOOGLE_MAPS_API_KEY in .env)
import { readFileSync, writeFileSync } from 'node:fs'
import { BROAD_RESTRICTION, splitRestrictionClauses, expandPlaceTokens } from '../src/utils/dealHelpers.js'

const ROOT = new URL('../', import.meta.url)
const PREVIEW = 'reports/card-import-2026-27.preview.json'
const OUTPUT = 'data-archive/new-locations-2026-27.json'
const REQUEST_CAP = 150
// Continuing businesses whose saved locations don't include the cities the card names.
const LOOKUP_AGAIN =['Game Grid', 'High Country Adventure', 'The Picklr']

process.loadEnvFile(new URL('.env', ROOT))
const KEY = process.env.GOOGLE_MAPS_API_KEY
if (!KEY) throw new Error('GOOGLE_MAPS_API_KEY is not set in .env')

const PROVO = { lat: 40.2969, lng: -111.6942 }
const MAX_KM = 80 // Utah County plus the Salt Lake valley; excludes St. George, Logan, etc.

const km = (a, b) => {
  const r = d => d * Math.PI / 180
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}
const words = s => s.toLowerCase().replace(/[’']s\b/g, 's').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
  .filter(w => w.length > 1 && !['the', 'and', 'co', 'of'].includes(w))
// Same business if Google's name contains our first distinctive word AND either
// covers 2/3 of our name or is a shortened form of it ("Konala" for
// "Konala Protein Bowls & Salads"). Rejects "Blaze Pizza" for "MOD Pizza".
const sameBusiness = (business, place) => {
  const b = words(business), p = words(place)
  if (!b.length || !p.includes(b[0])) return false
  return p[0] === b[0] || b.filter(w => p.includes(w)).length / b.length >= 0.67 || p.every(w => b.includes(w))
}
// Sub-brands whose Google results mix in the parent brand.
const REQUIRE_IN_NAME = { 'Buffalo Wild Wings GO': /\bGO\b/, "Magleby's Fresh": /\bFresh\b/i }

let requests = 0
async function search(textQuery) {
  if (requests >= REQUEST_CAP) throw new Error(`request cap ${REQUEST_CAP} reached`)
  requests++
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.internationalPhoneNumber,places.businessStatus,places.websiteUri',
    },
    body: JSON.stringify({ textQuery, pageSize: 20, locationBias: { circle: { center: { latitude: PROVO.lat, longitude: PROVO.lng }, radius: 50000 } } }),
  })
  const json = await res.json()
  if (json.error) throw new Error(`${json.error.status}: ${json.error.message}`)
  return json.places ?? []
}

const deals = JSON.parse(readFileSync(new URL(PREVIEW, ROOT), 'utf8')).filter(d => d.active !== false)
const targets = new Map()
for (const d of deals) {
  if (d.locations.length && !LOOKUP_AGAIN.includes(d.name)) continue
  const t = targets.get(d.name) ?? { cities: new Set() }
  const r = d.locationRestriction
  if (r && !BROAD_RESTRICTION.test(splitRestrictionClauses(r).includeText.trim()))
    expandPlaceTokens(splitRestrictionClauses(r).includeText).forEach(c => t.cities.add(c))
  targets.set(d.name, t)
}

const out = {}
for (const [name, { cities }] of targets) {
  const queries = [`${name} Utah`, ...[...cities].map(c => `${name} ${c} UT`)]
  const found = new Map()
  const rejected = []
  let website = null
  for (const q of queries) {
    for (const p of await search(q)) {
      const loc = { lat: p.location?.latitude, lng: p.location?.longitude }
      const placeName = p.displayName?.text ?? ''
      const why = !loc.lat ? 'no coords'
        : !/, UT \d{5}/.test(p.formattedAddress ?? '') ? 'not in Utah'
        : km(PROVO, loc) > MAX_KM ? `${Math.round(km(PROVO, loc))} km from Provo`
        : p.businessStatus && p.businessStatus !== 'OPERATIONAL' ? p.businessStatus
        : !sameBusiness(name, placeName) || (REQUIRE_IN_NAME[name] && !REQUIRE_IN_NAME[name].test(placeName)) ? `name "${placeName}"`
        : null
      if (why) { rejected.push(`${placeName} — ${p.formattedAddress} (${why})`); continue }
      website ??= p.websiteUri ?? null
      const key = `${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}`
      if (!found.has(key)) found.set(key, {
        lat: loc.lat, lng: loc.lng,
        address: p.formattedAddress,
        phone: p.internationalPhoneNumber ? '+' + p.internationalPhoneNumber.replace(/\D/g, '') : null,
        googleName: placeName,
      })
    }
  }
  out[name] = { replaceExisting: LOOKUP_AGAIN.includes(name), website, queries, locations: [...found.values()], rejected: [...new Set(rejected)] }
  console.log(`${String(found.size).padStart(3)}  ${name}`)
}

writeFileSync(new URL(OUTPUT, ROOT), JSON.stringify(out, null, 2) + '\n')
console.log(`\n${targets.size} businesses, ${requests} requests. Wrote ${OUTPUT}`)
