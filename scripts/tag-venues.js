// Tags stores that are inside a search venue (UVU, BYU, the malls — see
// SEARCH_VENUES in src/utils/dealHelpers.js) with `"venue": "<name>"`, so a
// search for "UVU" or "University Place" finds them. A store is tagged only
// when Google says it is located inside that venue — never from the street
// address alone. Hand fixes live in scripts/venue-overrides.json and are
// applied every run, so re-tagging each card year keeps them.
//
//   node scripts/tag-venues.js           (dry run → reports/venue-tags.md; needs GOOGLE_MAPS_API_KEY in .env)
//   node scripts/tag-venues.js --write   (also writes the tags to deals.json)
import { readFileSync, writeFileSync } from 'node:fs'
import { SEARCH_VENUES, cityFromAddress } from '../src/utils/dealHelpers.js'

const ROOT = new URL('../', import.meta.url)
const FILE = process.env.DEALS_FILE ?? 'src/data/deals.json'
const REPORT = 'reports/venue-tags.md'
const WRITE = process.argv.includes('--write')
const REQUEST_CAP = 800

// What Google calls each venue, or a building on it.
const GOOGLE_NAMES = {
  'UVU': /utah valley university|\buvu\b|sorensen student center|uccu center/i,
  'BYU': /brigham young university|\bbyu\b|wilkinson (student )?center|cougareat/i,
  'University Place': /university place/i,
  'Provo Towne Centre': /provo towne cent(re|er)/i,
  'The Shops at Riverwoods': /riverwoods/i,
  'Traverse Mountain': /outlets at traverse mountain|traverse mountain outlets/i,
  'Thanksgiving Point': /thanksgiving point/i,
  'Fashion Place': /fashion place/i,
}

process.loadEnvFile(new URL('.env', ROOT))
const KEY = process.env.GOOGLE_MAPS_API_KEY
if (!KEY) throw new Error('GOOGLE_MAPS_API_KEY is not set in .env')

const km = (a, b) => {
  const r = d => d * Math.PI / 180
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}
const STOP = ['the', 'and', 'utah', 'grill', 'cafe', 'pizza', 'company', 'co', 'restaurant', 'bar', 'kitchen', 'shop', 'store']
const words = s => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.includes(w))
const compact = s => s.toLowerCase().replace(/\.com\b/, '').replace(/[^a-z0-9]/g, '')
const sameName = (ours, google) => words(ours).some(w => words(google).includes(w)) ||
  compact(google).includes(compact(ours)) || compact(ours).includes(compact(google))
const sleep = ms => new Promise(r => setTimeout(r, ms))

let requests = 0
async function google(url, init) {
  for (let attempt = 0; ; attempt++) {
    if (++requests > REQUEST_CAP) throw new Error(`request cap ${REQUEST_CAP} reached`)
    const json = await (await fetch(url, init)).json()
    if (!json.error) return json
    if (attempt === 3) throw new Error(JSON.stringify(json.error))
    await sleep(2000 * (attempt + 1))
  }
}
const headers = fields => ({ 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': fields })

// Stores in the venues' cities, once per business + address
const deals = JSON.parse(readFileSync(new URL(FILE, ROOT), 'utf8'))
const venueCities = new Set(SEARCH_VENUES.map(v => v.city))
const stores = new Map()
for (const d of deals.filter(d => d.active !== false)) {
  for (const l of d.locations ?? []) {
    if (l.address && l.lat != null && venueCities.has(cityFromAddress(l.address))) stores.set(`${d.name}|${l.address}`, { name: d.name, address: l.address, lat: l.lat, lng: l.lng })
  }
}

// Google's place for each store, and what it says the store is inside
const containerNames = new Map()
async function containerName(id) {
  if (!containerNames.has(id)) {
    const json = await google(`https://places.googleapis.com/v1/places/${id}`, { headers: headers('displayName') })
    containerNames.set(id, json.displayName?.text ?? '')
  }
  return containerNames.get(id)
}
const found = []
const all = [...stores.values()]
for (let i = 0; i < all.length; i += 3) {
  await Promise.all(all.slice(i, i + 3).map(async s => {
    const json = await google('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: headers('places.displayName,places.formattedAddress,places.location,places.containingPlaces'),
      body: JSON.stringify({ textQuery: `${s.name}, ${s.address}`, pageSize: 5, locationBias: { circle: { center: { latitude: s.lat, longitude: s.lng }, radius: 1000 } } }),
    })
    const g = (json.places ?? []).find(p => sameName(s.name, p.displayName?.text ?? '') && km(s, { lat: p.location.latitude, lng: p.location.longitude }) < 0.15)
    if (!g) return
    const inside = await Promise.all((g.containingPlaces ?? []).map(c => containerName(c.id)))
    const locatedIn = g.formattedAddress?.match(/Located in: ([^,]+)/)?.[1]
    for (const [venue, re] of Object.entries(GOOGLE_NAMES)) {
      const hit = [...inside, locatedIn].find(n => n && re.test(n))
      if (hit) found.push({ ...s, venue, because: `inside "${hit}"` })
    }
  }))
  if (i % 60 === 0) console.log(`checked ${i}/${all.length}`)
}

// Hand fixes
const overrides = JSON.parse(readFileSync(new URL('scripts/venue-overrides.json', ROOT), 'utf8'))
const key = t => `${t.venue}|${t.name}|${t.address}`
const removed = new Set(overrides.remove.map(key))
const tags = [...found.filter(t => !removed.has(key(t))), ...overrides.add.map(t => ({ ...t, because: 'venue-overrides.json' }))]

if (WRITE) {
  const byStore = new Map(tags.map(t => [`${t.name}|${t.address}`, t.venue]))
  for (const d of deals) for (const l of d.locations ?? []) {
    delete l.venue
    const venue = byStore.get(`${d.name}|${l.address}`)
    if (venue) l.venue = venue
  }
  writeFileSync(new URL(FILE, ROOT), JSON.stringify(deals, null, 2) + '\n')
}

const sections = SEARCH_VENUES.map(({ venue }) => {
  const rows = tags.filter(t => t.venue === venue).sort((a, b) => a.name.localeCompare(b.name))
  return `## ${venue} (${rows.length})\n\n${rows.length ? rows.map(t => `- **${t.name}** — ${t.address} _(${t.because})_`).join('\n') : '_No stores tagged._'}`
})
writeFileSync(new URL(REPORT, ROOT), `# Venue tags\n\n${new Date().toISOString().slice(0, 10)} · ${all.length} stores checked in ${[...venueCities].join(', ')} · ${requests} Google requests${WRITE ? ' · written to deals.json' : ' · dry run'}\n\n${sections.join('\n\n')}\n`)
console.log(`${tags.length} stores tagged across ${SEARCH_VENUES.length} venues. ${requests} requests. Wrote ${REPORT}${WRITE ? ' and deals.json' : ''}`)
