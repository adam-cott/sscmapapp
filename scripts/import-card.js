/* global process */
// Converts a year's card transcription CSV into src/data/deals.json.
//
//   node scripts/import-card.js           dry run: writes reports/card-import-2026-27.md
//                                          + reports/card-import-2026-27.preview.json
//   node scripts/import-card.js --write   also overwrites src/data/deals.json and copies
//                                          logos for renamed businesses
//
// Reads last year's data from data-archive/ (not src/data/deals.json) so it can
// be re-run safely after the switch. Continuing businesses keep their
// locations[], closedLocations[], contact info and logo; new businesses get an
// empty locations[] for scripts/find-missing-locations.js to fill.
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs'
import { slugify, matchLocationsToRestriction } from '../src/utils/dealHelpers.js'

const ROOT = new URL('../', import.meta.url)
const CARD_CSV = 'data-archive/ssc_2026-27_card_transcription.csv'
const PREVIOUS = 'data-archive/deals-2025-26.json'
const ID_PREFIX = '2627'
const EXPIRES = '2027-10-01'
const REPORT = 'reports/card-import-2026-27.md'
const PREVIEW = 'reports/card-import-2026-27.preview.json'
const WRITE = process.argv.includes('--write')

const read = p => readFileSync(new URL(p, ROOT), 'utf8')

// ---------------------------------------------------------------- business matching

// new card name -> last year's name (confirmed by Adam 2026-09-24)
const RENAMES = {
  'Cell Again, Bad Apple & FIXIT': 'Bad Apple & FIXIT',
  'Axcess Accident Center': 'Chiropractic Access Accident Center',
  "Bobby's Burgers by Bobby Flay": 'Bobbys Burgers',
  'Tropical Smoothie Café': 'Tropical Smoothie Cafe',
  "Dippin' Dots at Fab Freddy's": "Dippin' Dots Fab Freddy's",
  'Tippin Point': 'Utah Country Dance',
  'Salsa Chocolate Latin Dance Night': 'Salsa at Southworth',
}
// last year's duplicate names that are really one business
const MERGED = { 'Cravings Bistro': "Craving's Bistro" }

// Kept in the data but never shown (see CLAUDE.md "hidden, not deleted").
const HIDDEN = { 'SSCDeals.com': "The card company's own app offer, not a business deal" }

// ---------------------------------------------------------------- locations ("valid at")

// Every way the card prints a location at the end of a deal line -> standardized
// locationRestriction wording (full city names, "&", "All ..." for broad scopes).
const TAILS = [
  ['Provo 122 E 1200 N, Orem Center St, N. Orem, AF, Highland, Saratoga, Traverse Mtn & Participating Locations',
    'Provo (122 E 1200 N), Orem (Center St), North Orem, American Fork, Highland, Saratoga Springs, Traverse Mountain & Participating Locations'],
  ['Provo (University PKWY), UVU Campus, Draper & WJ', 'Provo (University Pkwy), UVU Campus, Draper & West Jordan'],
  ['Provo (Univ PKWY), UVU Campus, Draper & WJ', 'Provo (University Pkwy), UVU Campus, Draper & West Jordan'],
  ['All Orem, N Provo, PG, Cedar Hills & AF', 'All Orem, North Provo, Pleasant Grove, Cedar Hills & American Fork'],
  ['Orem, N Provo, PG, CH & AF', 'All Orem, North Provo, Pleasant Grove, Cedar Hills & American Fork'],
  ['Orem, Vineyard, EM & Santaquin', 'Orem, Vineyard, Eagle Mountain & Santaquin'],
  ['Orem, Lehi & Particip. Locations', 'Orem, Lehi & Participating Locations'],
  ['Orem, Lehi & Partic Locs', 'Orem, Lehi & Participating Locations'],
  ['Spanish Fork & Participating Locations', 'Spanish Fork & Participating Locations'],
  ['SF & partic. locs', 'Spanish Fork & Participating Locations'],
  ['All UT County & SJ (Redwood)', 'All Utah County & South Jordan (Redwood)'],
  ['AF, SS, SJ (Redwood)', 'American Fork, Saratoga Springs & South Jordan (Redwood)'],
  ['Lehi (Pioneer Crs), Herriman', 'Lehi (Pioneer Crossing) & Herriman'],
  ['All Utah County & Bluffdale', 'All Utah County & Bluffdale'],
  ['All UT County & Bluffdale', 'All Utah County & Bluffdale'],
  ['All UT Cnty, except UVU', 'All Utah County, excluding UVU'],
  ['All UT Cnty Locs', 'All Utah County'],
  ['All Utah County', 'All Utah County'],
  ['All UT County', 'All Utah County'],
  ['UT County Stores', 'All Utah County'],
  ['All Northern Utah Locations', 'All Northern Utah'],
  ['All Northern UT locations', 'All Northern Utah'],
  ['All Northern UT locs', 'All Northern Utah'],
  ['Northern UT Locations', 'All Northern Utah'],
  ['Northern UT Locs', 'All Northern Utah'],
  ['All Wasatch Front Locations', 'All Wasatch Front'],
  ['All Wasatch Front Locs', 'All Wasatch Front'],
  ['All Wasatch', 'All Wasatch Front'],
  ['Valid All Utah Locations', 'All Utah Locations'],
  ['All Utah Locations', 'All Utah Locations'],
  ['All UT Locations', 'All Utah Locations'],
  ['All UT Locs', 'All Utah Locations'],
  ['All UT', 'All Utah Locations'],
  ['Valid Particip. Locations', 'Participating Locations'],
  ['All Locations', 'All Locations'],
  ['All Locs', 'All Locations'],
  ['Orem & South Salt Lake', 'Orem & South Salt Lake'],
  ['Orem & S. Salt Lake', 'Orem & South Salt Lake'],
  ['Orem, Lehi & Draper', 'Orem, Lehi & Draper'],
  ['AF, Provo & Saratoga', 'American Fork, Provo & Saratoga Springs'],
  ['Provo Center St & UVU', 'Provo (Center St) & UVU'],
  ['Provo Cntr & UVU', 'Provo (Center St) & UVU'],
  ['Saratoga & Eagle Mtn', 'Saratoga Springs & Eagle Mountain'],
  ['PG & Saratoga Only', 'Pleasant Grove & Saratoga Springs'],
  ['Provo & Park City', 'Provo & Park City'],
  ['Lehi & Bluffdale', 'Lehi & Bluffdale'],
  ['Saratoga Springs', 'Saratoga Springs'],
  ['Santaquin Only', 'Santaquin'],
  ['Provo Canyon', 'Provo Canyon'],
  ['Provo & Orem', 'Provo & Orem'],
  ['Provo and WJ', 'Provo & West Jordan'],
  ['Provo & WJ', 'Provo & West Jordan'],
  ['Provo & PG', 'Provo & Pleasant Grove'],
  ['Orem & Lehi', 'Orem & Lehi'],
  ['Lindon ONLY', 'Lindon'],
  ['Lehi & AF', 'Lehi & American Fork'],
  ['Lehi & SF', 'Lehi & Spanish Fork'],
  ['AF & Provo', 'American Fork & Provo'],
  ['Lehi Only', 'Lehi'],
  ['AF Only', 'American Fork'],
  ['PG Only', 'Pleasant Grove'],
  ['Saratoga', 'Saratoga Springs'],
  ['Provo', 'Provo'],
  ['Orem', 'Orem'],
  ['Lehi', 'Lehi'],
  ['AF', 'American Fork'],
  ['PG', 'Pleasant Grove'],
].sort((a, b) => b[0].length - a[0].length)

const SAME = Symbol('same locations')

// Lines where the location sits mid-sentence or the card wording needs a human
// read. Keyed by the exact transcribed title.
const OVERRIDES = {
  '2-4-1! Pizza! Inside Classic Fun Center Orem':
    { headline: '2-4-1! Pizza!', where: 'Orem', details: 'Inside Classic Fun Center' },
  '2-4-1! Lunch Buffet! M-F. Before 4 PM Orem No Early Bird':
    { headline: '2-4-1! Lunch Buffet!', where: 'Orem', details: 'Monday-Friday Before 4 PM, No Early Bird' },
  'Buy Any Entree, Get Any Specialty Beverage & Any Dessert FREE! (Up to 2 People) Excludes Holidays. Provo':
    { headline: 'Buy Any Entree, Get Any Specialty Beverage & Any Dessert FREE!', where: 'Provo', details: 'Up to 2 People, Excludes Holidays' },
  '$10 OFF! Vehicle Emissions! All Utah County MSKCU2':
    { headline: '$10 OFF! Vehicle Emissions!', where: 'All Utah County', details: 'Code: MSKCU2' },
  '$25 OFF! Any Oil Change! All Utah County D9EUP2':
    { headline: '$25 OFF! Any Oil Change!', where: 'All Utah County', details: 'Code: D9EUP2' },
  '2-4-1! Drink! Lehi Excludes Energy Drink Mixers':
    { headline: '2-4-1! Drink!', where: 'Lehi', details: 'Excludes Energy Drink Mixers' },
  'FREE! Stretch Session! All UT, New Clients Only, Max 2/Person':
    { headline: 'FREE! Stretch Session!', where: 'All Utah Locations', details: 'New Clients Only, Max 2 Per Person' },
  'Buy 1 Hour, Get 1 FREE! Code: SSCARD Bring Clubs All UT Locs':
    { headline: 'Buy 1 Hour, Get 1 FREE!', where: 'All Utah Locations', details: 'Code: SSCARD, Bring Clubs' },
  // One card line, but each activity has its own single bubble -> one deal each.
  '2-4-1! Admission to ① Christmas and ① Halloween Cruise! Valid M-Th, 8pm Ride.': [
    { headline: '2-4-1! Christmas Cruise Admission!', where: null, details: 'Monday-Thursday, 8pm Ride', maxUses: 1 },
    { headline: '2-4-1! Halloween Cruise Admission!', where: null, details: 'Monday-Thursday, 8pm Ride', maxUses: 1 },
  ],
  '2-4-1! ① Canoe Rental! ① Zipline Tour! Reservation Required': [
    { headline: '2-4-1! Canoe Rental!', where: null, details: 'Reservation Required', maxUses: 1 },
    { headline: '2-4-1! Zipline Tour!', where: null, details: 'Reservation Required', maxUses: 1 },
  ],
  // The Picklr's "Lehi" store has a Saratoga Springs address and its
  // "Bluffdale" store a Herriman one; naming both lets the matcher find them.
  '2-4-1! 3 Hr Open Play Session! Lehi & Bluffdale':
    { headline: '2-4-1! 3 Hr Open Play Session!', where: 'Lehi/Saratoga Springs & Bluffdale/Herriman', details: '' },
  'FREE! 3 Hr Open Play Session! Lehi & Bluffdale':
    { headline: 'FREE! 3 Hr Open Play Session!', where: 'Lehi/Saratoga Springs & Bluffdale/Herriman', details: '' },
  'FREE! Class & FREE! Court Reservation!':
    { headline: 'FREE! Class & Court Reservation!', where: null, details: '' },
  'FREE! Board Game Rental and $5! Gift Card! Lehi':
    { headline: 'FREE! Board Game Rental and $5 Gift Card!', where: 'Lehi', details: '' },
  '2-4-1! Screaming Falcon Big Line! or Falcon Rush! Code: SSC24ZU':
    { headline: '2-4-1! Screaming Falcon Big Line or Falcon Rush!', where: null, details: 'Code: SSC24ZU' },
}

// ---------------------------------------------------------------- text cleanup

const DAY = { m: 'Monday', mon: 'Monday', t: 'Tuesday', tu: 'Tuesday', tue: 'Tuesday', tues: 'Tuesday', w: 'Wednesday', wed: 'Wednesday',
  th: 'Thursday', thu: 'Thursday', thur: 'Thursday', thurs: 'Thursday', f: 'Friday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }
const D = '(?:Mon|Tues?|Wed|Thurs?|Thu|Th|Fri|Sat|Sun|M|T|W|F)'
const DAY_RANGE = new RegExp(`\\b(${D})\\.?\\s?-\\s?(${D})\\b\\.?`, 'g')
const DAY_SINGLE = /\b(Mon|Tues?|Wed|Thurs?|Thu|Fri|Sat|Sun)\b\.?/g
const keepCase = (orig, rep) => (orig[0] === orig[0].toLowerCase() ? rep.toLowerCase() : rep)

const WORD_EXPANSIONS = [
  [/\bexcl\b\.?/gi, 'Excluding'],
  [/\breg\b\.?\s*/gi, 'Regular '],
  [/\bhrs\b\.?/gi, 'Hours'],
  [/\bhr\b\.?/gi, 'Hour'],
  [/\bappt\b\.?/gi, 'Appointment'],
  [/\breq\b\.?/gi, 'Required'],
  [/\bw\/\s?/gi, 'with '],
  [/\bmed\b(?= or)/gi, 'Medium'],
  [/\blrg\b/gi, 'Large'],
  [/\bpcs\b\.?/gi, 'Pieces'],
  [/\bconv\b\.?/gi, 'Conventional'],
  [/\bCC Ski\b/g, 'Cross-Country Ski'],
]

function expand(text) {
  let t = text
    .replace(DAY_RANGE, (m, a, b) => `${DAY[a.toLowerCase()]}-${DAY[b.toLowerCase()]}`)
    .replace(DAY_SINGLE, (m, a) => DAY[a.toLowerCase()])
  for (const [re, rep] of WORD_EXPANSIONS) t = t.replace(re, m => keepCase(m, rep))
  return t.replace(/\s{2,}/g, ' ').trim()
}

// Separate conditions get a comma between them ("After 6pm, Shoes Not Included").
const COMMA_BEFORE = /(\w)\s+(?=(Not Valid|Max\b|Code:|Please\b|Call for|Excludes\b|Excluding\b|Bring Clubs|Email\b|Redeem\b|Some Exclusions|Restrictions Apply|New (Customers|Clients|Students)|Shoes\b|Skate Rental))/g

function cleanDetails(parts) {
  return parts
    .map(p => p.replace(/[\s!.]+$/, '').replace(/^\((.*)\)$/, '$1').trim())
    .filter(Boolean)
    .map(p => expand(p)
      .replace(/\b(?:Use\s+)?Code:?\s*/gi, 'Code: ')
      .replace(COMMA_BEFORE, '$1, ')
      .replace(/^./, c => c.toUpperCase()))
    .join(', ')
}

// Headlines end in "!" like the card ("2-4-1! Lunch Buffet!"), never "." or nothing.
const finishHeadline = h => h.replace(/\.$/, '').replace(/([A-Za-z0-9"])$/, '$1!')

const CONDITION = /\b(only|not|excl|excludes?|excluding|up to|max|before|after|valid|required|req|please|call|appt|appointment|reservation|carry ?out|dine-in|included|new (customers|clients|students)|restrictions|present card|per|email|redeem|exclusions|select seats|code|anytime|m-th|m-thurs|m-f|m-fri|t-th|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|sat)\b/i
const VALUE_TAG = /^(One )?(2-4-1|FREE|\d+% OFF|\$[\d.]+ OFF)!$/i
const NO_SPLIT_ABBREV = /(\b(appt|req|excl|reg|jr|st|n|s|locs?|particip|partic)|oz)$/i

function splitSegments(text) {
  const segs = []
  let cur = ''
  for (let i = 0; i < text.length; i++) {
    cur += text[i]
    const next = text[i + 1]
    if (text[i] === '!' && (next === ' ' || next === undefined)) { segs.push(cur.trim()); cur = '' }
    else if (text[i] === '.' && next === ' ' && !NO_SPLIT_ABBREV.test(cur.slice(0, -1))) { segs.push(cur.trim()); cur = '' }
  }
  if (cur.trim()) segs.push(cur.trim())
  return segs
}

function parseTitle(raw) {
  if (OVERRIDES[raw]) return [OVERRIDES[raw]].flat().map(o => ({ ...o, source: 'override' }))
  let t = raw.replace(/[①②③④⑤⑥]/g, '').replace(/!(?=[^\s!])/g, '! ').replace(/\s+/g, ' ').trim()

  let where = null
  const stripped = t.replace(/[\s.!,]+$/, '')
  if (/\bSame Locations$/i.test(stripped)) {
    where = SAME
    t = stripped.replace(/\s*\bSame Locations$/i, '')
  } else {
    for (const [tail, std] of TAILS) {
      if (!stripped.toLowerCase().endsWith(tail.toLowerCase())) continue
      const before = stripped.slice(0, stripped.length - tail.length)
      if (before !== '' && !/[\s!.,]$/.test(before)) continue
      where = std
      t = before.replace(/[\s,]+$/, '')
      break
    }
  }

  const segs = splitSegments(t)
  let k = VALUE_TAG.test(segs[0]) ? 2 : 1
  while (k < segs.length && !CONDITION.test(segs[k])) k++
  const headline = segs.slice(0, k).join(' ')
  return { headline, where, details: cleanDetails(segs.slice(k)), source: 'parsed' }
}

function valueLabel(headline, printedValue) {
  const h = headline
  if (/^2-4-1/i.test(h)) return '2 for 1'
  let m = h.match(/^(\d+)% OFF/i) || h.match(/Get [^!]*?(\d+)% OFF/i)
  if (m) return `${m[1]}% Off`
  m = h.match(/^\$([\d.]+) OFF/i)
  if (m) return `$${m[1]} Off`
  if (/^(One )?FREE!/i.test(h) || /Eat FREE/i.test(h)) return 'Free Item'
  if (/^(Buy|Rent)\b.*\bGet (1|One|2nd|the 2nd|Entree|1 Entree|1 Menu Item|a Burger|a Melt|Burger or Sandwich|Any Platter|an Adult)\b.*FREE/i.test(h)) return 'Buy 1 Get 1 Free'
  if (/^(Buy|Rent)\b.*FREE/i.test(h)) return 'Free Item'
  m = h.match(/(\d+ for \$[\d.]+)/i) || h.match(/(\$[\d.]+)/)
  if (m) return m[1]
  return printedValue || ''
}

// ---------------------------------------------------------------- CSV

function parseCSV(s) {
  const rows = []; let row = [], cell = '', q = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) { if (c === '"' && s[i + 1] === '"') { cell += '"'; i++ } else if (c === '"') q = false; else cell += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = '' }
    else cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  const [header, ...rest] = rows.filter(r => r.some(Boolean))
  return rest.map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])))
}

// ---------------------------------------------------------------- build

const card = parseCSV(read(CARD_CSV).trimStart()) // trimStart also drops a byte-order mark
const previous = JSON.parse(read(PREVIOUS))

// Names are matched ignoring punctuation/case ("Jersey Mike's" = "Jersey Mikes").
const nameKey = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '')
const oldByKey = {}
for (const d of previous) {
  const k = nameKey(MERGED[d.name] ?? d.name)
  ;(oldByKey[k] ||= []).push(d)
}
const oldFor = name => oldByKey[nameKey(RENAMES[name] ?? name)]

// Written by scripts/lookup-new-locations.js (Google Places) for businesses
// with no usable locations from last year.
const LOOKUP = 'data-archive/new-locations-2026-27.json'
const lookedUp = existsSync(new URL(LOOKUP, ROOT)) ? JSON.parse(read(LOOKUP)) : {}
const lookupFor = (name, continuing) => {
  const entry = lookedUp[name]
  if (!entry || (continuing && !entry.replaceExisting)) return null
  return entry.locations.map(({ lat, lng, address, phone }) => ({ lat, lng, address, phone }))
}

const deals = []
const flags = []
card.forEach(row => [parseTitle(row.title)].flat().forEach(parsed => {
  const old = oldFor(row.business)
  const source = old && old.reduce((best, d) => (d.locations.length > best.locations.length ? d : best), old[0])
  const found = lookupFor(row.business, !!source)
  const deal = {
    id: `${ID_PREFIX}-${row.category}-${String(deals.length + 1).padStart(3, '0')}`,
    name: row.business,
    category: row.category,
    address: null, lat: null, lng: null,
    locationRestriction: parsed.where,
    deal: {
      title: finishHeadline(expand(parsed.headline)),
      description: parsed.details,
      restrictions: parsed.details,
      value: valueLabel(parsed.headline, row.value),
      maxUses: parsed.maxUses ?? (row.max_uses === '' ? null : Number(row.max_uses)),
      expiresAt: EXPIRES,
    },
    contact: { phone: source?.contact?.phone ?? null, website: source?.contact?.website ?? null, hours: source?.contact?.hours ?? null },
    tags: [row.category],
    locations: found ?? (source ? structuredClone(source.locations) : []),
  }
  if (source?.closedLocations) deal.closedLocations = structuredClone(source.closedLocations)
  if (HIDDEN[row.business]) Object.assign(deal, { active: false, closedReason: HIDDEN[row.business] })
  deal._raw = row.title
  deal._parse = parsed.source
  deal._continuing = !!source
  deal._lookedUp = !!found
  deals.push(deal)
}))

// "Same Locations" = same as the business's previous deal on the card
deals.forEach((d, i) => {
  if (d.locationRestriction !== SAME) return
  const prev = deals.slice(0, i).reverse().find(p => p.name === d.name && p.locationRestriction && p.locationRestriction !== SAME)
  d.locationRestriction = prev ? prev.locationRestriction : null
  if (!prev) flags.push([d, '"Same Locations" with no earlier deal from this business to copy from'])
})

// top-level address = first location that honors the deal
deals.forEach(d => {
  d.locationRestriction ??= ''
  const honoring = d.locationRestriction ? matchLocationsToRestriction(d.locations, d.locationRestriction) : d.locations
  const first = honoring?.[0] ?? d.locations[0]
  if (first) Object.assign(d, { address: first.address, lat: first.lat, lng: first.lng })
})

// ---------------------------------------------------------------- checks

const PLACE_HINT = /\b(orem|provo|lehi|saratoga|eagle|pleasant grove|american fork|spanish fork|draper|bluffdale|herriman|lindon|santaquin|vineyard|highland|springville|payson|utah|ut\b|county|locations?|locs)\b/i
const ABBREV_LEFT = /\b(Lrg|Med|Reg|Hrs?|Appt|Req|Excl|Pcs|Conv|Locs?|Cnty|Mtn|AF|SF|PG|WJ|EM|UT|M-Th|M-F)\b|w\//
deals.forEach(d => {
  if (d.active === false) return
  if (!d.locations.length) flags.push([d, 'new business: no locations yet (needs lookup)'])
  else if (d.locationRestriction && !matchLocationsToRestriction(d.locations, d.locationRestriction))
    flags.push([d, `"${d.locationRestriction}" matches none of this business's ${d.locations.length} known location(s)`])
  if (!d.locationRestriction && PLACE_HINT.test(d.deal.title + ' ' + d.deal.description))
    flags.push([d, 'looks like it may still contain a location'])
  if (ABBREV_LEFT.test(d.deal.title + ' ' + d.deal.description))
    flags.push([d, 'abbreviation left in title/details'])
  if (!d.deal.value) flags.push([d, 'no value label'])
})

const newBusinesses = [...new Set(deals.filter(d => !d._continuing).map(d => d.name))]
// [old logo slug, new logo slug] for every carried-over business whose name changed at all
const renamedLogos = [...new Set(deals.filter(d => d._continuing).map(d => d.name))]
  .map(n => [slugify(oldFor(n)[0].name), slugify(n)])
  .filter(([o, n]) => o !== n)
const logoExists = slug => existsSync(new URL(`public/logos/${slug}.png`, ROOT))
const missingLogos = [...new Set(deals.map(d => d.name))].filter(n => {
  const slug = slugify(n)
  return !logoExists(slug) && !renamedLogos.some(([o, nw]) => nw === slug && logoExists(o))
})

// ---------------------------------------------------------------- output

const clean = deals.map(d => Object.fromEntries(Object.entries(d).filter(([k]) => !k.startsWith('_'))))
const active = clean.filter(d => d.active !== false)
const L = []
L.push('# 2026-27 card import — dry run', '')
L.push(`Generated by \`scripts/import-card.js\` from \`${CARD_CSV}\`. Nothing in \`src/data/deals.json\` changes until it is run with \`--write\`.`, '')
L.push('## Summary', '')
L.push(`- ${clean.length} deals (${active.length} shown, ${clean.length - active.length} hidden) from ${new Set(active.map(d => d.name)).size} businesses`)
L.push(`- ${active.filter(d => d.locationRestriction).length} restricted, ${active.filter(d => !d.locationRestriction).length} valid at all locations`)
L.push(`- ${active.filter(d => d.deal.description).length} have Details text`)
L.push(`- ${newBusinesses.length} new businesses (locations from Google lookup); ${missingLogos.length} businesses need logos`)
L.push(`- ${Object.keys(OVERRIDES).length} lines hand-parsed (overrides); ${flags.length} flags`, '')
L.push(`## Flags (${flags.length})`, '')
const flagGroups = {}
flags.forEach(([d, msg]) => { (flagGroups[msg.startsWith('new business') ? 'New businesses — no locations yet' : msg.startsWith('"') ? 'Restriction matches no known location' : msg] ||= []).push([d, msg]) })
for (const [group, items] of Object.entries(flagGroups)) {
  L.push(`### ${group} (${items.length})`, '')
  items.forEach(([d, msg]) => L.push(`- \`${d.id}\` ${d.name} — ${d.deal.title}${group.startsWith('New') ? '' : ` — ${msg}`}`))
  L.push('')
}
L.push(`## Logos needed (${missingLogos.length})`, '', missingLogos.map(n => `- ${n} (\`public/logos/${slugify(n)}.png\`)`).join('\n'), '')
L.push('## Every deal: card text → app', '')
L.push('| # | Business | Card text | Headline | Valid at | Details | Value | Uses |')
L.push('|---|---|---|---|---|---|---|---|')
const cellEsc = s => String(s ?? '').replace(/\|/g, '\\|')
deals.forEach((d, i) => L.push(`| ${i + 1}${d._parse === 'override' ? '*' : ''} | ${cellEsc(d.name)}${d.active === false ? ' (hidden)' : ''} | ${cellEsc(d._raw)} | ${cellEsc(d.deal.title)} | ${cellEsc(d.locationRestriction) || '—'} | ${cellEsc(d.deal.description) || '—'} | ${cellEsc(d.deal.value)} | ${d.deal.maxUses ?? '∞'} |`))
L.push('', '\\* hand-parsed override', '')

writeFileSync(new URL(REPORT, ROOT), L.join('\n'))
writeFileSync(new URL(PREVIEW, ROOT), JSON.stringify(clean, null, 2) + '\n')
console.log(L.slice(4, 10).join('\n'))
console.log('Flag groups:', Object.fromEntries(Object.entries(flagGroups).map(([k, v]) => [k, v.length])))

if (WRITE) {
  writeFileSync(new URL('src/data/deals.json', ROOT), JSON.stringify(clean, null, 2) + '\n')
  for (const [o, n] of renamedLogos) {
    if (logoExists(o) && !logoExists(n)) copyFileSync(new URL(`public/logos/${o}.png`, ROOT), new URL(`public/logos/${n}.png`, ROOT))
  }
  console.log('Wrote src/data/deals.json and copied renamed logos.')
}
