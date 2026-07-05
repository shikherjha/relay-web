# Relay Web Bhavya Logs

This file records frontend changes made in `relay-web` for Bhavya so the UI work can be resumed quickly.

## 2026-07-04 - Homepage customer UX refresh

### Goal

- Improve Relay's homepage using patterns from popular ecommerce and quick-commerce sites.
- Make the first viewport useful for shoppers who do not scroll much.
- Keep the homepage customer-friendly, easy to scan, and connected to Relay's real flows: Rescue, Second Life, Genie, Returns, cart, and trust/passport signals.

### Files changed

- `src/routes/index.tsx`
- `src/styles.css`

### Homepage redesign

- Replaced the old mission-style hero with a dense shopping homepage.
- Added a top shopper utility area:
  - delivery/location tile for Bangalore 15 km.
  - large search field.
  - Genie action button.
  - Relay cart count.
- Added category/action shortcuts:
  - Local Rescue
  - Certified
  - Fashion
  - Electronics
  - Genie
  - Returns
- Added compact right-side panels:
  - Genie prompt: "Tell Relay what to watch."
  - shopper trust panel: real photos, grade shown, CO2 saved.
- Added quick action tiles:
  - Return Rescue
  - Certified Second-Life
  - Genie Wish Radar
  - Return or Resell
- Reworked product sections so useful content appears earlier:
  - nearby pickup deals.
  - verified resale picks.
  - popular catalog picks.

### Hero carousel update

- The first version of the new homepage used a static hero image selected from available data.
- After Bhavya asked whether it moves like Amazon/Flipkart, the hero was upgraded into a live rotating catalogue carousel.
- Carousel behavior:
  - rotates automatically every 4.5 seconds.
  - pauses on hover and focus.
  - includes previous/next arrow buttons.
  - includes dot indicators for direct slide selection.
  - animates image/headline changes with Framer Motion.
- Carousel data sources:
  - local Rescue listings from `/rescue/feed`.
  - Second-Life listings from `/second-life`.
  - catalog products from `/products`.
- Carousel CTAs route by slide type:
  - Rescue slide opens the unit ledger page.
  - Second-Life slide opens `/second-life`.
  - Catalog slide opens the product page.
- Fallback slide remains available if backend data is empty.

### Styling update

- Updated global heading letter spacing in `src/styles.css`:
  - from `-0.02em`
  - to `0`
- Reason: keep display text professional and aligned with the frontend design rule to avoid negative letter spacing.

### Validation

- `npm.cmd run build` passed in `relay-web`.
- `git diff --check` passed with only normal Windows CRLF warnings.
- Docker web build passed as part of the full stack rebuild.

### Full local app run

- Ran the full app from `relay-dev`:
  - `docker compose --profile apps up -d --build`
- Applied migrations:
  - `docker compose exec -T relay-api alembic upgrade head`
- Seeded demo data:
  - 75 products
  - 88 units
  - 15 passports
  - 13 local rescue listings
  - 2 national rescue listings
  - 2 P2P Second-Life listings
  - 2 certified Second-Life listings
  - S3 product images enabled
- Health checks passed:
  - frontend: `http://127.0.0.1:3000/` returned HTTP 200.
  - API: `http://127.0.0.1:8010/health` returned ok with DB connected.
  - ML: `http://127.0.0.1:8001/health` returned ok in Bedrock-only mode.
  - engine: `http://127.0.0.1:8002/health` returned ok.
- Full smoke test:
  - first run timed out on a cold `/wish-score` call.
  - warmed `/wish-score` and verified `POST /wishlist` returned a real `wish_score`.
  - reran smoke with `PYTHONPATH=/app`.
  - final result: `SMOKE_OK`.

### Current preview URL

- Use `http://127.0.0.1:3000/` to view the running app.


## 2026-07-04 - Return passport mock-note cleanup

### Frontend update

- Updated `src/lib/relay-api.ts` so the Condition Passport grader note no longer defaults to `Graded by Relay AI - demo-safe mock pipeline`.
- The UI now derives the note from `model_tier_used`:
  - Bedrock passports show a Bedrock-backed Relay AI note.
  - CNN passports show a local vision model note.
  - mock passports show a local fallback note.
  - rejected uploads show a media-quality re-upload note.

### Related backend fix

- The mock passport in Bhavya's return flow was caused by a WebP upload being sent to Bedrock as JPEG.
- relay-api and relay-ml were patched to detect and pass WebP correctly.
- After rebuild, the visible return was regraded and now returns `model_tier_used="bedrock-only"`.

### Verification

- `npm.cmd run build` passed.
- Rebuilt `relay-web` with Docker Compose.
- The app is running at `http://127.0.0.1:3000/`.


## 2026-07-04 - Ledger passport grade display

### Frontend update

- Updated `src/lib/relay-api.ts`:
  - `LedgerVerifyDTO` now accepts the live `passport` object returned by relay-api.
  - `ApiPassport` includes `model_tier_used`.
- Updated `src/routes/ledger.$unitId.tsx`:
  - maps the live LifeLedger passport through `apiPassportToUi()`.
  - uses the live Bedrock passport before falling back to mock fixture data.
  - shows a visible current grade panel in the About card near the top of the page.
  - displays the grader note from the live passport/tier.

### Related backend fix

- relay-api now includes the latest Condition Passport in `/lifeledger/{unit_id}/verify`.
- disposition recommendations no longer write final lifecycle events such as `RESCUED`.
- the duplicate local `RESCUED` row for Bhavya's test unit was removed, leaving only the real rescue event.

### Verification

- `npm.cmd run build` passed.
- Rebuilt `relay-web` with Docker Compose.
- Verified the ledger page returns HTTP 200.
- Verified the live ledger response includes `passport.grade="C"` and `passport.model_tier_used="bedrock-only"`.


## 2026-07-04 - Genie match chooser

### Frontend update

- Updated `src/routes/genie.tsx` so granted wishes no longer open only the first matched item.
- Wishes with multiple matches now show a `View matches` action.
- Clicking the action expands an inline chooser with every matched unit for that wish.
- Each match row links to its own LifeLedger page and shows available context such as grade, scope, fulfillment, distance, and price.
- Cleaned the Genie page copy to plain ASCII while editing so broken glyphs do not appear in the route title, description, budget field, or footer link.

### Verification

- `npm.cmd run build` passed.
- `git diff --check` passed with only normal LF-to-CRLF warnings.
- Rebuilt/restarted the local app with `docker compose --profile apps up -d --build relay-web`.
- Verified `http://127.0.0.1:3000/genie` returns HTTP 200.
- Verified the API health check is ok with DB connected.


## 2026-07-04 - Mobile homepage layout fix

### Frontend update

- Updated `src/routes/index.tsx` so the Discover homepage no longer forces a desktop-width layout on small screens.
- Removed the `min-w-[780px]` shortcut rail that caused horizontal overflow on 375px mobile viewports.
- Changed category shortcuts into a responsive grid:
  - 2 columns on mobile.
  - 3 columns on small tablets.
  - 6 columns on desktop.
- Tightened the mobile search/location/cart area so controls stack cleanly without pushing the page wider than the viewport.
- Adjusted the hero carousel for mobile:
  - smaller mobile headline sizing.
  - stronger vertical overlay for readability.
  - wrapped price row so it does not overflow.
  - mobile-specific height and padding.
- Updated `src/styles.css` with a global `overflow-x: hidden` guard for accidental horizontal page scroll.

### Verification

- `npm.cmd run build` passed.
- `git diff --check` passed with only normal LF-to-CRLF warnings.
