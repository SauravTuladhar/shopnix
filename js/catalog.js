/* ===================== PRODUCT CATALOG (Supabase-backed) ===================== */
/* CATEGORIES/PRODUCTS used to be hardcoded arrays; they're now populated once
   per page load by loadCatalog() from the `categories`/`products` tables (see
   supabase/schema.sql). Every row is normalized back to the exact shape the
   old static arrays had ({slug,label,icon} / {id,name,price,oldPrice,
   category,img,rating,reviews,flash,sold}) so every existing consumer
   (productCardHTML, cart/wishlist rendering, home.js, etc.) needed zero
   changes. CATEGORIES/PRODUCTS are empty until loadCatalog()'s promise
   resolves — every page's init sequence awaits it first (see common.js).

   loadCatalog() is memoized (_catalogPromise) and deliberately does NOT
   reset itself on failure: several scripts on the same page (this file,
   common.js, and home.js or a page's inline script) all call loadCatalog()
   during the initial page-load burst, and a fast failure (e.g. an aborted
   request) can reject before the next caller runs. If the promise reset
   itself, each of those callers would race into triggering its own
   duplicate fetch. Instead every caller shares one settled promise, and
   `showCatalogError`'s "Retry" button reloads the page — which is what
   actually clears this cache and tries again. */
let CATEGORIES = [];
let PRODUCTS = [];
let _catalogPromise = null;

function loadCatalog(){
  if (_catalogPromise) return _catalogPromise;
  _catalogPromise = Promise.all([
    sb.from('categories').select('*').order('sort_order'),
    sb.from('products').select('*'),
  ]).then(([catRes, prodRes]) => {
    if (catRes.error) throw catRes.error;
    if (prodRes.error) throw prodRes.error;
    CATEGORIES = catRes.data.map(c => ({ slug: c.slug, label: c.label, icon: c.icon }));
    PRODUCTS = prodRes.data.map(p => ({
      id: p.id, name: p.name, price: p.price, oldPrice: p.old_price,
      category: p.category_slug, img: p.img, rating: p.rating,
      reviews: p.reviews, flash: p.flash, sold: p.sold, stock: p.stock,
      description: p.description,
    }));
  });
  return _catalogPromise;
}

function categoryLabel(slug){
  const c = CATEGORIES.find(c => c.slug === slug);
  return c ? c.label : slug;
}

function getProductById(id){
  return PRODUCTS.find(p => p.id === id);
}

loadCatalog(); // kick off the fetch immediately; callers below just await the same promise
