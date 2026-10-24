# Sole Rise

A responsive sneaker marketplace concept rebuilt from the supplied Sole Rise references. Includes a dark parallax landing page, a shoppable catalog, local buyer/seller/reseller profiles, a seller studio, and community circles.

## Run locally

```sh
npm ci
npm start
```

Open [Sole Rise](http://localhost:3000).

## Explore the demo

- Shop → select a size → add to bag → complete a demo checkout.
- Join the movement → choose Seller or Reseller → publish and restock listings.
- Community → create a local profile → join a circle.
- Refresh to restore cart, profile, listings, saved pairs, orders, and memberships.

This is a **local demo**. It creates no real accounts, payments, shipments, or public listings. All state belongs to this browser's demo workspace. Checkout address details are not stored.

## Design and implementation

- [Visual design guide](http://localhost:3000/design-guide.html)
- [Design guide](docs/DESIGN_GUIDE.md)
- [System documentation](docs/SYSTEM_DOCUMENTATION.md)

## Checks

```sh
npm test -- --watchAll=false --runInBand
npm run build
```

Built with React 18 and the existing Create React App toolchain. Production assets use relative paths so the hash-routed app works at the Vercel domain root and under a GitHub Pages project path. No new runtime dependencies were added.

## Vercel deployment

The checked-in `vercel.json` selects Create React App, runs `npm run build`, and serves `build` (not `public`). Set the Vercel Root Directory to the folder containing this `package.json`.

Leave `PUBLIC_URL` unset in the Vercel environment settings; an old `/ShoeShop` value overrides the relative `homepage` setting. Deploy the commit containing these changes to regenerate the asset URLs. Navigation uses hashes (`/#shop`, `/#account`), so no catch-all rewrite is needed.

A white page can occur when the deployed HTML requests `/ShoeShop/static/...` assets that do not exist at that location, or when the unbuilt `public/index.html` is served. Check that the deployment serves `build/index.html` and that its JavaScript and CSS requests succeed.
