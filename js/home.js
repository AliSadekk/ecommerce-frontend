const cartButtons = document.querySelectorAll(".product-card button");

cartButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const productCard = button.parentElement;

        const product = {
            name: productCard.querySelector("h2").textContent,
            price: productCard.querySelector(".price").textContent,
            image: productCard.querySelector("img").src,
            quantity: 1
        };

        let cart = JSON.parse(localStorage.getItem("cart")) || [];

        const existingProduct = cart.find(item => item.name === product.name);

        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            cart.push(product);
        }

        localStorage.setItem("cart", JSON.stringify(cart));

        alert(`${product.name} added to cart!`);
    });
});