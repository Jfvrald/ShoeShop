import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Studio from "./Studio";
import { newShipments } from "../../data/shipping";

const user = { id: "s1", name: "Shop", role: "Seller" };
const product = {
  id: "a", sku: "A-1", name: "Alpha Runner", brand: "Nike", ownerId: "s1", seller: "Shop", price: 1000, cost: 600, image: "x.jpg",
  stockBySize: { 9: 4, 10: 0 }, leadDays: 10, watchers: 40, reorderPoint: 3, supplier: "Nike PH", bin: "A-1",
};
const line = { id: "a", sku: "A-1", name: "Alpha Runner", brand: "Nike", image: "x.jpg", size: "9", quantity: 1, price: 1000, cost: 600, ownerId: "s1", seller: "Shop" };
const placed = new Date(Date.now() - 3600000).toISOString();
const order = { id: "SR-1", date: placed, recipient: "Ana Cruz", items: [line], shipping: 0, total: 1000, shipments: newShipments([line], placed) };

function setup(over = {}) {
  const handlers = {
    onAddListing: jest.fn(), onAdjustStock: jest.fn(), onUpdateProduct: jest.fn(), onRemove: jest.fn(), onAdvanceShipment: jest.fn(),
    onCreatePO: jest.fn(), onReceivePO: jest.fn(), onCancelPO: jest.fn(), onOpen: jest.fn(), onAccountTab: jest.fn(),
  };
  render(<Studio user={user} products={[product]} orders={[order]} purchaseOrders={[]} movements={[]} reviews={[]} {...handlers} {...over} />);
  return handlers;
}

const tab = (name) => screen.getByRole("tab", { name: new RegExp("^" + name) });
beforeEach(() => sessionStorage.clear());

test("tabs switch with the keyboard and keep one tabpanel", async () => {
  setup();
  const tabs = screen.getAllByRole("tab");
  expect(tabs.map((t) => t.textContent.replace(/\d+$/, ""))).toEqual(["Overview", "Inventory", "Forecast", "Orders", "Purchasing", "Reports"]);
  tabs[0].focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(tab("Inventory")).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("heading", { name: "Inventory" })).toBeInTheDocument();
});

test("overview shows KPIs, the forecast chart and an action centre", () => {
  setup();
  expect(screen.getAllByText("Gross sales").length).toBeGreaterThan(0);
  expect(screen.getByRole("img", { name: /with a 30 day forecast|forecast/i })).toBeInTheDocument();
  expect(screen.getByText("Action centre")).toBeInTheDocument();
});

test("inventory edits price and adjusts stock by size", async () => {
  const h = setup();
  await userEvent.click(tab("Inventory"));
  const price = screen.getByLabelText("Price of Alpha Runner");
  await userEvent.clear(price);
  await userEvent.type(price, "1200{enter}");
  expect(h.onUpdateProduct).toHaveBeenCalledWith("a", { price: 1200 });
  await userEvent.click(screen.getByRole("button", { name: /^Alpha Runner A-1/ }));
  await userEvent.click(screen.getByRole("button", { name: "Add one pair of size 10" }));
  expect(h.onAdjustStock).toHaveBeenCalledWith("a", "10", 1, "Manual count");
});

test("orders board advances a shipment and shows its timeline", async () => {
  const h = setup();
  await userEvent.click(tab("Orders"));
  const placedCol = screen.getByRole("region", { name: /Placed, 1 orders/ });
  await userEvent.click(within(placedCol).getByRole("button", { name: "Mark packed" }));
  expect(h.onAdvanceShipment).toHaveBeenCalledWith("SR-1", "s1");
  await userEvent.click(within(placedCol).getByRole("button", { name: /Delivery timeline/ }));
  expect(screen.getByRole("list", { name: /Delivery timeline for SR-1/ })).toBeInTheDocument();
});

test("forecast creates a purchase order with sizes that add up", async () => {
  const sold = Array.from({ length: 20 }, (_, i) => ({ ...order, id: "O" + i, date: new Date(Date.now() - (i + 1) * 86400000).toISOString() }));
  const h = setup({ orders: sold });
  await userEvent.click(tab("Forecast"));
  await userEvent.click(screen.getAllByRole("button", { name: "Create PO" })[0]);
  expect(h.onCreatePO).toHaveBeenCalledTimes(1);
  const po = h.onCreatePO.mock.calls[0][0];
  expect(po.status).toBe("Ordered");
  expect(po.id).toBe("PO-2061");
  expect(Object.values(po.sizeSplit).reduce((a, b) => a + b, 0)).toBe(po.qty);
});

test("an empty store gets a call to action instead of broken charts", async () => {
  const h = setup({ products: [], orders: [] });
  await userEvent.click(screen.getByRole("button", { name: /Add your first listing/ }));
  expect(h.onAddListing).toHaveBeenCalled();
  await userEvent.click(tab("Reports"));
  expect(screen.getByText("No reports yet.")).toBeInTheDocument();
});
