const productSearchInput = document.querySelector('#product-search');
const searchSuggestions = document.querySelector('#search-suggestions');
const searchIndex = new Map();
const searchResultsLimit = 6;
let activeSuggestionIndex = -1;

function normalizeSearchText(value) {
  return String(value).toLocaleLowerCase().trim();
}

function addToSearchIndex(value, product) {
  const normalizedValue = normalizeSearchText(value);
  if (!normalizedValue) return;
  for (let index = 1; index <= normalizedValue.length; index += 1) {
    const prefix = normalizedValue.slice(0, index);
    if (!searchIndex.has(prefix)) searchIndex.set(prefix, new Set());
    searchIndex.get(prefix).add(product);
  }
}

products.forEach((product) => {
  [product.name, product.brand, ...(product.tags || [])].forEach((value) => addToSearchIndex(value, product));
});

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function highlightMatch(value, query) {
  const safeValue = escapeHtml(value);
  const safeQuery = escapeHtml(query);
  if (!safeQuery) return safeValue;
  return safeValue.replace(new RegExp(`(${safeQuery})`, 'ig'), '<mark>$1</mark>');
}

function setSearchState(isOpen) {
  searchSuggestions.hidden = !isOpen;
  productSearchInput.setAttribute('aria-expanded', String(isOpen));
}

function searchProducts(query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];
  return [...(searchIndex.get(normalizedQuery) || [])]
    .sort((first, second) => first.name.localeCompare(second.name))
    .slice(0, searchResultsLimit);
}

function renderSearchSuggestions(query) {
  const matches = searchProducts(query);
  activeSuggestionIndex = -1;
  if (!query.trim()) {
    setSearchState(false);
    return;
  }
  if (!matches.length) {
    searchSuggestions.innerHTML = '<p class="search-empty">No products found. Try another search.</p>';
    setSearchState(true);
    return;
  }
  searchSuggestions.innerHTML = matches.map((product, index) => `
    <button class="suggestion-item" type="button" role="option" aria-selected="false" data-product-id="${product.id}" data-index="${index}">
      <span class="suggestion-icon" aria-hidden="true">${escapeHtml(product.brand.charAt(0))}</span>
      <span class="suggestion-copy"><strong>${highlightMatch(product.name, query)}</strong><small>${escapeHtml(product.brand)}</small></span>
      <span class="suggestion-arrow" aria-hidden="true">↗</span>
    </button>`).join('');
  setSearchState(true);
}

function updateActiveSuggestion(nextIndex) {
  const suggestionItems = [...searchSuggestions.querySelectorAll('.suggestion-item')];
  if (!suggestionItems.length) return;
  activeSuggestionIndex = (nextIndex + suggestionItems.length) % suggestionItems.length;
  suggestionItems.forEach((item, index) => {
    const isActive = index === activeSuggestionIndex;
    item.classList.toggle('is-active', isActive);
    item.setAttribute('aria-selected', String(isActive));
  });
}

function chooseSuggestion(button) {
  const product = products.find((item) => item.id === button.dataset.productId);
  if (!product) return;
  productSearchInput.value = product.name;
  setSearchState(false);
  productSearchInput.focus();
  showProduct(product);
}

productSearchInput.addEventListener('input', (event) => renderSearchSuggestions(event.target.value));
productSearchInput.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    updateActiveSuggestion(activeSuggestionIndex + 1);
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    updateActiveSuggestion(activeSuggestionIndex - 1);
  }
  if (event.key === 'Enter' && activeSuggestionIndex >= 0) {
    event.preventDefault();
    chooseSuggestion(searchSuggestions.querySelectorAll('.suggestion-item')[activeSuggestionIndex]);
  }
  if (event.key === 'Escape') setSearchState(false);
});

searchSuggestions.addEventListener('click', (event) => {
  const suggestion = event.target.closest('.suggestion-item');
  if (suggestion) chooseSuggestion(suggestion);
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.catalog-search')) setSearchState(false);
});