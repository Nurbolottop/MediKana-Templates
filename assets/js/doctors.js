/**
 * Doctors Page JavaScript
 * Handles filtering by specialty, branch, type (adult/child), and search by name
 */

(function() {
  'use strict';

  // DOM Elements
  const specialtySelect = document.querySelector('[data-filter="specialty"]');
  const branchSelect = document.querySelector('[data-filter="branch"]');
  const typeSelect = document.querySelector('[data-filter="type"]');
  const dateSelect = document.querySelector('[data-filter="date"]');
  const searchInput = document.querySelector('[data-filter="search"]');
  const doctorCards = document.querySelectorAll('.doctor-card');
  const resultsCount = document.querySelector('.doctors-results-count span');
  const mobileFilterToggle = document.querySelector('.doctors-filters__mobile-toggle .btn');
  const filtersGrid = document.querySelector('.doctors-filters__grid');
  const resetButton = document.querySelector('.filter-reset-btn');

  // Active filters state
  let activeFilters = {
    specialty: '',
    branch: '',
    type: '',
    date: '',
    search: ''
  };

  /**
   * Initialize the doctors module
   */
  function init() {
    bindEvents();
    updateResultsCount();
  }

  /**
   * Bind all event listeners
   */
  function bindEvents() {
    // Filter selects
    if (specialtySelect) {
      specialtySelect.addEventListener('change', handleSpecialtyFilter);
    }
    if (branchSelect) {
      branchSelect.addEventListener('change', handleBranchFilter);
    }
    if (typeSelect) {
      typeSelect.addEventListener('change', handleTypeFilter);
    }
    if (dateSelect) {
      dateSelect.addEventListener('change', handleDateFilter);
    }

    // Search input
    if (searchInput) {
      searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Mobile filter toggle
    if (mobileFilterToggle && filtersGrid) {
      mobileFilterToggle.addEventListener('click', toggleMobileFilters);
    }

    // Reset button
    if (resetButton) {
      resetButton.addEventListener('click', resetFilters);
    }

    // Appointment buttons
    document.addEventListener('click', handleAppointmentClick);
  }

  /**
   * Handle specialty filter change
   */
  function handleSpecialtyFilter() {
    activeFilters.specialty = this.value;
    applyFilters();
  }

  /**
   * Handle branch filter change
   */
  function handleBranchFilter() {
    activeFilters.branch = this.value;
    applyFilters();
  }

  /**
   * Handle type (adult/child) filter change
   */
  function handleTypeFilter() {
    activeFilters.type = this.value;
    applyFilters();
  }

  /**
   * Handle date filter change
   */
  function handleDateFilter() {
    activeFilters.date = this.value;
    applyFilters();
  }

  /**
   * Handle search input
   */
  function handleSearch() {
    const query = this.value.toLowerCase().trim();
    activeFilters.search = query;
    applyFilters();
  }

  /**
   * Apply all active filters to doctor cards
   */
  function applyFilters() {
    let visibleCount = 0;

    doctorCards.forEach(card => {
      const shouldShow = checkCardAgainstFilters(card);

      if (shouldShow) {
        card.classList.remove('hidden');
        visibleCount++;
      } else {
        card.classList.add('hidden');
      }
    });

    updateResultsCount(visibleCount);
    toggleEmptyState(visibleCount);
  }

  /**
   * Check if a doctor card matches all active filters
   */
  function checkCardAgainstFilters(card) {
    const specialty = card.dataset.specialty;
    const branch = card.dataset.branch;
    const type = card.dataset.type;
    const name = card.querySelector('.doctor-card__name').textContent.toLowerCase();
    const specialtyText = card.querySelector('.doctor-card__specialty').textContent.toLowerCase();

    // Specialty filter
    if (activeFilters.specialty && specialty !== activeFilters.specialty) {
      return false;
    }

    // Branch filter
    if (activeFilters.branch && branch !== activeFilters.branch) {
      return false;
    }

    // Type filter
    if (activeFilters.type && type !== activeFilters.type) {
      return false;
    }

    // Search filter (by name or specialty)
    if (activeFilters.search) {
      const searchMatch = name.includes(activeFilters.search) ||
                         specialtyText.includes(activeFilters.search);
      if (!searchMatch) return false;
    }

    return true;
  }

  /**
   * Update the results count display
   */
  function updateResultsCount(count) {
    if (!resultsCount) return;

    const total = doctorCards.length;
    const visible = count !== undefined ? count : total;

    resultsCount.textContent = visible;
  }

  /**
   * Show/hide empty state message
   */
  function toggleEmptyState(visibleCount) {
    const existingEmpty = document.querySelector('.doctors-empty');
    const grid = document.querySelector('.doctors-grid');

    if (visibleCount === 0) {
      if (!existingEmpty) {
        const emptyHTML = `
          <div class="doctors-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
            <h3 class="doctors-empty__title">По выбранным параметрам врачи не найдены</h3>
            <p class="doctors-empty__text">Попробуйте изменить фильтры или сбросить поиск</p>
            <button class="btn btn-outline filter-reset-btn">Сбросить фильтры</button>
          </div>
        `;
        grid.insertAdjacentHTML('beforeend', emptyHTML);

        // Bind reset button in empty state
        const emptyResetBtn = grid.querySelector('.doctors-empty .filter-reset-btn');
        if (emptyResetBtn) {
          emptyResetBtn.addEventListener('click', resetFilters);
        }
      }
    } else {
      if (existingEmpty) {
        existingEmpty.remove();
      }
    }
  }

  /**
   * Reset all filters
   */
  function resetFilters() {
    // Reset select values
    if (specialtySelect) specialtySelect.value = '';
    if (branchSelect) branchSelect.value = '';
    if (typeSelect) typeSelect.value = '';
    if (dateSelect) dateSelect.value = '';
    if (searchInput) searchInput.value = '';

    // Reset state
    activeFilters = {
      specialty: '',
      branch: '',
      type: '',
      date: '',
      search: ''
    };

    applyFilters();
  }

  /**
   * Toggle mobile filters visibility
   */
  function toggleMobileFilters() {
    if (filtersGrid) {
      filtersGrid.classList.toggle('open');
      const isOpen = filtersGrid.classList.contains('open');
      mobileFilterToggle.textContent = isOpen ? 'Скрыть фильтры' : 'Показать фильтры';
    }
  }

  /**
   * Handle appointment button clicks
   */
  function handleAppointmentClick(e) {
    const button = e.target.closest('.doctor-card__actions .btn-primary');
    if (!button) return;

    if (button.textContent.includes('Записаться')) {
      e.preventDefault();
      showNotification('Запись на прием будет доступна в ближайшее время');
    }
  }

  /**
   * Show a temporary notification
   */
  function showNotification(message) {
    // Remove existing notification
    const existingNotification = document.querySelector('.doctors-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'doctors-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--color-primary);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideUp 0.3s ease;
    `;

    // Add animation styles if not present
    if (!document.querySelector('#doctors-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'doctors-notification-styles';
      style.textContent = `
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(-50%) translateY(20px)';
      notification.style.transition = 'opacity 0.3s, transform 0.3s';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Debounce function for performance optimization
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
