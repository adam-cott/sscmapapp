#!/usr/bin/env node
// Usage (PowerShell):
//   $env:GOOGLE_MAPS_API_KEY="your_key"
//   node scripts/fetch-phones.js --dry-run
//   node scripts/fetch-phones.js --skip-low-confidence
//   node scripts/fetch-phones.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DRY_RUN = process.argv.includes('--dry-run')
const SKIP_LOW = process.argv.includes('--skip-low-confidence')
const API_KEY = process.env.GOOGLE_MAPS_API_KEY

if (!API_KEY) {
  console.error('Error: GOOGLE_MAPS_API_KEY environment variable is not set.')
  process.exit(1)
}

const DEALS_PATH = path.join(__dirname, '../src/data/deals.json')
const OUTPUT_PATH = path.join(__dirname, 'phones-output.json')
const REQUEST_CAP = 3000  // Covers all 1,438 locations with two-pass fallback
const DELAY_MS = 200

let requestCount = 0

const CATEGORY_HINTS = {
  pizza: 'pizza',
  restaurants: 'restaurant',
  sandwiches: 'sandwich',
  treats: 'cafe dessert',
  free: 'restaurant',
  entertainment: 'entertainment',
  retail: 'shop store',
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function extractCity(address) {
  const parts = address.split(',')
  if (parts.length < 2) return 'Utah County'
  let city = parts[1].trim()
  const words = city.split(' ').filter(Boolean)
  while (words.length > 1) {
    const last = words[words.length - 1]
    if (/^\d{5}$/.test(last) || /^[A-Z]{2}$/.test(last)) {
      words.pop()
    } else {
      break
    }
  }
  city = words.join(' ').trim()
  return city.length > 0 ? city : 'Utah County'
}

function normalizeName(str) {
  return str.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(Boolean)
}

function nameSimilarityScore(bizName, resultName) {
  const bizWords = normalizeName(bizName)
  const resultWords = new Set(normalizeName(resultName))
  if (bizWords.length === 0) return 0
  const matches = bizWords.filter((w) => resultWords.has(w)).length
  const pct = matches / bizWords.length
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

function normalizePhone(raw) {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  let e164digits = digits
  if (digits.length === 10) e164digits = '1' + digits
  else if (digits.length === 11 && digits[0] === '1') e164digits = digits
  else return null
  if (e164digits.length !== 11) return null
  return '+' + e164digits
}

function scoreResult(place, bizName, targetLat, targetLng) {
  const name = place.displayName?.text || ''
  const namePts = nameSimilarityScore(bizName, name)
  const lat = place.location?.latitude
  const lng = place.location?.longitude
  const distanceMeters = (lat != null && lng != null)
    ? haversineMeters(targetLat, targetLng, lat, lng)
    : Infinity
  const distPts = distanceMeters <= 100 ? 2 : distanceMeters <= 300 ? 1 : 0
  const phonePts = place.nationalPhoneNumber ? 1 : 0
  return { score: namePts + distPts + phonePts, distanceMeters: distanceMeters === Infinity ? null : Math.round(distanceMeters) }
}

async function placesSearch(query, lat, lng, radius) {
  if (requestCount >= REQUEST_CAP) return null
  requestCount++
  const body = {
    textQuery: query,
    locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius } },
    maxResultCount: 5,
  }
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.location,places.nationalPhoneNumber,places.id',
      },
      body: JSON.stringify(body),
    })
    if (requestCount === 1) console.log('HTTP status:', res.status)
    if (res.status === 401 || res.status === 403) {
      const text = await res.text()
      console.error(`Error: ${res.status} — ${text.slice(0, 200)}`)
      process.exit(1)
    }
    if (res.status === 429) return null
    const data = await res.json()
    if (requestCount === 1) console.log('HTTP body (first call):', JSON.stringify(data).slice(0, 500))
    return data.places ?? []
  } catch (e) {
    console.error('placesSearch error:', e.message)
    return null
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

async function main() {
  console.log(`Reading: ${DEALS_PATH}`)
  const deals = JSON.parse(fs.readFileSync(DEALS_PATH, 'utf8'))
  console.log(`Loaded ${deals.length} deals.`)

  const mode = DRY_RUN ? 'dry-run' : SKIP_LOW ? 'live-skip-low-confidence' : 'live'
  console.log(`Mode: ${mode}`)
  console.log(`Request cap: ${REQUEST_CAP}\n`)

  let locationsProcessed = 0
  let skippedAlreadyHavePhone = 0
  let highConfidence = 0
  let lowConfidence = 0
  let notFound = 0
  let stoppedEarly = false

  const results = []
  const manualFollowUp = []

  outerLoop:
  for (const deal of deals) {
    if (!Array.isArray(deal.locations)) continue
    for (const loc of deal.locations) {
      if (requestCount >= REQUEST_CAP) {
        stoppedEarly = true
        break outerLoop
      }

      if (loc.phone != null) {
        skippedAlreadyHavePhone++
        continue
      }

      locationsProcessed++
      const hint = CATEGORY_HINTS[deal.category] || ''

      // Pass 1: tight radius, category hint
      const query1 = `${deal.name} ${hint}`.trim()
      const pass1 = await placesSearch(query1, loc.lat, loc.lng, 200)
      await sleep(DELAY_MS)
      let best = pickBest(pass1, deal.name, loc.lat, loc.lng)
      let passUsed = 1

      // Pass 2: wider radius, city query
      if (!best || best._score < 2) {
        if (requestCount >= REQUEST_CAP) { stoppedEarly = true; break outerLoop }
        const city = extractCity(loc.address)
        const query2 = `${deal.name} ${city}`.trim()
        const pass2 = await placesSearch(query2, loc.lat, loc.lng, 500)
        await sleep(DELAY_MS)
        const best2 = pickBest(pass2, deal.name, loc.lat, loc.lng)
        if (best2 && (!best || best2._score > best._score)) {
          best = best2
          passUsed = 2
        }
      }

      const phone = best ? normalizePhone(best.nationalPhoneNumber) : null
      let confidence = 'NOT_FOUND'
      if (best) {
        if (best._score >= 3) confidence = 'HIGH_CONFIDENCE'
        else if (best._score === 2) confidence = 'LOW_CONFIDENCE'
      }

      const shouldWrite = confidence === 'HIGH_CONFIDENCE' || (confidence === 'LOW_CONFIDENCE' && !SKIP_LOW)

      if (shouldWrite && phone) {
        if (!DRY_RUN) loc.phone = phone
        if (confidence === 'HIGH_CONFIDENCE') highConfidence++
        else lowConfidence++
        results.push({
          dealId: deal.id,
          businessName: deal.name,
          address: loc.address,
          confidence,
          phone,
          foursquareMatch: best.displayName?.text,
          matchScore: best._score,
          distanceMeters: best._distanceMeters,
          passUsed,
          categoryHintUsed: hint,
        })
      } else {
        if (!DRY_RUN) loc.phone = null
        if (confidence === 'LOW_CONFIDENCE') lowConfidence++
        else notFound++
        manualFollowUp.push({
          dealId: deal.id,
          businessName: deal.name,
          address: loc.address,
          reason: confidence === 'LOW_CONFIDENCE'
            ? 'low confidence — manual verification recommended'
            : best ? 'score too low' : 'no match found',
          passesAttempted: passUsed,
          category: deal.category,
        })
      }

      if (requestCount % 50 === 0) {
        console.log(`  [${requestCount} requests used] processed ${locationsProcessed} locations so far...`)
      }
    }
  }

  // Write output JSON (always)
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({
    summary: {
      generatedAt: new Date().toISOString(),
      mode,
      locationsProcessed,
      skippedAlreadyHavePhone,
      highConfidence,
      lowConfidence,
      notFound,
      requestsUsed: requestCount,
      stoppedEarly,
    },
    results,
    manualFollowUp,
  }, null, 2))
  console.log(`\nWrote output to ${OUTPUT_PATH}`)

  if (!DRY_RUN) {
    fs.writeFileSync(DEALS_PATH, JSON.stringify(deals, null, 2))
    console.log(`Patched deals.json`)
  }

  console.log('\n========================================')
  console.log('PHONE LOOKUP SUMMARY')
  console.log('========================================')
  console.log(`Mode:                ${mode}`)
  console.log(`Locations processed: ${locationsProcessed}`)
  console.log(`Already had phone:   ${skippedAlreadyHavePhone}`)
  console.log(`High confidence:     ${highConfidence}`)
  console.log(`Low confidence:      ${lowConfidence}`)
  console.log(`Not found:           ${notFound}`)
  console.log(`Requests used:       ${requestCount} / ${REQUEST_CAP} cap`)
  console.log(`Stopped early:       ${stoppedEarly ? `YES — ${1438 - locationsProcessed} locations remaining` : 'No'}`)

  if (manualFollowUp.length > 0) {
    console.log(`\nMANUAL FOLLOW-UP REQUIRED (${manualFollowUp.length} locations):`)
    for (const f of manualFollowUp) {
      console.log(`  ${f.businessName} | ${f.address} | ${f.reason}`)
    }
  }
  console.log('========================================')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
