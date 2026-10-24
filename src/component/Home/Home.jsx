import React, { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Package,
  ChartLineUp,
  Truck,
  ClipboardText,
  BellRinging,
  Ruler,
  Fire,
  Check,
} from "@phosphor-icons/react";
import HeroSection from "../Hero/HeroSection";
import { Price } from "../Product/Product";
import { asset, stockOf, BRANDS } from "../../store";
import { demandSignal, FIT_LABEL } from "../../data/community";
import "./Home.css";

const FEATURED = ["aj1-high-royal", "af1-shadow-pastel", "af1-white", "vans-old-skool-burgundy"];

function Marquee() {
  const row = [...BRANDS, ...BRANDS, ...BRANDS];
  return (
    <div className="culture-strip" aria-label="Brands on Sole Rise">
      <div className="culture-track" aria-hidden="true">
        {row.map((brand, i) => (
          <span key={i}>
            {brand}
            <ArrowUpRight size={22} weight="bold" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---- the business-tools showcase: each tab states its purpose ---- */
function Inventory() {
  const sizes = ["7", "8", "9", "10", "11"];
  const rows = [
    ["AF1 '07 Triple White", [6, 7, 8, 7, 4]],
    ["Air Jordan 1 Mid", [1, 2, 3, 2, 1]],
    ["Vans Old Skool", [5, 5, 4, 3, 0]],
    ["Air Max 90 Pink", [3, 3, 2, 0, 0]],
  ];
  return (
    <div className="sv sv-inv" role="img" aria-label="Illustrative size grid: stock for four products across five sizes, low cells flagged">
      <div className="sv-row head">
        <span>Product</span>
        {sizes.map((s) => (
          <span key={s}>US {s}</span>
        ))}
      </div>
      {rows.map(([name, qty]) => (
        <div className="sv-row" key={name}>
          <span>{name}</span>
          {qty.map((n, i) => (
            <span key={i} className={"cell" + (n === 0 ? " out" : n <= 2 ? " low" : "")}>
              {n}
            </span>
          ))}
        </div>
      ))}
      <p className="sv-note">Red cells are under the reorder point. One click raises a purchase order for exactly those sizes.</p>
    </div>
  );
}

function Forecast() {
  return (
    <div className="sv sv-fc" role="img" aria-label="Illustrative forecast: 90 days of sales with a 30 day projection and confidence band">
      <svg viewBox="0 0 520 220">
        {[40, 90, 140, 190].map((y) => (
          <line key={y} x1="0" x2="520" y1={y} y2={y} className="grid" />
        ))}
        <path d="M360 108 L516 40 L516 120 L360 124 Z" className="band" />
        <polyline className="hist" points="0,170 30,160 60,166 90,150 120,154 150,132 180,140 210,118 240,126 270,104 300,112 330,98 360,110" />
        <polyline className="proj" points="360,110 400,92 440,84 480,70 516,58" />
        <line x1="360" x2="360" y1="10" y2="210" className="now" />
        <text x="366" y="24">Today</text>
        <text x="440" y="206">Forecast</text>
      </svg>
      <ul className="sv-stats">
        <li>
          <b>+18%</b>
          <span>30-day demand</span>
        </li>
        <li>
          <b>9 days</b>
          <span>cover on AF1 Black</span>
        </li>
        <li>
          <b>Nov 6</b>
          <span>reorder by</span>
        </li>
      </ul>
    </div>
  );
}

function Fulfillment() {
  const cols = [
    ["Placed", 4],
    ["Packed", 3],
    ["Shipped", 6],
    ["Out for delivery", 2],
    ["Delivered", 41],
  ];
  return (
    <div className="sv sv-ful" role="img" aria-label="Illustrative fulfillment board with counts per stage">
      {cols.map(([name, n], i) => (
        <div className="col" key={name}>
          <header>
            {name} <b>{n}</b>
          </header>
          {i < 4 && <i className="card">SR-10{i}4{i}1</i>}
          {i === 0 && <i className="card late">Late 6h</i>}
          {i === 2 && <i className="card">J&amp;T · tracked</i>}
        </div>
      ))}
    </div>
  );
}

function Purchasing() {
  const rows = [
    ["PO-2060", "Air Max 90 Hyper Pink", "8", "Nov 2", "On the way"],
    ["PO-2056", "Air Jordan 1 High Royal", "12", "Oct 21", "Delayed 3d"],
    ["PO-2041", "AF1 '07 Triple White", "24", "Oct 6", "Received"],
  ];
  return (
    <div className="sv sv-po" role="img" aria-label="Illustrative purchase orders with supplier status">
      {rows.map(([id, name, qty, eta, status]) => (
        <div className="po" key={id}>
          <b>{id}</b>
          <span>{name}</span>
          <span>{qty} pairs</span>
          <span>ETA {eta}</span>
          <em className={status.startsWith("Delayed") ? "late" : status === "Received" ? "ok" : ""}>{status}</em>
        </div>
      ))}
    </div>
  );
}

const TOOLS = [
  {
    id: "inventory",
    icon: Package,
    title: "Inventory by size",
    purpose: "Know what is on the shelf, in every size, before a buyer finds out it is gone.",
    View: Inventory,
  },
  {
    id: "forecast",
    icon: ChartLineUp,
    title: "Demand forecast",
    purpose: "Sales history plus how many people saved a pair tell you what to reorder, how many, and by when.",
    View: Forecast,
  },
  {
    id: "orders",
    icon: Truck,
    title: "Delivery timeline",
    purpose: "Every order moves Placed, Packed, Shipped, Out for delivery, Delivered. Late ones surface first.",
    View: Fulfillment,
  },
  {
    id: "purchasing",
    icon: ClipboardText,
    title: "Purchasing",
    purpose: "Turn a reorder alert into a purchase order, track the supplier, and receive stock straight into sizes.",
    View: Purchasing,
  },
];

function Studio({ onJoin, onStudio, user }) {
  const [tab, setTab] = useState("inventory");
  const tool = TOOLS.find((t) => t.id === tab);
  const View = tool.View;
  return (
    <section className="section biz" id="studio">
      <div className="biz-copy">
        <p className="eyebrow rv">For sellers and resellers</p>
        <h2 className="rv">Sell like a business, not a listing.</h2>
        <p className="muted rv">
          Every store on Sole Rise gets the back office a shoe business actually runs on: stock, forecasts, purchasing and delivery in one place.
        </p>
        <div className="biz-tabs" role="tablist" aria-label="Seller studio tools">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={"tool-" + t.id}
              aria-selected={tab === t.id}
              aria-controls="tool-panel"
              className={tab === t.id ? "on" : ""}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={22} weight="duotone" aria-hidden="true" />
              <span>
                <b>{t.title}</b>
                <small>{t.purpose}</small>
              </span>
            </button>
          ))}
        </div>
        <div className="biz-cta rv">
          <button className="button primary" onClick={() => (user ? onStudio() : onJoin("Seller"))}>
            {user ? "Open your studio" : "Open a store"} <ArrowUpRight size={16} weight="bold" />
          </button>
          {!user && (
            <button className="button ghost" onClick={() => onJoin("Reseller")}>
              Become a reseller
            </button>
          )}
        </div>
      </div>
      <div className="biz-stage" data-par="0.05">
        <div className="biz-window" role="tabpanel" id="tool-panel" aria-labelledby={"tool-" + tab}>
          <div className="biz-bar" aria-hidden="true">
            <i />
            <i />
            <i />
            <span>Seller studio · {tool.title}</span>
            <em>Illustrative</em>
          </div>
          <View key={tab} />
        </div>
        <div className="biz-float f1" data-par="-0.08" aria-hidden="true">
          <Fire size={18} weight="fill" /> 214 saved this pair
        </div>
        <div className="biz-float f2" data-par="0.12" aria-hidden="true">
          <Check size={16} weight="bold" /> Reorder placed
        </div>
      </div>
    </section>
  );
}

function Community({ products, reviews, wishlist, notify, onNotify, navigate, onOpen, user, openAuth }) {
  const wanted = useMemo(
    () => [...products].sort((a, b) => demandSignal(b, wishlist, notify) - demandSignal(a, wishlist, notify)).slice(0, 3),
    [products, wishlist, notify],
  );
  const restock = useMemo(
    () =>
      products
        .filter((p) => stockOf(p) <= 2)
        .sort((a, b) => b.watchers - a.watchers)
        .slice(0, 2),
    [products],
  );
  const latest = reviews.slice(0, 2);
  const byId = (id) => products.find((p) => p.id === id);
  return (
    <section className="community" id="community-section">
      <div className="community-head">
        <h2 className="rv">Sole Rise community</h2>
        <p className="muted rv">
          Not just buying and selling. Buyers tell each other how a pair really fits, and what they want next. Sellers see those signals when they plan stock.
        </p>
      </div>
      <div className="community-frame">
        <img className="par-img" loading="lazy" src={asset("sneaker-culture.jpg")} alt="Red and white high-top sneakers on a city pavement" />
        <div className="community-quote rv">
          <h3>The pairs bring us. The people keep us.</h3>
          <p>Every fit report you post helps the next buyer pick a size, and helps a seller stock the right ones.</p>
          <button className="button light" onClick={() => navigate("community")}>
            Join in <ArrowUpRight size={16} weight="bold" />
          </button>
        </div>
      </div>
      <div className="purpose-grid">
        <article className="purpose rv">
          <Ruler size={26} weight="duotone" aria-hidden="true" />
          <h3>Fit reports</h3>
          <p>Verified buyers rate fit by size, so you order the right pair the first time. Fewer returns for sellers.</p>
          {latest.map((r) => (
            <blockquote key={r.id}>
              “{r.text}”
              <cite>
                {byId(r.productId)?.name}, US {r.size}: {FIT_LABEL[r.fit].toLowerCase()}
              </cite>
            </blockquote>
          ))}
        </article>
        <article className="purpose rv" style={{ "--i": 1 }}>
          <Fire size={26} weight="duotone" aria-hidden="true" />
          <h3>Most wanted</h3>
          <p>Saves are demand. They lift the forecast sellers use to decide what to reorder.</p>
          <ol className="mini-list">
            {wanted.map((p) => (
              <li key={p.id}>
                <img src={asset(p.image)} alt="" />
                <button onClick={() => onOpen(p)}>{p.name}</button>
                <b>{demandSignal(p, wishlist, notify)}</b>
              </li>
            ))}
          </ol>
        </article>
        <article className="purpose rv" style={{ "--i": 2 }}>
          <BellRinging size={26} weight="duotone" aria-hidden="true" />
          <h3>Restock requests</h3>
          <p>Sold out? Ask for it. The seller sees how many people are waiting before they place the order.</p>
          <ol className="mini-list">
            {restock.map((p) => (
              <li key={p.id}>
                <img src={asset(p.image)} alt="" />
                <span>
                  {p.name}
                  <small>{stockOf(p)} left, {p.watchers} waiting</small>
                </span>
                <button
                  className="mini-btn"
                  disabled={notify.includes(p.id)}
                  onClick={() => (user ? onNotify(p) : openAuth("signup", "Buyer"))}
                >
                  {notify.includes(p.id) ? "Requested" : "Request"}
                </button>
              </li>
            ))}
          </ol>
        </article>
      </div>
    </section>
  );
}

export default function Home({
  products,
  reviews,
  wishlist,
  notify,
  onNotify,
  navigate,
  onOpen,
  onWish,
  user,
  openAuth,
  upgrade,
  setFilters,
  filtersBase,
}) {
  const featured = FEATURED.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  const colorsOf = (p) => products.filter((q) => q.brand === p.brand && q.model === p.model).length;
  const top = [...products].sort((a, b) => b.watchers - a.watchers)[0];
  return (
    <>
      <HeroSection
        navigate={navigate}
        product={top}
        onProduct={() => top && onOpen(top)}
        catalogSize={products.length}
        brandCount={BRANDS.length}
      />
      <Marquee />

      <section className="section featured" id="featured">
        <div className="section-heading rv">
          <h2>Featured items</h2>
          <p>The pairs the community is saving this week, from stores and resellers across the marketplace.</p>
        </div>
        <div className="featured-grid">
          {featured.map((p, i) => (
            <article className="feat" key={p.id} data-par={[0, 0.07, -0.04, 0.1][i]}>
              <button className="feat-img" onClick={() => onOpen(p)} aria-label={`View ${p.name}`}>
                <img loading="lazy" src={asset(p.image)} alt="" />
                <span className="feat-chip">{p.category === "Basketball" ? "Hoops" : p.category}</span>
                <span
                  className={"feat-heart" + (wishlist.includes(p.id) ? " on" : "")}
                  role="button"
                  tabIndex={0}
                  aria-label={wishlist.includes(p.id) ? "Unsave" : "Save"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onWish(p.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      onWish(p.id);
                    }
                  }}
                >
                  ♥
                </span>
              </button>
              <div className="feat-row">
                <h3>{p.name}</h3>
                <Price product={p} />
              </div>
              <p>
                {colorsOf(p) > 1 ? `Available in ${colorsOf(p)} colors` : `${p.brand}, ${p.color}`}
                <i> · </i>
                {stockOf(p) <= 4 ? `${stockOf(p)} left` : "In stock"}
              </p>
            </article>
          ))}
        </div>
        <button
          className="text-link featured-all rv"
          onClick={() => {
            setFilters({ ...filtersBase });
            navigate("shop");
          }}
        >
          Shop the full collection <ArrowUpRight size={16} weight="bold" />
        </button>
      </section>

      <Studio
        user={user}
        onJoin={(role) => openAuth("signup", role)}
        onStudio={() => (user.role === "Buyer" ? upgrade("Seller") : navigate("account"))}
      />

      <Community
        products={products}
        reviews={reviews}
        wishlist={wishlist}
        notify={notify}
        onNotify={onNotify}
        navigate={navigate}
        onOpen={onOpen}
        user={user}
        openAuth={openAuth}
      />

      <section className="closing-banner">
        <div className="closing-copy">
          <p className="eyebrow">Your next chapter is waiting</p>
          <h2 className="rv">
            Do not just fit in.
            <br />
            Find your footing.
          </h2>
          <button className="button dark" onClick={() => (user ? navigate("shop") : openAuth("signup"))}>
            {user ? "Shop the collection" : "Create your account"}
            <ArrowUpRight size={16} weight="bold" />
          </button>
        </div>
        <ArrowUpRight className="closing-arrow par-slow" size={380} weight="thin" aria-hidden="true" />
      </section>
    </>
  );
}
