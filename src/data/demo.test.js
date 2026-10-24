import { CATALOG } from "./catalog";
import { buildDemoHistory } from "./demo";
import { stockOf } from "../store";

const now = new Date("2026-10-24T04:00:00Z");

test("demo history is deterministic and shaped for the ERP views", () => {
  const a = buildDemoHistory(CATALOG, now);
  const b = buildDemoHistory(CATALOG, now);
  expect(a.orders.map((o) => o.id)).toEqual(b.orders.map((o) => o.id));
  expect(a.orders.length).toBeGreaterThan(400);
  expect(new Set(a.orders.map((o) => o.id)).size).toBe(a.orders.length);
  a.orders.forEach((o) => {
    expect(Object.keys(o.shipments).length).toBeGreaterThan(0);
    expect(o.total).toBe(o.items.reduce((s, i) => s + i.price * i.quantity, 0) + o.shipping);
  });
  const statuses = new Set(Object.values(a.orders[0].shipments).map((s) => s.status));
  expect(statuses.size).toBeGreaterThan(0);
  expect(a.reviews.length).toBe(38);
  expect(a.purchaseOrders.map((p) => p.status)).toEqual(["Ordered", "Ordered", "Received"]);
});

test("catalog stock is held per size", () => {
  const pastel = CATALOG.find((p) => p.id === "af1-shadow-pastel");
  expect(stockOf(pastel)).toBe(1);
  expect(CATALOG.every((p) => p.sku && p.cost < p.price)).toBe(true);
});
