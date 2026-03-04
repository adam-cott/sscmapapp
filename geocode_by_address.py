#!/usr/bin/env python3
"""
Geocode businesses by their known street addresses.
Updates deals.json for entries that still have null lat/lng.
"""
import json, time, urllib.request, urllib.parse, os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH  = os.path.join(SCRIPT_DIR, 'src', 'data', 'deals.json')

# Known addresses found via web search
# Key: business name as it appears in deals.json
KNOWN_ADDRESSES = {
    '5 Star BBQ':                         '227 W Bulldog Blvd, Provo, UT',
    'Bad Apple & FIXIT':                  '79 S State St, Orem, UT',
    'BYU Bowling & Games Center':         '1171 Wilkinson Student Center, Provo, UT',
    'BYU Outdoors Unlimited':             '2201 N Canyon Rd, Provo, UT',
    'BYU Studio 1030':                    '1030 Wilkinson Student Center, Provo, UT',
    'Body Balance Massage and Float':     '366 S 500 E, American Fork, UT',
    "Bobby's Burgers":                    '575 E University Pkwy, Orem, UT',
    'Brazuca Pizza':                      '93 S State St, Orem, UT',
    "Bruster's Ice Cream":               '2255 N University Pkwy, Provo, UT',
    'Bumblebees KBBQ & Grill':           '1254 N State St, Provo, UT',
    'Chiropractic Access Accident Center':'2230 N University Pkwy, Provo, UT',
    'Classy Smiles':                      '424 S State St, Orem, UT',
    'Coin Crazy':                         '1024 Expressway Ln, Spanish Fork, UT',
    "Craving's Bistro":                  '25 W Center St, Pleasant Grove, UT',
    "Cravings Alisha's Cupcakes":        '93 S Main St, Pleasant Grove, UT',
    "Dippin' Dots Fab Freddy's":         '1195 E Main St, Lehi, UT',
    'Dreamwalk Park':                     '575 E University Pkwy, Orem, UT',
    'DryBarComedy.com':                   '295 W Center St, Provo, UT',
    'Durley Dry Cleaners':                '445 N 900 E, Provo, UT',
    'El Beto':                            '1314 N State St, Provo, UT',
    'El Molcajete':                       '1407 S State St, Orem, UT',
    'Escapes In Time':                    '768 S 400 E, Orem, UT',
    'Fabulosos Tacos':                    '294 N State St, Orem, UT',
    'FatCats':                            '1200 N University Ave, Provo, UT',
    'FORGE Jewelry Works':                '522 N Freedom Blvd, Provo, UT',
    'Golden Corral Buffet':               '171 W University Pkwy, Orem, UT',
    'Gurus Cafe':                         '45 E Center St, Provo, UT',
    'HiddenHunts.com':                    '1 University Ave, Provo, UT',  # online service, approx
    'High Country Adventure':             '3702 E Provo Canyon Rd, Provo, UT',
    'Hungry Hawaiian':                    '180 N University Ave, Provo, UT',
    'Improv Broadway':                    '496 N 900 E, Provo, UT',
    'Jersey Mikes':                       '426 W Cougar Blvd, Provo, UT',
    'Karaoke38':                          '914 S State St, Orem, UT',
    'Klucks Krispy Chicken':              '282 E Crossroads Blvd, Saratoga Springs, UT',
    'Kohinoor Cuisine of India':          '75 S State St, Orem, UT',
    'Laser Assault':                      '1200 Towne Centre Blvd, Provo, UT',
    'Mandalyn Academy':                   '648 E State Rd, American Fork, UT',
    'MidiCi The Neapolitan Pizza Company':'541 E University Pkwy, Orem, UT',
    'MilkShake Factory':                  '876 S North County Blvd, Pleasant Grove, UT',
    'Monster Pest Control':               '119 S Pacific Dr, American Fork, UT',
    'MTECH Cosmetology':                  '2301 W Ashton Blvd, Lehi, UT',
    'Nautical Bowls':                     '1314 N Redwood Rd, Saratoga Springs, UT',
    'Ninja Playground':                   '305 S 850 E, Lehi, UT',
    'Ombu Grill':                         '147 N State St, Orem, UT',
    "Onoh's Malasada Co":                '1043 S Valley Grove Way, Pleasant Grove, UT',
    "Onoh's Malasada Co.":               '1043 S Valley Grove Way, Pleasant Grove, UT',
    'Parlor Doughnuts':                   '2319 N 400 W, Provo, UT',
    'Paul Mitchell the School Provo':     '483 W 2310 N, Provo, UT',
    'Provo Canyon Adventures':            '8841 Alpine Scenic Hwy, Provo Canyon, UT',
    'Quarry Indoor Climbing Center':      '2494 N University Pkwy, Provo, UT',
    'Redline Racing':                     '1439 N 1380 W, Orem, UT',
    'Revive PT Cryo':                     '380 E Main St, Lehi, UT',
    'Ritz Eats and Sweets':               '250 S State St, Orem, UT',
    'Roll Up Crepes':                     '538 E University Pkwy, Orem, UT',
    "Rosati's Authentic Chicago Pizza":   '775 E University Pkwy, Orem, UT',
    "Rowley's Red Barn":                  '901 S 300 W, Santaquin, UT',
    'Salsa at Southworth':                '268 W 100 S, Provo, UT',
    'Scratch Miniature Golf':             '1313 E 800 N, Orem, UT',
    'Splash Drinks and Treats':           '1195 E Main St, Lehi, UT',
    'Taste117':                           '117 N University Ave, Provo, UT',
    'Tax Freedom Fighters':               '55 W Main St, Lehi, UT',
    'The Great Greek Mediterranean Grill':'758 S North County Blvd, Pleasant Grove, UT',
    'The Hive Trampoline Park':           '955 N Main St, Spanish Fork, UT',
    'The Pickr':                          '629 N Saratoga Rd, Saratoga Springs, UT',
    'The Rift Augmented Reality':         '1200 Towne Centre Blvd, Provo, UT',
    'The Yard Milkshake Bar':             '575 E University Pkwy, Orem, UT',
    "Tommy's Burgers":                    '401 W 100 N, Provo, UT',
    'Us and Art':                         '45 S Main St, Pleasant Grove, UT',
    'Utah Center for the Ceramic Arts':   '48 S 1000 W, Provo, UT',
    'Utah Country Dance':                 '266 W 100 S, Provo, UT',
    'Utah Grizzlies':                     '3200 S Decker Lake Dr, West Valley City, UT',
    'UVU Athletics':                      '800 W University Pkwy, Orem, UT',
    'UVU Scoops':                         '800 W University Pkwy, Orem, UT',
    'UVU Store':                          '800 W University Pkwy, Orem, UT',
    'Voltage eBike':                      '1565 E 800 N, Orem, UT',
    'Wayback Burgers':                    '863 S North County Blvd, Pleasant Grove, UT',
    'Yummy Ice Cream':                    '1073 S 750 E, Orem, UT',
    "Zub's Pizza & Sub's":               '520 N Main St, Springville, UT',
    "Zub's Pizza & Subs":                '520 N Main St, Springville, UT',
    # From previous session
    'MilkShake Factory':                  '876 S North County Blvd, Pleasant Grove, UT',
}


def geocode_address(address: str):
    """Geocode a street address via Nominatim. Returns (lat, lng) or (None, None)."""
    url = (
        'https://nominatim.openstreetmap.org/search'
        f'?q={urllib.parse.quote(address)}'
        '&format=json&limit=1&countrycodes=us'
    )
    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'StarvingStudentCardMapApp/1.0 (geocoding local businesses)'}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            results = json.loads(resp.read())
            if results:
                return float(results[0]['lat']), float(results[0]['lon'])
    except Exception as e:
        print(f'  WARNING Nominatim error for "{address}": {e}')
    return None, None


def main():
    with open(JSON_PATH, encoding='utf-8') as f:
        deals = json.load(f)

    # Build set of business names still needing coords
    missing = {d['name'] for d in deals if d['lat'] is None and d['name'] in KNOWN_ADDRESSES}
    print(f'Businesses with null coords that have known addresses: {len(missing)}')

    # Geocode each unique address (1 req/sec)
    address_cache = {}  # address -> (lat, lng)
    for biz in sorted(missing):
        addr = KNOWN_ADDRESSES[biz]
        if addr not in address_cache:
            lat, lng = geocode_address(addr)
            address_cache[addr] = (lat, lng)
            status = 'OK' if lat is not None else 'XX'
            print(f'  {status} {biz} | {addr} => {lat}, {lng}')
            time.sleep(1)
        else:
            lat, lng = address_cache[addr]
            print(f'  (cached) {biz} | {addr} => {lat}, {lng}')

    # Apply coords to all matching deals
    updated = 0
    for d in deals:
        if d['lat'] is None and d['name'] in KNOWN_ADDRESSES:
            addr = KNOWN_ADDRESSES[d['name']]
            lat, lng = address_cache.get(addr, (None, None))
            if lat is not None:
                d['lat'] = lat
                d['lng'] = lng
                updated += 1

    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(deals, f, ensure_ascii=False, indent=2)

    still_missing = sum(1 for d in deals if d['lat'] is None)
    print(f'\nUpdated {updated} deals')
    print(f'Still missing coordinates: {still_missing}')
    print(f'Saved to {JSON_PATH}')


if __name__ == '__main__':
    main()
