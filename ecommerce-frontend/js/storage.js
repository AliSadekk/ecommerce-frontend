// Shared helpers: localStorage access, cart, wishlist, UI utilities.
const API_URL = 'https://dummyjson.com/products';

const Store = {
    get(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return value ?? fallback;
        } catch {
            return fallback;
        }
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
};

const MAX_QTY = 99;

const Cart = {
    items() {
        const items = Store.get('cart', []);
        return Array.isArray(items) ? items : [];
    },
    save(items) {
        Store.set('cart', items);
        updateCartBadge();
    },
    add(product, quantity = 1) {
        const items = this.items();
        const existing = items.find(item => item.id === product.id);
        if (existing) {
            existing.quantity = Math.min(existing.quantity + quantity, MAX_QTY);
        } else {
            items.push({
                id: product.id,
                title: product.title,
                price: product.price,
                thumbnail: product.thumbnail,
                quantity: Math.min(quantity, MAX_QTY)
            });
        }
        this.save(items);
    },
    setQuantity(id, quantity) {
        const items = this.items();
        const item = items.find(i => i.id === id);
        if (!item) return;
        item.quantity = Math.max(1, Math.min(quantity, MAX_QTY));
        this.save(items);
    },
    remove(id) {
        this.save(this.items().filter(item => item.id !== id));
    },
    clear() {
        this.save([]);
    },
    count() {
        return this.items().reduce((sum, item) => sum + item.quantity, 0);
    },
    subtotal() {
        return this.items().reduce((sum, item) => sum + item.price * item.quantity, 0);
    }
};

const Wishlist = {
    ids() {
        const ids = Store.get('wishlist', []);
        return Array.isArray(ids) ? ids : [];
    },
    has(id) {
        return this.ids().includes(id);
    },
    toggle(id) {
        const ids = this.ids();
        const next = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
        Store.set('wishlist', next);
        return next.includes(id);
    }
};

function formatPrice(value) {
    return '$' + Number(value).toFixed(2);
}

function originalPrice(price, discountPercentage) {
    if (!discountPercentage) return null;
    return price / (1 - discountPercentage / 100);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

function renderStars(rating) {
    const rounded = Math.round(rating * 2) / 2;
    let html = '';
    for (let i = 1; i <= 5; i++) {
        const cls = rounded >= i ? 'full' : rounded >= i - 0.5 ? 'half' : 'empty';
        html += `<span class="star ${cls}">★</span>`;
    }
    return `<span class="stars" aria-label="Rated ${rating} out of 5">${html}</span>`;
}

function heartIcon() {
    return `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.2 4.4 2.5.8-1.3 2.3-2.5 4.4-2.5 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg>`;
}

function updateCartBadge() {
    const count = Cart.count();
    document.querySelectorAll('[data-cart-count]').forEach(el => {
        el.textContent = count;
        el.hidden = count === 0;
    });
}

function updateUserLink() {
    const user = Store.get('user', null);
    const link = document.querySelector('[data-user-link]');
    if (link && user && user.isLoggedIn) {
        link.textContent = 'Hi, ' + (user.username || user.email || 'there');
        link.removeAttribute('href');
    }
}

let toastTimer;
function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// Keep the badge in sync across tabs.
window.addEventListener('storage', e => {
    if (e.key === 'cart') updateCartBadge();
});

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    updateUserLink();
});
