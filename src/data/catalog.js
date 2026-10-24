/* Demo catalog. Every pair carries what a storefront AND an ERP need:
   sale price + landed cost (margin), stock per US size, reorder point, supplier
   lead time and a warehouse bin. Ratings and "watchers" are illustrative demo
   numbers, not real customer data. */

// "7:2 8:3" -> { "7": 2, "8": 3 }
const sizes = (spec) =>
  Object.fromEntries(
    spec.trim().split(/\s+/).map((pair) => {
      const [size, qty] = pair.split(":");
      return [size, Number(qty)];
    }),
  );

const KM = { seller: "Kicks Manila", sellerRole: "Seller", ownerId: "acct-demo-seller" };
const SC = { seller: "Second Chance Kicks", sellerRole: "Reseller", ownerId: "acct-demo-reseller" };

/* id, sku, name, brand, model, category, gender, color, price, compareAt, cost,
   image, stock, reorder point, lead days, supplier, bin, rating, watchers */
const row = ({ stock, ...o }) => ({
  condition: "New",
  compareAt: null,
  tone: "sand",
  tag: "In stock",
  ...o,
  stockBySize: sizes(stock),
});

export const CATALOG = [
  // Kicks Manila: the multi-brand reseller shop with a full ERP history ----------
  row({ id: "aj1-high-royal", sku: "KM-AJ1-HR-001", name: "Air Jordan 1 Retro High OG Royal Toe", brand: "Jordan", model: "Air Jordan 1", category: "Basketball", gender: "Men", color: "Blue", price: 10495, cost: 7400, image: "catalog/aj1-high-royal.jpg", stock: "8:2 8.5:1 9:3 9.5:2 10:3 10.5:1 11:2", reorderPoint: 8, leadDays: 14, supplier: "Jordan Brand PH", bin: "A-01-02", rating: 4.9, watchers: 214, tag: "Most wanted", ...KM }),
  row({ id: "aj1-mid-chicago", sku: "KM-AJ1-MD-002", name: "Air Jordan 1 Mid Chicago Toe", brand: "Jordan", model: "Air Jordan 1", category: "Basketball", gender: "Men", color: "Red", price: 7995, compareAt: 8995, cost: 5600, image: "catalog/aj1-mid-chicago.jpg", stock: "7:1 8:2 9:3 10:2 11:1", reorderPoint: 6, leadDays: 14, supplier: "Jordan Brand PH", bin: "A-01-03", rating: 4.8, watchers: 131, tag: "Sale", ...KM }),
  row({ id: "aj1-low-bred", sku: "KM-AJ1-LW-003", name: "Air Jordan 1 Low Bred Toe", brand: "Jordan", model: "Air Jordan 1", category: "Lifestyle", gender: "Unisex", color: "Red", price: 6495, cost: 4500, image: "catalog/aj1-low-bred.jpg", stock: "6:2 7:3 8:4 9:4 10:3 11:2", reorderPoint: 8, leadDays: 14, supplier: "Jordan Brand PH", bin: "A-01-04", rating: 4.7, watchers: 96, ...KM }),
  row({ id: "aj1-flyknit-royal", sku: "KM-AJ1-FK-004", name: "Air Jordan 1 Flyknit Royal", brand: "Jordan", model: "Air Jordan 1", category: "Basketball", gender: "Men", color: "Blue", price: 8995, cost: 6300, image: "catalog/aj1-flyknit-royal.jpg", stock: "8:1 9:1 10:1", reorderPoint: 4, leadDays: 21, supplier: "Jordan Brand PH", bin: "A-01-05", rating: 4.6, watchers: 58, tag: "Low stock", ...KM }),
  row({ id: "af1-white", sku: "KM-AF1-WH-005", name: "Air Force 1 '07 Triple White", brand: "Nike", model: "Air Force 1", category: "Lifestyle", gender: "Unisex", color: "White", price: 5895, cost: 3900, image: "catalog/af1-white.jpg", stock: "5:4 6:5 7:6 8:7 9:8 10:7 11:4 12:2", reorderPoint: 14, leadDays: 10, supplier: "Nike Distribution PH", bin: "B-02-01", rating: 4.9, watchers: 188, tag: "Best seller", ...KM }),
  row({ id: "af1-black", sku: "KM-AF1-BK-006", name: "Air Force 1 '07 Black Leather", brand: "Nike", model: "Air Force 1", category: "Lifestyle", gender: "Men", color: "Black", price: 5895, cost: 3900, image: "catalog/af1-black.jpg", stock: "7:3 8:4 9:5 10:4 11:3", reorderPoint: 10, leadDays: 10, supplier: "Nike Distribution PH", bin: "B-02-02", rating: 4.8, watchers: 102, ...KM }),
  row({ id: "af1-wheat", sku: "KM-AF1-WT-007", name: "Air Force 1 Utility Wheat", brand: "Nike", model: "Air Force 1", category: "Lifestyle", gender: "Men", color: "Brown", price: 6295, compareAt: 6995, cost: 4300, image: "catalog/af1-wheat.jpg", stock: "8:2 9:3 10:2 11:1", reorderPoint: 6, leadDays: 10, supplier: "Nike Distribution PH", bin: "B-02-03", rating: 4.7, watchers: 74, tag: "Sale", ...KM }),
  row({ id: "af1-shadow-pastel", sku: "KM-AF1-SH-008", name: "Air Force 1 Shadow Pastel", brand: "Nike", model: "Air Force 1", category: "Lifestyle", gender: "Women", color: "Pink", price: 6795, cost: 4600, image: "catalog/af1-shadow-pastel.jpg", stock: "5:0 6:1 7:0 8:0", reorderPoint: 6, leadDays: 10, supplier: "Nike Distribution PH", bin: "B-02-04", rating: 4.9, watchers: 167, tag: "Trending", ...KM }),
  row({ id: "air-max-90-hyper-pink", sku: "KM-AM90-PK-009", name: "Air Max 90 Hyper Pink", brand: "Nike", model: "Air Max 90", category: "Lifestyle", gender: "Women", color: "Pink", price: 7295, cost: 5000, image: "catalog/air-max-90-hyper-pink.jpg", stock: "5:2 6:3 7:3 8:2", reorderPoint: 6, leadDays: 12, supplier: "Nike Distribution PH", bin: "B-03-01", rating: 4.8, watchers: 121, ...KM }),
  row({ id: "air-max-90-sunset", sku: "KM-AM90-OR-010", name: "Air Max 90 Sunset", brand: "Nike", model: "Air Max 90", category: "Lifestyle", gender: "Unisex", color: "Orange", price: 7495, compareAt: 8295, cost: 5200, image: "catalog/air-max-90-sunset.jpg", stock: "7:2 8:3 9:3 10:2", reorderPoint: 6, leadDays: 12, supplier: "Nike Distribution PH", bin: "B-03-02", rating: 4.6, watchers: 63, tag: "Sale", ...KM }),
  row({ id: "air-max-90-ultra-blue", sku: "KM-AM90-BL-011", name: "Air Max 90 Ultra Blue", brand: "Nike", model: "Air Max 90", category: "Running", gender: "Men", color: "Blue", price: 7195, cost: 5000, image: "catalog/air-max-90-ultra-blue.jpg", stock: "8:2 9:2 10:1", reorderPoint: 5, leadDays: 12, supplier: "Nike Distribution PH", bin: "B-03-03", rating: 4.5, watchers: 41, ...KM }),
  row({ id: "superrep-volt", sku: "KM-SR-VT-012", name: "Nike SuperRep Go Volt", brand: "Nike", model: "SuperRep", category: "Training & Gym", gender: "Men", color: "Green", price: 5495, cost: 3700, image: "catalog/superrep-volt.jpg", stock: "7:2 8:3 9:4 10:3 11:2", reorderPoint: 6, leadDays: 12, supplier: "Nike Distribution PH", bin: "C-01-01", rating: 4.7, watchers: 52, ...KM }),
  row({ id: "free-rn-flyknit-red", sku: "KM-FR-RD-013", name: "Nike Free RN Flyknit Red", brand: "Nike", model: "Free RN", category: "Running", gender: "Men", color: "Red", price: 5995, cost: 4000, image: "catalog/free-rn-flyknit-red.jpg", stock: "7:2 8:3 9:3 10:3 11:1", reorderPoint: 6, leadDays: 12, supplier: "Nike Distribution PH", bin: "C-01-02", rating: 4.7, watchers: 66, ...KM }),
  row({ id: "adidas-deerupt-grey", sku: "KM-AD-DR-014", name: "adidas Deerupt Runner Grey", brand: "Adidas", model: "Deerupt", category: "Running", gender: "Unisex", color: "Grey", price: 4995, compareAt: 5995, cost: 3200, image: "catalog/adidas-deerupt-grey.jpg", stock: "6:3 7:4 8:4 9:3 10:2", reorderPoint: 6, leadDays: 16, supplier: "adidas Trade PH", bin: "D-01-01", rating: 4.4, watchers: 29, tag: "Sale", ...KM }),
  row({ id: "adidas-prophere-teal", sku: "KM-AD-PR-015", name: "adidas Prophere Teal", brand: "Adidas", model: "Prophere", category: "Lifestyle", gender: "Unisex", color: "Teal", price: 5295, cost: 3500, image: "catalog/adidas-prophere-teal.jpg", stock: "7:2 8:3 9:3 10:2", reorderPoint: 5, leadDays: 16, supplier: "adidas Trade PH", bin: "D-01-02", rating: 4.5, watchers: 38, ...KM }),
  row({ id: "puma-court-white", sku: "KM-PU-CC-016", name: "Puma Court Classic White", brand: "Puma", model: "Court Classic", category: "Lifestyle", gender: "Men", color: "White", price: 3995, cost: 2500, image: "catalog/puma-court-white.jpg", stock: "7:4 8:5 9:5 10:4 11:3", reorderPoint: 8, leadDays: 18, supplier: "Puma Philippines", bin: "D-02-01", rating: 4.4, watchers: 24, ...KM }),
  row({ id: "vans-old-skool-burgundy", sku: "KM-VN-OS-017", name: "Vans Old Skool Burgundy", brand: "Vans", model: "Old Skool", category: "Skateboarding", gender: "Unisex", color: "Red", price: 3695, cost: 2300, image: "catalog/vans-old-skool-burgundy.jpg", stock: "5:3 6:4 7:5 8:5 9:4 10:3", reorderPoint: 8, leadDays: 18, supplier: "Vans Southeast Asia", bin: "D-02-02", rating: 4.8, watchers: 91, ...KM }),
  row({ id: "nb-574-peach", sku: "KM-NB-574-018", name: "New Balance 574 Peach Soda", brand: "New Balance", model: "574", category: "Lifestyle", gender: "Women", color: "Pink", price: 5495, cost: 3600, image: "catalog/nb-574-peach.jpg", stock: "5:2 6:3 7:3 8:2", reorderPoint: 5, leadDays: 16, supplier: "New Balance PH", bin: "D-03-01", rating: 4.7, watchers: 77, ...KM }),
  row({ id: "nb-247-olive", sku: "KM-NB-247-019", name: "New Balance 247 Olive", brand: "New Balance", model: "247", category: "Lifestyle", gender: "Men", color: "Green", price: 4795, cost: 3100, image: "catalog/nb-247-olive.jpg", stock: "8:2 9:3 10:3 11:2", reorderPoint: 5, leadDays: 16, supplier: "New Balance PH", bin: "D-03-02", rating: 4.6, watchers: 45, ...KM }),

  // Second Chance Kicks: pre-loved and deadstock resale ---------------------------
  row({ id: "sc-dunk-peach", sku: "SC-DNK-PC-101", name: "Dunk High Pastel Peach, worn twice", brand: "Nike", model: "Dunk", category: "Skateboarding", gender: "Women", color: "Pink", condition: "Pre-loved", price: 5200, cost: 3400, image: "catalog/dunk-high-peach.jpg", stock: "6:1 7:1", reorderPoint: 1, leadDays: 7, supplier: "Consignment", bin: "R-01-01", rating: 4.6, watchers: 88, tag: "Second life", tone: "sage", ...SC }),
  row({ id: "sc-af1-court", sku: "SC-AF1-CB-102", name: "Air Force 1 Court Blue, lightly worn", brand: "Nike", model: "Air Force 1", category: "Lifestyle", gender: "Unisex", color: "Blue", condition: "Pre-loved", price: 3800, cost: 2200, image: "catalog/af1-court-blue.jpg", stock: "8:1 9:1 10:1", reorderPoint: 1, leadDays: 7, supplier: "Consignment", bin: "R-01-02", rating: 4.5, watchers: 34, tag: "Second life", tone: "sage", ...SC }),
  row({ id: "sc-aj1-onfoot", sku: "SC-AJ1-LW-103", name: "Air Jordan 1 Low Starfish, worn once", brand: "Jordan", model: "Air Jordan 1", category: "Lifestyle", gender: "Men", color: "Orange", condition: "Pre-loved", price: 4900, cost: 3000, image: "catalog/aj1-low-onfoot.jpg", stock: "9:1 10:1", reorderPoint: 1, leadDays: 7, supplier: "Consignment", bin: "R-01-03", rating: 4.7, watchers: 52, tag: "Second life", tone: "sage", ...SC }),
  row({ id: "sc-kyrie-7", sku: "SC-KY7-BK-104", name: "Kyrie 7 Black, deadstock", brand: "Nike", model: "Kyrie", category: "Basketball", gender: "Men", color: "Black", condition: "New", price: 6995, cost: 4800, image: "catalog/kyrie-7.jpg", stock: "9:1 10:1 11:1", reorderPoint: 1, leadDays: 7, supplier: "Consignment", bin: "R-01-04", rating: 4.8, watchers: 61, tag: "Deadstock", tone: "sage", ...SC }),
  row({ id: "sc-react-black", sku: "SC-RCT-BK-105", name: "Nike React Black, worn once", brand: "Nike", model: "React", category: "Running", gender: "Men", color: "Black", condition: "Pre-loved", price: 3200, cost: 2000, image: "catalog/nike-react-black.jpg", stock: "8:1", reorderPoint: 1, leadDays: 7, supplier: "Consignment", bin: "R-01-05", rating: 4.3, watchers: 17, tag: "Second life", tone: "sage", ...SC }),
  row({ id: "sc-court-low", sku: "SC-CRT-WH-106", name: "Court Low White Leather, worn twice", brand: "Puma", model: "Court Classic", category: "Lifestyle", gender: "Women", color: "White", condition: "Pre-loved", price: 2400, cost: 1500, image: "catalog/court-low-white.jpg", stock: "6:1 7:1", reorderPoint: 1, leadDays: 7, supplier: "Consignment", bin: "R-01-06", rating: 4.2, watchers: 12, tag: "Second life", tone: "sage", ...SC }),

  // Independent stores (no studio login; they fill out the marketplace) ------------
  row({ id: "jordan-new", sku: "SA-AJ1-HI-201", name: "Air Jordan 1 Retro High Bred Toe", brand: "Jordan", model: "Air Jordan 1", category: "Basketball", gender: "Men", color: "Red", price: 9895, cost: 7000, image: "jordan1.png", stock: "7:2 8:2 9:2 10:1 11:1", reorderPoint: 4, leadDays: 14, supplier: "Jordan Brand PH", bin: "S-01", rating: 4.9, watchers: 246, tag: "The original", seller: "Sole Archive", sellerRole: "Seller", ownerId: null }),
  row({ id: "runner-new", sku: "ER-FLK-RD-202", name: "Nike Flyknit Racer", brand: "Nike", model: "Flyknit Racer", category: "Running", gender: "Unisex", color: "Red", price: 6495, cost: 4400, image: "shoe_image.png", stock: "6:2 7:2 8:3 9:3 10:2", reorderPoint: 6, leadDays: 12, supplier: "Nike Distribution PH", bin: "S-02", rating: 4.7, watchers: 79, tag: "Built to move", tone: "rose", seller: "Everyday Running", sellerRole: "Seller", ownerId: null }),
  row({ id: "runner-resale", sku: "TR-FLK-RD-203", name: "Flyknit Racer Pre-loved", brand: "Nike", model: "Flyknit Racer", category: "Running", gender: "Unisex", color: "Red", condition: "Pre-loved", price: 3295, cost: 2000, image: "shoe_image.png", stock: "7:1 10:2", reorderPoint: 1, leadDays: 7, supplier: "Consignment", bin: "S-03", rating: 4.4, watchers: 22, tag: "In the rotation", tone: "gray", seller: "The Rotation", sellerRole: "Reseller", ownerId: null }),
];

export const BRANDS = ["Nike", "Jordan", "Adidas", "New Balance", "Puma", "Vans"];
export const CATEGORIES = ["Lifestyle", "Running", "Basketball", "Training & Gym", "Skateboarding"];
export const GENDERS = ["Men", "Women", "Unisex"];
export const COLORS = {
  Black: "#16161a", White: "#f4f4f1", Grey: "#9a9a96", Red: "#d92d20", Orange: "#ee7a1c",
  Brown: "#8a5a35", Pink: "#ee82b4", Blue: "#2f62d9", Teal: "#1fa7a0", Green: "#7fbf2a",
};
export const SIZE_RUN = ["5", "6", "7", "8", "8.5", "9", "9.5", "10", "10.5", "11", "12"];
