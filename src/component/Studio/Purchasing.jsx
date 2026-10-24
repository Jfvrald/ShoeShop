import React, { useMemo, useState } from "react";
import { asset, money, allSizesOf } from "../../store";
import { nextPOId, poDaysLate, poState, suggestSizeSplit, supplierSummary } from "../../lib/erp";
import { Empty, Kpi, Panel, StatusChip, dateLabel, num } from "./ui";

const DAY = 86400000;
const sum = (obj) => Object.values(obj).reduce((s, q) => s + (Number(q) || 0), 0);

function NewPO({ ctx }) {
  const { mine, orders, forecasts, purchaseOrders, now, onCreatePO } = ctx;
  const [productId, setProductId] = useState(mine[0]?.id || "");
  const product = mine.find((p) => p.id === productId) || mine[0];
  const forecast = forecasts.find((f) => f.id === product.id);
  const [qtyInput, setQtyInput] = useState("");
  const [override, setOverride] = useState(null);
  const [sent, setSent] = useState("");
  const qty = qtyInput === "" ? Math.max(forecast?.suggestedQty || 0, 1) : Math.max(0, Math.floor(Number(qtyInput)) || 0);
  const auto = useMemo(() => suggestSizeSplit(orders, product, qty, now), [orders, product, qty, now]);
  const split = override || auto;
  const sizes = [...new Set([...allSizesOf(product), ...Object.keys(split)])].sort((a, b) => parseFloat(a) - parseFloat(b));
  const matches = sum(split) === qty && qty > 0;

  function submit(event) {
    event.preventDefault();
    if (!matches) return;
    const supplier = new FormData(event.currentTarget).get("supplier").trim() || product.supplier;
    const po = {
      id: nextPOId(purchaseOrders), ownerId: product.ownerId, productId: product.id, sku: product.sku, name: product.name,
      supplier, qty, unitCost: product.cost, sizeSplit: Object.fromEntries(Object.entries(split).filter(([, q]) => Number(q) > 0).map(([s, q]) => [s, Number(q)])),
      status: "Ordered", createdAt: new Date(now).toISOString(), eta: new Date(+now + (product.leadDays || 14) * DAY).toISOString(), receivedAt: null,
    };
    onCreatePO(po);
    setSent(`${po.id} created: ${qty} pairs from ${supplier}, ${money(qty * po.unitCost)}.`);
    setQtyInput(""); setOverride(null);
  }

  return (
    <form className="st-form" onSubmit={submit}>
      <div className="st-form-row">
        <label>Product
          <select value={product.id} onChange={(e) => { setProductId(e.target.value); setQtyInput(""); setOverride(null); }}>
            {mine.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
          </select>
        </label>
        <label>Pairs to order
          <input type="number" min="1" max="500" value={qtyInput === "" ? qty : qtyInput} onChange={(e) => { setQtyInput(e.target.value); setOverride(null); }} />
        </label>
        <label>Supplier
          <input name="supplier" key={product.id} defaultValue={product.supplier} maxLength={60} />
        </label>
      </div>
      <fieldset>
        <legend>Pairs per US size {forecast?.suggestedQty ? `· forecast suggests ${forecast.suggestedQty} in total` : ""}</legend>
        <div className="st-split">
          {sizes.map((s) => (
            <label key={s}>{s}
              <input type="number" min="0" value={split[s] ?? 0} onChange={(e) => setOverride({ ...split, [s]: e.target.value })} aria-label={`Pairs of size ${s}`} />
            </label>
          ))}
        </div>
        <p className={"st-note " + (matches ? "" : "warning")}>
          {matches ? `Sizes add up to ${qty}. Split follows your recent sales mix.` : `Sizes add up to ${sum(split)} but you are ordering ${qty}.`}
          {override && <button type="button" className="text-link" onClick={() => setOverride(null)}> Auto-split</button>}
        </p>
      </fieldset>
      <div className="st-form-foot">
        <span>Total at cost <b>{money(qty * product.cost)}</b> · arrives about <b>{dateLabel(new Date(+now + (product.leadDays || 14) * DAY).toISOString())}</b></span>
        <button className="button primary st-small" disabled={!matches}>Create purchase order</button>
      </div>
      {sent && <p className="st-banner" role="status">{sent}</p>}
    </form>
  );
}

export default function Purchasing({ ctx }) {
  const { user, purchaseOrders, products, now, mine, onAddListing, onReceivePO, onCancelPO } = ctx;
  const [show, setShow] = useState("open");
  const [busy, setBusy] = useState(null);
  const pos = purchaseOrders.filter((po) => po.ownerId === user.id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const open = pos.filter((po) => po.status === "Ordered");
  const delayed = open.filter((po) => poState(po, now) === "Delayed");
  const suppliers = supplierSummary(purchaseOrders, user.id, now);
  const list = show === "open" ? open : pos;
  const byId = new Map(products.map((p) => [p.id, p]));

  if (!mine.length) {
    return <Empty title="No suppliers to manage yet." action={<button className="button primary" onClick={() => onAddListing()}>Add a listing</button>}>Purchase orders restock your pairs. Receiving one adds the pairs to stock by size and writes the stock ledger.</Empty>;
  }

  return (
    <div className="st-stack">
      <div className="st-toolbar"><div><h2>Purchasing</h2><p className="muted">Order from suppliers, track what is late, and receive pairs into stock by size.</p></div></div>
      <div className="st-kpis four">
        <Kpi label="Open orders" value={open.length} sub={`${num(open.reduce((s, p) => s + p.qty, 0))} pairs on the way`} />
        <Kpi label="Open value" value={money(open.reduce((s, p) => s + p.qty * p.unitCost, 0))} sub="At supplier cost" />
        <Kpi label="Past ETA" value={delayed.length} sub={delayed.length ? "Follow up with the supplier" : "Everything is on schedule"} tone={delayed.length ? "critical" : "good"} />
        <Kpi label="Avg lead time" value={(() => { const l = suppliers.filter((s) => s.avgLeadDays !== null); return l.length ? `${(l.reduce((s, x) => s + x.avgLeadDays, 0) / l.length).toFixed(0)} days` : "No data"; })()} sub="Order to receipt" />
      </div>

      <Panel title="Purchase orders" aside={
        <div className="st-chips" role="group" aria-label="Show">
          <button aria-pressed={show === "open"} onClick={() => setShow("open")}>Open <b>{open.length}</b></button>
          <button aria-pressed={show === "all"} onClick={() => setShow("all")}>All <b>{pos.length}</b></button>
        </div>}>
        <div className="st-table-wrap short">
          <table className="st-table">
            <thead><tr><th>PO</th><th>Product</th><th>Supplier</th><th className="n">Pairs</th><th className="n">Total</th><th>Sizes</th><th>ETA</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {list.map((po) => {
                const state = poState(po, now);
                const p = byId.get(po.productId);
                return (
                  <tr key={po.id}>
                    <td><b>{po.id}</b><small className="block">{dateLabel(po.createdAt)}</small></td>
                    <td><span className="st-product static">{p && <img src={asset(p.image)} alt="" />}<span><b>{po.name}</b><small>{po.sku}</small></span></span></td>
                    <td>{po.supplier}</td>
                    <td className="n">{po.qty}</td>
                    <td className="n">{money(po.qty * po.unitCost)}</td>
                    <td className="sizes">{Object.entries(po.sizeSplit || {}).map(([s, q]) => `${s}×${q}`).join("  ")}</td>
                    <td>{po.status === "Received" ? `Received ${dateLabel(po.receivedAt)}` : dateLabel(po.eta)}</td>
                    <td><StatusChip status={state}>{state === "Delayed" ? `Delayed ${poDaysLate(po, now)}d` : state}</StatusChip></td>
                    <td className="act">
                      {po.status === "Ordered" && (busy === po.id ? (
                        <>
                          <button className="button ghost st-small danger" onClick={() => { onCancelPO(po.id); setBusy(null); }}>Cancel PO?</button>
                          <button className="text-link" onClick={() => setBusy(null)}>Keep</button>
                        </>
                      ) : (
                        <>
                          <button className="button primary st-small" onClick={() => onReceivePO(po.id)}>Receive</button>
                          <button className="text-link" onClick={() => setBusy(po.id)}>Cancel</button>
                        </>
                      ))}
                    </td>
                  </tr>
                );
              })}
              {!list.length && <tr><td colSpan={9}><Empty title={show === "open" ? "No open purchase orders." : "No purchase orders yet."}>Create one below or from the Forecast tab.</Empty></td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="st-grid two">
        <Panel title="New purchase order"><NewPO ctx={ctx} /></Panel>
        <Panel title="Suppliers">
          {suppliers.length ? (
            <div className="st-table-wrap short">
              <table className="st-table">
                <thead><tr><th>Supplier</th><th className="n">POs</th><th className="n">Open</th><th className="n">Late</th><th className="n">Lead</th><th className="n">Spend</th></tr></thead>
                <tbody>{suppliers.map((s) => (
                  <tr key={s.supplier}><td>{s.supplier}</td><td className="n">{s.orders}</td><td className="n">{s.open}</td><td className={"n " + (s.delayed ? "critical" : "")}>{s.delayed}</td>
                    <td className="n">{s.avgLeadDays === null ? "n/a" : `${s.avgLeadDays.toFixed(0)}d`}</td><td className="n">{money(s.spend)}</td></tr>))}</tbody>
              </table>
            </div>
          ) : <Empty title="Supplier performance appears after your first purchase order." />}
        </Panel>
      </div>
    </div>
  );
}
