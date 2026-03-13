/**
 * Catalog AJAX - Dynamic loading and filtering of analyses
 * Replaces static catalog with AJAX-powered interface
 */

(function() {
  'use strict';

  // State
  let allAnalyses = [];
  let filteredAnalyses = [];
  let currentFilters = {
    category: '',
    duration: '',
    priceMin: null,
    priceMax: null,
    search: ''
  };
  let currentPage = 1;
  const itemsPerPage = 6;

  // DOM elements cache
  let elements = {};

  /**
   * Initialize catalog page
   */
  function initCatalogPage() {
    // Cache DOM elements
    cacheElements();

    // Bind events
    bindEvents();

    // Load initial data
    loadAnalyses();
  }

  /**
   * Cache DOM elements
   */
  function cacheElements() {
    elements = {
      grid: document.querySelector('.analyses-grid'),
      searchInput: document.querySelector('[data-filter="search"]'),
      categorySelect: document.querySelector('[data-filter="category"]'),
      durationSelect: document.querySelector('[data-filter="duration"]'),
      priceMin: document.querySelector('[data-filter="price-min"]'),
      priceMax: document.querySelector('[data-filter="price-max"]'),
      resultsCount: document.querySelector('.results-count'),
      pagination: document.querySelector('.pagination'),
      mobileFilterToggle: document.querySelector('.mobile-filter-toggle'),
      sidebar: document.querySelector('.catalog-sidebar')
    };
  }

  /**
   * Bind event listeners
   */
  function bindEvents() {
    // Search
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Category filter
    if (elements.categorySelect) {
      elements.categorySelect.addEventListener('change', handleCategoryFilter);
    }

    // Duration filter
    if (elements.durationSelect) {
      elements.durationSelect.addEventListener('change', handleDurationFilter);
    }

    // Price filters
    if (elements.priceMin) {
      elements.priceMin.addEventListener('input', debounce(handlePriceFilter, 200));
    }
    if (elements.priceMax) {
      elements.priceMax.addEventListener('input', debounce(handlePriceFilter, 200));
    }

    // Mobile filter toggle
    if (elements.mobileFilterToggle) {
      elements.mobileFilterToggle.addEventListener('click', toggleMobileFilters);
    }

    // Clear filters button
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="clear-filters"]')) {
        clearFilters();
      }
    });
  }

  /**
   * Load analyses from API
   */
  async function loadAnalyses() {
    // Show skeleton loading
    if (window.MedikanaUI && elements.grid) {
      window.MedikanaUI.renderSkeleton(elements.grid, 'card', 6);
    }

    try {
      // Check if API exists
      if (!window.MedikanaAPI) {
        console.error('[Catalog] MedikanaAPI not found, using fallback data');
        loadFallbackData();
        return;
      }
      
      const response = await window.MedikanaAPI.get('analyses.json');
      console.log('[Catalog] API response:', response);

      if (response.success && response.data) {
        allAnalyses = response.data.analyses || [];
        filteredAnalyses = [...allAnalyses];
        
        // Update category filter options
        updateCategoryOptions(response.data.categories || []);
        
        // Render
        renderAnalyses();
        updateResultsCount();
      } else {
        console.error('[Catalog] API returned no data:', response);
        showError('Не удалось загрузить список анализов');
      }
    } catch (error) {
      console.error('Error loading analyses:', error);
      showError('Ошибка загрузки данных: ' + error.message);
    }
  }
  
  /**
   * Load fallback data when API fails
   */
  function loadFallbackData() {
    // Inline data for when API is not available
    const fallbackData = {
      analyses: [
        { id: "A-001", code: "CBC", name: "Общий анализ крови", category: "gematology", price: 1500, old_price: 1800, duration: "1-2 часа", duration_hours: 2, description: "Полная картина крови: лейкоциты, эритроциты, гемоглобин, тромбоциты, СОЭ", is_popular: true, is_available_home: true },
        { id: "A-002", code: "VIT-D", name: "Витамин D", category: "vitamins", price: 3200, duration: "1 день", duration_hours: 24, description: "Определение уровня витамина D в организме", is_popular: true, is_available_home: false },
        { id: "A-003", code: "FERR", name: "Ферритин", category: "vitamins", price: 2800, duration: "1 день", duration_hours: 24, description: "Оценка запасов железа в организме", is_popular: true, is_available_home: false },
        { id: "A-004", code: "TSH", name: "ТТГ (тиреотропный гормон)", category: "hormones", price: 1900, duration: "1 день", duration_hours: 24, description: "Основной тест для оценки функции щитовидной железы", is_popular: true, is_available_home: false },
        { id: "A-005", code: "GLUC", name: "Глюкоза", category: "biochemistry", price: 650, duration: "1-2 часа", duration_hours: 2, description: "Определение уровня сахара в крови", is_popular: false, is_available_home: true },
        { id: "A-006", code: "UA", name: "Общий анализ мочи", category: "urine", price: 1200, duration: "1-2 часа", duration_hours: 2, description: "Комплексная оценка состояния мочевыделительной системы", is_popular: false, is_available_home: true }
      ],
      categories: [
        { code: "all", name: "Все анализы", count: 6 },
        { code: "gematology", name: "Гематология", count: 1 },
        { code: "biochemistry", name: "Биохимия", count: 1 },
        { code: "hormones", name: "Гормоны", count: 1 },
        { code: "vitamins", name: "Витамины", count: 2 },
        { code: "urine", name: "Анализы мочи", count: 1 }
      ]
    };
    
    allAnalyses = fallbackData.analyses;
    filteredAnalyses = [...allAnalyses];
    updateCategoryOptions(fallbackData.categories);
    renderAnalyses();
    updateResultsCount();
    console.log('[Catalog] Loaded fallback data:', allAnalyses.length, 'analyses');
  }

  /**
   * Update category select options
   */
  function updateCategoryOptions(categories) {
    const select = elements.categorySelect;
    if (!select) return;

    if (!select.options) return;

    // Keep first option if exists
    const firstOption = select.options[0] ? select.options[0].cloneNode(true) : null;
    select.innerHTML = '';
    
    if (firstOption) {
      select.appendChild(firstOption);
    } else {
      // Create default option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Все категории';
      select.appendChild(defaultOption);
    }

    categories.forEach(cat => {
      if (cat.code === 'all') return;
      const option = document.createElement('option');
      option.value = cat.code;
      option.textContent = `${cat.name} (${cat.count})`;
      select.appendChild(option);
    });
  }

  /**
   * Render analyses grid
   */
  function renderAnalyses() {
    if (!elements.grid) return;

    // Clear skeleton
    window.MedikanaUI?.clearContainer(elements.grid);

    // Pagination
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredAnalyses.slice(start, end);

    if (pageItems.length === 0) {
      renderEmptyState();
      return;
    }

    // Render cards
    const html = pageItems.map(analysis => renderAnalysisCard(analysis)).join('');
    elements.grid.innerHTML = html;

    // Render pagination
    renderPagination();
  }

  /**
   * Render single analysis card
   */
  function renderAnalysisCard(analysis) {
    const priceText = `${Number(analysis.price || 0).toLocaleString()} ₽`;
    const durationText = analysis.duration ? String(analysis.duration) : '';
    const category = analysis.category || '';

    return `
      <div class="analysis-card" data-id="${analysis.id}" data-category="${category}">
        <div class="analysis-card__image">
          <img src="assets/images/analyses/blood-test.svg" alt="${analysis.name}">
        </div>
        <div class="analysis-card__body">
          <span class="analysis-card__code">${analysis.code || ''}</span>
          <h3 class="analysis-card__title">
            <a href="analysis-detail.html?id=${analysis.id}" style="color: inherit; text-decoration: none;">${analysis.name}</a>
          </h3>
          <p class="analysis-card__text">${analysis.description || ''}</p>
          <div class="analysis-card__meta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <span>${durationText ? `Срок: ${durationText}` : ''}</span>
          </div>
          <div class="analysis-card__footer">
            <div class="analysis-card__price">${priceText}</div>
            <button class="btn btn-primary" data-action="add-to-cart" data-analysis-id="${analysis.id}">Заказать</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render empty state
   */
  function renderEmptyState() {
    if (!elements.grid) return;
    
    elements.grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" style="margin-bottom: 20px;">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <h3 style="font-size: 20px; margin-bottom: 10px; color: #374151;">Анализы не найдены</h3>
        <p style="color: #6b7280; margin-bottom: 20px;">Попробуйте изменить фильтры или сбросить поиск</p>
        <button class="btn btn-outline" data-action="clear-filters">Сбросить фильтры</button>
      </div>
    `;

    if (elements.pagination) {
      elements.pagination.innerHTML = '';
    }
  }

  /**
   * Render pagination
   */
  function renderPagination() {
    if (!elements.pagination) return;

    const totalPages = Math.ceil(filteredAnalyses.length / itemsPerPage);
    if (totalPages <= 1) {
      elements.pagination.innerHTML = '';
      return;
    }

    let html = '';
    
    // Previous
    html += `<button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                       data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>←</button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                         data-page="${i}">${i}</button>`;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        html += `<span class="pagination-ellipsis">...</span>`;
      }
    }

    // Next
    html += `<button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                     data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>→</button>`;

    elements.pagination.innerHTML = html;

    // Bind pagination clicks
    elements.pagination.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (page && page !== currentPage) {
          currentPage = page;
          renderAnalyses();
          scrollToGrid();
        }
      });
    });
  }

  /**
   * Update results count display
   */
  function updateResultsCount() {
    if (!elements.resultsCount) return;
    
    const total = allAnalyses.length;
    const filtered = filteredAnalyses.length;
    
    elements.resultsCount.innerHTML = `Найдено: <span>${filtered}</span> из ${total}`;
  }

  /**
   * Apply all filters
   */
  function applyFilters() {
    filteredAnalyses = allAnalyses.filter(analysis => {
      // Category filter
      if (currentFilters.category && analysis.category !== currentFilters.category) {
        return false;
      }

      // Duration filter
      if (currentFilters.duration) {
        if (currentFilters.duration === 'fast' && analysis.duration_hours > 2) {
          return false;
        }
        if (currentFilters.duration === 'day' && analysis.duration_hours > 24) {
          return false;
        }
      }

      // Price filters
      if (currentFilters.priceMin && analysis.price < parseInt(currentFilters.priceMin)) {
        return false;
      }
      if (currentFilters.priceMax && analysis.price > parseInt(currentFilters.priceMax)) {
        return false;
      }

      // Search filter
      if (currentFilters.search) {
        const searchLower = currentFilters.search.toLowerCase();
        const matches = 
          analysis.name.toLowerCase().includes(searchLower) ||
          analysis.code.toLowerCase().includes(searchLower) ||
          analysis.description.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }

      return true;
    });

    // Reset to first page
    currentPage = 1;

    // Update UI
    renderAnalyses();
    updateResultsCount();
  }

  /**
   * Handle search input
   */
  function handleSearch(e) {
    currentFilters.search = e.target.value.trim();
    applyFilters();
  }

  /**
   * Handle category filter
   */
  function handleCategoryFilter(e) {
    currentFilters.category = e.target.value;
    applyFilters();
  }

  /**
   * Handle duration filter
   */
  function handleDurationFilter(e) {
    currentFilters.duration = e.target.value;
    applyFilters();
  }

  /**
   * Handle price filter
   */
  function handlePriceFilter() {
    currentFilters.priceMin = elements.priceMin?.value || null;
    currentFilters.priceMax = elements.priceMax?.value || null;
    applyFilters();
  }

  /**
   * Clear all filters
   */
  function clearFilters() {
    currentFilters = {
      category: '',
      duration: '',
      priceMin: null,
      priceMax: null,
      search: ''
    };
    currentPage = 1;

    // Reset UI controls
    if (elements.categorySelect) elements.categorySelect.value = '';
    if (elements.durationSelect) elements.durationSelect.value = '';
    if (elements.priceMin) elements.priceMin.value = '';
    if (elements.priceMax) elements.priceMax.value = '';
    if (elements.searchInput) elements.searchInput.value = '';

    // Reset to all analyses
    filteredAnalyses = [...allAnalyses];
    renderAnalyses();
    updateResultsCount();
  }

  /**
   * Toggle mobile filters visibility
   */
  function toggleMobileFilters() {
    elements.sidebar?.classList.toggle('mobile-open');
  }

  /**
   * Scroll to grid
   */
  function scrollToGrid() {
    elements.grid?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Show error message
   */
  function showError(message) {
    if (window.MedikanaAPI && window.MedikanaAPI.showNotification) {
      window.MedikanaAPI.showNotification(message, 'error');
    } else if (window.MedikanaUI && window.MedikanaUI.showNotification) {
      window.MedikanaUI.showNotification(message, 'error');
    } else {
      alert(message);
    }
  }

  /**
   * Debounce helper
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

  // ============================================
  // Initialize on DOM ready - ALWAYS run on catalog pages
  // ============================================

  function initIfCatalog() {
    const path = window.location.pathname;
    const hasCatalogGrid = document.querySelector('.analyses-grid');
    const hasCatalogAttr = document.querySelector('[data-page="catalog"]');
    const isCatalogPath = path.toLowerCase().includes('catalog');
    
    if (isCatalogPath || hasCatalogGrid || hasCatalogAttr) {
      console.log('[Catalog] Initializing catalog page...');
      initCatalogPage();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIfCatalog);
  } else {
    initIfCatalog();
  }

  // ============================================
  // Export module
  // ============================================

  window.MedikanaCatalog = {
    init: initCatalogPage,
    loadAnalyses,
    applyFilters,
    clearFilters,
    getAnalyses: () => filteredAnalyses
  };

})();
