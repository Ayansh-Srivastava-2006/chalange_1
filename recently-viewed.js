const recentList = document.querySelector('#recently-viewed');
const clearHistoryButton = document.querySelector('#clear-history');
const productModal = document.querySelector('#product-modal');
const modalBrand = document.querySelector('#modal-brand');
const modalTitle = document.querySelector('#modal-title');
const modalContent = document.querySelector('#modal-content');
const closeModalButton = document.querySelector('#close-modal');
const historyLimit = 6;
const historyStorageKey = 'ecart-recently-viewed';
const storedHistory = JSON.parse(localStorage.getItem(historyStorageKey) || '[]');
const recentProductIds = new Set(storedHistory);
let recentlyViewed = storedHistory
  .map((id) => products.find((product) => product.id === id))
  .filter(Boolean);

function saveHistory() {
  localStorage.setItem(historyStorageKey, JSON.stringify(recentlyViewed.map((product) => product.id)));
}

function createRecentCard(product) {
  return `
    <button class="recent-card" type="button" data-product-id="${product.id}">
      <span class="recent-icon" aria-hidden="true">${product.brand.charAt(0)}</span>
      <span>
        <strong>${product.name}</strong>
        <small>${formatPrice(product.price)}</small>
      </span>
      <span class="recent-arrow" aria-hidden="true">↗</span>
    </button>`;
}

function renderRecentlyViewed() {
  clearHistoryButton.hidden = recentlyViewed.length === 0;
  if (!recentlyViewed.length) {
    recentList.innerHTML = '<div class="empty-state">Products you open will appear here for quick access.</div>';
    return;
  }
  recentList.innerHTML = recentlyViewed.map(createRecentCard).join('');
}

function addToHistory(product) {
  if (recentProductIds.has(product.id)) {
    recentlyViewed = recentlyViewed.filter((item) => item.id !== product.id);
  }
  recentlyViewed.unshift(product);
  recentlyViewed = recentlyViewed.slice(0, historyLimit);
  recentProductIds.clear();
  recentlyViewed.forEach((item) => recentProductIds.add(item.id));
  saveHistory();
  renderRecentlyViewed();
}

function formatSpecificationName(name) {
  return name
    .replace(/[A-Z]/g, (letter) => ` ${letter}`)
    .replace(/^./, (letter) => letter.toUpperCase());
}

function createSpecifications(specifications) {
  return Object.entries(specifications).map(([name, value]) => `
    <div>
      <dt>${formatSpecificationName(name)}</dt>
      <dd>${value}</dd>
    </div>`).join('');
}

function showProduct(product) {
  addToHistory(product);
  modalBrand.textContent = `${product.brand} / ${product.category}`;
  modalTitle.textContent = product.name;
  modalContent.innerHTML = `
    <div class="modal-summary">
      <div class="modal-icon" aria-hidden="true">${product.brand.charAt(0)}</div>
      <div>
        <strong class="modal-price">${formatPrice(product.price)}</strong>
        <span class="rating">★ ${product.rating} <small>(${product.reviews.toLocaleString('en-IN')})</small></span>
      </div>
    </div>
    <p class="modal-copy">${product.stock ? `${product.stock} units currently available.` : 'Currently out of stock.'}</p>
    <dl class="spec-list">${createSpecifications(product.specifications)}</dl>`;
  productModal.showModal();
}

function findProduct(button) {
  const productId = button.dataset.productId;
  const productName = button.dataset.product;
  return products.find((product) => product.id === productId || product.name === productName);
}

function handleProductClick(event) {
  const button = event.target.closest('[data-product], [data-product-id]');
  if (!button) return;
  const product = findProduct(button);
  if (product) showProduct(product);
}

function clearHistory() {
  recentlyViewed = [];
  recentProductIds.clear();
  saveHistory();
  renderRecentlyViewed();
}

document.querySelector('#product-grid').addEventListener('click', handleProductClick);
recentList.addEventListener('click', handleProductClick);
clearHistoryButton.addEventListener('click', clearHistory);
closeModalButton.addEventListener('click', () => productModal.close());
productModal.addEventListener('click', (event) => {
  if (event.target === productModal) productModal.close();
});

renderRecentlyViewed();