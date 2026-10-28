/* ===================== ADMIN DASHBOARD ===================== */
/* Loaded only by admin/*.html, right after supabase-client.js. Deliberately
   does not load catalog.js/common.js/partials.js -- the admin area has no
   storefront chrome (cart, wishlist, mega menu) and edits raw DB rows
   (category_slug, old_price, ...) rather than the reshaped CATEGORIES/
   PRODUCTS globals those scripts build for customer-facing pages. */

let CATEGORY_ROWS = []; // [{slug, label, icon, sort_order}]

function slugify(name){
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
function money(n){ return 'Rs. ' + Number(n).toLocaleString('en-IN'); }

/* ===================== AUTH GUARD ===================== */
async function isAdmin(userId){
  const { data } = await sb.from('profiles').select('is_admin').eq('id', userId).single();
  return !!(data && data.is_admin);
}

// Call at the top of every admin page except login. Resolves to the admin
// user's session, or redirects to login (clearing a non-admin session first)
// and never resolves.
async function requireAdmin(){
  const { data: { session } } = await sb.auth.getSession();
  if (!session){
    window.location.href = 'login.html';
    return new Promise(() => {});
  }
  const admin = await isAdmin(session.user.id);
  if (!admin){
    await sb.auth.signOut();
    window.location.href = 'login.html?denied=1';
    return new Promise(() => {});
  }
  return session;
}

/* ===================== PRODUCTS ===================== */
async function loadCategoryRows(){
  const { data, error } = await sb.from('categories').select('*').order('sort_order');
  if (error) throw error;
  CATEGORY_ROWS = data;
}

function categoryOptionsHTML(selected){
  return CATEGORY_ROWS.map(c =>
    `<option value="${c.slug}"${c.slug === selected ? ' selected' : ''}>${c.label}</option>`
  ).join('');
}

function priceCellHTML(p){
  if (!p.old_price){
    return `<span class="admin-price-current">${money(p.price)}</span>`;
  }
  const pct = Math.round((1 - p.price / p.old_price) * 100);
  const delta = pct > 0
    ? `<span class="admin-price-delta down">&darr; ${pct}% off</span>`
    : pct < 0
      ? `<span class="admin-price-delta up">&uarr; ${-pct}% up</span>`
      : '';
  return `
    <div class="admin-price-cell">
      <span class="admin-price-current">${money(p.price)}</span>
      <span class="old-price">was ${money(p.old_price)}</span>
      ${delta}
    </div>
  `;
}

function stockClass(stock){
  if (stock <= 0) return 'admin-stock-zero';
  if (stock <= 5) return 'admin-stock-low';
  return '';
}

function productRowHTML(p){
  return `
    <tr data-id="${p.id}">
      <td><a href="#" class="admin-view-product">${p.name}</a></td>
      <td>${categoryLabelFor(p.category_slug)}</td>
      <td>${priceCellHTML(p)}</td>
      <td class="${stockClass(p.stock)}">${p.stock}</td>
      <td>${p.flash ? '<span class="admin-flash-badge">&#9889; Flash</span>' : '<span class="text-light">&mdash;</span>'}</td>
      <td class="admin-actions">
        <button type="button" class="btn btn-outline admin-edit-product">Edit</button>
        <button type="button" class="btn btn-accent admin-delete-product">Delete</button>
      </td>
    </tr>
  `;
}

function categoryLabelFor(slug){
  const c = CATEGORY_ROWS.find(c => c.slug === slug);
  return c ? c.label : slug;
}

let PRODUCT_ROWS = [];
let editingProductId = null;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

async function loadProducts(){
  const { data, error } = await sb.from('products').select('*').order('name');
  if (error){ showAdminAlert('productsAlert', 'Could not load products: ' + error.message); return; }
  PRODUCT_ROWS = data;
  document.getElementById('productsTableBody').innerHTML = PRODUCT_ROWS.map(productRowHTML).join('')
    || '<tr><td colspan="6" class="empty-state">No products yet.</td></tr>';
  const outOfStock = PRODUCT_ROWS.filter(p => p.stock <= 0).length;
  const summary = document.getElementById('productsSummary');
  if (summary) summary.textContent = `${PRODUCT_ROWS.length} product${PRODUCT_ROWS.length === 1 ? '' : 's'}` +
    (outOfStock ? ` · ${outOfStock} out of stock` : '');
}

function updateImgPreview(url){
  const preview = document.getElementById('productImgPreview');
  if (!preview) return;
  if (url){ preview.src = url; } else { preview.removeAttribute('src'); preview.style.display = 'none'; }
}

function resetProductForm(){
  editingProductId = null;
  const form = document.getElementById('productForm');
  form.reset();
  document.getElementById('productFormTitle').textContent = 'Add Product';
  document.getElementById('productIdInput').placeholder = 'generated-from-name';
  document.getElementById('productCancelEdit').style.display = 'none';
  document.getElementById('productImgUploadStatus').textContent = '';
  updateImgPreview('');
}

async function uploadProductImage(file){
  const statusEl = document.getElementById('productImgUploadStatus');
  const fileInput = document.getElementById('productImgFileInput');

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)){
    showAdminAlert('productsAlert', 'Please choose a JPEG, PNG, WebP, or GIF image.');
    return;
  }
  if (file.size > MAX_IMAGE_BYTES){
    showAdminAlert('productsAlert', 'Image must be 5MB or smaller.');
    return;
  }

  const ext = (file.name.split('.').pop() || file.type.split('/').pop() || 'jpg').toLowerCase();
  const idPart = editingProductId || slugify(document.getElementById('productNameInput').value.trim()) || 'product';
  const path = `${idPart}-${Date.now()}.${ext}`;

  statusEl.textContent = 'Uploading…';
  fileInput.disabled = true;
  const { error } = await sb.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
  fileInput.disabled = false;

  if (error){
    statusEl.textContent = '';
    showAdminAlert('productsAlert', 'Could not upload image: ' + error.message);
    return;
  }

  const { data } = sb.storage.from('product-images').getPublicUrl(path);
  document.getElementById('productImgInput').value = data.publicUrl;
  updateImgPreview(data.publicUrl);
  statusEl.textContent = 'Uploaded.';
  showAdminAlert('productsAlert', 'Image uploaded.', true);
}

function fillProductForm(p){
  editingProductId = p.id;
  document.getElementById('productFormTitle').textContent = `Edit "${p.name}"`;
  document.getElementById('productIdInput').value = p.id;
  document.getElementById('productIdInput').disabled = true;
  document.getElementById('productNameInput').value = p.name;
  document.getElementById('productCategoryInput').value = p.category_slug;
  document.getElementById('productPriceInput').value = p.price;
  document.getElementById('productOldPriceInput').value = p.old_price || '';
  document.getElementById('productImgInput').value = p.img;
  updateImgPreview(p.img);
  document.getElementById('productStockInput').value = p.stock;
  document.getElementById('productRatingInput').value = p.rating;
  document.getElementById('productReviewsInput').value = p.reviews;
  document.getElementById('productFlashInput').checked = p.flash;
  document.getElementById('productDescriptionInput').value = p.description || '';
  document.getElementById('productImgFileInput').value = '';
  document.getElementById('productImgUploadStatus').textContent = '';
  document.getElementById('productCancelEdit').style.display = 'inline-block';
  window.scrollTo({ top: document.getElementById('productForm').offsetTop - 80, behavior: 'smooth' });
}

function showAdminAlert(id, msg, ok){
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = 'form-alert show ' + (ok ? 'success' : 'error');
}

let viewingProductId = null;

function showProductDetail(p){
  viewingProductId = p.id;
  const img = document.getElementById('pdAdminImg');
  img.src = p.img;
  img.alt = p.name;
  document.getElementById('pdAdminName').textContent = p.name;
  document.getElementById('pdAdminCategory').textContent = categoryLabelFor(p.category_slug);
  document.getElementById('pdAdminPrice').innerHTML = priceCellHTML(p);
  document.getElementById('pdAdminStock').textContent = p.stock <= 0 ? 'Out of stock' : `${p.stock} in stock`;
  document.getElementById('pdAdminRating').textContent = `${p.rating} ★ (${p.reviews} reviews)`;
  document.getElementById('pdAdminFlash').textContent = p.flash ? 'Flash sale item' : 'Not a flash sale item';
  document.getElementById('pdAdminDescription').textContent = p.description || 'No description set.';
  document.getElementById('productListView').style.display = 'none';
  document.getElementById('productDetailView').style.display = 'block';
}

function hideProductDetail(){
  viewingProductId = null;
  document.getElementById('productDetailView').style.display = 'none';
  document.getElementById('productListView').style.display = 'block';
}

async function deleteProduct(p){
  if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
  const { error } = await sb.from('products').delete().eq('id', p.id);
  if (error){ showAdminAlert('productsAlert', 'Could not delete: ' + error.message); return; }
  showAdminAlert('productsAlert', `Deleted "${p.name}".`, true);
  if (editingProductId === p.id) resetProductForm();
  if (viewingProductId === p.id) hideProductDetail();
  await loadProducts();
}

function initProductsSection(){
  document.getElementById('productCategoryInput').innerHTML = categoryOptionsHTML();

  const imgInput = document.getElementById('productImgInput');
  const imgPreview = document.getElementById('productImgPreview');
  imgInput.addEventListener('input', () => updateImgPreview(imgInput.value.trim()));
  imgPreview.addEventListener('load', () => { imgPreview.style.display = 'block'; });
  imgPreview.addEventListener('error', () => { imgPreview.style.display = 'none'; });

  document.getElementById('productImgFileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await uploadProductImage(file);
    e.target.value = '';
  });

  document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('productNameInput').value.trim();
    const row = {
      name,
      category_slug: document.getElementById('productCategoryInput').value,
      price: Number(document.getElementById('productPriceInput').value),
      old_price: document.getElementById('productOldPriceInput').value ? Number(document.getElementById('productOldPriceInput').value) : null,
      img: document.getElementById('productImgInput').value.trim(),
      stock: Number(document.getElementById('productStockInput').value),
      rating: Number(document.getElementById('productRatingInput').value),
      reviews: Number(document.getElementById('productReviewsInput').value),
      flash: document.getElementById('productFlashInput').checked,
      description: document.getElementById('productDescriptionInput').value.trim() || null,
    };

    if (editingProductId){
      const { error } = await sb.from('products').update(row).eq('id', editingProductId);
      if (error){ showAdminAlert('productsAlert', 'Could not save product: ' + error.message); return; }
      showAdminAlert('productsAlert', `Updated "${name}".`, true);
    } else {
      const id = slugify(name);
      if (!id){ showAdminAlert('productsAlert', 'Please enter a product name.'); return; }
      const { error } = await sb.from('products').insert({ id, ...row, sold: null });
      if (error){
        showAdminAlert('productsAlert', error.code === '23505'
          ? 'A product with a very similar name already exists. Try a more specific name.'
          : 'Could not create product: ' + error.message);
        return;
      }
      showAdminAlert('productsAlert', `Added "${name}".`, true);
    }
    resetProductForm();
    await loadProducts();
  });

  document.getElementById('productCancelEdit').addEventListener('click', resetProductForm);

  document.getElementById('productsTableBody').addEventListener('click', async (e) => {
    const row = e.target.closest('tr');
    if (!row) return;
    const id = row.dataset.id;
    const p = PRODUCT_ROWS.find(p => p.id === id);
    if (!p) return;

    if (e.target.closest('.admin-view-product')){
      e.preventDefault();
      showProductDetail(p);
    } else if (e.target.closest('.admin-edit-product')){
      fillProductForm(p);
    } else if (e.target.closest('.admin-delete-product')){
      await deleteProduct(p);
    }
  });

  document.getElementById('productDetailBack').addEventListener('click', hideProductDetail);
  document.getElementById('productDetailEdit').addEventListener('click', () => {
    const p = PRODUCT_ROWS.find(p => p.id === viewingProductId);
    hideProductDetail();
    if (p) fillProductForm(p);
  });
  document.getElementById('productDetailDelete').addEventListener('click', async () => {
    const p = PRODUCT_ROWS.find(p => p.id === viewingProductId);
    if (p) await deleteProduct(p);
  });
}

/* ===================== ORDERS ===================== */
const ORDER_STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
const STATUS_CLASS = {
  Delivered: 'status-delivered', Shipped: 'status-shipped',
  Processing: 'status-processing', Cancelled: 'status-cancelled',
};

function orderRowHTML(o){
  const itemsLabel = o.order_items.map(it => `${it.product_id} &times; ${it.qty}`).join(', ');
  const date = new Date(o.created_at).toLocaleString();
  return `
    <tr data-id="${o.id}">
      <td>${o.order_code}</td>
      <td>${date}</td>
      <td>${o.name}<br><span class="text-light">${o.phone}</span></td>
      <td>${itemsLabel}</td>
      <td>${money(o.total)}</td>
      <td>
        <select class="admin-order-status status-badge ${STATUS_CLASS[o.status] || ''}">
          ${ORDER_STATUSES.map(s => `<option value="${s}"${s === o.status ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
    </tr>
  `;
}

async function loadOrders(){
  const { data, error } = await sb.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
  if (error){ showAdminAlert('ordersAlert', 'Could not load orders: ' + error.message); return; }
  document.getElementById('ordersTableBody').innerHTML = data.map(orderRowHTML).join('')
    || '<tr><td colspan="6" class="empty-state">No orders yet.</td></tr>';
  const processing = data.filter(o => o.status === 'Processing').length;
  const summary = document.getElementById('ordersSummary');
  if (summary) summary.textContent = `${data.length} order${data.length === 1 ? '' : 's'}` +
    (processing ? ` · ${processing} processing` : '');
}

function initOrdersSection(){
  document.getElementById('ordersTableBody').addEventListener('change', async (e) => {
    const select = e.target.closest('.admin-order-status');
    if (!select) return;
    const row = select.closest('tr');
    const id = row.dataset.id;
    const status = select.value;
    const { error } = await sb.from('orders').update({ status }).eq('id', id);
    if (error){ showAdminAlert('ordersAlert', 'Could not update status: ' + error.message); return; }
    select.className = 'admin-order-status status-badge ' + (STATUS_CLASS[status] || '');
    showAdminAlert('ordersAlert', `Order status updated to "${status}".`, true);
  });
}

/* ===================== TABS ===================== */
function initTabs(){
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.panel).classList.add('active');
      const title = document.getElementById('adminPageTitle');
      const sub = document.getElementById('adminPageSub');
      if (title && tab.dataset.title) title.textContent = tab.dataset.title;
      if (sub && tab.dataset.sub) sub.textContent = tab.dataset.sub;
    });
  });
}

/* ===================== DASHBOARD INIT ===================== */
async function initAdminDashboard(){
  const session = await requireAdmin();
  const { data: profile } = await sb.from('profiles').select('name').eq('id', session.user.id).single();
  document.getElementById('adminGreeting').textContent = `Hi, ${(profile && profile.name) || session.user.email}`;

  document.getElementById('adminLogoutBtn').addEventListener('click', async () => {
    await sb.auth.signOut();
    window.location.href = 'login.html';
  });

  initTabs();
  initProductsSection();
  initOrdersSection();

  try {
    await loadCategoryRows();
    document.getElementById('productCategoryInput').innerHTML = categoryOptionsHTML();
  } catch (err) {
    showAdminAlert('productsAlert', 'Could not load categories: ' + err.message);
  }
  await loadProducts();
  await loadOrders();
}
