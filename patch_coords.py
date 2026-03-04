#!/usr/bin/env python3
"""
Apply manually-entered coordinates to deals.json.

Usage:
  1. Fill in latitude/longitude in manual_geocode_needed.csv
  2. Run:  python patch_coords.py

Matches by (business name, city_used) and updates all deals
for that business+city combo.
"""
import json, csv, os

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
JSON_PATH    = os.path.join(SCRIPT_DIR, 'src', 'data', 'deals.json')
MANUAL_CSV   = os.path.join(SCRIPT_DIR, 'manual_geocode_needed.csv')
REVIEW_CSV   = os.path.join(SCRIPT_DIR, 'geocode_review.csv')

import re

# Duplicate of extract_city from geocode_deals.py
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
    ('uvu',              'Orem, UT'),
    ('byu',              'Provo, UT'),
    (r'\baf\b',          'American Fork, UT'),
    (r'\bpg\b',          'Pleasant Grove, UT'),
    (r'\bwj\b',          'West Jordan, UT'),
    (r'\bsf\b',          'Spanish Fork, UT'),
    (r'\bem\b',          'Eagle Mountain, UT'),
]
BROAD_TERMS = [
    'all utah', 'all locations', 'all wasatch', 'all northern ut',
    'northern ut', 'all ut', 'utah county', 'ut county', 'participating',
    'all orem', 'paul mitchell',
]

def extract_city(location_restriction):
    if not location_restriction:
        return 'Provo, UT'
    loc = location_restriction.lower()
    if any(term in loc for term in BROAD_TERMS):
        return 'Provo, UT'
    for pattern, city in CITY_PATTERNS:
        if re.search(pattern, loc):
            return city
    return 'Provo, UT'


def main():
    # Load manual patches
    patches = {}
    with open(MANUAL_CSV, encoding='utf-8') as f:
        for row in csv.DictReader(f):
            lat_s = row['latitude'].strip()
            lng_s = row['longitude'].strip()
            if lat_s and lng_s:
                try:
                    patches[(row['business'], row['city_used'])] = (float(lat_s), float(lng_s))
                except ValueError:
                    print(f"  Skipping bad coords for {row['business']}: {lat_s}, {lng_s}")

    if not patches:
        print("No coordinates found in manual_geocode_needed.csv — fill in lat/lng first.")
        return

    print(f"Loaded {len(patches)} manual patches")

    # Load deals
    with open(JSON_PATH, encoding='utf-8') as f:
        deals = json.load(f)

    updated = 0
    for d in deals:
        city = extract_city(d['locationRestriction'])
        key  = (d['name'], city)
        if key in patches and d['lat'] is None:
            d['lat'], d['lng'] = patches[key]
            updated += 1

    # Save
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(deals, f, ensure_ascii=False, indent=2)

    still_missing = sum(1 for d in deals if d['lat'] is None)
    print(f"Updated {updated} deals")
    print(f"Still missing coordinates: {still_missing}")
    print(f"Saved to {JSON_PATH}")


if __name__ == '__main__':
    main()
