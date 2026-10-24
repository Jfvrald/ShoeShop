# Sole Rise: marketplace platform notes

What changed from the first storefront build, and why each piece exists.

## Storefront
- **Parallax hero** (`src/component/Hero`): a pinned stage driven by one scroll value (`--p`). Three chapters (Discover, Every brand, Run a store) move layers at different speeds: outline word, shoe cutout, brand photo cards, seller-studio panels. Reduced motion shows a still first chapter.
- **Shop** (`src/component/Shop`): a sticky left filter rail (category, gender, sale, brand, model, size with units left, color, price, condition, sold by). Facet counts update against the other active filters. On phones the rail becomes a sheet.
- **Catalog** (`src/data/catalog.js`): 28 pairs across Nike, Jordan, Adidas, New Balance, Puma and Vans. Stock is held per US size, with cost, reorder point, lead time, supplier and bin on every SKU.
- **Product detail**: colorway thumbnails (same model), per-size stock, quantity, fit meter from buyer reports, delivery estimate, restock request when sold out.

## Community with a purpose
Fit reports (verified buyers only, after delivery) help others pick a size. Saves and restock requests are demand signals that feed the seller's forecast.

## Seller studio (`src/component/Studio`, `src/lib/erp.js`)
Overview (KPIs, revenue with a 30-day forecast band, action centre), Inventory (per-size counts, ledger), Forecast (velocity, days of cover, reorder point, suggested quantity, purchase orders), Orders (pipeline board with SLA and delivery timeline), Purchasing (purchase orders, receiving into sizes), Reports (ABC, margin, size curve, dead stock, CSV).

## Fulfillment (`src/data/shipping.js`)
Each seller in an order gets its own shipment: Placed, Packed, Shipped, Out for delivery, Delivered. Sellers advance it in the studio; buyers see the same timeline in Account.

## Demo data
`src/data/demo.js` builds 90 days of deterministic orders (weekend and payday peaks, rising and fading products, delayed shipments), purchase orders, stock movements and fit reports. Demo logins use password `demo1234`: buyer@, seller@ and reseller@solerise.demo. Everything is local to the browser; ratings, saves and reports are illustrative.
