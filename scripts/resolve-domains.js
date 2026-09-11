#!/usr/bin/env node
// Resolve one website domain per business for later logo fetching.
// deals.json is READ-ONLY here. Results go to scripts/domains-output.json.
//
// SKU: Text Search Enterprise — places.websiteUri is an Enterprise-tier field,
// and Google bills the whole request at the highest tier in the mask.
// Free allowance is 1,000 Enterprise calls/month.
//
// Usage (PowerShell):
//   $env:GOOGLE_MAPS_API_KEY="your_key"
//   node scripts/resolve-domains.js --max-calls=150            # dry run — no calls, no writes
//   node scripts/resolve-domains.js --max-calls=150 --live     # real calls, writes output

import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Hard ceiling. --max-calls can never exceed this without editing the file.
const REQUEST_CAP = 300

const DELAY_MS = 200
const MAX_RETRIES = 3
const SKU = 'text_search_enterprise'
const MONTHLY_ALLOWANCE = 1000

const DEALS_PATH = path.join(__dirname, '../src/data/deals.json')
const OUTPUT_PATH = path.join(__dirname, 'domains-output.json')
const CACHE_PATH = path.join(__dirname, '.domains-cache.json')
const USAGE_PATH = path.join(__dirname, '.places-usage.json')

// Minimum mask for the job. Do not add fields — rating/photos/phone/hours are
// not needed and displayName+location are already free once websiteUri sets
// the tier to Enterprise.
const FIELD_MASK = 'places.id,places.websiteUri,places.displayName,places.location'

const CATEGORY_HINTS = {
  pizza: 'pizza',
  restaurants: 'restaurant',
  sandwiches: 'sandwich',
  treats: 'cafe dessert',
  free: 'restaurant',
  entertainment: 'entertainment',
  retail: 'shop store',
}

// Hand-approved. Never hit the API, never run the name-vs-domain check.
const OVERRIDES = {
  "Jiffy Lube": "jiffylube.com",
  "Costa Vida": "costavida.com",
  "Chili's": "chilis.com",
  "Denny's": "dennys.com",
  "Domino's": "dominos.com",
  "Dairy Queen": "dairyqueen.com",
  "McDonald's": "mcdonalds.com",
  "Wendy's": "wendys.com",
  "Wingstop": "wingstop.com",
  "ZAGG": "zagg.com",
  "Arby's": "arbys.com",
  "Papa Murphy's": "papamurphys.com",
  "Cold Stone Creamery": "coldstonecreamery.com",
  "Freddy's Frozen Custard & Steakburgers": "freddysusa.com",
  "Jamba Juice": "jamba.com",
  "Jersey Mikes": "jerseymikes.com",
  "Marco's Pizza": "marcos.com",
  "Pizza Hut": "pizzahut.com",
  "Rocky Mountain Chocolate Factory": "rockymountainchocolate.com",
  "Twisted Sugar": "twistedsugar.com",
  "Grease Monkey": "greasemonkeyauto.com",
  "Taco Time": "tacotime.com",
  "Great Harvest Bread Co.": "greatharvest.com",
  "Culver's": "culvers.com",
  "Carl's Jr": "carlsjr.com",
  "Cinnabon": "cinnabon.com",
  "Jack in the Box": "jackinthebox.com",
  "Nothing Bundt Cakes": "nothingbundtcakes.com",
  "The Picklr": "thepicklr.com",
  "Tropical Smoothie Cafe": "tropicalsmoothiecafe.com",
  "Auntie Anne's": "auntieannes.com",
  "Color Me Mine": "colormemine.com",
  "Daylight Donuts": "daylightdonuts.com",
  "El Pollo Loco": "elpolloloco.com",
  "Sonic": "sonicdrivein.com",
  "Village Inn": "villageinn.com",
  "Buffalo Wild Wings": "buffalowildwings.com",
  "Mooyah": "mooyah.com",
  "Rodizio Grill": "rodiziogrill.com",
  "Sub Zero Ice Cream": "subzeroicecream.com",
  "Bahama Buck's": "bahamabucks.com",
  "Bubbakoo's Burritos": "bubbakoos.com",
  "Honey Baked Ham": "honeybaked.com",
  "Parlor Doughnuts": "parlordoughnuts.com",
  "Wayback Burgers": "waybackburgers.com",
  "Yogurtland": "yogurtland.com",
  "Baskin Robbins": "baskinrobbins.com",
  "Bruster's Ice Cream": "brusters.com",
  "Carrabba's Italian Grill": "carrabbas.com",
  "Cinnaholic": "cinnaholic.com",
  "DryBarComedy.com": "drybarcomedy.com",
  "Golden Corral Buffet": "goldencorral.com",
  "HiddenHunts.com": "hiddenhunts.com",
  "Nautical Bowls": "nauticalbowls.com",
  "Outback Steakhouse": "outback.com",
  "Pita Pit": "pitapitusa.com",
}

const SOCIAL_DOMAINS = new Set([
  'facebook.com', 'fb.com', 'instagram.com', 'twitter.com', 'x.com',
  'tiktok.com', 'youtube.com', 'linktr.ee', 'linktree.com', 'linkedin.com',
])

const AGGREGATOR_DOMAINS = new Set([
  'doordash.com', 'ubereats.com', 'grubhub.com', 'postmates.com', 'seamless.com',
  'toasttab.com', 'toast.com', 'square.site', 'squareup.com', 'clover.com',
  'chownow.com', 'slicelife.com', 'olo.com', 'opentable.com', 'resy.com',
  'ezcater.com', 'menufy.com', 'beyondmenu.com', 'allmenus.com', 'singleplatform.com',
  'yelp.com', 'tripadvisor.com', 'google.com', 'business.site',
])

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'of', 'co', 'company', 'inc', 'llc', 'ltd',
  'cafe', 'grill', 'restaurant', 'bar', 'kitchen', 'house', 'store', 'shop',
  'center', 'centre', 'utah', 'provo', 'orem',
])

const DOMAIN_PREFIXES = ['www', 'order', 'shop', 'get', 'eat', 'my']

const MULTI_PART_SUFFIXES = new Set([
  'co.uk', 'com.au', 'co.nz', 'co.jp', 'com.br', 'co.za', 'org.uk', 'net.au', 'com.mx',
])

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function extractCity(address) {
  const parts = address.split(',')
  if (parts.length < 2) return 'Utah County'
  const words = parts[1].trim().split(' ').filter(Boolean)
  while (words.length > 1) {
    const last = words[words.length - 1]
    if (/^\d{5}$/.test(last) || /^[A-Z]{2}$/.test(last)) words.pop()
    else break
  }
  const city = words.join(' ').trim()
  return city.length > 0 ? city : 'Utah County'
}

function normalizeName(str) {
  return str.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(Boolean)
}

function nameSimilarityScore(bizName, resultName) {
  const bizWords = normalizeName(bizName)
  const resultWords = new Set(normalizeName(resultName))
  if (bizWords.length === 0) return 0
  const pct = bizWords.filter((w) => resultWords.has(w)).length / bizWords.length
  if (pct >= 0.8) return 2
  if (pct >= 0.5) return 1
  return 0
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Max 4 (name 2 + distance 2). fetch-phones.js scored to 5 using a phone
// field we deliberately exclude from the mask, so thresholds shift down one.
function scoreResult(place, bizName, targetLat, targetLng) {
  const namePts = nameSimilarityScore(bizName, place.displayName?.text || '')
  const lat = place.location?.latitude
  const lng = place.location?.longitude
  const distanceMeters = (lat != null && lng != null)
    ? haversineMeters(targetLat, targetLng, lat, lng)
    : Infinity
  const distPts = distanceMeters <= 100 ? 2 : distanceMeters <= 300 ? 1 : 0
  return {
    score: namePts + distPts,
    distanceMeters: distanceMeters === Infinity ? null : Math.round(distanceMeters),
  }
}

function pickBest(places, bizName, targetLat, targetLng) {
  if (!places || places.length === 0) return null
  let best = null
  let bestScore = -1
  for (const p of places) {
    const { score, distanceMeters } = scoreResult(p, bizName, targetLat, targetLng)
    if (score > bestScore) {
      bestScore = score
      best = { ...p, _score: score, _distanceMeters: distanceMeters }
    }
  }
  return best
}

function confidenceOf(best) {
  if (!best) return 'NOT_FOUND'
  if (best._score >= 3) return 'HIGH_CONFIDENCE'
  if (best._score === 2) return 'LOW_CONFIDENCE'
  return 'NOT_FOUND'
}

export function registrableDomain(rawUrl) {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, '')
    const parts = host.split('.')
    if (parts.length <= 2) return host
    const lastTwo = parts.slice(-2).join('.')
    return MULTI_PART_SUFFIXES.has(lastTwo) ? parts.slice(-3).join('.') : lastTwo
  } catch {
    return null
  }
}

function nameKeyTokens(name) {
  return name.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t))
}

function domainKey(domain) {
  let key = domain.split('.')[0].replace(/[^a-z0-9]/g, '')
  for (const p of DOMAIN_PREFIXES) {
    if (key.startsWith(p) && key.length - p.length >= 3) {
      key = key.slice(p.length)
      break
    }
  }
  return key
}

function bigrams(s) {
  const out = []
  for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2))
  return out
}

function diceCoefficient(a, b) {
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0
  const A = bigrams(a)
  const B = bigrams(b)
  const counts = new Map()
  for (const g of A) counts.set(g, (counts.get(g) || 0) + 1)
  let overlap = 0
  for (const g of B) {
    const c = counts.get(g) || 0
    if (c > 0) {
      overlap++
      counts.set(g, c - 1)
    }
  }
  return (2 * overlap) / (A.length + B.length)
}

// Second, independent signal from the Google match score. Every rule can only
// clear a row, never condemn it — a false SUSPICIOUS costs one glance, a missed
// one ships a wrong logo. Token intersection is useless here because domains
// have no word boundaries ({papa,murphys} never intersects {papamurphys}).
export function nameMatchesDomain(name, domain) {
  const tokens = nameKeyTokens(name)
  const nameKey = tokens.join('')
  const domKey = domainKey(domain)
  if (!nameKey || !domKey) return { matched: false, rule: null, dice: 0 }

  if (domKey.includes(nameKey) || nameKey.includes(domKey)) {
    return { matched: true, rule: 'containment', dice: null }
  }
  for (const t of tokens) {
    if (t.length >= 4 && domKey.includes(t)) return { matched: true, rule: `token:${t}`, dice: null }
  }
  const acronym = tokens.map((t) => t[0]).join('')
  if (acronym.length >= 2 && acronym === domKey) {
    return { matched: true, rule: 'acronym', dice: null }
  }
  const dice = Number(diceCoefficient(nameKey, domKey).toFixed(2))
  if (dice >= 0.45) return { matched: true, rule: `dice:${dice}`, dice }
  return { matched: false, rule: null, dice }
}

function monthKey() {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function readJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return fallback
  }
}

function readUsage() {
  const usage = readJson(USAGE_PATH, null)
  if (usage && usage.months) return usage
  return {
    _note: 'Shared Google Places call tally, keyed by UTC calendar month then SKU tier. Any script that calls Places should add its counts here. Only scripts that write to this file are reflected.',
    months: {},
  }
}

function usedThisMonth(usage) {
  return usage.months[monthKey()]?.[SKU] ?? 0
}

function recordUsage(usage, count) {
  const m = monthKey()
  usage.months[m] = usage.months[m] || {}
  usage.months[m][SKU] = (usage.months[m][SKU] || 0) + count
  fs.writeFileSync(USAGE_PATH, JSON.stringify(usage, null, 2))
}

let callsMade = 0
let budget = 0
const API_KEY = process.env.GOOGLE_MAPS_API_KEY

async function placesSearch(query, lat, lng, radius) {
  if (callsMade >= budget) return { places: null, error: 'BUDGET_EXHAUSTED' }
  callsMade++
  console.log(`    [api call ${callsMade}/${budget}] ${query}`)

  const body = {
    textQuery: query,
    locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius } },
    maxResultCount: 5,
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify(body),
      })

      if (res.status === 401 || res.status === 403) {
        console.error(`\nFatal: ${res.status} — ${(await res.text()).slice(0, 200)}`)
        process.exit(1)
      }
      if (res.status === 429 || res.status >= 500) {
        const wait = DELAY_MS * 4 * attempt
        console.log(`      ${res.status} — backing off ${wait}ms (attempt ${attempt}/${MAX_RETRIES})`)
        await sleep(wait)
        continue
      }
      const data = await res.json()
      return { places: data.places ?? [], error: null }
    } catch (e) {
      const wait = DELAY_MS * 4 * attempt
      console.log(`      network error: ${e.message} — retrying in ${wait}ms (attempt ${attempt}/${MAX_RETRIES})`)
      await sleep(wait)
    }
  }
  return { places: null, error: 'RETRIES_EXHAUSTED' }
}

function classify(business, best, passUsed, source) {
  const row = {
    businessName: business.name,
    slug: slugify(business.name),
    category: business.category,
    primaryAddress: business.address,
    source,
    passUsed,
    status: null,
    confidence: confidenceOf(best),
    matchScore: best?._score ?? null,
    distanceMeters: best?._distanceMeters ?? null,
    matchedPlaceName: best?.displayName?.text ?? null,
    placeId: best?.id ?? null,
    rawWebsiteUri: best?.websiteUri ?? null,
    domain: null,
    nameCheckRule: null,
    nameCheckDice: null,
  }

  if (!best || row.confidence === 'NOT_FOUND') {
    row.status = 'NOT_FOUND'
    return row
  }
  if (!best.websiteUri) {
    row.status = 'NO_WEBSITE'
    return row
  }

  const domain = registrableDomain(best.websiteUri)
  row.domain = domain
  if (!domain) {
    row.status = 'NOT_FOUND'
    return row
  }
  if (SOCIAL_DOMAINS.has(domain)) {
    row.status = 'SOCIAL_ONLY'
    return row
  }
  if (AGGREGATOR_DOMAINS.has(domain)) {
    row.status = 'AGGREGATOR'
    return row
  }

  const check = nameMatchesDomain(business.name, domain)
  row.nameCheckRule = check.rule
  row.nameCheckDice = check.dice
  row.status = check.matched ? 'RESOLVED' : 'SUSPICIOUS'
  return row
}

async function main() {
  const liveFlag = process.argv.includes('--live')
  const maxArg = process.argv.find((a) => a.startsWith('--max-calls='))

  if (!maxArg) {
    console.error('Error: --max-calls=N is required (no default, by design).')
    console.error('  node scripts/resolve-domains.js --max-calls=150')
    process.exit(1)
  }
  const maxCalls = Number(maxArg.split('=')[1])
  if (!Number.isInteger(maxCalls) || maxCalls < 0) {
    console.error(`Error: --max-calls must be a non-negative integer, got "${maxArg.split('=')[1]}".`)
    process.exit(1)
  }
  if (maxCalls > REQUEST_CAP) {
    console.error(`Error: --max-calls=${maxCalls} exceeds REQUEST_CAP=${REQUEST_CAP}.`)
    console.error('  Raise REQUEST_CAP in scripts/resolve-domains.js to allow this.')
    process.exit(1)
  }
  if (liveFlag && !API_KEY) {
    console.error('Error: GOOGLE_MAPS_API_KEY environment variable is not set.')
    process.exit(1)
  }
  budget = maxCalls

  // Optional trial run: cap how many businesses get looked up (not calls —
  // a business can cost 2). Overrides and cache hits are free and always run.
  const limitArg = process.argv.find((a) => a.startsWith('--limit='))
  const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity
  if (limitArg && (!Number.isInteger(limit) || limit < 1)) {
    console.error(`Error: --limit must be a positive integer, got "${limitArg.split('=')[1]}".`)
    process.exit(1)
  }

  const deals = JSON.parse(fs.readFileSync(DEALS_PATH, 'utf8'))
  const businessMap = new Map()
  for (const d of deals) if (!businessMap.has(d.name)) businessMap.set(d.name, d)
  const businesses = [...businessMap.values()]

  const cache = readJson(CACHE_PATH, {})
  const usage = readUsage()
  const alreadyUsed = usedThisMonth(usage)

  // Plan. lookupTargets is the exact set the gate is priced on, so --limit
  // and the budget check can never disagree.
  const lookupTargets = new Set()
  let overrideCount = 0
  let cachedCount = 0
  let minCalls = 0
  let maxPlanned = 0
  let deferred = 0
  for (const b of businesses) {
    if (OVERRIDES[b.name]) { overrideCount++; continue }
    const entry = cache[b.name]
    if (entry?.pass1) {
      cachedCount++
      const best = pickBest(entry.pass1, b.name, b.lat, b.lng)
      if (confidenceOf(best) === 'LOW_CONFIDENCE' && !entry.pass2) {
        if (lookupTargets.size < limit) {
          lookupTargets.add(b.name)
          minCalls += 1
          maxPlanned += 1
        } else deferred++
      }
    } else if (lookupTargets.size < limit) {
      lookupTargets.add(b.name)
      minCalls += 1
      maxPlanned += 2
    } else deferred++
  }

  const mode = liveFlag ? 'live' : 'dry-run'
  console.log('========================================')
  console.log('DOMAIN RESOLUTION — PLAN')
  console.log('========================================')
  console.log(`Mode:                ${mode}${liveFlag ? '' : '  (no API calls, no files written)'}`)
  console.log(`SKU tier:            Text Search Enterprise (places.websiteUri)`)
  console.log(`Field mask:          ${FIELD_MASK}`)
  console.log(`Businesses:          ${businesses.length}`)
  console.log(`  via override:      ${overrideCount}  (0 calls)`)
  console.log(`  cached pass 1:     ${cachedCount}  (0 calls)`)
  console.log(`  need lookup:       ${businesses.length - overrideCount - cachedCount}`)
  if (limitArg) console.log(`  --limit=${limit}:        looking up ${lookupTargets.size}, deferring ${deferred} to a later run`)
  console.log(`Planned calls:       ${minCalls} min / ${maxPlanned} worst case`)
  console.log(`--max-calls:         ${maxCalls}`)
  console.log(`REQUEST_CAP:         ${REQUEST_CAP}`)
  console.log('')
  console.log(`Monthly tally:       ${alreadyUsed} of ~${MONTHLY_ALLOWANCE} ${SKU} calls used in ${monthKey()}`)
  console.log('  WARNING: this tally only counts scripts that write to .places-usage.json.')
  console.log('  fetch-phones.js also calls Text Search and does NOT yet report here,')
  console.log('  so real monthly usage is higher than shown.')
  console.log('')

  if (maxPlanned > maxCalls) {
    console.error(`Refusing to start: worst case ${maxPlanned} calls exceeds --max-calls=${maxCalls}.`)
    console.error(`  Raise --max-calls (up to REQUEST_CAP=${REQUEST_CAP}), or raise REQUEST_CAP first.`)
    process.exit(1)
  }

  const results = []

  for (const b of businesses) {
    // 1. Overrides first — free, and skip the name check entirely.
    const override = OVERRIDES[b.name]
    if (override) {
      results.push({
        businessName: b.name,
        slug: slugify(b.name),
        category: b.category,
        primaryAddress: b.address,
        source: 'OVERRIDE',
        passUsed: 0,
        status: 'OVERRIDE',
        confidence: 'OVERRIDE',
        matchScore: null,
        distanceMeters: null,
        matchedPlaceName: null,
        placeId: null,
        rawWebsiteUri: null,
        domain: override,
        nameCheckRule: 'skipped (override)',
        nameCheckDice: null,
      })
      continue
    }

    const entry = cache[b.name] || {}
    let source = entry.pass1 ? 'CACHE' : 'API'
    let passUsed = 1

    // Held back by --limit. Cached rows needing no call still fall through.
    const cachedBest = entry.pass1 ? pickBest(entry.pass1, b.name, b.lat, b.lng) : null
    const needsCall = !entry.pass1
      || (confidenceOf(cachedBest) === 'LOW_CONFIDENCE' && !entry.pass2)
    if (needsCall && !lookupTargets.has(b.name)) continue

    // 2. Pass 1 — tight radius + category hint.
    if (!entry.pass1) {
      if (!liveFlag) continue
      const hint = CATEGORY_HINTS[b.category] || ''
      const { places, error } = await placesSearch(`${b.name} ${hint}`.trim(), b.lat, b.lng, 200)
      await sleep(DELAY_MS)
      if (error) {
        results.push({
          businessName: b.name,
          slug: slugify(b.name),
          category: b.category,
          primaryAddress: b.address,
          source: 'API',
          passUsed: 1,
          status: 'API_ERROR',
          confidence: 'NOT_FOUND',
          matchScore: null,
          distanceMeters: null,
          matchedPlaceName: null,
          placeId: null,
          rawWebsiteUri: null,
          domain: null,
          nameCheckRule: null,
          nameCheckDice: null,
          error,
        })
        continue
      }
      entry.pass1 = places
      cache[b.name] = entry
      // Persist before the fallback so a crash never wastes a spent call.
      fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2))
    }

    let best = pickBest(entry.pass1, b.name, b.lat, b.lng)

    // 3. Pass 2 fires ONLY on LOW_CONFIDENCE — never on NOT_FOUND, where
    //    pass 1 returned nothing plausible and a wider radius won't help.
    if (confidenceOf(best) === 'LOW_CONFIDENCE') {
      if (!entry.pass2 && liveFlag) {
        const city = extractCity(b.address)
        const { places, error } = await placesSearch(`${b.name} ${city}`.trim(), b.lat, b.lng, 500)
        await sleep(DELAY_MS)
        if (!error) {
          entry.pass2 = places
          cache[b.name] = entry
          fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2))
        }
      }
      if (entry.pass2) {
        const best2 = pickBest(entry.pass2, b.name, b.lat, b.lng)
        if (best2 && best2._score > best._score) {
          best = best2
          passUsed = 2
          source = 'API'
        }
      }
    }

    results.push(classify(b, best, passUsed, source))
  }

  const tally = (pred) => results.filter(pred).length
  const summary = {
    generatedAt: new Date().toISOString(),
    mode,
    skuTier: 'Text Search Enterprise',
    fieldMask: FIELD_MASK,
    totalBusinesses: businesses.length,
    processed: results.length,
    limitApplied: limitArg ? limit : null,
    deferredByLimit: deferred,
    byStatus: {
      OVERRIDE: tally((r) => r.status === 'OVERRIDE'),
      RESOLVED: tally((r) => r.status === 'RESOLVED'),
      SUSPICIOUS: tally((r) => r.status === 'SUSPICIOUS'),
      SOCIAL_ONLY: tally((r) => r.status === 'SOCIAL_ONLY'),
      AGGREGATOR: tally((r) => r.status === 'AGGREGATOR'),
      NO_WEBSITE: tally((r) => r.status === 'NO_WEBSITE'),
      NOT_FOUND: tally((r) => r.status === 'NOT_FOUND'),
      API_ERROR: tally((r) => r.status === 'API_ERROR'),
    },
    byConfidence: {
      HIGH_CONFIDENCE: tally((r) => r.confidence === 'HIGH_CONFIDENCE'),
      LOW_CONFIDENCE: tally((r) => r.confidence === 'LOW_CONFIDENCE'),
      NOT_FOUND: tally((r) => r.confidence === 'NOT_FOUND'),
      OVERRIDE: tally((r) => r.confidence === 'OVERRIDE'),
    },
    resolvedButLowConfidence: tally((r) => r.status === 'RESOLVED' && r.confidence === 'LOW_CONFIDENCE'),
    apiCallsThisRun: callsMade,
    monthlyTally: {
      month: monthKey(),
      sku: SKU,
      beforeRun: alreadyUsed,
      afterRun: liveFlag ? alreadyUsed + callsMade : alreadyUsed,
      approxAllowance: MONTHLY_ALLOWANCE,
      warning: 'Only counts scripts that write to .places-usage.json. fetch-phones.js also calls Text Search and is not yet wired in, so real usage is higher.',
    },
    notes: [
      'BLIND SPOT — the name-vs-domain check cannot catch a business named after a product brand. "Havoline" is the known case: the local shop is a Havoline xpress lube franchise, so havoline.com matches the name perfectly and is still the wrong logo (Chevron motor oil). Franchises named for a product must be caught by eye on the contact sheet.',
      'DOCS CONFLICT — docs/ROADMAP.md task 1.1 says to populate contact.website for all 199 businesses, but CLAUDE.md:70 says website is intentionally null and not a gap to fix. Unresolved on purpose; fix the docs later.',
      'deals.json was read but never written by this script.',
    ],
  }

  const needsReview = results
    .filter((r) => !['OVERRIDE', 'RESOLVED'].includes(r.status))
    .map((r) => ({
      businessName: r.businessName,
      status: r.status,
      confidence: r.confidence,
      domain: r.domain,
      rawWebsiteUri: r.rawWebsiteUri,
      matchedPlaceName: r.matchedPlaceName,
      primaryAddress: r.primaryAddress,
    }))

  if (liveFlag) {
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ summary, results, needsReview }, null, 2))
    recordUsage(usage, callsMade)
    console.log(`\nWrote ${path.relative(process.cwd(), OUTPUT_PATH)}`)
    console.log(`Updated ${path.relative(process.cwd(), USAGE_PATH)}`)
  } else {
    console.log('DRY RUN — nothing written. Re-run with --live to execute.')
  }

  console.log('\n========================================')
  console.log('SUMMARY')
  console.log('========================================')
  for (const [k, v] of Object.entries(summary.byStatus)) {
    console.log(`${k.padEnd(14)} ${v}`)
  }
  console.log(`\nAPI calls this run:  ${callsMade}`)
  console.log(`Needs review:        ${needsReview.length}`)
  console.log('========================================')
}

// Only run as a CLI — importing this file (for tests) must not execute a run.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
}
