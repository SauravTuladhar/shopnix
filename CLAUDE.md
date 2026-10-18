# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Shopnix — a static, client-side-only demo e-commerce marketplace ("Daraz-inspired", teal & coral theme). Plain HTML/CSS/JS, no framework, no build step, no backend, no package.json. Deployed to GitHub Pages at https://sauravtuladhar.github.io/shopnix/ from the `main` branch root (classic branch-based Pages, not an Actions workflow).

## Commands

There is no build, lint, or test tooling in this repo (no package.json). To run it locally:

```bash
python3 -m http.server 8787
```

Then open `http://localhost:8787/index.html`. Any static file server works — the site also runs directly over `file://` (see "No fetch" below).

There is no automated test suite. Verify changes by serving the site locally and clicking through the relevant flow in a browser; check the console for errors (especially CSP violations — see below).

## Architecture

**Every page shares the same five scripts**, loaded in this order at the bottom of `<body>`:
```
partials.js → products.js → common.js → (optional page-specific inline <script>, or home.js on index.html)
```
Order matters: `partials.js` injects the header/footer/drawers into the DOM synchronously on load (`renderPartials()` runs immediately, not on `DOMContentLoaded`), and `common.js` ends by calling `initHeader()`, which wires up listeners on elements `partials.js` just created. If you add a new page, copy this script order exactly.

- **`partials.js`** — `HEADER_HTML` / `FOOTER_HTML` / `EXTRAS_HTML` (mobile menu, cart drawer, overlays, toast) are template strings injected via `innerHTML`/`insertAdjacentHTML`, not `fetch`. This is deliberate so pages work over `file://` with no server. Any header/footer/nav change belongs here, once, not in individual pages.
- **`products.js`** — single source of truth for `CATEGORIES` and the `PRODUCTS` catalog (plain in-memory arrays, no IDs beyond string slugs). `getProductById(id)` is the only lookup helper; every cart/wishlist operation stores just `{id, qty}` or `id` and re-resolves the product from this array at render time.
- **`common.js`** — shared state and UI that every page depends on:
  - Cart/wishlist/user state persisted to `localStorage` under `shopnix_cart` / `shopnix_wishlist` / `shopnix_user` (see `readJSON`/`writeJSON`). There is no backend; "login" just stores a name/email locally.
  - `onCartChange(cb)` registers a callback fired on every `setCart()`. Any page whose UI reflects cart contents (cart.html, checkout.html) must subscribe through this rather than rendering once on load, or it goes stale when the user edits the cart via the always-present header mini-cart drawer.
  - Product cards and cart rows are rendered from template-string functions (`productCardHTML`, `renderCartDrawer`, etc.) and wired up via **event delegation** on `document` (`click` listeners checking `e.target.closest(...)`), not per-element listeners — this is why newly-injected grids/rows don't need their own click handlers.
  - `renderCategoryNav()` / `updateAccountUI()` re-render the nav and account-dependent UI; call these (or the higher-level setters that already call them, like `setUser()`/`logoutUser()`) rather than mutating header DOM directly.
- **`home.js`** — index.html-only logic (carousel, countdown, category grid, tabs/"Just For You" pagination). Not loaded on other pages.
- **Page-specific inline `<script>` blocks** — most non-home pages (cart, checkout, login, signup, account, orders, wishlist, track-order, seller, blog, careers, help-center, returns, contact, download-app) have their own small inline script at the bottom for page-only logic. See "CSP" below before editing these.

**Auth is cosmetic**: there's no server, so "logged in" just means `shopnix_user` is set in `localStorage`. Cart and wishlist are guest-accessible by design and persist across login/logout (same as a real device-local cart would) — don't "fix" that as a bug. Pages that are only ever linked from the logged-in nav (`account.html`, `orders.html`) explicitly gate on `getUser()` with a `loggedOutView`/`loggedInView` (or equivalent) pair of containers; follow that same pattern for any new account-only page.

## CSP (important when editing inline scripts)

Every page's `<head>` has a `Content-Security-Policy` meta tag whose `script-src` is `'self'` plus the exact SHA-256 hash of that page's own inline `<script>` block — not `'unsafe-inline'`. **If you edit a page's inline script, its CSP hash goes stale and the script will be silently blocked** (no visible error without checking the console for a CSP violation). Recompute it:

```python
import re, hashlib, base64
html = open('somepage.html').read()
content = re.search(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', html, re.S).group(1)
b64 = base64.b64encode(hashlib.sha256(content.encode('utf-8')).digest()).decode()
# then replace the script-src value in that page's CSP meta tag with: 'self' 'sha256-<b64>'
```
Pages with no inline script (e.g. `about.html`, `terms.html`, `privacy.html`, `404.html`, `index.html`) just have `script-src 'self'` with no hash.

## SEO/deployment conventions

Every page's `<head>` follows the same block (added after `<title>`): `meta description` → `canonical` (pointed at `https://sauravtuladhar.github.io/shopnix/<page>.html`) → `favicon.svg` link → Open Graph/Twitter tags → the CSP meta tag → `styles.css`. `sitemap.xml` and `robots.txt` list every real page; `404.html` is GitHub Pages' custom not-found page. Keep new pages consistent with this block, and add them to `sitemap.xml`.

## Styling

Single `styles.css`, no preprocessor. Theme is driven by CSS custom properties on `:root` (`--primary`, `--accent`, `--gold`, etc. — teal/coral/gold palette). Reuse these variables rather than hardcoding colors.
