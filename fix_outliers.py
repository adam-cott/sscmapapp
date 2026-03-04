#!/usr/bin/env python3
"""
Fix deals that were geocoded to wrong Utah cities.
Re-geocodes them using their actual street addresses.
"""
import json, time, urllib.request, urllib.parse, os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH  = os.path.join(SCRIPT_DIR, 'src', 'data', 'deals.json')

# Correct addresses for businesses that Nominatim placed in wrong cities
CORRECT_ADDRESSES = {
    'Back Nine Golf':              '865 S 700 E, Orem, UT',
    "Culver's":                    '1211 W 800 N, Orem, UT',
    "Dirty Dough's":               '3153 N Canyon Rd, Provo, UT',
    'Franz Bakery Outlet':         '1177 W 100 N, Provo, UT',
    'G.O.A.T Haircuts':            '160 E University Pkwy, Orem, UT',
    'Grease Monkey':               '919 W State St, Pleasant Grove, UT',
    'Great Harvest Bread Co.':     '1774 N University Pkwy, Provo, UT',
    'Havoline':                    '1457 Exchange Dr, Saratoga Springs, UT',
    "Ike's":                       '1195 E Main St, Lehi, UT',
    'Jack in the Box':             '1200 Towne Centre Blvd, Provo, UT',  # placeholder (not open yet)
    'LoLo Hawaiian BBQ':           '366 E University Pkwy, Orem, UT',
    "Marco's Pizza":               '2245 N University Pkwy, Provo, UT',
    "Mrs. Cavanaugh's Chocolates": '1163 S State St, Orem, UT',
    'Pizza Pie Cafe':              '573 W 1600 N, Orem, UT',
    'Quench It!':                  '692 E 800 S, Orem, UT',
    'Shiny Shell Carwash':         '1188 S University Ave, Provo, UT',
    'The Place Pizza':             '1032 N Redwood Rd, Saratoga Springs, UT',
    'Tropical Smoothie Cafe':      '977 W 400 S, Springville, UT',
    'Wingers':                     '1200 Towne Centre Blvd, Provo, UT',
    'Yogurtland':                  '534 E University Pkwy, Orem, UT',
    'ZAGG':                        '1200 Towne Centre Blvd, Provo, UT',
}

# Outlier lat/lng range (outside Utah County) - these need fixing
LAT_MIN, LAT_MAX = 39.8, 41.0
LNG_MIN, LNG_MAX = -112.5, -111.4


def geocode_address(address: str):
    url = (
        'https://nominatim.openstreetmap.org/search'
        f'?q={urllib.parse.quote(address)}'
        '&format=json&limit=1&countrycodes=us'
    )
    req = urllib.request.Request(
        url, headers={'User-Agent': 'StarvingStudentCardMapApp/1.0'}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            results = json.loads(resp.read())
            if results:
                return float(results[0]['lat']), float(results[0]['lon'])
    except Exception as e:
        print(f'  WARNING: {e}')
    return None, None


def main():
    with open(JSON_PATH, encoding='utf-8') as f:
        deals = json.load(f)

    # Find deals with out-of-range coords that have known correct addresses
    to_fix = {}
    for d in deals:
        if d['lat'] is None:
            continue
        is_outlier = not (LAT_MIN <= d['lat'] <= LAT_MAX and LNG_MIN <= d['lng'] <= LNG_MAX)
        if is_outlier and d['name'] in CORRECT_ADDRESSES:
            to_fix[d['name']] = CORRECT_ADDRESSES[d['name']]

    print(f'Businesses to re-geocode: {len(to_fix)}')

    # Geocode each unique address
    addr_cache = {}
    for biz, addr in sorted(to_fix.items()):
        if addr not in addr_cache:
            lat, lng = geocode_address(addr)
            addr_cache[addr] = (lat, lng)
            status = 'OK' if lat else 'XX'
            print(f'  {status} {biz} | {addr} => {lat}, {lng}')
            time.sleep(1)
        else:
            lat, lng = addr_cache[addr]
            print(f'  (cached) {biz} => {lat}, {lng}')

    # Apply fixes
    updated = 0
    for d in deals:
        if d['lat'] is None:
            continue
        is_outlier = not (LAT_MIN <= d['lat'] <= LAT_MAX and LNG_MIN <= d['lng'] <= LNG_MAX)
        if is_outlier and d['name'] in CORRECT_ADDRESSES:
            addr = CORRECT_ADDRESSES[d['name']]
            lat, lng = addr_cache.get(addr, (None, None))
            if lat is not None:
                d['lat'] = lat
                d['lng'] = lng
                updated += 1

    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(deals, f, ensure_ascii=False, indent=2)

    # Report remaining outliers
    still_out = [(d['name'], d['lat'], d['lng']) for d in deals
                 if d['lat'] and not (LAT_MIN <= d['lat'] <= LAT_MAX and LNG_MIN <= d['lng'] <= LNG_MAX)]
    print(f'\nUpdated {updated} deals')
    print(f'Still out-of-range: {len(still_out)}')
    for name, lat, lng in sorted(set(still_out)):
        print(f'  {lat:.4f} {lng:.4f}  {name}')


if __name__ == '__main__':
    main()
