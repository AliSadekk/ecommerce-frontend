const productCards = document.querySelectorAll(".product-card");

productCards.forEach((card) => {

    const minusButton = card.querySelector(".minus-btn");
    const plusButton = card.querySelector(".plus-btn");
    const quantityElement = card.querySelector(".quantity");
    const addToCartButton = card.querySelector(".add-to-cart");

    let quantity = 1;

    // Increase quantity
    plusButton.addEventListener("click", () => {
        quantity++;
        quantityElement.textContent = quantity;
    });

    // Decrease quantity
    minusButton.addEventListener("click", () => {
        if (quantity > 1) {
            quantity--;
            quantityElement.textContent = quantity;
        }
    });

    // Add product to cart
    addToCartButton.addEventListener("click", () => {

        const product = {
            name: card.querySelector("h2").textContent,
            price: card.querySelector(".price").textContent,
            image: card.querySelector("img").src,
            quantity: quantity
        };

        let cart = JSON.parse(localStorage.getItem("cart")) || [];

        const existingProduct = cart.find(
            item => item.name === product.name
        );

        if (existingProduct) {
            existingProduct.quantity += quantity;
        } else {
            cart.push(product);
        }

        localStorage.setItem("cart", JSON.stringify(cart));

        alert(`${product.name} x${quantity} added to cart!`);

        // Reset quantity
        quantity = 1;
        quantityElement.textContent = quantity;
    });
});