/* Deterministic demo history: 90 days of orders for the whole marketplace, with
   weekend and payday peaks, rising and fading products, delayed shipments,
   purchase orders and fit reports. Same input date, same output. */
import { newShipments, shipmentAt, SLA_HOURS } from "./shipping";

const DAY = 86400000;
const HOUR = 3600000;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const CUSTOMERS = [
  ["cust-01", "Andrea Reyes"], ["cust-02", "Paolo Dizon"], ["cust-03", "Bea Villanueva"],
  ["cust-04", "Marco Aquino"], ["cust-05", "Jasmine Lim"], ["cust-06", "Rafa Mendoza"],
  ["cust-07", "Trisha Navarro"], ["cust-08", "Gabe Castillo"], ["cust-09", "Nina Soriano"],
  ["cust-10", "Dylan Tan"], ["cust-11", "Kaye Ramos"], ["cust-12", "Enzo Bautista"],
].map(([id, name]) => ({ id, name }));

// End-of-window demand multiplier: >1 is heating up, <1 is fading.
const TREND = {
  "af1-shadow-pastel": 2.6,
  "aj1-high-royal": 1.6,
  "aj1-flyknit-royal": 2.0,
  "vans-old-skool-burgundy": 1.5,
  "af1-white": 1.15,
  "adidas-deerupt-grey": 0.15,
  "nb-247-olive": 0.5,
  "air-max-90-sunset": 0.45,
  "puma-court-white": 0.6,
};

const poisson = (mean, rand) => {
  const limit = Math.exp(-mean);
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= rand();
  } while (p > limit);
  return k - 1;
};

function pick(weights, rand) {
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  let r = rand() * total;
  for (const [value, w] of weights) {
    r -= w;
    if (r <= 0) return value;
  }
  return weights[weights.length - 1][0];
}

const snapshot = (p, size, quantity) => ({
  id: p.id,
  sku: p.sku,
  name: p.name,
  brand: p.brand,
  image: p.image,
  size,
  quantity,
  price: p.price,
  cost: p.cost,
  condition: p.condition,
  ownerId: p.ownerId || null,
  seller: p.seller,
});

function stageForAge(hours, rand) {
  let stage = hours < 8 ? 0 : hours < 30 ? 1 : hours < 60 ? 2 : hours < 84 ? 3 : 4;
  let delay = 0;
  if (stage > 0 && stage < 4 && rand() < 0.2) {
    stage -= 1; // still waiting on the previous step: shows up as late
  } else if (stage > 0 && rand() < 0.1) {
    delay = 10;
  }
  return { stage, delay };
}

function fulfil(order, now, rand) {
  const age = (+now - +new Date(order.date)) / HOUR;
  const { stage, delay } = stageForAge(age, rand);
  const shipments = newShipments(order.items, order.date);
  Object.keys(shipments).forEach((key) => {
    shipments[key] = shipmentAt(shipments[key], order.id, order.date, stage, delay);
  });
  return { ...order, shipments };
}

const FIT_TEXT = {
  small: ["Runs half a size small. Went up and it feels right.", "Tight across the toe box. Size up.", "Snug on the first wear, it loosens after a week."],
  true: ["True to size, same as my other pairs.", "Fits exactly as expected. Comfortable out of the box.", "Perfect fit, ordered my usual size."],
  large: ["A little roomy. Half size down would be better.", "Runs big in the heel. Add an insole.", "Plenty of space up front, go down a size."],
};

export function buildDemoHistory(catalog, now = new Date()) {
  const rand = rng(20261024);
  const products = catalog.map((p) => ({ ...p, stockBySize: { ...p.stockBySize } }));
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const raw = [];

  for (let ago = 90; ago >= 1; ago -= 1) {
    const day = new Date(+now - ago * DAY);
    const ph = new Date(+day + 8 * HOUR); // Manila calendar day
    const weekday = ph.getUTCDay();
    const dom = ph.getUTCDate();
    const growth = 5 + ((90 - ago) / 90) * 3;
    const week = [1.15, 0.85, 0.9, 0.95, 1.05, 1.3, 1.35][weekday];
    const payday = dom === 15 || dom === 30 || dom === 31 || dom === 1 || dom === 14 ? 1.6 : 1;
    const orders = poisson(growth * week * payday, rand);
    for (let i = 0; i < orders; i += 1) {
      const hour = 9 + Math.floor(rand() * 13);
      const at = new Date(+day - (day.getUTCHours() - hour + 8) * HOUR + Math.floor(rand() * 3600000));
      const weights = products.map((p) => {
        const trend = TREND[p.id] ?? 1;
        const w = Math.pow(p.watchers, 0.9) * Math.max(0.05, 1 + (trend - 1) * ((90 - ago) / 90));
        return [p, w];
      });
      const lines = pick([[1, 70], [2, 25], [3, 5]], rand);
      const items = [];
      for (let l = 0; l < lines; l += 1) {
        const p = pick(weights, rand);
        const mu = p.gender === "Women" ? 7 : 9;
        const sizeWeights = Object.keys(p.stockBySize).map((s) => [
          s,
          Math.exp(-Math.pow(parseFloat(s) - mu, 2) / (2 * 1.7 * 1.7)) + 0.05,
        ]);
        const size = pick(sizeWeights, rand);
        const quantity = rand() < 0.9 ? 1 : 2;
        const existing = items.find((it) => it.id === p.id && it.size === size);
        if (existing) existing.quantity += quantity;
        else items.push(snapshot(p, size, quantity));
      }
      const customer = CUSTOMERS[Math.floor(rand() * CUSTOMERS.length)];
      raw.push({ at, customer, items });
    }
  }

  raw.sort((a, b) => +a.at - +b.at);
  const orders = raw.map(({ at, customer, items }, index) => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal >= 8000 ? 0 : 150;
    return fulfil(
      {
        id: "SR-" + (1000000 + index * 7 + 3),
        date: at.toISOString(),
        buyerId: customer.id,
        recipient: customer.name,
        items,
        shipping,
        total: subtotal + shipping,
      },
      now,
      rand,
    );
  });

  // Two orders that belong to the demo buyer, so Purchases and fit reports work.
  const mine = [
    ["SR-1040218", 2, [["aj1-mid-chicago", "9", 1]]],
    ["SR-1033771", 9, [["af1-white", "10", 1], ["vans-old-skool-burgundy", "8", 2]]],
  ];
  mine.forEach(([id, ago, lines]) => {
    const items = lines.map(([pid, size, qty]) => snapshot(byId[pid], size, qty));
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal >= 8000 ? 0 : 150;
    orders.push(
      fulfil(
        {
          id,
          date: new Date(+now - ago * DAY - 2 * HOUR).toISOString(),
          buyerId: "acct-demo-buyer",
          recipient: "Mika Santos",
          items,
          shipping,
          total: subtotal + shipping,
        },
        now,
        rng(ago),
      ),
    );
  });
  orders.sort((a, b) => +new Date(b.date) - +new Date(a.date));

  // Purchase orders for the demo store: one received, one running late, one on its way.
  const po = (id, productId, qty, ago, status, split) => {
    const p = byId[productId];
    const createdAt = new Date(+now - ago * DAY);
    const eta = new Date(+createdAt + p.leadDays * DAY);
    return {
      id,
      ownerId: "acct-demo-seller",
      productId,
      sku: p.sku,
      name: p.name,
      supplier: p.supplier,
      qty,
      unitCost: p.cost,
      sizeSplit: split,
      status,
      createdAt: createdAt.toISOString(),
      eta: eta.toISOString(),
      receivedAt: status === "Received" ? new Date(+eta - 2 * DAY).toISOString() : null,
    };
  };
  const purchaseOrders = [
    po("PO-2060", "air-max-90-hyper-pink", 8, 4, "Ordered", { 6: 3, 7: 3, 8: 2 }),
    po("PO-2056", "aj1-high-royal", 12, 17, "Ordered", { 9: 4, 10: 4, 11: 2, 9.5: 2 }),
    po("PO-2041", "af1-white", 24, 28, "Received", { 7: 4, 8: 6, 9: 6, 10: 5, 11: 3 }),
  ];

  const movements = [];
  let mv = 0;
  const record = (productId, size, qty, type, ref, note, at, by = "Kicks Manila") =>
    movements.push({ id: "MV-" + (900 + (mv += 1)), productId, size, qty, type, ref, note, at: new Date(at).toISOString(), by });
  const received = purchaseOrders[2];
  Object.entries(received.sizeSplit).forEach(([size, qty]) =>
    record(received.productId, size, qty, "PO receipt", received.id, `Received from ${received.supplier}`, received.receivedAt),
  );
  record("af1-black", "9", -1, "Adjustment", null, "Cycle count: one pair short", +now - 12 * DAY);
  record("vans-old-skool-burgundy", "7", -1, "Adjustment", null, "Damaged box, written off", +now - 6 * DAY);
  record("nb-574-peach", "6", 1, "Adjustment", null, "Customer return restocked", +now - 3 * DAY);
  movements.sort((a, b) => +new Date(b.at) - +new Date(a.at));

  // Fit reports from buyers who received the pair.
  const reviews = [];
  const reviewable = products.filter((p) => p.watchers > 20);
  for (let i = 0; i < 38; i += 1) {
    const p = reviewable[Math.floor(rand() * reviewable.length)];
    const fit = pick([["true", 62], ["small", 22], ["large", 16]], rand);
    const customer = CUSTOMERS[Math.floor(rand() * CUSTOMERS.length)];
    const sizes = Object.keys(p.stockBySize);
    const texts = FIT_TEXT[fit];
    reviews.push({
      id: "RV-" + (500 + i),
      productId: p.id,
      userId: customer.id,
      author: customer.name,
      size: sizes[Math.floor(rand() * sizes.length)],
      fit,
      rating: Math.min(5, Math.max(3, Math.round(p.rating + (rand() - 0.5) * 1.6))),
      text: texts[Math.floor(rand() * texts.length)],
      at: new Date(+now - Math.floor(rand() * 60) * DAY - Math.floor(rand() * 20) * HOUR).toISOString(),
      verified: true,
    });
  }
  reviews.sort((a, b) => +new Date(b.at) - +new Date(a.at));

  return { products, orders, purchaseOrders, movements, reviews, slaHours: SLA_HOURS };
}
