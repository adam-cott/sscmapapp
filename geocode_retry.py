#!/usr/bin/env python3
"""
Retry geocoding for deals whose coordinates don't match the expected address from CSV.
Tries full address first, then stripped address (no suite/bldg), then city-only fallback.
"""
import json, csv, re, time, urllib.request, urllib.parse, os

SCRIPT_DIR     = os.path.dirname(os.path.abspath(__file__))
JSON_PATH      = os.path.join(SCRIPT_DIR, 'src', 'data', 'deals.json')
BUSINESSES_CSV = r'C:\Users\adamb\Downloads\starving_student_businesses.csv'

CITY_PATTERNS = [
    ('american fork',    'American Fork'),
    ('saratoga springs', 'Saratoga Springs'),
    ('saratoga',         'Saratoga Springs'),
    ('eagle mountain',   'Eagle Mountain'),
    ('eagle mtn',        'Eagle Mountain'),
    ('pleasant grove',   'Pleasant Grove'),
    ('cedar hills',      'Cedar Hills'),
    ('spanish fork',     'Spanish Fork'),
    ('west jordan',      'West Jordan'),
    ('park city',        'Park City'),
    ('provo canyon',     'Provo'),
    ('provo',            'Provo'),
    ('orem',             'Orem'),
    ('lehi',             'Lehi'),
    ('highland',         'Highland'),
    ('vineyard',         'Vineyard'),
    ('santaquin',        'Santaquin'),
    ('herriman',         'Herriman'),
    ('bluffdale',        'Bluffdale'),
    ('draper',           'Draper'),
    ('heber',            'Heber City'),
    ('uvu',              'Orem'),
    ('byu',              'Provo'),
    (r'\baf\b',          'American Fork'),
    (r'\bpg\b',          'Pleasant Grove'),
    (r'\bwj\b',          'West Jordan'),
    (r'\bsf\b',          'Spanish Fork'),
    (r'\bem\b',          'Eagle Mountain'),
]
BROAD_TERMS = [
    'all utah','all locations','all wasatch','all northern ut',
    'northern ut','all ut','utah county','ut county','participating',
    'all orem','paul mitchell',
]

def extract_city(loc):
    if not loc: return 'Provo'
    loc = loc.lower()
    if any(t in loc for t in BROAD_TERMS): return 'Provo'
    for pat, city in CITY_PATTERNS:
        if re.search(pat, loc): return city
    return 'Provo'

def normalize(name):
    n = name.lower()
    n = re.sub(r"[&'/\.\-]", ' ', n)
    return re.sub(r'\s+', ' ', n).strip()

NAME_OVERRIDES = {
    # Deals.json name → CSV Company name (None = not in CSV, keep existing coords)
    'Bumblebees KBBQ & Grill':             'Bumblebees KBBQ',
    "Dippin' Dots Fab Freddy's":           "Dippin' Dots",
    'DryBarComedy.com':                    'DryBar Comedy',
    'Durley Dry Cleaners':                 "Durfey's Dry Cleaners",
    'Bobbys Burgers':                      "Bobby's Burgers",
    "Craving's Bistro":                    "Cravings Bistro",
    'The Pickr':                           'The Picklr',
    'Klucks Krispy Chicken':               "Kluck's Krispy Chicken",
    "Onoh's Malasada Co":                  "Onoh's Malasada Co.",
    "Onoh's Malasada Co.":                 "Onoh's Malasada Co.",
    'CHOM':                                'CHOM Burger',
    "Dirty Dough's":                       'Dirty Dough',
    'Havoline':                            'Havoline Xpress Lube',
    'Honey Baked Ham':                     'Honey Baked Ham Company',
    "Ike's":                               "Ike's Love & Sandwiches",
    'Jamba Juice':                         'Jamba',
    'Jersey Mikes':                        "Jersey Mike's Subs",
    'Mooyah':                              'MOOYAH Burgers, Fries & Shakes',
    "Mrs. Cavanaugh's Chocolates":         "Mrs. Cavanaugh's Chocolates & Ice Cream",
    "Rancherito's":                        "Rancherito's Mexican Food",
    'Revive PT Cryo':                      'Revive PT Cryo Recovery',
    'Ruby River':                          'Ruby River Steakhouse',
    'Tropical Smoothie Cafe':              'Tropical Smoothie Café',
    "Zub's Pizza & Sub's":                 "Zub's Pizza & Subs",
    # Genuinely not in CSV — keep existing coords
    'Healing Vibes':                       None,
    'Korean Dinewan Restaurant':           None,
    "Bruster's Ice Cream":                 None,
    "Chubby's":                            None,
    'Coin Crazy':                          None,
    'Game Grid':                           None,
    'GetOut Games':                        None,
    'Grease Monkey':                       None,
    'Great Harvest Bread Co.':             None,
    'High Country Adventure':              None,
    "Malawi's Pizza":                      None,
}

def strip_suite(address):
    """Remove suite/unit/bldg/space info from address."""
    return re.sub(r'\s+(ste|suite|unit|bldg|building|spc|space|#|fl)\s+\S+.*', '', address, flags=re.I).strip()

_cache = {}

def geocode(query):
    if query in _cache:
        return _cache[query]
    url = ('https://nominatim.openstreetmap.org/search'
           f'?q={urllib.parse.quote(query)}&format=json&limit=1&countrycodes=us')
    req = urllib.request.Request(url, headers={'User-Agent': 'StarvingStudentCardMapApp/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            results = json.loads(resp.read())
            if results:
                lat, lng = float(results[0]['lat']), float(results[0]['lon'])
                _cache[query] = (lat, lng)
                return lat, lng
    except Exception as e:
        print(f'      err: {e}')
    _cache[query] = (None, None)
    return None, None

def geocode_with_fallback(address, city, state, zipcode):
    """Try full address, then stripped, then city-only."""
    full = f'{address}, {city}, {state} {zipcode}'
    lat, lng = geocode(full)
    if lat: return lat, lng, 'full'
    time.sleep(1)

    stripped = strip_suite(address)
    if stripped != address:
        q2 = f'{stripped}, {city}, {state} {zipcode}'
        lat, lng = geocode(q2)
        if lat: return lat, lng, 'stripped'
        time.sleep(1)

    # City-level fallback
    lat, lng = geocode(f'{city}, {state}')
    if lat: return lat, lng, 'city'
    return None, None, 'failed'


def main():
    # Load CSV
    csv_locs = {}
    with open(BUSINESSES_CSV, encoding='utf-8') as f:
        for row in csv.DictReader(f):
            company = row['Company'].strip()
            norm = normalize(company)
            entry = (row['Address'].strip(), row['City'].strip(),
                     row['State'].strip(), row['Zip_Code'].strip())
            if norm not in csv_locs:
                csv_locs[norm] = {'original': company, 'locations': []}
            csv_locs[norm]['locations'].append(entry)

    with open(JSON_PATH, encoding='utf-8') as f:
        deals = json.load(f)

    utah_county = {
        'provo','orem','lehi','american fork','pleasant grove','spanish fork',
        'saratoga springs','eagle mountain','vineyard','cedar hills','highland',
        'santaquin','springville','payson','mapleton','elk ridge','salem'
    }

    addr_result = {}   # (address,city,state,zip) -> (lat,lng,status)
    biz_addr    = {}   # (biz, target_city) -> addr_tuple

    # First pass: build address assignments for every deal
    for d in deals:
        biz = d['name']
        target_city = extract_city(d.get('locationRestriction',''))
        key = (biz, target_city)
        if key in biz_addr:
            continue

        csv_name = NAME_OVERRIDES.get(biz, biz)
        if csv_name is None:
            biz_addr[key] = None
            continue

        norm_key = normalize(csv_name)
        if norm_key not in csv_locs:
            norm_biz = normalize(biz)
            matches = [k for k in csv_locs
                       if k.startswith(norm_biz[:8]) or norm_biz.startswith(k[:8])]
            norm_key = matches[0] if len(matches) == 1 else None

        if not norm_key or norm_key not in csv_locs:
            biz_addr[key] = None
            continue

        locations = csv_locs[norm_key]['locations']
        city_matches = [l for l in locations if l[1].lower() == target_city.lower()]
        if city_matches:
            biz_addr[key] = city_matches[0]
        else:
            local = [l for l in locations if l[1].lower() in utah_county]
            biz_addr[key] = local[0] if local else locations[0]

    # Geocode all unique addresses
    unique_addrs = {v for v in biz_addr.values() if v and v not in addr_result}
    print(f'Unique addresses to geocode: {len(unique_addrs)}')
    for i, addr in enumerate(unique_addrs, 1):
        if addr in addr_result:
            continue
        lat, lng, status = geocode_with_fallback(*addr)
        addr_result[addr] = (lat, lng, status)
        mark = 'OK' if status == 'full' else ('~' if status in ('stripped','city') else 'XX')
        print(f'  [{i}/{len(unique_addrs)}] {mark} {addr[0]}, {addr[1]} => {lat}, {lng}')
        time.sleep(1)

    # Apply results
    updated = skipped = not_found = 0
    for d in deals:
        biz = d['name']
        target_city = extract_city(d.get('locationRestriction',''))
        addr = biz_addr.get((biz, target_city))
        if addr is None:
            not_found += 1
            continue
        lat, lng, status = addr_result.get(addr, (None, None, 'failed'))
        if lat is not None:
            d['lat'] = lat
            d['lng'] = lng
            updated += 1
        else:
            skipped += 1

    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(deals, f, ensure_ascii=False, indent=2)

    null_count = sum(1 for d in deals if d['lat'] is None)
    status_counts = {}
    for (lat, lng, st) in addr_result.values():
        status_counts[st] = status_counts.get(st, 0) + 1

    print(f'\nResults:')
    print(f'  Updated deals: {updated}')
    print(f'  Not in CSV:    {not_found}')
    print(f'  Geo failed:    {skipped}')
    print(f'  Still null:    {null_count}')
    print(f'  Address statuses: {status_counts}')


if __name__ == '__main__':
    main()
