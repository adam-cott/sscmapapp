#!/usr/bin/env node
// Read-only check. Confirms getDisplayValue() returns null for exactly the
// deals flagged "likely" truncated in reports/truncated-deals-report.md,
// and a non-null value for everything else.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getDisplayValue } from '../src/utils/dealHelpers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const deals = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/deals.json'), 'utf8'))

const EXPECTED_NULL_IDS = new Set([
  'restaurants-046', // Denny's
  'restaurants-074', // Rodizio Grill
  'retail-165',      // BYU Studio 1030
  'retail-168',      // Chiropractic Access Accident Center
  'retail-169',       // Chiropractic Access Accident Center (2nd deal)
  'sandwiches-378',  // Carl's Jr
])

let pass = true
const gotNull = new Set()

for (const d of deals) {
  const result = getDisplayValue(d)
  if (result === null) gotNull.add(d.id)
}

for (const id of EXPECTED_NULL_IDS) {
  if (!gotNull.has(id)) {
    console.error(`FAIL: expected ${id} to return null, but it didn't`)
    pass = false
  }
}
for (const id of gotNull) {
  if (!EXPECTED_NULL_IDS.has(id)) {
    console.error(`FAIL: ${id} returned null unexpectedly`)
    pass = false
  }
}

if (pass) {
  console.log(`PASS: getDisplayValue() returns null for exactly the ${EXPECTED_NULL_IDS.size} expected deals, and a value for all other ${deals.length - EXPECTED_NULL_IDS.size}.`)
} else {
  process.exitCode = 1
}
