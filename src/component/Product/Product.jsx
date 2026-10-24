import React, { useEffect, useMemo, useState } from "react";
import {
  Heart,
  Plus,
  Minus,
  Star,
  Storefront,
  ArrowsClockwise,
  Truck,
  BellRinging,
  Users,
  Check,
} from "@phosphor-icons/react";
import { asset, money, stockOf, allSizesOf, salePercent } from "../../store";
import { fitSummary, FIT_LABEL } from "../../data/community";
import "./Product.css";

export function SellerBadge({ role }) {
  const Icon = role === "Reseller" ? ArrowsClockwise : Storefront;
  return (
    <span className={"seller-badge " + (role || "").toLowerCase()}>
      <Icon size={12} weight="bold" aria-hidden="true" />
      {role === "Reseller" ? "Reseller" : "Store"}
    </span>
  );
}

export function Price({ product, large = false }) {
  const off = salePercent(product);
  return (
    <span className={"price" + (large ? " large" : "")}>
      <b>{money(product.price)}</b>
      {off > 0 && (
        <>
          <s>{money(product.compareAt)}</s>
          <em>{off}% off</em>
        </>
      )}
    </span>
  );
}

export function ProductCard({ product, onOpen, wished, onWish, colorCount = 1 }) {
  const stock = stockOf(product);
  const low = stock > 0 && stock <= 4;
  return (
    <article className="pc">
      <div className={"pc-image " + product.tone}>
        <button
          className="pc-open"
          onClick={() => onOpen(product)}
          aria-label={`View ${product.name}`}
        >
          <img loading="lazy" src={asset(product.image)} alt="" />
        </button>
        <span className="pc-rating" aria-label={`Rated ${product.rating} out of 5`}>
          <Star size={12} weight="fill" aria-hidden="true" /> {product.rating.toFixed(1)}
        </span>
        <button
          className={"wish " + (wished ? "selected" : "")}
          aria-label={`${wished ? "Unsave" : "Save"} ${product.name}`}
          aria-pressed={wished}
          onClick={() => onWish(product.id)}
        >
          <Heart size={18} weight={wished ? "fill" : "regular"} />
        </button>
        <div className="pc-flags">
          {product.condition !== "New" && <span>{product.condition}</span>}
          {salePercent(product) > 0 && <span className="sale">-{salePercent(product)}%</span>}
          {low && <span className="low">Only {stock} left</span>}
          {stock === 0 && <span className="out">Sold out</span>}
        </div>
      </div>
      <div className="pc-body">
        <p className="pc-kicker">
          {product.brand} <i aria-hidden="true">·</i> {product.category}
        </p>
        <h3>
          <button onClick={() => onOpen(product)}>{product.name}</button>
        </h3>
        <p className="pc-sub">
          {product.gender}
          {colorCount > 1 ? `, ${colorCount} colors` : `, ${product.color}`}
          <i aria-hidden="true"> · </i>
          {product.seller}
        </p>
        <div className="pc-foot">
          <Price product={product} />
          <button
            className="pc-add"
            onClick={() => onOpen(product)}
            aria-label={`Choose size for ${product.name}`}
          >
            <Plus size={18} weight="bold" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function FitMeter({ summary }) {
  if (!summary.count) return <p className="muted small">No fit reports yet. Be the first after your pair arrives.</p>;
  return (
    <div className="fit-meter">
      <div className="fit-bar" role="img" aria-label={`${summary.small}% runs small, ${summary.true}% true to size, ${summary.large}% runs large`}>
        <i style={{ flex: Math.max(summary.small, 0.01) }} className="s" />
        <i style={{ flex: Math.max(summary.true, 0.01) }} className="t" />
        <i style={{ flex: Math.max(summary.large, 0.01) }} className="l" />
      </div>
      <div className="fit-legend">
        <span>Small {summary.small}%</span>
        <span>True {summary.true}%</span>
        <span>Large {summary.large}%</span>
      </div>
      <p className="small">
        <b>{summary.verdict}</b> <span className="muted">from {summary.count} verified buyers</span>
      </p>
    </div>
  );
}

export function ProductDetails({
  product,
  siblings = [],
  onSelect,
  onAdd,
  wished,
  onWish,
  own,
  reviews = [],
  notified,
  onNotify,
}) {
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  useEffect(() => {
    setSize("");
    setQty(1);
  }, [product.id]);
  const stock = stockOf(product);
  const available = size ? product.stockBySize[size] || 0 : 0;
  const summary = useMemo(() => fitSummary(reviews, product.id), [reviews, product.id]);
  const latest = reviews.filter((r) => r.productId === product.id).slice(0, 2);
  const gallery = [product, ...siblings.filter((s) => s.id !== product.id)].slice(0, 5);

  return (
    <div className="pd">
      <div className="pd-media">
        <div className={"pd-stage " + product.tone}>
          <span className="pd-word" aria-hidden="true">
            {product.brand}
          </span>
          <img src={asset(product.image)} alt={product.name} />
        </div>
        {gallery.length > 1 && (
          <ul className="pd-thumbs" aria-label={`Other ${product.model} colorways`}>
            {gallery.map((item) => (
              <li key={item.id}>
                <button
                  className={item.id === product.id ? "on" : ""}
                  aria-label={`${item.name}, ${item.color}`}
                  aria-current={item.id === product.id}
                  onClick={() => onSelect(item)}
                >
                  <img src={asset(item.image)} alt="" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="pd-info">
        <p className="pd-kicker">
          {product.brand} <i>·</i> {product.gender} <i>·</i> {product.category}
        </p>
        <h3>{product.name}</h3>
        <div className="pd-meta">
          <Price product={product} large />
          <span className="pd-rating">
            <Star size={14} weight="fill" aria-hidden="true" /> {product.rating.toFixed(1)}
          </span>
          <span className="pd-saves">
            <Users size={14} aria-hidden="true" /> {product.watchers} saved
          </span>
        </div>
        <p className="muted pd-copy">
          {product.condition} condition, {product.color.toLowerCase()}. Sold by {product.seller}{" "}
          <SellerBadge role={product.sellerRole} />
        </p>

        <fieldset className="pd-sizes">
          <legend>
            Select size <small>US</small>
          </legend>
          <div className="pd-size-grid">
            {allSizesOf(product).map((value) => {
              const left = product.stockBySize[value];
              return (
                <button
                  key={value}
                  disabled={left === 0}
                  className={size === value ? "chosen" : ""}
                  aria-pressed={size === value}
                  onClick={() => {
                    setSize(value);
                    setQty(1);
                  }}
                >
                  <b>{value}</b>
                  <small>{left === 0 ? "sold out" : left <= 2 ? `${left} left` : "in stock"}</small>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="pd-fit">
          <h4>How it fits</h4>
          <FitMeter summary={summary} />
          {latest.map((review) => (
            <blockquote key={review.id}>
              “{review.text}”
              <cite>
                {review.author.split(" ")[0]}, US {review.size}, {FIT_LABEL[review.fit].toLowerCase()}
                <Check size={12} weight="bold" aria-label="Verified purchase" />
              </cite>
            </blockquote>
          ))}
        </div>

        {stock === 0 ? (
          <button className="button primary full" onClick={() => onNotify(product)} disabled={notified}>
            <BellRinging size={18} weight="bold" />
            {notified ? "We will tell you and the seller" : "Notify me and request a restock"}
          </button>
        ) : (
          <div className="pd-buy">
            <div className="pd-qty" role="group" aria-label="Quantity">
              <button aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty(qty - 1)}>
                <Minus size={14} weight="bold" />
              </button>
              <output aria-live="polite">{qty}</output>
              <button aria-label="Increase quantity" disabled={!size || qty >= available} onClick={() => setQty(qty + 1)}>
                <Plus size={14} weight="bold" />
              </button>
            </div>
            <button
              className="button primary"
              disabled={!size || own}
              onClick={() => onAdd(product, size, qty)}
            >
              {own ? "This is your listing" : size ? `Add to bag · ${money(product.price * qty)}` : "Select a size"}
            </button>
          </div>
        )}
        <button className="text-link full" onClick={() => onWish(product.id)} aria-pressed={wished}>
          <Heart size={16} weight={wished ? "fill" : "regular"} />
          {wished ? "Saved to your rotation" : "Save to your rotation"}
        </button>

        <p className="pd-ship">
          <Truck size={18} aria-hidden="true" />
          <span>
            Ships from {product.seller}. Estimated 3 to 4 days in Metro Manila, tracked at every step.
            {product.price >= 8000 ? " Free delivery." : " Free delivery from ₱8,000."}
          </span>
        </p>
        <p className="muted small">
          {stock} pairs in stock across sizes. Demo inventory; no payment is collected.
        </p>
      </div>
    </div>
  );
}
