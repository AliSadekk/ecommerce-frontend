const SHIP_COST = 50;
const PROD = 'home.html';
const CONF_PAGE = 'confirmation.html';
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51UIhsdCu6TWJ7idbtZ4aK56H9F5PNtccT98wb23YdmEvzToQ6S7z4KOrJ9WK8k1AsF29HwY3YK4BpQgYD0LCm3tu00GJIJ2wrq';
const CARD_PAYMENTS_ENABLED = true;
const rules = {
  fullName: value => value.trim().length >= 2,
  phone: value => value.trim().length >= 7,
  address: value => value.trim().length >= 5,
  city: value => value.trim().length >= 2,
};

let cart = [];
let stripe = null;
let cardElement = null;

function normalizeProduct(item) {
  const rawPrice = typeof item.price === 'string'
    ? item.price.replace(/[^\d.-]/g, '')
    : item.price;

  return {
    id: item.id || item.title || item.name,
    title: item.title || item.name || 'Product',
    price: Number(rawPrice) || 0,
    thumbnail: item.thumbnail || item.image || '',
    quantity: Math.max(1, Number(item.quantity) || 1),
  };
}

function loadCart() {
  let raw = null;
  try {
    raw = localStorage.getItem('cart');
  } catch (e) {
    raw = null;
  }

  try {
    cart = raw ? JSON.parse(raw) : [];
  } catch (e) {
    cart = [];
  }

  if (!Array.isArray(cart) || cart.length === 0) {
    window.location.href = PROD;
    return false;
  }
  cart = cart.map(normalizeProduct);
  return true;
}

function renderSummary() {
  const itemsEl = document.getElementById('summary-items');
  itemsEl.textContent = '';

  let subtotal = 0;

  cart.forEach(item => {
    const product = normalizeProduct(item);
    const qty = product.quantity;
    const price = product.price;
    subtotal += price * qty;

    const row = document.createElement('div');
    row.className = 'summary-item';
    const image = document.createElement('img');
    image.src = product.thumbnail;
    image.alt = product.title;
    image.addEventListener('error', () => image.remove());

    const info = document.createElement('div');
    info.className = 'info';
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = product.title;
    const quantity = document.createElement('div');
    quantity.className = 'qty';
    quantity.textContent = `Qty: ${qty}`;
    info.append(title, quantity);

    const itemPrice = document.createElement('div');
    itemPrice.className = 'price';
    itemPrice.textContent = `$${(price * qty).toFixed(2)}`;
    row.append(image, info, itemPrice);
    itemsEl.appendChild(row);
  });

  const total = subtotal + SHIP_COST;

  document.getElementById('sum-subtotal').textContent = '$' + subtotal.toFixed(2);
  document.getElementById('sum-shipping').textContent = '$' + SHIP_COST.toFixed(2);
  document.getElementById('sum-total').textContent = '$' + total.toFixed(2);

  return { subtotal, shipping: SHIP_COST, total };
}

function validateForm() {
  let valid = true;
  Object.keys(rules).forEach(name => {
    const input = document.getElementById(name);
    const fieldWrap = document.getElementById('field-' + name);
    const ok = rules[name](input.value);

    input.classList.toggle('invalid', !ok);
    fieldWrap.classList.toggle('has-error', !ok);
    if (!ok) valid = false;
  });

  return valid;
}

function getShippingData() {
  return {
    fullName: document.getElementById('fullName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    address: document.getElementById('address').value.trim(),
    city: document.getElementById('city').value.trim(),
    paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
  };
}

function setupPaymentToggle() {
  const options = document.querySelectorAll('.pay-option');
  const cardFields = document.getElementById('card-fields');

  options.forEach(opt => {
    opt.addEventListener('click', (event) => {
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      opt.querySelector('input').checked = true;

      const isCard = opt.dataset.method === 'card';

      if (isCard && !initStripe()) {
        event.preventDefault();
        const cashOption = document.querySelector('[data-method="cash"]');
        cashOption.querySelector('input').checked = true;
        options.forEach(o => o.classList.toggle('selected', o === cashOption));
        cardFields.classList.remove('visible');
        return;
      }

      cardFields.classList.toggle('visible', isCard);
      if (!isCard) clearFormError();
    });
  });
}

function initStripe() {
  if (stripe && cardElement) return true;

  if (!CARD_PAYMENTS_ENABLED || !STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.includes('REPLACE_WITH')) {
    showFormError('Please add your Stripe API key before using card payment.');
    return false;
  }

  if (typeof Stripe === 'undefined') {
    showFormError('Could not load the payment gateway, please try again.');
    return false;
  }

  try {
    stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
    const elements = stripe.elements();
    cardElement = elements.create('card', {
      style: {
        base: {
          fontFamily: 'Arial, sans-serif',
          fontSize: '15px',
          color: '#333333',
        },
      },
    });
    cardElement.mount('#card-element');
    return true;
  } catch (error) {
    stripe = null;
    cardElement = null;
    showFormError('Could not load the card payment field. Check your Stripe API key.');
    return false;
  }
}

function showFormError(msg) {
  const el = document.getElementById('form-error');
  el.textContent = msg;
  el.classList.add('visible');
}

function clearFormError() {
  const el = document.getElementById('form-error');
  el.classList.remove('visible');
  el.textContent = '';
}

function setSubmitting(isSubmitting) {
  const btn = document.getElementById('submit-btn');
  btn.disabled = isSubmitting;
  btn.textContent = isSubmitting ? 'Placing order...' : 'Place order';
}

async function handleSubmit(e) {
  e.preventDefault();
  clearFormError();

  if (!validateForm()) {
    showFormError('Please check the required shipping details.');
    return;
  }

  const shipping = getShippingData();
  const totals = renderSummary();

  try {
    localStorage.setItem('checkoutInfo', JSON.stringify(shipping));
  } catch (e) {}

  setSubmitting(true);

  try {
    if (shipping.paymentMethod === 'card') {
      await handleCardPayment();
    }
    completeOrder(shipping, totals);
  } catch (err) {
    showFormError(err.message || 'Something went wrong while processing payment. Please try again.');
    setSubmitting(false);
  }
}

async function handleCardPayment() {
  if (!CARD_PAYMENTS_ENABLED) {
    throw new Error('Card payments are unavailable until a secure payment server is configured.');
  }

  if (!stripe || !cardElement) {
    throw new Error('Please enter your card details.');
  }

  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardElement,
  });

  if (error) {
    throw new Error(error.message || 'Invalid card details.');
  }

  return paymentMethod;
}

function completeOrder(shipping, totals) {
  const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

  const order = {
    orderNumber,
    items: cart,
    shipping,
    totals,
    date: new Date().toISOString(),
  };

  try {
    localStorage.setItem('lastOrder', JSON.stringify(order));
    localStorage.removeItem('cart');
  } catch (e) {
    throw new Error('Unable to save your order. Please try again.');
  }

  window.location.href = CONF_PAGE;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!loadCart()) return;

  renderSummary();
  setupPaymentToggle();

  document.getElementById('checkout-form').addEventListener('submit', handleSubmit);
});
