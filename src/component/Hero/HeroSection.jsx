import React, { useEffect, useRef } from "react";
import { ArrowUpRight, Check } from "@phosphor-icons/react";
import { asset, money } from "../../store";
import "./HeroSection.css";

const clamp = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const CHAPTERS = [
  { id: "discover", label: "Discover" },
  { id: "brands", label: "Every brand" },
  { id: "studio", label: "Run a store" },
];

const CARDS = [
  { img: "catalog/aj1-high-royal.jpg", brand: "Jordan", x: "52vw", y: "6vh", s: 1.5, r: "-5deg", w: "15vw" },
  { img: "catalog/af1-shadow-pastel.jpg", brand: "Nike", x: "72vw", y: "30vh", s: 1.15, r: "4deg", w: "13vw" },
  { img: "catalog/nb-574-peach.jpg", brand: "New Balance", x: "46vw", y: "56vh", s: 0.8, r: "3deg", w: "11.5vw" },
  { img: "catalog/adidas-prophere-teal.jpg", brand: "Adidas", x: "83vw", y: "4vh", s: 1.9, r: "6deg", w: "10vw" },
  { img: "catalog/vans-old-skool-burgundy.jpg", brand: "Vans", x: "66vw", y: "60vh", s: 1.3, r: "-4deg", w: "12vw" },
];

function Forecast() {
  return (
    <svg viewBox="0 0 220 84" role="img" aria-label="Illustrative demand forecast: sales rising, projection dashed with a confidence band" className="hp-spark">
      <path d="M122 46 L218 14 L218 56 L122 52 Z" className="band" />
      <polyline points="0,62 16,58 30,60 46,50 62,54 78,42 94,46 110,36 122,40" className="hist" />
      <polyline points="122,40 150,32 184,26 218,18" className="proj" />
      <line x1="122" x2="122" y1="6" y2="78" className="now" />
    </svg>
  );
}

export default function HeroSection({ navigate, onProduct, product, catalogSize = 0, brandCount = 0 }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = null;

    function update() {
      frame = null;
      const stage = root.firstElementChild;
      const top = parseFloat(getComputedStyle(stage).top) || 0;
      const travel = Math.max(1, root.offsetHeight - stage.offsetHeight);
      const p = motion.matches ? 0 : clamp((top - root.getBoundingClientRect().top) / travel);
      const c0 = 1 - smooth(0.2, 0.36, p);
      const c2 = smooth(0.62, 0.78, p);
      const c1 = Math.max(0, smooth(0.2, 0.36, p) - c2);
      const set = (k, v) => root.style.setProperty(k, v.toFixed(4));
      set("--p", p);
      set("--a", clamp(p / 0.5));
      set("--b", clamp((p - 0.5) / 0.5));
      set("--c0", c0);
      set("--c1", c1);
      set("--c2", c2);
      root.dataset.chapter = c2 > 0.5 ? "2" : c1 > 0.5 ? "1" : "0";
    }
    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  function jump(index) {
    const root = rootRef.current;
    const stage = root.firstElementChild;
    const travel = root.offsetHeight - stage.offsetHeight;
    const target = [0.04, 0.5, 0.98][index];
    const y = root.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(stage).top) || 0) + travel * target;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: y, behavior: reduce ? "instant" : "smooth" });
  }

  return (
    <section ref={rootRef} className="hs" data-chapter="0" aria-labelledby="hero-title">
      <div className="hs-stage">
        <div className="hs-bg" aria-hidden="true" />

        <div className="hs-words" aria-hidden="true">
          <span className="w0">RISE</span>
          <span className="w1">SHELF</span>
          <span className="w2">RUN IT</span>
        </div>

        <div className="hs-cut hs-shoe">
          <img src={asset("jordan1.png")} alt="Red, white and black Air Jordan 1 high-top" />
        </div>
        <div className="hs-cut hs-flyknit" aria-hidden="true">
          <img src={asset("shoe_image.png")} alt="" />
        </div>

        {CARDS.map((card, i) => (
          <figure
            key={card.brand}
            className="hs-card"
            aria-hidden="true"
            style={{ "--x": card.x, "--y": card.y, "--s": card.s, "--r": card.r, "--w": card.w, "--i": i }}
          >
            <img src={asset(card.img)} alt="" loading="lazy" />
            <figcaption>{card.brand}</figcaption>
          </figure>
        ))}

        <div className="hs-panels" role="group" aria-label="Seller studio preview (illustrative)">
          <article className="hp hp-forecast">
            <header>
              <span>Demand forecast</span>
              <small>Next 30 days</small>
            </header>
            <strong>+18%</strong>
            <Forecast />
            <p>Reorder 8 pairs of Air Force 1 by Nov 6</p>
          </article>
          <article className="hp hp-stock">
            <header>
              <span>Stock by size</span>
              <small>US</small>
            </header>
            <div className="bars" aria-hidden="true">
              {[["8", 6], ["9", 9], ["10", 7], ["11", 2], ["12", 1]].map(([s, n]) => (
                <span key={s} className={n <= 2 ? "low" : ""}>
                  <i style={{ height: `${n * 9}%` }} />
                  <b>{s}</b>
                </span>
              ))}
            </div>
            <p>Sizes 11 and 12 are under the reorder point</p>
          </article>
          <article className="hp hp-track">
            <header>
              <span>Delivery timeline</span>
              <small>SR2810442</small>
            </header>
            <ol>
              {["Placed", "Packed", "Shipped", "Out for delivery", "Delivered"].map((step, i) => (
                <li key={step} className={i < 2 ? "done" : i === 2 ? "now" : ""}>
                  <i aria-hidden="true">{i < 2 && <Check size={9} weight="bold" />}</i>
                  {step}
                </li>
              ))}
            </ol>
          </article>
        </div>

        <div className="hs-copy c0">
          <p className="eyebrow">An independent sneaker marketplace</p>
          <h1 id="hero-title">
            <span>Good soles.</span>
            <span className="accent">Great stories.</span>
          </h1>
          <p className="hs-desc">
            Buy new and pre-loved pairs from every major brand, or open a store with inventory, forecasting and delivery tracking built in.
          </p>
          <div className="hs-buttons">
            <button className="button primary" onClick={() => navigate("shop")}>
              Shop the drop <ArrowUpRight size={16} weight="bold" />
            </button>
            <button className="button ghost" onClick={() => navigate("sell")}>
              Start selling
            </button>
          </div>
          {product && (
            <button className="hs-pick" onClick={onProduct}>
              <span>
                {product.name}
                <small>{money(product.price)}, most wanted this week</small>
              </span>
              <span className="round-arrow">
                <ArrowUpRight size={18} weight="bold" />
              </span>
            </button>
          )}
        </div>

        <div className="hs-copy c1">
          <p className="eyebrow">01 · Every brand, one shelf</p>
          <h2>
            {brandCount} brands.
            <br />
            One filter rail.
          </h2>
          <p className="hs-desc">
            {catalogSize} pairs from Nike, Jordan, Adidas, New Balance, Puma and Vans. Filter by size, color, model and price, with live stock in every size.
          </p>
          <div className="hs-buttons">
            <button className="button primary" onClick={() => navigate("shop")}>
              Browse the collection <ArrowUpRight size={16} weight="bold" />
            </button>
          </div>
        </div>

        <div className="hs-copy c2">
          <p className="eyebrow">02 · Built for sellers and resellers</p>
          <h2>
            Run your store
            <br />
            like a business.
          </h2>
          <p className="hs-desc">
            Inventory by size, demand forecasts, reorder alerts, purchase orders and a delivery timeline for every shipment. The back office comes with your storefront.
          </p>
          <div className="hs-buttons">
            <button className="button primary" onClick={() => navigate("sell")}>
              Open a store <ArrowUpRight size={16} weight="bold" />
            </button>
            <button className="button ghost" onClick={() => navigate("community")}>
              See the community
            </button>
          </div>
        </div>

        <nav className="hs-rail" aria-label="Hero chapters">
          {CHAPTERS.map((chapter, i) => (
            <button key={chapter.id} onClick={() => jump(i)} data-i={i}>
              <i aria-hidden="true" />
              <span>
                <b>0{i + 1}</b> {chapter.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
