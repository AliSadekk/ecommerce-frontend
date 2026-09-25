const root = document.getElementById('product-root');
const productId = Number(new URLSearchParams(location.search).get('id'));

function renderError(title, text) {
    root.innerHTML = `
        <div class="state">
            <div class="state-icon">🌿</div>
            <h2>${title}</h2>
            <p>${text}</p>
            <a href="products.html" class="btn btn-primary">Back to shop</a>
        </div>`;
}

function stockLabel(stock) {
    if (stock === 0) return '<span class="stock out">Out of stock</span>';
    if (stock <= 10) return `<span class="stock low">Only ${stock} left</span>`;
    return '<span class="stock">In stock</span>';
}

function inCartQuantity(id) {
    return Cart.items().find(item => item.id === id)?.quantity ?? 0;
}

function renderProduct(p) {
    document.title = `${p.title} | Sage Store`;
    const oldPrice = originalPrice(p.price, p.discountPercentage);
    const images = p.images?.length ? p.images : [p.thumbnail];
    const liked = Wishlist.has(p.id);
    const category = p.category.replace(/-/g, ' ');
    const reviews = p.reviews ?? [];

    root.innerHTML = `
        <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href="products.html">Shop</a> /
            <a href="products.html?category=${encodeURIComponent(p.category)}" style="text-transform:capitalize">${escapeHtml(category)}</a> /
            <span aria-current="page">${escapeHtml(p.title)}</span>
        </nav>

        <section class="details fade-in">
            <div class="gallery">
                <div class="gallery-main">
                    ${p.discountPercentage >= 1 ? `<span class="discount-tag">-${Math.round(p.discountPercentage)}%</span>` : ''}
                    <img id="main-image" src="${images[0]}" alt="${escapeHtml(p.title)}">
                </div>
                ${images.length > 1 ? `
                <div class="thumbs">
                    ${images.map((src, i) => `
                        <button class="thumb ${i === 0 ? 'active' : ''}" data-src="${src}" aria-label="View image ${i + 1}">
                            <img src="${src}" alt="" loading="lazy">
                        </button>`).join('')}
                </div>` : ''}
            </div>

            <div class="info">
                <span class="card-category">${escapeHtml(category)}</span>
                <h1>${escapeHtml(p.title)}</h1>
                <div class="rating">
                    ${renderStars(p.rating)} <strong>${p.rating.toFixed(1)}</strong>
                    <span>(${reviews.length} reviews)</span>
                    ${p.brand ? `<span class="brand">· by ${escapeHtml(p.brand)}</span>` : ''}
                </div>

                <div class="price-row">
                    <span class="price">${formatPrice(p.price)}</span>
                    ${oldPrice ? `<span class="price-old">${formatPrice(oldPrice)}</span>
                    <span class="save-pill">Save ${formatPrice(oldPrice - p.price)}</span>` : ''}
                </div>

                <p class="description">${escapeHtml(p.description)}</p>
                ${stockLabel(p.stock)}

                <div class="buy-row">
                    <div class="qty">
                        <button type="button" id="qty-minus" aria-label="Decrease quantity">−</button>
                        <input type="number" id="qty-input" value="1" min="1" aria-label="Quantity">
                        <button type="button" id="qty-plus" aria-label="Increase quantity">+</button>
                    </div>
                    <button class="btn btn-primary" id="add-to-cart">Add to cart</button>
                    <button class="icon-btn ${liked ? 'active' : ''}" id="wish-btn"
                        aria-label="${liked ? 'Remove from' : 'Add to'} wishlist" aria-pressed="${liked}">${heartIcon()}</button>
                </div>

                <div class="perks">
                    ${p.shippingInformation ? `<div class="perk"><strong>Shipping</strong>${escapeHtml(p.shippingInformation)}</div>` : ''}
                    ${p.warrantyInformation ? `<div class="perk"><strong>Warranty</strong>${escapeHtml(p.warrantyInformation)}</div>` : ''}
                    ${p.returnPolicy ? `<div class="perk"><strong>Returns</strong>${escapeHtml(p.returnPolicy)}</div>` : ''}
                </div>
            </div>
        </section>

        ${reviews.length ? `
        <section class="section">
            <h2>Customer reviews</h2>
            <div class="reviews">
                ${reviews.map(r => `
                    <article class="review">
                        <div class="review-head">
                            <span class="review-name">${escapeHtml(r.reviewerName)}</span>
                            ${renderStars(r.rating)}
                        </div>
                        <p>${escapeHtml(r.comment)}</p>
                        <time datetime="${r.date}">${new Date(r.date).toLocaleDateString()}</time>
                    </article>`).join('')}
            </div>
        </section>` : ''}

        <section class="section" id="related" hidden>
            <h2>You may also like</h2>
            <div class="grid" id="related-grid"></div>
        </section>`;

    setupInteractions(p);
    loadRelated(p);
}

function setupInteractions(p) {
    const qtyInput = document.getElementById('qty-input');
    const minus = document.getElementById('qty-minus');
    const plus = document.getElementById('qty-plus');
    const addBtn = document.getElementById('add-to-cart');
    const wishBtn = document.getElementById('wish-btn');

    // How many more of this product can still go into the cart.
    const available = () => Math.max(0, Math.min(p.stock, MAX_QTY) - inCartQuantity(p.id));

    const sync = () => {
        const max = available();
        let qty = parseInt(qtyInput.value, 10) || 1;
        qty = Math.max(1, Math.min(qty, Math.max(max, 1)));
        qtyInput.value = qty;
        qtyInput.max = max;
        minus.disabled = qty <= 1;
        plus.disabled = qty >= max;
        addBtn.disabled = max === 0;
        addBtn.textContent = p.stock === 0 ? 'Out of stock' : max === 0 ? 'Max quantity in cart' : 'Add to cart';
    };

    minus.addEventListener('click', () => { qtyInput.value = +qtyInput.value - 1; sync(); });
    plus.addEventListener('click', () => { qtyInput.value = +qtyInput.value + 1; sync(); });
    qtyInput.addEventListener('change', sync);

    addBtn.addEventListener('click', () => {
        const qty = parseInt(qtyInput.value, 10);
        Cart.add(p, qty);
        showToast(`Added ${qty} × ${p.title} to cart`);
        qtyInput.value = 1;
        sync();
    });

    wishBtn.addEventListener('click', () => {
        const liked = Wishlist.toggle(p.id);
        wishBtn.classList.toggle('active', liked);
        wishBtn.setAttribute('aria-pressed', liked);
        wishBtn.setAttribute('aria-label', `${liked ? 'Remove from' : 'Add to'} wishlist`);
        showToast(liked ? 'Saved to wishlist' : 'Removed from wishlist');
    });

    document.querySelectorAll('.thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
            document.getElementById('main-image').src = thumb.dataset.src;
            document.querySelectorAll('.thumb').forEach(t => t.classList.toggle('active', t === thumb));
        });
    });

    sync();
}

async function loadRelated(p) {
    try {
        const res = await fetch(`${API_URL}/category/${encodeURIComponent(p.category)}?limit=5&select=title,price,thumbnail,rating`);
        const data = await res.json();
        const related = data.products.filter(item => item.id !== p.id).slice(0, 4);
        if (!related.length) return;

        document.getElementById('related-grid').innerHTML = related.map(item => `
            <article class="card">
                <a href="product-details.html?id=${item.id}" class="card-media">
                    <img src="${item.thumbnail}" alt="${escapeHtml(item.title)}" loading="lazy">
                </a>
                <div class="card-body">
                    <h3 class="card-title"><a href="product-details.html?id=${item.id}">${escapeHtml(item.title)}</a></h3>
                    <div class="rating">${renderStars(item.rating)}</div>
                    <span class="price">${formatPrice(item.price)}</span>
                </div>
            </article>`).join('');
        document.getElementById('related').hidden = false;
    } catch {
        // Related products are a nice-to-have; ignore failures.
    }
}

async function init() {
    if (!productId) {
        renderError('Product not found', 'No product was selected.');
        return;
    }
    try {
        const res = await fetch(`${API_URL}/${productId}`);
        if (res.status === 404) {
            renderError('Product not found', 'This product may have been removed.');
            return;
        }
        if (!res.ok) throw new Error(res.statusText);
        renderProduct(await res.json());
    } catch {
        renderError('Something went wrong', 'We couldn\'t load this product. Please try again.');
    }
}

init();
