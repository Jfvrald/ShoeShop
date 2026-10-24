# Sole Rise — design guide

Version 1.0 · 24 October 2026 · Responsive local prototype

## Intent

Sole Rise is an independent sneaker marketplace for buyers, sellers, and resellers. The experience combines an editorial landing page with practical shopping and store-management tools. Its voice is confident, welcoming, and rooted in sneaker culture.

The supplied screenshots are visual references, not executable requirements or recovered source files. This rebuild retains the Sole Rise identity, dark community sections, shoe-led presentation, filtered catalog, cart drawer, and mobile size selection. It replaces placeholder copy and unrelated merchandise with a coherent sneaker-only concept. It does not claim to recover the lost original design file.

Open `public/design-guide.html` through the development server for the visual companion to this guide.

## Design principles

1. Let the shoes lead. Large isolated product images and restrained backgrounds keep the merchandise recognizable.
2. Make commerce clear. Show PHP prices, condition, available sizes, seller, and stock before adding a pair.
3. Give every role a way in. Shopping remains available without a profile; the seller studio and community introduce the role model.
4. Use motion for depth. Scroll movement adds a subtle layer to the hero without delaying controls or reading.
5. Build trust through precise copy. Demo content is identified. Do not invent verification badges, ratings, sales totals, or customer testimonials.

## Foundation tokens

| Token     | Value     | Application                                             |
| --------- | --------- | ------------------------------------------------------- |
| Ink       | `#171714` | Primary text and dark buttons                           |
| Night     | `#111110` | Hero, navigation, footer                                |
| Paper     | `#F6F5F0` | Shopping surfaces and dialogs                           |
| Vermilion | `#F24B39` | Brand highlight, campaign strip, closing call to action |
| Muted     | `#707068` | Secondary text on light surfaces                        |
| Line      | `#DCDCD3` | Dividers and outlines                                   |
| Sand      | `#E9E5DC` | Product backdrop                                        |
| Rose      | `#EEDFDC` | Product backdrop                                        |
| Sage      | `#DFE3D9` | Pre-loved product backdrop                              |
| Gray      | `#E4E5E2` | Product backdrop                                        |

Use ink on the accent surface. The accent is decorative or a focus indicator; avoid small accent-colored text on white. Status labels must include words, not just a color.

### Typography

- Display: `Impact`, falling back to `Arial Narrow` and sans-serif. Uppercase headlines with compact line height (0.98–1.07). Desktop hero approximately 7.3vw, capped at 112px. Mobile hero 57–86px.
- Body/UI: system Arial / Helvetica / sans-serif, generally 13–16px. The interface loads no external fonts.
- Eyebrows: 8–10px uppercase, 1.7–2px tracking. Only nonessential editorial metadata uses this small scale.
- Section titles: 32–49px. Product names: 12–14px on cards, 25–26px in detail.
- Keep readable copy in sentence case. Do not use condensed display type for instructions, form entries, or prices.

### Spacing and shape

Use a 4px base rhythm: 8, 12, 16, 20, 24, 32, 48, 64, 90. Desktop sections use 5% side gutters and 65–90px vertical padding. Mobile uses 20px gutters and 55px vertical padding. Large desktop content is constrained to approximately 1500px. Corners are mostly 3–6px; pills and icon buttons use a fully rounded shape. Avoid heavy shadows outside the hero shoe, dialogs, and feedback messages.

## Page composition

### Discover

1. Brand/navigation and shopping bag count.
2. Editorial hero: marketplace identity, two primary pathways, recognizable shoe, direct product entry.
3. Brand strip: collectors, everyday movers, next generation, culture.
4. Featured collection: category chips, product cards, saved-pair controls.
5. Marketplace explanation: buy, sell, resell.
6. Community: visual story plus three interest circles.
7. Join call to action and utility footer.

### Shop

An introductory heading leads to search, condition, sort, category, and saved-pair filters. The results grid includes empty and sold-out states. Selecting a card opens a size-selection dialog. The prototype reuses two supplied product assets across explicitly labeled new/pre-loved listings; this is sample inventory, not four different shoe models.

### Product and cart

The product dialog shows condition, seller, price, available US sizes, stock, delivery information, and save/add actions. Add-to-bag stays disabled until a size is selected. A product-plus icon opens selection; it never silently assigns a size. The bag groups by product plus size, supports quantity changes and removal, and shows delivery and totals before checkout.

### Seller studio

A local profile chooses Buyer, Seller, or Reseller. Seller and Reseller share inventory controls; reseller listings default to Pre-loved. Summary cards report actual local listings, stock, and demo purchases. Empty states explain the next action instead of showing invented metrics. Owned listings can be removed or restocked. Listing images are chosen from the two supplied product assets.

### Community

Three sample circles demonstrate membership states. Joining needs a demo profile. Editorial copy is a sample story, not a live feed. Community publishing, messaging, events, and moderation are future work.

## Component states

| Component    | Required states                                        |
| ------------ | ------------------------------------------------------ |
| Navigation   | Current section, mobile open/closed, keyboard focus    |
| Product card | Saved/unsaved, new/pre-loved, sold out                 |
| Filters      | Selected, no matches, reset                            |
| Size button  | Available, selected; unavailable sizes are not offered |
| Add to bag   | No size selected, enabled, stock exhausted             |
| Cart         | Empty, populated, stock ceiling, removal               |
| Form         | Required fields, invalid native input, submitted       |
| Circle       | Join, profile required, joined/leave                   |
| Listing      | Empty inventory, published, restocked, removed         |
| Order        | Demo confirmed, saved locally                          |

## Responsive behavior

| Width           | Layout                                                                                                                            |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Above 1100px    | Four product columns, horizontal navigation, split hero/community, three marketplace pathways                                     |
| 761–1100px      | Four product columns with tighter gaps; reduced navigation spacing; simplified footer                                             |
| 361–760px       | Mobile menu, stacked hero/artwork, two product columns, stacked community/pathways, single-column product dialog, full-width cart |
| 360px and below | Compact hero actions, vertically stacked role options and studio stats                                                            |

The hero art must never cover primary buttons. Product images use containment; editorial imagery uses cover. Use a two-column form only where both controls remain comfortable. Dialogs scroll within the viewport using dynamic viewport height.

## Motion and accessibility

- Hero movement is driven by passive scroll events and one scheduled animation frame, bounded to 136px. Decorative lettering moves at a different rate.
- Hover zoom is limited to product/editorial images; no auto-playing carousel or scrolling text is required.
- `prefers-reduced-motion: reduce` disables parallax, smooth scrolling, and transitions.
- Semantic headings, labeled fields, named icon buttons, a skip link, pressed states, and visible focus rings are implemented.
- Native modal dialogs provide browser focus containment and Escape dismissal; focus returns to the previous control.
- Success and validation feedback include text. Checkout makes its demo status explicit.
- Screen-reader, real touch-target, zoom, color-contrast, and visual viewport checks should be completed in a connected browser before release. This is not a claim of a completed accessibility audit.

## Content and imagery

Product assets: `public/images/jordan1.png`, `public/images/shoe_image.png`, retained from the original repository. Community image: `public/images/sneaker-culture.jpg`, downloaded from `https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1000&q=85&fit=crop`. Confirm production image rights and brand usage before a public commercial launch; no brand affiliation is asserted by this independent concept.

The UI uses English with PHP prices, reflecting the Philippine context. A Filipino language option can be added without changing the page hierarchy. Currency is formatted with `Intl.NumberFormat('en-PH')`.

## Handoff checklist

- Replace sample products and store names with real, approved inventory.
- Confirm size system and gender/fit conversions with inventory owners.
- Keep condition and seller details visible on cards and detail views.
- Maintain motion alternatives and keyboard interaction when replacing native dialogs.
- Preserve the clear distinction between sample flows and live commerce.
- Validate the layout at 320, 390, 768, 1024, and 1440px and with 200% zoom.
