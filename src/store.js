import { useEffect, useState } from "react";
import { CATALOG, BRANDS, CATEGORIES, GENDERS, COLORS, SIZE_RUN } from "./data/catalog";
import { buildDemoHistory } from "./data/demo";

export { BRANDS, CATEGORIES, GENDERS, COLORS, SIZE_RUN };
export { STAGES, ownerKey } from "./data/shipping";

export const asset = (name) => `${process.env.PUBLIC_URL}/images/${name}`;
export const money = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);

export const ROLES = {
  Buyer: {
    title: "Buyer",
    blurb: "Shop new and pre-loved pairs, save favorites, track every delivery.",
    perks: ["Shop every listing", "Fit reports from real buyers", "Live delivery timeline"],
  },
  Seller: {
    title: "Seller",
    blurb: "Run a multi-brand storefront with inventory, forecasting and fulfillment built in.",
    perks: ["Inventory by size and SKU", "Demand forecast and reorder alerts", "Orders, shipping and purchasing"],
  },
  Reseller: {
    title: "Reseller",
    blurb: "Give pairs a second life: pre-loved or deadstock, with the same studio tools.",
    perks: ["Pre-loved and deadstock listings", "Margin and sell-through reports", "Relist pairs you bought"],
  },
};
export const canSell = (user) =>
  !!user && (user.role === "Seller" || user.role === "Reseller");

/* ---- Inventory helpers: stock lives per US size ---------------------------- */
const bySize = (a, b) => parseFloat(a) - parseFloat(b);
export const stockOf = (p) =>
  Object.values(p.stockBySize || {}).reduce((sum, qty) => sum + qty, 0);
export const sizesOf = (p) =>
  Object.entries(p.stockBySize || {})
    .filter(([, qty]) => qty > 0)
    .map(([size]) => size)
    .sort(bySize);
export const allSizesOf = (p) => Object.keys(p.stockBySize || {}).sort(bySize);
export const salePercent = (p) =>
  p.compareAt && p.compareAt > p.price
    ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100)
    : 0;
export const marginOf = (p) => (p.price ? (p.price - (p.cost || 0)) / p.price : 0);

export const initialProducts = CATALOG;

/* A product with every pair gone still keeps its size keys, so a restock
   lands in a known grid. */
export function adjustStock(product, size, delta) {
  const current = product.stockBySize?.[size] || 0;
  return {
    ...product,
    stockBySize: { ...product.stockBySize, [size]: Math.max(0, current + delta) },
  };
}

export function useSaved(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      return saved === null ? fallback : saved;
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* The demo stays usable in memory when storage is unavailable. */
    }
  }, [key, value]);
  return [value, setValue];
}

/* ---- Cart ------------------------------------------------------------------ */
const unitsInCart = (cart, id, size) =>
  cart
    .filter((item) => item.id === id && (size === undefined || item.size === size))
    .reduce((sum, item) => sum + item.quantity, 0);

export function addCartItem(cart, product, size, qty = 1) {
  const available = product.stockBySize?.[size] || 0;
  const room = available - unitsInCart(cart, product.id, size);
  const add = Math.min(qty, room);
  if (add <= 0) return cart;
  const existing = cart.find((item) => item.id === product.id && item.size === size);
  if (existing) {
    return cart.map((item) =>
      item === existing ? { ...item, quantity: item.quantity + add } : item,
    );
  }
  const { id, sku, name, brand, image, price, compareAt, condition, seller, sellerRole, ownerId, cost } =
    product;
  return [
    ...cart,
    { id, sku, name, brand, image, price, compareAt, condition, seller, sellerRole, ownerId, cost, size, quantity: add },
  ];
}
export const cartUnits = unitsInCart;

/* Take sold pairs out of per-size stock. */
export function removeSoldStock(products, items) {
  return products.map((product) => {
    const sold = items.filter((item) => item.id === product.id);
    if (!sold.length) return product;
    return sold.reduce((next, item) => adjustStock(next, item.size, -item.quantity), product);
  });
}

/* Demo-grade accounts. Everything lives in this browser's localStorage, so the
   password hash only keeps casual eyes off the value. It is not real security. */
export const normalizeEmail = (value) => value.trim().toLowerCase();
export function makeSalt() {
  const bytes = new Uint8Array(16);
  (window.crypto || {}).getRandomValues?.(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
export async function hashPassword(password, salt) {
  const subtle = window.crypto?.subtle;
  if (subtle && typeof TextEncoder !== "undefined") {
    const enc = new TextEncoder();
    const key = await subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await subtle.deriveBits(
      { name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" },
      key,
      256,
    );
    return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  let h = 5381;
  const text = salt + password;
  for (let i = 0; i < text.length; i += 1) h = (h * 33) ^ text.charCodeAt(i);
  return "fallback-" + (h >>> 0).toString(16);
}
export const publicUser = (account) =>
  account && {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
  };

/* ---- Demo data -------------------------------------------------------------- */
export const DEMO_PASSWORD = "demo1234";
export const DEMO_ACCOUNTS = [
  { id: "acct-demo-buyer", name: "Mika Santos", email: "buyer@solerise.demo", role: "Buyer", circles: [0, 2] },
  { id: "acct-demo-seller", name: "Kicks Manila", email: "seller@solerise.demo", role: "Seller", circles: [] },
  { id: "acct-demo-reseller", name: "Second Chance Kicks", email: "reseller@solerise.demo", role: "Reseller", circles: [1] },
];

export async function buildDemoData(now = new Date()) {
  const accounts = [];
  for (const a of DEMO_ACCOUNTS) {
    const salt = makeSalt();
    accounts.push({
      ...a,
      salt,
      hash: await hashPassword(DEMO_PASSWORD, salt),
      createdAt: now.toISOString(),
    });
  }
  const history = buildDemoHistory(CATALOG, now);
  return {
    accounts,
    products: history.products,
    orders: history.orders,
    purchaseOrders: history.purchaseOrders,
    movements: history.movements,
    reviews: history.reviews,
    wishlist: ["aj1-high-royal", "af1-shadow-pastel"],
    notify: [],
  };
}
