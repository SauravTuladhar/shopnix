# Shopnix

A Daraz-inspired, teal & coral demo e-commerce marketplace. Plain HTML/CSS/JS, no framework, no build step. Deployed to GitHub Pages at **https://sauravtuladhar.github.io/shopnix/**.

The product catalog (categories/products) is backed by [Supabase](https://supabase.com); cart, wishlist, and "login" are still client-side only, stored in `localStorage`. See `project.docx` for the full project detail document.

## Running locally

No package manager, no build step. Serve the repo root with any static file server:

```bash
python3 -m http.server 8787
```

Then open `http://localhost:8787/index.html`. The site also runs directly over `file://`, since the header/footer are injected via inline template strings rather than `fetch()`.

There is no automated test suite — verify changes by clicking through the relevant flow in a browser and checking the console for errors, especially [CSP](#content-security-policy) violations.

## Project structure

```
index.html, 404.html        Root-level pages
shop/                        cart, category, checkout, wishlist
account/                     account, login, orders, signup, track-order
info/                        about, blog, careers, contact, download-app, help-center,
                             how-to-buy, privacy, returns, seller, terms
css/styles.css               Single stylesheet, themed via CSS custom properties
js/
  partials.js                 Injects header/footer/drawers (innerHTML, not fetch)
  supabase-client.js           Creates the Supabase client (`sb`)
  catalog.js                   Async loadCatalog() — fetches categories/products from Supabase
  common.js                    Cart/wishlist/user state, product rendering, header interactions
  home.js                      index.html-only logic (carousel, countdown, tabs, pagination)
supabase/schema.sql           Tables, Row Level Security policies, and seed data
```

Every page loads scripts in this exact order at the bottom of `<body>`:

```
partials.js → Supabase JS SDK (CDN) → supabase-client.js → catalog.js → common.js → (home.js | page-specific inline <script>)
```

## Content Security Policy

Every page's `<head>` has a strict CSP: `script-src` is `'self'` plus the exact SHA-256 hash of that page's own inline `<script>` block (never `'unsafe-inline'`), plus the CDN hosting the Supabase SDK. **Editing a page's inline script invalidates its CSP hash and silently breaks that script** — recompute it with:

```python
import re, hashlib, base64
html = open('somepage.html').read()
content = re.search(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', html, re.S).group(1)
b64 = base64.b64encode(hashlib.sha256(content.encode('utf-8')).digest()).decode()
# replace that page's script-src hash with: 'sha256-<b64>'
```

## Database

`supabase/schema.sql` defines `categories`, `products`, `profiles`, `cart_items`, `wishlist_items`, `orders`, and `order_items`, all with Row Level Security. Only `categories`/`products` are currently read by the frontend — the rest are reserved for a future phase that moves cart/wishlist/auth/orders off `localStorage` and onto Supabase.

## More detail

See `project.docx` for the full project detail document (architecture, tech stack, database schema, security model, and migration roadmap), and `CLAUDE.md` for guidance aimed at AI coding assistants working in this repo.
