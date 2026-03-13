/**
 * Catalog Filters and Search Module
 * Handles filtering by category, timeframe, price, and search functionality
 */

(function() {
  'use strict';

  // DOM Elements
  const searchInput = document.querySelector('.catalog-search-input');
  const searchButton = document.querySelector('.catalog-search .btn');
  const categoryCheckboxes = document.querySelectorAll('input[data-filter="category"]');
  const timeframeCheckboxes = document.querySelectorAll('input[data-filter="timeframe"]');
  const priceOptions = document.querySelectorAll('.filter-price-option');
  const analysisCards = document.querySelectorAll('.analysis-card');
  const resultsCount = document.querySelector('.catalog-results-count span');
  const resetButton = document.querySelector('.filter-reset');
  const mobileFilterToggle = document.querySelector('.catalog-mobile-filters .btn');
  const sidebar = document.querySelector('.catalog-sidebar');
  const sidebarClose = document.querySelector('.sidebar-close');

  // Active filters state
  let activeFilters = {
    search: '',
    categories: [],
    timeframes: [],
    priceRange: null
  };

  /**
   * Initialize the filters module
   */
  function init() {
    bindEvents();
    updateResultsCount();
  }

  /**
   * Bind all event listeners
   */
  function bindEvents() {
    // Search events
    if (searchInput) {
      searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    if (searchButton) {
      searchButton.addEventListener('click', handleSearch);
    }

    // Category filter events
    categoryCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', handleCategoryFilter);
    });

    // Timeframe filter events
    timeframeCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', handleTimeframeFilter);
    });

    // Price filter events
    priceOptions.forEach(option => {
      option.addEventListener('click', handlePriceFilter);
    });

    // Reset button
    if (resetButton) {
      resetButton.addEventListener('click', resetFilters);
    }

    // Mobile filter toggle
    if (mobileFilterToggle) {
      mobileFilterToggle.addEventListener('click', toggleMobileSidebar);
    }

    if (sidebarClose) {
      sidebarClose.addEventListener('click', closeMobileSidebar);
    }

    // Close sidebar on overlay click
    document.addEventListener('click', function(e) {
      if (sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !mobileFilterToggle.contains(e.target)) {
          closeMobileSidebar();
        }
      }
    });

    // Enter key on search
    if (searchInput) {
      searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          handleSearch();
        }
      });
    }
  }

  /**
   * Handle search input
   */
  function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();
    activeFilters.search = query;
    applyFilters();
  }

  /**
   * Handle category checkbox change
   */
  function handleCategoryFilter() {
    activeFilters.categories = Array.from(categoryCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    applyFilters();
  }

  /**
   * Handle timeframe checkbox change
   */
  function handleTimeframeFilter() {
    activeFilters.timeframes = Array.from(timeframeCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    applyFilters();
  }

  /**
   * Handle price filter selection
   */
  function handlePriceFilter(e) {
    const option = e.target.closest('.filter-price-option');
    if (!option) return;

    // Remove active class from all options
    priceOptions.forEach(opt => opt.classList.remove('active'));

    // Toggle active state
    if (activeFilters.priceRange === option.dataset.price) {
      activeFilters.priceRange = null;
    } else {
      option.classList.add('active');
      activeFilters.priceRange = option.dataset.price;
    }

    applyFilters();
  }

  /**
   * Apply all active filters to the cards
   */
  function applyFilters() {
    let visibleCount = 0;

    analysisCards.forEach(card => {
      const shouldShow = checkCardAgainstFilters(card);

      if (shouldShow) {
        card.classList.remove('hidden');
        visibleCount++;
      } else {
        card.classList.add('hidden');
      }
    });

    updateResultsCount(visibleCount);
    toggleNoResultsMessage(visibleCount);
  }

  /**
   * Check if a card matches all active filters
   */
  function checkCardAgainstFilters(card) {
    const title = card.querySelector('.analysis-card__title').textContent.toLowerCase();
    const code = card.querySelector('.analysis-card__code').textContent.toLowerCase();
    const description = card.querySelector('.analysis-card__text').textContent.toLowerCase();
    const category = card.dataset.category;
    const timeframe = card.dataset.timeframe;
    const price = parseInt(card.dataset.price, 10);

    // Search filter
    if (activeFilters.search) {
      const searchMatch = title.includes(activeFilters.search) ||
                         code.includes(activeFilters.search) ||
                         description.includes(activeFilters.search);
      if (!searchMatch) return false;
    }

    // Category filter
    if (activeFilters.categories.length > 0) {
      if (!activeFilters.categories.includes(category)) return false;
    }

    // Timeframe filter
    if (activeFilters.timeframes.length > 0) {
      if (!activeFilters.timeframes.includes(timeframe)) return false;
    }

    // Price filter
    if (activeFilters.priceRange) {
      if (!checkPriceRange(price, activeFilters.priceRange)) return false;
    }

    return true;
  }

  /**
   * Check if price matches the selected range
   */
  function checkPriceRange(price, range) {
    switch (range) {
      case 'under-500':
        return price < 500;
      case '500-1000':
        return price >= 500 && price <= 1000;
      case 'over-1000':
        return price > 1000;
      default:
        return true;
    }
  }

  /**
   * Update the results count display
   */
  function updateResultsCount(count) {
    if (!resultsCount) return;

    const total = analysisCards.length;
    const visible = count !== undefined ? count : total;

    resultsCount.textContent = visible;
  }

  /**
   * Show/hide no results message
   */
  function toggleNoResultsMessage(visibleCount) {
    const noResultsEl = document.querySelector('.catalog-no-results');
    const grid = document.querySelector('.analyses-grid');

    if (visibleCount === 0) {
      if (!noResultsEl) {
        const noResultsHTML = `
          <div class="catalog-no-results">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <h3>Ничего не найдено</h3>
            <p>Попробуйте изменить параметры поиска или фильтры</p>
            <button class="btn btn-outline filter-reset">Сбросить фильтры</button>
          </div>
        `;
        grid.insertAdjacentHTML('afterend', noResultsHTML);

        // Bind reset button in no results message
        document.querySelector('.catalog-no-results .filter-reset').addEventListener('click', resetFilters);
      }
      grid.style.display = 'none';
    } else {
      if (noResultsEl) {
        noResultsEl.remove();
      }
      grid.style.display = 'grid';
    }
  }

  /**
   * Reset all filters
   */
  function resetFilters() {
    // Reset search
    if (searchInput) {
      searchInput.value = '';
    }
    activeFilters.search = '';

    // Reset category checkboxes
    categoryCheckboxes.forEach(cb => cb.checked = false);
    activeFilters.categories = [];

    // Reset timeframe checkboxes
    timeframeCheckboxes.forEach(cb => cb.checked = false);
    activeFilters.timeframes = [];

    // Reset price options
    priceOptions.forEach(opt => opt.classList.remove('active'));
    activeFilters.priceRange = null;

    applyFilters();
  }

  /**
   * Toggle mobile sidebar
   */
  function toggleMobileSidebar() {
    if (sidebar) {
      sidebar.classList.add('open');
      document.body.style.overflow = 'hidden';

      // Create overlay if doesn't exist
      let overlay = document.querySelector('.catalog-sidebar-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'catalog-sidebar-overlay';
        document.body.appendChild(overlay);
      }
      overlay.classList.add('active');
    }
  }

  /**
   * Close mobile sidebar
   */
  function closeMobileSidebar() {
    if (sidebar) {
      sidebar.classList.remove('open');
      document.body.style.overflow = '';

      const overlay = document.querySelector('.catalog-sidebar-overlay');
      if (overlay) {
        overlay.classList.remove('active');
      }
    }
  }

  /**
   * Debounce function for search input
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
