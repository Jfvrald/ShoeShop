# Sole Rise — security notes

Checked 31 October 2026.

## Trust boundary

Sole Rise is a static, browser-only demo. There is no backend, payment processor or remote database, and the app makes no network requests beyond its own static files.

**Accounts are demo-only.** Sign-up, sign-in, orders and listings live in this browser's `localStorage` (`src/store.js`). Passwords are hashed with PBKDF2-SHA-256 (100,000 iterations, random salt) through Web Crypto, but anyone with access to the browser can read or edit the stored data. Roles are not enforced anywhere except the UI. Do not enter real passwords or personal details, and do not treat any of this as authentication.

## HTTP headers (`vercel.json`)

Sent on every route by Vercel:

| Header | Value |
|---|---|
| Content-Security-Policy | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'` |
| X-Content-Type-Options | `nosniff` |
| X-Frame-Options | `DENY` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains` |

- `script-src 'self'` works because the production build has **no inline scripts**: `build/index.html` loads one external bundle (`static/js/main.*.js`). CRA inlines its webpack runtime only when the build has a separate runtime chunk (for example after adding `React.lazy` code splitting). If that happens, recount `<script>` tags in `build/index.html` and either build with `INLINE_RUNTIME_CHUNK=false` or allow the runtime's `sha256-` hash.
- `style-src 'unsafe-inline'` covers React `style` props and the inline `<style>` in `public/design-guide.html`.
- Fonts are self-hosted through `@fontsource-variable`; no third-party origins are needed.
- Verified by serving `build/` locally with these headers in Chrome: home page and `/design-guide.html` render with no CSP violations and no console errors.
- The headers apply to the Vercel deployment only. The `gh-pages` deploy script publishes to GitHub Pages, which cannot set custom headers.

## Dependencies

| Scope | Result |
|---|---|
| `npm audit --omit=dev` | **0 vulnerabilities.** Shipped runtime dependencies are React, React DOM, Phosphor icons, Fontsource and `web-vitals`. |
| `npm audit` incl. dev | **71 advisories** (4 critical, 33 high, 15 moderate, 19 low), all from the `react-scripts` 5.0.1 toolchain (webpack dev server, Jest, Babel, SVGO and their dependencies). They run at build or test time only and are not in the shipped bundle. |

`react-scripts` and `@testing-library/*` are now `devDependencies`. Create React App is no longer maintained, so these advisories will not be fixed upstream, and `npm audit fix --force` would install a broken `react-scripts` version. **Recommendation:** migrate to Vite (and Vitest), which removes the whole chain.

## Repository hygiene

`.gitignore` now covers `.env`, `.env*` (except `.env.example`), `*.log` and `.vercel`.

`dev.log` (a local `npm start` log, no secrets) was committed before the ignore rule; it was untracked on 31 Oct 2026 and stays on disk.
