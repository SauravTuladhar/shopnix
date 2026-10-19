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

function productRowHTML(p){
  const outOfStock = p.stock <= 0;
  return `
    <tr data-id="${p.id}">
      <td>${p.name}</td>
      <td>${categoryLabelFor(p.category_slug)}</td>
      <td>${money(p.price)}${p.old_price ? ` <span class="old-price">${money(p.old_price)}</span>` : ''}</td>
      <td class="${outOfStock ? 'admin-stock-zero' : ''}">${p.stock}</td>
      <td>${p.flash ? 'Yes' : 'No'}</td>
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

async function loadProducts(){
  const { data, error } = await sb.from('products').select('*').order('name');
  if (error){ showAdminAlert('productsAlert', 'Could not load products: ' + error.message); return; }
  PRODUCT_ROWS = data;
  document.getElementById('productsTableBody').innerHTML = PRODUCT_ROWS.map(productRowHTML).join('')
    || '<tr><td colspan="6" class="empty-state">No products yet.</td></tr>';
}

function resetProductForm(){
  editingProductId = null;
  const form = document.getElementById('productForm');
  form.reset();
  document.getElementById('productFormTitle').textContent = 'Add Product';
  document.getElementById('productIdInput').placeholder = 'generated-from-name';
  document.getElementById('productCancelEdit').style.display = 'none';
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
  document.getElementById('productStockInput').value = p.stock;
  document.getElementById('productRatingInput').value = p.rating;
  document.getElementById('productReviewsInput').value = p.reviews;
  document.getElementById('productFlashInput').checked = p.flash;
  document.getElementById('productCancelEdit').style.display = 'inline-block';
  window.scrollTo({ top: document.getElementById('productForm').offsetTop - 80, behavior: 'smooth' });
}

function showAdminAlert(id, msg, ok){
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = 'form-alert show ' + (ok ? 'success' : 'error');
}

function initProductsSection(){
  document.getElementById('productCategoryInput').innerHTML = categoryOptionsHTML();

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

    if (e.target.closest('.admin-edit-product')){
      fillProductForm(p);
    } else if (e.target.closest('.admin-delete-product')){
      if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
      const { error } = await sb.from('products').delete().eq('id', id);
      if (error){ showAdminAlert('productsAlert', 'Could not delete: ' + error.message); return; }
      showAdminAlert('productsAlert', `Deleted "${p.name}".`, true);
      if (editingProductId === id) resetProductForm();
      await loadProducts();
    }
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
