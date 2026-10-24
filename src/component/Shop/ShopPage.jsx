import React, { useMemo, useState } from "react";
import {
  CaretUp,
  MagnifyingGlass,
  SlidersHorizontal,
  X,
  Heart,
  Check,
} from "@phosphor-icons/react";
import { BRANDS, CATEGORIES, GENDERS, COLORS, SIZE_RUN, salePercent } from "../../store";
import { ProductCard } from "../Product/Product";
import {
  DEFAULT_FILTERS,
  filterProducts,
  facet,
  sizeUnits,
  activeChips,
  removeChip,
  toggleIn,
} from "./filters";
import "./Shop.css";

function Group({ title, children, open = true, count = 0 }) {
  const [isOpen, setOpen] = useState(open);
  return (
    <section className="fg">
      <h3>
        <button aria-expanded={isOpen} onClick={() => setOpen(!isOpen)}>
          <span>
            {title}
            {count > 0 && <em>{count}</em>}
          </span>
          <CaretUp size={14} weight="bold" aria-hidden="true" className={isOpen ? "" : "flip"} />
        </button>
      </h3>
      {isOpen && <div className="fg-body">{children}</div>}
    </section>
  );
}

function FilterCheck({ checked, onChange, label, count, disabled }) {
  return (
    <label className={"fc" + (disabled ? " off" : "")}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled && !checked} />
      <span className="box" aria-hidden="true">
        <Check size={12} weight="bold" />
      </span>
      <span className="fc-label">{label}</span>
      {count !== undefined && <small>{count}</small>}
    </label>
  );
}

export default function ShopPage({ products, wishlist, onOpen, onWish, filters, setFilters }) {
  const [sheet, setSheet] = useState(false);
  const f = filters;
  const patch = (next) => setFilters({ ...f, ...next });

  const results = useMemo(() => filterProducts(products, f, wishlist), [products, f, wishlist]);
  const colorsOfModel = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      const key = p.brand + p.model;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [products]);

  const categories = facet(products, f, "category", (p) => p.category, wishlist);
  const brands = facet(products, f, "brands", (p) => p.brand, wishlist);
  const models = facet(products, f, "models", (p) => p.model, wishlist);
  const colors = facet(products, f, "colors", (p) => p.color, wishlist);
  const genders = facet(products, f, "genders", (p) => (p.gender === "Unisex" ? GENDERS : p.gender), wishlist);
  const units = sizeUnits(products, f, wishlist);
  const onSale = facet(products, { ...f, sale: false }, "sale", (p) => (salePercent(p) ? "sale" : []), wishlist).get("sale") || 0;
  const chips = activeChips(f);
  const prices = products.map((p) => p.price);
  const priceMax = Math.ceil(Math.max(...prices) / 500) * 500;
  const priceMin = Math.floor(Math.min(...prices) / 500) * 500;
  const allCategoryTotal = [...categories.values()].reduce((a, b) => a + b, 0);

  const sidebar = (
    <>
      <div className="fs-head">
        <h2>Filters</h2>
        <button className="text-link" onClick={() => setFilters({ ...DEFAULT_FILTERS, sort: f.sort })} disabled={!chips.length}>
          Clear all
        </button>
        <button className="fs-close" aria-label="Close filters" onClick={() => setSheet(false)}>
          <X size={20} weight="bold" />
        </button>
      </div>

      <nav aria-label="Categories" className="fcat">
        {["All", ...CATEGORIES].map((name) => (
          <button
            key={name}
            className={f.category === name ? "on" : ""}
            aria-pressed={f.category === name}
            disabled={name !== "All" && !categories.get(name) && f.category !== name}
            onClick={() => patch({ category: name })}
          >
            {name}
            <small>{name === "All" ? allCategoryTotal : categories.get(name) || 0}</small>
          </button>
        ))}
      </nav>

      <Group title="Gender" count={f.genders.length}>
        {GENDERS.map((g) => (
          <FilterCheck
            key={g}
            label={g}
            count={genders.get(g) || 0}
            checked={f.genders.includes(g)}
            disabled={!genders.get(g)}
            onChange={() => patch({ genders: toggleIn(f.genders, g) })}
          />
        ))}
      </Group>

      <Group title="Sale & promo" count={f.sale ? 1 : 0}>
        <FilterCheck label="On sale" count={onSale} checked={f.sale} disabled={!onSale} onChange={() => patch({ sale: !f.sale })} />
      </Group>

      <Group title="Brand" count={f.brands.length}>
        {BRANDS.map((b) => (
          <FilterCheck
            key={b}
            label={b}
            count={brands.get(b) || 0}
            checked={f.brands.includes(b)}
            disabled={!brands.get(b)}
            onChange={() => patch({ brands: toggleIn(f.brands, b), models: [] })}
          />
        ))}
      </Group>

      <Group title="Model" count={f.models.length}>
        <div className="fc-scroll">
          {[...models.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([m, n]) => (
              <FilterCheck
                key={m}
                label={m}
                count={n}
                checked={f.models.includes(m)}
                onChange={() => patch({ models: toggleIn(f.models, m) })}
              />
            ))}
        </div>
      </Group>

      <Group title="Size (US)" count={f.sizes.length}>
        <div className="fsize">
          {SIZE_RUN.map((s) => {
            const left = units.get(s) || 0;
            return (
              <button
                key={s}
                className={f.sizes.includes(s) ? "on" : ""}
                aria-pressed={f.sizes.includes(s)}
                disabled={!left && !f.sizes.includes(s)}
                onClick={() => patch({ sizes: toggleIn(f.sizes, s) })}
              >
                <b>{s}</b>
                <small>{left} left</small>
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Color" count={f.colors.length}>
        <div className="fcolor">
          {Object.entries(COLORS).map(([name, hex]) => (
            <button
              key={name}
              className={f.colors.includes(name) ? "on" : ""}
              aria-pressed={f.colors.includes(name)}
              disabled={!colors.get(name) && !f.colors.includes(name)}
              onClick={() => patch({ colors: toggleIn(f.colors, name) })}
            >
              <i style={{ background: hex }} aria-hidden="true" />
              <span>{name}</span>
              <small>{colors.get(name) || 0}</small>
            </button>
          ))}
        </div>
      </Group>

      <Group title="Price" count={f.maxPrice ? 1 : 0}>
        <label className="frange">
          <span>
            Up to <b>₱{(f.maxPrice || priceMax).toLocaleString("en-PH")}</b>
          </span>
          <input
            type="range"
            min={priceMin}
            max={priceMax}
            step="500"
            value={f.maxPrice || priceMax}
            onChange={(e) => patch({ maxPrice: Number(e.target.value) >= priceMax ? null : Number(e.target.value) })}
          />
        </label>
      </Group>

      <Group title="Condition" open={false} count={f.condition !== "All" ? 1 : 0}>
        <div className="fseg" role="group" aria-label="Condition">
          {["All", "New", "Pre-loved"].map((c) => (
            <button key={c} className={f.condition === c ? "on" : ""} aria-pressed={f.condition === c} onClick={() => patch({ condition: c })}>
              {c === "All" ? "Any" : c}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Sold by" open={false} count={f.soldBy !== "All" ? 1 : 0}>
        <div className="fseg" role="group" aria-label="Sold by">
          {[["All", "Anyone"], ["Seller", "Stores"], ["Reseller", "Resellers"]].map(([v, l]) => (
            <button key={v} className={f.soldBy === v ? "on" : ""} aria-pressed={f.soldBy === v} onClick={() => patch({ soldBy: v })}>
              {l}
            </button>
          ))}
        </div>
      </Group>
    </>
  );

  return (
    <section className="shop">
      <div className="shop-layout">
        <aside className={"shop-filters" + (sheet ? " open" : "")} aria-label="Product filters">
          {sidebar}
          <div className="fs-apply">
            <button className="button primary full" onClick={() => setSheet(false)}>
              Show {results.length} {results.length === 1 ? "pair" : "pairs"}
            </button>
          </div>
        </aside>
        {sheet && <div className="shop-scrim" onClick={() => setSheet(false)} />}

        <div className="shop-main">
          <header className="shop-head">
            <div>
              <h1>Shop collection</h1>
              <p className="shop-count" role="status">
                {results.length} {results.length === 1 ? "result" : "results"}
              </p>
            </div>
            <div className="shop-tools">
              <label className="shop-search">
                <span className="sr-only">Search the collection</span>
                <MagnifyingGlass size={18} aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search model, brand, color, store"
                  value={f.q}
                  onChange={(e) => patch({ q: e.target.value })}
                />
              </label>
              <label className="shop-sort">
                <span className="sr-only">Sort by</span>
                <select value={f.sort} onChange={(e) => patch({ sort: e.target.value })}>
                  <option value="featured">Most wanted</option>
                  <option value="rating">Top rated</option>
                  <option value="low">Price: low to high</option>
                  <option value="high">Price: high to low</option>
                  <option value="sale">Biggest discount</option>
                </select>
              </label>
              <button className={"shop-saved" + (f.saved ? " on" : "")} aria-pressed={f.saved} onClick={() => patch({ saved: !f.saved })}>
                <Heart size={16} weight={f.saved ? "fill" : "regular"} /> Saved ({wishlist.length})
              </button>
              <button className="shop-open-filters" onClick={() => setSheet(true)}>
                <SlidersHorizontal size={18} /> Filters{chips.length ? ` (${chips.length})` : ""}
              </button>
            </div>
          </header>

          <div className="shop-pills" role="group" aria-label="Category">
            {["All", ...CATEGORIES].map((name) => (
              <button key={name} className={f.category === name ? "on" : ""} aria-pressed={f.category === name} onClick={() => patch({ category: name })}>
                {name}
              </button>
            ))}
          </div>

          {chips.length > 0 && (
            <ul className="shop-chips" aria-label="Active filters">
              {chips.map((chip) => (
                <li key={chip.key + (chip.value || "")}>
                  <button onClick={() => setFilters(removeChip(f, chip))} aria-label={`Remove filter ${chip.label}`}>
                    {chip.label} <X size={12} weight="bold" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {results.length ? (
            <div className="shop-grid">
              {results.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpen={onOpen}
                  wished={wishlist.includes(product.id)}
                  onWish={onWish}
                  colorCount={colorsOfModel.get(product.brand + product.model)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>No pairs match. Yet.</h2>
              <p>Loosen a filter or clear them all to see the full collection.</p>
              <button className="button primary" onClick={() => setFilters({ ...DEFAULT_FILTERS })}>
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
