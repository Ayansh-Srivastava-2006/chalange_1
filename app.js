function flattenProducts(store) {
  return store.categories.flatMap((category) => category.subcategories.flatMap((subcategory) => subcategory.products));
}

const products = flattenProducts(storeData).sort((a, b) => a.price - b.price);
const inventoryPrefix = products.reduce((totals, product) => {
  totals.push(totals[totals.length - 1] + product.price * product.stock);
  return totals;
}, [0]);

const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`;
const grid = document.querySelector('#product-grid');
const resultsMeta = document.querySelector('#results-meta');
const message = document.querySelector('#form-message');
const inventoryCount = document.querySelector('#inventory-count');
const inventoryValue = document.querySelector('#inventory-value');
const inventoryList = document.querySelector('#inventory-list');
const inventoryMeta = document.querySelector('#inventory-meta');
const analyticsMessage = document.querySelector('#analytics-message');
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

function getInventoryRange(minimum, maximum) {
  const start = lowerBound(minimum);
  const end = upperBound(maximum);
  return {
    matches: products.slice(start, end),
    value: inventoryPrefix[end] - inventoryPrefix[start]
  };
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
  const matches = getInventoryRange(minimum, maximum).matches;
  renderProducts(matches, `${matches.length} product${matches.length === 1 ? '' : 's'} from ${formatPrice(minimum)} to ${formatPrice(maximum)}`);
});

function renderInventory(matches, value, minimum, maximum) {
  inventoryCount.textContent = matches.length;
  inventoryValue.textContent = formatPrice(value);
  inventoryMeta.textContent = `${formatPrice(minimum)} to ${formatPrice(maximum)}`;
  inventoryList.innerHTML = matches.length ? matches.map((product) => `
    <div class="inventory-row">
      <span><strong>${product.name}</strong><small>${product.brand} · ${product.stock} in stock</small></span>
      <strong>${formatPrice(product.price * product.stock)}</strong>
    </div>`).join('') : '<div class="empty-state">No products match that price range.</div>';
}

document.querySelector('#analytics-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const minimum = Number(document.querySelector('#analytics-min').value);
  const maximum = Number(document.querySelector('#analytics-max').value);
  if (!minimum || !maximum || minimum < 1 || maximum < minimum) {
    analyticsMessage.textContent = 'Enter a valid minimum and maximum price.';
    return;
  }
  analyticsMessage.textContent = '';
  const { matches, value } = getInventoryRange(minimum, maximum);
  renderInventory(matches, value, minimum, maximum);
});

renderProducts(findClosest(70000), 'Nearest to ₹70,000');
const initialInventory = getInventoryRange(5000, 20000);
renderInventory(initialInventory.matches, initialInventory.value, 5000, 20000);
