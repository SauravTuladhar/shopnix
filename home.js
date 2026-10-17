/* ===================== HOME PAGE ONLY: carousel, countdown, category grid, tabs ===================== */

/* ---- Hero carousel ---- */
function initCarousel(){
  const track = document.getElementById('carouselTrack');
  const slides = Array.from(track.children);
  const dotsWrap = document.getElementById('carouselDots');
  const prevBtn = document.getElementById('prevSlide');
  const nextBtn = document.getElementById('nextSlide');
  let currentSlide = 0;
  let carouselTimer;

  slides.forEach((_, i) => {
    const dot = document.createElement('span');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function goToSlide(i){
    currentSlide = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((d, idx) => d.classList.toggle('active', idx === currentSlide));
  }
  function nextSlideFn(){ goToSlide(currentSlide + 1); }
  function startCarousel(){ carouselTimer = setInterval(nextSlideFn, 4000); }
  function stopCarousel(){ clearInterval(carouselTimer); }

  prevBtn.addEventListener('click', () => { goToSlide(currentSlide - 1); stopCarousel(); startCarousel(); });
  nextBtn.addEventListener('click', () => { nextSlideFn(); stopCarousel(); startCarousel(); });
  track.parentElement.addEventListener('mouseenter', stopCarousel);
  track.parentElement.addEventListener('mouseleave', startCarousel);
  startCarousel();
}

/* ---- Flash sale countdown ---- */
function initCountdown(){
  const cdH = document.getElementById('cdH');
  const cdM = document.getElementById('cdM');
  const cdS = document.getElementById('cdS');

  function getNextDeadline(){
    const d = new Date();
    d.setHours(d.getHours() + 6, 0, 0, 0); // rolling 6-hour flash sale window
    return d;
  }
  let deadline = getNextDeadline();

  function pad(n){ return String(n).padStart(2, '0'); }
  function tick(){
    const diff = deadline - new Date();
    if (diff <= 0){ deadline = getNextDeadline(); return; }
    cdH.textContent = pad(Math.floor(diff / 3600000));
    cdM.textContent = pad(Math.floor((diff % 3600000) / 60000));
    cdS.textContent = pad(Math.floor((diff % 60000) / 1000));
  }
  tick();
  setInterval(tick, 1000);
}

/* ---- Sidebar categories (hero) ---- */
function renderSidebarCats(){
  const el = document.getElementById('sidebarCatsList');
  if (!el) return;
  el.innerHTML = CATEGORIES.map(c => `<li><a href="category.html?cat=${c.slug}">${c.label}</a></li>`).join('');
}

/* ---- Category icon grid ---- */
function renderCatGrid(){
  const el = document.getElementById('catGrid');
  if (!el) return;
  el.innerHTML = CATEGORIES.map(c =>
    `<button class="cat-item" data-filter="${c.slug}"><span class="cat-icon">${c.icon}</span>${c.label}</button>`
  ).join('');
  el.querySelectorAll('.cat-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('justforyou').scrollIntoView({ behavior: 'smooth' });
      setFilter(btn.dataset.filter);
    });
  });
}

/* ---- Flash sale row ---- */
function renderFlashSale(){
  renderGrid(document.getElementById('flashSaleRow'), PRODUCTS.filter(p => p.flash));
}

/* ---- Just For You: tabs + incremental "load more" ---- */
const PAGE_SIZE = 12;
let currentFilter = 'all';
let visibleCount = PAGE_SIZE;

function filteredProducts(){
  return currentFilter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === currentFilter);
}

function renderJustForYou(){
  const all = filteredProducts();
  renderGrid(document.getElementById('productGrid'), all.slice(0, visibleCount));

  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (visibleCount >= all.length){
    loadMoreBtn.textContent = 'No more products';
    loadMoreBtn.disabled = true;
  } else {
    loadMoreBtn.textContent = 'Load More';
    loadMoreBtn.disabled = false;
  }
}

function setFilter(filter){
  currentFilter = filter;
  visibleCount = PAGE_SIZE;
  document.querySelectorAll('#tabsList .tab').forEach(t => t.classList.toggle('active', t.dataset.filter === filter));
  renderJustForYou();
}

function renderTabs(){
  const el = document.getElementById('tabsList');
  el.innerHTML = `<button class="tab active" data-filter="all">All</button>` +
    CATEGORIES.map(c => `<button class="tab" data-filter="${c.slug}">${c.label}</button>`).join('');
  el.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => setFilter(tab.dataset.filter));
  });
}

function initLoadMore(){
  document.getElementById('loadMoreBtn').addEventListener('click', () => {
    visibleCount += 8;
    renderJustForYou();
  });
}

/* ---- Newsletter ---- */
function initNewsletter(){
  const form = document.getElementById('newsletterForm');
  const emailInput = document.getElementById('newsletterEmail');
  const msg = document.getElementById('newsletterMsg');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!isValidEmail(email)){
      showFieldMsg(msg, 'Please enter a valid email address.', 'error');
      return;
    }
    showFieldMsg(msg, `Thanks! A discount code has been sent to ${email}.`, 'success');
    form.reset();
  });
}

/* ---- Deep-link support: index.html?cat=slug or ?q=term scrolls + filters ---- */
function handleHomeDeepLink(){
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('cat');
  if (cat && CATEGORIES.some(c => c.slug === cat)){
    setFilter(cat);
    document.getElementById('justforyou').scrollIntoView({ behavior: 'smooth' });
  }
}

renderSidebarCats();
renderCatGrid();
renderFlashSale();
renderTabs();
renderJustForYou();
initLoadMore();
initCarousel();
initCountdown();
initNewsletter();
handleHomeDeepLink();
