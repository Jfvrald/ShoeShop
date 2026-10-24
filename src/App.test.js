import React from "react";
import { render, screen, fireEvent, within, waitFor, act } from "@testing-library/react";
import App from "./App";
import { addCartItem, initialProducts } from "./store";

beforeAll(() => {
  window.matchMedia = () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  window.scrollTo = jest.fn();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
/* jsdom delivers hashchange events on a later task; let them land before and
   after each navigation so a stale event cannot flip the page mid-test. */
const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
beforeEach(async () => {
  localStorage.clear();
  window.location.hash = "home";
  await flush();
});

const click = (name, scope = screen) => fireEvent.click(scope.getByRole("button", { name }));
const dialog = () => within(screen.getByRole("dialog"));
const stored = (key) => JSON.parse(localStorage.getItem(key));

/* Opens the auth dialog from the nav, creates an account and waits for it. */
async function signUp({ name, email, password = "sneakers-1", role = "Buyer" }) {
  fireEvent.click(screen.getAllByRole("button", { name: "Sign in" })[0]);
  fireEvent.click(dialog().getByRole("tab", { name: "Create account" }));
  fireEvent.change(dialog().getByLabelText("Display name"), { target: { value: name } });
  fireEvent.change(dialog().getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(dialog().getByLabelText("Password"), { target: { value: password } });
  click(new RegExp("^" + role), dialog());
  click(`Create ${role.toLowerCase()} account`, dialog());
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
}
async function signIn(email, password) {
  fireEvent.click(screen.getAllByRole("button", { name: "Sign in" })[0]);
  fireEvent.change(dialog().getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(dialog().getByLabelText("Password"), { target: { value: password } });
  click("Sign in", dialog());
}
function signOut() {
  fireEvent.click(screen.getByRole("tab", { name: "Account" }));
  click("Sign out");
}
async function goShop() {
  fireEvent.click(screen.getByRole("link", { name: "Shop", exact: true }));
  await flush();
}
function addToBag(productName, size) {
  click(`View ${productName}`);
  fireEvent.click(dialog().getByRole("button", { name: new RegExp(`^${size} `) }));
  fireEvent.click(dialog().getByRole("button", { name: /^Add to bag/ }));
}
function checkoutAs(address = "123 Sample Manila") {
  click("Checkout now", dialog());
  fireEvent.change(dialog().getByLabelText("Delivery address"), { target: { value: address } });
  click("Place demo order", dialog());
}

test("stock is held per size and repeat additions merge the selected size", () => {
  const product = { ...initialProducts[0], stockBySize: { 8: 2, 9: 0 } };
  let cart = addCartItem([], product, "8");
  cart = addCartItem(cart, product, "8");
  expect(cart).toHaveLength(1);
  expect(cart[0].quantity).toBe(2);
  expect(addCartItem(cart, product, "8")).toBe(cart);
  expect(addCartItem(cart, product, "9")).toBe(cart);
  expect(addCartItem([], product, "8", 5)[0].quantity).toBe(2);
});

test("buyer signs up, fills a bag and places a demo order tied to their account", async () => {
  render(<App />);
  await signUp({ name: "Alex Cruz", email: "Alex@Example.com" });
  await waitFor(() =>
    expect(stored("sole-rise-accounts-v1")[0]).toMatchObject({
      email: "alex@example.com",
      role: "Buyer",
    }),
  );
  expect(localStorage.getItem("sole-rise-accounts-v1")).not.toContain("sneakers-1");
  await goShop();
  click("View Air Jordan 1 Retro High Bred Toe");
  expect(dialog().getByRole("button", { name: "Select a size" })).toBeDisabled();
  fireEvent.click(dialog().getByRole("button", { name: /^8 / }));
  fireEvent.click(dialog().getByRole("button", { name: "Increase quantity" }));
  fireEvent.click(dialog().getByRole("button", { name: /^Add to bag/ }));
  expect(dialog().getByText("2 items")).toBeInTheDocument();
  checkoutAs();
  expect(screen.getByText("Your demo order is confirmed.")).toBeInTheDocument();
  const [order] = stored("sole-rise-orders-v3");
  expect(order.total).toBe(19790);
  expect(order.buyerId).toBe(stored("sole-rise-accounts-v1")[0].id);
  expect(Object.values(order.shipments)[0].status).toBe("Placed");
  expect(stored("sole-rise-cart-v3")).toEqual([]);
  const jordan = stored("sole-rise-products-v3").find((p) => p.id === "jordan-new");
  expect(jordan.stockBySize["8"]).toBe(0);
  expect(localStorage.getItem("sole-rise-orders-v3")).not.toContain("123 Sample Manila");
});

test("checkout asks guests to sign in and then continues to checkout", async () => {
  render(<App />);
  await goShop();
  addToBag("Nike Flyknit Racer", "7");
  click("Checkout now", dialog());
  expect(dialog().getByText("Welcome back.")).toBeInTheDocument();
  fireEvent.click(dialog().getByRole("tab", { name: "Create account" }));
  fireEvent.change(dialog().getByLabelText("Display name"), { target: { value: "Mika" } });
  fireEvent.change(dialog().getByLabelText("Email"), { target: { value: "mika@example.com" } });
  fireEvent.change(dialog().getByLabelText("Password"), { target: { value: "longenough1" } });
  click("Create buyer account", dialog());
  await waitFor(() => expect(screen.getByRole("dialog", { name: "Demo checkout" })).toBeInTheDocument());
  expect(stored("sole-rise-cart-v3")).toHaveLength(1);
});

test("sign in rejects a wrong password and accepts the right one", async () => {
  render(<App />);
  await signUp({ name: "Jo", email: "jo@example.com", password: "rightpass1" });
  fireEvent.click(screen.getByRole("button", { name: "Jo" }));
  signOut();
  expect(screen.getAllByRole("button", { name: "Sign in" })[0]).toBeInTheDocument();
  await signIn("jo@example.com", "nope");
  expect(await screen.findByRole("alert")).toHaveTextContent("do not match");
  fireEvent.change(dialog().getByLabelText("Password"), { target: { value: "rightpass1" } });
  click("Sign in", dialog());
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Jo" })).toBeInTheDocument();
});

test("duplicate emails are refused on sign up", async () => {
  render(<App />);
  await signUp({ name: "Jo", email: "jo@example.com" });
  fireEvent.click(screen.getByRole("button", { name: "Jo" }));
  signOut();
  fireEvent.click(screen.getAllByRole("button", { name: "Sign in" })[0]);
  fireEvent.click(dialog().getByRole("tab", { name: "Create account" }));
  fireEvent.change(dialog().getByLabelText("Display name"), { target: { value: "Other" } });
  fireEvent.change(dialog().getByLabelText("Email"), { target: { value: "JO@example.com" } });
  fireEvent.change(dialog().getByLabelText("Password"), { target: { value: "anotherpass1" } });
  click("Create buyer account", dialog());
  expect(await screen.findByRole("alert")).toHaveTextContent("already exists");
  expect(stored("sole-rise-accounts-v1")).toHaveLength(1);
});

test("reseller lists a pre-loved pair that shoppers can find, labelled as a reseller", async () => {
  render(<App />);
  await signUp({ name: "Demo Studio", email: "studio@example.com", role: "Reseller" });
  expect(screen.getByRole("heading", { name: "Demo Studio" })).toBeInTheDocument();
  click("Add a listing");
  fireEvent.change(dialog().getByLabelText("Product name"), { target: { value: "My archived Jordan" } });
  fireEvent.change(dialog().getByLabelText("Price (PHP)"), { target: { value: "4500" } });
  click("Publish listing", dialog());
  fireEvent.click(screen.getByRole("link", { name: "Shop", exact: true }));
  fireEvent.change(screen.getByLabelText("Search the collection"), { target: { value: "archived" } });
  expect(screen.getByRole("button", { name: "View My archived Jordan" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "View Nike Flyknit Racer" })).not.toBeInTheDocument();
  const listing = stored("sole-rise-products-v3")[0];
  expect(listing).toMatchObject({ condition: "Pre-loved", sellerRole: "Reseller", stockBySize: { 9: 1 } });
  expect(listing.ownerId).toBe(stored("sole-rise-accounts-v1")[0].id);
});

test("sellers can only list new pairs and cannot buy their own listing", async () => {
  render(<App />);
  await signUp({ name: "Store One", email: "store@example.com", role: "Seller" });
  click("Add a listing");
  expect(dialog().getByLabelText("Condition")).toHaveValue("New");
  expect(dialog().getByLabelText("Condition")).toHaveAttribute("readonly");
  fireEvent.change(dialog().getByLabelText("Product name"), { target: { value: "Fresh Pair" } });
  fireEvent.change(dialog().getByLabelText("Price (PHP)"), { target: { value: "5000" } });
  click("Publish listing", dialog());
  await goShop();
  click("View Fresh Pair");
  expect(dialog().getByRole("button", { name: "This is your listing" })).toBeDisabled();
});

test("a seller sees a sale after a different buyer checks out their pair", async () => {
  render(<App />);
  await signUp({ name: "Store One", email: "store@example.com", role: "Seller" });
  click("Add a listing");
  fireEvent.change(dialog().getByLabelText("Product name"), { target: { value: "Fresh Pair" } });
  fireEvent.change(dialog().getByLabelText("Price (PHP)"), { target: { value: "5000" } });
  click("Publish listing", dialog());
  signOut();
  await signUp({ name: "Buyer Two", email: "buyer@example.com" });
  await goShop();
  addToBag("Fresh Pair", "9");
  checkoutAs();
  expect(await screen.findByText("Your demo order is confirmed.")).toBeInTheDocument();
  click("Close dialog");
  fireEvent.click(screen.getByRole("button", { name: "Buyer" }));
  signOut();
  await signIn("store@example.com", "sneakers-1");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole("link", { name: "My studio" }));
  fireEvent.click(screen.getByRole("tab", { name: /^Orders/ }));
  expect(screen.getAllByText(/Fresh Pair/).length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: /Mark packed/ })).toBeInTheDocument();
});

test("filters, wishlist and empty-state reset work together", async () => {
  render(<App />);
  await goShop();
  expect(screen.getAllByRole("button", { name: /^View / })).toHaveLength(28);
  click("Save Nike Flyknit Racer");
  click(/Saved \(1\)/);
  expect(screen.getByRole("button", { name: "View Nike Flyknit Racer" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "View Air Jordan 1 Retro High Bred Toe" })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Search the collection"), { target: { value: "no match" } });
  expect(screen.getByText("No pairs match. Yet.")).toBeInTheDocument();
  click("Clear all filters");
  expect(screen.getAllByRole("button", { name: /^View / })).toHaveLength(28);
  fireEvent.click(screen.getByLabelText(/^Vans/, { selector: "input" }));
  expect(screen.getAllByRole("button", { name: /^View / })).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: /^Sold by/ }));
  click("Resellers");
  expect(screen.getByText("No pairs match. Yet.")).toBeInTheDocument();
});

test("cart removal and community membership belongs to the signed-in account", async () => {
  render(<App />);
  await goShop();
  addToBag("Nike Flyknit Racer", "7");
  click("Remove Nike Flyknit Racer size 7");
  expect(screen.getByText("Your next favorite is out there.")).toBeInTheDocument();
  click("Close dialog");
  fireEvent.click(screen.getByRole("link", { name: "Community", exact: true }));
  await flush();
  fireEvent.click(screen.getAllByRole("button", { name: /Join the circle/ })[0]);
  expect(dialog().getByRole("tab", { name: "Create account" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  await signUp({ name: "Alex", email: "alex@example.com" });
  fireEvent.click(screen.getAllByRole("button", { name: /Join the circle/ })[0]);
  expect(screen.getByRole("button", { name: /Joined/ })).toBeInTheDocument();
  expect(stored("sole-rise-accounts-v1")[0].circles).toEqual([0]);
});

test("saved bag and session restore after remount", async () => {
  localStorage.setItem(
    "sole-rise-cart-v3",
    JSON.stringify([{ ...initialProducts[0], stockBySize: { 8: 1 }, size: "8", quantity: 1 }]),
  );
  const first = render(<App />);
  await signUp({ name: "Alex", email: "alex@example.com" });
  click("Shopping bag, 1 items");
  expect(within(screen.getByRole("dialog")).getByText(/US 8, New/)).toBeInTheDocument();
  first.unmount();
  render(<App />);
  expect(screen.getByRole("button", { name: "Alex" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Shopping bag, 1 items" })).toBeInTheDocument();
});

test("navigation menu closes after choosing a destination", () => {
  render(<App />);
  const menu = screen.getByRole("button", { name: "Toggle navigation" });
  expect(menu).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(menu);
  expect(menu).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(screen.getByRole("link", { name: "Shop", exact: true }));
  expect(menu).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByRole("heading", { name: "Shop collection" })).toBeInTheDocument();
});
