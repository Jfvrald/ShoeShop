import { CATALOG } from "../../data/catalog";
import { DEFAULT_FILTERS, filterProducts, facet, sizeUnits, activeChips, removeChip } from "./filters";

const base = { ...DEFAULT_FILTERS };

test("filters combine, and unisex pairs match a gender choice", () => {
  const men = filterProducts(CATALOG, { ...base, genders: ["Men"] });
  expect(men.every((p) => p.gender !== "Women")).toBe(true);
  expect(men.some((p) => p.gender === "Unisex")).toBe(true);
  const jordanSale = filterProducts(CATALOG, { ...base, brands: ["Jordan"], sale: true });
  expect(jordanSale.map((p) => p.id)).toEqual(["aj1-mid-chicago"]);
});

test("size filter only keeps pairs with stock in that size", () => {
  const twelves = filterProducts(CATALOG, { ...base, sizes: ["12"] });
  expect(twelves.map((p) => p.id)).toEqual(["af1-white"]);
});

test("facet counts ignore their own selection but respect the others", () => {
  const f = { ...base, brands: ["Nike"], category: "Running" };
  const brands = facet(CATALOG, f, "brands", (p) => p.brand);
  expect(brands.get("Nike")).toBeGreaterThan(0);
  expect(brands.get("Adidas")).toBe(1);
  expect(brands.has("Vans")).toBe(false);
  expect(sizeUnits(CATALOG, { ...base, brands: ["Vans"] }).get("7")).toBe(5);
});

test("chips can be removed one at a time", () => {
  const f = { ...base, brands: ["Nike", "Puma"], sale: true };
  const chips = activeChips(f);
  expect(chips.map((c) => c.label)).toEqual(["On sale", "Nike", "Puma"]);
  expect(removeChip(f, chips[1]).brands).toEqual(["Puma"]);
  expect(removeChip(f, chips[0]).sale).toBe(false);
});
