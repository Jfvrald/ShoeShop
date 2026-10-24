import React, { useState } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { asset, BRANDS, CATEGORIES, GENDERS, COLORS, SIZE_RUN } from "../../store";
import { CATALOG } from "../../data/catalog";

const IMAGES = [...new Map(CATALOG.map((p) => [p.image, p.name])).entries()];

export default function ListingForm({ onSave, user, prefill }) {
  const isReseller = user.role === "Reseller";
  const [image, setImage] = useState(prefill?.image || IMAGES[0][0]);
  return (
    <form
      className="listing-form"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const stockBySize = {};
        SIZE_RUN.forEach((size) => {
          const qty = Number(data.get("size-" + size) || 0);
          if (qty > 0) stockBySize[size] = qty;
        });
        const price = Number(data.get("price"));
        const was = Number(data.get("compareAt") || 0);
        const brand = data.get("brand");
        const id = "listing-" + Date.now();
        onSave({
          id,
          sku: `${user.id.slice(-2).toUpperCase()}-${brand.slice(0, 2).toUpperCase()}-${id.slice(-5)}`,
          name: data.get("name").trim(),
          brand,
          model: data.get("model").trim() || data.get("name").trim(),
          category: data.get("category"),
          gender: data.get("gender"),
          color: data.get("color"),
          price,
          compareAt: was > price ? was : null,
          cost: Number(data.get("cost") || 0),
          condition: isReseller ? data.get("condition") : "New",
          stockBySize,
          reorderPoint: Number(data.get("reorderPoint") || 0),
          leadDays: Number(data.get("leadDays") || 7),
          supplier: data.get("supplier").trim() || (isReseller ? "Consignment" : "Direct"),
          bin: "NEW",
          image,
          rating: 4.5,
          watchers: 0,
          tone: "sand",
          tag: isReseller ? "Second life" : "New listing",
        });
      }}
    >
      <p className="muted">
        {isReseller
          ? "List a pre-loved or deadstock pair. Cost and reorder settings feed your margin and forecast reports."
          : "Add a brand-new pair. Cost and reorder settings feed your margin and forecast reports."}{" "}
        Use one of the supplied photos for this prototype.
      </p>
      <label>
        Product name
        <input name="name" required minLength={3} maxLength={70} pattern=".*\S.*" defaultValue={prefill?.name} placeholder="e.g. Air Jordan 1 Retro High" />
      </label>
      <div className="form-row">
        <label>
          Brand
          <select name="brand" defaultValue={prefill?.brand || BRANDS[0]}>
            {BRANDS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
        <label>
          Model
          <input name="model" maxLength={40} defaultValue={prefill?.model} placeholder="e.g. Air Jordan 1" />
        </label>
      </div>
      <div className="form-row">
        <label>
          Category
          <select name="category" defaultValue={prefill?.category}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Gender
          <select name="gender" defaultValue="Unisex">
            {GENDERS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label>
          Color
          <select name="color" defaultValue="Black">
            {Object.keys(COLORS).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        {isReseller ? (
          <label>
            Condition
            <select name="condition" defaultValue="Pre-loved">
              <option value="Pre-loved">Pre-loved</option>
              <option value="New">New (deadstock)</option>
            </select>
          </label>
        ) : (
          <label>
            Condition
            <input value="New" readOnly aria-readonly="true" />
          </label>
        )}
      </div>
      <div className="form-row three">
        <label>
          Price (PHP)
          <input name="price" type="number" min="1" max="999999" step="1" required />
        </label>
        <label>
          Was (optional)
          <input name="compareAt" type="number" min="0" max="999999" step="1" placeholder="sale price basis" />
        </label>
        <label>
          Your cost
          <input name="cost" type="number" min="0" max="999999" step="1" />
        </label>
      </div>
      <fieldset>
        <legend>Pairs in stock by US size (at least one)</legend>
        <div className="size-stock">
          {SIZE_RUN.map((size) => (
            <label key={size}>
              <span>{size}</span>
              <input type="number" name={"size-" + size} min="0" max="99" step="1" defaultValue={prefill?.size ? (size === prefill.size ? 1 : 0) : size === "9" ? 1 : 0} />
            </label>
          ))}
        </div>
      </fieldset>
      <div className="form-row three">
        <label>
          Reorder at
          <input name="reorderPoint" type="number" min="0" max="999" step="1" defaultValue="2" />
        </label>
        <label>
          Lead time (days)
          <input name="leadDays" type="number" min="1" max="120" step="1" defaultValue="7" />
        </label>
        <label>
          Supplier
          <input name="supplier" maxLength={40} placeholder={isReseller ? "Consignment" : "Distributor"} />
        </label>
      </div>
      <fieldset>
        <legend>Product photo</legend>
        <div className="photo-pick">
          {IMAGES.map(([file, name]) => (
            <button type="button" key={file} className={image === file ? "on" : ""} aria-pressed={image === file} aria-label={name} onClick={() => setImage(file)}>
              <img src={asset(file)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      </fieldset>
      <button className="button primary full" type="submit">
        Publish listing <ArrowUpRight size={16} weight="bold" />
      </button>
    </form>
  );
}
