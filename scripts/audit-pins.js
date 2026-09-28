// Checks every map pin against Google: is the business really at that spot,
// still open, and not a city-center or shared-spot fallback? Writes
// reports/pin-audit.md. Read-only unless --snap is passed.
//
//   node scripts/audit-pins.js                 (needs GOOGLE_MAPS_API_KEY in .env; ~750 requests)
//   node scripts/audit-pins.js --snap          (also moves pins 50-150 m off onto Google's exact spot)
//   DEALS_FILE=reports/card-import-2026-27.preview.json node scripts/audit-pins.js   (check an import first)
//
// Run it at every card switch, after the import. Fix anything under
// "Misplaced" or "Closed" by hand (dry run + approval, as with any deals.json edit).
import { readFileSync, writeFileSync } from 'node:fs'
import { cityFromAddress } from '../src/utils/dealHelpers.js'

const ROOT = new URL('../', import.meta.url)
const FILE = process.env.DEALS_FILE ?? 'src/data/deals.json'
const REPORT = 'reports/pin-audit.md'
const SNAP = process.argv.includes('--snap')
const REQUEST_CAP = 1500
const ON_BUILDING_M = 50
const NEAR_M = 150
const CITY_CENTER_M = 300
// Real businesses Google Maps doesn't list; their pins can't be checked here.
const NOT_ON_GOOGLE = ['Provo Canyon Adventures']

process.loadEnvFile(new URL('.env', ROOT))
const KEY = process.env.GOOGLE_MAPS_API_KEY
if (!KEY) throw new Error('GOOGLE_MAPS_API_KEY is not set in .env')

const km = (a, b) => {
  const r = d => d * Math.PI / 180
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}
const meters = (a, b) => Math.round(km(a, b) * 1000)
const STOP = ['the', 'and', 'utah', 'grill', 'cafe', 'pizza', 'company', 'co', 'restaurant', 'bar', 'kitchen', 'shop', 'store']
const words = s => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.includes(w))
const compact = s => s.toLowerCase().replace(/\.com\b/, '').replace(/[^a-z0-9]/g, '')
// "Dry Bar Comedy" is "DryBarComedy.com"; "Taste 117" is "Taste117".
const sameName = (ours, google) => words(ours).some(w => words(google).includes(w)) ||
  compact(google).includes(compact(ours)) || compact(ours).includes(compact(google))
const sleep = ms => new Promise(r => setTimeout(r, ms))

let requests = 0
async function google(url, init) {
  for (let attempt = 0; ; attempt++) {
    if (++requests > REQUEST_CAP) throw new Error(`request cap ${REQUEST_CAP} reached`)
    const json = await (await fetch(url, init)).json()
    if (!json.error && !json.error_message) return json
    if (attempt === 3) throw new Error(JSON.stringify(json.error ?? json.error_message))
    await sleep(2000 * (attempt + 1))
  }
}
async function searchPlaces(textQuery, near, radius, pageSize) {
  const json = await google('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.businessStatus',
    },
    body: JSON.stringify({ textQuery, pageSize, locationBias: { circle: { center: { latitude: near.lat, longitude: near.lng }, radius } } }),
  })
  return (json.places ?? []).map(p => ({
    name: p.displayName?.text ?? '', address: p.formattedAddress, status: p.businessStatus,
    lat: p.location.latitude, lng: p.location.longitude, m: meters(near, { lat: p.location.latitude, lng: p.location.longitude }),
  }))
}

// One pin per business per spot
const deals = JSON.parse(readFileSync(new URL(FILE, ROOT), 'utf8'))
const pins = new Map()
for (const d of deals.filter(d => d.active !== false)) {
  for (const l of d.locations ?? []) {
    if (l.lat == null || l.lng == null) continue
    pins.set(`${d.name}|${l.lat}|${l.lng}`, { name: d.name, lat: l.lat, lng: l.lng, address: l.address ?? '' })
  }
}

// Pass 1: "<business>, <address>" near the pin. Pass 2 (misses only): "<business> <city> UT", wider.
const all = [...pins.values()]
async function check(p) {
  const pass1 = await searchPlaces(p.address ? `${p.name}, ${p.address}` : `${p.name} Utah`, p, 3000, 5)
  let match = pass1.filter(g => sameName(p.name, g.name)).sort((a, b) => a.m - b.m)[0]
  if (!match || match.m > NEAR_M) {
    const pass2 = await searchPlaces(`${p.name.replace(/\.com$/i, '')} ${cityFromAddress(p.address) ?? ''} UT`, p, 5000, 20)
    const better = pass2.filter(g => sameName(p.name, g.name)).sort((a, b) => a.m - b.m)[0]
    if (better && (!match || better.m < match.m)) match = better
  }
  return { ...p, match, top: pass1[0] }
}
const results = []
for (let i = 0; i < all.length; i += 3) {
  results.push(...await Promise.all(all.slice(i, i + 3).map(check)))
  if (i % 150 === 0) console.log(`checked ${i}/${all.length}`)
}

// City centers, from Google Geocoding
const centers = {}
for (const c of new Set(results.map(r => cityFromAddress(r.address)).filter(Boolean))) {
  const json = await google(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(`${c}, UT`)}&key=${KEY}`)
  const g = json.results?.[0]
  if (g?.types.includes('locality')) centers[c] = g.geometry.location
}

const onBuilding = results.filter(r => r.match && r.match.m <= ON_BUILDING_M)
const slightlyOff = results.filter(r => r.match && r.match.m > ON_BUILDING_M && r.match.m <= NEAR_M)
const unchecked = results.filter(r => NOT_ON_GOOGLE.includes(r.name))
const misplaced = results.filter(r => !NOT_ON_GOOGLE.includes(r.name) && (!r.match || r.match.m > NEAR_M))
const closed = results.filter(r => r.match && r.match.m <= NEAR_M && r.match.status !== 'OPERATIONAL')
const nearCenter = results.filter(r => {
  const c = centers[cityFromAddress(r.address)]
  return c && meters(r, c) < CITY_CENTER_M && !(r.match && r.match.m <= ON_BUILDING_M)
})
const byCoord = {}
for (const r of results) (byCoord[`${r.lat.toFixed(4)},${r.lng.toFixed(4)}`] ??= new Set()).add(r.name)
const shared = Object.entries(byCoord).filter(([, names]) => names.size >= 3)

if (SNAP) {
  for (const r of slightlyOff) {
    for (const d of deals.filter(d => d.name === r.name)) {
      for (const l of [...d.locations, d]) if (l.lat === r.lat && l.lng === r.lng) Object.assign(l, { lat: r.match.lat, lng: r.match.lng })
    }
  }
  writeFileSync(new URL(FILE, ROOT), JSON.stringify(deals, null, 2) + '\n')
}

const row = r => `| ${r.name} | ${r.address || '(blank)'} | ${r.match ? `${r.match.m} m — ${r.match.name}, ${r.match.address}` : `no match (nearest place: ${r.top ? `${r.top.name}, ${r.top.m} m` : 'none'})`} |`
const table = rows => rows.length ? ['| Business | Our address | Google |', '|---|---|---|', ...rows.map(row)].join('\n') : '_None._'
writeFileSync(new URL(REPORT, ROOT), `# Pin audit

${new Date().toISOString().slice(0, 10)} · \`${FILE}\` · ${results.length} pins · ${requests} Google requests

| Result | Pins |
|---|---|
| On the building (within ${ON_BUILDING_M} m of Google's spot) | ${onBuilding.length} |
| Slightly off (${ON_BUILDING_M}–${NEAR_M} m, same business) | ${slightlyOff.length}${SNAP ? ' — snapped' : ''} |
| Misplaced or not found | ${misplaced.length} |
| Closed per Google | ${closed.length} |
| Near a city center and not confirmed on the building | ${nearCenter.length} |
| Spots shared by 3+ businesses | ${shared.length} |
| Not on Google, can't be checked | ${unchecked.length} |

## Misplaced or not found
Google can't find this business within ${NEAR_M} m of the pin. Usually the address is wrong or a duplicate of a store already on the map, or the store is gone. A "no match" whose nearest place is within ~25 m is usually fine (the business is inside that place, e.g. a Pizza Hut in a theater).

${table(misplaced)}

## Closed per Google
Move to \`closedLocations\` (see CLAUDE.md). "Temporarily closed" can be seasonal.

${results.length && closed.length ? closed.map(r => `- ${r.match.status} — ${r.name}, ${r.address}`).join('\n') : '_None._'}

## Slightly off
Right business and address; the pin is on the lot or elsewhere in the complex. \`--snap\` moves these onto Google's spot.

${table(slightlyOff)}

## Near a city center
Within ${CITY_CENTER_M} m of the city's center point and not confirmed on the building — the pattern a failed geocode leaves.

${table(nearCenter)}

## Spots shared by 3+ businesses
Fine when it's one building (a food court, a campus center); otherwise a fallback.

${shared.length ? shared.map(([c, names]) => `- ${c}: ${[...names].join(', ')}`).join('\n') : '_None._'}

## Not on Google
${unchecked.length ? unchecked.map(r => `- ${r.name}, ${r.address}`).join('\n') : '_None._'}
`)
console.log(`${results.length} pins: ${onBuilding.length} on the building, ${slightlyOff.length} slightly off${SNAP ? ' (snapped)' : ''}, ${misplaced.length} misplaced, ${closed.length} closed. ${requests} requests. Wrote ${REPORT}`)
