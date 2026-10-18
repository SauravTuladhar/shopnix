/* ===================== SHARED STATE (persisted) ===================== */
const CART_KEY = 'shopnix_cart';
const WISHLIST_KEY = 'shopnix_wishlist';
const USER_KEY = 'shopnix_user';

function readJSON(key, fallback){
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function writeJSON(key, value){
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
}

const cartChangeCallbacks = [];
function onCartChange(cb){ cartChangeCallbacks.push(cb); }

function getCart(){ return readJSON(CART_KEY, []); }           // [{id, qty}]
function setCart(cart){
  writeJSON(CART_KEY, cart);
  renderCartBadge();
  renderCartDrawer();
  cartChangeCallbacks.forEach(cb => cb());
}

function getWishlist(){ return readJSON(WISHLIST_KEY, []); }    // [id, id, ...]
function setWishlist(list){ writeJSON(WISHLIST_KEY, list); renderWishlistBadge(); }

function getUser(){ return readJSON(USER_KEY, null); }
function setUser(user){ writeJSON(USER_KEY, user); updateAccountUI(); }
function logoutUser(){ localStorage.removeItem(USER_KEY); updateAccountUI(); }

function money(n){ return 'Rs. ' + Number(n).toLocaleString('en-IN'); }

/* ===================== CART OPERATIONS ===================== */
function addToCart(id, qty){
  qty = (qty === undefined || qty === null) ? 1 : qty;
  const cart = getCart();
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty += qty;
  else cart.push({ id, qty });
  setCart(cart);
}
function changeQty(id, delta){
  let cart = getCart();
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(c => c.id !== id);
  setCart(cart);
}
function removeFromCart(id){
  setCart(getCart().filter(c => c.id !== id));
}
function cartTotalQty(){
  return getCart().reduce((sum, c) => getProductById(c.id) ? sum + c.qty : sum, 0);
}
function cartSubtotal(){
  return getCart().reduce((sum, c) => {
    const p = getProductById(c.id);
    return p ? sum + p.price * c.qty : sum;
  }, 0);
}
function clearCart(){ setCart([]); }

/* ===================== WISHLIST OPERATIONS ===================== */
function isWished(id){ return getWishlist().includes(id); }
function toggleWishlist(id){
  const list = getWishlist();
  const idx = list.indexOf(id);
  if (idx > -1){ list.splice(idx, 1); }
  else { list.push(id); }
  setWishlist(list);
  return idx === -1; // true if just added
}

/* ===================== TOAST ===================== */
function showToast(msg){
  const toastEl = document.getElementById('toast');
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

/* ===================== PRODUCT CARD RENDERING ===================== */
function renderStars(rating){
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function productCardHTML(p){
  const wished = isWished(p.id);
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : null;
  return `
    <article class="product-card" data-id="${p.id}">
      ${discount ? `<div class="discount-tag">-${discount}%</div>` : ''}
      <button class="wish-toggle${wished ? ' active' : ''}" aria-label="Toggle wishlist">${wished ? '&#9829;' : '&#9825;'}</button>
      <a href="category.html?cat=${p.category}" class="product-img-link">
        <img src="${p.img}" alt="${p.name}">
      </a>
      <h4>${p.name}</h4>
      <div class="rating">${renderStars(p.rating)} <span>(${p.reviews})</span></div>
      <div class="price-row">
        <span class="price">${money(p.price)}</span>
        ${p.oldPrice ? `<span class="old-price">${money(p.oldPrice)}</span>` : ''}
      </div>
      ${p.flash ? `<div class="progress-bar"><div style="width:${p.sold}%"></div></div><small>${p.sold}% sold</small>` : ''}
      <button class="btn btn-add">Add to Cart</button>
    </article>
  `;
}

function renderGrid(container, products){
  if (!container) return;
  if (products.length === 0){
    container.innerHTML = '<p class="empty-state">No products found.</p>';
    return;
  }
  container.innerHTML = products.map(productCardHTML).join('');
}

// Event delegation: works for any grid injected now or later.
document.addEventListener('click', (e) => {
  const wishBtn = e.target.closest('.wish-toggle');
  if (wishBtn){
    const card = wishBtn.closest('.product-card');
    const id = card.dataset.id;
    const p = getProductById(id);
    if (!p) return;
    const added = toggleWishlist(id);
    // Update every card showing this product (e.g. it may appear in both
    // the flash-sale row and the main grid at once), not just the clicked one.
    document.querySelectorAll(`.product-card[data-id="${id}"] .wish-toggle`).forEach(btn => {
      btn.classList.toggle('active', added);
      btn.innerHTML = added ? '&#9829;' : '&#9825;';
    });
    showToast(added ? `Added "${p.name}" to wishlist` : `Removed "${p.name}" from wishlist`);
    return;
  }
  const addBtn = e.target.closest('.btn-add');
  if (addBtn){
    const card = addBtn.closest('.product-card');
    const id = card.dataset.id;
    const p = getProductById(id);
    if (!p) return;
    addToCart(id, 1);
    showToast(`"${p.name}" added to cart`);
    const original = addBtn.textContent;
    addBtn.textContent = 'Added ✓';
    addBtn.classList.add('added');
    setTimeout(() => { addBtn.textContent = original; addBtn.classList.remove('added'); }, 1200);
    return;
  }
});

/* ===================== CART DRAWER ===================== */
function renderCartDrawer(){
  const cartItemsWrap = document.getElementById('cartItems');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  if (!cartItemsWrap || !cartSubtotalEl) return;

  const rows = getCart().map(c => {
    const p = getProductById(c.id);
    if (!p) return '';
    return `
      <div class="cart-item" data-id="${p.id}">
        <img src="${p.img}" alt="${p.name}">
        <div class="cart-item-info">
          <h5>${p.name}</h5>
          <span>${money(p.price)}</span>
          <div class="cart-item-qty">
            <button class="qty-dec" aria-label="Decrease quantity" type="button">-</button>
            <span>${c.qty}</span>
            <button class="qty-inc" aria-label="Increase quantity" type="button">+</button>
          </div>
        </div>
        <button class="cart-item-remove" type="button">Remove</button>
      </div>
    `;
  }).filter(Boolean);

  if (rows.length === 0){
    cartItemsWrap.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    cartSubtotalEl.textContent = money(0);
    return;
  }

  cartItemsWrap.innerHTML = rows.join('');
  cartSubtotalEl.textContent = money(cartSubtotal());
}

document.addEventListener('click', (e) => {
  const row = e.target.closest('.cart-item');
  if (!row) return;
  const id = row.dataset.id;
  if (e.target.closest('.qty-inc')) changeQty(id, 1);
  else if (e.target.closest('.qty-dec')) changeQty(id, -1);
  else if (e.target.closest('.cart-item-remove')) removeFromCart(id);
});

function renderCartBadge(){
  const el = document.getElementById('cartBadge');
  if (el) el.textContent = cartTotalQty();
}
function renderWishlistBadge(){
  const el = document.getElementById('wishlistBadge');
  if (el) el.textContent = getWishlist().length;
}

/* ===================== CATEGORY NAV / MEGA MENU / MOBILE MENU ===================== */
function renderCategoryNav(){
  const categoryList = document.getElementById('categoryList');
  const megaMenuList = document.getElementById('megaMenuList');
  const mobileMenuList = document.getElementById('mobileMenuList');

  if (categoryList){
    categoryList.innerHTML =
      `<li><a href="${ROOT_PATH}index.html#flashsale">Flash Sale</a></li>` +
      CATEGORIES.map(c => `<li><a href="${ROOT_PATH}shop/category.html?cat=${c.slug}">${c.label}</a></li>`).join('') +
      `<li><a href="${ROOT_PATH}index.html#justforyou">Just For You</a></li>`;
  }
  if (megaMenuList){
    megaMenuList.innerHTML = CATEGORIES.map(c => `<li><a href="${ROOT_PATH}shop/category.html?cat=${c.slug}">${c.icon} ${c.label}</a></li>`).join('');
  }
  if (mobileMenuList){
    const user = getUser();
    mobileMenuList.innerHTML =
      `<li><a href="${ROOT_PATH}index.html">Home</a></li>` +
      `<li><a href="${ROOT_PATH}index.html#flashsale">Flash Sale</a></li>` +
      CATEGORIES.map(c => `<li><a href="${ROOT_PATH}shop/category.html?cat=${c.slug}">${c.label}</a></li>`).join('') +
      `<li><a href="${ROOT_PATH}index.html#justforyou">Just For You</a></li>` +
      `<li><a href="${ROOT_PATH}shop/wishlist.html">Wishlist</a></li>` +
      `<li><a href="${ROOT_PATH}shop/cart.html">Cart</a></li>` +
      (user
        ? `<li><a href="${ROOT_PATH}account/account.html">My Account</a></li><li><a href="${ROOT_PATH}account/orders.html">My Orders</a></li><li><a href="#" id="mobileLogoutLink">Logout</a></li>`
        : `<li><a href="${ROOT_PATH}account/login.html">Login</a></li><li><a href="${ROOT_PATH}account/signup.html">Sign Up</a></li>`);

    const logoutLink = document.getElementById('mobileLogoutLink');
    if (logoutLink){
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        logoutUser();
        closeMobileMenuFn();
        showToast('Logged out');
      });
    }
  }
}

/* ===================== ACCOUNT UI ===================== */
function updateAccountUI(){
  const guestLinks = document.getElementById('guestLinks');
  const userLinks = document.getElementById('userLinks');
  const accountLabel = document.getElementById('accountLabel');
  const ddGreeting = document.getElementById('ddGreeting');
  const user = getUser();

  if (guestLinks && userLinks){
    guestLinks.style.display = user ? 'none' : 'flex';
    guestLinks.style.flexDirection = 'column';
    userLinks.style.display = user ? 'flex' : 'none';
    userLinks.style.flexDirection = 'column';
  }
  if (accountLabel) accountLabel.textContent = user ? user.name.split(' ')[0] : 'Account';
  if (ddGreeting && user) ddGreeting.textContent = `Hi, ${user.name}`;

  renderCategoryNav(); // mobile menu login/logout links depend on auth state
}

/* ===================== HEADER / NAV INTERACTIONS ===================== */
let mobileMenuEl, overlayEl, cartDrawerEl, cartOverlayEl;

function openMobileMenuFn(){ mobileMenuEl.classList.add('open'); overlayEl.classList.add('open'); }
function closeMobileMenuFn(){ mobileMenuEl.classList.remove('open'); overlayEl.classList.remove('open'); }
function openCartDrawer(){ cartDrawerEl.classList.add('open'); cartOverlayEl.classList.add('open'); }
function closeCartDrawer(){ cartDrawerEl.classList.remove('open'); cartOverlayEl.classList.remove('open'); }

function initHeader(){
  mobileMenuEl = document.getElementById('mobileMenu');
  overlayEl = document.getElementById('overlay');
  cartDrawerEl = document.getElementById('cartDrawer');
  cartOverlayEl = document.getElementById('cartOverlay');

  document.getElementById('hamburgerBtn').addEventListener('click', openMobileMenuFn);
  document.getElementById('closeMobileMenu').addEventListener('click', closeMobileMenuFn);
  overlayEl.addEventListener('click', closeMobileMenuFn);

  document.getElementById('cartBtn').addEventListener('click', openCartDrawer);
  document.getElementById('closeCartDrawer').addEventListener('click', closeCartDrawer);
  cartOverlayEl.addEventListener('click', closeCartDrawer);

  const accountBtn = document.getElementById('accountBtn');
  const accountDropdown = document.getElementById('accountDropdown');
  accountBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    accountDropdown.classList.toggle('open');
  });
  document.getElementById('logoutBtn').addEventListener('click', () => {
    logoutUser();
    accountDropdown.classList.remove('open');
    showToast('Logged out');
  });

  const allCatsBtn = document.getElementById('allCatsBtn');
  const megaMenu = document.getElementById('megaMenu');
  allCatsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    megaMenu.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!accountDropdown.contains(e.target) && e.target !== accountBtn && !accountBtn.contains(e.target)){
      accountDropdown.classList.remove('open');
    }
    if (!megaMenu.contains(e.target) && e.target !== allCatsBtn && !allCatsBtn.contains(e.target)){
      megaMenu.classList.remove('open');
    }
  });

  const stickyWrap = document.getElementById('stickyWrap');
  const backToTop = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    stickyWrap.classList.toggle('scrolled', window.scrollY > 10);
    backToTop.classList.toggle('show', window.scrollY > 400);
  });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  initSearch();
  renderCategoryNav();
  updateAccountUI();
  renderCartBadge();
  renderWishlistBadge();
  renderCartDrawer();
}

/* ===================== SEARCH ===================== */
function initSearch(){
  const searchInput = document.getElementById('searchInput');
  const searchSuggest = document.getElementById('searchSuggest');
  const searchForm = document.getElementById('searchForm');

  const params = new URLSearchParams(window.location.search);
  if (params.get('q')) searchInput.value = params.get('q');

  function renderSuggestions(query){
    const q = query.trim().toLowerCase();
    if (!q){ searchSuggest.hidden = true; searchSuggest.innerHTML = ''; return; }
    const matches = PRODUCTS.filter(p => p.name.toLowerCase().includes(q)).slice(0, 6);
    if (matches.length === 0){ searchSuggest.hidden = true; searchSuggest.innerHTML = ''; return; }
    searchSuggest.innerHTML = matches.map(p => {
      const idx = p.name.toLowerCase().indexOf(q);
      const highlighted = idx >= 0
        ? p.name.slice(0, idx) + '<b>' + p.name.slice(idx, idx + q.length) + '</b>' + p.name.slice(idx + q.length)
        : p.name;
      return `<li data-q="${p.name}">${highlighted}</li>`;
    }).join('');
    searchSuggest.hidden = false;
    searchSuggest.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', () => {
        window.location.href = ROOT_PATH + 'shop/category.html?q=' + encodeURIComponent(li.dataset.q);
      });
    });
  }

  searchInput.addEventListener('input', () => renderSuggestions(searchInput.value));
  searchInput.addEventListener('focus', () => renderSuggestions(searchInput.value));
  document.addEventListener('click', (e) => {
    if (!searchSuggest.contains(e.target) && e.target !== searchInput) searchSuggest.hidden = true;
  });

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;
    window.location.href = ROOT_PATH + 'shop/category.html?q=' + encodeURIComponent(query);
  });
}

/* ===================== FORM VALIDATION HELPERS ===================== */
function isValidEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function showFieldMsg(el, msg, type){
  el.textContent = msg;
  el.className = 'form-msg ' + (type || '');
}

initHeader();
