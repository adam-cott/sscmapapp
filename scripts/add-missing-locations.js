#!/usr/bin/env node
// Reads missing-locations-output.json, filters to within MAX_KM of Provo,
// and adds qualifying HIGH CONFIDENCE locations to deals.json.
//
// Usage:
//   node scripts/add-missing-locations.js --dry-run
//   node scripts/add-missing-locations.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DRY_RUN = process.argv.includes('--dry-run');
const MAX_KM = 90;
const PROVO = { lat: 40.2969, lng: -111.6942 };

const DEALS_PATH = path.join(__dirname, '../src/data/deals.json');
const INPUT_PATH = path.join(__dirname, 'missing-locations-output.json');

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const deals = JSON.parse(fs.readFileSync(DEALS_PATH, 'utf8'));
const { highConfidence } = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));

// Filter to within MAX_KM of Provo
const candidates = highConfidence.filter((r) => {
  const km = haversine(PROVO.lat, PROVO.lng, r.placesResult.lat, r.placesResult.lng);
  return km <= MAX_KM;
});

const filtered = highConfidence.length - candidates.length;
console.log(`\nHigh confidence total:  ${highConfidence.length}`);
console.log(`Within ${MAX_KM}km of Provo: ${candidates.length}`);
console.log(`Filtered out (too far): ${filtered}`);

// Group candidates by businessName
const byBusiness = new Map();
for (const c of candidates) {
  if (!byBusiness.has(c.businessName)) byBusiness.set(c.businessName, []);
  byBusiness.get(c.businessName).push(c);
}

let totalAdded = 0;

for (const [businessName, items] of byBusiness.entries()) {
  // Find all deals for this business
  const matchingDeals = deals.filter((d) => d.name === businessName);
  if (matchingDeals.length === 0) continue;

  for (const item of items) {
    const newLoc = {
      lat: item.placesResult.lat,
      lng: item.placesResult.lng,
      address: item.placesResult.address,
    };

    console.log(`\n  + ${businessName}`);
    console.log(`    ${newLoc.address} (${Math.round(item.distanceFromNearestExistingMeters)}m from nearest existing pin)`);

    if (!DRY_RUN) {
      for (const deal of matchingDeals) {
        // Double-check not already in locations[]
        const duplicate = deal.locations.some(
          (l) => haversine(l.lat, l.lng, newLoc.lat, newLoc.lng) * 1000 <= 150
        );
        if (!duplicate) {
          deal.locations.push(newLoc);
          totalAdded++;
        }
      }
    } else {
      totalAdded += matchingDeals.length;
    }
  }
}

if (!DRY_RUN) {
  fs.writeFileSync(DEALS_PATH, JSON.stringify(deals, null, 2));
  console.log(`\nAdded ${totalAdded} location entries across deals.json`);
  console.log(`Written to ${DEALS_PATH}`);
} else {
  console.log(`\n--dry-run: would add ~${totalAdded} location entries. Run without --dry-run to apply.`);
}
