const cartContainer = document.getElementById("cart-container");
const cartTotalContainer = document.getElementById("cart-total-container");
const cartTotalElement = document.getElementById("cart-total");

function renderCart() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    
    cartContainer.innerHTML = "";

    if (cart.length === 0) {
        cartContainer.innerHTML = "<p class='empty-cart'>Your cart is currently empty.</p>";
        cartTotalContainer.style.display = "none";
        return;
    }

    let total = 0;

    cart.forEach((product, index) => {
        const priceNumber = parseFloat(product.price.replace('$', ''));
        total += (priceNumber * product.quantity);

        const card = document.createElement("div");
        card.className = "product-card";

        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h2>${product.name}</h2>
            <p class="price">${product.price}</p>
            
            <div class="product-actions">
                <div class="quantity-control">
                    <button class="minus-btn" data-index="${index}">−</button>
                    <span class="quantity">${product.quantity}</span>
                    <button class="plus-btn" data-index="${index}">+</button>
                </div>
                <button class="remove-btn" data-index="${index}">Remove</button>
            </div>
        `;

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
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    
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

    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
}

function removeProduct(index) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
}

renderCart();