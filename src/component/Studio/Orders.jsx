import React, { useMemo, useState } from "react";
import { CaretDown, CaretRight, MagnifyingGlass, WarningCircle, CheckCircle, Circle } from "@phosphor-icons/react";
import { asset, money, STAGES, ownerKey } from "../../store";
import { nextStage, overdueHours, SLA_HOURS, stageTime } from "../../data/shipping";
import { Empty, StatusChip, dateTime, num } from "./ui";

const HOUR = 3600000;
const ACTION = { Packed: "Mark packed", Shipped: "Ship order", "Out for delivery": "Out for delivery", Delivered: "Mark delivered" };

const age = (iso, now) => {
  const hours = Math.max(0, Math.floor((+now - +new Date(iso)) / HOUR));
  return hours >= 48 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h`;
};

function Sla({ shipment, order, now }) {
  if (shipment.status === "Delivered") return <StatusChip status="Received">Delivered</StatusChip>;
  const late = overdueHours(shipment, order.date, now);
  if (late > 0) return <StatusChip status="Late">Late {late}h</StatusChip>;
  const due = +new Date(order.date) + SLA_HOURS[nextStage(shipment.status)] * HOUR - +now;
  return <StatusChip status="On time">On time, {Math.max(1, Math.round(due / HOUR))}h left</StatusChip>;
}

function Timeline({ order, shipment, now }) {
  return (
    <ol className="st-timeline" aria-label={`Delivery timeline for ${order.id}`}>
      {STAGES.map((stage) => {
        const at = stageTime(shipment, stage);
        const due = +new Date(order.date) + (SLA_HOURS[stage] || 0) * HOUR;
        const late = !at && +now > due;
        return (
          <li key={stage} className={at ? "done" : late ? "late" : ""}>
            {at ? <CheckCircle size={16} weight="fill" aria-hidden="true" /> : late ? <WarningCircle size={16} weight="fill" aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
            <div>
              <b>{stage}</b>
              <small>{at ? dateTime(at) : `Due ${dateTime(due)}${late ? ", overdue" : ""}`}</small>
            </div>
          </li>
        );
      })}
      <li className="meta">
        <div>
          <small>Courier</small><b>{shipment.courier || "Assigned when shipped"}</b>
          <small>Tracking</small><b className="mono">{shipment.tracking || "None yet"}</b>
          <small>Estimated delivery</small><b>{dateTime(shipment.eta)}</b>
        </div>
      </li>
    </ol>
  );
}

function Card({ row, user, now, onAdvance }) {
  const { order, shipment } = row;
  const [open, setOpen] = useState(false);
  const items = order.items.filter((i) => (i.ownerId || null) === user.id);
  const next = nextStage(shipment.status);
  return (
    <article className="st-order">
      <header>
        <b>{order.id}</b>
        <span>{age(order.date, now)} ago</span>
      </header>
      <p className="who">{order.recipient || "Customer"}</p>
      <ul>
        {items.map((i) => (
          <li key={i.id + i.size}>
            <img src={asset(i.image)} alt="" />
            <span>{i.name}<small>US {i.size} × {i.quantity} · {money(i.price * i.quantity)}</small></span>
          </li>
        ))}
      </ul>
      <div className="foot">
        <Sla shipment={shipment} order={order} now={now} />
        {next && <button className="button primary st-small" onClick={() => onAdvance(order.id, shipment.key)}>{ACTION[next]}</button>}
      </div>
      <button className="st-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? <CaretDown size={13} weight="bold" aria-hidden="true" /> : <CaretRight size={13} weight="bold" aria-hidden="true" />} Delivery timeline
      </button>
      {open && <Timeline order={order} shipment={shipment} now={now} />}
    </article>
  );
}

export default function Orders({ ctx }) {
  const { orders, user, now, fulfil, preset, onAdvanceShipment, mine, onAddListing } = ctx;
  const key = ownerKey(user.id);
  const [late, setLate] = useState(preset?.filter === "late");
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((o) => o.shipments?.[key])
      .map((order) => ({ order, shipment: order.shipments[key] }))
      .filter(({ order, shipment }) => (!late || (shipment.status !== "Delivered" && overdueHours(shipment, order.date, now) > 0)))
      .filter(({ order }) => !q || `${order.id} ${order.recipient}`.toLowerCase().includes(q))
      .sort((a, b) => +new Date(a.order.date) - +new Date(b.order.date));
  }, [orders, key, late, query, now]);

  if (!mine.length && !rows.length) {
    return <Empty title="No orders to fulfil." action={<button className="button primary" onClick={() => onAddListing()}>Add a listing</button>}>When a buyer checks out your pairs, the order lands in Placed and you move it along to delivery.</Empty>;
  }

  return (
    <div className="st-stack">
      <div className="st-toolbar">
        <div>
          <h2>Orders and delivery</h2>
          <p className="muted">Move each order left to right. Targets: packed within 24h, shipped within 48h, delivered within 96h of checkout. Buyers see every step on their own timeline.</p>
        </div>
      </div>
      <dl className="st-facts row">
        <div><dt>Open orders</dt><dd>{fulfil.active}</dd></div>
        <div><dt>Late</dt><dd className={fulfil.late.length ? "critical" : ""}>{fulfil.late.length}</dd></div>
        <div><dt>Avg time to ship</dt><dd>{fulfil.avgHoursToShip === null ? "No data" : `${fulfil.avgHoursToShip.toFixed(0)}h`}</dd></div>
        <div><dt>Delivered on time</dt><dd>{fulfil.onTimePct === null ? "No data" : `${Math.round(fulfil.onTimePct * 100)}%`}</dd></div>
        <div><dt>Oldest unshipped</dt><dd>{fulfil.oldestUnshipped ? `${fulfil.oldestUnshipped.orderId}, ${fulfil.oldestUnshipped.hours}h` : "None"}</dd></div>
      </dl>
      <div className="st-filters">
        <label className="st-search"><MagnifyingGlass size={16} aria-hidden="true" /><span className="sr-only">Search order or customer</span>
          <input type="search" placeholder="Search order or customer" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
        <label className="st-check"><input type="checkbox" checked={late} onChange={(e) => setLate(e.target.checked)} /> Late only ({fulfil.late.length})</label>
      </div>
      <div className="st-board">
        {STAGES.map((stage) => {
          let list = rows.filter((r) => r.shipment.status === stage);
          const total = list.length;
          if (stage === "Delivered") list = [...list].reverse().slice(0, 6);
          return (
            <section key={stage} className={"st-col s" + STAGES.indexOf(stage)} aria-label={`${stage}, ${total} orders`}>
              <h3>{stage} <b>{num(total)}</b></h3>
              {list.map((row) => <Card key={row.order.id} row={row} user={user} now={now} onAdvance={onAdvanceShipment} />)}
              {!list.length && <p className="empty">{late ? "None late." : "Nothing here."}</p>}
              {stage === "Delivered" && total > list.length && <p className="empty">Latest {list.length} of {total}</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
