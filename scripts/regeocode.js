#!/usr/bin/env node
// Usage:
//   GOOGLE_MAPS_API_KEY=your_key node scripts/regeocode.js --dry-run
//   GOOGLE_MAPS_API_KEY=your_key node scripts/regeocode.js

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DRY_RUN = process.argv.includes('--dry-run');
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const DEALS_PATH = path.join(__dirname, '../src/data/deals.json');
const THRESHOLD_METERS = 50;
const DELAY_MS = 110; // ~9 req/sec, safely under 10/sec limit

if (!API_KEY) {
  console.error('Error: GOOGLE_MAPS_API_KEY environment variable is not set.');
  process.exit(1);
}

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

function geocode(query) {
  return new Promise((resolve, reject) => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${API_KEY}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'OK' && json.results.length > 0) {
            const { lat, lng } = json.results[0].geometry.location;
            resolve({ lat, lng });
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`Reading: ${DEALS_PATH}`);
  const raw = fs.readFileSync(DEALS_PATH, 'utf8');
  const deals = JSON.parse(raw);
  console.log(`Loaded ${deals.length} deals. Starting geocode check...`);

  let totalChecked = 0;
  let totalPatched = 0;
  const patches = [];

  for (const deal of deals) {
    if (!Array.isArray(deal.locations)) continue;

    for (const loc of deal.locations) {
      if (!loc.address || loc.lat == null || loc.lng == null) continue;

      totalChecked++;

      // Primary query: address only
      let result = await geocode(loc.address);
      await sleep(DELAY_MS);

      // Fallback: business name + address
      if (!result) {
        result = await geocode(`${deal.name}, ${loc.address}`);
        await sleep(DELAY_MS);
      }

      if (!result) {
        console.log(`  SKIP (no result): ${deal.name} — ${loc.address}`);
        continue;
      }

      const distance = haversine(loc.lat, loc.lng, result.lat, result.lng);

      if (distance > THRESHOLD_METERS) {
        const oldLat = loc.lat;
        const oldLng = loc.lng;

        patches.push({
          name: deal.name,
          address: loc.address,
          oldLat,
          oldLng,
          newLat: result.lat,
          newLng: result.lng,
          distance: Math.round(distance),
        });

        if (!DRY_RUN) {
          // Check if top-level coords match this location (convenience duplicate)
          const topLevelMatches =
            deal.lat === oldLat && deal.lng === oldLng;

          loc.lat = result.lat;
          loc.lng = result.lng;

          if (topLevelMatches) {
            deal.lat = result.lat;
            deal.lng = result.lng;
          }
        }

        totalPatched++;
      }
    }
  }

  // Summary
  console.log('\n=== Regeocode Summary ===');
  console.log(`Mode:          ${DRY_RUN ? 'DRY RUN (no changes written)' : 'LIVE'}`);
  console.log(`Total checked: ${totalChecked}`);
  console.log(`Total patched: ${totalPatched}`);

  if (patches.length > 0) {
    console.log('\nPatched locations:');
    for (const p of patches) {
      console.log(`\n  Business: ${p.name}`);
      console.log(`  Address:  ${p.address}`);
      console.log(`  Old:      ${p.oldLat}, ${p.oldLng}`);
      console.log(`  New:      ${p.newLat}, ${p.newLng}`);
      console.log(`  Distance: ${p.distance}m off`);
    }
  }

  if (!DRY_RUN && totalPatched > 0) {
    fs.writeFileSync(DEALS_PATH, JSON.stringify(deals, null, 2));
    console.log(`\nWrote patched data to ${DEALS_PATH}`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
