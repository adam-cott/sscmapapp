#!/usr/bin/env node
// Usage:
//   GOOGLE_MAPS_API_KEY=your_key node scripts/find-missing-locations.js --dry-run
//   GOOGLE_MAPS_API_KEY=your_key node scripts/find-missing-locations.js

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DRY_RUN = process.argv.includes('--dry-run');
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const DEALS_PATH = path.join(__dirname, '../src/data/deals.json');
const OUTPUT_PATH = path.join(__dirname, 'missing-locations-output.json');
const REQUEST_CAP = 2400;
const DELAY_MS = 200;

if (!API_KEY && !DRY_RUN) {
  console.error('Error: GOOGLE_MAPS_API_KEY environment variable is not set.');
  process.exit(1);
}

// --- Category hint mapping ---
const CATEGORY_HINTS = {
  pizza: 'pizza restaurant',
  restaurants: 'restaurant',
  sandwiches: 'sandwich shop',
  treats: 'dessert cafe',
  free: 'restaurant',
  entertainment: 'entertainment',
  retail: 'store shop',
};

// --- Category → expected Google Places types ---
const CATEGORY_TYPES = {
  pizza: ['restaurant', 'food', 'meal_takeaway', 'meal_delivery'],
  restaurants: ['restaurant', 'food', 'meal_takeaway', 'meal_delivery', 'cafe'],
  sandwiches: ['restaurant', 'food', 'meal_takeaway', 'sandwich_shop'],
  treats: ['restaurant', 'food', 'cafe', 'bakery', 'dessert_shop', 'ice_cream_shop'],
  free: ['restaurant', 'food', 'meal_takeaway', 'cafe'],
  entertainment: ['amusement_park', 'bowling_alley', 'movie_theater', 'night_club', 'spa', 'gym', 'hair_care', 'beauty_salon', 'shopping_mall', 'store'],
  retail: ['store', 'shopping_mall', 'car_dealer', 'car_repair', 'hair_care', 'beauty_salon', 'clothing_store', 'shoe_store'],
};

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nameSimilarity(businessName, placeName) {
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const bizWords = normalize(businessName);
  const placeWords = normalize(placeName);
  if (bizWords.length === 0) return 0;
  const overlap = bizWords.filter((w) => placeWords.includes(w)).length;
  return overlap / bizWords.length;
}

function placesSearch(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      textQuery: query,
      locationBias: {
        circle: {
          center: { latitude: 40.2969, longitude: -111.6942 },
          radius: 40000,
        },
      },
      maxResultCount: 10,
    });

    const options = {
      hostname: 'places.googleapis.com',
      path: '/v1/places:searchText',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.types',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.places || []);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const raw = fs.readFileSync(DEALS_PATH, 'utf8');
  const deals = JSON.parse(raw);

  // --- Build chain map ---
  // businessName → { category, dealIds[], allLocations[] }
  const chainMap = new Map();

  for (const deal of deals) {
    const name = deal.name;
    if (!chainMap.has(name)) {
      chainMap.set(name, { category: deal.category, dealIds: [], allLocations: [] });
    }
    const entry = chainMap.get(name);
    entry.dealIds.push(deal.id);
    for (const loc of (deal.locations || [])) {
      // Deduplicate by lat/lng
      const exists = entry.allLocations.some(
        (l) => Math.abs(l.lat - loc.lat) < 0.00001 && Math.abs(l.lng - loc.lng) < 0.00001
      );
      if (!exists) entry.allLocations.push(loc);
    }
  }

  // Filter to chains only: appears 2+ times OR has 2+ locations
  const chains = [];
  for (const [name, data] of chainMap.entries()) {
    const dealCount = data.dealIds.length;
    const locCount = data.allLocations.length;
    if (dealCount >= 2 || locCount >= 2) {
      chains.push({ name, ...data });
    }
  }

  console.log(`\nIdentified ${chains.length} chain businesses (${deals.length} total deals, ${chainMap.size} unique businesses)`);

  // --- Dry run ---
  if (DRY_RUN) {
    console.log(`\nEstimated API requests: ${chains.length} (1 per chain)\n`);
    console.log('Chain businesses and their queries:');
    for (const chain of chains) {
      const hint = CATEGORY_HINTS[chain.category] || 'restaurant';
      const query = `${chain.name} ${hint} Utah County`;
      console.log(`  [${chain.category.padEnd(13)}] ${chain.name.padEnd(40)} → "${query}"`);
    }
    console.log('\n--dry-run complete. No API calls made.');
    return;
  }

  // --- Live run ---
  let requestCount = 0;
  let businessesChecked = 0;
  let businessesSkipped = 0;
  let stoppedEarly = false;

  const highConfidence = [];
  const needsReview = [];
  let rejectedCount = 0;

  for (const chain of chains) {
    if (requestCount >= REQUEST_CAP) {
      stoppedEarly = true;
      businessesSkipped = chains.length - businessesChecked;
      console.warn(`\n⚠ REQUEST CAP REACHED (${REQUEST_CAP}). Stopping early.`);
      console.warn(`  Processed: ${businessesChecked} businesses, Skipped: ${businessesSkipped}`);
      break;
    }

    const hint = CATEGORY_HINTS[chain.category] || 'restaurant';
    const query = `${chain.name} ${hint} Utah County`;
    const expectedTypes = CATEGORY_TYPES[chain.category] || [];

    let results;
    try {
      results = await placesSearch(query);
    } catch (e) {
      console.error(`  ERROR searching for ${chain.name}: ${e.message}`);
      results = [];
    }

    requestCount++;
    businessesChecked++;

    if (requestCount % 10 === 0) {
      console.log(`  [${requestCount}/${REQUEST_CAP} requests used] Processed ${businessesChecked}/${chains.length} chains...`);
    }

    for (const place of results) {
      const placeName = place.displayName?.text || '';
      const address = place.formattedAddress || '';
      const lat = place.location?.latitude;
      const lng = place.location?.longitude;
      const types = place.types || [];

      if (!lat || !lng) continue;

      // Layer 1: Name similarity
      const simScore = nameSimilarity(chain.name, placeName);
      if (simScore < 0.5) {
        rejectedCount++;
        continue;
      }

      // Layer 2: State filter
      if (!address.includes(', UT') && !address.toLowerCase().includes('utah')) {
        rejectedCount++;
        continue;
      }

      // Layer 3: Category plausibility
      const categoryPass = types.some((t) => expectedTypes.includes(t));

      // Layer 4: Distance check
      const distances = chain.allLocations.map((l) => haversine(l.lat, l.lng, lat, lng));
      const minDistance = distances.length > 0 ? Math.min(...distances) : Infinity;

      if (minDistance <= 150) continue; // Already covered

      // Build confidence
      const namePct = Math.round(simScore * 100);
      const validationNotes = `name match: ${namePct}%, category types: [${types.slice(0, 3).join(', ')}]${!categoryPass ? ' -- not in expected types, manual check recommended' : ''}, state: UT`;

      const result = {
        businessName: chain.name,
        dealId: chain.dealIds[0],
        category: chain.category,
        confidence: categoryPass ? 'HIGH' : 'REVIEW',
        validationNotes,
        placesResult: {
          name: placeName,
          address,
          lat,
          lng,
        },
        distanceFromNearestExistingMeters: Math.round(minDistance),
      };

      if (categoryPass) {
        highConfidence.push(result);
      } else {
        needsReview.push(result);
      }
    }

    await sleep(DELAY_MS);
  }

  // --- Write output ---
  const output = {
    summary: {
      generatedAt: new Date().toISOString(),
      businessesChecked,
      businessesSkipped,
      requestsUsed: requestCount,
      stoppedEarly,
      highConfidenceCount: highConfidence.length,
      reviewCount: needsReview.length,
      rejectedCount,
    },
    highConfidence,
    needsReview,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  // --- Console summary ---
  console.log('\n=== Missing Locations Summary ===');
  console.log(`Requests used:    ${requestCount} / ${REQUEST_CAP}`);
  console.log(`High confidence:  ${highConfidence.length}`);
  console.log(`Needs review:     ${needsReview.length}`);
  console.log(`Rejected:         ${rejectedCount}`);
  if (stoppedEarly) console.log(`⚠ Stopped early — ${businessesSkipped} businesses skipped`);

  if (highConfidence.length > 0) {
    console.log('\nHIGH CONFIDENCE missing locations:');
    for (const r of highConfidence) {
      console.log(`  ${r.businessName} — ${r.placesResult.address} — ${r.distanceFromNearestExistingMeters}m from nearest existing pin`);
    }
  }

  if (needsReview.length > 0) {
    console.log('\nNEEDS REVIEW:');
    for (const r of needsReview) {
      console.log(`  ${r.businessName} — ${r.placesResult.address}`);
      console.log(`    ${r.validationNotes}`);
    }
  }

  console.log(`\nOutput written to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
