import {
  dayKey, salesAnalytics, demandForecast, forecastAll, revenueForecast, suggestSizeSplit,
  fulfillmentStats, stockLedger, actionCentre, poState, nextPOId, supplierSummary, toCSV,
  inventoryCSV, abcAnalysis,
} from "./erp";
import { newShipments, shipmentAt } from "../data/shipping";

const DAY = 86400000;
const now = new Date("2026-10-24T04:00:00Z"); // noon on 24 Oct in Manila
const ago = (days) => new Date(+now - days * DAY).toISOString();

const shoe = (over = {}) => ({
  id: "a", sku: "A-1", name: "Alpha", brand: "Nike", ownerId: "s1", price: 1000, cost: 600,
  stockBySize: { 9: 10, 10: 0 }, leadDays: 10, watchers: 0, reorderPoint: 5, supplier: "Nike PH", ...over,
});
const line = (p, size = "9", quantity = 1) => ({
  id: p.id, sku: p.sku, name: p.name, brand: p.brand, image: "x.jpg", size, quantity, price: p.price, cost: p.cost, ownerId: p.ownerId, seller: "S",
});
const order = (id, daysAgo, items, shipments) => ({
  id, date: ago(daysAgo), recipient: "Buyer " + id, items, shipping: 0, total: 0, shipments,
});
// one pair sold every day for the 28 complete days before "today"
const steady = (p) => Array.from({ length: 28 }, (_, i) => order("O" + (i + 1), i + 1, [line(p)]));

test("dayKey groups by Manila calendar day", () => {
  expect(dayKey("2026-10-23T16:30:00Z")).toBe("2026-10-24"); // 00:30 Manila
  expect(dayKey("2026-10-23T15:59:00Z")).toBe("2026-10-23");
});

describe("salesAnalytics", () => {
  const p = shoe();
  const result = salesAnalytics(steady(p), [p], "s1", 30, now);
  test("revenue, cost, profit and margin", () => {
    expect(result.revenue).toBe(28000);
    expect(result.cogs).toBe(16800);
    expect(result.profit).toBe(11200);
    expect(result.margin).toBeCloseTo(0.4);
    expect(result.orders).toBe(28);
    expect(result.average).toBe(1000);
    expect(result.delta).toBeNull();
  });
  test("sell-through, stock value and size curve", () => {
    expect(result.sellThrough).toBeCloseTo(28 / 38);
    expect(result.stockValueCost).toBe(6000);
    expect(result.stockValueRetail).toBe(10000);
    expect(result.sizeCurve).toEqual([{ size: "9", units: 28 }]);
    expect(result.trend).toHaveLength(30);
    expect(result.trend[29].day).toBe("2026-10-24");
  });
  test("ignores other sellers and compares with the previous period", () => {
    const other = { ...p, id: "b", ownerId: "s2" };
    const orders = [...steady(p), order("X", 2, [line(other)]), order("Old", 40, [line(p, "9", 2)])];
    const r = salesAnalytics(orders, [p, other], "s1", 30, now);
    expect(r.revenue).toBe(28000);
    expect(r.previousRevenue).toBe(2000);
    expect(r.delta).toBeCloseTo(13);
  });
});

test("ABC classes follow the 80/15/5 pareto", () => {
  const owned = ["w", "x", "y", "z"].map((id) => shoe({ id }));
  const ranked = new Map([["w", { revenue: 800 }], ["x", { revenue: 150 }], ["y", { revenue: 50 }]]);
  expect(abcAnalysis(owned, ranked).map((r) => r.class)).toEqual(["A", "B", "C", "C"]);
});

describe("demandForecast", () => {
  test("steady demand of 1/day: velocity, cover, reorder point and quantity", () => {
    const p = shoe();
    const f = demandForecast(steady(p), p, now);
    expect(f.velocity).toBeCloseTo(1);
    expect(f.daysOfCover).toBeCloseTo(10);
    expect(f.safetyStock).toBe(0);
    expect(f.reorderPoint).toBe(10);
    expect(f.forecastUnits).toBe(30);
    expect(f.suggestedQty).toBe(30); // 1*(10+30) - 10 on hand
    expect(f.status).toBe("Reorder now");
    expect(f.stockoutDate).toBe(new Date(+now + 10 * DAY).toISOString());
  });
  test("an open purchase order covers the gap", () => {
    const p = shoe();
    const f = demandForecast(steady(p), p, now, { openPOUnits: 30 });
    expect(f.suggestedQty).toBe(0);
    expect(f.status).toBe("On order");
  });
  test("watchers lift demand, capped at 20%", () => {
    const p = shoe({ watchers: 200 });
    expect(demandForecast(steady(p), p, now).velocity).toBeCloseTo(1.1);
    const hot = shoe({ watchers: 5000 });
    expect(demandForecast(steady(hot), hot, now).velocity).toBeCloseTo(1.2);
  });
  test("statuses: out of stock, slow mover, overstock, healthy", () => {
    const out = shoe({ stockBySize: { 9: 0 } });
    expect(demandForecast(steady(out), out, now).status).toBe("Out of stock");
    const slow = shoe({ stockBySize: { 9: 5 } });
    expect(demandForecast([order("1", 3, [line(slow)])], slow, now).status).toBe("Slow mover");
    const heavy = shoe({ stockBySize: { 9: 400 } });
    expect(demandForecast(steady(heavy), heavy, now).status).toBe("Overstock");
    const ok = shoe({ stockBySize: { 9: 60 } });
    expect(demandForecast(steady(ok), ok, now).status).toBe("Healthy");
  });
  test("a product that never sold has zero velocity and no stockout date", () => {
    const p = shoe();
    const f = demandForecast([], p, now);
    expect(f.velocity).toBe(0);
    expect(f.stockoutDate).toBeNull();
    expect(f.daysOfCover).toBe(Infinity);
  });
  test("forecastAll ranks the most urgent first", () => {
    const urgent = shoe();
    const calm = shoe({ id: "c", stockBySize: { 9: 60 } });
    const orders = [...steady(urgent), ...steady(calm).map((o) => ({ ...o, id: "C" + o.id }))];
    const all = forecastAll(orders, [calm, urgent], [], "s1", now);
    expect(all.map((f) => f.id)).toEqual(["a", "c"]);
  });
});

test("revenueForecast projects 30 days with a band", () => {
  const p = shoe();
  const series = revenueForecast(steady(p), "s1", now, 30);
  expect(series).toHaveLength(30);
  expect(series[0].day).toBe("2026-10-24");
  series.forEach((pt) => {
    expect(pt.revenue).toBeCloseTo(1000, 0);
    expect(pt.low).toBeLessThanOrEqual(pt.revenue);
    expect(pt.high).toBeGreaterThanOrEqual(pt.revenue);
  });
});

describe("suggestSizeSplit", () => {
  test("splits by the sales mix and always sums to the quantity", () => {
    const p = shoe();
    const orders = [
      order("1", 2, [line(p, "9", 3)]), order("2", 3, [line(p, "10", 1)]),
    ];
    expect(suggestSizeSplit(orders, p, 10, now)).toEqual({ 9: 8, 10: 2 });
    const odd = suggestSizeSplit(orders, p, 7, now);
    expect(Object.values(odd).reduce((a, b) => a + b, 0)).toBe(7);
  });
  test("falls back to the sizes already stocked", () => {
    const p = shoe({ stockBySize: { 8: 1, 9: 1 } });
    expect(suggestSizeSplit([], p, 4, now)).toEqual({ 8: 2, 9: 2 });
  });
});

describe("fulfillment", () => {
  const p = shoe();
  const ship = (id, hoursAgo, stage) => {
    const placed = new Date(+now - hoursAgo * 3600000).toISOString();
    const base = newShipments([line(p)], placed);
    return {
      id, date: placed, recipient: "R" + id, items: [line(p)], shipping: 0, total: 1000,
      shipments: { s1: shipmentAt(base.s1, id, placed, stage) },
    };
  };
  const orders = [ship("L", 100, 0), ship("D", 120, 4), ship("T", 6, 0), ship("P", 40, 1)];
  const stats = fulfillmentStats(orders, "s1", now);
  test("counts per stage and active total", () => {
    expect(stats.counts).toMatchObject({ Placed: 2, Packed: 1, Delivered: 1 });
    expect(stats.total).toBe(4);
    expect(stats.active).toBe(3);
  });
  test("late shipments are measured against the SLA of the next stage", () => {
    // L is 100h old and still Placed (Packed was due at 24h); P is 40h old and Packed (Shipped is due at 48h).
    expect(stats.late).toEqual([{ orderId: "L", recipient: "RL", status: "Placed", hours: 76 }]);
  });
  test("oldest unshipped and on-time delivery", () => {
    expect(stats.oldestUnshipped.orderId).toBe("L");
    expect(stats.onTimePct).toBe(1);
  });
});

test("stock ledger merges stored movements with sales", () => {
  const p = shoe();
  const movements = [{ id: "M1", productId: "a", size: "9", qty: 5, type: "PO receipt", at: ago(5) }];
  const ledger = stockLedger(movements, [order("O1", 1, [line(p, "9", 2)])], [p], "s1");
  expect(ledger.map((m) => [m.type, m.qty])).toEqual([["Sale", -2], ["PO receipt", 5]]);
  expect(stockLedger(movements, [], [p], "other")).toEqual([]);
});

test("purchasing helpers", () => {
  const po = { id: "PO-2060", ownerId: "s1", status: "Ordered", eta: ago(3), createdAt: ago(17), qty: 10, unitCost: 100, supplier: "X" };
  expect(poState(po, now)).toBe("Delayed");
  expect(poState({ ...po, eta: ago(-3) }, now)).toBe("Ordered");
  expect(nextPOId([po])).toBe("PO-2061");
  expect(supplierSummary([po], "s1", now)[0]).toMatchObject({ supplier: "X", open: 1, delayed: 1, spend: 1000 });
});

test("action centre lists concrete next steps", () => {
  const p = shoe({ watchers: 120, stockBySize: { 9: 1 } });
  const placed = new Date(+now - 100 * 3600000).toISOString();
  const late = { id: "L", date: placed, recipient: "R", items: [line(p)], shipping: 0, total: 1000, shipments: { s1: newShipments([line(p)], placed).s1 } };
  const po = { id: "PO-2060", ownerId: "s1", productId: "z", status: "Ordered", eta: ago(2), createdAt: ago(16), qty: 4, unitCost: 1, supplier: "X" };
  const ids = actionCentre({ products: [p], orders: [...steady(p), late], purchaseOrders: [po], ownerId: "s1", now }).map((a) => a.id);
  expect(ids).toEqual(expect.arrayContaining(["reorder-now", "late", "po-delayed", "watchers"]));
});

test("CSV escapes quotes and blocks spreadsheet formulas", () => {
  const csv = toCSV([{ n: '=HYPERLINK("x")', m: "a,b" }, { n: "-5", m: 'say "hi"' }], [["n", "Name"], ["m", "Note"]]);
  expect(csv).toBe(`Name,Note\r\n"'=HYPERLINK(""x"")","a,b"\r\n-5,"say ""hi"""`);
  expect(inventoryCSV([shoe()]).split("\r\n")[1]).toContain("A-1,Alpha,Nike");
});
