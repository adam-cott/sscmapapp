#!/usr/bin/env node
// Read-only report generator. Does NOT modify deals.json or any app code.
// Usage: node scripts/report-truncated-deals.js
//
// Scans src/data/deals.json for:
//   1. deal.value / deal.description text that looks truncated
//   2. deal.title / deal.value / deal.description / deal.restrictions text
//      that contains address/location fragments
// and writes a Markdown report to reports/truncated-deals-report.md.
//
// Field-render map (see components, checked before writing this script):
//   deal.title        -> HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab (always visible)
//   deal.value         -> DealCard (pill), BottomSheet (large headline), DealModal (large headline), RedemptionScreen (NOT in HomeCard)
//   deal.description   -> BottomSheet, DealModal only (deal-detail screens)
//   deal.restrictions  -> not rendered anywhere in the current UI

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEALS_PATH = path.join(__dirname, '../src/data/deals.json')
const REPORT_DIR = path.join(__dirname, '../reports')
const REPORT_PATH = path.join(REPORT_DIR, 'truncated-deals-report.md')

const FIELD_VISIBILITY = {
  title: 'Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)',
  value: 'Visible in DealCard pill, BottomSheet/DealModal headline, RedemptionScreen — NOT shown in HomeCard',
  description: 'Only visible on the deal-detail screens (BottomSheet, DealModal)',
  restrictions: 'Not rendered anywhere in the current UI',
}

const deals = JSON.parse(fs.readFileSync(DEALS_PATH, 'utf8'))

// ─── Truncation heuristics ──────────────────────────────────────────────

const TERMINAL_PUNCT = /[.!?)'"]\s*$/
const ALLOWLIST_LAST_WORDS = new Set([
  'free', 'only', 'anytime', 'off', 'up', 'included', 'purchase', 'entree',
  'item', 'deal', 'code', 'family', 'day', 'week', 'month', 'special',
  'hrs', 'hr', 'pm', 'am', 'ea', 'max', 'min',
])
// Day-of-week / day-range shorthand ("M-Th", "M-F", "Mon-Fri", "Sa", "Su") is
// intentional abbreviation, not a cut-off word — checked against the whole
// text (not just the bare last word) since it's usually a hyphenated pair.
const DAY_TOKEN = 'Mon|Tue|Wed|Thu|Fri|Sat|Sun|Su|Mo|Tu|We|Th|Fr|Sa|[MTWFS]'
const DAY_RANGE_PATTERN = new RegExp(`\\b(${DAY_TOKEN})(-(${DAY_TOKEN}))?\\.?$`, 'i')

function lastWordLooksIncomplete(text) {
  if (DAY_RANGE_PATTERN.test(text.trim())) return false
  const words = text.trim().split(/\s+/)
  const last = words[words.length - 1] || ''
  const bare = last.replace(/[^A-Za-z0-9$]/g, '')
  if (!bare) return false
  if (/^\$?\d+%?$/.test(bare)) return false // ends in a number/price - fine
  if (bare === bare.toUpperCase() && bare.length > 1) return false // acronym/emphasis word - fine
  if (ALLOWLIST_LAST_WORDS.has(bare.toLowerCase())) return false
  // Very short trailing fragment (1-2 letters) after a longer sentence is the
  // strongest "cut mid-word" signal (e.g. "...2 Kids Pe").
  return bare.length <= 3
}

function unbalanced(text) {
  const opens = (text.match(/\(/g) || []).length
  const closes = (text.match(/\)/g) || []).length
  const dquotes = (text.match(/"/g) || []).length
  return opens !== closes || dquotes % 2 !== 0
}

function buildLengthHistogram(deals, fieldPath) {
  const hist = new Map()
  for (const d of deals) {
    const val = getField(d, fieldPath)
    if (!val) continue
    hist.set(val.length, (hist.get(val.length) || 0) + 1)
  }
  return hist
}

function getField(deal, fieldPath) {
  return fieldPath === 'title' ? deal.deal.title
    : fieldPath === 'value' ? deal.deal.value
    : fieldPath === 'description' ? deal.deal.description
    : fieldPath === 'restrictions' ? deal.deal.restrictions
    : null
}

// Length spike detection: flag the max length for a field as "suspicious"
// only if multiple deals share that exact max (a single long outlier is
// just a long deal, not evidence of a cutoff).
function findLengthSpike(hist) {
  let maxLen = -1
  for (const len of hist.keys()) if (len > maxLen) maxLen = len
  if (maxLen < 0) return null
  const countAtMax = hist.get(maxLen)
  return countAtMax >= 2 ? maxLen : null
}

const TRUNCATION_FIELDS = ['value', 'description']
const findings = { likely: [], possible: [] }
const heuristicCounts = { prefixOfTitle: 0, incompleteWord: 0, lengthSpike: 0, unbalanced: 0 }

const histograms = {}
for (const field of TRUNCATION_FIELDS) histograms[field] = buildLengthHistogram(deals, field)
const spikeLengths = {}
for (const field of TRUNCATION_FIELDS) spikeLengths[field] = findLengthSpike(histograms[field])

deals.forEach((d, index) => {
  for (const field of TRUNCATION_FIELDS) {
    const text = getField(d, field)
    if (!text) continue
    const title = d.deal.title || ''

    const reasons = []
    let isPrefixOfTitle = false

    if (field !== 'title' && title && title !== text && title.startsWith(text) && !TERMINAL_PUNCT.test(text)) {
      isPrefixOfTitle = true
      reasons.push('is an exact prefix of deal.title (cut before the sentence finished)')
      heuristicCounts.prefixOfTitle++
    }

    const endsIncomplete = !TERMINAL_PUNCT.test(text) && lastWordLooksIncomplete(text)
    if (endsIncomplete && !isPrefixOfTitle) {
      reasons.push('no terminal punctuation and last word looks cut off')
      heuristicCounts.incompleteWord++
    }

    const spike = spikeLengths[field]
    const atSpike = spike !== null && text.length === spike && !TERMINAL_PUNCT.test(text)
    if (atSpike) {
      reasons.push(`length (${text.length}) sits at the top of a shared-length cluster for deal.${field} (${histograms[field].get(spike)} deals share this exact length) — suggests an upstream character cap`)
      heuristicCounts.lengthSpike++
    }

    if (unbalanced(text)) {
      reasons.push('unbalanced parentheses or quotes')
      heuristicCounts.unbalanced++
    }

    if (reasons.length === 0) continue

    const confidence = isPrefixOfTitle || (endsIncomplete && atSpike) ? 'likely' : 'possible'
    findings[confidence].push({
      index,
      id: d.id,
      name: d.name,
      field,
      text,
      length: text.length,
      title,
      reasons,
    })
  }
})

// ─── Address / location detection ──────────────────────────────────────

const ADDRESS_FIELDS = ['title', 'value', 'description', 'restrictions']

const cityNames = new Set()
for (const d of deals) {
  const addrs = [d.address, ...(d.locations || []).map(l => l.address)].filter(Boolean)
  for (const a of addrs) {
    const m = a.match(/,\s*([A-Za-z .]+?),\s*UT\b/)
    if (m) cityNames.add(m[1].trim())
  }
}
const cityPattern = new RegExp(`\\b(${[...cityNames].map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`)
const streetTypePattern = /\b\d{1,6}\s+[A-Za-z0-9.]+(\s+[A-Za-z0-9.]+)?\s+(St|Ave|Blvd|Dr|Rd|Ln|Way|Pkwy|Ct|Cir|Pl)\b/i
const directionalPattern = /\b(\d{2,5}\s*[NSEW]\b|\b[NSEW]\s+\d{2,5}\b)/
const zipPattern = /\b8[4-5]\d{3}\b/ // Utah zip codes

const VALID_AT_BOILERPLATE = /^Valid at:/i

const addressHits = []
deals.forEach((d, index) => {
  for (const field of ADDRESS_FIELDS) {
    const text = getField(d, field)
    if (!text) continue
    const matched = []
    if (streetTypePattern.test(text)) matched.push('street address pattern')
    if (directionalPattern.test(text)) matched.push('directional + number (e.g. "200 W")')
    if (cityPattern.test(text)) matched.push(`city name ("${text.match(cityPattern)[1]}")`)
    if (zipPattern.test(text)) matched.push('Utah zip code')
    if (matched.length === 0) continue
    const isBoilerplate = field === 'description' && VALID_AT_BOILERPLATE.test(text)
    addressHits.push({ index, id: d.id, name: d.name, field, text, matched, isBoilerplate })
  }
})
const boilerplateHits = addressHits.filter(h => h.isBoilerplate)
const nonBoilerplateHits = addressHits.filter(h => !h.isBoilerplate)

// ─── Report generation ──────────────────────────────────────────────────

fs.mkdirSync(REPORT_DIR, { recursive: true })

const lines = []
lines.push('# Truncated Deals Report')
lines.push('')
lines.push(`Generated: ${new Date().toISOString()}`)
lines.push('')
lines.push('Read-only report. `deals.json` and app code were not modified by this script.')
lines.push('')
lines.push('## Field visibility reference')
lines.push('')
for (const [field, desc] of Object.entries(FIELD_VISIBILITY)) {
  lines.push(`- **\`deal.${field}\`** — ${desc}`)
}
lines.push('')
lines.push('## Summary')
lines.push('')
lines.push(`- Total deals: ${deals.length}`)
lines.push(`- Flagged "likely" truncated: ${findings.likely.length}`)
lines.push(`- Flagged "possible" truncated: ${findings.possible.length}`)
lines.push(`- Address/location text hits: ${addressHits.length} (${boilerplateHits.length} are the routine \`"Valid at: <city>"\` description boilerplate — see note below; ${nonBoilerplateHits.length} are everything else)`)
lines.push('')
lines.push('**Heuristic hit counts** (a single finding can trigger more than one heuristic):')
lines.push('')
lines.push(`- Prefix-of-title match: ${heuristicCounts.prefixOfTitle}`)
lines.push(`- Ends without terminal punctuation + incomplete last word: ${heuristicCounts.incompleteWord}`)
lines.push(`- Length sits at a shared-length cluster (upstream cap suspected): ${heuristicCounts.lengthSpike}`)
lines.push(`- Unbalanced parentheses/quotes: ${heuristicCounts.unbalanced}`)
lines.push('')
lines.push('**Length distribution per field** (top 10 by frequency, `*` marks the length flagged as a cluster spike):')
lines.push('')
for (const field of TRUNCATION_FIELDS) {
  lines.push(`\`deal.${field}\`:`)
  const sorted = [...histograms[field].entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  for (const [len, count] of sorted) {
    const marker = len === spikeLengths[field] ? ' *' : ''
    lines.push(`- length ${len}: ${count} deals${marker}`)
  }
  lines.push('')
}

lines.push('---')
lines.push('')
lines.push('## Likely truncated')
lines.push('')
if (findings.likely.length === 0) {
  lines.push('None.')
} else {
  for (const f of findings.likely) {
    lines.push(`### ${f.name} — \`${f.id}\` (index ${f.index}, field \`deal.${f.field}\`)`)
    lines.push('')
    lines.push(`- **Value:** \`${JSON.stringify(f.text)}\` (length ${f.length})`)
    lines.push(`- **Full deal.title:** \`${JSON.stringify(f.title)}\``)
    lines.push(`- **Flagged by:** ${f.reasons.join('; ')}`)
    lines.push(`- **Rendered where:** ${FIELD_VISIBILITY[f.field]}`)
    lines.push('')
  }
}

lines.push('---')
lines.push('')
lines.push('## Possible truncation')
lines.push('')
if (findings.possible.length === 0) {
  lines.push('None.')
} else {
  for (const f of findings.possible) {
    lines.push(`### ${f.name} — \`${f.id}\` (index ${f.index}, field \`deal.${f.field}\`)`)
    lines.push('')
    lines.push(`- **Value:** \`${JSON.stringify(f.text)}\` (length ${f.length})`)
    lines.push(`- **Full deal.title:** \`${JSON.stringify(f.title)}\``)
    lines.push(`- **Flagged by:** ${f.reasons.join('; ')}`)
    lines.push(`- **Rendered where:** ${FIELD_VISIBILITY[f.field]}`)
    lines.push('')
  }
}

lines.push('---')
lines.push('')
lines.push('## Address/location text found in deal copy')
lines.push('')
lines.push('Separate open item — deals whose title/value/description/restrictions text contains what looks like a street address, directional abbreviation, city name, or zip code. `deal.address` / `locations[].address` / `locationRestriction` are excluded since those fields are supposed to hold location data.')
lines.push('')

lines.push(`### Routine "Valid at: <city>" boilerplate (${boilerplateHits.length})`)
lines.push('')
lines.push('These are `deal.description` values that are just the standard `"Valid at: <city/area>"` pattern (193 deals in total use this pattern) — almost certainly intentional, not a data problem. Listed for completeness, lowest priority to review.')
lines.push('')
if (boilerplateHits.length === 0) {
  lines.push('None.')
} else {
  lines.push('| Business | Deal ID | Text |')
  lines.push('|---|---|---|')
  for (const h of boilerplateHits) {
    lines.push(`| ${h.name} | \`${h.id}\` | ${JSON.stringify(h.text)} |`)
  }
}
lines.push('')

lines.push(`### Other address/location text (${nonBoilerplateHits.length})`)
lines.push('')
lines.push('Everything else — worth an actual look.')
lines.push('')
if (nonBoilerplateHits.length === 0) {
  lines.push('None.')
} else {
  for (const h of nonBoilerplateHits) {
    lines.push(`### ${h.name} — \`${h.id}\` (index ${h.index}, field \`deal.${h.field}\`)`)
    lines.push('')
    lines.push(`- **Text:** \`${JSON.stringify(h.text)}\``)
    lines.push(`- **Matched:** ${h.matched.join('; ')}`)
    lines.push(`- **Rendered where:** ${FIELD_VISIBILITY[h.field]}${FIELD_VISIBILITY[h.field].startsWith('Not rendered') ? ' — lower priority, users never see this' : ''}`)
    lines.push('')
  }
}

fs.writeFileSync(REPORT_PATH, lines.join('\n'))
console.log(`Report written to ${path.relative(process.cwd(), REPORT_PATH)}`)
console.log(`Likely: ${findings.likely.length}, Possible: ${findings.possible.length}, Address hits: ${addressHits.length}`)
