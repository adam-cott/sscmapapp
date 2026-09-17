# Status

_Last updated: 2026-09-17_

## Latest updates (merged to master, live at v1.0.36)

- **Home tab section cards redesigned "Airbnb style"**: no white card container around the logo anymore — the logo tile itself is the card (rounded corners, soft shadow, square, no colored background behind it). Business name + full deal description sit directly on the page background below it.
- **Fixed a real Chrome bug**: the tile's aspect ratio was silently being overridden by the logo image's own 512x512 intrinsic ratio. Fixed by switching to a CSS technique (padding-top-percentage) that isn't affected by this.
- **Fixed the tile being too tall**: going square made each card ~33% taller than before, pushing "Use Again" and "Featured" out of view. Card width now scales down to keep the same overall vertical footprint.
- **Fixed description text bleeding into the next card**: name/description are now clipped with `overflow: hidden` sized to the card's own width, so it can't overflow regardless of card size.
- Added a test account for manual/incognito testing (see README).

## Known, not yet addressed

- **47 of 198 logo files have significant built-in white padding** (e.g. `scratch-miniature-golf.png`, `cold-stone-creamery.png`, `curry-pizza.png`) — wide/short wordmark logos that look small inside the now-square tile. This is a source-file issue, not CSS; needs a decision on whether/how to clean up those images (crop risks cutting logos off, so needs care).

## Pending verification

- Waiting on Adam to confirm on his Galaxy A36 that:
  - All three Home tab sections (Deals Near Me, Use Again, Featured) are reachable without excessive scrolling
  - No text bleeds into the next card
  - Tile shadow reads as soft, not a hard outline
