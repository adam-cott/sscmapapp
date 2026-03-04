#!/usr/bin/env python3
"""
Re-geocode all deals using the authoritative starving_student_businesses.csv.
Matches each deal's business name to the CSV, picks the best location
based on the deal's locationRestriction city, then geocodes by street address.
"""
import json, csv, re, time, urllib.request, urllib.parse, os

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
JSON_PATH    = os.path.join(SCRIPT_DIR, 'src', 'data', 'deals.json')
BUSINESSES_CSV = r'C:\Users\adamb\Downloads\starving_student_businesses.csv'

# ── City extraction (same as geocode_deals.py) ────────────────────────────────
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
    'all utah', 'all locations', 'all wasatch', 'all northern ut',
    'northern ut', 'all ut', 'utah county', 'ut county', 'participating',
    'all orem', 'paul mitchell',
]

def extract_city(location_restriction):
    if not location_restriction:
        return 'Provo'
    loc = location_restriction.lower()
    if any(term in loc for term in BROAD_TERMS):
        return 'Provo'
    for pattern, city in CITY_PATTERNS:
        if re.search(pattern, loc):
            return city
    return 'Provo'

# ── Name normalization for fuzzy matching ─────────────────────────────────────
def normalize(name):
    """Lowercase, remove punctuation and extra spaces for comparison."""
    n = name.lower()
    n = re.sub(r"[&'/\.\-]", ' ', n)
    n = re.sub(r'\s+', ' ', n).strip()
    return n

# Manual overrides: deals.json name → CSV Company name
NAME_OVERRIDES = {
    'Bumblebees KBBQ & Grill':              'Bumblebees KBBQ',
    "Dippin' Dots Fab Freddy's":            "Dippin' Dots",
    'DryBarComedy.com':                     'DryBar Comedy',
    'Durley Dry Cleaners':                  "Durfey's Dry Cleaners",
    'Bobbys Burgers':                       "Bobby's Burgers",
    'FatCats':                              'FatCats',
    'Paul Mitchell the School Provo':       'Paul Mitchell the School Provo',
    'Quarry Indoor Climbing Center':        'Quarry Indoor Climbing Center',
    'Scratch Miniature Golf':               'Scratch Miniature Golf',
    'Cravings Alisha\'s Cupcakes':          "Cravings Alisha's Cupcakes",
    "Craving's Bistro":                     "Cravings Bistro",
    'MidiCi The Neapolitan Pizza Company':  'MidiCi The Neapolitan Pizza Company',
    'The Pickr':                            'The Picklr',
    'Klucks Krispy Chicken':                "Kluck's Krispy Chicken",
    'Improv Broadway':                      'Improv Broadway',
    'HiddenHunts.com':                      'HiddenHunts.com',
    'Onoh\'s Malasada Co':                  "Onoh's Malasada Co.",
    'Onoh\'s Malasada Co.':                 "Onoh's Malasada Co.",
    'MTECH Cosmetology':                    'MTECH Cosmetology',
    'Healing Vibes':                        None,   # not in CSV
    'Korean Dinewan Restaurant':            None,   # not in CSV
    'Quick Wits Comedy':                    'Quick Wits Comedy',
}

# ── Geocoding ─────────────────────────────────────────────────────────────────
_geo_cache = {}

def geocode_address(address, city, state, zipcode):
    full = f'{address}, {city}, {state} {zipcode}'
    if full in _geo_cache:
        return _geo_cache[full]
    url = (
        'https://nominatim.openstreetmap.org/search'
        f'?q={urllib.parse.quote(full)}'
        '&format=json&limit=1&countrycodes=us'
    )
    req = urllib.request.Request(url, headers={'User-Agent': 'StarvingStudentCardMapApp/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            results = json.loads(resp.read())
            if results:
                lat, lng = float(results[0]['lat']), float(results[0]['lon'])
                _geo_cache[full] = (lat, lng)
                return lat, lng
    except Exception as e:
        print(f'    WARNING: {e}')
    _geo_cache[full] = (None, None)
    return None, None


def main():
    # Load CSV: {normalized_name: [(address, city, state, zip), ...]}
    csv_locs = {}
    with open(BUSINESSES_CSV, encoding='utf-8') as f:
        for row in csv.DictReader(f):
            company = row['Company'].strip()
            norm = normalize(company)
            entry = (row['Address'].strip(), row['City'].strip(), row['State'].strip(), row['Zip_Code'].strip())
            if norm not in csv_locs:
                csv_locs[norm] = {'original': company, 'locations': []}
            csv_locs[norm]['locations'].append(entry)

    print(f'Loaded {len(csv_locs)} unique companies from CSV')

    # Load deals
    with open(JSON_PATH, encoding='utf-8') as f:
        deals = json.load(f)

    updated = skipped = not_found = 0

    # Process each unique (business_name) set
    seen_addresses = {}  # business_name -> chosen (address,city,state,zip) per target_city

    for d in deals:
        biz = d['name']
        target_city = extract_city(d.get('locationRestriction', ''))

        cache_key = (biz, target_city)
        if cache_key in seen_addresses:
            addr_tuple = seen_addresses[cache_key]
        else:
            # Resolve CSV company name
            if biz in NAME_OVERRIDES:
                csv_name = NAME_OVERRIDES[biz]
            else:
                csv_name = biz  # try exact first

            if csv_name is None:
                seen_addresses[cache_key] = None
                addr_tuple = None
            else:
                norm_key = normalize(csv_name)
                if norm_key not in csv_locs:
                    # Try fuzzy: find any CSV entry that starts with normalized biz
                    norm_biz = normalize(biz)
                    matches = [k for k in csv_locs if k.startswith(norm_biz[:8]) or norm_biz.startswith(k[:8])]
                    if len(matches) == 1:
                        norm_key = matches[0]
                    else:
                        norm_key = None

                if norm_key is None or norm_key not in csv_locs:
                    seen_addresses[cache_key] = None
                    addr_tuple = None
                else:
                    locations = csv_locs[norm_key]['locations']
                    # Pick best location matching target_city
                    city_matches = [loc for loc in locations if loc[1].lower() == target_city.lower()]
                    if city_matches:
                        addr_tuple = city_matches[0]
                    else:
                        # Fall back to first Utah County area location
                        utah_county_cities = {
                            'provo', 'orem', 'lehi', 'american fork', 'pleasant grove',
                            'spanish fork', 'saratoga springs', 'eagle mountain', 'vineyard',
                            'cedar hills', 'highland', 'santaquin', 'springville', 'payson'
                        }
                        local = [loc for loc in locations if loc[1].lower() in utah_county_cities]
                        addr_tuple = local[0] if local else locations[0]

                    seen_addresses[cache_key] = addr_tuple

        if addr_tuple is None:
            not_found += 1
            continue

        # Geocode (cached by address string)
        addr_str = f"{addr_tuple[0]}, {addr_tuple[1]}, {addr_tuple[2]} {addr_tuple[3]}"
        if addr_str not in _geo_cache:
            lat, lng = geocode_address(*addr_tuple)
            needs_sleep = True
        else:
            lat, lng = _geo_cache[addr_str]
            needs_sleep = False

        if lat is not None:
            d['lat'] = lat
            d['lng'] = lng
            updated += 1
        else:
            skipped += 1

        if needs_sleep:
            time.sleep(1)

    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(deals, f, ensure_ascii=False, indent=2)

    still_null = sum(1 for d in deals if d['lat'] is None)
    print(f'\nUpdated:   {updated}')
    print(f'Not in CSV:{not_found}')
    print(f'Geo failed:{skipped}')
    print(f'Still null:{still_null}')
    print(f'Saved to {JSON_PATH}')


if __name__ == '__main__':
    main()
