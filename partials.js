/* ===================== SHARED HEADER / FOOTER / OVERLAYS ===================== */
/* Injected via plain innerHTML (no fetch) so pages work over file:// too. */

const HEADER_HTML = `
<div class="topbar">
  <div class="container topbar-inner">
    <div class="topbar-left">
      <a href="download-app.html">Download App</a>
      <a href="seller.html">Sell on Shopnix</a>
    </div>
    <div class="topbar-right">
      <a href="help-center.html">Customer Care</a>
      <a href="track-order.html">Track Order</a>
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

      <a href="index.html" class="logo">Shop<span>nix</span></a>

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
              <a href="login.html">Login</a>
              <a href="signup.html">Sign Up</a>
            </div>
            <div id="userLinks" style="display:none">
              <div class="dd-greeting" id="ddGreeting">Hi there</div>
              <a href="account.html">My Account</a>
              <a href="orders.html">My Orders</a>
              <a href="wishlist.html">My Wishlist</a>
              <hr>
              <button class="dd-logout" id="logoutBtn" type="button">Logout</button>
            </div>
          </div>
        </div>

        <a class="action-btn" id="wishlistBtn" href="wishlist.html">
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
    <a href="help-center.html">Help Center</a>
    <a href="how-to-buy.html">How to Buy</a>
    <a href="returns.html">Returns &amp; Refund</a>
    <a href="track-order.html">Track Order</a>
    <a href="contact.html">Contact Us</a>
  </div>
  <div class="footer-col">
    <h4>Shopnix</h4>
    <a href="about.html">About Us</a>
    <a href="careers.html">Careers</a>
    <a href="blog.html">Shopnix Blog</a>
    <a href="terms.html">Terms &amp; Conditions</a>
    <a href="privacy.html">Privacy Policy</a>
  </div>
  <div class="footer-col">
    <h4>Payment</h4>
    <div class="payment-icons">
      <span>eSewa</span><span>Khalti</span><span>VISA</span><span>COD</span>
    </div>
    <h4>Follow Us</h4>
    <div class="social-icons">
      <span class="social-icon" title="Facebook">f</span>
      <span class="social-icon" title="Instagram">ig</span>
      <span class="social-icon" title="X">x</span>
    </div>
  </div>
  <div class="footer-col">
    <h4>Download App</h4>
    <div class="app-badges">
      <a class="app-badge" href="download-app.html">▶ Google Play</a>
      <a class="app-badge" href="download-app.html"> App Store</a>
    </div>
  </div>
</div>
<div class="footer-bottom">
  <p>&copy; 2026 Shopnix. All rights reserved. (Educational clone — not affiliated with Daraz.)</p>
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
    <a class="btn btn-outline cart-view-full" href="cart.html">View Full Cart</a>
    <a class="btn btn-accent cart-checkout" href="checkout.html">Checkout</a>
  </div>
</div>
<div class="overlay" id="cartOverlay"></div>

<div class="toast" id="toast"></div>
`;

function renderPartials(){
  const headerEl = document.getElementById('site-header');
  const footerEl = document.getElementById('site-footer');
  if (headerEl) headerEl.innerHTML = HEADER_HTML;
  if (footerEl) footerEl.innerHTML = FOOTER_HTML;
  document.body.insertAdjacentHTML('beforeend', EXTRAS_HTML);
}

renderPartials();
