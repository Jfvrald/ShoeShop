import React, { useState } from "react";
import {
  Plus,
  SignOut,
  ArrowsClockwise,
  Storefront,
  HandbagSimple,
  ArrowUpRight,
  Check,
  Truck,
  Package,
  ChartLineUp,
  ClipboardText,
} from "@phosphor-icons/react";
import { asset, money, ROLES, canSell } from "../../store";
import { STAGES, ownerKey, stageTime, nextStage } from "../../data/shipping";
import Studio from "../Studio/Studio";
import "./Account.css";

const ROLE_ICON = { Buyer: HandbagSimple, Seller: Storefront, Reseller: ArrowsClockwise };
const when = (iso) =>
  new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const day = (iso) => new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });

export function SellPitch({ user, onJoin, onUpgrade, navigate }) {
  const features = [
    [Package, "Inventory by size", "Per-size stock, SKUs, bins and a stock ledger."],
    [ChartLineUp, "Demand forecast", "Velocity, days of cover and reorder points from your own sales and community saves."],
    [Truck, "Delivery timeline", "Pack, ship and deliver with SLA alerts and tracking."],
    [ClipboardText, "Purchasing", "Purchase orders, supplier lead times and receiving."],
  ];
  return (
    <section className="section sell-page">
      <div className="page-intro">
        <h1>Sell on Sole Rise.</h1>
        <p>Open a storefront for new pairs, or run a resale shelf of pre-loved ones. Both get the full studio.</p>
      </div>
      <ul className="pitch-features">
        {features.map(([Icon, title, text]) => (
          <li key={title}>
            <Icon size={26} weight="duotone" aria-hidden="true" />
            <b>{title}</b>
            <span>{text}</span>
          </li>
        ))}
      </ul>
      <div className="role-cards">
        {["Seller", "Reseller"].map((role) => {
          const Icon = ROLE_ICON[role];
          return (
            <article key={role} className={"role-card " + role.toLowerCase()}>
              <Icon size={34} weight="duotone" aria-hidden="true" />
              <h2>{role === "Seller" ? "Seller account" : "Reseller account"}</h2>
              <p>{ROLES[role].blurb}</p>
              <ul>
                {ROLES[role].perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
              <button className="button primary" onClick={() => (user ? onUpgrade(role) : onJoin(role))}>
                {user ? `Switch to ${role}` : `Join as ${role}`}
                <ArrowUpRight size={16} weight="bold" />
              </button>
            </article>
          );
        })}
      </div>
      <p className="notice">
        Local demo. Try the demo seller (seller@solerise.demo, password demo1234) for 90 days of sample orders. No real sales, payments or payouts happen.
      </p>
      {user && (
        <button className="text-link" onClick={() => navigate("account")}>
          Back to your account
        </button>
      )}
    </section>
  );
}

function Tracker({ shipment, placedAt }) {
  const reached = STAGES.indexOf(shipment.status);
  const upcoming = nextStage(shipment.status);
  return (
    <div className="tracker">
      <div className="tracker-head">
        <b>{shipment.status}</b>
        <span>
          {shipment.status === "Delivered"
            ? `Delivered ${when(stageTime(shipment, "Delivered"))}`
            : `Estimated by ${day(shipment.eta || placedAt)}`}
        </span>
      </div>
      <ol aria-label={`Delivery timeline from ${shipment.seller}`}>
        {STAGES.map((stage, i) => (
          <li key={stage} className={i < reached ? "done" : i === reached ? (stage === "Delivered" ? "done" : "now") : ""}>
            <i aria-hidden="true">{(i < reached || (i === reached && stage === "Delivered")) && <Check size={10} weight="bold" />}</i>
            <span>
              {stage}
              <small>{stageTime(shipment, stage) ? when(stageTime(shipment, stage)) : upcoming === stage ? "Next" : ""}</small>
            </span>
          </li>
        ))}
      </ol>
      {shipment.tracking && (
        <p className="tracker-meta">
          <Truck size={14} aria-hidden="true" /> {shipment.courier}, tracking {shipment.tracking}
        </p>
      )}
    </div>
  );
}

function Orders({ orders, user, onRelist }) {
  const mine = orders.filter((o) => o.buyerId === user.id);
  const reseller = user.role === "Reseller";
  if (!mine.length)
    return (
      <div className="empty-state">
        <h3>No purchases yet.</h3>
        <p>Your completed demo checkouts will appear here with a live delivery timeline.</p>
      </div>
    );
  return (
    <div className="order-list">
      {mine.map((order) => (
        <div className="order-row" key={order.id}>
          <div className="order-head">
            <div>
              <b>{order.id}</b>
              <p>
                {order.items.reduce((s, i) => s + i.quantity, 0)} pair(s) on {new Date(order.date).toLocaleDateString("en-PH")}
              </p>
            </div>
            <span>
              {money(order.total)}
              <small>{order.shipping ? `incl. ${money(order.shipping)} delivery` : "Free delivery"}</small>
            </span>
          </div>
          {Object.values(order.shipments || {}).map((shipment) => (
            <div className="shipment" key={shipment.key}>
              <p className="shipment-from">Shipment from {shipment.seller}</p>
              <ul className="order-items">
                {order.items
                  .filter((item) => ownerKey(item.ownerId) === shipment.key)
                  .map((item) => (
                    <li key={item.id + item.size}>
                      <img src={asset(item.image)} alt="" />
                      <span>
                        {item.name}
                        <small>
                          US {item.size}, qty {item.quantity}
                        </small>
                      </span>
                      {reseller && (
                        <button className="text-link" onClick={() => onRelist(item)}>
                          <ArrowsClockwise size={14} weight="bold" /> Relist
                        </button>
                      )}
                    </li>
                  ))}
              </ul>
              <Tracker shipment={shipment} placedAt={order.date} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function AccountPage({
  user,
  products,
  orders,
  purchaseOrders,
  movements,
  reviews,
  wishlist,
  onOpen,
  onAddListing,
  studioActions,
  onRole,
  onSignOut,
  onReset,
  joinedCount,
  navigate,
}) {
  const seller = canSell(user);
  const [tab, setTab] = useState(seller ? "studio" : "orders");
  const saved = products.filter((p) => wishlist.includes(p.id));
  const tabs = seller
    ? [["studio", "Studio"], ["orders", "My purchases"], ["settings", "Account"]]
    : [["orders", "Orders"], ["saved", "Saved"], ["settings", "Account"]];
  const current = tabs.some(([id]) => id === tab) ? tab : tabs[0][0];
  const Icon = ROLE_ICON[user.role];
  const myOrders = orders.filter((o) => o.buyerId === user.id);

  return (
    <section className={"section dashboard" + (current === "studio" ? " dashboard-wide" : "")}>
      <header className="account-head">
        <span className="avatar" aria-hidden="true">
          {user.name[0].toUpperCase()}
        </span>
        <div>
          <h1>{seller ? user.name : `Hi, ${user.name.split(" ")[0]}.`}</h1>
          <p className="account-sub">
            <Icon size={16} weight="duotone" aria-hidden="true" /> {user.role} account
            <span className="sep">{user.email}</span>
          </p>
        </div>
        {seller && (
          <button className="button primary" onClick={() => onAddListing()}>
            <Plus size={16} weight="bold" /> Add a listing
          </button>
        )}
      </header>
      {!seller && (
        <div className="stats stats-3">
          {[["Orders", myOrders.length], ["Saved pairs", saved.length], ["Circles joined", joinedCount]].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      )}
      <div className="collection-tabs" role="tablist" aria-label="Account sections">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={current === id} className={current === id ? "active" : ""} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {current === "studio" && (
        <Studio
          user={user}
          products={products}
          orders={orders}
          purchaseOrders={purchaseOrders}
          movements={movements}
          reviews={reviews}
          onAddListing={onAddListing}
          onOpen={onOpen}
          onAccountTab={() => setTab("settings")}
          {...studioActions}
        />
      )}

      {current === "orders" && <Orders orders={orders} user={user} onRelist={(i) => onAddListing(i)} />}

      {current === "saved" &&
        (saved.length ? (
          <div className="inventory">
            {saved.map((p) => (
              <article key={p.id}>
                <img src={asset(p.image)} alt="" />
                <div>
                  <h3>{p.name}</h3>
                  <p>
                    {money(p.price)} from {p.seller}
                  </p>
                </div>
                <button className="text-link" onClick={() => onOpen(p)}>
                  View <ArrowUpRight size={14} weight="bold" />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>Nothing saved yet.</h3>
            <p>Tap the heart on any pair to keep it in your rotation. Saves also tell sellers what to restock.</p>
            <button className="button primary" onClick={() => navigate("shop")}>
              Browse the shop
            </button>
          </div>
        ))}

      {current === "settings" && (
        <div className="settings">
          <div className="setting-card">
            <h3>Account type</h3>
            <p className="muted">
              You can change this any time. Switching back to Buyer needs your listings to be removed first.
            </p>
            <div className="role-switch">
              {Object.keys(ROLES).map((role) => (
                <button key={role} className={user.role === role ? "chosen" : ""} aria-pressed={user.role === role} onClick={() => user.role !== role && onRole(role)}>
                  {role}
                </button>
              ))}
            </div>
          </div>
          <div className="setting-card">
            <h3>Signed in as</h3>
            <p className="muted">
              {user.name}, {user.email}
            </p>
            <button className="button ghost" onClick={onSignOut}>
              <SignOut size={16} weight="bold" /> Sign out
            </button>
          </div>
          <div className="setting-card">
            <h3>Demo data</h3>
            <p className="muted">
              Restore the sample accounts, 90 days of orders, listings and purchase orders. This signs you out and clears your bag.
            </p>
            <button className="button ghost" onClick={onReset}>
              <ArrowsClockwise size={16} weight="bold" /> Reset demo data
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
