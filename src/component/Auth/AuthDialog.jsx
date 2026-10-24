import React, { useState } from "react";
import { ArrowUpRight, Check, Storefront, ArrowsClockwise, HandbagSimple } from "@phosphor-icons/react";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, ROLES, hashPassword, makeSalt, normalizeEmail } from "../../store";

const ROLE_ICON = { Buyer: HandbagSimple, Seller: Storefront, Reseller: ArrowsClockwise };

export function RolePicker({ value, onChange }) {
  return (
    <fieldset>
      <legend>Choose your account type</legend>
      <div className="role-options">
        {Object.keys(ROLES).map((item) => {
          const Icon = ROLE_ICON[item];
          return (
            <button
              type="button"
              key={item}
              className={value === item ? "chosen" : ""}
              aria-pressed={value === item}
              onClick={() => onChange(item)}
            >
              <Icon size={22} weight="duotone" aria-hidden="true" />
              <span>{item}</span>
              <small>{ROLES[item].blurb}</small>
              {value === item && <Check className="role-check" size={16} weight="bold" />}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function AuthDialog({ accounts, initialMode = "signup", initialRole = "Buyer", onAuthed, onCreate }) {
  const [mode, setMode] = useState(initialMode);
  const [role, setRole] = useState(initialRole);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = normalizeEmail(String(data.get("email")));
    const password = String(data.get("password"));
    setError("");
    setBusy(true);
    try {
      const existing = accounts.find((a) => a.email === email);
      if (mode === "signin") {
        const hash = existing && (await hashPassword(password, existing.salt));
        if (!existing || hash !== existing.hash) {
          setError("That email and password do not match an account on this device.");
          return;
        }
        onAuthed(existing);
        return;
      }
      if (existing) {
        setError("An account with that email already exists. Try signing in.");
        return;
      }
      const salt = makeSalt();
      const account = {
        id: "acct-" + Date.now().toString(36) + salt.slice(0, 4),
        name: String(data.get("name")).trim(),
        email,
        salt,
        hash: await hashPassword(password, salt),
        role,
        circles: [],
        createdAt: new Date().toISOString(),
      };
      onCreate(account);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate={false} className="auth-form">
      <div className="auth-tabs" role="tablist" aria-label="Account">
        {[
          ["signup", "Create account"],
          ["signin", "Sign in"],
        ].map(([id, label]) => (
          <button
            type="button"
            role="tab"
            key={id}
            aria-selected={mode === id}
            className={mode === id ? "active" : ""}
            onClick={() => {
              setMode(id);
              setError("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "signin" && accounts.some((a) => DEMO_ACCOUNTS.some((d) => d.id === a.id)) && (
        <div className="demo-box">
          <p>
            Demo accounts, password <b>{DEMO_PASSWORD}</b>
          </p>
          <div>
            {DEMO_ACCOUNTS.map((d) => (
              <button
                type="button"
                key={d.id}
                onClick={(e) => {
                  const f = e.currentTarget.closest("form");
                  f.elements.email.value = d.email;
                  f.elements.password.value = DEMO_PASSWORD;
                }}
              >
                {d.role}
              </button>
            ))}
          </div>
        </div>
      )}
      {mode === "signup" && (
        <label>
          Display name
          <input name="name" required minLength={2} maxLength={40} autoComplete="nickname" pattern=".*\S.*" />
        </label>
      )}
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? 8 : 1}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
      </label>
      {mode === "signup" && <p className="field-hint">At least 8 characters.</p>}
      {mode === "signup" && <RolePicker value={role} onChange={setRole} />}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <p className="notice">
        Demo accounts are saved only in this browser. Do not reuse a real password.
      </p>
      <button className="button primary full" type="submit" disabled={busy}>
        {mode === "signup" ? `Create ${role.toLowerCase()} account` : "Sign in"}
        <ArrowUpRight size={16} weight="bold" />
      </button>
    </form>
  );
}
