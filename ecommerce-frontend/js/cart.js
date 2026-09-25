const cartContainer = document.getElementById('cart-container');
const cartTotalContainer = document.getElementById('cart-total-container');
const cartTotalElement = document.getElementById('cart-total');

function readCart() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        return Array.isArray(cart) ? cart : [];
    } catch (error) {
        return [];
    }
}

function writeCart(cart) {
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
        return false;
    }
    return true;
}

function normalizeProduct(product) {
    const rawPrice = typeof product.price === 'string'
        ? product.price.replace(/[^\d.-]/g, '')
        : product.price;

    return {
        id: product.id || product.title || product.name,
        title: product.title || product.name || 'Product',
        price: Number(rawPrice) || 0,
        thumbnail: product.thumbnail || product.image || '',
        quantity: Math.max(1, Number(product.quantity) || 1),
    };
}

function renderCart() {
    const cart = readCart().map(normalizeProduct);
    
    cartContainer.textContent = '';

    if (cart.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-cart';
        emptyMessage.textContent = 'Your cart is currently empty.';
        cartContainer.appendChild(emptyMessage);
        cartTotalContainer.style.display = "none";
        return;
    }

    let total = 0;

    cart.forEach((product, index) => {
        total += product.price * product.quantity;

        const card = document.createElement("div");
        card.className = "product-card";

        const image = document.createElement('img');
        image.src = product.thumbnail;
        image.alt = product.title;

        const title = document.createElement('h2');
        title.textContent = product.title;

        const price = document.createElement('p');
        price.className = 'price';
        price.textContent = `$${product.price.toFixed(2)}`;

        const actions = document.createElement('div');
        actions.className = 'product-actions';

        const quantityControl = document.createElement('div');
        quantityControl.className = 'quantity-control';

        const minusButton = document.createElement('button');
        minusButton.className = 'minus-btn';
        minusButton.dataset.index = String(index);
        minusButton.type = 'button';
        minusButton.textContent = '-';

        const quantity = document.createElement('span');
        quantity.className = 'quantity';
        quantity.textContent = String(product.quantity);

        const plusButton = document.createElement('button');
        plusButton.className = 'plus-btn';
        plusButton.dataset.index = String(index);
        plusButton.type = 'button';
        plusButton.textContent = '+';

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-btn';
        removeButton.dataset.index = String(index);
        removeButton.type = 'button';
        removeButton.textContent = 'Remove';

        quantityControl.append(minusButton, quantity, plusButton);
        actions.append(quantityControl, removeButton);
        card.append(image, title, price, actions);

        cartContainer.appendChild(card);
    });

    cartTotalElement.textContent = total.toFixed(2);
    cartTotalContainer.style.display = "block";

    attachEventListeners();
}

function attachEventListeners() {
    const minusButtons = document.querySelectorAll(".minus-btn");
    const plusButtons = document.querySelectorAll(".plus-btn");
    const removeButtons = document.querySelectorAll(".remove-btn");

    // Increase quantity
    plusButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            const index = e.target.getAttribute("data-index");
            updateQuantity(index, 1);
        });
    });

    minusButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            const index = e.target.getAttribute("data-index");
            updateQuantity(index, -1);
        });
    });

    removeButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            const index = e.target.getAttribute("data-index");
            
            // Built-in browser confirmation keeps the code simple and matches the project's alert() usage
            const userConfirmed = confirm("Are you sure you want to remove this item from your cart?");
            
            if (userConfirmed) {
                removeProduct(index);
            }
        });
    });
}

function updateQuantity(index, change) {
    const cart = readCart().map(normalizeProduct);
    
    if (cart[index]) {
        cart[index].quantity += change;
        
        if (cart[index].quantity < 1) {
            const userConfirmed = confirm("Quantity is 0. Do you want to remove this item?");
            if (userConfirmed) {
                cart.splice(index, 1);
            } else {
                cart[index].quantity = 1;
            }
        }
    }

    writeCart(cart);
    renderCart();
}

function removeProduct(index) {
    const cart = readCart().map(normalizeProduct);
    cart.splice(index, 1);
    writeCart(cart);
    renderCart();
}

renderCart();