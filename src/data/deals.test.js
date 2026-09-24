/* global process */
// Whole-dataset checks for deals.json. To check a card import before switching:
//   DEALS_FILE=reports/card-import-2026-27.preview.json npx vitest run src/data
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { getMapFocusLocations } from '../utils/dealHelpers'

const file = process.env.DEALS_FILE ?? 'src/data/deals.json'
const all = JSON.parse(readFileSync(file, 'utf8'))
const deals = all.filter(d => d.active !== false)
const CATEGORIES = ['pizza', 'restaurants', 'sandwiches', 'treats', 'free', 'entertainment', 'retail']

// Shorthand the card uses that should always be spelled out in the app.
const ABBREVIATION = /\b(Lrg|Med|Reg|Hrs?|Appt|Req|Excl|Pcs|Conv|Locs?|Cnty|Mtn|Particip|Partic|M-Th|M-F|T-Th)\b|\bw\//
const PLACE_ABBREVIATION = /\b(AF|SF|PG|WJ|EM|SS|SJ|CH|UT|Ut|N\.|S\.)(?=\W|$)/
const SHORT_DAY = /\b(Mon|Tue|Tues|Wed|Thu|Thur|Thurs|Fri|Sat|Sun)\b/

const offenders = (check) => deals.filter(check).map(d => `${d.id} ${d.name}`)

describe(`deals data (${file})`, () => {
  it('has unique ids', () => {
    expect(new Set(all.map(d => d.id)).size).toBe(all.length)
  })

  it('has the fields every screen relies on', () => {
    expect(offenders(d =>
      !CATEGORIES.includes(d.category) || !d.deal.title || !d.deal.value || !d.deal.expiresAt ||
      !(d.deal.maxUses === null || (Number.isInteger(d.deal.maxUses) && d.deal.maxUses > 0)),
    )).toEqual([])
  })

  it('gives every deal at least one map pin that honors it', () => {
    expect(offenders(d => !getMapFocusLocations(d)?.length)).toEqual([])
  })

  it('only resolves pins from the business’s own locations', () => {
    expect(offenders(d => (getMapFocusLocations(d) ?? []).some(l => !d.locations.includes(l)))).toEqual([])
  })

  it('spells out abbreviations and day names', () => {
    expect(offenders(d => ABBREVIATION.test(d.deal.title) || ABBREVIATION.test(d.deal.description ?? ''))).toEqual([])
    expect(offenders(d => SHORT_DAY.test(d.deal.title) || SHORT_DAY.test(d.deal.description ?? ''))).toEqual([])
    expect(offenders(d => PLACE_ABBREVIATION.test(d.locationRestriction ?? ''))).toEqual([])
  })

  it('keeps "Valid at" out of descriptions and has no garbled or padded text', () => {
    expect(offenders(d => /valid at:/i.test(d.deal.description ?? ''))).toEqual([])
    expect(offenders(d => /â€|Ã/.test(JSON.stringify(d.deal)))).toEqual([])
    expect(offenders(d => (d.deal.description ?? '') !== (d.deal.description ?? '').trim())).toEqual([])
  })
})
