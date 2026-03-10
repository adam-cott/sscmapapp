# Product Spec — Starving Student Card Map App

**Version:** 1.0
**Last updated:** March 2026
**Status:** MVP shipped

---

## User Stories (MoSCoW)

### 🔴 Must Have — MVP fails without these

---

**US-01 — Map with deal pins**

> As a student near campus, I want to see all active deals on a map centered near my location, so that I can instantly find savings when deciding where to eat.

**Acceptance Criteria:**
- Map loads within 3 seconds with all deal pins visible
- Pins are color-coded and emoji-labeled by category (7 categories)
- Nearby pins cluster into numbered bubbles; tapping zooms in and separates them
- Tapping a single pin opens full deal details (name, offer, address, max uses, directions link)
- Map works on mobile (390px viewport) without horizontal scroll or layout breaks

---

**US-02 — Track deal usage**

> As a student, I want to mark a deal as used so that I know how many uses I have remaining before my card is exhausted.

**Acceptance Criteria:**
- Tapping "Use This Deal" increments the usage count for that deal
- Remaining uses display visually (dot indicators + count) on both the card and detail view
- Usage persists across browser sessions via localStorage (key: `ssc_usage_v1`)
- Fully exhausted deals render grayed-out and are clearly labeled "Done"
- Unlimited deals (`maxUses: null`) show "∞ Unlimited" and never exhaust
- An undo option appears for 4 seconds after marking a deal used

---

### 🟠 Should Have — Important, but MVP technically works without

---

**US-03 — Filter by category**

> As a student, I want to filter deals by category (pizza, restaurants, treats, etc.) so that I can find exactly what I'm craving without scrolling through all 418 deals.

**Acceptance Criteria:**
- 7 category filter chips render in a horizontal scrollable row on mobile
- Tapping a chip filters both the map pins and the deal list simultaneously
- Multiple categories can be active at once
- An "All" chip clears all active filters
- Active chip shows SSC blue fill; inactive shows outline only

---

**US-04 — Sort by distance**

> As a student, I want to sort deals by distance from my current location so that the closest deals always appear first in the list.

**Acceptance Criteria:**
- An in-app location prompt ("See deals nearest to you?") appears on first launch
- Tapping "Allow location" triggers the browser's native permission popup
- Once granted, deal list re-sorts to ascending distance automatically
- Distance badge (e.g., "📍 0.3 mi") appears on every deal card
- Sort control offers three segments: Nearest / Category / A–Z
- Nearest segment is grayed out and non-clickable if location permission is denied
- If user manually selects a sort mode before location resolves, their choice is preserved

---

### 🟡 Could Have — Nice if time permits

---

**US-05 — Search by name or deal type**

> As a student, I want to search for deals by business name or keyword so that I can quickly find a specific restaurant I have in mind.

**Acceptance Criteria:**
- Search bar filters both map pins and deal list in real time as the user types
- Matches on: business name, deal title, deal description, tags
- Search works in combination with active category filters
- Empty state ("No deals found") displays when no results match

---

### ⚫ Won't Have — Explicitly out of scope for MVP

- User accounts, login, or cloud sync — all state is local to the device
- Push notifications for deals expiring soon
- Social features: sharing deals, commenting, or rating businesses
- Business-facing admin portal or deal management
- Real-time business hours or live inventory
- Payment processing of any kind
- Offline mode (map tiles require internet)
- Deals outside Utah County / Wasatch Front geography

---

## Functional Requirements

The MVP must:

| # | Requirement |
|---|---|
| F-01 | Display all 418 deals on an interactive OpenStreetMap with emoji-labeled, category-colored pins |
| F-02 | Group nearby pins into clusters; spiderfy into spiral at max zoom |
| F-03 | Show full deal detail on pin tap: title, value, restrictions, address, uses remaining, Google Maps directions link |
| F-04 | Track per-deal usage in `localStorage`; show remaining uses; visually exhaust completed deals |
| F-05 | Filter deals by 7 categories via chip UI; filters apply to map and list simultaneously |
| F-06 | Text search across business name, deal title, description, and tags |
| F-07 | Sort deals by: Nearest (requires location), Category (alphabetical), A–Z (business name) |
| F-08 | Prompt user for location with an in-app card before triggering the browser permission popup |
| F-09 | Show distance badge on each deal card when location is available |
| F-10 | Mobile-first layout: full-screen map + bottom sheet on mobile; sidebar + modal on desktop |
| F-11 | Handle chains with multiple locations (e.g., Wendy's × 9 locations = 9 separate map pins) |
| F-12 | Undo last deal-use action within a 4-second window |

---

## Success Metrics

| Metric | Description | Target |
|---|---|---|
| **Location grant rate** | % of users who tap "Allow location" on the in-app prompt | > 60% |
| **Activation rate** | % of users who mark at least 1 deal as used in their first session | > 40% |
| **Nearest sort retention** | % of sessions where the sort stays on "Nearest" (not switched away) | > 65% |
| **Filter/search usage** | % of sessions where at least 1 category filter or search query is applied | > 50% |
| **Map engagement** | Average number of deal pins tapped per session | > 3 |

*Measurement: all metrics are observable from session behavior; no analytics backend is required — these can be evaluated via manual user testing or a lightweight tool like Plausible.*

---

## Data Model Summary

All deal data lives in `src/data/deals.json` (static, no backend).

```
Deal {
  id              string          "restaurants-051"
  name            string          "El Pollo Loco"
  category        string          one of 7 keys
  address         string          primary location
  lat, lng        number          primary coordinates
  deal {
    title         string          human-readable offer
    value         string          "Buy 1 Get 1 Free"
    maxUses       number | null   null = unlimited
    expiresAt     string          "2026-12-31"
  }
  locations[]     {lat, lng, address}[]   all valid locations for this deal
  contact {
    phone         string | null
    website       string | null
  }
}
```

Usage state: `localStorage['ssc_usage_v1'] = { [dealId]: usedCount }`

---

## Out of Scope (summary)

| Item | Reason |
|---|---|
| User accounts / auth | No backend; adds significant complexity for zero MVP benefit |
| Cloud usage sync | localStorage is sufficient; sync requires backend |
| Push notifications | Requires service worker + permission; out of scope for MVP |
| Business admin portal | Different user entirely; separate product |
| Social / sharing | Nice-to-have; doesn't affect core JTBD |
| Real-time hours | No data source; businesses would need to self-manage |
| Deals outside Utah County | Card is geographically scoped; no data for other regions |
