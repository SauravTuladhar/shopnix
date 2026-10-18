# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Shopnix — a static, client-side-rendered demo e-commerce marketplace ("Daraz-inspired", teal & coral theme). Plain HTML/CSS/JS, no framework, no build step, no package.json. Deployed to GitHub Pages at https://sauravtuladhar.github.io/shopnix/ from the `main` branch root (classic branch-based Pages, not an Actions workflow). The product catalog is read from a Supabase project (see "Database" below); cart, wishlist, and auth are still client-side only — see "Auth is cosmetic" below.

## Commands

There is no build, lint, or test tooling in this repo (no package.json). To run it locally:

```bash
python3 -m http.server 8787
```

Then open `http://localhost:8787/index.html`. Any static file server works — the site also runs directly over `file://` (see "No fetch" below).

There is no automated test suite. Verify changes by serving the site locally and clicking through the relevant flow in a browser; check the console for errors (especially CSP violations — see below).

## Architecture

**Every page shares the same core scripts**, loaded in this order at the bottom of `<body>`:
```
partials.js → Supabase JS SDK (CDN, pinned version) → supabase-client.js → catalog.js → common.js → (optional page-specific inline <script>, or home.js on index.html)
```
Order matters: `partials.js` injects the header/footer/drawers into the DOM synchronously on load (`renderPartials()` runs immediately, not on `DOMContentLoaded`). `catalog.js` kicks off its Supabase fetch immediately (`loadCatalog()` called at the bottom of the file) so it's in flight while the rest of the scripts load, but it resolves **asynchronously** — `common.js` ends by calling `loadCatalog().then(initHeader).catch(showCatalogError)` rather than calling `initHeader()` directly, since `initHeader()` wires up listeners on elements `partials.js` just created and also renders catalog-dependent UI (nav categories, cart badge). **Any page-specific inline script (or `home.js`) that reads `CATEGORIES`/`PRODUCTS`/`getProductById`/`categoryLabel` must likewise call its init function via `loadCatalog().then(initFn).catch(showCatalogError)`, never call it directly** — see the pattern already used in `shop/category.html`, `shop/checkout.html`, `shop/cart.html`, `shop/wishlist.html`, and `info/seller.html`. If you add a new page, copy this script order and loading pattern exactly.

- **`partials.js`** — `HEADER_HTML` / `FOOTER_HTML` / `EXTRAS_HTML` (mobile menu, cart drawer, overlays, toast) are template strings injected via `innerHTML`/`insertAdjacentHTML`, not `fetch`. This is deliberate so pages work over `file://` with no server. Any header/footer/nav change belongs here, once, not in individual pages.
- **`supabase-client.js`** — creates the Supabase client instance (`sb`, deliberately not named `supabase` to avoid colliding with the SDK's global namespace) from the project URL + anon key. Safe to be public: every table it can touch is governed by Row Level Security (see `supabase/schema.sql`), not by hiding the key.
- **`catalog.js`** — single source of truth for `CATEGORIES` and `PRODUCTS`, now fetched from Supabase (`categories`/`products` tables) instead of hardcoded. `loadCatalog()` is memoized (`_catalogPromise`) and deliberately does **not** reset itself on failure — several scripts on one page call it during the initial load burst, and resetting would let a fast failure race into duplicate fetches; `showCatalogError`'s "Retry" button just reloads the page, which is what actually clears the cache. `getProductById(id)` is the only lookup helper; every cart/wishlist operation stores just `{id, qty}` or `id` and re-resolves the product from `PRODUCTS` at render time — which is empty until `loadCatalog()` resolves. If `loadCatalog()` rejects (network issue, Supabase project paused, RLS misconfigured), call `.catch(showCatalogError)` (defined in `common.js`) — never leave a catalog-dependent `.then()` chain without one, or the page silently stays broken with an unhandled rejection and no feedback to the user.
- **`common.js`** — shared state and UI that every page depends on:
  - Cart/wishlist/user state persisted to `localStorage` under `shopnix_cart` / `shopnix_wishlist` / `shopnix_user` (see `readJSON`/`writeJSON`). There is no backend; "login" just stores a name/email locally.
  - `onCartChange(cb)` registers a callback fired on every `setCart()`. Any page whose UI reflects cart contents (cart.html, checkout.html) must subscribe through this rather than rendering once on load, or it goes stale when the user edits the cart via the always-present header mini-cart drawer.
  - Product cards and cart rows are rendered from template-string functions (`productCardHTML`, `renderCartDrawer`, etc.) and wired up via **event delegation** on `document` (`click` listeners checking `e.target.closest(...)`), not per-element listeners — this is why newly-injected grids/rows don't need their own click handlers.
  - `renderCategoryNav()` / `updateAccountUI()` re-render the nav and account-dependent UI; call these (or the higher-level setters that already call them, like `setUser()`/`logoutUser()`) rather than mutating header DOM directly.
- **`home.js`** — index.html-only logic (carousel, countdown, category grid, tabs/"Just For You" pagination). Not loaded on other pages.
- **Page-specific inline `<script>` blocks** — most non-home pages (cart, checkout, login, signup, account, orders, wishlist, track-order, seller, blog, careers, help-center, returns, contact, download-app) have their own small inline script at the bottom for page-only logic. See "CSP" below before editing these.

**Auth is cosmetic**: there's no server, so "logged in" just means `shopnix_user` is set in `localStorage`. Cart and wishlist are guest-accessible by design and persist across login/logout (same as a real device-local cart would) — don't "fix" that as a bug. Pages that are only ever linked from the logged-in nav (`account.html`, `orders.html`) explicitly gate on `getUser()` with a `loggedOutView`/`loggedInView` (or equivalent) pair of containers; follow that same pattern for any new account-only page.

## CSP (important when editing inline scripts)

Every page's `<head>` has a `Content-Security-Policy` meta tag. `script-src` is `'self'` plus `https://cdn.jsdelivr.net` (serves the pinned Supabase JS SDK) plus — on pages with an inline `<script>` block — the exact SHA-256 hash of that block, never `'unsafe-inline'`. There's also a `connect-src 'self' https://rymkwiaaeopzerviomnu.supabase.co` directive, required because `default-src 'self'` would otherwise silently block the `fetch`/XHR `loadCatalog()` makes to the Supabase REST API.

**If you edit a page's inline script, its CSP hash goes stale and the script will be silently blocked** (no visible error without checking the console for a CSP violation). Recompute it:

```python
import re, hashlib, base64
html = open('somepage.html').read()
content = re.search(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', html, re.S).group(1)
b64 = base64.b64encode(hashlib.sha256(content.encode('utf-8')).digest()).decode()
# then replace the sha256-... hash in that page's script-src with: 'sha256-<b64>'
```
Pages with no inline script (e.g. `about.html`, `terms.html`, `privacy.html`, `404.html`) have no hash in `script-src`, just `'self' https://cdn.jsdelivr.net`.

## Database

`supabase/schema.sql` defines the full schema (tables + RLS + seed data) — run once, in full, in the Supabase SQL editor; `supabase/migrations/` holds incremental follow-up migrations to run against an already-provisioned project (each file's header comment says what it does and whether it's safe to re-run). **Only `categories` and `products` are currently used by the frontend** (via `loadCatalog()` in `catalog.js`), and both are public-read via RLS. The `profiles`, `cart_items`, `wishlist_items`, `orders`, and `order_items` tables exist with working RLS policies but have zero client code touching them — cart/wishlist/login are still pure `localStorage` (see "Auth is cosmetic" above). Wiring those tables up (real `supabase.auth`, DB-backed cart/wishlist, real order writes at checkout) is unstarted future work, not a bug — don't assume it's already done just because the schema exists.

## SEO/deployment conventions

Every page's `<head>` follows the same block (added after `<title>`): `meta description` → `canonical` (pointed at `https://sauravtuladhar.github.io/shopnix/<page>.html`) → `favicon.svg` link → Open Graph/Twitter tags → the CSP meta tag → `styles.css`. `sitemap.xml` and `robots.txt` list every real page; `404.html` is GitHub Pages' custom not-found page. Keep new pages consistent with this block, and add them to `sitemap.xml`.

## Styling

Single `styles.css`, no preprocessor. Theme is driven by CSS custom properties on `:root` (`--primary`, `--accent`, `--gold`, etc. — teal/coral/gold palette). Reuse these variables rather than hardcoding colors.
