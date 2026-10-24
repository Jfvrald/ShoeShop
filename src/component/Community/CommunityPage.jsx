import React, { useMemo, useState } from "react";
import { ArrowUpRight, BellRinging, Check, Fire, Heart, Ruler, Star } from "@phosphor-icons/react";
import { asset, stockOf } from "../../store";
import { demandSignal, FIT_LABEL, fitSummary } from "../../data/community";
import { ownerKey } from "../../data/shipping";
import { FitMeter } from "../Product/Product";
import "./Community.css";

const CIRCLES = [
  ["The daily rotation", "Style inspiration and everyday favorites."],
  ["The second sole club", "Reselling, restoration and fresh starts."],
  ["After-hours runners", "Small wins, longer runs, good company."],
];

/* Pairs the signed-in buyer actually received: the only ones they can review. */
export function reviewablePairs(orders, user, reviews) {
  if (!user) return [];
  const seen = new Set(reviews.filter((r) => r.userId === user.id).map((r) => r.productId));
  const pairs = [];
  orders
    .filter((o) => o.buyerId === user.id)
    .forEach((o) =>
      o.items.forEach((item) => {
        const delivered = o.shipments?.[ownerKey(item.ownerId)]?.status === "Delivered";
        if (delivered && !seen.has(item.id) && !pairs.some((p) => p.id === item.id)) pairs.push(item);
      }),
    );
  return pairs;
}

function ReviewForm({ pairs, onPost }) {
  const [id, setId] = useState(pairs[0]?.id);
  const [fit, setFit] = useState("true");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const pair = pairs.find((p) => p.id === id) || pairs[0];
  return (
    <form
      className="review-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!text.trim()) return;
        onPost({ productId: pair.id, size: pair.size, fit, rating, text: text.trim() });
        setText("");
      }}
    >
      <h3>Post a fit report</h3>
      <label>
        Pair you received
        <select value={pair.id} onChange={(e) => setId(e.target.value)}>
          {pairs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}, US {p.size}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>How does it fit?</legend>
        <div className="seg">
          {Object.entries(FIT_LABEL).map(([value, label]) => (
            <button type="button" key={value} className={fit === value ? "on" : ""} aria-pressed={fit === value} onClick={() => setFit(value)}>
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Rating</legend>
        <div className="stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} aria-label={`${n} star${n > 1 ? "s" : ""}`} aria-pressed={rating === n} onClick={() => setRating(n)}>
              <Star size={22} weight={n <= rating ? "fill" : "regular"} />
            </button>
          ))}
        </div>
      </fieldset>
      <label>
        Your tip for the next buyer
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={180} rows={3} placeholder="Tight in the toe box? Roomy in the heel? Tell us." required />
      </label>
      <button className="button primary" type="submit">
        Post report <ArrowUpRight size={16} weight="bold" />
      </button>
    </form>
  );
}

export default function CommunityPage({
  products,
  reviews,
  orders,
  user,
  wishlist,
  notify,
  onNotify,
  onWish,
  onOpen,
  onPostReview,
  circles,
  onJoinCircle,
  openAuth,
}) {
  const [filter, setFilter] = useState("all");
  const byId = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const ranked = useMemo(
    () => [...products].sort((a, b) => demandSignal(b, wishlist, notify) - demandSignal(a, wishlist, notify)).slice(0, 6),
    [products, wishlist, notify],
  );
  const waiting = useMemo(
    () => products.filter((p) => stockOf(p) <= 2).sort((a, b) => b.watchers - a.watchers).slice(0, 5),
    [products],
  );
  const pairs = reviewablePairs(orders, user, reviews);
  const sample = useMemo(() => {
    const counts = {};
    reviews.forEach((r) => {
      counts[r.productId] = (counts[r.productId] || 0) + 1;
    });
    return products.find((p) => p.id === Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]) || ranked[0];
  }, [products, reviews, ranked]);
  const feed = reviews.filter((r) => filter === "all" || r.fit === filter).slice(0, 8);

  return (
    <div className="cm">
      <header className="cm-hero">
        <p className="eyebrow">Sole Rise community</p>
        <h1>Better pairs. Better stock. Together.</h1>
        <p>
          Buyers share how pairs really fit and what they want next. Sellers read those signals when they plan inventory. That loop is why this is a community and not a comment box.
        </p>
        <dl className="cm-stats">
          <div>
            <dt>Fit reports</dt>
            <dd>{reviews.length}</dd>
          </div>
          <div>
            <dt>Pairs saved</dt>
            <dd>{products.reduce((s, p) => s + p.watchers, 0).toLocaleString("en-PH")}</dd>
          </div>
          <div>
            <dt>Restock requests</dt>
            <dd>{waiting.reduce((s, p) => s + p.watchers, 0)}</dd>
          </div>
        </dl>
      </header>

      <div className="cm-grid">
        <section className="cm-card">
          <h2>
            <Fire size={22} weight="duotone" aria-hidden="true" /> Most wanted
          </h2>
          <p className="muted">Ranked by saves. Sellers see this ranking inside their demand forecast.</p>
          <ol className="rank">
            {ranked.map((p, i) => (
              <li key={p.id}>
                <span className="n">{i + 1}</span>
                <img src={asset(p.image)} alt="" />
                <button onClick={() => onOpen(p)}>
                  {p.name}
                  <small>
                    {p.brand}, {stockOf(p) === 0 ? "sold out" : `${stockOf(p)} in stock`}
                  </small>
                </button>
                <b>{demandSignal(p, wishlist, notify).toLocaleString("en-PH")}</b>
                <button
                  className={"save" + (wishlist.includes(p.id) ? " on" : "")}
                  aria-pressed={wishlist.includes(p.id)}
                  aria-label={wishlist.includes(p.id) ? `Unsave ${p.name}` : `Save ${p.name}`}
                  onClick={() => onWish(p.id)}
                >
                  <Heart size={18} weight={wishlist.includes(p.id) ? "fill" : "regular"} />
                </button>
              </li>
            ))}
          </ol>
        </section>

        <section className="cm-card">
          <h2>
            <BellRinging size={22} weight="duotone" aria-hidden="true" /> Restock requests
          </h2>
          <p className="muted">Pairs nearly or fully sold out. Every request is a signal to the seller to reorder.</p>
          <ul className="waiting">
            {waiting.map((p) => (
              <li key={p.id}>
                <img src={asset(p.image)} alt="" />
                <span>
                  {p.name}
                  <small>
                    {stockOf(p) === 0 ? "Sold out" : `${stockOf(p)} left`}, {p.watchers + (notify.includes(p.id) ? 1 : 0)} waiting, from {p.seller}
                  </small>
                </span>
                <button
                  className="button ghost"
                  disabled={notify.includes(p.id)}
                  onClick={() => (user ? onNotify(p) : openAuth("signup", "Buyer"))}
                >
                  {notify.includes(p.id) ? (
                    <>
                      <Check size={14} weight="bold" /> Requested
                    </>
                  ) : (
                    "Request restock"
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="cm-feed">
        <div className="cm-feed-head">
          <div>
            <h2>
              <Ruler size={22} weight="duotone" aria-hidden="true" /> Fit reports
            </h2>
            <p className="muted">Only buyers whose pair was delivered can post, so every report is a verified purchase.</p>
          </div>
          <div className="seg" role="group" aria-label="Filter fit reports">
            {[["all", "All"], ...Object.entries(FIT_LABEL)].map(([value, label]) => (
              <button key={value} className={filter === value ? "on" : ""} aria-pressed={filter === value} onClick={() => setFilter(value)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="cm-feed-body">
          <ul className="reports">
            {feed.map((r) => {
              const p = byId[r.productId];
              if (!p) return null;
              return (
                <li key={r.id}>
                  <img src={asset(p.image)} alt="" />
                  <div>
                    <p className="rep-top">
                      <button onClick={() => onOpen(p)}>{p.name}</button>
                      <span className="stars-static" aria-label={`${r.rating} out of 5`}>
                        <Star size={13} weight="fill" /> {r.rating}
                      </span>
                    </p>
                    <p>“{r.text}”</p>
                    <p className="rep-meta">
                      <span className={"fit-tag " + r.fit}>{FIT_LABEL[r.fit]}</span>
                      {r.author.split(" ")[0]} bought US {r.size}
                      <Check size={12} weight="bold" aria-label="Verified purchase" />
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <aside>
            {user && pairs.length > 0 ? (
              <ReviewForm key={pairs.map((p) => p.id).join()} pairs={pairs} onPost={onPostReview} />
            ) : (
              <div className="review-gate">
                <h3>Post a fit report</h3>
                <p className="muted">
                  {user
                    ? "Once a pair you bought is delivered, you can tell the next buyer how it fits. Track yours in Account."
                    : "Sign in, buy a pair, and when it is delivered you can post how it fits."}
                </p>
                {!user && (
                  <button className="button primary" onClick={() => openAuth("signin")}>
                    Sign in
                  </button>
                )}
                <div className="gate-sample">
                  <FitMeter summary={fitSummary(reviews, sample.id)} />
                  <small className="muted">Sample: {sample.name}</small>
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="cm-circles">
        <h2>Circles</h2>
        <p className="muted">Small groups around how you wear sneakers. Joining tells us what to feature.</p>
        <div className="circle-row">
          {CIRCLES.map(([title, description], index) => (
            <article key={title} className="circle">
              <h3>{title}</h3>
              <p>{description}</p>
              <button className={circles.includes(index) ? "joined" : ""} onClick={() => onJoinCircle(index)}>
                {circles.includes(index) ? (
                  <>
                    <Check size={14} weight="bold" /> Joined, tap to leave
                  </>
                ) : (
                  <>
                    Join the circle <ArrowUpRight size={14} weight="bold" />
                  </>
                )}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
