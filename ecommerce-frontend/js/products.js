const PAGE_SIZE = 12;
const FIELDS = 'title,price,thumbnail,rating,discountPercentage,category,stock';

const SORT_OPTIONS = {
    price_asc: { sortBy: 'price', order: 'asc' },
    price_desc: { sortBy: 'price', order: 'desc' },
    rating_desc: { sortBy: 'rating', order: 'desc' },
    title_asc: { sortBy: 'title', order: 'asc' }
};

const grid = document.getElementById('product-grid');
const searchInput = document.getElementById('search');
const sortSelect = document.getElementById('sort');
const categoriesEl = document.getElementById('categories');
const resultsInfo = document.getElementById('results-info');
const loadMoreBtn = document.getElementById('load-more');

const savedFilters = Store.get('lastFilters', {});
const urlCategory = new URLSearchParams(location.search).get('category');

const state = {
    category: urlCategory ?? savedFilters.category ?? '',
    sortBy: SORT_OPTIONS[savedFilters.sortBy] ? savedFilters.sortBy : '',
    query: '',
    skip: 0,
    total: 0,
    products: []
};

let requestId = 0;

function saveFilters() {
    Store.set('lastFilters', { category: state.category, sortBy: state.sortBy });
}

function buildUrl() {
    const params = new URLSearchParams({ limit: PAGE_SIZE, skip: state.skip, select: FIELDS });
    const sort = SORT_OPTIONS[state.sortBy];
    if (sort) {
        params.set('sortBy', sort.sortBy);
        params.set('order', sort.order);
    }
    if (state.query) {
        params.set('q', state.query);
        return `${API_URL}/search?${params}`;
    }
    if (state.category) {
        return `${API_URL}/category/${encodeURIComponent(state.category)}?${params}`;
    }
    return `${API_URL}?${params}`;
}

function renderSkeletons(count = 8) {
    const html = Array.from({ length: count }, () => `
        <div class="skeleton" aria-hidden="true">
            <div class="sk-media"></div>
            <div class="sk-line short"></div>
            <div class="sk-line"></div>
            <div class="sk-line short"></div>
        </div>`).join('');
    grid.insertAdjacentHTML('beforeend', html);
}

function removeSkeletons() {
    grid.querySelectorAll('.skeleton').forEach(el => el.remove());
}

function productCard(p, index) {
    const oldPrice = originalPrice(p.price, p.discountPercentage);
    const liked = Wishlist.has(p.id);
    const outOfStock = p.stock === 0;
    return `
    <article class="card fade-in" style="animation-delay:${(index % PAGE_SIZE) * 30}ms">
        <button class="icon-btn ${liked ? 'active' : ''}" data-wish="${p.id}"
            aria-label="${liked ? 'Remove from' : 'Add to'} wishlist" aria-pressed="${liked}">${heartIcon()}</button>
        <a href="product-details.html?id=${p.id}" class="card-media">
            ${p.discountPercentage >= 1 ? `<span class="discount-tag">-${Math.round(p.discountPercentage)}%</span>` : ''}
            <img src="${p.thumbnail}" alt="${escapeHtml(p.title)}" loading="lazy">
        </a>
        <div class="card-body">
            <span class="card-category">${escapeHtml(p.category.replace(/-/g, ' '))}</span>
            <h3 class="card-title"><a href="product-details.html?id=${p.id}">${escapeHtml(p.title)}</a></h3>
            <div class="rating">${renderStars(p.rating)} ${p.rating.toFixed(1)}</div>
            <div class="card-footer">
                <div>
                    <span class="price">${formatPrice(p.price)}</span>
                    ${oldPrice ? `<span class="price-old">${formatPrice(oldPrice)}</span>` : ''}
                </div>
                <button class="btn btn-primary" data-add="${p.id}" ${outOfStock ? 'disabled' : ''}>
                    ${outOfStock ? 'Sold out' : 'Add to cart'}
                </button>
            </div>
        </div>
    </article>`;
}

function renderState(icon, title, text, action = '') {
    grid.innerHTML = `
        <div class="state" style="grid-column:1/-1">
            <div class="state-icon">${icon}</div>
            <h2>${title}</h2>
            <p>${text}</p>
            ${action}
        </div>`;
}

async function loadProducts({ append = false } = {}) {
    const id = ++requestId;
    if (!append) {
        state.skip = 0;
        state.products = [];
        grid.innerHTML = '';
        resultsInfo.textContent = 'Loading products...';
    }
    loadMoreBtn.hidden = true;
    renderSkeletons(append ? 4 : 8);

    try {
        const res = await fetch(buildUrl());
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        if (id !== requestId) return; // a newer request replaced this one

        removeSkeletons();
        state.total = data.total;
        const start = state.products.length;
        state.products.push(...data.products);
        state.skip = state.products.length;

        if (state.products.length === 0) {
            resultsInfo.textContent = '';
            renderState('🔍', 'No products found', 'Try a different search or category.',
                '<button class="btn btn-primary" id="reset-filters">Clear filters</button>');
            return;
        }

        grid.insertAdjacentHTML('beforeend', data.products.map((p, i) => productCard(p, start + i)).join(''));
        resultsInfo.textContent = `Showing ${state.products.length} of ${state.total} products`;
        loadMoreBtn.hidden = state.products.length >= state.total;
    } catch (err) {
        if (id !== requestId) return;
        removeSkeletons();
        resultsInfo.textContent = '';
        renderState('⚠️', 'Something went wrong', 'We couldn\'t load products. Check your connection and try again.',
            '<button class="btn btn-primary" id="retry">Try again</button>');
    }
}

async function loadCategories() {
    const renderChips = categories => {
        const all = [{ slug: '', name: 'All' }, ...categories];
        categoriesEl.innerHTML = all.map(c => `
            <button class="chip ${c.slug === state.category ? 'active' : ''}" role="tab"
                aria-selected="${c.slug === state.category}" data-category="${c.slug}">${escapeHtml(c.name)}</button>`).join('');
        categoriesEl.querySelector('.chip.active')?.scrollIntoView({ block: 'nearest', inline: 'center' });
    };
    renderChips([]);
    try {
        const res = await fetch(`${API_URL}/categories`);
        renderChips(await res.json());
    } catch {
        // Category chips are optional; the "All" chip still works.
    }
}

function setActiveChip() {
    categoriesEl.querySelectorAll('.chip').forEach(chip => {
        const active = chip.dataset.category === state.category;
        chip.classList.toggle('active', active);
        chip.setAttribute('aria-selected', active);
    });
}

// ---------- Events ----------
categoriesEl.addEventListener('click', e => {
    const chip = e.target.closest('[data-category]');
    if (!chip) return;
    state.category = chip.dataset.category;
    // The API can't search within a category, so picking a category clears the search.
    state.query = '';
    searchInput.value = '';
    setActiveChip();
    saveFilters();
    loadProducts();
});

sortSelect.addEventListener('change', () => {
    state.sortBy = sortSelect.value;
    saveFilters();
    loadProducts();
});

let searchTimer;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        state.query = searchInput.value.trim();
        if (state.query) {
            state.category = '';
            setActiveChip();
        }
        loadProducts();
    }, 350);
});

loadMoreBtn.addEventListener('click', () => loadProducts({ append: true }));

grid.addEventListener('click', e => {
    const addBtn = e.target.closest('[data-add]');
    if (addBtn) {
        const product = state.products.find(p => p.id === Number(addBtn.dataset.add));
        Cart.add(product);
        showToast(`Added "${product.title}" to cart`);
        addBtn.textContent = 'Added ✓';
        setTimeout(() => { addBtn.textContent = 'Add to cart'; }, 1200);
        return;
    }

    const wishBtn = e.target.closest('[data-wish]');
    if (wishBtn) {
        const liked = Wishlist.toggle(Number(wishBtn.dataset.wish));
        wishBtn.classList.toggle('active', liked);
        wishBtn.setAttribute('aria-pressed', liked);
        wishBtn.setAttribute('aria-label', `${liked ? 'Remove from' : 'Add to'} wishlist`);
        showToast(liked ? 'Saved to wishlist' : 'Removed from wishlist');
        return;
    }

    if (e.target.id === 'retry') loadProducts();
    if (e.target.id === 'reset-filters') {
        state.category = '';
        state.query = '';
        searchInput.value = '';
        setActiveChip();
        saveFilters();
        loadProducts();
    }
});

// ---------- Init ----------
sortSelect.value = state.sortBy;
loadCategories();
loadProducts();
