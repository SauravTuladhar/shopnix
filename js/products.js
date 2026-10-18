/* ===================== CATEGORY DEFINITIONS (single source of truth) ===================== */
const CATEGORIES = [
  { slug: 'electronics',    label: 'Electronics',        icon: '📱' },
  { slug: 'mens-fashion',   label: "Men's Fashion",      icon: '👕' },
  { slug: 'womens-fashion', label: "Women's Fashion",    icon: '👗' },
  { slug: 'home',           label: 'Home & Living',      icon: '🏠' },
  { slug: 'beauty',         label: 'Health & Beauty',    icon: '💄' },
  { slug: 'sports',         label: 'Sports & Outdoor',   icon: '🏃' },
  { slug: 'toys',           label: 'Toys & Baby',        icon: '🧸' },
];

function categoryLabel(slug){
  const c = CATEGORIES.find(c => c.slug === slug);
  return c ? c.label : slug;
}

/* ===================== PRODUCT CATALOG ===================== */
const PRODUCTS = [
  { id:'wireless-earbuds-pro',  name:'Wireless Earbuds Pro',     price:2499,  oldPrice:4000, category:'electronics',    img:'https://placehold.co/300x300/0f6e5f/ffffff?text=Earbuds',      rating:4, reviews:214, flash:true,  sold:72 },
  { id:'smart-fitness-watch',   name:'Smart Fitness Watch',      price:3899,  oldPrice:5200, category:'electronics',    img:'https://placehold.co/300x300/ff6b5b/ffffff?text=Smartwatch',   rating:5, reviews:98,  flash:true,  sold:45 },
  { id:'bluetooth-speaker',     name:'Bluetooth Speaker',        price:2299,  oldPrice:null, category:'electronics',    img:'https://placehold.co/300x300/374151/ffffff?text=Speaker',      rating:4, reviews:620, flash:false },
  { id:'4k-smart-tv-43',        name:"4K Smart TV 43''",         price:34999, oldPrice:null, category:'electronics',    img:'https://placehold.co/300x300/0f6e5f/ffffff?text=Smart+TV',     rating:4, reviews:214, flash:false },
  { id:'laptop-ultraslim-14',   name:'Laptop UltraSlim 14"',     price:62999, oldPrice:69999,category:'electronics',    img:'https://placehold.co/300x300/13997f/ffffff?text=Laptop',       rating:5, reviews:132, flash:false },
  { id:'smart-home-camera',     name:'Smart Home Camera',        price:3299,  oldPrice:null, category:'electronics',    img:'https://placehold.co/300x300/ffb400/ffffff?text=Camera',       rating:4, reviews:187, flash:false },

  { id:'mens-denim-jacket',     name:"Men's Denim Jacket",       price:2499,  oldPrice:null, category:'mens-fashion',   img:'https://placehold.co/300x300/374151/ffffff?text=Jacket',       rating:5, reviews:89,  flash:false },
  { id:'mens-leather-belt',     name:"Men's Leather Belt",       price:899,   oldPrice:1200, category:'mens-fashion',   img:'https://placehold.co/300x300/1f2937/ffffff?text=Belt',         rating:4, reviews:56,  flash:false },
  { id:'running-shoes-air-x',   name:'Running Shoes Air-X',      price:3299,  oldPrice:4100, category:'mens-fashion',   img:'https://placehold.co/300x300/374151/ffffff?text=Shoes',        rating:4, reviews:301, flash:true,  sold:60 },
  { id:'backpack-urban-20l',    name:'Backpack Urban 20L',       price:2199,  oldPrice:3300, category:'mens-fashion',   img:'https://placehold.co/300x300/e14a39/ffffff?text=Backpack',     rating:4, reviews:144, flash:true,  sold:95 },

  { id:'womens-tote-bag',       name:"Women's Tote Bag",         price:1699,  oldPrice:null, category:'womens-fashion', img:'https://placehold.co/300x300/13997f/ffffff?text=Tote+Bag',     rating:4, reviews:154, flash:false },
  { id:'womens-summer-dress',   name:"Women's Summer Dress",     price:1999,  oldPrice:2800, category:'womens-fashion', img:'https://placehold.co/300x300/ff6b5b/ffffff?text=Dress',        rating:5, reviews:210, flash:false },

  { id:'ceramic-cookware-set',  name:'Ceramic Cookware Set',     price:4599,  oldPrice:6500, category:'home',           img:'https://placehold.co/300x300/ffb400/ffffff?text=Cookware',     rating:4, reviews:77,  flash:true,  sold:88 },
  { id:'memory-foam-pillow',    name:'Memory Foam Pillow',       price:999,   oldPrice:null, category:'home',           img:'https://placehold.co/300x300/13997f/ffffff?text=Pillow',       rating:4, reviews:502, flash:false },
  { id:'led-desk-lamp',         name:'LED Desk Lamp',            price:1299,  oldPrice:null, category:'home',           img:'https://placehold.co/300x300/ffb400/ffffff?text=Lamp',         rating:4, reviews:98,  flash:false },
  { id:'cotton-bedsheet-set',   name:'Cotton Bedsheet Set',      price:1899,  oldPrice:2400, category:'home',           img:'https://placehold.co/300x300/0f6e5f/ffffff?text=Bedsheet',     rating:5, reviews:230, flash:false },
  { id:'portable-blender',      name:'Portable Blender',         price:1599,  oldPrice:1900, category:'home',           img:'https://placehold.co/300x300/13997f/ffffff?text=Blender',      rating:4, reviews:66,  flash:true,  sold:30 },

  { id:'vitamin-c-serum',       name:'Vitamin C Serum',          price:799,   oldPrice:null, category:'beauty',         img:'https://placehold.co/300x300/ffb400/ffffff?text=Serum',        rating:5, reviews:1240,flash:false },
  { id:'hair-dryer-1800w',      name:'Hair Dryer 1800W',         price:2399,  oldPrice:null, category:'beauty',         img:'https://placehold.co/300x300/e14a39/ffffff?text=Hair+Dryer',   rating:5, reviews:411, flash:false },
  { id:'matte-lipstick-set',    name:'Matte Lipstick Set',       price:1299,  oldPrice:1800, category:'beauty',         img:'https://placehold.co/300x300/ff6b5b/ffffff?text=Lipstick',     rating:4, reviews:320, flash:false },
  { id:'herbal-shampoo-500ml',  name:'Herbal Shampoo 500ml',     price:549,   oldPrice:null, category:'beauty',         img:'https://placehold.co/300x300/13997f/ffffff?text=Shampoo',      rating:4, reviews:189, flash:false },

  { id:'yoga-mat-6mm',          name:'Yoga Mat 6mm',             price:1199,  oldPrice:null, category:'sports',         img:'https://placehold.co/300x300/e14a39/ffffff?text=Yoga+Mat',     rating:4, reviews:76,  flash:false },
  { id:'adjustable-dumbbells',  name:'Adjustable Dumbbells',     price:4999,  oldPrice:null, category:'sports',         img:'https://placehold.co/300x300/0f6e5f/ffffff?text=Dumbbells',    rating:4, reviews:63,  flash:false },
  { id:'cycling-helmet',        name:'Cycling Helmet',           price:1799,  oldPrice:2200, category:'sports',         img:'https://placehold.co/300x300/374151/ffffff?text=Helmet',       rating:4, reviews:52,  flash:false },
  { id:'badminton-racket-set',  name:'Badminton Racket Set',     price:1499,  oldPrice:null, category:'sports',         img:'https://placehold.co/300x300/13997f/ffffff?text=Racket',       rating:5, reviews:140, flash:false },

  { id:'building-blocks-set',   name:'Building Blocks Set',      price:1899,  oldPrice:null, category:'toys',           img:'https://placehold.co/300x300/0f6e5f/ffffff?text=Blocks',       rating:5, reviews:340, flash:false },
  { id:'remote-control-car',    name:'Remote Control Car',       price:2599,  oldPrice:null, category:'toys',           img:'https://placehold.co/300x300/374151/ffffff?text=RC+Car',       rating:5, reviews:287, flash:false },
  { id:'plush-teddy-bear',      name:'Plush Teddy Bear',         price:799,   oldPrice:null, category:'toys',           img:'https://placehold.co/300x300/ff6b5b/ffffff?text=Teddy+Bear',   rating:5, reviews:410, flash:false },
  { id:'educational-puzzle-set',name:'Educational Puzzle Set',    price:699,   oldPrice:900,  category:'toys',           img:'https://placehold.co/300x300/ffb400/ffffff?text=Puzzle',       rating:4, reviews:95,  flash:false },
];

function getProductById(id){
  return PRODUCTS.find(p => p.id === id);
}
