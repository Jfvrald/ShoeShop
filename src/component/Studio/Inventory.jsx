import React, { useMemo, useState } from "react";
import { CaretDown, CaretRight, Minus, Plus, Trash, ArrowUpRight, MagnifyingGlass } from "@phosphor-icons/react";
import { asset, money, allSizesOf } from "../../store";
import { inventoryCSV, stockLedger, unitsOf } from "../../lib/erp";
import { Empty, ExportButton, NumberCell, Panel, StatusChip, cover, dateTime, num, pct } from "./ui";

const STATUSES = ["Out of stock", "Reorder now", "Reorder soon", "On order", "Healthy", "Slow mover", "Overstock"];

function SizeGrid({ product, ledger, onAdjustStock }) {
  const [note, setNote] = useState("");
  const [extra, setExtra] = useState("");
  const sizes = allSizesOf(product);
  const adjust = (size, delta) => onAdjustStock(product.id, size, delta, note.trim() || "Manual count");
  return (
    <div className="st-expand">
      <div>
        <h4>Stock by US size</h4>
        <ul className="st-sizes">
          {sizes.map((size) => {
            const qty = product.stockBySize[size];
            return (
              <li key={size} className={qty === 0 ? "zero" : qty <= 1 ? "low" : ""}>
                <b>{size}</b>
                <div>
                  <button aria-label={`Remove one pair of size ${size}`} disabled={qty === 0} onClick={() => adjust(size, -1)}><Minus size={12} weight="bold" /></button>
                  <span aria-label={`${qty} in size ${size}`}>{qty}</span>
                  <button aria-label={`Add one pair of size ${size}`} onClick={() => adjust(size, 1)}><Plus size={12} weight="bold" /></button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="st-inline-form">
          <label>Reason for the change<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Cycle count, damaged, return" maxLength={60} /></label>
          <label>New size<input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="9.5" inputMode="decimal" maxLength={4} /></label>
          <button className="button ghost st-small" disabled={!/^\d{1,2}(\.5)?$/.test(extra.trim()) || sizes.includes(extra.trim())}
            onClick={() => { adjust(extra.trim(), 1); setExtra(""); }}>Add size</button>
        </div>
      </div>
      <div>
        <h4>Recent movements</h4>
        {ledger.length ? (
          <ul className="st-ledger">
            {ledger.slice(0, 6).map((m) => (
              <li key={m.id}>
                <span className={m.qty > 0 ? "good" : ""}>{m.qty > 0 ? "+" : ""}{m.qty}</span>
                <div><b>{m.type} · US {m.size}</b><small>{m.note || m.ref || ""} · {dateTime(m.at)}</small></div>
              </li>
            ))}
          </ul>
        ) : <p className="muted small">No movements recorded yet.</p>}
      </div>
    </div>
  );
}

export default function Inventory({ ctx }) {
  const { mine, forecasts, movements, orders, products, user, preset, onAddListing, onUpdateProduct, onRemove, onAdjustStock, onOpen } = ctx;
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("All");
  const [status, setStatus] = useState(preset?.status || "All");
  const [sort, setSort] = useState("urgency");
  const [open, setOpen] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [ledgerFor, setLedgerFor] = useState("all");
  const [ledgerMax, setLedgerMax] = useState(10);
  const brands = [...new Set(mine.map((p) => p.brand))].sort();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = forecasts
      .filter((f) => (brand === "All" || f.product.brand === brand) && (status === "All" || f.status === status))
      .filter((f) => !q || `${f.product.name} ${f.product.sku} ${f.product.bin}`.toLowerCase().includes(q));
    const by = {
      urgency: () => 0,
      name: (a, b) => a.product.name.localeCompare(b.product.name),
      stock: (a, b) => b.onHand - a.onHand,
      value: (a, b) => b.onHand * b.product.cost - a.onHand * a.product.cost,
      margin: (a, b) => (a.product.price - a.product.cost) / a.product.price - (b.product.price - b.product.cost) / b.product.price,
    }[sort];
    return [...list].sort(by);
  }, [forecasts, query, brand, status, sort]);

  const ledger = useMemo(
    () => stockLedger(movements, orders, products, user.id, ledgerFor === "all" ? undefined : ledgerFor),
    [movements, orders, products, user.id, ledgerFor],
  );
  const totals = rows.reduce((t, f) => ({ units: t.units + f.onHand, cost: t.cost + f.onHand * f.product.cost, retail: t.retail + f.onHand * f.product.price }), { units: 0, cost: 0, retail: 0 });

  if (!mine.length) {
    return (
      <Empty title="No inventory yet." action={<button className="button primary" onClick={() => onAddListing()}><Plus size={16} weight="bold" /> Add your first listing</button>}>
        Each pair you list gets a SKU, stock by size, a cost and a reorder point, so the studio can warn you before you sell out.
      </Empty>
    );
  }

  return (
    <div className="st-stack">
      <div className="st-toolbar">
        <div>
          <h2>Inventory</h2>
          <p className="muted">One row per SKU. Edit price, cost and reorder point in place. Open a row to count stock by size.</p>
        </div>
        <div className="st-controls">
          <button className="button primary st-small" onClick={() => onAddListing()}><Plus size={15} weight="bold" /> Add listing</button>
          <ExportButton name="sole-rise-inventory.csv" build={() => inventoryCSV(mine, forecasts)} />
        </div>
      </div>

      <div className="st-filters">
        <label className="st-search"><MagnifyingGlass size={16} aria-hidden="true" /><span className="sr-only">Search SKU, name or bin</span>
          <input type="search" placeholder="Search SKU, name or bin" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
        <label>Brand<select value={brand} onChange={(e) => setBrand(e.target.value)}><option>All</option>{brands.map((b) => <option key={b}>{b}</option>)}</select></label>
        <label>Status<select value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label>Sort<select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="urgency">Most urgent</option><option value="name">Name</option><option value="stock">On hand</option><option value="value">Stock value</option><option value="margin">Margin, low first</option></select></label>
      </div>

      <div className="st-table-wrap">
        <table className="st-table">
          <thead>
            <tr>
              <th>Product</th><th>Brand</th><th className="n">On hand</th><th className="n">Reorder at</th><th className="n">Cover (days)</th><th>Status</th>
              <th className="n">Cost</th><th className="n">Price</th><th className="n">Margin</th><th className="n">Value at cost</th><th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => {
              const p = f.product;
              const isOpen = open === p.id;
              const margin = p.price ? (p.price - p.cost) / p.price : 0;
              return (
                <React.Fragment key={p.id}>
                  <tr className={isOpen ? "open" : ""}>
                    <td>
                      <button className="st-product" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : p.id)}>
                        {isOpen ? <CaretDown size={14} weight="bold" aria-hidden="true" /> : <CaretRight size={14} weight="bold" aria-hidden="true" />}
                        <img src={asset(p.image)} alt="" />
                        <span><b>{p.name}</b><small>{p.sku} · Bin {p.bin}</small></span>
                      </button>
                    </td>
                    <td>{p.brand}</td>
                    <td className="n"><b>{unitsOf(p)}</b></td>
                    <td className="n"><NumberCell value={p.reorderPoint} label={`Reorder point for ${p.name}`} onCommit={(v) => onUpdateProduct(p.id, { reorderPoint: v })} /></td>
                    <td className="n">{cover(f.daysOfCover)}</td>
                    <td><StatusChip status={f.status} /></td>
                    <td className="n"><NumberCell prefix="₱" value={p.cost} label={`Cost of ${p.name}`} onCommit={(v) => onUpdateProduct(p.id, { cost: v })} /></td>
                    <td className="n"><NumberCell prefix="₱" min={1} value={p.price} label={`Price of ${p.name}`} onCommit={(v) => onUpdateProduct(p.id, { price: v })} /></td>
                    <td className={"n " + (margin < 0.2 ? "warning" : "")}>{pct(margin)}</td>
                    <td className="n">{money(unitsOf(p) * p.cost)}</td>
                    <td className="act">
                      <button className="icon-button" aria-label={`View ${p.name} in the shop`} onClick={() => onOpen(p)}><ArrowUpRight size={16} /></button>
                      {confirm === p.id ? (
                        <button className="button ghost st-small danger" onClick={() => { onRemove(p.id); setConfirm(null); }} onBlur={() => setConfirm(null)} autoFocus>Remove for good?</button>
                      ) : (
                        <button className="icon-button" aria-label={`Remove listing ${p.name}`} onClick={() => setConfirm(p.id)}><Trash size={16} /></button>
                      )}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="expand-row"><td colSpan={11}><SizeGrid product={p} ledger={stockLedger(movements, orders, products, user.id, p.id)} onAdjustStock={onAdjustStock} /></td></tr>
                  )}
                </React.Fragment>
              );
            })}
            {!rows.length && <tr><td colSpan={11}><Empty title="No SKUs match these filters." /></td></tr>}
          </tbody>
          <tfoot><tr><td colSpan={2}>{rows.length} SKUs</td><td className="n">{num(totals.units)}</td><td colSpan={5} /><td className="n" colSpan={2}>{money(totals.cost)}</td><td /></tr></tfoot>
        </table>
      </div>

      <Panel title="Stock ledger" aside={
        <label className="st-inline-select">Show<select value={ledgerFor} onChange={(e) => { setLedgerFor(e.target.value); setLedgerMax(10); }}>
          <option value="all">All SKUs</option>{mine.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      }>
        <p className="muted small">Every pair in or out: sales from checkout, purchase receipts and manual counts. This is your audit trail.</p>
        <div className="st-table-wrap short">
          <table className="st-table">
            <thead><tr><th>When</th><th>Movement</th><th>SKU</th><th className="n">Size</th><th className="n">Qty</th><th>Reference</th></tr></thead>
            <tbody>
              {ledger.slice(0, ledgerMax).map((m) => {
                const p = products.find((x) => x.id === m.productId);
                return (
                  <tr key={m.id}>
                    <td>{dateTime(m.at)}</td><td>{m.type}</td><td>{p ? p.name : m.productId}</td><td className="n">{m.size}</td>
                    <td className={"n " + (m.qty > 0 ? "good" : "")}>{m.qty > 0 ? "+" : ""}{m.qty}</td><td>{m.ref || m.note || ""}</td>
                  </tr>
                );
              })}
              {!ledger.length && <tr><td colSpan={6}>No movements yet.</td></tr>}
            </tbody>
          </table>
        </div>
        {ledger.length > ledgerMax && <button className="text-link" onClick={() => setLedgerMax(ledgerMax + 20)}>Show more ({ledger.length - ledgerMax} older)</button>}
      </Panel>
    </div>
  );
}
