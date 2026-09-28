function flattenProducts(store) {
  return store.categories.flatMap((category) => category.subcategories.flatMap((subcategory) => subcategory.products));
}

const products = flattenProducts(storeData).sort((a, b) => a.price - b.price);
const inventoryPrefix = products.reduce((totals, product) => {
  totals.push(totals[totals.length - 1] + product.price * product.stock);
  return totals;
}, [0]);

const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`;
const count = document.querySelector('#catalog-count');
const form = document.querySelector('#analytics-form');
const message = document.querySelector('#analytics-message');
const inventoryCount = document.querySelector('#inventory-count');
const inventoryValue = document.querySelector('#inventory-value');
const inventoryMeta = document.querySelector('#inventory-meta');
const inventoryList = document.querySelector('#inventory-list');

count.textContent = products.length;

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

function renderInventory(minimum, maximum) {
  const { matches, value } = getInventoryRange(minimum, maximum);
  inventoryCount.textContent = matches.length;
  inventoryValue.textContent = formatPrice(value);
  inventoryMeta.textContent = `${formatPrice(minimum)} to ${formatPrice(maximum)}`;
  inventoryList.innerHTML = matches.length ? matches.map((product) => `
    <div class="inventory-row">
      <span><strong>${product.name}</strong><small>${product.brand} · ${product.stock} in stock</small></span>
      <strong>${formatPrice(product.price * product.stock)}</strong>
    </div>`).join('') : '<div class="empty-state">No products match that price range.</div>';
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const minimum = Number(document.querySelector('#analytics-min').value);
  const maximum = Number(document.querySelector('#analytics-max').value);
  if (!minimum || !maximum || minimum < 1 || maximum < minimum) {
    message.textContent = 'Enter a valid minimum and maximum price.';
    return;
  }
  message.textContent = '';
  renderInventory(minimum, maximum);
});

renderInventory(5000, 20000);