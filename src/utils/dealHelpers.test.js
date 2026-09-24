import { describe, it, expect } from 'vitest'
import { matchLocationsToRestriction, getMapFocusLocations, getDirectionsLocation } from './dealHelpers'

const loc = (city, lat = 40, lng = -111) => ({ address: `1 Main St, ${city}, UT 84000`, lat, lng })
const cities = locs => locs?.map(l => l.address.split(', ')[1]) ?? null

const SARATOGA = loc('Saratoga Springs')
const EAGLE_1 = loc('Eagle Mountain')
const EAGLE_2 = loc('Eagle Mountain')
const OREM = loc('Orem')
const LEHI = loc('Lehi')
const PROVO = loc('Provo')
const SPANISH_FORK = loc('Spanish Fork')
const HERRIMAN = loc('Herriman')

describe('matchLocationsToRestriction', () => {
  it('keeps every location in the named cities', () => {
    expect(cities(matchLocationsToRestriction([SARATOGA, EAGLE_1, EAGLE_2, OREM], 'Saratoga Springs & Eagle Mountain')))
      .toEqual(['Saratoga Springs', 'Eagle Mountain', 'Eagle Mountain'])
  })

  it('handles comma lists and ignores "Participating Locations"', () => {
    expect(cities(matchLocationsToRestriction([OREM, LEHI, PROVO], 'Orem, Lehi & Participating Locations')))
      .toEqual(['Orem', 'Lehi'])
  })

  it('treats "All ..." wording as every location, minus exclusions', () => {
    expect(cities(matchLocationsToRestriction([OREM, EAGLE_1, SPANISH_FORK, PROVO], 'All Utah County, excluding Eagle Mountain & Spanish Fork')))
      .toEqual(['Orem', 'Provo'])
    expect(matchLocationsToRestriction([OREM, PROVO], 'All Locations')).toHaveLength(2)
  })

  it('limits "All Utah County" to Utah County cities plus any extra named place', () => {
    const TOOELE = loc('Tooele')
    const WEST_VALLEY = loc('West Valley City')
    expect(cities(matchLocationsToRestriction([OREM, TOOELE, HERRIMAN, WEST_VALLEY, LEHI], 'All Utah County')))
      .toEqual(['Orem', 'Lehi'])
    expect(cities(matchLocationsToRestriction([OREM, TOOELE, HERRIMAN], 'All Utah County & Herriman')))
      .toEqual(['Orem', 'Herriman'])
  })

  it('finds the city in addresses with an extra venue or suite part', () => {
    const salem = { address: '565 W. State Rd. 198 Hwy, 6, Salem, UT 84653, USA' }
    const sandy = { address: 'South Towne Center, 10450 S State St, Sandy, UT 84070, USA' }
    expect(matchLocationsToRestriction([salem, sandy], 'All Utah County')).toEqual([salem])
  })

  it('matches venue names like "UVU Campus" by address, for include and exclude', () => {
    const uvu = { address: '800 W University Pkwy, Orem, UT 84058' }
    expect(matchLocationsToRestriction([uvu, OREM, PROVO], 'Provo & UVU Campus')).toEqual([uvu, PROVO])
    expect(matchLocationsToRestriction([uvu, OREM], 'All Utah County, excluding UVU')).toEqual([OREM])
  })

  it('ignores parenthetical detail and unmatchable venue names', () => {
    expect(cities(matchLocationsToRestriction([PROVO, OREM], 'Provo (Center St) & UVU'))).toEqual(['Provo'])
  })

  it('matches either name in "Brand city/Address city" pairs', () => {
    expect(cities(matchLocationsToRestriction([SARATOGA, HERRIMAN, OREM], 'Lehi/Saratoga Springs & Bluffdale/Herriman')))
      .toEqual(['Saratoga Springs', 'Herriman'])
  })

  it('returns null when no location is in a named city', () => {
    expect(matchLocationsToRestriction([OREM, PROVO], 'Lehi')).toBeNull()
  })
})

describe('getMapFocusLocations', () => {
  it('returns all locations when there is no restriction', () => {
    expect(getMapFocusLocations({ locationRestriction: '', locations: [OREM, PROVO] })).toHaveLength(2)
  })
})

describe('getDirectionsLocation', () => {
  const near = loc('Orem', 40.30, -111.70)
  const far = loc('Orem', 40.60, -111.90)
  const deal = { locationRestriction: 'Orem', locations: [far, near, loc('Provo', 40.30, -111.70)] }

  it('picks the honoring location nearest the user', () => {
    expect(getDirectionsLocation(deal, { lat: 40.31, lng: -111.69 })).toBe(near)
  })

  it('falls back to the first honoring location without the user location', () => {
    expect(getDirectionsLocation(deal, null)).toBe(far)
  })

  it('returns null when nothing honors the deal', () => {
    expect(getDirectionsLocation({ locationRestriction: 'Lehi', locations: [OREM] }, null)).toBeNull()
  })
})
