// SAFETY GUARD for every script that spends money or overwrites deal data.
//
// Adam's rule: nothing makes a paid Google call or overwrites src/data/deals.json
// without his explicit OK. These helpers enforce that:
//   - They only accept an approval typed by a person in a real terminal. Piped
//     input, CI and AI tool shells are refused outright, so an AI session cannot
//     approve on Adam's behalf. Never add a flag, env var or workaround that
//     skips the typed approval.
//   - Paid runs show the worst-case cost first, stop cold at the approved number
//     of calls, and add every call to a monthly running total.
//   - Every deals.json overwrite is backed up first, with a before/after summary.
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline/promises'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const LEDGER = path.join(ROOT, 'scripts', '.places-usage.json')
const BACKUPS = path.join(ROOT, 'data-archive', 'backups')

// Google's list price in USD per 1,000 calls, and the free calls per month for
// each SKU. Best estimate as of Nov 2026: check
// https://developers.google.com/maps/billing-and-pricing/pricing before a big run.
// Asking for phone, website or hours puts a Places call in the Enterprise tier.
export const PRICES = {
  'text-search-pro': { label: 'Places Text Search (Pro)', per1000: 32, freePerMonth: 5000 },
  'text-search-enterprise': { label: 'Places Text Search (Enterprise: phone/website)', per1000: 35, freePerMonth: 1000 },
  'place-details-pro': { label: 'Place Details (Pro)', per1000: 17, freePerMonth: 5000 },
  'geocoding': { label: 'Geocoding', per1000: 5, freePerMonth: 10000 },
}

const BAR = '='.repeat(72)

function readLedger() {
  try { return JSON.parse(fs.readFileSync(LEDGER, 'utf8')) } catch { return {} }
}

function monthKey() {
  return new Date().toISOString().slice(0, 7)
}

// Older ledger entries used underscores ("text_search_enterprise").
function usedThisMonth(ledger, sku) {
  const month = ledger[monthKey()] ?? {}
  return (month[sku] ?? 0) + (month[sku.replace(/-/g, '_')] ?? 0)
}

async function requireTypedApproval(lines, phrase) {
  console.log(`\n${BAR}\n${lines.join('\n')}\n${BAR}`)
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error('\nBLOCKED: this needs Adam to type the approval in a real terminal.')
    console.error('AI sessions: stop here and ask Adam to run this command himself. Do not work around this check.')
    process.exit(1)
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(`\nTo approve, type exactly:  ${phrase}\n> `)
  rl.close()
  if (answer.trim() !== phrase) {
    console.error('Not approved. Nothing was spent or written.')
    process.exit(1)
  }
}

/**
 * Call before any paid request. `calls` maps a PRICES key to the most calls this
 * run may make, e.g. { 'text-search-pro': 1500, geocoding: 20 }.
 * Returns a budget: call budget.spend(sku) immediately before every paid request.
 */
export async function approvePaidRun({ script, calls, fields }) {
  const ledger = readLedger()
  let total = 0
  let worstCost = 0
  let fullPrice = 0
  let overFree = false
  const rows = Object.entries(calls).map(([sku, max]) => {
    const price = PRICES[sku]
    if (!price) throw new Error(`guard: unknown SKU "${sku}" - add it to PRICES in scripts/lib/guard.js`)
    if (!Number.isInteger(max) || max <= 0) throw new Error(`guard: max calls for ${sku} must be a positive whole number`)
    const used = usedThisMonth(ledger, sku)
    const billable = Math.max(0, used + max - price.freePerMonth)
    const cost = (billable * price.per1000) / 1000
    total += max
    worstCost += cost
    fullPrice += (max * price.per1000) / 1000
    if (billable > 0) overFree = true
    return `  ${price.label}: up to ${max} calls  |  ${used} used this month of ${price.freePerMonth} free  |  worst case $${cost.toFixed(2)}`
  })

  await requireTypedApproval([
    `PAID GOOGLE API RUN - ${script}`,
    `Fields requested: ${fields}`,
    ...rows,
    `Worst-case charge for this run: $${worstCost.toFixed(2)}${overFree ? '  (GOES PAST THIS MONTH\'S FREE ALLOWANCE)' : ''}`,
    `(If the free allowance is already used up in ways this tally can't see, e.g. the Google Cloud console: up to $${fullPrice.toFixed(2)})`,
    `The script stops cold after ${total} calls.`,
  ], `SPEND ${total}`)
  if (overFree) await requireTypedApproval([
    `This run can go past the free allowance and charge Adam's card up to $${worstCost.toFixed(2)}.`,
  ], 'CHARGE MY CARD')

  const spent = Object.fromEntries(Object.keys(calls).map(sku => [sku, 0]))
  return {
    spend(sku) {
      if (!(sku in calls)) throw new Error(`guard: ${sku} was not approved for this run`)
      if (spent[sku] >= calls[sku]) throw new Error(`guard: approved limit of ${calls[sku]} ${sku} calls reached - stopping`)
      spent[sku]++
      const current = readLedger()
      const month = (current[monthKey()] ??= {})
      month[sku] = (month[sku] ?? 0) + 1
      current._note = 'Monthly paid Google calls, counted by scripts/lib/guard.js.'
      fs.writeFileSync(LEDGER, JSON.stringify(current, null, 2) + '\n')
    },
    spent,
  }
}

function summarize(text) {
  try {
    const deals = JSON.parse(text)
    const active = deals.filter(d => d.active !== false)
    return `${active.length} active deals, ${new Set(active.map(d => d.name)).size} businesses, ${active.reduce((n, d) => n + (d.locations?.length ?? 0), 0)} store listings`
  } catch {
    return 'not valid JSON!'
  }
}

/**
 * The only way a script may overwrite a deals file. Shows before/after,
 * requires Adam's typed approval, backs up the old file, then writes.
 * `extraWarning` adds a line to the approval screen.
 */
export async function writeDealsFile({ script, file, text, extraWarning }) {
  const target = path.resolve(ROOT, file)
  const before = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null
  if (before === text) {
    console.log(`No changes to ${path.relative(ROOT, target)}; nothing written.`)
    return
  }
  await requireTypedApproval([
    `OVERWRITE DEAL DATA - ${script}`,
    `File: ${target}`,
    `Before: ${before ? summarize(before) : '(file does not exist yet)'}`,
    `After:  ${summarize(text)}`,
    ...(extraWarning ? [`WARNING: ${extraWarning}`] : []),
    'The current file will be backed up to data-archive/backups/ first.',
  ], 'OVERWRITE DEALS')
  if (before !== null) {
    fs.mkdirSync(BACKUPS, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const backup = path.join(BACKUPS, `${path.basename(target, '.json')}-${stamp}-${script.replace(/[^\w.-]/g, '_')}.json`)
    fs.writeFileSync(backup, before)
    console.log(`Backed up the old file to ${path.relative(ROOT, backup)}`)
  }
  fs.writeFileSync(target, text)
  console.log(`Wrote ${path.relative(ROOT, target)}`)
}
