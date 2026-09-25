const productsContainer = document.getElementById('products-container');

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
        return true;
    } catch (error) {
        return false;
    }
}

function renderProducts(products) {
    productsContainer.textContent = '';

    products.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.productId = String(item.id);
        card.dataset.title = item.title;
        card.dataset.price = String(item.price);
        card.dataset.thumbnail = item.thumbnail;

        const image = document.createElement('img');
        image.src = item.thumbnail;
        image.alt = item.title;

        const title = document.createElement('h2');
        title.textContent = item.title;

        const price = document.createElement('p');
        price.className = 'price';
        price.textContent = `$${Number(item.price).toFixed(2)}`;

        const actions = document.createElement('div');
        actions.className = 'product-actions';

        const quantityControl = document.createElement('div');
        quantityControl.className = 'quantity-control';

        const minusButton = document.createElement('button');
        minusButton.className = 'minus-btn';
        minusButton.dataset.action = 'decrease';
        minusButton.type = 'button';
        minusButton.textContent = '-';

        const quantity = document.createElement('span');
        quantity.className = 'quantity';
        quantity.textContent = '1';

        const plusButton = document.createElement('button');
        plusButton.className = 'plus-btn';
        plusButton.dataset.action = 'increase';
        plusButton.type = 'button';
        plusButton.textContent = '+';

        const addButton = document.createElement('button');
        addButton.className = 'add-to-cart';
        addButton.dataset.action = 'add';
        addButton.type = 'button';
        addButton.textContent = 'Add to Cart';

        quantityControl.append(minusButton, quantity, plusButton);
        actions.append(quantityControl, addButton);
        card.append(image, title, price, actions);
        productsContainer.appendChild(card);
    });
}

function showLoadError() {
    productsContainer.textContent = 'Could not load products. Please refresh and try again.';
}

productsContainer.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const card = button.closest('.product-card');
    const quantityElement = card.querySelector('.quantity');
    let quantity = Number(quantityElement.textContent) || 1;

    if (button.dataset.action === 'increase') {
        quantityElement.textContent = String(quantity + 1);
        return;
    }

    if (button.dataset.action === 'decrease') {
        quantityElement.textContent = String(Math.max(1, quantity - 1));
        return;
    }

    const product = {
        id: card.dataset.productId,
        title: card.dataset.title,
        price: Number(card.dataset.price),
        thumbnail: card.dataset.thumbnail,
        quantity,
    };
    const cart = readCart();
    const existingProduct = cart.find((item) => String(item.id) === product.id);

    if (existingProduct) {
        existingProduct.quantity = Number(existingProduct.quantity || 0) + quantity;
    } else {
        cart.push(product);
    }

    if (!writeCart(cart)) {
        alert('Unable to save the product to your cart.');
        return;
    }

    alert(`${product.title} x${quantity} added to cart!`);
    quantityElement.textContent = '1';
});

fetch('https://dummyjson.com/products')
    .then((response) => {
        if (!response.ok) throw new Error('Product request failed');
        return response.json();
    })
    .then((data) => renderProducts(Array.isArray(data.products) ? data.products : []))
    .catch(showLoadError);