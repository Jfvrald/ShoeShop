import { salePercent } from "../../store";

export const DEFAULT_FILTERS = {
  q: "",
  category: "All",
  genders: [],
  sale: false,
  brands: [],
  models: [],
  sizes: [],
  colors: [],
  condition: "All",
  soldBy: "All",
  maxPrice: null,
  saved: false,
  sort: "featured",
};

const some = (list, value) => !list.length || list.includes(value);

/* `except` leaves one facet out so its own counts show what a click would add. */
export function matches(p, f, wishlist = [], except = null) {
  if (except !== "q" && f.q) {
    const hay = `${p.name} ${p.brand} ${p.model} ${p.seller} ${p.color} ${p.sku}`.toLowerCase();
    if (!f.q.toLowerCase().split(/\s+/).every((word) => hay.includes(word))) return false;
  }
  if (except !== "category" && f.category !== "All" && p.category !== f.category) return false;
  if (except !== "genders" && f.genders.length && !f.genders.includes(p.gender) && p.gender !== "Unisex") return false;
  if (except !== "sale" && f.sale && !salePercent(p)) return false;
  if (except !== "brands" && !some(f.brands, p.brand)) return false;
  if (except !== "models" && !some(f.models, p.model)) return false;
  if (except !== "colors" && !some(f.colors, p.color)) return false;
  if (except !== "sizes" && f.sizes.length && !f.sizes.some((s) => (p.stockBySize?.[s] || 0) > 0)) return false;
  if (except !== "condition" && f.condition !== "All" && p.condition !== f.condition) return false;
  if (except !== "soldBy" && f.soldBy !== "All" && p.sellerRole !== f.soldBy) return false;
  if (except !== "maxPrice" && f.maxPrice && p.price > f.maxPrice) return false;
  if (except !== "saved" && f.saved && !wishlist.includes(p.id)) return false;
  return true;
}

const SORTS = {
  featured: (a, b) => b.watchers - a.watchers,
  low: (a, b) => a.price - b.price,
  high: (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
  sale: (a, b) => salePercent(b) - salePercent(a),
};

export function filterProducts(products, f, wishlist = []) {
  return products.filter((p) => matches(p, f, wishlist)).sort(SORTS[f.sort] || SORTS.featured);
}

/* Counts for one facet, applying every other active filter. */
export function facet(products, f, key, pick, wishlist = []) {
  const counts = new Map();
  products.forEach((p) => {
    if (!matches(p, f, wishlist, key)) return;
    [].concat(pick(p)).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  });
  return counts;
}

/* Pairs on hand per size across products that pass every other filter. */
export function sizeUnits(products, f, wishlist = []) {
  const units = new Map();
  products.forEach((p) => {
    if (!matches(p, f, wishlist, "sizes")) return;
    Object.entries(p.stockBySize || {}).forEach(([size, qty]) => {
      if (qty > 0) units.set(size, (units.get(size) || 0) + qty);
    });
  });
  return units;
}

export function activeChips(f) {
  const chips = [];
  if (f.q) chips.push({ key: "q", label: `“${f.q}”` });
  if (f.category !== "All") chips.push({ key: "category", label: f.category });
  f.genders.forEach((value) => chips.push({ key: "genders", value, label: value }));
  if (f.sale) chips.push({ key: "sale", label: "On sale" });
  f.brands.forEach((value) => chips.push({ key: "brands", value, label: value }));
  f.models.forEach((value) => chips.push({ key: "models", value, label: value }));
  f.sizes.forEach((value) => chips.push({ key: "sizes", value, label: `US ${value}` }));
  f.colors.forEach((value) => chips.push({ key: "colors", value, label: value }));
  if (f.condition !== "All") chips.push({ key: "condition", label: f.condition });
  if (f.soldBy !== "All") chips.push({ key: "soldBy", label: f.soldBy === "Seller" ? "Stores" : "Resellers" });
  if (f.maxPrice) chips.push({ key: "maxPrice", label: `Under ₱${f.maxPrice.toLocaleString("en-PH")}` });
  if (f.saved) chips.push({ key: "saved", label: "Saved" });
  return chips;
}

export function removeChip(f, chip) {
  const base = DEFAULT_FILTERS[chip.key];
  if (Array.isArray(base)) return { ...f, [chip.key]: f[chip.key].filter((v) => v !== chip.value) };
  return { ...f, [chip.key]: base };
}

export const toggleIn = (list, value) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
