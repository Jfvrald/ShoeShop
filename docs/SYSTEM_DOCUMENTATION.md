# Sole Rise — system documentation

Version 1.0 · 24 October 2026

## Scope

This is a functional React local demo, as requested. It runs inside the existing Create React App repository. There is no backend, authentication service, payment processor, or remote database. All example stores, prices, inventories, circles, and orders are demo data.

Implemented: responsive landing page, parallax hero, catalog search/category/condition/saved filters, price sorting, product details, size selection, saved pairs, bag quantity controls, simulated checkout, local profile roles, seller/reseller listings and restocking, community membership, and browser persistence.

Not implemented: real accounts or authorization, multi-user stores, live inventory synchronization, real image upload, payment capture, delivery, seller payouts, order fulfillment, returns/disputes, authenticity verification, community posts, messaging, moderation, and analytics.

## Run and check

```sh
npm ci
npm start
npm run build
npm test -- --watchAll=false --runInBand
```

Local app: `http://localhost:3000`

Visual guide: `http://localhost:3000/design-guide.html`

The package homepage is `.` so production assets use relative URLs at both the Vercel domain root and the GitHub Pages project path. Image URLs use `process.env.PUBLIC_URL`. Vercel builds with `npm run build` and serves the `build` directory as configured in `vercel.json`. Navigation uses hashes and needs no server route rewrite.

## Structure

| File                                  | Responsibility                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/App.js`                          | Page composition, catalog, dialogs, studio, cart, checkout, community, feedback                   |
| `src/store.js`                        | Initial demo inventory, PHP formatting, asset paths, local persistence, stock-aware cart addition |
| `src/App.css`                         | Design tokens, page/component layouts, responsive rules, interaction states                       |
| `src/component/Nav/NavigationBar.jsx` | Brand, navigation, mobile menu, account entry, bag count                                          |
| `src/component/Hero/HeroSection.jsx`  | Landing hero and reduced-motion-aware parallax lifecycle                                          |
| `src/App.test.js`                     | Interaction and commerce-state tests                                                              |
| `public/images/`                      | Locally served imagery                                                                            |
| `public/design-guide.html`            | Browser-readable visual design reference                                                          |
| `docs/DESIGN_GUIDE.md`                | Foundations, component guidance, layouts, motion and accessibility                                |

The implementation deliberately avoids new runtime dependencies. The original Create React App toolchain is retained. A future application growth phase should split the page/dialog components into dedicated feature modules and replace the local state layer with API services.

## Information architecture

- `#home`: editorial discovery, featured pairs, marketplace explanation, community preview.
- `#shop`: searchable/filterable collection and product entry.
- `#community`: circle membership, editorial story, community code.
- `#sell`: store setup, inventory, and demo purchase history.
- Product details, profile setup, listing form, cart, checkout, confirmation, and reading panels use native dialogs.

## Roles

| Capability                       | Guest                | Buyer             | Seller | Reseller  |
| -------------------------------- | -------------------- | ----------------- | ------ | --------- |
| Browse, save, bag, demo checkout | Yes                  | Yes               | Yes    | Yes       |
| Join circles                     | Create profile first | Yes               | Yes    | Yes       |
| Add/remove/restock listings      | Create profile first | Switch role first | Yes    | Yes       |
| Default listing condition        | —                    | —                 | New    | Pre-loved |
| View local demo orders           | Yes                  | Yes               | Yes    | Yes       |

This is one device-level demo workspace. Switching the display name or role does not isolate accounts, inventory, orders, or circle memberships. Signing out removes the profile only; all other local data remains. This is intentionally not an authentication or authorization boundary.

## Persistence model

Storage uses JSON in `localStorage`, versioned with `v1` keys. State survives refresh. Private mode, cleared site data, another browser, or another origin may lose or separate data. If writing is blocked, the UI continues in memory; persistence is unavailable in that case. There is no cross-tab synchronization.

| Key                      | Record shape                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `sole-rise-products-v1`  | Product array: `id`, `name`, `category`, `price`, `image`, `seller`, `condition`, `sizes[]`, `stock`, `tag`, `tone`, optional `owned` |
| `sole-rise-cart-v1`      | Product snapshots plus selected `size` and `quantity`                                                                                 |
| `sole-rise-profile-v1`   | `name`, `role`, or null                                                                                                               |
| `sole-rise-orders-v1`    | `id`, ISO `date`, item snapshots, numeric `total`                                                                                     |
| `sole-rise-wishlist-v1`  | Array of product IDs                                                                                                                  |
| `sole-rise-community-v1` | Array of selected circle indexes                                                                                                      |

Checkout recipient/address values are used only for form validation and are not stored in the order or sent anywhere. No card fields are requested. Prices are integer PHP values in the demo; production should use integer minor units and server-authoritative money calculations.

To reset the prototype, remove only the `sole-rise-*-v1` keys using your browser’s application storage controls. Do not use a general clear-all command on unrelated applications sharing the origin.

## Buyer flow

1. Open Shop or a featured card.
2. Search/filter/sort, or save a pair for later.
3. Open details and select an available US size.
4. Add to bag; matching product/size rows merge.
5. Change quantity or remove items. The total quantity across all sizes cannot exceed the product’s shared stock.
6. Continue to demo checkout and enter sample recipient/address values.
7. Confirm: create a local order, decrement product stock, and clear the bag.
8. View order history in the studio.

Delivery is simulated at ₱150 for a nonempty bag below ₱8,000; otherwise it is free. This rule is illustrative and documented in the detail view. The demo does not model separate shipping per seller.

Checkout rechecks the total quantity against current local product stock. Insufficient stock returns the user to the bag with a message. Stock is intentionally pooled per product, not per size. A production catalog needs SKU-level inventory and reservations.

## Seller / reseller flow

1. Create or edit a profile and choose Seller or Reseller.
2. Open Seller Studio and add a listing.
3. Enter name, positive whole-peso price, positive quantity, category, condition, a supplied image, and at least one size.
4. Submit: the listing appears immediately in local inventory and the shop.
5. Restock adds one pair to that listing’s pooled stock.
6. Remove deletes the listing and its matching cart rows.

Resellers default to Pre-loved condition but can list New pairs as well. The demo does not implement a separate sourcing network, commission calculation, or supplier integration. Listing images are explicitly limited to provided assets, avoiding unsafe arbitrary URLs or heavy binary localStorage data.

## Community flow

Three illustrative circles support join/leave after profile creation. Circle membership is stored locally. A sample editorial story opens in a reading dialog. No external messages are sent and no real membership is registered.

## Proposed production architecture

This is a handoff specification, not implemented infrastructure.

- Web client: public browsing plus authenticated account/studio views.
- API: session authentication, role/capability checks, validation, server-calculated prices and totals.
- Relational database: users, stores, products, variants, inventory, carts, orders, order lines, payments, payouts, memberships, posts, and moderation events.
- Object storage: validated listing images, thumbnails, and access-controlled uploads.
- Payment integration: hosted checkout and verified, idempotent webhooks; never trust a browser success flag as payment proof.
- Order service: inventory reservations, expiration, transaction-safe stock decrement, seller fulfillment, refunds, and shipment state.
- Community service: moderation, reporting, permissions, spam limits, and privacy controls.

Suggested API boundaries: `GET /products`, `GET /products/:id`, `POST /stores/:id/listings`, `PATCH /listings/:id`, `DELETE /listings/:id`, `POST /checkout-sessions`, `GET /orders`, `POST /circles/:id/memberships`, and `DELETE /circles/:id/memberships`. All write operations must be authorized server-side; role labels in the client are not sufficient.

Launch decisions still needed: payment provider, supported delivery areas/carriers, actual seller onboarding rules, marketplace fees, return/dispute processes, authenticity workflow, taxes, and final content policies. These are product/integration decisions, not solved by the prototype.

## Validation and limitations

Validation on 24 October 2026: all 8 automated interaction tests passed. The production build compiled successfully. Tests cover size gating, cross-size stock limits, cart merging/removal, checkout totals and inventory decrement, address non-persistence, reseller listing publication, filters and empty-state reset, community membership, state restoration, unavailable-stock checkout rejection, and mobile-menu state.

Automated component tests use a DOM environment and a native-dialog shim. They do not prove real browser focus trapping, CSS layouts, mobile viewport behavior, image rendering, contrast, or touch behavior. The browser connector in this session reported no available browser, so visual/browser QA remains pending.

Before production, test at 320/390/768/1024/1440px, keyboard-only navigation, Escape and focus return, reduced motion, 200% zoom, failed storage, sold-out inventory, rapid checkout retries, real server errors, and cross-device state. The inherited toolchain emits dependency maintenance warnings; migration should be treated as a separate tested project.
