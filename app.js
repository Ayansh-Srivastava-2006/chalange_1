function flattenProducts(store) {
  return store.categories.flatMap((category) => category.subcategories.flatMap((subcategory) => subcategory.products));
}

const products = flattenProducts(storeData).sort((a, b) => a.price - b.price);

const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`;
const grid = document.querySelector('#product-grid');
const resultsMeta = document.querySelector('#results-meta');
const message = document.querySelector('#form-message');
document.querySelector('#catalog-count').textContent = products.length;

function lowerBound(target) {
  let low = 0;
  let high = products.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (products[middle].price < target) low = middle + 1;
    else high = middle;
  }
  return low;
}

function upperBound(target) {
  let low = 0;
  let high = products.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (products[middle].price <= target) low = middle + 1;
    else high = middle;
  }
  return low;
}

function renderProducts(matches, meta) {
  resultsMeta.textContent = meta;
  if (!matches.length) {
    grid.innerHTML = '<div class="empty-state">No products match that range. Try widening your budget.</div>';
    return;
  }
  grid.innerHTML = matches.map((product) => `
    <article class="product-card">
      <div class="product-top"><span>${product.brand}</span><span>${product.stock ? 'In stock' : 'Out of stock'}</span></div>
      <div class="product-icon" aria-hidden="true">${product.brand.charAt(0)}</div>
      <h3>${product.name}</h3>
      <p class="category-label">${product.category} / ${product.subcategory}</p>
      <div class="product-detail"><strong class="product-price">${formatPrice(product.price)}</strong><span class="rating">★ ${product.rating} <small>(${product.reviews.toLocaleString('en-IN')})</small></span></div>
      <button class="view-button" type="button" data-product="${product.name}">View product <span aria-hidden="true">↗</span></button>
    </article>`).join('');
}

function showError(text) { message.textContent = text; }
function clearError() { message.textContent = ''; }

function findClosest(target) {
  const insertionPoint = lowerBound(target);
  const candidates = products.slice(Math.max(0, insertionPoint - 2), insertionPoint + 3);
  return candidates.sort((a, b) => Math.abs(a.price - target) - Math.abs(b.price - target)).slice(0, 3);
}

document.querySelector('#finder-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const target = Number(document.querySelector('#target-price').value);
  if (!target || target < 1) { showError('Enter a target price greater than ₹0.'); return; }
  clearError();
  renderProducts(findClosest(target), `Nearest to ${formatPrice(target)}`);
});

document.querySelector('#range-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const minimum = Number(document.querySelector('#min-price').value);
  const maximum = Number(document.querySelector('#max-price').value);
  if (!minimum || !maximum || minimum < 1 || maximum < minimum) { showError('Enter a valid minimum and maximum price.'); return; }
  clearError();
  const start = lowerBound(minimum);
  const end = upperBound(maximum);
  const matches = products.slice(start, end);
  renderProducts(matches, `${matches.length} product${matches.length === 1 ? '' : 's'} from ${formatPrice(minimum)} to ${formatPrice(maximum)}`);
});

renderProducts(findClosest(70000), 'Nearest to ₹70,000');
