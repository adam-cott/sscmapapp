# Pin audit

2026-09-28 · `src/data/deals.json` · 671 pins · 720 Google requests

| Result | Pins |
|---|---|
| On the building (within 50 m of Google's spot) | 670 |
| Slightly off (50–150 m, same business) | 0 |
| Misplaced or not found | 0 |
| Closed per Google | 1 |
| Near a city center and not confirmed on the building | 0 |
| Spots shared by 3+ businesses | 1 |
| Not on Google, can't be checked | 1 |

## Misplaced or not found
Google can't find this business within 150 m of the pin. Usually the address is wrong or a duplicate of a store already on the map, or the store is gone. A "no match" whose nearest place is within ~25 m is usually fine (the business is inside that place, e.g. a Pizza Hut in a theater).

_None._

## Closed per Google
Move to `closedLocations` (see CLAUDE.md). "Temporarily closed" can be seasonal.

- CLOSED_TEMPORARILY — Splash Summit Waterpark, 1330 E 300 N, Provo, UT 84606

## Slightly off
Right business and address; the pin is on the lot or elsewhere in the complex. `--snap` moves these onto Google's spot.

_None._

## Near a city center
Within 300 m of the city's center point and not confirmed on the building — the pattern a failed geocode leaves.

_None._

## Spots shared by 3+ businesses
Fine when it's one building (a food court, a campus center); otherwise a fallback.

- 40.3890,-111.8309: Fabulous Freddy's, Splash Drinks and Treats, Dippin' Dots at Fab Freddy's, Ike's

## Not on Google
- Provo Canyon Adventures, 3249 E Provo Canyon Rd, Provo, UT 84604
