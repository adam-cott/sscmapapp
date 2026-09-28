import { describe, it, expect } from 'vitest'
import { matchLocationsToRestriction, getMapFocusLocations, getDirectionsLocation, filterDeals, parsePlaceQuery, searchCities } from './dealHelpers'

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

describe('location search', () => {
  const deal = (id, name, locations, extra = {}) =>
    ({ id, name, category: 'restaurants', deal: { title: 'A deal', description: '' }, locationRestriction: '', locations, ...extra })
  const AF = loc('American Fork')
  const UVU_STORE = { ...loc('Orem'), venue: 'UVU' }
  const kfc = deal('kfc', 'KFC', [PROVO, AF, OREM], { locationRestriction: 'All Utah Locations' })
  const crumbl = deal('crumbl', 'Crumbl', [OREM, AF], { locationRestriction: 'Orem', category: 'treats' })
  const pizza = deal('pizza', 'Pie Place', [AF, PROVO], { category: 'pizza' })
  const beach = deal('beach', 'Provo Beach', [PROVO])
  const online = deal('online', 'HiddenHunts.com', [])
  const jamba = deal('jamba', 'Jamba', [UVU_STORE, OREM])
  const wendys = deal('wendys', "Wendy's", [LEHI, OREM], { locationRestriction: 'Lehi & Traverse Mountain' })
  const all = [
    kfc, crumbl, pizza, beach, online, jamba, wendys,
    deal('sandy', 'Shop One', [loc('Sandy')]), deal('santaquin', 'Shop Two', [loc('Santaquin')]),
    deal('slc', 'Shop Three', [loc('Salt Lake City')]), deal('ssl', 'Shop Four', [loc('South Salt Lake')]),
    deal('wj', 'Shop Five', [loc('West Jordan')]), deal('sj', 'Shop Six', [loc('South Jordan')]),
    deal('pg', 'Shop Seven', [loc('Pleasant Grove')], { category: 'pizza' }),
    deal('midvale', 'Shop Eight', [loc('Midvale')]), deal('midway', 'Shop Nine', [loc('Midway')]),
  ]
  const ids = q => filterDeals(all, q, []).map(d => d.id).sort()
  const found = (q, id) => filterDeals(all, q, []).find(d => d.id === id)

  it('finds a chain through its store address, narrowed to that city', () => {
    expect(ids('American Fork')).toEqual(['kfc', 'pizza'])
    expect(cities(found('American Fork', 'kfc').locations)).toEqual(['American Fork'])
  })

  it('skips a business whose deal is not honored in that city', () => {
    expect(ids('American Fork')).not.toContain('crumbl')
  })

  it('combines a city with other words, in either order', () => {
    expect(ids('American Fork pizza')).toEqual(['pizza'])
    expect(ids('pizza american fork')).toEqual(['pizza'])
    expect(ids('American Fork sushi')).toEqual([])
  })

  it('matches partial names from the start, 40%+ and 3+ letters', () => {
    expect(ids('Americ')).toEqual(['kfc', 'pizza'])
    expect(ids('ork')).toEqual([])
    expect(ids('Fork')).toEqual([])
    expect(parsePlaceQuery('Or', searchCities(all))).toBeNull()
    expect(ids('San')).toEqual(['sandy']) // 3 of 9 letters of Santaquin is under 40%
    expect(ids('Mid')).toEqual(['midvale', 'midway']) // several cities fit: all of them
  })

  it('keeps look-alike cities apart', () => {
    expect(ids('Salt Lake City')).toEqual(['slc'])
    expect(ids('West Jordan')).toEqual(['wj'])
  })

  it('reads nicknames only when followed by a space', () => {
    expect(ids('pg pizza')).toEqual(['pg'])
    expect(parsePlaceQuery('pg ', searchCities(all))?.places).toEqual([{ city: 'Pleasant Grove' }])
    expect(parsePlaceQuery('pg', searchCities(all))).toBeNull()
    expect(parsePlaceQuery('pgs', searchCities(all))).toBeNull()
    expect(parsePlaceQuery('ss pizza', searchCities(all))).toBeNull()
  })

  it('still finds a brand whose name contains a city', () => {
    expect(ids('Provo Beach')).toContain('beach')
  })

  it('leaves out deals with no stores', () => {
    expect(ids('Provo')).not.toContain('online')
  })

  it('matches venues through store tags, falling back for deals that only name the venue', () => {
    expect(found('UVU', 'jamba').locations).toEqual([UVU_STORE])
    expect(cities(found('Traverse Mountain', 'wendys').locations)).toEqual(['Lehi'])
    expect(ids('Fashion Place')).toEqual([])
  })

  it('does not find a deal through a place it excludes', () => {
    const costa = deal('costa', 'Costa', [UVU_STORE, OREM], { locationRestriction: 'All Utah County, excluding UVU' })
    expect(filterDeals([costa], 'UVU', []).map(d => d.id)).toEqual([])
    expect(filterDeals([costa], 'Orem', []).map(d => d.id)).toEqual(['costa'])
  })

  it('never changes the original deals', () => {
    const copy = found('American Fork', 'kfc')
    expect(copy).not.toBe(kfc)
    expect(copy.id).toBe('kfc')
    expect(kfc.locations).toHaveLength(3)
  })

  it('ignores case and extra spaces', () => {
    expect(ids('  AMERICAN   fork  ')).toEqual(['kfc', 'pizza'])
  })
})
