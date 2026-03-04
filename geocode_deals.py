#!/usr/bin/env python3
"""
Geocode all deals using Nominatim (free, no API key).
- Extracts a primary city for each deal from locationRestriction
- Caches by (business, city) to avoid duplicate requests
- Updates src/data/deals.json with lat/lng
- Writes geocode_review.csv so you can spot-check and manually fix any misses
"""
import json, csv, time, urllib.request, urllib.parse, os

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
JSON_PATH   = os.path.join(SCRIPT_DIR, 'src', 'data', 'deals.json')
REVIEW_PATH = os.path.join(SCRIPT_DIR, 'geocode_review.csv')

# ── City extraction ───────────────────────────────────────────────────────────

# Ordered: longest first so "American Fork" matches before "Fork"
CITY_PATTERNS = [
    ('american fork',    'American Fork, UT'),
    ('saratoga springs', 'Saratoga Springs, UT'),
    ('saratoga',         'Saratoga Springs, UT'),
    ('eagle mountain',   'Eagle Mountain, UT'),
    ('eagle mtn',        'Eagle Mountain, UT'),
    ('pleasant grove',   'Pleasant Grove, UT'),
    ('cedar hills',      'Cedar Hills, UT'),
    ('spanish fork',     'Spanish Fork, UT'),
    ('west jordan',      'West Jordan, UT'),
    ('park city',        'Park City, UT'),
    ('provo canyon',     'Provo Canyon, UT'),
    ('provo',            'Provo, UT'),
    ('orem',             'Orem, UT'),
    ('lehi',             'Lehi, UT'),
    ('highland',         'Highland, UT'),
    ('vineyard',         'Vineyard, UT'),
    ('santaquin',        'Santaquin, UT'),
    ('herriman',         'Herriman, UT'),
    ('bluffdale',        'Bluffdale, UT'),
    ('draper',           'Draper, UT'),
    ('heber',            'Heber City, UT'),
    ('uvu',              'Orem, UT'),          # UVU is in Orem
    ('byu',              'Provo, UT'),          # BYU is in Provo
    # Abbreviations
    (r'\baf\b',          'American Fork, UT'),
    (r'\bpg\b',          'Pleasant Grove, UT'),
    (r'\bwj\b',          'West Jordan, UT'),
    (r'\bsf\b',          'Spanish Fork, UT'),
    (r'\bem\b',          'Eagle Mountain, UT'),
]

BROAD_TERMS = [
    'all utah', 'all locations', 'all wasatch', 'all northern ut',
    'northern ut', 'all ut', 'utah county', 'ut county', 'participating',
    'all orem', 'paul mitchell',  # Paul Mitchell locs = Provo school
]

import re

def extract_city(location_restriction):
    """Return the primary geocodable city string for a locationRestriction."""
    if not location_restriction:
        return 'Provo, UT'

    loc = location_restriction.lower()

    # Broad / multi-city restrictions → default to Provo
    if any(term in loc for term in BROAD_TERMS):
        return 'Provo, UT'

    # Try specific city patterns (longest first)
    for pattern, city in CITY_PATTERNS:
        if re.search(pattern, loc):
            return city

    # Fallback
    return 'Provo, UT'


# ── Nominatim geocoding ───────────────────────────────────────────────────────

def geocode(business: str, city: str):
    """Query Nominatim; return (lat, lng) or (None, None)."""
    query = f"{business}, {city}"
    url = (
        "https://nominatim.openstreetmap.org/search"
        f"?q={urllib.parse.quote(query)}"
        "&format=json&limit=1&countrycodes=us"
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
        print(f"    ⚠ Nominatim error for '{query}': {e}")
    return None, None


def geocode_with_fallback(business: str, city: str):
    """Try business+city, then just business+Utah."""
    lat, lng = geocode(business, city)
    if lat is not None:
        return lat, lng, 'found'
    # Fallback: broader search
    time.sleep(1)
    lat, lng = geocode(business, 'Utah')
    if lat is not None:
        return lat, lng, 'fallback'
    return None, None, 'not_found'


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    with open(JSON_PATH, encoding='utf-8') as f:
        deals = json.load(f)

    # Build cache key → (lat, lng, status)
    cache: dict[tuple, tuple] = {}

    # Collect all unique (business, city) pairs needed
    targets = []
    for d in deals:
        city = extract_city(d['locationRestriction'])
        key  = (d['name'], city)
        if key not in cache:
            cache[key] = None  # placeholder
            targets.append(key)

    print(f"Unique (business, city) targets: {len(targets)}")
    print(f"Starting Nominatim geocoding (1 req/sec)...\n")

    # Geocode each unique target
    for i, (biz, city) in enumerate(targets):
        lat, lng, status = geocode_with_fallback(biz, city)
        cache[(biz, city)] = (lat, lng, status)
        mark = 'OK' if status == 'found' else ('~~' if status == 'fallback' else 'XX')
        print(f"  [{i+1}/{len(targets)}] {mark} {biz} | {city} => {lat}, {lng}")
        time.sleep(1)  # Nominatim rate limit: 1 req/sec

    # Assign coordinates back to each deal
    found_count = fallback_count = missing_count = 0
    for d in deals:
        city = extract_city(d['locationRestriction'])
        lat, lng, status = cache[(d['name'], city)]
        d['lat'] = lat
        d['lng'] = lng
        if status == 'found':    found_count    += 1
        elif status == 'fallback': fallback_count += 1
        else:                    missing_count  += 1

    # Save updated JSON
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(deals, f, ensure_ascii=False, indent=2)
    print(f"\nUpdated {JSON_PATH}")

    # Write review CSV (one row per unique target)
    review_rows = []
    for (biz, city), (lat, lng, status) in cache.items():
        review_rows.append({
            'business':    biz,
            'city_used':   city,
            'status':      status,
            'latitude':    lat  if lat  is not None else '',
            'longitude':   lng  if lng  is not None else '',
            'notes':       '' if status == 'found' else 'REVIEW NEEDED',
        })
    review_rows.sort(key=lambda r: (r['status'] != 'not_found', r['business']))

    with open(REVIEW_PATH, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['business','city_used','status','latitude','longitude','notes'])
        w.writeheader()
        w.writerows(review_rows)

    print(f"Review CSV: {REVIEW_PATH}")
    print(f"\nResults:")
    print(f"  ✓ Found:     {found_count} deals")
    print(f"  ~ Fallback:  {fallback_count} deals")
    print(f"  ✗ Not found: {missing_count} deals")
    print(f"\nUnique targets: {len(cache)} | found: {sum(1 for v in cache.values() if v[2]=='found')} | fallback: {sum(1 for v in cache.values() if v[2]=='fallback')} | missing: {sum(1 for v in cache.values() if v[2]=='not_found')}")


if __name__ == '__main__':
    main()
