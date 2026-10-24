import React, { useEffect, useMemo, useRef, useState } from "react";
import { actionCentre, forecastAll, fulfillmentStats } from "../../lib/erp";
import { ownerKey } from "../../store";
import { Plus } from "@phosphor-icons/react";
import Overview from "./Overview";
import Inventory from "./Inventory";
import Forecast from "./Forecast";
import Orders from "./Orders";
import Purchasing from "./Purchasing";
import Reports from "./Reports";
import "./Studio.css";

const TABS = [
  ["overview", "Overview"],
  ["inventory", "Inventory"],
  ["forecast", "Forecast"],
  ["orders", "Orders"],
  ["purchasing", "Purchasing"],
  ["reports", "Reports"],
];
const KEY = "sole-rise-studio-tab";
const read = () => {
  try {
    const value = sessionStorage.getItem(KEY);
    return TABS.some(([id]) => id === value) ? value : "overview";
  } catch {
    return "overview";
  }
};

export default function Studio(props) {
  const { user, products, orders, purchaseOrders = [], movements = [], onAddListing, onAccountTab } = props;
  const [tab, setTab] = useState(read);
  const [preset, setPreset] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const refs = useRef([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const mine = useMemo(() => products.filter((p) => p.ownerId === user.id), [products, user.id]);
  const forecasts = useMemo(() => forecastAll(orders, products, purchaseOrders, user.id, now), [orders, products, purchaseOrders, user.id, now]);
  const fulfil = useMemo(() => fulfillmentStats(orders, user.id, now), [orders, user.id, now]);
  const actions = useMemo(() => actionCentre({ products, orders, purchaseOrders, ownerId: user.id, now }), [products, orders, purchaseOrders, user.id, now]);

  function go(next, filter) {
    setPreset(filter ? (next === "inventory" ? { status: filter } : { filter }) : null);
    setTab(next);
    try {
      sessionStorage.setItem(KEY, next);
    } catch {
      /* the tab simply is not remembered */
    }
  }
  function onKeyDown(event, index) {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    const target = event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : step === undefined ? null : (index + step + TABS.length) % TABS.length;
    if (target === null) return;
    event.preventDefault();
    go(TABS[target][0]);
    refs.current[target]?.focus();
  }

  const badge = { forecast: actions.filter((a) => a.tab === "forecast" && a.tone !== "info").length, orders: fulfil.late.length, purchasing: actions.some((a) => a.id === "po-delayed") ? 1 : 0 };
  const ctx = { ...props, purchaseOrders, movements, mine, forecasts, fulfil, actions, now, go, preset, ownerKey: ownerKey(user.id) };
  const View = { overview: Overview, inventory: Inventory, forecast: Forecast, orders: Orders, purchasing: Purchasing, reports: Reports }[tab];

  return (
    <div className="studio">
      <div className="st-tabs" role="tablist" aria-label="Studio sections">
        {TABS.map(([id, label], index) => (
          <button
            key={id}
            ref={(node) => (refs.current[index] = node)}
            role="tab"
            id={"st-tab-" + id}
            aria-selected={tab === id}
            aria-controls="st-panel"
            tabIndex={tab === id ? 0 : -1}
            className={tab === id ? "active" : ""}
            onClick={() => go(id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {label}
            {badge[id] > 0 && <b aria-label={`${badge[id]} need attention`}>{badge[id]}</b>}
          </button>
        ))}
        <button className="text-link st-account" onClick={onAccountTab}>Account settings</button>
      </div>
      <div id="st-panel" role="tabpanel" aria-labelledby={"st-tab-" + tab} tabIndex={-1}>
        {!mine.length && tab === "overview" ? (
          <div className="st-welcome">
            <p className="eyebrow">Your studio is ready</p>
            <h2>List your first pair to switch it on.</h2>
            <p className="muted">Every listing becomes a tracked SKU. Then the studio works for you:</p>
            <ul>
              <li><b>Inventory</b> counts stock by size and warns you at your reorder point.</li>
              <li><b>Forecast</b> predicts demand and tells you what to order and when.</li>
              <li><b>Orders</b> takes each sale from packed to delivered, with a timeline your buyer sees.</li>
              <li><b>Purchasing</b> and <b>Reports</b> track suppliers, margin and slow stock.</li>
            </ul>
            <button className="button primary" onClick={() => onAddListing()}><Plus size={16} weight="bold" /> Add your first listing</button>
          </div>
        ) : (
          <View key={tab + (preset ? JSON.stringify(preset) : "")} ctx={ctx} />
        )}
      </div>
    </div>
  );
}
