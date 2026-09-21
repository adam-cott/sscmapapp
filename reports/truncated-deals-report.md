# Truncated Deals Report

Generated: 2026-09-21T19:59:36.833Z

Read-only report. `deals.json` and app code were not modified by this script.

## Field visibility reference

- **`deal.title`** — Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)
- **`deal.value`** — Visible in DealCard pill, BottomSheet/DealModal headline, RedemptionScreen — NOT shown in HomeCard
- **`deal.description`** — Only visible on the deal-detail screens (BottomSheet, DealModal)
- **`deal.restrictions`** — Not rendered anywhere in the current UI

## Summary

- Total deals: 418
- Flagged "likely" truncated: 6
- Flagged "possible" truncated: 4
- Address/location text hits: 145 (103 are the routine `"Valid at: <city>"` description boilerplate — see note below; 42 are everything else)

**Heuristic hit counts** (a single finding can trigger more than one heuristic):

- Prefix-of-title match: 6
- Ends without terminal punctuation + incomplete last word: 4
- Length sits at a shared-length cluster (upstream cap suspected): 3
- Unbalanced parentheses/quotes: 0

**Length distribution per field** (top 10 by frequency, `*` marks the length flagged as a cluster spike):

`deal.value`:
- length 7: 217 deals
- length 16: 96 deals
- length 9: 95 deals
- length 30: 3 deals *
- length 6: 3 deals
- length 29: 3 deals
- length 28: 1 deals

`deal.description`:
- length 52: 167 deals
- length 23: 32 deals
- length 14: 28 deals
- length 25: 15 deals
- length 26: 13 deals
- length 18: 12 deals
- length 28: 10 deals
- length 9: 10 deals
- length 15: 9 deals
- length 24: 8 deals

---

## Likely truncated

### Denny's — `restaurants-046` (index 45, field `deal.value`)

- **Value:** `"Kids Eat FREE! Up to 2 Kids Pe"` (length 30)
- **Full deal.title:** `"Kids Eat FREE! Up to 2 Kids Per Paying Adult Anytime!"`
- **Flagged by:** is an exact prefix of deal.title (cut before the sentence finished); length (30) sits at the top of a shared-length cluster for deal.value (3 deals share this exact length) — suggests an upstream character cap
- **Rendered where:** Visible in DealCard pill, BottomSheet/DealModal headline, RedemptionScreen — NOT shown in HomeCard

### Rodizio Grill — `restaurants-074` (index 73, field `deal.value`)

- **Value:** `"Buy Any Entree Get Any Special"` (length 30)
- **Full deal.title:** `"Buy Any Entree Get Any Specialty Beverage & Any Dessert"`
- **Flagged by:** is an exact prefix of deal.title (cut before the sentence finished); length (30) sits at the top of a shared-length cluster for deal.value (3 deals share this exact length) — suggests an upstream character cap
- **Rendered where:** Visible in DealCard pill, BottomSheet/DealModal headline, RedemptionScreen — NOT shown in HomeCard

### BYU Studio 1030 — `retail-165` (index 164, field `deal.value`)

- **Value:** `"$5 Haircut! Wash and Blow Dry"` (length 29)
- **Full deal.title:** `"$5 Haircut! Wash and Blow Dry Not Included"`
- **Flagged by:** is an exact prefix of deal.title (cut before the sentence finished)
- **Rendered where:** Visible in DealCard pill, BottomSheet/DealModal headline, RedemptionScreen — NOT shown in HomeCard

### Chiropractic Access Accident Center — `retail-168` (index 167, field `deal.value`)

- **Value:** `"Buy 1 Chiropractic Adjustment"` (length 29)
- **Full deal.title:** `"Buy 1 Chiropractic Adjustment or Acupuncture Treatment For Only $15!"`
- **Flagged by:** is an exact prefix of deal.title (cut before the sentence finished)
- **Rendered where:** Visible in DealCard pill, BottomSheet/DealModal headline, RedemptionScreen — NOT shown in HomeCard

### Chiropractic Access Accident Center — `retail-169` (index 168, field `deal.value`)

- **Value:** `"Ozone Injection for Only $30"` (length 28)
- **Full deal.title:** `"Ozone Injection for Only $30!"`
- **Flagged by:** is an exact prefix of deal.title (cut before the sentence finished)
- **Rendered where:** Visible in DealCard pill, BottomSheet/DealModal headline, RedemptionScreen — NOT shown in HomeCard

### Carl's Jr — `sandwiches-378` (index 377, field `deal.value`)

- **Value:** `"$3.99 Kids meal! Valid for All"` (length 30)
- **Full deal.title:** `"$3.99 Kids meal! Valid for All Kids in Family! Code 10717"`
- **Flagged by:** is an exact prefix of deal.title (cut before the sentence finished); length (30) sits at the top of a shared-length cluster for deal.value (3 deals share this exact length) — suggests an upstream character cap
- **Rendered where:** Visible in DealCard pill, BottomSheet/DealModal headline, RedemptionScreen — NOT shown in HomeCard

---

## Possible truncation

### BYU Bowling & Games Center — `entertainment-097` (index 96, field `deal.description`)

- **Value:** `"M-Fri Before 6pm"` (length 16)
- **Full deal.title:** `"2-4-1! Game of Bowling! M-Fri Before 6pm"`
- **Flagged by:** no terminal punctuation and last word looks cut off
- **Rendered where:** Only visible on the deal-detail screens (BottomSheet, DealModal)

### Karaoke38 — `entertainment-127` (index 126, field `deal.description`)

- **Value:** `"M-Th Max 8 People Per Use"` (length 25)
- **Full deal.title:** `"2-4-1! Hour of Karaoke! M-Th Max 8 People Per Use"`
- **Flagged by:** no terminal punctuation and last word looks cut off
- **Rendered where:** Only visible on the deal-detail screens (BottomSheet, DealModal)

### Provo Canyon Adventures — `entertainment-139` (index 138, field `deal.description`)

- **Value:** `"Valid at: Provo Canyon â€¢ Appt Required Please Tip"` (length 51)
- **Full deal.title:** `"2-4-1! Zipline Tour! Appt. Req. Please Tip"`
- **Flagged by:** no terminal punctuation and last word looks cut off
- **Rendered where:** Only visible on the deal-detail screens (BottomSheet, DealModal)

### Wendy's — `sandwiches-416` (index 415, field `deal.description`)

- **Value:** `"Valid at: Provo 122 E 1300 N Orem Center St"` (length 43)
- **Full deal.title:** `"FREE! Small Frosty w/ Any Purchase! Provo 122 E 1300 N Orem Center St N. Orem AF Highland Saratoga Traverse Mtn & Participating Locations"`
- **Flagged by:** no terminal punctuation and last word looks cut off
- **Rendered where:** Only visible on the deal-detail screens (BottomSheet, DealModal)

---

## Address/location text found in deal copy

Separate open item — deals whose title/value/description/restrictions text contains what looks like a street address, directional abbreviation, city name, or zip code. `deal.address` / `locations[].address` / `locationRestriction` are excluded since those fields are supposed to hold location data.

### Routine "Valid at: <city>" boilerplate (103)

These are `deal.description` values that are just the standard `"Valid at: <city/area>"` pattern (193 deals in total use this pattern) — almost certainly intentional, not a data problem. Listed for completeness, lowest priority to review.

| Business | Deal ID | Text |
|---|---|---|
| Curry Pizza | `pizza-002` | "Valid at: Lehi" |
| Curry Pizza | `pizza-003` | "Valid at: Lehi" |
| Gurus Cafe | `pizza-011` | "Valid at: Provo Center St & UVU" |
| Marco's Pizza | `pizza-013` | "Valid at: Santaquin Only" |
| Marco's Pizza | `pizza-014` | "Valid at: Santaquin Only" |
| Papa Murphy's | `pizza-017` | "Valid at: Provo & Park City" |
| Pier 49 Pizza | `pizza-018` | "Valid at: American Fork" |
| Pier 49 Pizza | `pizza-019` | "Valid at: American Fork & Provo" |
| Pizza Pie Cafe | `pizza-023` | "Valid at: Highland" |
| Pizza Pie Cafe | `pizza-025` | "Valid at: Orem" |
| Ritz Eats and Sweets | `pizza-026` | "Valid at: Orem" |
| Buffalo Wild Wings | `restaurants-034` | "Valid at: Orem & Lehi" |
| Buffalo Wild Wings | `restaurants-035` | "Valid at: Orem & Lehi â€¢ Excl. Alcohol" |
| Buffalo Wild Wings | `restaurants-036` | "Valid at: Orem & Lehi â€¢ Excl. Alcohol" |
| El Beto | `restaurants-047` | "Valid at: Provo" |
| El Pollo Loco | `restaurants-051` | "Valid at: Orem Lehi & Particip" |
| Golden Corral Buffet | `restaurants-057` | "Valid at: Orem â€¢ Mon-Fri Before 4 PM" |
| Golden Corral Buffet | `restaurants-058` | "Valid at: Orem" |
| Gurus Cafe | `restaurants-059` | "Valid at: Provo Center St & UVU" |
| Gurus Cafe | `restaurants-060` | "Valid at: Provo Center St & UVU" |
| Outback Steakhouse | `restaurants-070` | "Valid at: Orem" |
| Rancherito's | `restaurants-072` | "Valid at: Pleasant Grove Only" |
| Taco Time | `restaurants-082` | "Valid at: Orem" |
| Village Inn | `restaurants-088` | "Valid at: Provo" |
| Village Inn | `restaurants-089` | "Valid at: Provo" |
| Wing Nutz | `restaurants-091` | "Valid at: Orem & SF â€¢ Max Discount $15" |
| Wingers | `restaurants-093` | "Valid at: Provo" |
| Classic Fun Center | `entertainment-102` | "Valid at: Orem" |
| FatCats | `entertainment-113` | "Valid at: Provo" |
| FatCats | `entertainment-114` | "Valid at: Provo â€¢ Before 8 PM" |
| Game Grid | `entertainment-115` | "Valid at: Lehi" |
| Game Grid | `entertainment-116` | "Valid at: Lehi" |
| High Country Adventure | `entertainment-122` | "Valid at: Provo Canyon â€¢ M-F Code SSC" |
| Jack & Jill Lanes | `entertainment-124` | "Valid at: Lehi & AF â€¢ M-Th Before 6pm Not Valid Holidays Shoes Not Included" |
| Jack & Jill Lanes | `entertainment-125` | "Valid at: Lehi â€¢ M-Th before 6pm Not Valid Holidays" |
| Miracle Bowl | `entertainment-135` | "Valid at: Orem â€¢ Not Valid after 5 PM Sat Holidays or School Holidays" |
| Provo Canyon Adventures | `entertainment-139` | "Valid at: Provo Canyon â€¢ Appt Required Please Tip" |
| Rowley's Red Barn | `entertainment-144` | "Valid at: Santaquin â€¢ M-Th" |
| SCERA | `entertainment-146` | "Valid at: Orem â€¢ Present Card in Person" |
| The Picklr | `entertainment-150` | "Valid at: Lehi & Bluffdale" |
| Zipline Utah | `entertainment-159` | "Valid at: Provo Canyon â€¢ Code: SSC242U" |
| Zipline Utah | `entertainment-160` | "Valid at: Provo Canyon â€¢ Code: SSC242U" |
| Body Balance Massage and Float | `retail-162` | "Valid at: American Fork" |
| Fabulous Freddy's | `retail-172` | "Valid at: Lehi" |
| Fabulous Freddy's | `retail-173` | "Valid at: Lehi" |
| Grease Monkey | `retail-177` | "Valid at: Lehi (Pioneer Crs) Herriman" |
| Healing Vibes | `retail-181` | "Valid at: Orem" |
| MTECH Cosmetology | `retail-186` | "Valid at: Lehi & SF" |
| Taylor Andrews Academy | `retail-194` | "Valid at: Provo & WJ" |
| Auntie Anne's | `free-201` | "Valid at: Lehi & Draper" |
| Buffalo Wild Wings | `free-205` | "Valid at: Orem & Lehi" |
| Classic Fun Center | `free-210` | "Valid at: Orem" |
| Curry Pizza | `free-214` | "Valid at: Lehi" |
| Dairy Queen | `free-215` | "Valid at: Orem Vineyard EM & Santaquin" |
| Daylight Donuts | `free-216` | "Valid at: Saratoga Springs" |
| El Beto | `free-218` | "Valid at: Provo" |
| El Pollo Loco | `free-219` | "Valid at: Orem Lehi & Particip" |
| Fabulous Freddy's | `free-221` | "Valid at: Lehi" |
| Game Grid | `free-224` | "Valid at: Lehi" |
| Game Grid | `free-225` | "Valid at: Lehi" |
| Jamba Juice | `free-228` | "Valid at: Provo (University PKWY) UVU Campus Draper & WJ" |
| McDonald's | `free-238` | "Valid at: All Orem N Provo PG Cedar Hills & AF" |
| Quench It! | `free-252` | "Valid at: All Ut County & Bluffdale" |
| Splash Drinks and Treats | `free-259` | "Valid at: Lehi" |
| Taco Time | `free-262` | "Valid at: Orem" |
| Taylor Andrews Academy | `free-265` | "Valid at: Provo and WJ â€¢ M-Th" |
| The Picklr | `free-268` | "Valid at: Lehi & Bluffdale" |
| The Rift Augmented Reality | `free-269` | "Valid at: Provo â€¢ Mon Only" |
| Village Inn | `free-280` | "Valid at: Provo" |
| Auntie Anne's | `treats-284` | "Valid at: Lehi & Draper" |
| Auntie Anne's | `treats-285` | "Valid at: Lehi & Draper" |
| Baskin Robbins | `treats-290` | "Valid at: Orem" |
| Cinnabon | `treats-301` | "Valid at: Orem" |
| Cinnabon | `treats-302` | "Valid at: Orem" |
| Cold Stone Creamery | `treats-304` | "Valid at: Provo & SF" |
| Dairy Queen | `treats-310` | "Valid at: Orem Vineyard EM & Santaquin" |
| Daylight Donuts | `treats-311` | "Valid at: Saratoga Springs" |
| Dippin' Dots Fab Freddy's | `treats-312` | "Valid at: Lehi" |
| Gurus Cafe | `treats-317` | "Valid at: Provo Cntr & UVU" |
| Jamba Juice | `treats-319` | "Valid at: Provo (Univ PKWY) UVU Campus Draper & WJ" |
| McDonald's | `treats-321` | "Valid at: All Orem N Provo PG Cedar Hills & AF" |
| Papa Murphy's | `treats-333` | "Valid at: Provo & Park City" |
| Quench It! | `treats-337` | "Valid at: All Utah County & Bluffdale" |
| Rocky Mountain Chocolate Factory | `treats-338` | "Valid at: Lehi" |
| Roll Up Crepes | `treats-339` | "Valid at: Orem & SF" |
| Roll Up Crepes | `treats-340` | "Valid at: Orem & SF" |
| Roll Up Crepes | `treats-341` | "Valid at: Orem & SF" |
| Roxberry Juice Co. | `treats-344` | "Valid at: Spanish Fork & Participating Locations" |
| Splash Drinks and Treats | `treats-349` | "Valid at: Lehi" |
| Splash Drinks and Treats | `treats-350` | "Valid at: Lehi â€¢ Excludes Energy Drink Mixers" |
| Yonutz | `treats-366` | "Valid at: Saratoga Springs" |
| Yonutz | `treats-367` | "Valid at: Saratoga Springs" |
| Yonutz | `treats-368` | "Valid at: Saratoga Springs" |
| Dairy Queen | `sandwiches-383` | "Valid at: Orem Vineyard EM & Santaquin" |
| Dairy Queen | `sandwiches-384` | "Valid at: Orem Vineyard EM & Santaquin" |
| Dairy Queen | `sandwiches-385` | "Valid at: Orem Vineyard EM & Santaquin" |
| Ike's | `sandwiches-391` | "Valid at: Lehi" |
| Jamba Juice | `sandwiches-393` | "Valid at: Provo (University PKWY) UVU Campus Draper & WJ" |
| Marco's Pizza | `sandwiches-399` | "Valid at: Santaquin Only" |
| McDonald's | `sandwiches-400` | "Valid at: All Orem N Provo PG Cedar Hills & AF" |
| McDonald's | `sandwiches-401` | "Valid at: All Orem N Provo PG Cedar Hills & AF" |
| McDonald's | `sandwiches-402` | "Valid at: All Orem N Provo PG Cedar Hills & AF" |
| Wendy's | `sandwiches-416` | "Valid at: Provo 122 E 1300 N Orem Center St" |

### Other address/location text (42)

Everything else — worth an actual look.

### Pier 49 Pizza — `pizza-019` (index 18, field `deal.title`)

- **Text:** `"2-4-1! Any Pizza! AF and Provo"`
- **Matched:** city name ("Provo")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Pizza Pie Cafe — `pizza-023` (index 22, field `deal.title`)

- **Text:** `"2-4-1! Buffet! Highland Only"`
- **Matched:** city name ("Highland")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Pizza Pie Cafe — `pizza-025` (index 24, field `deal.title`)

- **Text:** `"FREE! Kid's Buffet w/ Paying Adult! Orem"`
- **Matched:** city name ("Orem")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Ritz Eats and Sweets — `pizza-026` (index 25, field `deal.title`)

- **Text:** `"2-4-1! Pizza! Inside Classic Fun Center Orem"`
- **Matched:** city name ("Orem")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Buffalo Wild Wings — `restaurants-034` (index 33, field `deal.title`)

- **Text:** `"FREE! Kids Meal w/ Adult Entree! Orem & Lehi"`
- **Matched:** city name ("Orem")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### El Beto — `restaurants-047` (index 46, field `deal.title`)

- **Text:** `"Buy 1 Burrito & 2 Drinks Get 1 Burrito FREE! Provo"`
- **Matched:** city name ("Provo")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Golden Corral Buffet — `restaurants-057` (index 56, field `deal.title`)

- **Text:** `"2-4-1! Lunch Buffet! Mon-Fri. Before 4 PM Orem"`
- **Matched:** city name ("Orem")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Golden Corral Buffet — `restaurants-058` (index 57, field `deal.title`)

- **Text:** `"2-4-1! Weekend Breakfast Buffet! Orem"`
- **Matched:** city name ("Orem")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Outback Steakhouse — `restaurants-070` (index 69, field `deal.title`)

- **Text:** `"Buy Any Entree Get a Bloomin' Onion FREE! Orem"`
- **Matched:** city name ("Orem")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Taco Time — `restaurants-082` (index 81, field `deal.title`)

- **Text:** `"2-4-1! Any Single Menu Item! Orem"`
- **Matched:** city name ("Orem")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Village Inn — `restaurants-088` (index 87, field `deal.title`)

- **Text:** `"2-4-1! Entree! Provo"`
- **Matched:** city name ("Provo")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Village Inn — `restaurants-089` (index 88, field `deal.title`)

- **Text:** `"Buy an Entree Get a Slice of Pie FREE! Provo"`
- **Matched:** city name ("Provo")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Wingers — `restaurants-093` (index 92, field `deal.title`)

- **Text:** `"FREE! Dessert With Any Entree Purchase! Provo"`
- **Matched:** city name ("Provo")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Classic Fun Center — `entertainment-102` (index 101, field `deal.title`)

- **Text:** `"2-4-1! Skating Climbing Bouncing or Laser Tag! Orem"`
- **Matched:** city name ("Orem")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### FatCats — `entertainment-113` (index 112, field `deal.title`)

- **Text:** `"50% OFF! 1 Hr Pool Table! Provo"`
- **Matched:** city name ("Provo")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### FatCats — `entertainment-114` (index 113, field `deal.title`)

- **Text:** `"50% OFF! Bowling! Before 8 PM Provo"`
- **Matched:** city name ("Provo")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Game Grid — `entertainment-115` (index 114, field `deal.title`)

- **Text:** `"$25 OFF! Any Purchase of $50 or More! Lehi"`
- **Matched:** city name ("Lehi")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Game Grid — `entertainment-116` (index 115, field `deal.title`)

- **Text:** `"50% OFF! Any Magic Tournament Entry! Lehi"`
- **Matched:** city name ("Lehi")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Fabulous Freddy's — `retail-172` (index 171, field `deal.title`)

- **Text:** `"2-4-1! Basic Car Wash! Lehi"`
- **Matched:** city name ("Lehi")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Fabulous Freddy's — `retail-173` (index 172, field `deal.title`)

- **Text:** `"2-4-1! VIP Car Wash! Lehi"`
- **Matched:** city name ("Lehi")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Grease Monkey — `retail-177` (index 176, field `deal.title`)

- **Text:** `"50% OFF! Full Service Conv. Oil Change! Lehi Herriman"`
- **Matched:** city name ("Lehi")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Healing Vibes — `retail-181` (index 180, field `deal.title`)

- **Text:** `"2-4-1! Foot Spa Massage! Orem"`
- **Matched:** city name ("Orem")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### MTECH Cosmetology — `retail-186` (index 185, field `deal.title`)

- **Text:** `"$4 Haircut & Style! Lehi & SF"`
- **Matched:** city name ("Lehi")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### MTECH Cosmetology — `retail-186` (index 185, field `deal.value`)

- **Text:** `"$4 Haircut & Style! Lehi & SF"`
- **Matched:** city name ("Lehi")
- **Rendered where:** Visible in DealCard pill, BottomSheet/DealModal headline, RedemptionScreen — NOT shown in HomeCard

### Classic Fun Center — `free-210` (index 209, field `deal.title`)

- **Text:** `"FREE! Skating Climbing Bouncing or Laser Tag! Orem"`
- **Matched:** city name ("Orem")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Curry Pizza — `free-214` (index 213, field `deal.title`)

- **Text:** `"FREE! Samosa! Lehi"`
- **Matched:** city name ("Lehi")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### El Beto — `free-218` (index 217, field `deal.title`)

- **Text:** `"FREE! Medium Horchata! Provo"`
- **Matched:** city name ("Provo")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Fabulous Freddy's — `free-221` (index 220, field `deal.title`)

- **Text:** `"FREE! Best Exterior Car Wash! Lehi"`
- **Matched:** city name ("Lehi")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Game Grid — `free-224` (index 223, field `deal.title`)

- **Text:** `"FREE! Board Game Rental and $5! Gift Card! Lehi"`
- **Matched:** city name ("Lehi")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Game Grid — `free-225` (index 224, field `deal.title`)

- **Text:** `"FREE! Magic the Gathering Booster Pack! Lehi"`
- **Matched:** city name ("Lehi")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Quench It! — `free-252` (index 251, field `deal.title`)

- **Text:** `"FREE! Pretzel Bites! All Ut County & Bluffdale"`
- **Matched:** city name ("Bluffdale")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Splash Drinks and Treats — `free-259` (index 258, field `deal.title`)

- **Text:** `"FREE! One Bag of Cheddar Jalapeno or Butter Popcorn! Lehi"`
- **Matched:** city name ("Lehi")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Taco Time — `free-262` (index 261, field `deal.title`)

- **Text:** `"FREE! Plain or Bavarian Creme Churro! Orem"`
- **Matched:** city name ("Orem")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Taylor Andrews Academy — `free-265` (index 264, field `deal.title`)

- **Text:** `"FREE! Haircut! M-Th Provo and WJ"`
- **Matched:** city name ("Provo")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### The Picklr — `free-268` (index 267, field `deal.title`)

- **Text:** `"FREE! 3 Hr Open Play Session! Lehi & Bluffdale"`
- **Matched:** city name ("Lehi")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### The Rift Augmented Reality — `free-269` (index 268, field `deal.title`)

- **Text:** `"FREE! Admit 2 to Any Experience! Mon Only Provo"`
- **Matched:** city name ("Provo")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Village Inn — `free-280` (index 279, field `deal.title`)

- **Text:** `"FREE! Slice of Pie! Provo"`
- **Matched:** city name ("Provo")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Splash Drinks and Treats — `treats-350` (index 349, field `deal.title`)

- **Text:** `"2-4-1! Drink! Lehi Excludes Energy Drink Mixers"`
- **Matched:** city name ("Lehi")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### McDonald's — `sandwiches-400` (index 399, field `deal.title`)

- **Text:** `"2-4-1! Kids Meal! All Orem N Provo PG Cedar Hills & AF"`
- **Matched:** city name ("Orem")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### McDonald's — `sandwiches-401` (index 400, field `deal.title`)

- **Text:** `"2-4-1! Sandwich! All Orem N Provo PG Cedar Hills & AF"`
- **Matched:** city name ("Orem")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### McDonald's — `sandwiches-402` (index 401, field `deal.title`)

- **Text:** `"Buy Large Drink & Fry Get 1 Sandwich FREE! All Orem N Provo PG Cedar Hills & AF"`
- **Matched:** city name ("Orem")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)

### Wendy's — `sandwiches-416` (index 415, field `deal.title`)

- **Text:** `"FREE! Small Frosty w/ Any Purchase! Provo 122 E 1300 N Orem Center St N. Orem AF Highland Saratoga Traverse Mtn & Participating Locations"`
- **Matched:** directional + number (e.g. "200 W"); city name ("Provo")
- **Rendered where:** Always visible (HomeCard, DealCard, BottomSheet, DealModal, LocationPicker, BusinessMarker, AdminTab)
