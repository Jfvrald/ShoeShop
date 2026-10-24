import React, { useMemo, useState } from "react";
import { Info, ShoppingCartSimple } from "@phosphor-icons/react";
import { asset, money } from "../../store";
import { dayKey, forecastCSV, nextPOId, suggestSizeSplit, WATCHER_CAP, WATCHER_DIVISOR, SERVICE_Z } from "../../lib/erp";
import { Empty, ExportButton, Panel, StatusChip, TrendChart, cover, dateLabel, num } from "./ui";

const DAY = 86400000;
const needsPO = (f) => f.suggestedQty > 0 && ["Out of stock", "Reorder now", "Reorder soon"].includes(f.status);
const STATUSES = ["Out of stock", "Reorder now", "Reorder soon", "On order", "Healthy", "Slow mover", "Overstock"];

export function buildPO(f, orders, purchaseOrders, now, taken = []) {
  const p = f.product;
  const ids = [...purchaseOrders.map((po) => po.id), ...taken];
  return {
    id: nextPOId(ids.map((id) => ({ id }))),
    ownerId: p.ownerId,
    productId: p.id,
    sku: p.sku,
    name: p.name,
    supplier: p.supplier,
    qty: f.suggestedQty,
    unitCost: p.cost,
    sizeSplit: suggestSizeSplit(orders, p, f.suggestedQty, now),
    status: "Ordered",
    createdAt: new Date(now).toISOString(),
    eta: new Date(+now + f.leadDays * DAY).toISOString(),
    receivedAt: null,
  };
}

export default function Forecast({ ctx }) {
  const { forecasts, orders, purchaseOrders, now, onCreatePO, mine, onAddListing } = ctx;
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, forecasts.filter((f) => f.status === s).length])), [forecasts]);
  const rows = forecasts.filter((f) => filter === "All" || f.status === filter);
  const current = forecasts.find((f) => f.id === selected) || rows[0] || forecasts[0];
  const suggestions = forecasts.filter(needsPO);

  if (!mine.length) {
    return <Empty title="Nothing to forecast yet." action={<button className="button primary" onClick={() => onAddListing()}>Add a listing</button>}>Once pairs sell, the studio projects demand, tells you when each SKU runs out and how many to reorder.</Empty>;
  }

  function create(list) {
    const taken = [];
    list.forEach((f) => {
      const po = buildPO(f, orders, purchaseOrders, now, taken);
      taken.push(po.id);
      onCreatePO(po);
    });
    const suppliers = new Set(list.map((f) => f.product.supplier));
    const total = list.reduce((s, f) => s + f.suggestedQty * f.product.cost, 0);
    setMessage(`${list.length} purchase ${list.length === 1 ? "order" : "orders"} created across ${suppliers.size} ${suppliers.size === 1 ? "supplier" : "suppliers"}, ${money(total)} at cost. Track them in Purchasing.`);
  }

  const chartActual = current.history.map((h) => ({ day: h.day, a: h.units }));
  const chartForecast = Array.from({ length: 30 }, (_, i) => ({
    day: dayKey(+now + i * DAY), v: current.velocity, low: current.band.low, high: current.band.high,
  }));
  const p = current.product;

  return (
    <div className="st-stack">
      <div className="st-toolbar">
        <div>
          <h2>Demand forecast</h2>
          <p className="muted">How fast each SKU sells, when it runs out, and what to order so you never miss a sale or sit on dead stock.</p>
        </div>
        <div className="st-controls">
          <button className="button primary st-small" disabled={!suggestions.length} onClick={() => create(suggestions)}>
            <ShoppingCartSimple size={15} weight="bold" /> Create all suggested POs ({suggestions.length})
          </button>
          <ExportButton name="sole-rise-forecast.csv" build={() => forecastCSV(forecasts)} />
        </div>
      </div>
      {message && <p className="st-banner" role="status">{message}</p>}

      <div className="st-chips" role="group" aria-label="Filter by status">
        <button aria-pressed={filter === "All"} onClick={() => setFilter("All")}>All <b>{forecasts.length}</b></button>
        {STATUSES.filter((s) => counts[s]).map((s) => <button key={s} aria-pressed={filter === s} onClick={() => setFilter(s)}>{s} <b>{counts[s]}</b></button>)}
      </div>

      <div className="st-table-wrap">
        <table className="st-table">
          <thead><tr>
            <th>Product</th><th>Status</th><th className="n">Pairs/day</th><th className="n">Next 30 days</th><th className="n">On hand</th><th className="n">Cover (days)</th>
            <th>Runs out</th><th className="n">Reorder at</th><th className="n">On order</th><th className="n">Suggest</th><th><span className="sr-only">Action</span></th>
          </tr></thead>
          <tbody>
            {rows.map((f) => (
              <tr key={f.id} className={current.id === f.id ? "selected" : ""}>
                <td><button className="st-product" aria-pressed={current.id === f.id} onClick={() => setSelected(f.id)}>
                  <img src={asset(f.product.image)} alt="" /><span><b>{f.product.name}</b><small>{f.product.sku} · lead {f.leadDays}d · {f.product.supplier}</small></span></button></td>
                <td><StatusChip status={f.status} /></td>
                <td className="n">{f.velocity.toFixed(2)}</td>
                <td className="n">{f.forecastUnits}</td>
                <td className="n"><b>{f.onHand}</b></td>
                <td className="n">{cover(f.daysOfCover)}</td>
                <td>{f.onHand === 0 ? "Now" : f.stockoutDate && f.daysOfCover < 120 ? dateLabel(f.stockoutDate) : "Not soon"}</td>
                <td className="n">{f.reorderPoint}</td>
                <td className="n">{f.openPO || "·"}</td>
                <td className="n"><b>{needsPO(f) ? f.suggestedQty : "·"}</b></td>
                <td className="act">{needsPO(f) &&
                  <button className="button ghost st-small" onClick={() => create([f])}>Create PO</button>}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={11}><Empty title="No SKUs with this status." /></td></tr>}
          </tbody>
        </table>
      </div>

      <div className="st-grid two">
        <Panel title={`Demand history and forecast: ${p.name}`} aside={<StatusChip status={current.status} />}>
          <TrendChart key={current.id} actual={chartActual} forecast={chartForecast} fmt={(v) => `${(+v).toFixed(1)} pairs`} boundary="Yesterday" labels={{ a: "Pairs sold per day" }} title={`Daily pairs sold of ${p.name} with a 30 day forecast`} />
        </Panel>
        <Panel title="Why this number" icon={Info}>
          <dl className="st-facts stack">
            <div><dt>Recent demand</dt><dd>{current.baseVelocity.toFixed(2)} pairs/day <small>{current.units28} sold in 28 days, newer weeks weigh more</small></dd></div>
            <div><dt>Community uplift</dt><dd>+{(current.uplift * 100).toFixed(0)}% <small>{p.watchers} buyers saved this pair</small></dd></div>
            <div><dt>Forecast</dt><dd>{current.velocity.toFixed(2)} pairs/day <small>about {current.forecastUnits} pairs in 30 days</small></dd></div>
            <div><dt>Safety stock</dt><dd>{current.safetyStock} pairs <small>covers swings in demand during the {current.leadDays}-day supplier lead time</small></dd></div>
            <div><dt>Reorder point</dt><dd>{current.reorderPoint} pairs <small>{current.velocity.toFixed(2)} × {current.leadDays} days + safety</small></dd></div>
            <div><dt>Suggested order</dt><dd>{current.suggestedQty} pairs <small>to cover {current.leadDays + 30} days, less {current.onHand} on hand{current.openPO ? ` and ${current.openPO} on order` : ""}</small></dd></div>
          </dl>
          <details className="st-assume">
            <summary>Assumptions</summary>
            <p>Demand is the last 28 days of sales with newer weeks weighted 1 to 4, nudged by the sales trend. Saved pairs lift demand by saves ÷ {num(WATCHER_DIVISOR)}, capped at {WATCHER_CAP * 100}%: an assumption, not a measured conversion rate. Safety stock uses {SERVICE_Z} standard deviations (about 90% service level). Forecasts ignore promotions and seasonality beyond the weekday pattern.</p>
          </details>
        </Panel>
      </div>
    </div>
  );
}
