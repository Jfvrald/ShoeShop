import React, { useMemo, useState } from "react";
import { ArrowUpRight, ChartLineUp, ClipboardText, Truck, Trophy } from "@phosphor-icons/react";
import { asset, money, STAGES } from "../../store";
import { revenueForecast, salesAnalytics, salesCSV } from "../../lib/erp";
import { ExportButton, Kpi, Panel, TrendChart, Empty, num, pct } from "./ui";

const TONE_ICON = { critical: "Act now", warning: "Soon", info: "Opportunity" };

export default function Overview({ ctx }) {
  const { user, products, orders, fulfil, actions, now, go, forecasts } = ctx;
  const [days, setDays] = useState(30);
  const data = useMemo(() => salesAnalytics(orders, products, user.id, days, now), [orders, products, user.id, days, now]);
  const projected = useMemo(() => revenueForecast(orders, user.id, now, 30), [orders, user.id, now]);
  const next30 = projected.reduce((s, p) => s + p.revenue, 0);
  const delta = data.delta;
  const hasSales = data.orders > 0;
  const actual = data.trend.slice(0, -1).map((p) => ({ day: p.day, a: p.revenue, b: p.profit }));
  const forecast = projected.map((p) => ({ day: p.day, v: p.revenue, low: p.low, high: p.high }));
  const pipeline = STAGES.map((s) => [s, fulfil.counts[s]]);
  const activeTotal = Math.max(1, fulfil.active);

  return (
    <div className="st-stack">
      <div className="st-toolbar">
        <div>
          <p className="eyebrow">Store performance</p>
          <h2>Business overview</h2>
          <p className="muted">What sold, what it earned, and what to do next. Figures are gross merchandise sales: no shipping, tax or payouts.</p>
        </div>
        <div className="st-controls">
          <label>Period
            <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </label>
          <ExportButton name={`sole-rise-sales-${days}-days.csv`} build={() => salesCSV(data.trend)} />
        </div>
      </div>

      <div className="st-kpis">
        <Kpi label="Gross sales" value={money(data.revenue)}
          sub={delta === null ? "No sales in the previous period" : `${delta >= 0 ? "Up" : "Down"} ${Math.abs(delta * 100).toFixed(1)}% vs previous ${days} days`}
          tone={delta === null ? "" : delta >= 0 ? "good" : "critical"} />
        <Kpi label="Gross profit" value={money(data.profit)} sub={`${pct(data.margin, 1)} margin after cost of goods`} />
        <Kpi label="Orders" value={num(data.orders)} sub={`${num(data.units)} pairs, avg ${money(data.average)}`} />
        <Kpi label="Sell-through" value={pct(data.sellThrough)} sub={`${num(data.units)} sold of ${num(data.units + data.onHand)} available`} />
        <Kpi label="Stock at cost" value={money(data.stockValueCost)} sub={`${num(data.onHand)} pairs, ${money(data.stockValueRetail)} at retail`} />
        <Kpi label="Next 30 days" value={money(next30)} sub="Forecast gross sales" />
      </div>

        <Panel title="Action centre" icon={ClipboardText} aside={<span>{actions.length} {actions.length === 1 ? "item" : "items"}</span>}>
          {actions.length ? (
            <ul className="st-actions wide">
              {actions.map((a) => (
                <li key={a.id} className={a.tone}>
                  <span className="tag">{TONE_ICON[a.tone]}</span>
                  <div>
                    <b>{a.title}</b>
                    <p>{a.detail}</p>
                  </div>
                  <button className="text-link" onClick={() => go(a.tab, a.filter)}>{a.cta} <ArrowUpRight size={14} weight="bold" /></button>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="Nothing needs you right now.">Reorders, late shipments, delayed suppliers and idle stock show up here when they matter.</Empty>
          )}
        </Panel>

      <div className="st-grid two">
        <Panel title="Sales, profit and forecast" icon={ChartLineUp} aside={<span>PHP · daily</span>}>
          {!hasSales && <p className="st-note">No sales in this period yet. The forecast fills in once orders arrive.</p>}
          <TrendChart key={days} boundary="Yesterday" actual={actual} forecast={hasSales ? forecast : []} labels={{ a: "Gross sales", b: "Gross profit" }} title="Daily gross sales and profit with a 30 day forecast" />
          <p className="st-foot">Forecast = recent level (newer weeks weigh more) + damped trend, adjusted for weekday pattern. The band is the likely 90% range.</p>
        </Panel>
        <Panel title="Top products" icon={Trophy} aside={<span>By gross sales</span>}>
          {data.topProducts.length ? (
            <ol className="st-top">
              {data.topProducts.slice(0, 6).map((p, i) => {
                const f = forecasts.find((x) => x.id === p.id);
                return (
                  <li key={p.id}>
                    <span className="rank">{i + 1}</span>
                    <img src={asset(p.image)} alt="" />
                    <div>
                      <b>{p.name}</b>
                      <small>{p.units} pairs · {pct(p.margin)} margin{f ? ` · ${f.status}` : ""}</small>
                      <span className="bar"><i style={{ width: `${(p.revenue / data.topProducts[0].revenue) * 100}%` }} /></span>
                    </div>
                    <strong>{money(p.revenue)}</strong>
                  </li>
                );
              })}
            </ol>
          ) : (
            <Empty title="Your best sellers show up after the first sale." />
          )}
        </Panel>

      </div>

      <div className="st-grid">
        <Panel title="Fulfillment pipeline" icon={Truck} aside={<button className="text-link" onClick={() => go("orders")}>Open orders <ArrowUpRight size={14} weight="bold" /></button>}>
          <div className="st-pipeline" role="img" aria-label={pipeline.map(([s, c]) => `${c} ${s}`).join(", ")}>
            {pipeline.filter(([s]) => s !== "Delivered").map(([s, c]) => (
              <span key={s} style={{ flex: c || 0.0001 }} className={"seg s" + STAGES.indexOf(s)}>{c > 0 && c}</span>
            ))}
          </div>
          <ul className="st-stage-list">
            {pipeline.map(([s, c]) => <li key={s}><span>{s}</span><b>{c}</b></li>)}
          </ul>
          <dl className="st-facts">
            <div><dt>Late now</dt><dd className={fulfil.late.length ? "critical" : ""}>{fulfil.late.length}{fulfil.late.length ? ` (${Math.round((fulfil.late.length / activeTotal) * 100)}% of open)` : ""}</dd></div>
            <div><dt>Avg time to ship</dt><dd>{fulfil.avgHoursToShip === null ? "No data" : `${fulfil.avgHoursToShip.toFixed(0)}h`}</dd></div>
            <div><dt>Delivered on time</dt><dd>{fulfil.onTimePct === null ? "No data" : pct(fulfil.onTimePct)}</dd></div>
          </dl>
        </Panel>

      </div>
    </div>
  );
}
