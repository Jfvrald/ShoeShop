import React, { useState } from "react";
import { HandbagSimple, List, X, ArrowUpRight } from "@phosphor-icons/react";
import { canSell } from "../../store";
import "./NavigationBar.css";

export function Brand({ onClick }) {
  return (
    <a className="brand" href="#home" onClick={onClick} aria-label="Sole Rise home">
      <span className="brand-symbol" aria-hidden="true">
        S<ArrowUpRight size={15} weight="bold" />
      </span>
      <span>Sole Rise</span>
    </a>
  );
}

export default function NavigationBar({ page, navigate, cartCount, onCart, onAccount, user }) {
  const [open, setOpen] = useState(false);
  function go(value) {
    navigate(value);
    setOpen(false);
  }
  const links = [
    ["home", "Discover"],
    ["shop", "Shop"],
    ["community", "Community"],
    canSell(user) ? ["account", "My studio"] : ["sell", "Start selling"],
  ];
  return (
    <header className="site-header">
      <Brand onClick={() => go("home")} />
      <nav aria-label="Main navigation" className={open ? "nav-links open" : "nav-links"}>
        {links.map(([id, label]) => (
          <a
            key={id}
            href={"#" + id}
            className={page === id ? "active" : ""}
            aria-current={page === id ? "page" : undefined}
            onClick={() => go(id)}
          >
            {label}
          </a>
        ))}
      </nav>
      <div className="nav-actions">
        <button className="account-button" onClick={onAccount}>
          {user ? (
            <>
              <span className="mini-avatar" aria-hidden="true">
                {user.name[0].toUpperCase()}
              </span>
              {user.name.split(" ")[0]}
            </>
          ) : (
            "Sign in"
          )}
        </button>
        <button className="bag-button" onClick={onCart} aria-label={`Shopping bag, ${cartCount} items`}>
          <HandbagSimple size={22} />
          {cartCount > 0 && <span>{cartCount}</span>}
        </button>
        <button
          className="menu-button"
          aria-expanded={open}
          aria-label="Toggle navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <List size={22} />}
        </button>
      </div>
    </header>
  );
}
