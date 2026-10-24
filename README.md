# Sole Rise

A responsive sneaker marketplace concept rebuilt from the supplied Sole Rise references. Includes a dark parallax landing page, a shoppable catalog, local buyer/seller/reseller profiles, a seller studio, and community circles.

## Run locally

```sh
npm ci
npm start
```

Open [Sole Rise](http://localhost:3000/ShoeShop).

## Explore the demo

- Shop → select a size → add to bag → complete a demo checkout.
- Join the movement → choose Seller or Reseller → publish and restock listings.
- Community → create a local profile → join a circle.
- Refresh to restore cart, profile, listings, saved pairs, orders, and memberships.

This is a **local demo**. It creates no real accounts, payments, shipments, or public listings. All state belongs to this browser's demo workspace. Checkout address details are not stored.

## Design and implementation

- [Visual design guide](http://localhost:3000/ShoeShop/design-guide.html)
- [Design guide](docs/DESIGN_GUIDE.md)
- [System documentation](docs/SYSTEM_DOCUMENTATION.md)

## Checks

```sh
npm test -- --watchAll=false --runInBand
npm run build
```

Built with React 18 and the existing Create React App toolchain. The public base path remains `/ShoeShop/`. No new runtime dependencies were added.
