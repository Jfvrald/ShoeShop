import React, { useMemo, useState } from "react";
import { asset, money } from "../../store";
import { forecastCSV, inventoryCSV, salesAnalytics, salesCSV } from "../../lib/erp";
import { BarChart, Empty, ExportButton, Panel, StatusChip, num, pct } from "./ui";

export default function Reports({ ctx }) {
  const { user, products, orders, forecasts, mine, now, onAddListing } = ctx;
  const [days, setDays] = useState(90);
  const data = useMemo(() => salesAnalytics(orders, products, user.id, days, now), [orders, products, user.id, days, now]);
  const unitsById = new Map(data.topProducts.map((p) => [p.id, p]));
  const dead = forecasts.filter((f) => (f.status === "Slow mover" || f.status === "Overstock") && f.onHand > 0);
  const tied = dead.reduce((s, f) => s + f.onHand * f.product.cost, 0);
  const brandMax = Math.max(1, ...data.brandMix.map((b) => b.revenue));
  const byId = new Map(products.map((p) => [p.id, p]));

  if (!mine.length) {
    return <Empty title="No reports yet." action={<button className="button primary" onClick={() => onAddListing()}>Add a listing</button>}>Margin, sell-through, size demand and dead stock reports build from your listings and sales.</Empty>;
  }

  return (
    <div className="st-stack">
      <div className="st-toolbar">
        <div><h2>Reports</h2><p className="muted">Where the money is made and where it is stuck. Decide what to reorder, push or mark down.</p></div>
        <div className="st-controls">
          <label>Period<select value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></label>
          <ExportButton name={`sole-rise-sales-${days}-days.csv`} build={() => salesCSV(data.trend)} label="Sales CSV" />
          <ExportButton name="sole-rise-inventory.csv" build={() => inventoryCSV(mine, forecasts)} label="Inventory CSV" />
          <ExportButton name="sole-rise-forecast.csv" build={() => forecastCSV(forecasts)} label="Forecast CSV" />
        </div>
      </div>

      <Panel title="ABC analysis" aside={<span>A: first 80% of sales · B: next 15% · C: the rest</span>}>
        <div className="st-table-wrap short">
          <table className="st-table">
            <thead><tr><th>Class</th><th>Product</th><th className="n">Pairs</th><th className="n">Gross sales</th><th className="n">Share</th><th className="n">Cumulative</th><th className="n">Margin</th><th className="n">Sell-through</th><th className="n">On hand</th></tr></thead>
            <tbody>
              {data.abc.map((row) => {
                const s = unitsById.get(row.id);
                const p = byId.get(row.id);
                return (
                  <tr key={row.id}>
                    <td><span className={"st-class " + row.class}>{row.class}</span></td>
                    <td><span className="st-product static"><img src={asset(p.image)} alt="" /><span><b>{row.name}</b><small>{row.brand}</small></span></span></td>
                    <td className="n">{s?.units || 0}</td>
                    <td className="n">{money(row.revenue)}</td>
                    <td className="n">{pct(row.share, 1)}</td>
                    <td className="n">{pct(row.cumulative)}</td>
                    <td className="n">{s ? pct(s.margin) : "·"}</td>
                    <td className="n">{(s?.units || 0) + row.onHand ? pct((s?.units || 0) / ((s?.units || 0) + row.onHand)) : "·"}</td>
                    <td className="n">{row.onHand}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="st-grid two">
        <Panel title="Sales and margin by brand" aside={<span>Bar = gross sales</span>}>
          {data.brandMix.length ? (
            <ul className="st-hbars">
              {data.brandMix.map((b) => (
                <li key={b.brand}>
                  <span className="name">{b.brand}</span>
                  <span className="track"><i style={{ width: `${(b.revenue / brandMax) * 100}%` }} /></span>
                  <span className="v"><b>{money(b.revenue)}</b><small>{pct(b.revenue ? b.profit / b.revenue : 0)} margin</small></span>
                </li>
              ))}
            </ul>
          ) : <Empty title="No sales in this period." />}
        </Panel>
        <Panel title="Size curve" aside={<span>Pairs sold by US size</span>}>
          {data.sizeCurve.length ? <BarChart data={data.sizeCurve.map((s) => ({ label: s.size, value: s.units }))} title="Pairs sold by size" /> : <Empty title="No sales in this period." />}
          <p className="st-foot">Use this to split purchase orders: stock more of the sizes that actually sell.</p>
        </Panel>
      </div>

      <Panel title="Dead and slow stock" aside={<span>{money(tied)} tied up at cost</span>}>
        {dead.length ? (
          <div className="st-table-wrap short">
            <table className="st-table">
              <thead><tr><th>Product</th><th>Status</th><th className="n">On hand</th><th className="n">Sold (28d)</th><th className="n">Capital at cost</th><th className="n">At retail</th></tr></thead>
              <tbody>{dead.sort((a, b) => b.onHand * b.product.cost - a.onHand * a.product.cost).map((f) => (
                <tr key={f.id}>
                  <td><span className="st-product static"><img src={asset(f.product.image)} alt="" /><span><b>{f.product.name}</b><small>{f.product.sku}</small></span></span></td>
                  <td><StatusChip status={f.status} /></td><td className="n">{f.onHand}</td><td className="n">{f.units28}</td>
                  <td className="n">{money(f.onHand * f.product.cost)}</td><td className="n">{money(f.onHand * f.product.price)}</td>
                </tr>))}</tbody>
            </table>
          </div>
        ) : <Empty title="No dead stock." >Every SKU with stock sold something in the last 28 days.</Empty>}
        <p className="st-foot">{num(dead.reduce((s, f) => s + f.onHand, 0))} pairs. Consider a markdown or a bundle to free the capital.</p>
      </Panel>
    </div>
  );
}
