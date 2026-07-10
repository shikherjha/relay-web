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


## 2026-07-10 - Amazon storefront, guided returns, Passport redesign, live Genie, and Rescue sorting

### Amazon storefront redesign

- Rebuilt `src/components/relay/AmazonNav.tsx` to follow the familiar Amazon.in information hierarchy:
  - dark Amazon header;
  - India wordmark treatment;
  - delivery location;
  - department selector and wide search field;
  - account, orders, and cart controls;
  - secondary department navigation;
  - Relay Second-Life entry point.
- Rebuilt `src/routes/amazon.index.tsx` as an Amazon-style shopping surface:
  - product-led footwear hero;
  - overlapping white category panels;
  - horizontal recommendation rail;
  - restrained Relay Condition Passport promotion.
- Prioritized the new `FAS-SN-699` shoe in the hero and product recommendations.
- Selected known catalogue SKUs for the four category panels so headings align with shoes, fashion, headphones, and wearables.
- Fixed mobile header behavior:
  - logo and cart remain on the first row;
  - search moves to a full-width second row;
  - secondary navigation remains horizontally scrollable.
- Reduced the hero/category overlap so the `Shop now` CTA is not covered.

### Product first-open error

- Updated `src/routes/amazon.products.$id.tsx` to distinguish pending, error, and genuine not-found states.
- Added two short retries for transient product requests.
- Added a clear in-page `Try again` action instead of incorrectly showing `Product not found` after a temporary API/ML failure.
- Fixed the existing conditional React hook placement while validating the route.
- Live verification returned HTTP 200 for the shoe product detail on three consecutive requests.

### Six photos or one video return flow

- Rebuilt the evidence step in `src/routes/returns.new.tsx` with a segmented mode control:
  - `6 photos`;
  - `1 video`.
- Photo mode now has six stable slots labeled:
  - front;
  - back;
  - left;
  - right;
  - top;
  - bottom.
- Each angle supports preview and replacement.
- The UI displays completion progress and disables grading until all six slots are filled.
- Video mode accepts one walkthrough, provides playback preview, and supports replacement.
- The optional video path was explicitly preserved after Bhavya clarified that customers should choose either evidence format.
- Updated `src/lib/api.ts` so multipart uploads can carry explicit angle filenames required by the backend contract.
- Disposition completion now invalidates both the Rescue feed and Genie match cache.

### Condition Passport redesign

- Rebuilt `src/components/relay/ConditionPassport.tsx` to look like an actual open passport instead of a generic ticket/card.
- Added:
  - dark green passport cover/header treatment;
  - passport number;
  - product photograph and defect markers;
  - product identity, category, packaging, and unit ID;
  - large stamped AI grade;
  - confidence score;
  - condition description/grader note;
  - inspection findings;
  - order verification badge;
  - machine-readable identity lines;
  - full passport hash with copy control;
  - LifeLedger verification status and immutable-history link.
- Visually verified the component in the live LifeLedger page using a tall Chrome screenshot.

### Prevention cleanup

- Removed the product-page warning that told customers they had added three different sizes.
- Removed the cart-level `remove_extra_sizes` intervention and `Keep size` action.
- Preserved useful customer-first fit recommendations and electronics compatibility guidance.

### Live Genie notifications

- Added `src/components/relay/GenieMatchNotifier.tsx` and mounted it globally from `src/routes/__root.tsx`.
- Genie now polls `/wishlist/matches` every three seconds, including while the customer is on another route.
- New match IDs are persisted in local storage so the customer is not repeatedly notified about the same unit.
- New matches raise a Sonner toast containing product title, live price, and a `View match` action.
- Added an on-page `Live matching is active` status to `src/routes/genie.tsx`.
- The Genie route itself also refreshes match data every three seconds.
- Live UI verification showed the toast: `Genie found your match - Cotton Crew Tee is available for INR 763.61`.

### Genie T-shirt visibility fix

- Diagnosed why two wishes remained in `Watching` while Cotton Crew Tee appeared in Rescue.
- The frontend wording was valid; both `Cotton Crew Tee` and `Cotton Tshirt` correctly canonicalized to `tshirt`.
- The backend fix made the existing wishes update automatically without recreating them.
- Final Genie UI verification showed:
  - `Cotton Crew Tee - <= INR 800`: Granted, two matches;
  - `Cotton Tshirt - <= INR 800`: Granted, two matches;
  - top live price approximately `INR 763.61`;
  - match chooser available for both wishes.

### Rescue return-time sorting

- Updated `src/routes/rescue.tsx` with explicit sort modes:
  - latest returns first (default);
  - oldest returns first;
  - ending soon.
- Added visible `Returned just now`, minute, hour, and day age labels to listing cards.
- This lets customers choose between newly available inventory and Rescue windows close to expiry.

### INR 699 shoe product

- Surfaced `Everyday Comfort Running Shoes` at `INR 699` throughout the Amazon storefront.
- The product uses the API-served local PNG so it remains visible without external image access.
- Verified the image response is HTTP 200 with `Content-Type: image/png`.

### Frontend verification

- `npm.cmd run build` passed locally and inside the Docker web image.
- `npx.cmd tsc --noEmit` passed.
- ESLint passed for every changed frontend file.
- The repository-wide lint command still reports the repository's existing CRLF/Prettier mismatch; changed files were formatted and linted directly.
- Desktop and mobile Amazon storefront screenshots were captured with headless Chrome.
- A tall LifeLedger screenshot confirmed the passport layout, grade, condition description, hash, and verification footer render correctly.
- A Genie screenshot confirmed both T-shirt wishes are granted and the global toast is visible.
- The running web app returns HTTP 200 at `http://127.0.0.1:3000/amazon`.
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


## 2026-07-10 - Current session index

- The full frontend record for this session is in the section titled `2026-07-10 - Amazon storefront, guided returns, Passport redesign, live Genie, and Rescue sorting` above.
- It covers the Amazon redesign, product retry behavior, six-photo/video return flow, passport UI, Genie notifications, T-shirt matching, Rescue sorting, and visual verification.
