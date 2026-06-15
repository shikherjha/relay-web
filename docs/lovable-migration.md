# Lovable → relay-web migration

Merging the refactored Lovable UI (`../_lovable_new`, mirror of
`github.com/shikherjha/relay-second-life-commerce`) into the live `relay-web`
frontend. **Additive + non-destructive**: relay-web's stack, design system,
stores, and React Query setup are kept; the API wiring is the source of truth.

## Key finding

The Lovable export is the **same stack** as relay-web (TanStack Start + Vite +
React 19 + Tailwind v4 + shadcn/ui + Framer Motion + Zustand + React Query) —
it is a refactored fork, not a foreign stack. The only divergences are:

| Area | relay-web (target) | Lovable (reference) |
| --- | --- | --- |
| API client | real `relay-api.ts` + `api.ts` (dynamic `X-User-Id`, port 8010, fallbacks) | mock-only `api.ts` (hardcoded user, port 8000) |
| Data | React Query against relay-api, `mock-*` only as fallback | mostly `mock-data.ts` / `mock-extra.ts` |
| Store | `userId`/`persona` → `X-User-Id` mapping | adds `cart`, `droppedWishes`, `transitioning`, tier ladder |
| Surfaces | Relay (second-life) only | **adds an Amazon "Layer-1" storefront** + Smile transition into Relay |
| Naming | Wishlist | **Genie** |

So the merge keeps relay-web's API layer and ports the Lovable **visual
refactor + new surfaces** on top, re-wired to the real endpoints.

## Screen / component map

| Lovable | relay-web action | Wiring |
| --- | --- | --- |
| `components/relay/SmileLogo`, `SmileTransition`, `PersonaToggle`, `AmazonNav` | **new** (copied) | store only |
| `routes/amazon.tsx` (+`/`, `/products/$id`, `/orders`, `/seller`) | **new** Amazon Layer-1 surface | `getProducts`, `getProduct`, **`getOrders`** (real order history), local cart |
| `routes/genie.tsx` | **new**, replaces wishlist | `getWishMatches`, `postWish` (+ national/shipped badges) |
| `routes/wishlist.tsx` | redirect → `/genie` | — |
| `routes/returns.index.tsx` | **new** order picker | `getOrders` (returnable order items) |
| `routes/returns.new.tsx` | enhance existing | real return flow + **pickup slot + multi-angle upload** + order context |
| `routes/rescue.tsx` | enhance existing | add **local/national scope**, fulfillment / Path A-vs-B + tier badges |
| `routes/impact.tsx` | enhance existing | tier ladder driven by **`tiers[]`** from the impact API |
| `routes/ledger.$unitId.tsx` | adopt richer UI | `verifyLedger` + mock fallback (Fingerprint, QR, passport, event icons) |
| `routes/index.tsx` | light enrich | real catalog + near-you strip from rescue feed |
| `routes/cart.tsx` | enhance existing | bracketing from API + **checkout → POST /orders/checkout** |
| `__root.tsx`, `Nav.tsx` | merge | layer-aware nav (Amazon vs Relay) + Smile overlay; **keep demo reset** |
| `routes/ops.tsx`, `rescue.pairs.tsx` | keep as-is | already API-wired |

## API client changes (`src/lib/relay-api.ts`, `src/lib/api.ts`)

- **Orders (new):** `OrderDTO` / `OrderItemDTO`, `getOrders`, `getOrder`, `checkout`.
- **Returns:** `createReturn` now takes `{ orderItemId? | unitId, reasonCode, pickupSlot? }`
  and returns `ReturnDTO` (`order_item_id`, `pickup_slot`, `pickup_at`, `status`).
- **Media:** `uploadReturnMediaFiles(id, Blob[])` for multi-angle / video (kept single `uploadReturnMedia`).
- **Cart:** `postCart` (returns bracketing flags).
- **Rescue:** `RescueListingDTO` gains `scope`, `ships`, `fulfillment`, `pickup_anchored`;
  `getRescueFeed(geo, { scope, radiusKm })`.
- **Genie:** `WishMatchDTO` gains `title`, `category`, `grade`, `price`, `scope`, `fulfillment`.
- **Impact:** `ImpactWalletDTO` gains `tier`, `next_tier`, `credits_to_next_tier`, `tiers[]`;
  legacy `early_access*`/`events` kept optional; `walletEarlyAccess()` helper derives access.
- **LifeLedger:** event rows gain optional `actor`/`location`/`note` for the richer timeline.

All additive/optional, so existing callers keep compiling; fallbacks preserved.

## New backend concepts surfaced in the UI

- **Pickup scheduling + TTL** — slot picker in returns wizard; decay clock already on rescue/PDP.
- **Tiered early access** — impact tier ladder from `tiers[]`; early-access badges on rescue.
- **Path A vs Path B** — rescue cards badge `local_pickup` ("keep it local") vs
  `shipped`/`courier` ("Certified Second-Life", national).
- **National Genie** — match cards badge `national` + `shipped`.
- **Order history** — `/amazon/orders` from `GET /orders`; drives the return flow.

## UI/UX bugs fixed while porting

- Lovable screens are **hardcoded to mock data** → re-pointed to live endpoints with graceful fallback.
- Lovable `api.ts` used a 2.5s timeout + hardcoded `X-User-Id` + port 8000 → kept relay-web's
  dynamic, persona-aware client (port 8010, 30s).
- `AmazonNav` search `<input>` had no label → added `aria-label`; category strip buttons get `aria-label`s.
- Removed Lovable error-reporting beacon (`lovable-error-reporting`) from `__root.tsx` (dead/external).
- Returns "load demo photos" pushed the *same* thumbnail 3× → replaced with distinct multi-angle demo set.
- `PersonaToggle` now invalidates React Query on switch so persona-scoped data refetches.

## Decisions / open questions

- **Default persona stays `seller`** (relay-web default). Both demo users are seeded with order
  history, so Amazon/orders work either way; toggle switches `X-User-Id`.
- **Tier naming**: backend uses `standard|silver|gold`; UI renders backend `tiers[]` names directly,
  falling back to a local `standard/silver/gold` ladder when the API is unreachable.
- **Track-B (resell/P2P marketplace) intentionally NOT migrated** per scope. The Lovable PDP's
  "List this unit for resale" affordance is left out of the ported catalog PDP.
- `/products/$id` remains the **catalog** PDP (API). Lovable's rescue-claim PDP visuals were not
  forced onto it to avoid breaking catalog links; rescue claim stays on the rescue feed.
- Build gate is `vite build` (no `tsc` in scripts); types are kept honest but the build does not fail on types.
