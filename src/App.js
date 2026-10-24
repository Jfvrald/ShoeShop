import React, { useEffect, useRef, useState } from "react";
import useScrollMotion from "./useScrollMotion";
import { ArrowUpRight, ArrowUp, Plus, Minus, Trash, HandbagSimple, Check, Truck } from "@phosphor-icons/react";
import NavigationBar, { Brand } from "./component/Nav/NavigationBar";
import Home from "./component/Home/Home";
import ShopPage from "./component/Shop/ShopPage";
import { DEFAULT_FILTERS } from "./component/Shop/filters";
import CommunityPage from "./component/Community/CommunityPage";
import Dialog from "./component/Dialog";
import AuthDialog from "./component/Auth/AuthDialog";
import ListingForm from "./component/Account/ListingForm";
import AccountPage, { SellPitch } from "./component/Account/AccountPage";
import { ProductDetails } from "./component/Product/Product";
import { newShipments, advanceShipment } from "./data/shipping";
import {
  asset,
  money,
  initialProducts,
  useSaved,
  addCartItem,
  removeSoldStock,
  adjustStock,
  canSell,
  publicUser,
  buildDemoData,
} from "./store";
import "./App.css";

const PAGES = ["home", "shop", "community", "sell", "account"];
const FREE_SHIPPING = 8000;
const hashPage = () => {
  const value = window.location.hash.slice(1);
  return PAGES.includes(value) ? value : null;
};

export default function App() {
  const [page, setPage] = useState(hashPage() || "home");
  const mainRef = useRef(null);
  useScrollMotion(mainRef, page);
  const [products, setProducts] = useSaved("sole-rise-products-v3", initialProducts);
  const [cart, setCart] = useSaved("sole-rise-cart-v3", []);
  const [orders, setOrders] = useSaved("sole-rise-orders-v3", []);
  const [purchaseOrders, setPurchaseOrders] = useSaved("sole-rise-pos-v1", []);
  const [movements, setMovements] = useSaved("sole-rise-movements-v1", []);
  const [reviews, setReviews] = useSaved("sole-rise-reviews-v1", []);
  const [accounts, setAccounts] = useSaved("sole-rise-accounts-v1", []);
  const [session, setSession] = useSaved("sole-rise-session-v1", null);
  const [wishlist, setWishlist] = useSaved("sole-rise-wishlist-v2", []);
  const [notify, setNotify] = useSaved("sole-rise-notify-v1", []);
  const [modal, setModal] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [story, setStory] = useState(null);
  const [authOpts, setAuthOpts] = useState({ mode: "signup", role: "Buyer", then: null });
  const [listingPrefill, setListingPrefill] = useState(null);
  const [toast, setToast] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const account = accounts.find((a) => a.id === session) || null;
  const user = publicUser(account);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const selected = products.find((p) => p.id === selectedId) || null;

  useEffect(() => {
    const update = () => {
      const value = hashPage();
      if (value) setPage(value);
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function resetDemo(message = "Demo data reset. Sign in with a demo account.") {
    const demo = await buildDemoData();
    setAccounts(demo.accounts);
    setProducts(demo.products);
    setOrders(demo.orders);
    setPurchaseOrders(demo.purchaseOrders);
    setMovements(demo.movements);
    setReviews(demo.reviews);
    setWishlist(demo.wishlist);
    setNotify(demo.notify);
    setCart([]);
    setSession(null);
    setModal(null);
    setToast(message);
    navigate("home");
  }
  useEffect(() => {
    if (process.env.NODE_ENV === "test") return;
    try {
      if (localStorage.getItem("sole-rise-seeded-v2")) return;
      localStorage.setItem("sole-rise-seeded-v2", "1");
    } catch {
      return;
    }
    resetDemo("Demo data loaded. Try the demo accounts from Sign in.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function navigate(value) {
    setPage(value);
    window.location.hash = value;
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function openAuth(mode = "signup", role = "Buyer", then = null) {
    setAuthOpts({ mode, role, then });
    setModal("auth");
  }
  function openProduct(product) {
    setSelectedId(product.id);
    setModal("product");
  }
  function openStory(title, body) {
    setStory({ title, body });
    setModal("story");
  }
  function wish(id) {
    setWishlist((items) => (items.includes(id) ? items.filter((item) => item !== id) : [...items, id]));
  }
  function requestRestock(product) {
    if (!user) {
      openAuth("signup", "Buyer");
      setToast("Create an account to request a restock.");
      return;
    }
    if (notify.includes(product.id)) return;
    setNotify([...notify, product.id]);
    setToast(`Requested. ${product.watchers + 1} people are now waiting on ${product.seller}.`);
  }
  function startAccount() {
    if (user) navigate("account");
    else openAuth("signin");
  }
  function finishAuth(next, message) {
    setSession(next.id);
    setToast(message);
    const then = authOpts.then;
    setModal(then === "checkout" ? "checkout" : null);
    if (!then && canSell(next)) navigate("account");
  }
  function signOut() {
    setSession(null);
    setModal(null);
    setToast("You are signed out.");
    if (page === "account") navigate("home");
  }
  function changeRole(role) {
    if (role === "Buyer" && products.some((p) => p.ownerId === user.id)) {
      setToast("Remove your listings before switching back to Buyer.");
      return;
    }
    setAccounts(accounts.map((a) => (a.id === user.id ? { ...a, role } : a)));
    setToast(`You now have a ${role} account.`);
  }
  function upgrade(role) {
    changeRole(role);
    navigate("account");
  }

  /* ---- bag and checkout ---- */
  function add(product, size, qty = 1) {
    if (user && product.ownerId === user.id) {
      setToast("That pair is your own listing.");
      return;
    }
    const updated = addCartItem(cart, product, size, qty);
    if (updated === cart) {
      setToast("All available pairs in that size are already in your bag.");
      return;
    }
    setCart(updated);
    setModal("cart");
    setToast("Added to your bag. Good choice.");
  }
  function changeQuantity(item, delta) {
    const stock = products.find((row) => row.id === item.id)?.stockBySize?.[item.size] || 0;
    if (delta > 0 && item.quantity >= stock) {
      setToast("You have reached the available stock in that size.");
      return;
    }
    setCart(
      cart
        .map((row) => (row.id === item.id && row.size === item.size ? { ...row, quantity: row.quantity + delta } : row))
        .filter((row) => row.quantity > 0),
    );
  }
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING ? 0 : 150;

  function startCheckout() {
    if (!user) {
      openAuth("signin", "Buyer", "checkout");
      setToast("Sign in or create an account to check out.");
      return;
    }
    setModal("checkout");
  }
  function checkout(event) {
    event.preventDefault();
    if (!cart.length || !user) return;
    const invalid = cart.some((item) => {
      const current = products.find((p) => p.id === item.id);
      return !current || (current.stockBySize?.[item.size] || 0) < item.quantity;
    });
    if (invalid) {
      setToast("Stock changed. Please remove unavailable items from your bag.");
      setModal("cart");
      return;
    }
    const placedAt = new Date();
    const id = "SR-" + Date.now().toString().slice(-7);
    const items = cart.map(({ id: pid, sku, name, brand, image, size, quantity, price, cost, condition, ownerId, seller }) => ({
      id: pid,
      sku,
      name,
      brand,
      image,
      size,
      quantity,
      price,
      cost: cost || 0,
      condition,
      ownerId: ownerId || null,
      seller,
    }));
    const recipient = new FormData(event.currentTarget).get("recipient") || user.name;
    setOrders([
      {
        id,
        date: placedAt.toISOString(),
        buyerId: user.id,
        recipient,
        items,
        shipping,
        total: subtotal + shipping,
        shipments: newShipments(items, placedAt),
      },
      ...orders,
    ]);
    setProducts(removeSoldStock(products, items));
    setCart([]);
    setModal("success");
  }

  /* ---- seller studio actions ---- */
  const logMovement = (productId, size, qty, type, ref, note) =>
    setMovements((rows) => [
      { id: "MV-" + Date.now() + Math.floor(Math.random() * 90), productId, size, qty, type, ref, note, at: new Date().toISOString(), by: user?.name || "" },
      ...rows,
    ]);
  const studioActions = {
    onAdjustStock(productId, size, delta, note = "Manual adjustment") {
      setProducts((rows) => rows.map((p) => (p.id === productId ? adjustStock(p, size, delta) : p)));
      logMovement(productId, size, delta, "Adjustment", null, note);
    },
    onUpdateProduct(productId, patch) {
      setProducts((rows) => rows.map((p) => (p.id === productId ? { ...p, ...patch } : p)));
      setToast("Saved.");
    },
    onRemove(productId) {
      setProducts((rows) => rows.filter((p) => p.id !== productId));
      setCart((rows) => rows.filter((item) => item.id !== productId));
      setToast("Listing removed from your store.");
    },
    onAdvanceShipment(orderId, key) {
      setOrders((rows) =>
        rows.map((o) =>
          o.id === orderId && o.shipments?.[key]
            ? { ...o, shipments: { ...o.shipments, [key]: advanceShipment(o.shipments[key], o.id) } }
            : o,
        ),
      );
    },
    onCreatePO(po) {
      setPurchaseOrders((rows) => [{ ...po, ownerId: user.id }, ...rows]);
      setToast(`${po.id} created for ${po.supplier}.`);
    },
    onReceivePO(poId) {
      const po = purchaseOrders.find((row) => row.id === poId);
      if (!po || po.status !== "Ordered") return;
      setPurchaseOrders((rows) =>
        rows.map((row) => (row.id === poId ? { ...row, status: "Received", receivedAt: new Date().toISOString() } : row)),
      );
      setProducts((rows) =>
        rows.map((p) =>
          p.id === po.productId
            ? Object.entries(po.sizeSplit).reduce((next, [size, qty]) => adjustStock(next, size, Number(qty)), p)
            : p,
        ),
      );
      Object.entries(po.sizeSplit).forEach(([size, qty]) =>
        logMovement(po.productId, size, Number(qty), "PO receipt", po.id, `Received from ${po.supplier}`),
      );
      setToast(`${po.id} received. Stock updated by size.`);
    },
    onCancelPO(poId) {
      setPurchaseOrders((rows) => rows.map((row) => (row.id === poId ? { ...row, status: "Cancelled" } : row)));
      setToast(`${poId} cancelled.`);
    },
  };

  function postReview(review) {
    setReviews([
      { ...review, id: "RV-" + Date.now(), userId: user.id, author: user.name, at: new Date().toISOString(), verified: true },
      ...reviews,
    ]);
    setToast("Thanks. Your fit report is live and helps the next buyer.");
  }
  function joinCircle(index) {
    if (!user) {
      openAuth("signup", "Buyer");
      setToast("Create an account to join a circle.");
      return;
    }
    setAccounts(
      accounts.map((a) =>
        a.id === user.id
          ? {
              ...a,
              circles: (a.circles || []).includes(index)
                ? a.circles.filter((c) => c !== index)
                : [...(a.circles || []), index],
            }
          : a,
      ),
    );
  }
  const circles = account?.circles || [];
  function openListing(prefill = null) {
    setListingPrefill(prefill);
    setModal("listing");
  }

  const toFree = Math.max(0, FREE_SHIPPING - subtotal);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <NavigationBar
        page={page}
        navigate={navigate}
        cartCount={cartCount}
        onCart={() => setModal("cart")}
        onAccount={startAccount}
        user={user}
      />
      <main id="main" ref={mainRef}>
        {page === "home" && (
          <Home
            products={products}
            reviews={reviews}
            wishlist={wishlist}
            notify={notify}
            onNotify={requestRestock}
            navigate={navigate}
            onOpen={openProduct}
            onWish={wish}
            user={user}
            openAuth={openAuth}
            upgrade={upgrade}
            setFilters={setFilters}
            filtersBase={DEFAULT_FILTERS}
          />
        )}

        {page === "shop" && (
          <>
            <ShopPage
              products={products}
              wishlist={wishlist}
              onOpen={openProduct}
              onWish={wish}
              filters={filters}
              setFilters={setFilters}
            />
            <button className="cart-fab" onClick={() => setModal("cart")} aria-label={`Open bag, ${cartCount} items`}>
              <HandbagSimple size={24} weight="bold" />
              {cartCount > 0 && <span>{cartCount}</span>}
            </button>
          </>
        )}

        {page === "community" && (
          <CommunityPage
            products={products}
            reviews={reviews}
            orders={orders}
            user={user}
            wishlist={wishlist}
            notify={notify}
            onNotify={requestRestock}
            onWish={wish}
            onOpen={openProduct}
            onPostReview={postReview}
            circles={circles}
            onJoinCircle={joinCircle}
            openAuth={openAuth}
          />
        )}

        {page === "sell" && (
          <SellPitch user={user} navigate={navigate} onJoin={(role) => openAuth("signup", role)} onUpgrade={upgrade} />
        )}

        {page === "account" &&
          (user ? (
            <AccountPage
              user={user}
              products={products}
              orders={orders}
              purchaseOrders={purchaseOrders}
              movements={movements}
              reviews={reviews}
              wishlist={wishlist}
              joinedCount={circles.length}
              navigate={navigate}
              onOpen={openProduct}
              onAddListing={openListing}
              studioActions={studioActions}
              onRole={changeRole}
              onSignOut={signOut}
              onReset={() => resetDemo()}
            />
          ) : (
            <section className="section gate">
              <h1>Your account.</h1>
              <p className="muted">Sign in to see your orders, saved pairs and store.</p>
              <button className="button primary" onClick={() => openAuth("signin")}>
                Sign in <ArrowUpRight size={16} weight="bold" />
              </button>
            </section>
          ))}
      </main>

      <footer>
        <div className="footer-top">
          <div>
            <Brand onClick={() => navigate("home")} />
            <p>
              Good shoes connect us.
              <br />
              Great stories move us forward.
            </p>
          </div>
          <div>
            <h3>Explore</h3>
            <a href="#shop" onClick={() => navigate("shop")}>
              The collection
            </a>
            <a href="#community" onClick={() => navigate("community")}>
              Our community
            </a>
            <a href="#sell" onClick={() => navigate("sell")}>
              Sell on Sole Rise
            </a>
          </div>
          <div>
            <h3>The good stuff</h3>
            <button
              onClick={() =>
                openStory(
                  "How Sole Rise works",
                  "Browse every brand, filter by size, color and model, and add a pair to your bag. Create a Buyer, Seller or Reseller account. Sellers and resellers get a studio with inventory by size, demand forecasts, purchase orders and a delivery timeline for every order. Buyers track each shipment and post fit reports once a pair arrives. Everything is stored only in this browser.",
                )
              }
            >
              How it works
            </button>
            <button
              onClick={() =>
                openStory(
                  "Marketplace care",
                  "This is a local prototype with sample products, stores and 90 days of generated order history. No real authentication, authenticity checks, payment collection, shipping, or seller payouts take place. Ratings, saves and fit reports are illustrative demo data. Verification, returns, and disputes must be implemented before public launch.",
                )
              }
            >
              Marketplace care
            </button>
            <button onClick={startAccount}>{user ? "Your account" : "Sign in"}</button>
          </div>
          <div className="footer-message">
            <span>
              Less scrolling.
              <br />
              More sole.
            </span>
            <button
              className="round-arrow"
              aria-label="Back to top"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
                })
              }
            >
              <ArrowUp size={18} weight="bold" />
            </button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Sole Rise. An independent marketplace concept.</span>
          <span>
            Local demo. No real transactions.
            <button className="reset-link" onClick={() => resetDemo()}>
              Reset demo data
            </button>
          </span>
        </div>
      </footer>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      {modal === "product" && selected && (
        <Dialog title="A closer look" message={toast} close={() => setModal(null)}>
          <ProductDetails
            product={selected}
            siblings={products.filter((p) => p.brand === selected.brand && p.model === selected.model)}
            onSelect={openProduct}
            onAdd={add}
            wished={wishlist.includes(selected.id)}
            onWish={wish}
            own={!!user && selected.ownerId === user.id}
            reviews={reviews}
            notified={notify.includes(selected.id)}
            onNotify={requestRestock}
          />
        </Dialog>
      )}
      {modal === "auth" && (
        <Dialog title={authOpts.mode === "signin" ? "Welcome back." : "Your next chapter."} message={toast} close={() => setModal(null)}>
          <AuthDialog
            key={authOpts.mode + authOpts.role}
            accounts={accounts}
            initialMode={authOpts.mode}
            initialRole={authOpts.role}
            onAuthed={(next) => finishAuth(next, `Welcome back, ${next.name.split(" ")[0]}.`)}
            onCreate={(next) => {
              setAccounts([...accounts, next]);
              finishAuth(next, `Your ${next.role} account is ready.`);
            }}
          />
        </Dialog>
      )}
      {modal === "listing" && user && (
        <Dialog title="List your next pair." message={toast} close={() => setModal(null)}>
          <ListingForm
            user={user}
            prefill={listingPrefill}
            onSave={(product) => {
              if (!Object.keys(product.stockBySize).length) {
                setToast("Add stock to at least one size.");
                return;
              }
              setProducts([{ ...product, seller: user.name, sellerRole: user.role, ownerId: user.id }, ...products]);
              Object.entries(product.stockBySize).forEach(([size, qty]) =>
                logMovement(product.id, size, qty, "Adjustment", null, "Opening stock"),
              );
              setModal(null);
              setToast("Your listing is live in the demo shop.");
            }}
          />
        </Dialog>
      )}
      {modal === "cart" && (
        <Dialog title="Your cart" message={toast} close={() => setModal(null)} drawer>
          {cart.length ? (
            <>
              <p className="cart-count">{cartCount} {cartCount === 1 ? "item" : "items"}</p>
              {toFree > 0 && (
                <p className="cart-free">
                  <Truck size={16} aria-hidden="true" /> Add {money(toFree)} more for free delivery
                  <span className="cart-free-bar" aria-hidden="true">
                    <i style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING) * 100)}%` }} />
                  </span>
                </p>
              )}
              <div className="cart-items">
                {cart.map((item) => (
                  <article className="cart-item" key={item.id + item.size}>
                    <img src={asset(item.image)} alt="" />
                    <div>
                      <h3>{item.name}</h3>
                      <p>
                        US {item.size}, {item.condition}, {item.seller}
                      </p>
                      <div className="quantity">
                        <button aria-label={`Decrease ${item.name} size ${item.size}`} onClick={() => changeQuantity(item, -1)}>
                          <Minus size={14} weight="bold" />
                        </button>
                        <span>{item.quantity}</span>
                        <button aria-label={`Increase ${item.name} size ${item.size}`} onClick={() => changeQuantity(item, 1)}>
                          <Plus size={14} weight="bold" />
                        </button>
                      </div>
                    </div>
                    <div className="cart-line">
                      <button
                        className="icon-button"
                        aria-label={`Remove ${item.name} size ${item.size}`}
                        onClick={() => setCart(cart.filter((row) => !(row.id === item.id && row.size === item.size)))}
                      >
                        <Trash size={18} />
                      </button>
                      <b>{money(item.price * item.quantity)}</b>
                    </div>
                  </article>
                ))}
              </div>
              <div className="cart-summary">
                <p>
                  <span>Subtotal</span>
                  <b>{money(subtotal)}</b>
                </p>
                <p>
                  <span>Delivery</span>
                  <b className={shipping ? "" : "free"}>{shipping ? money(shipping) : "Free"}</b>
                </p>
                <p className="cart-total">
                  <span>Total</span>
                  <b>{money(subtotal + shipping)}</b>
                </p>
                <button className="button primary full" onClick={startCheckout}>
                  Checkout now
                </button>
                <p className="small muted">Demo checkout. No payment will be collected.</p>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>Your next favorite is out there.</h3>
              <p>Your bag is empty. Let us change that.</p>
              <button
                className="button primary"
                onClick={() => {
                  setModal(null);
                  navigate("shop");
                }}
              >
                Explore the collection
              </button>
            </div>
          )}
        </Dialog>
      )}
      {modal === "checkout" && user && (
        <Dialog title="Demo checkout" message={toast} close={() => setModal(null)}>
          <form onSubmit={checkout}>
            <p className="notice">
              This simulates an order. Use sample details. No payment or shipment is made, and address details are not saved.
              Your order will get a live delivery timeline.
            </p>
            <label>
              Recipient name
              <input name="recipient" required defaultValue={user.name} />
            </label>
            <label>
              Delivery address
              <textarea name="address" required placeholder="123 Sample Street, Manila" />
            </label>
            <div className="cart-summary">
              <p>
                <span>Subtotal</span>
                <b>{money(subtotal)}</b>
              </p>
              <p>
                <span>Delivery</span>
                <b>{shipping ? money(shipping) : "Free"}</b>
              </p>
              <p className="cart-total">
                <span>Total</span>
                <b>{money(subtotal + shipping)}</b>
              </p>
            </div>
            <button className="button primary full" type="submit">
              Place demo order
            </button>
            <button className="text-link full" type="button" onClick={() => setModal("cart")}>
              Back to bag
            </button>
          </form>
        </Dialog>
      )}
      {modal === "success" && (
        <Dialog title="Great choice." message={toast} close={() => setModal(null)}>
          <div className="empty-state">
            <span className="success-mark">
              <Check size={28} weight="bold" />
            </span>
            <h3>Your demo order is confirmed.</h3>
            <p>
              {orders[0]?.id}, {money(orders[0]?.total || 0)}
            </p>
            <p>The seller has been notified. Follow packing, shipping and delivery in your account.</p>
            <button
              className="button primary"
              onClick={() => {
                setModal(null);
                navigate("account");
              }}
            >
              Track your order <ArrowUpRight size={16} weight="bold" />
            </button>
          </div>
        </Dialog>
      )}
      {modal === "story" && story && (
        <Dialog title={story.title} message={toast} close={() => setModal(null)}>
          <p className="story-body">{story.body}</p>
        </Dialog>
      )}
    </>
  );
}
