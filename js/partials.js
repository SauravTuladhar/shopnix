/* ===================== SHARED HEADER / FOOTER / OVERLAYS ===================== */
/* Injected via plain innerHTML (no fetch) so pages work over file:// too. */

/* Pages live at different folder depths (root, shop/, account/, info/) but all
   load this same file, so every internal link below is prefixed with ROOT_PATH
   (derived from this script's own <script src="..."> so it needs no per-page
   setup) rather than hardcoded as root-relative. */
const ROOT_PATH = (() => {
  const s = document.currentScript || document.querySelector('script[src$="js/partials.js"]');
  return s ? s.getAttribute('src').replace(/js\/partials\.js$/, '') : '';
})();

const HEADER_HTML = `
<div class="topbar">
  <div class="container topbar-inner">
    <div class="topbar-left">
      <a href="${ROOT_PATH}info/download-app.html">Download App</a>
      <a href="${ROOT_PATH}info/seller.html">Sell on Shopnix</a>
    </div>
    <div class="topbar-right">
      <a href="${ROOT_PATH}info/help-center.html">Customer Care</a>
      <a href="${ROOT_PATH}account/track-order.html">Track Order</a>
      <label class="select-wrap">
        <select aria-label="Language">
          <option>English</option>
          <option>नेपाली</option>
        </select>
      </label>
    </div>
  </div>
</div>

<div class="sticky-wrap" id="stickyWrap">
  <header class="main-header">
    <div class="container main-header-inner">
      <button class="hamburger" id="hamburgerBtn" aria-label="Open menu">
        <svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>

      <a href="${ROOT_PATH}index.html" class="logo">Shop<span>nix</span></a>

      <div class="search-wrap" id="searchWrap">
        <form id="searchForm" autocomplete="off">
          <input type="text" id="searchInput" placeholder="Search in Shopnix" aria-label="Search products">
          <button type="submit" aria-label="Search">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" fill="none"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2"/></svg>
          </button>
        </form>
        <ul class="search-suggest" id="searchSuggest" hidden></ul>
      </div>

      <nav class="header-actions">
        <div class="account-menu">
          <button class="action-btn" id="accountBtn" type="button">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2" fill="none"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
            <span id="accountLabel">Account</span>
          </button>
          <div class="dropdown" id="accountDropdown">
            <div id="guestLinks">
              <a href="${ROOT_PATH}account/login.html">Login</a>
              <a href="${ROOT_PATH}account/signup.html">Sign Up</a>
            </div>
            <div id="userLinks" style="display:none">
              <div class="dd-greeting" id="ddGreeting">Hi there</div>
              <a href="${ROOT_PATH}account/account.html">My Account</a>
              <a href="${ROOT_PATH}account/orders.html">My Orders</a>
              <a href="${ROOT_PATH}shop/wishlist.html">My Wishlist</a>
              <hr>
              <button class="dd-logout" id="logoutBtn" type="button">Logout</button>
            </div>
          </div>
        </div>

        <a class="action-btn" id="wishlistBtn" href="${ROOT_PATH}shop/wishlist.html">
          <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.2C.4 8.2 2 4.5 5.6 4c2-.3 3.8.7 4.9 2.4C11.6 4.7 13.4 3.7 15.4 4c3.6.5 5.2 4.2 3.6 7.8C19.5 16.4 12 21 12 21z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/></svg>
          <span>Wishlist</span>
          <span class="badge" id="wishlistBadge">0</span>
        </a>

        <button class="action-btn" id="cartBtn" type="button">
          <svg viewBox="0 0 24 24"><circle cx="9" cy="20" r="1.4" fill="currentColor"/><circle cx="18" cy="20" r="1.4" fill="currentColor"/><path d="M2.5 3h2l2.4 12.2a2 2 0 002 1.6h8.6a2 2 0 002-1.6L21 7H6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>Cart</span>
          <span class="badge" id="cartBadge">0</span>
        </button>
      </nav>
    </div>
  </header>

  <nav class="category-nav">
    <div class="container category-nav-inner">
      <button class="all-cats-btn" id="allCatsBtn" type="button">
        <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        All Categories
      </button>
      <ul class="category-list" id="categoryList"></ul>

      <div class="mega-menu" id="megaMenu">
        <ul id="megaMenuList"></ul>
      </div>
    </div>
  </nav>
</div>
`;

const FOOTER_HTML = `
<div class="container footer-grid">
  <div class="footer-col">
    <h4>Customer Care</h4>
    <a href="${ROOT_PATH}info/help-center.html">Help Center</a>
    <a href="${ROOT_PATH}info/how-to-buy.html">How to Buy</a>
    <a href="${ROOT_PATH}info/returns.html">Returns &amp; Refund</a>
    <a href="${ROOT_PATH}account/track-order.html">Track Order</a>
    <a href="${ROOT_PATH}info/contact.html">Contact Us</a>
  </div>
  <div class="footer-col">
    <h4>Shopnix</h4>
    <a href="${ROOT_PATH}info/about.html">About Us</a>
    <a href="${ROOT_PATH}info/careers.html">Careers</a>
    <a href="${ROOT_PATH}info/blog.html">Shopnix Blog</a>
    <a href="${ROOT_PATH}info/terms.html">Terms &amp; Conditions</a>
    <a href="${ROOT_PATH}info/privacy.html">Privacy Policy</a>
  </div>
  <div class="footer-col">
    <h4>Payment</h4>
    <div class="payment-icons">
      <span class="payment-badge">eSewa</span><span class="payment-badge">Khalti</span><span class="payment-badge">VISA</span><span class="payment-badge">COD</span>
    </div>
    <h4>Follow Us</h4>
    <div class="social-icons">
      <span class="social-icon" title="Facebook"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5-.93 9-4.96 9-9.95z"/></svg></span>
      <span class="social-icon" title="Instagram"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.16c3.15 0 3.5.01 4.73.07 1.02.05 1.57.21 1.94.35.49.19.83.42 1.2.78.36.37.59.71.78 1.2.14.37.3.92.35 1.94.06 1.23.07 1.58.07 4.73s-.01 3.5-.07 4.73c-.05 1.02-.21 1.57-.35 1.94-.19.49-.42.83-.78 1.2-.37.36-.71.59-1.2.78-.37.14-.92.3-1.94.35-1.23.06-1.58.07-4.73.07s-3.5-.01-4.73-.07c-1.02-.05-1.57-.21-1.94-.35a3.72 3.72 0 01-1.2-.78 3.72 3.72 0 01-.78-1.2c-.14-.37-.3-.92-.35-1.94-.06-1.23-.07-1.58-.07-4.73s.01-3.5.07-4.73c.05-1.02.21-1.57.35-1.94.19-.49.42-.83.78-1.2.37-.36.71-.59 1.2-.78.37-.14.92-.3 1.94-.35 1.23-.06 1.58-.07 4.73-.07zm0 4.14a4.86 4.86 0 110 9.72 4.86 4.86 0 010-9.72zm0 1.62a3.24 3.24 0 100 6.48 3.24 3.24 0 000-6.48zm6.18-3.24a1.14 1.14 0 110 2.28 1.14 1.14 0 010-2.28z"/></svg></span>
      <span class="social-icon" title="X"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 3H21l-6.7 7.66L22.3 21H16.6l-5.03-6.4L5.84 21H3.72l7.17-8.2L2.9 3h5.84l4.6 5.85L18.9 3z"/></svg></span>
    </div>
  </div>
  <div class="footer-col">
    <h4>Download App</h4>
    <div class="app-badges">
      <a class="app-badge" href="${ROOT_PATH}info/download-app.html">▶ Google Play</a>
      <a class="app-badge" href="${ROOT_PATH}info/download-app.html"> App Store</a>
    </div>
  </div>
</div>
<div class="footer-bottom">
  <p>&copy; 2026 Shopnix. All rights reserved. (Educational demo project.)</p>
</div>
`;

const EXTRAS_HTML = `
<div class="mobile-menu" id="mobileMenu">
  <div class="mobile-menu-head">
    <span>Menu</span>
    <button id="closeMobileMenu" aria-label="Close menu" type="button">&times;</button>
  </div>
  <ul id="mobileMenuList"></ul>
</div>
<div class="overlay" id="overlay"></div>

<button class="back-to-top" id="backToTop" aria-label="Back to top" type="button">&uarr;</button>

<div class="cart-drawer" id="cartDrawer">
  <div class="cart-drawer-head">
    <h3>Your Cart</h3>
    <button id="closeCartDrawer" aria-label="Close cart" type="button">&times;</button>
  </div>
  <div class="cart-items" id="cartItems">
    <p class="cart-empty">Your cart is empty.</p>
  </div>
  <div class="cart-footer">
    <div class="cart-subtotal">Subtotal: <b id="cartSubtotal">Rs. 0</b></div>
    <a class="btn btn-outline cart-view-full" href="${ROOT_PATH}shop/cart.html">View Full Cart</a>
    <a class="btn btn-accent cart-checkout" href="${ROOT_PATH}shop/checkout.html">Checkout</a>
  </div>
</div>
<div class="overlay" id="cartOverlay"></div>

<div class="toast" id="toast"></div>
`;

function renderPartials(){
  const headerEl = document.getElementById('site-header');
  const footerEl = document.getElementById('site-footer');
  if (headerEl) headerEl.innerHTML = HEADER_HTML;
  if (footerEl){ footerEl.classList.add('footer'); footerEl.innerHTML = FOOTER_HTML; }
  document.body.insertAdjacentHTML('beforeend', EXTRAS_HTML);
}

renderPartials();
