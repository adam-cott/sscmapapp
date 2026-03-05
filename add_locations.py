#!/usr/bin/env python3
"""
For each deal in deals.json, add a `locations` array containing
ALL CSV addresses for that business (geocoded), so every valid
location shows as a separate map pin.
"""
import json, csv, re, time, urllib.request, urllib.parse, os

SCRIPT_DIR     = os.path.dirname(os.path.abspath(__file__))
JSON_PATH      = os.path.join(SCRIPT_DIR, 'src', 'data', 'deals.json')
BUSINESSES_CSV = r'C:\Users\adamb\Downloads\starving_student_businesses.csv'

# ── Same name overrides as geocode_retry.py ───────────────────────────────────
NAME_OVERRIDES = {
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
    # Not in CSV — keep existing single-location coords
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

def normalize(name):
    n = name.lower()
    n = re.sub(r"[&'/\.\-]", ' ', n)
    return re.sub(r'\s+', ' ', n).strip()

# ── Geocoding ─────────────────────────────────────────────────────────────────
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

def strip_suite(address):
    return re.sub(r'\s+(ste|suite|unit|bldg|building|spc|space|#|fl)\s+\S+.*',
                  '', address, flags=re.I).strip()

def geocode_with_fallback(address, city, state, zipcode):
    full = f'{address}, {city}, {state} {zipcode}'
    lat, lng = geocode(full)
    if lat: return lat, lng
    time.sleep(1)

    stripped = strip_suite(address)
    if stripped != address:
        lat, lng = geocode(f'{stripped}, {city}, {state} {zipcode}')
        if lat: return lat, lng
        time.sleep(1)

    lat, lng = geocode(f'{city}, {state}')
    return lat, lng


def main():
    # Load CSV — group all locations per normalized business name
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

    # Build map: deal business name → list of all CSV address tuples
    biz_all_locs = {}   # normalized deal name → [(addr, city, state, zip), ...]
    for d in deals:
        biz = d['name']
        if biz in biz_all_locs:
            continue

        csv_name = NAME_OVERRIDES.get(biz, biz)
        if csv_name is None:
            biz_all_locs[biz] = []
            continue

        norm_key = normalize(csv_name)
        if norm_key not in csv_locs:
            norm_biz = normalize(biz)
            matches = [k for k in csv_locs
                       if k.startswith(norm_biz[:8]) or norm_biz.startswith(k[:8])]
            norm_key = matches[0] if len(matches) == 1 else None

        if not norm_key or norm_key not in csv_locs:
            biz_all_locs[biz] = []
            continue

        biz_all_locs[biz] = csv_locs[norm_key]['locations']

    # Collect all unique addresses that need geocoding
    all_addrs = set()
    for locs in biz_all_locs.values():
        for addr_tuple in locs:
            all_addrs.add(addr_tuple)

    print(f'Total unique CSV addresses to geocode: {len(all_addrs)}')

    # Geocode each unique address
    addr_coords = {}   # addr_tuple → (lat, lng)
    for i, addr in enumerate(sorted(all_addrs), 1):
        lat, lng = geocode_with_fallback(*addr)
        addr_coords[addr] = (lat, lng)
        status = 'OK' if lat else 'XX'
        print(f'  [{i}/{len(all_addrs)}] {status} {addr[0]}, {addr[1]} => {lat}, {lng}')
        time.sleep(1)

    # Apply to deals: add locations array
    for d in deals:
        biz = d['name']
        locs = biz_all_locs.get(biz, [])

        location_entries = []
        for addr_tuple in locs:
            lat, lng = addr_coords.get(addr_tuple, (None, None))
            if lat is None:
                continue
            addr_str = f'{addr_tuple[0]}, {addr_tuple[1]}, {addr_tuple[2]} {addr_tuple[3]}'
            location_entries.append({'lat': lat, 'lng': lng, 'address': addr_str})

        if location_entries:
            d['locations'] = location_entries
            # Keep primary lat/lng as the first location (already set by geocode_retry.py)
        else:
            # Not in CSV — keep existing single coord as the only location
            if d['lat'] is not None:
                d['locations'] = [{'lat': d['lat'], 'lng': d['lng'], 'address': d.get('address', '')}]
            else:
                d['locations'] = []

    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(deals, f, ensure_ascii=False, indent=2)

    total_pins = sum(len(d['locations']) for d in deals)
    multi = [(d['name'], len(d['locations'])) for d in deals if len(d.get('locations', [])) > 1]
    unique_multi = {n: c for n, c in multi}
    print(f'\nDone.')
    print(f'  Total map pins across all deals: {total_pins}')
    print(f'  Businesses with multiple locations: {len(unique_multi)}')
    for name, count in sorted(unique_multi.items(), key=lambda x: -x[1])[:15]:
        print(f'    {count}x  {name}')


if __name__ == '__main__':
    main()
