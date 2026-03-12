<!-- Standardized task format: numbered tasks (1.1, 1.2...), blocked-by dependencies, [ ] checkboxes.
     Enables parallel work — tasks with no blockers can run simultaneously. -->
# Roadmap

## Phase 1: Data Completion

**1.1: Fill in phone numbers + websites**
Goal: Populate contact.phone and contact.website for all 199 businesses
Steps:
- [ ] Fill in phone_website_needed.csv with phone and website data
- [ ] Write merge script to stamp contact fields onto matching deals in deals.json
- [ ] Verify modal renders phone (tel: link) and website (external link) correctly
blocked-by: none

**1.2: Audit and fix any remaining geocoding issues**
Goal: Ensure all 819 map pins land in the correct location
Steps:
- [ ] Review geocode_review.csv for any flagged outliers
- [ ] Re-run fix_outliers.py if needed
- [ ] Spot-check pins for major chains (Wendy's, Jiffy Lube, Chili's)
blocked-by: none

## Phase 2: Polish & Launch

**2.1: Production readiness**
Goal: App is stable, fast, and ready for real student use
Steps:
- [ ] Test on iOS Safari and Android Chrome
- [ ] Confirm Vercel deploy is clean (no build warnings)
- [ ] Add Open Graph meta tags for link previews
blocked-by: 1.1, 1.2

**2.2: Share and get feedback**
Goal: Get the app in front of real BYU/UVU students
Steps:
- [ ] Share link in relevant student Facebook groups / Discord servers
- [ ] Collect feedback on usability and missing features
blocked-by: 2.1
