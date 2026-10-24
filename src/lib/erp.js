/* Pure back-office maths for the seller Studio: sales and margin analytics,
   demand forecasting, reorder planning, fulfillment SLAs and CSV export.
   No React, no clock: every function takes `now` so results are testable. */
import { overdueHours, ownerKey, STAGES, SLA_HOURS } from "../data/shipping";

const HOUR = 3600000;
const DAY = 86400000;
const MANILA = 8 * HOUR;

/* ---- Manila calendar days --------------------------------------------------- */
export const dayKey = (date) => new Date(+new Date(date) + MANILA).toISOString().slice(0, 10);
export const dayStart = (date) => Date.parse(`${dayKey(date)}T00:00:00+08:00`);
const keysFrom = (start, count) => Array.from({ length: count }, (_, i) => dayKey(start + i * DAY));

export const unitsOf = (p) => Object.values(p.stockBySize || {}).reduce((s, q) => s + q, 0);
const costOf = (item, productById) => item.cost ?? productById?.get(item.id)?.cost ?? 0;
const sum = (list, fn = (x) => x) => list.reduce((total, x) => total + fn(x), 0);
const mean = (list) => (list.length ? sum(list) / list.length : 0);
const stddev = (list) => {
  if (list.length < 2) return 0;
  const m = mean(list);
  return Math.sqrt(sum(list, (x) => (x - m) ** 2) / (list.length - 1));
};

/* One pass over the ledger: per product daily units and units by size. */
export function indexOrders(orders) {
  const byProduct = new Map();
  orders.forEach((order) => {
    const day = dayKey(order.date);
    order.items.forEach((item) => {
      const entry = byProduct.get(item.id) || { days: new Map(), sizes: new Map(), lastSizes: [] };
      entry.days.set(day, (entry.days.get(day) || 0) + item.quantity);
      entry.sizes.set(item.size, (entry.sizes.get(item.size) || 0) + item.quantity);
      entry.lastSizes.push({ day, size: item.size, quantity: item.quantity });
      byProduct.set(item.id, entry);
    });
  });
  return byProduct;
}

/* ---- Sales analytics ----------------------------------------------------------- */
export function salesRows(orders, ownerId) {
  return orders.flatMap((order) =>
    order.items
      .filter((item) => (item.ownerId || null) === (ownerId || null))
      .map((item) => ({ ...item, orderId: order.id, date: order.date })),
  );
}

export function salesAnalytics(orders, products, ownerId, days = 30, now = new Date()) {
  const end = dayStart(now) + DAY;
  const start = end - days * DAY;
  const owned = products.filter((p) => (p.ownerId || null) === (ownerId || null));
  const productById = new Map(products.map((p) => [p.id, p]));
  const rows = salesRows(orders, ownerId);
  const inRange = (row, from, to) => +new Date(row.date) >= from && +new Date(row.date) < to;
  const selected = rows.filter((row) => inRange(row, start, end));
  const previous = rows.filter((row) => inRange(row, start - days * DAY, start));
  const money = (row) => row.price * row.quantity;
  const profit = (row) => (row.price - costOf(row, productById)) * row.quantity;
  const revenue = sum(selected, money);
  const gross = sum(selected, profit);
  const orderIds = new Set(selected.map((row) => row.orderId));
  const units = sum(selected, (row) => row.quantity);

  const trend = keysFrom(start, days).map((day) => ({ day, revenue: 0, units: 0, profit: 0 }));
  const byDay = new Map(trend.map((point) => [point.day, point]));
  const ranked = new Map();
  const sizes = new Map();
  const brands = new Map();
  selected.forEach((row) => {
    const point = byDay.get(dayKey(row.date));
    point.revenue += money(row);
    point.units += row.quantity;
    point.profit += profit(row);
    const product = ranked.get(row.id) || {
      id: row.id, name: row.name, image: row.image, brand: row.brand, units: 0, revenue: 0, profit: 0,
    };
    product.units += row.quantity;
    product.revenue += money(row);
    product.profit += profit(row);
    ranked.set(row.id, product);
    sizes.set(row.size, (sizes.get(row.size) || 0) + row.quantity);
    const brand = brands.get(row.brand || "Other") || { brand: row.brand || "Other", revenue: 0, units: 0, profit: 0 };
    brand.revenue += money(row);
    brand.units += row.quantity;
    brand.profit += profit(row);
    brands.set(brand.brand, brand);
  });
  const topProducts = [...ranked.values()]
    .map((p) => ({ ...p, margin: p.revenue ? p.profit / p.revenue : 0 }))
    .sort((a, b) => b.revenue - a.revenue);

  const onHand = sum(owned, unitsOf);
  return {
    days,
    revenue,
    cogs: revenue - gross,
    profit: gross,
    margin: revenue ? gross / revenue : 0,
    orders: orderIds.size,
    units,
    average: orderIds.size ? revenue / orderIds.size : 0,
    previousRevenue: sum(previous, money),
    previousProfit: sum(previous, profit),
    delta: sum(previous, money) ? (revenue - sum(previous, money)) / sum(previous, money) : null,
    trend,
    topProducts,
    onHand,
    sellThrough: units + onHand ? units / (units + onHand) : 0,
    stockValueCost: sum(owned, (p) => unitsOf(p) * (p.cost || 0)),
    stockValueRetail: sum(owned, (p) => unitsOf(p) * p.price),
    sizeCurve: [...sizes.entries()]
      .map(([size, count]) => ({ size, units: count }))
      .sort((a, b) => parseFloat(a.size) - parseFloat(b.size)),
    brandMix: [...brands.values()].sort((a, b) => b.revenue - a.revenue),
    abc: abcAnalysis(owned, ranked),
    inventory: owned,
  };
}

/* Pareto classes on revenue in the window: A = first 80%, B = next 15%, C = the rest. */
export function abcAnalysis(owned, ranked) {
  const list = owned
    .map((p) => ({ id: p.id, name: p.name, brand: p.brand, revenue: ranked.get(p.id)?.revenue || 0, onHand: unitsOf(p), cost: p.cost || 0 }))
    .sort((a, b) => b.revenue - a.revenue);
  const total = sum(list, (x) => x.revenue);
  let running = 0;
  return list.map((row) => {
    const before = total ? running / total : 1;
    running += row.revenue;
    const klass = row.revenue === 0 ? "C" : before < 0.8 ? "A" : before < 0.95 ? "B" : "C";
    return { ...row, share: total ? row.revenue / total : 0, cumulative: total ? running / total : 1, class: klass };
  });
}

/* ---- Demand forecast ------------------------------------------------------------ */
/* Method (kept deliberately simple so a seller can reason about it):
   1. Daily units for the last 28 complete days (Manila time).
   2. Weighted moving average: week 1..4 (oldest..newest) weigh 1,2,3,4.
   3. Linear-trend nudge: regression slope * 3.5 days (damped by half of a week).
   4. Community uplift: watchers / 2000, capped at +20%. Saved pairs signal intent;
      this is an assumption, not a measured conversion rate.
   Safety stock = 1.28 (90% service) * std-dev of daily demand * sqrt(lead time). */
export const WATCHER_DIVISOR = 2000;
export const WATCHER_CAP = 0.2;
export const SERVICE_Z = 1.28;

export const STATUS_RANK = {
  "Out of stock": 0, "Reorder now": 1, "Reorder soon": 2, "On order": 3,
  Healthy: 4, "Slow mover": 5, Overstock: 6,
};

export function demandForecast(orders, product, now = new Date(), opts = {}) {
  const horizon = opts.horizonDays ?? 30;
  const index = opts.index || indexOrders(orders);
  const openPO = opts.openPOUnits || 0;
  const end = dayStart(now);
  const keys = keysFrom(end - 28 * DAY, 28);
  const sold = index.get(product.id)?.days;
  const history = keys.map((day) => ({ day, units: sold?.get(day) || 0 }));
  const values = history.map((h) => h.units);
  const weights = values.map((_, i) => 1 + Math.floor(i / 7));
  const wma = sum(values.map((v, i) => v * weights[i])) / sum(weights);
  const xs = values.map((_, i) => i);
  const mx = mean(xs);
  const my = mean(values);
  const slope = sum(xs, (x) => (x - mx) ** 2)
    ? sum(xs.map((x, i) => (x - mx) * (values[i] - my))) / sum(xs, (x) => (x - mx) ** 2)
    : 0;
  const base = Math.max(0, wma + slope * 3.5);
  const uplift = Math.min(WATCHER_CAP, (product.watchers || 0) / WATCHER_DIVISOR);
  const velocity = base * (1 + uplift);
  const sd = stddev(values);
  const leadDays = product.leadDays || 14;
  const safety = Math.ceil(SERVICE_Z * sd * Math.sqrt(leadDays));
  const onHand = unitsOf(product);
  const units28 = sum(values);
  const cover = velocity > 0 ? onHand / velocity : Infinity;
  const reorderPoint = Math.ceil(velocity * leadDays + safety);
  const suggestedQty = Math.max(0, Math.ceil(velocity * (leadDays + horizon) + safety - onHand - openPO));
  const stockoutDate = onHand === 0 ? new Date(now).toISOString()
    : Number.isFinite(cover) ? new Date(+new Date(now) + cover * DAY).toISOString() : null;

  const wantsReorder = onHand <= reorderPoint && cover <= leadDays + 7;
  let status;
  if (onHand === 0) status = "Out of stock";
  else if (units28 <= 2) status = "Slow mover";
  else if (cover > 90) status = "Overstock";
  else if (wantsReorder && cover <= leadDays) status = "Reorder now";
  else if (wantsReorder || cover <= leadDays + 14) status = "Reorder soon";
  else status = "Healthy";
  if ((status === "Reorder now" || status === "Reorder soon") && openPO > 0 && suggestedQty === 0) status = "On order";

  return {
    id: product.id,
    velocity,
    baseVelocity: base,
    uplift,
    sd,
    units28,
    onHand,
    openPO,
    daysOfCover: cover,
    leadDays,
    safetyStock: safety,
    reorderPoint,
    forecastUnits: Math.round(velocity * horizon),
    suggestedQty,
    stockoutDate,
    status,
    history,
    band: { low: Math.max(0, velocity - SERVICE_Z * sd), high: velocity + SERVICE_Z * sd },
    why: `${product.watchers || 0} buyers saved this pair, a +${(uplift * 100).toFixed(0)}% demand uplift on a base of ${base.toFixed(2)} pairs/day.`,
  };
}

export function openPOUnits(purchaseOrders, productId) {
  return sum(purchaseOrders.filter((po) => po.productId === productId && po.status === "Ordered"), (po) => po.qty);
}

/* Forecast every owned product, most urgent first. */
export function forecastAll(orders, products, purchaseOrders, ownerId, now = new Date()) {
  const index = indexOrders(orders);
  return products
    .filter((p) => (p.ownerId || null) === (ownerId || null))
    .map((product) => ({
      product,
      ...demandForecast(orders, product, now, { index, openPOUnits: openPOUnits(purchaseOrders, product.id) }),
    }))
    .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.daysOfCover - b.daysOfCover);
}

/* Store-level revenue forecast (today onward): level + damped trend, weekday seasonality
   shrunk halfway to flat, and a 90% band from the daily spread. */
export function revenueForecast(orders, ownerId, now = new Date(), horizon = 30) {
  const end = dayStart(now);
  const keys = keysFrom(end - 28 * DAY, 28);
  const daily = new Map(keys.map((k) => [k, 0]));
  salesRows(orders, ownerId).forEach((row) => {
    const k = dayKey(row.date);
    if (daily.has(k)) daily.set(k, daily.get(k) + row.price * row.quantity);
  });
  const values = keys.map((k) => daily.get(k));
  const weights = values.map((_, i) => 1 + Math.floor(i / 7));
  const wma = sum(values.map((v, i) => v * weights[i])) / sum(weights);
  const xs = values.map((_, i) => i);
  const mx = mean(xs);
  const my = mean(values);
  const sxx = sum(xs, (x) => (x - mx) ** 2);
  const slope = sxx ? sum(xs.map((x, i) => (x - mx) * (values[i] - my))) / sxx : 0;
  const level = Math.max(0, wma + slope * 3.5);
  const overall = mean(values) || 1;
  const season = Array.from({ length: 7 }, () => []);
  keys.forEach((k, i) => season[new Date(`${k}T12:00:00Z`).getUTCDay()].push(values[i]));
  const factor = season.map((list) => (list.length ? 1 + (mean(list) / overall - 1) * 0.5 : 1));
  const sd = stddev(values);
  return Array.from({ length: horizon }, (_, i) => {
    const day = dayKey(end + i * DAY);
    const f = level * factor[new Date(`${day}T12:00:00Z`).getUTCDay()];
    return { day, revenue: f, low: Math.max(0, f - SERVICE_Z * sd), high: f + SERVICE_Z * sd };
  });
}

/* Split a purchase quantity across sizes by the recent sales mix
   (largest remainder, so the parts always sum to qty). */
export function suggestSizeSplit(orders, product, qty, now = new Date(), index) {
  const sold = (index || indexOrders(orders)).get(product.id);
  const cutoff = dayKey(+new Date(now) - 90 * DAY);
  const mix = new Map();
  sold?.lastSizes.forEach(({ day, size, quantity }) => {
    if (day >= cutoff) mix.set(size, (mix.get(size) || 0) + quantity);
  });
  if (!mix.size) Object.keys(product.stockBySize || {}).forEach((size) => mix.set(size, 1));
  const total = sum([...mix.values()]);
  if (!total || qty <= 0) return {};
  const parts = [...mix.entries()].map(([size, weight]) => {
    const exact = (qty * weight) / total;
    return { size, whole: Math.floor(exact), rest: exact - Math.floor(exact), weight };
  });
  let left = qty - sum(parts, (p) => p.whole);
  [...parts].sort((a, b) => b.rest - a.rest || b.weight - a.weight).slice(0, left).forEach((p) => { p.whole += 1; left -= 1; });
  return Object.fromEntries(
    parts.filter((p) => p.whole > 0).sort((a, b) => parseFloat(a.size) - parseFloat(b.size)).map((p) => [p.size, p.whole]),
  );
}

/* ---- Purchasing ------------------------------------------------------------------ */
export const poState = (po, now = new Date()) =>
  po.status === "Ordered" && +new Date(po.eta) < +new Date(now) ? "Delayed" : po.status;
export const poDaysLate = (po, now = new Date()) =>
  Math.max(0, Math.ceil((+new Date(now) - +new Date(po.eta)) / DAY));

export function nextPOId(purchaseOrders) {
  const top = Math.max(2060, ...purchaseOrders.map((po) => Number(String(po.id).replace(/\D/g, "")) || 0));
  return `PO-${top + 1}`;
}

export function supplierSummary(purchaseOrders, ownerId, now = new Date()) {
  const mine = purchaseOrders.filter((po) => po.ownerId === ownerId);
  const groups = new Map();
  mine.forEach((po) => {
    const g = groups.get(po.supplier) || { supplier: po.supplier, orders: 0, open: 0, delayed: 0, spend: 0, leads: [] };
    g.orders += 1;
    if (po.status === "Ordered") g.open += 1;
    if (poState(po, now) === "Delayed") g.delayed += 1;
    if (po.status !== "Cancelled") g.spend += po.qty * po.unitCost;
    if (po.receivedAt) g.leads.push((+new Date(po.receivedAt) - +new Date(po.createdAt)) / DAY);
    groups.set(po.supplier, g);
  });
  return [...groups.values()].map((g) => ({ ...g, avgLeadDays: g.leads.length ? mean(g.leads) : null }));
}

/* ---- Fulfillment ----------------------------------------------------------------- */
export function fulfillmentStats(orders, ownerId, now = new Date()) {
  const key = ownerKey(ownerId);
  const list = orders
    .filter((order) => order.shipments?.[key])
    .map((order) => ({ order, shipment: order.shipments[key] }));
  const counts = Object.fromEntries(STAGES.map((s) => [s, 0]));
  const late = [];
  const shipHours = [];
  let delivered = 0;
  let onTime = 0;
  let oldest = null;
  list.forEach(({ order, shipment }) => {
    counts[shipment.status] += 1;
    const placed = +new Date(order.date);
    if (shipment.status !== "Delivered") {
      const hours = overdueHours(shipment, order.date, now);
      if (hours > 0) late.push({ orderId: order.id, recipient: order.recipient, status: shipment.status, hours });
    } else {
      delivered += 1;
      const at = shipment.events.find((e) => e.status === "Delivered")?.at;
      if (at && +new Date(at) <= placed + SLA_HOURS.Delivered * HOUR) onTime += 1;
    }
    const shippedAt = shipment.events.find((e) => e.status === "Shipped")?.at;
    if (shippedAt) shipHours.push((+new Date(shippedAt) - placed) / HOUR);
    if ((shipment.status === "Placed" || shipment.status === "Packed") && (!oldest || placed < +new Date(oldest.date))) {
      oldest = { orderId: order.id, date: order.date, hours: Math.round((+now - placed) / HOUR) };
    }
  });
  return {
    counts,
    total: list.length,
    active: list.length - counts.Delivered,
    late: late.sort((a, b) => b.hours - a.hours),
    avgHoursToShip: shipHours.length ? mean(shipHours) : null,
    onTimePct: delivered ? onTime / delivered : null,
    oldestUnshipped: oldest,
  };
}

/* ---- Stock ledger: stored movements plus sales derived from orders ------------------ */
export function stockLedger(movements, orders, products, ownerId, productId) {
  const mine = new Set(products.filter((p) => (p.ownerId || null) === (ownerId || null)).map((p) => p.id));
  const stored = movements.filter((m) => mine.has(m.productId));
  const sold = orders.flatMap((order) =>
    order.items
      .filter((item) => (item.ownerId || null) === (ownerId || null))
      .map((item) => ({
        id: `S-${order.id}-${item.id}-${item.size}`, productId: item.id, size: item.size, qty: -item.quantity,
        type: "Sale", ref: order.id, note: `Order to ${order.recipient || "customer"}`, at: order.date, by: "Checkout",
      })),
  );
  return [...stored, ...sold]
    .filter((m) => !productId || m.productId === productId)
    .sort((a, b) => +new Date(b.at) - +new Date(a.at));
}

/* ---- Action centre: what to do next, from the data ----------------------------------- */
export function actionCentre({ products, orders, purchaseOrders, ownerId, now = new Date() }) {
  const forecasts = forecastAll(orders, products, purchaseOrders, ownerId, now);
  const actions = [];
  const urgent = forecasts.filter((f) => f.status === "Reorder now" || f.status === "Out of stock");
  const soon = forecasts.filter((f) => f.status === "Reorder soon");
  if (urgent.length) actions.push({ id: "reorder-now", tone: "critical", title: `${urgent.length} ${urgent.length === 1 ? "pair needs" : "pairs need"} reordering now`, detail: urgent.slice(0, 2).map((f) => f.product.name).join(", ") + (urgent.length > 2 ? ` and ${urgent.length - 2} more` : ""), tab: "forecast", cta: "Review reorders" });
  if (soon.length) actions.push({ id: "reorder-soon", tone: "warning", title: `${soon.length} ${soon.length === 1 ? "pair is" : "pairs are"} running down`, detail: "Order within the supplier lead time to avoid a stockout.", tab: "forecast", cta: "See forecast" });
  const fulfil = fulfillmentStats(orders, ownerId, now);
  if (fulfil.late.length) actions.push({ id: "late", tone: "critical", title: `${fulfil.late.length} ${fulfil.late.length === 1 ? "shipment is" : "shipments are"} late`, detail: `Longest wait: ${fulfil.late[0].hours}h past target on ${fulfil.late[0].orderId}.`, tab: "orders", filter: "late", cta: "Open late orders" });
  const delayed = purchaseOrders.filter((po) => po.ownerId === ownerId && poState(po, now) === "Delayed");
  if (delayed.length) actions.push({ id: "po-delayed", tone: "warning", title: `${delayed.length} purchase ${delayed.length === 1 ? "order is" : "orders are"} past ETA`, detail: `${delayed[0].id} from ${delayed[0].supplier} is ${poDaysLate(delayed[0], now)} days late.`, tab: "purchasing", cta: "Chase supplier" });
  const waiting = forecasts
    .filter((f) => f.onHand <= 2 && (f.product.watchers || 0) >= 50)
    .sort((a, b) => b.product.watchers - a.product.watchers)[0];
  if (waiting) actions.push({ id: "watchers", tone: "info", title: `${waiting.product.watchers} buyers saved ${waiting.product.name}`, detail: waiting.onHand === 0 ? "It is sold out. Restock to capture waiting demand." : `Only ${waiting.onHand} left.`, tab: "forecast", cta: "Plan restock" });
  const dead = forecasts.filter((f) => f.status === "Overstock" || f.status === "Slow mover");
  if (dead.length) {
    const tied = sum(dead, (f) => f.onHand * (f.product.cost || 0));
    actions.push({ id: "dead", tone: "info", title: `${dead.length} slow ${dead.length === 1 ? "SKU ties" : "SKUs tie"} up capital`, detail: `${tied.toLocaleString("en-PH")} PHP at cost. Consider a markdown.`, tab: "reports", cta: "See dead stock" });
  }
  return actions;
}

/* ---- CSV ---------------------------------------------------------------------------- */
const cell = (value) => {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text) && Number.isNaN(Number(text))) text = `'${text}`; // spreadsheet formula guard
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
export function toCSV(rows, columns) {
  return [columns.map(([, header]) => cell(header)).join(","), ...rows.map((row) => columns.map(([key]) => cell(typeof key === "function" ? key(row) : row[key])).join(","))].join("\r\n");
}
export const inventoryCSV = (products, forecasts = []) => {
  const byId = new Map(forecasts.map((f) => [f.id, f]));
  return toCSV(products, [
    ["sku", "SKU"], ["name", "Product"], ["brand", "Brand"], ["bin", "Bin"],
    [(p) => unitsOf(p), "On hand"], ["reorderPoint", "Reorder point"], ["cost", "Cost (PHP)"], ["price", "Price (PHP)"],
    [(p) => unitsOf(p) * (p.cost || 0), "Stock value at cost"],
    [(p) => (byId.get(p.id)?.status) || "", "Status"],
    [(p) => Object.entries(p.stockBySize || {}).map(([s, q]) => `${s}:${q}`).join(" "), "Sizes"],
  ]);
};
export const salesCSV = (trend) =>
  toCSV(trend, [["day", "Date"], ["units", "Pairs"], ["revenue", "Gross sales (PHP)"], [(r) => Math.round(r.profit), "Gross profit (PHP)"]]);
export const forecastCSV = (forecasts) =>
  toCSV(forecasts, [
    [(f) => f.product.sku, "SKU"], [(f) => f.product.name, "Product"], [(f) => f.velocity.toFixed(2), "Pairs per day"],
    ["forecastUnits", "30-day forecast"], ["onHand", "On hand"],
    [(f) => (Number.isFinite(f.daysOfCover) ? f.daysOfCover.toFixed(1) : ""), "Days of cover"],
    ["reorderPoint", "Reorder point"], ["suggestedQty", "Suggested order"], ["status", "Status"],
  ]);
