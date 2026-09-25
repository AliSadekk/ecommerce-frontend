const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_FEE = 10;

const cartRoot = document.getElementById('cart-root');
const clearBtn = document.getElementById('clear-cart');

let confirmingClear = false;

function cartItemRow(item) {
    return `
    <article class="cart-item" data-id="${item.id}">
        <a href="product-details.html?id=${item.id}">
            <img src="${item.thumbnail}" alt="${escapeHtml(item.title)}">
        </a>
        <div>
            <h3><a href="product-details.html?id=${item.id}">${escapeHtml(item.title)}</a></h3>
            <div class="unit">${formatPrice(item.price)} each</div>
            <div class="qty">
                <button type="button" data-action="decrease" aria-label="Decrease quantity" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
                <input type="number" value="${item.quantity}" min="1" max="${MAX_QTY}" data-action="set" aria-label="Quantity">
                <button type="button" data-action="increase" aria-label="Increase quantity" ${item.quantity >= MAX_QTY ? 'disabled' : ''}>+</button>
            </div>
        </div>
        <div class="item-actions">
            <span class="line-total">${formatPrice(item.price * item.quantity)}</span>
            <button class="btn btn-ghost" data-action="remove">Remove</button>
        </div>
    </article>`;
}

function renderSummary(subtotal, count) {
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
    const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

    return `
    <aside class="summary">
        <h2>Order summary</h2>
        <div class="summary-row"><span>Items (${count})</span><span>${formatPrice(subtotal)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
        <div class="shipping-note">
            ${remaining > 0
                ? `Add <strong>${formatPrice(remaining)}</strong> more for free shipping`
                : '🎉 You\'ve unlocked free shipping!'}
            <div class="progress"><span style="width:${progress}%"></span></div>
        </div>
        <div class="summary-row total"><span>Total</span><span>${formatPrice(subtotal + shipping)}</span></div>
        <a href="checkout.html" class="btn btn-primary btn-block" style="margin-top:16px">Proceed to checkout</a>
        <a href="products.html" class="btn btn-soft btn-block">Continue shopping</a>
    </aside>`;
}

function renderCart() {
    const items = Cart.items();
    confirmingClear = false;
    clearBtn.textContent = 'Clear cart';
    clearBtn.hidden = items.length === 0;

    if (!items.length) {
        cartRoot.innerHTML = `
            <div class="state fade-in">
                <div class="state-icon">🛒</div>
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added anything yet.</p>
                <a href="products.html" class="btn btn-primary">Start shopping</a>
            </div>`;
        return;
    }

    cartRoot.innerHTML = `
        <div class="cart-layout">
            <div class="cart-list">${items.map(cartItemRow).join('')}</div>
            <div id="summary">${renderSummary(Cart.subtotal(), Cart.count())}</div>
        </div>`;
}

// Update one row and the summary in place so focus isn't lost while editing quantities.
function refreshItem(id) {
    const item = Cart.items().find(i => i.id === id);
    const row = cartRoot.querySelector(`.cart-item[data-id="${id}"]`);
    if (!item || !row) return renderCart();

    row.querySelector('input').value = item.quantity;
    row.querySelector('[data-action="decrease"]').disabled = item.quantity <= 1;
    row.querySelector('[data-action="increase"]').disabled = item.quantity >= MAX_QTY;
    row.querySelector('.line-total').textContent = formatPrice(item.price * item.quantity);
    document.getElementById('summary').innerHTML = renderSummary(Cart.subtotal(), Cart.count());
}

cartRoot.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const row = btn.closest('.cart-item');
    const id = Number(row.dataset.id);
    const item = Cart.items().find(i => i.id === id);
    if (!item) return renderCart();

    if (btn.dataset.action === 'increase') {
        Cart.setQuantity(id, item.quantity + 1);
        refreshItem(id);
    } else if (btn.dataset.action === 'decrease') {
        Cart.setQuantity(id, item.quantity - 1);
        refreshItem(id);
    } else if (btn.dataset.action === 'remove') {
        row.classList.add('removing');
        setTimeout(() => {
            Cart.remove(id);
            renderCart();
            showToast(`Removed "${item.title}"`);
        }, 250);
    }
});

cartRoot.addEventListener('change', e => {
    if (e.target.dataset.action !== 'set') return;
    const id = Number(e.target.closest('.cart-item').dataset.id);
    Cart.setQuantity(id, parseInt(e.target.value, 10) || 1);
    refreshItem(id);
});

// Two-step confirm instead of window.confirm().
clearBtn.addEventListener('click', () => {
    if (!confirmingClear) {
        confirmingClear = true;
        clearBtn.textContent = 'Click again to confirm';
        setTimeout(() => {
            confirmingClear = false;
            clearBtn.textContent = 'Clear cart';
        }, 3000);
        return;
    }
    Cart.clear();
    renderCart();
    showToast('Cart cleared');
});

window.addEventListener('storage', e => {
    if (e.key === 'cart') renderCart();
});

renderCart();
