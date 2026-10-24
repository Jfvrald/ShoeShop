import React, { useId, useState } from "react";
import {
  CheckCircle, Hourglass, Stack, Truck, Warning, WarningCircle, XCircle, DownloadSimple,
} from "@phosphor-icons/react";
import { money } from "../../store";

export const num = (value) => Math.round(value).toLocaleString("en-PH");
export const pct = (value, digits = 0) => `${(value * 100).toFixed(digits)}%`;
export const compact = (value) =>
  value >= 1e6 ? `${(value / 1e6).toFixed(1)}M` : value >= 1e3 ? `${Math.round(value / 1e3)}k` : String(Math.round(value));
export const dateLabel = (day) =>
  new Date(`${String(day).slice(0, 10)}T12:00:00+08:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
export const dateTime = (iso) =>
  new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });
export const cover = (days) => (Number.isFinite(days) ? (days > 365 ? "365+" : days.toFixed(days < 10 ? 1 : 0)) : "No sales");

const STATUS = {
  "Out of stock": [XCircle, "critical"],
  "Reorder now": [WarningCircle, "critical"],
  "Reorder soon": [Warning, "warning"],
  "On order": [Truck, "info"],
  Healthy: [CheckCircle, "good"],
  "Slow mover": [Hourglass, "muted"],
  Overstock: [Stack, "muted"],
  Delayed: [WarningCircle, "critical"],
  Ordered: [Truck, "info"],
  Received: [CheckCircle, "good"],
  Cancelled: [XCircle, "muted"],
  Late: [WarningCircle, "critical"],
  "On time": [CheckCircle, "good"],
};

export function StatusChip({ status, children }) {
  const [Icon, tone] = STATUS[status] || [CheckCircle, "muted"];
  return (
    <span className={"st-chip " + tone}>
      <Icon size={13} weight="fill" aria-hidden="true" />
      {children || status}
    </span>
  );
}

export function Kpi({ label, value, sub, tone }) {
  return (
    <article className="st-kpi">
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <small className={tone}>{sub}</small>}
    </article>
  );
}

export function Panel({ title, icon: Icon, aside, children, className = "" }) {
  return (
    <section className={"st-panel " + className}>
      <header>
        <h3>
          {Icon && <Icon size={18} aria-hidden="true" />} {title}
        </h3>
        {aside && <div className="st-panel-aside">{aside}</div>}
      </header>
      {children}
    </section>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="st-empty">
      <h4>{title}</h4>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function download(name, csv) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ExportButton({ name, build, label = "Export CSV" }) {
  return (
    <button className="button ghost st-small" onClick={() => download(name, build())}>
      <DownloadSimple size={15} aria-hidden="true" /> {label}
    </button>
  );
}

/* Inline number editor: commits on Enter or blur, reverts on Escape. */
export function NumberCell({ value, onCommit, min = 0, label, prefix = "" }) {
  const [draft, setDraft] = useState(null);
  const shown = draft ?? String(value);
  function commit() {
    const next = Number(draft);
    setDraft(null);
    if (draft !== null && Number.isFinite(next) && next >= min && next !== value) onCommit(Math.round(next));
  }
  return (
    <span className="st-cell-input">
      {prefix && <i aria-hidden="true">{prefix}</i>}
      <input
        aria-label={label}
        type="number"
        inputMode="numeric"
        min={min}
        value={shown}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") setDraft(null);
        }}
      />
    </span>
  );
}

/* ---- Charts (hand-built SVG) ------------------------------------------------------ */
const niceMax = (value) => {
  if (value <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(value));
  const n = value / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
};

/* Actual series (solid) followed by a dashed forecast with a 90% band.
   actual: [{day, a, b?}]  forecast: [{day, v, low, high}] */
export function TrendChart({ actual, forecast = [], labels, fmt = money, title, boundary = "Today" }) {
  const id = useId();
  const [active, setActive] = useState(null);
  const W = 760, H = 270, L = 48, R = 18, T = 14, B = 30;
  const n = actual.length + forecast.length;
  const step = (W - L - R) / Math.max(1, n - 1);
  const top = niceMax(Math.max(...actual.map((p) => Math.max(p.a, p.b || 0)), ...forecast.map((p) => p.high), 1));
  const x = (i) => L + i * step;
  const y = (v) => T + (1 - v / top) * (H - T - B);
  const today = actual.length - 1;
  const index = active ?? today;
  const path = (points, pick, offset = 0) => points.map((p, i) => `${i ? "L" : "M"}${x(i + offset).toFixed(1)},${y(pick(p)).toFixed(1)}`).join(" ");
  const last = actual[today];
  const forecastLine = forecast.length ? `M${x(today)},${y(last.a)} ` + forecast.map((p, i) => `L${x(today + 1 + i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ") : "";
  const band = forecast.length
    ? forecast.map((p, i) => `${i ? "L" : "M"}${x(today + 1 + i).toFixed(1)},${y(p.high).toFixed(1)}`).join(" ") + " " +
      [...forecast].reverse().map((p, i) => `L${x(n - 1 - i).toFixed(1)},${y(p.low).toFixed(1)}`).join(" ") + " Z"
    : "";
  const cur = index <= today ? actual[index] : forecast[index - today - 1];
  const inForecast = index > today;
  const onMove = (event) => {
    const box = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * W;
    setActive(Math.min(n - 1, Math.max(0, Math.round((px - L) / step))));
  };
  const ticks = [0, 0.5, 1];
  return (
    <figure className="st-chart">
      <div className="st-readout" aria-live="polite">
        <span>{dateLabel(cur.day)}{inForecast ? " · forecast" : ""}</span>
        {inForecast ? (
          <>
            <strong>{fmt(cur.v)}</strong>
            <small>Likely range {fmt(cur.low)} to {fmt(cur.high)}</small>
          </>
        ) : (
          <>
            <strong>{fmt(cur.a)}</strong>
            {labels.b && <small>{labels.b} {fmt(cur.b || 0)}</small>}
          </>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ aspectRatio: `${W} / ${H}` }} role="img" aria-labelledby={id} onPointerMove={onMove} onPointerLeave={() => setActive(null)}>
        <title id={id}>{title || `${labels.a} over time with forecast`}. Daily values are in the table below the chart.</title>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(top * t)} y2={y(top * t)} className="grid" />
            <text x={L - 8} y={y(top * t) + 4} textAnchor="end">{compact(top * t)}</text>
          </g>
        ))}
        {forecast.length > 0 && <rect x={x(today)} y={T} width={x(n - 1) - x(today)} height={H - T - B} className="future" />}
        {band && <path d={band} className="band" />}
        {labels.b && <path d={path(actual, (p) => p.b || 0)} className="line b" />}
        <path d={path(actual, (p) => p.a)} className="line a" />
        {forecastLine && <path d={forecastLine} className="line f" />}
        {forecast.length > 0 && (
          <>
            <line x1={x(today)} x2={x(today)} y1={T} y2={H - B} className="today" />
            <text x={x(today) - 6} y={T + 10} textAnchor="end" className="tag">{boundary}</text>
            <text x={x(n - 1)} y={H - B + 28} textAnchor="end" className="tag">{dateLabel(forecast[forecast.length - 1].day)}</text>
          </>
        )}
        <text x={L} y={H - 8}>{dateLabel(actual[0].day)}</text>
        <line x1={x(index)} x2={x(index)} y1={T} y2={H - B} className="cursor" />
        <circle cx={x(index)} cy={y(inForecast ? cur.v : cur.a)} r="5" className={"dot " + (inForecast ? "f" : "a")} />
        {!inForecast && labels.b && <circle cx={x(index)} cy={y(cur.b || 0)} r="4" className="dot b" />}
      </svg>
      <div className="st-legend">
        <span><i className="sw a" />{labels.a}</span>
        {labels.b && <span><i className="sw b" />{labels.b}</span>}
        {forecast.length > 0 && <span><i className="sw f" />Forecast, with 90% range</span>}
      </div>
      <label className="st-scrub">
        Explore daily values
        <input type="range" min="0" max={n - 1} value={index} onChange={(event) => setActive(Number(event.target.value))}
          aria-valuetext={`${dateLabel(cur.day)}, ${fmt(inForecast ? cur.v : cur.a)}`} />
      </label>
      <details className="st-table-disclosure">
        <summary>View data table</summary>
        <div className="st-table-wrap short">
          <table>
            <thead><tr><th>Date</th><th>{labels.a}</th>{labels.b && <th>{labels.b}</th>}<th>Forecast</th></tr></thead>
            <tbody>
              {actual.map((p) => <tr key={p.day}><td>{dateLabel(p.day)}</td><td>{fmt(p.a)}</td>{labels.b && <td>{fmt(p.b || 0)}</td>}<td /></tr>)}
              {forecast.map((p) => <tr key={p.day}><td>{dateLabel(p.day)}</td><td />{labels.b && <td />}<td>{fmt(p.v)} ({fmt(p.low)} to {fmt(p.high)})</td></tr>)}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

export function BarChart({ data, fmt = num, unit = "pairs", title }) {
  const id = useId();
  const [active, setActive] = useState(null);
  const W = 560, H = 190, T = 22, B = 26;
  const max = Math.max(1, ...data.map((d) => d.value));
  const slot = (W - 20) / Math.max(1, data.length);
  const bw = Math.min(40, slot - 8);
  return (
    <figure className="st-chart bars">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ aspectRatio: `${W} / ${H}` }} role="img" aria-labelledby={id}>
        <title id={id}>{title}: {data.map((d) => `${d.label} ${fmt(d.value)} ${unit}`).join(", ")}</title>
        <line x1="10" x2={W - 10} y1={H - B} y2={H - B} className="grid" />
        {data.map((d, i) => {
          const h = Math.max(d.value ? 3 : 0, (d.value / max) * (H - T - B));
          const x = 10 + i * slot + (slot - bw) / 2;
          const y = H - B - h;
          const r = Math.min(4, h);
          return (
            <g key={d.label} onPointerEnter={() => setActive(i)} onPointerLeave={() => setActive(null)} className={active === i ? "hot" : ""}>
              <rect x={10 + i * slot} y={T - 6} width={slot} height={H - T - B + 6} fill="transparent"><title>{d.label}: {fmt(d.value)} {unit}</title></rect>
              {d.value > 0 && <path className="bar" d={`M${x},${H - B} V${y + r} a${r},${r} 0 0 1 ${r},${-r} h${bw - 2 * r} a${r},${r} 0 0 1 ${r},${r} V${H - B} Z`} />}
              <text x={x + bw / 2} y={H - 8} textAnchor="middle">{d.label}</text>
              {(active === i || d.value === max) && d.value > 0 && <text x={x + bw / 2} y={y - 6} textAnchor="middle" className="val">{fmt(d.value)}</text>}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
