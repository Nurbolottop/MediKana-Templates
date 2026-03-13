/**
 * Doctors Booking - AJAX-powered doctor appointments
 * Handles dynamic loading, filtering, and booking of doctors
 */

(function() {
  'use strict';

  // State
  let allDoctors = [];
  let filteredDoctors = [];
  let specialties = [];
  let branches = [];
  let currentFilters = {
    specialty: '',
    branch: '',
    type: '',
    date: '',
    search: ''
  };

  // DOM elements cache
  let elements = {};

  /**
   * Initialize doctors page
   */
  function initDoctorsPage() {
    cacheElements();
    bindEvents();
    loadDoctorsData();
  }

  /**
   * Cache DOM elements
   */
  function cacheElements() {
    elements = {
      grid: document.querySelector('.doctors-grid'),
      resultsCount: document.querySelector('.doctors-results-count span'),
      specialtySelect: document.querySelector('[data-filter="specialty"]'),
      branchSelect: document.querySelector('[data-filter="branch"]'),
      typeSelect: document.querySelector('[data-filter="type"]'),
      dateSelect: document.querySelector('[data-filter="date"]'),
      searchInput: document.querySelector('[data-filter="search"]'),
      mobileFilterToggle: document.querySelector('.doctors-filters__mobile-toggle .btn'),
      filtersGrid: document.querySelector('.doctors-filters__grid'),
      resetBtn: document.querySelector('.filter-reset-btn')
    };
  }

  /**
   * Bind event listeners
   */
  function bindEvents() {
    // Filter changes
    elements.specialtySelect?.addEventListener('change', handleFilterChange);
    elements.branchSelect?.addEventListener('change', handleFilterChange);
    elements.typeSelect?.addEventListener('change', handleFilterChange);
    elements.dateSelect?.addEventListener('change', handleFilterChange);
    
    // Search
    elements.searchInput?.addEventListener('input', debounce(handleSearch, 300));
    
    // Mobile toggle
    elements.mobileFilterToggle?.addEventListener('click', toggleMobileFilters);
    
    // Reset
    elements.resetBtn?.addEventListener('click', resetFilters);

    // Booking buttons
    document.addEventListener('click', handleBookingClick);
  }

  /**
   * Load doctors data from API
   */
  async function loadDoctorsData() {
    // Show skeleton
    if (window.MedikanaUI && elements.grid) {
      window.MedikanaUI.renderSkeleton(elements.grid, 'card', 6);
    }

    try {
      const response = await window.MedikanaAPI.get('doctors.json');

      if (response.success && response.data) {
        allDoctors = response.data.doctors || [];
        specialties = response.data.specialties || [];
        branches = response.data.branches || [];
        filteredDoctors = [...allDoctors];

        // Update filter options
        updateFilterOptions();

        // Render
        renderDoctors();
        updateResultsCount();
      } else {
        showError('Не удалось загрузить список врачей');
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      showError('Ошибка загрузки данных');
    }
  }

  /**
   * Update filter dropdown options
   */
  function updateFilterOptions() {
    // Update specialty options
    if (elements.specialtySelect && specialties.length > 0) {
      const currentValue = elements.specialtySelect.value;
      const firstOption = elements.specialtySelect.options[0];
      elements.specialtySelect.innerHTML = '';
      elements.specialtySelect.appendChild(firstOption);
      
      specialties.forEach(spec => {
        const option = document.createElement('option');
        option.value = spec.code;
        option.textContent = spec.name;
        elements.specialtySelect.appendChild(option);
      });
      elements.specialtySelect.value = currentValue;
    }

    // Update branch options
    if (elements.branchSelect && branches.length > 0) {
      const currentValue = elements.branchSelect.value;
      const firstOption = elements.branchSelect.options[0];
      elements.branchSelect.innerHTML = '';
      elements.branchSelect.appendChild(firstOption);
      
      branches.forEach(branch => {
        const option = document.createElement('option');
        option.value = branch.code;
        option.textContent = branch.name;
        elements.branchSelect.appendChild(option);
      });
      elements.branchSelect.value = currentValue;
    }
  }

  /**
   * Render doctors grid
   */
  function renderDoctors() {
    if (!elements.grid) return;

    window.MedikanaUI?.clearContainer(elements.grid);

    if (filteredDoctors.length === 0) {
      renderEmptyState();
      return;
    }

    const html = filteredDoctors.map(doctor => renderDoctorCard(doctor)).join('');
    elements.grid.innerHTML = html;
  }

  /**
   * Render single doctor card
   */
  function renderDoctorCard(doctor) {
    return `
      <div class="doctor-card" 
           data-id="${doctor.id}"
           data-specialty="${doctor.specialty_code}"
           data-branch="${doctor.branch_code}"
           data-type="${doctor.patient_type}">
        <div class="doctor-card__image">
          <img src="${doctor.photo}" alt="${doctor.name}">
        </div>
        <div class="doctor-card__body">
          <span class="doctor-card__specialty">${doctor.specialty}</span>
          <h3 class="doctor-card__name">${doctor.name}</h3>
          <p class="doctor-card__meta">Стаж: ${doctor.experience} лет</p>
          <p class="doctor-card__meta">Филиал: ${doctor.branch}</p>
          <p class="doctor-card__text">${doctor.description}</p>
          <div class="doctor-card__slot">Ближайшее время: ${doctor.next_slot}</div>
          <div class="doctor-card__actions">
            <button class="btn btn-primary" 
                    data-action="book-doctor" 
                    data-doctor-id="${doctor.id}">
              Записаться
            </button>
            <a href="#" class="btn btn-outline" data-action="doctor-details" data-doctor-id="${doctor.id}">Подробнее</a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render empty state
   */
  function renderEmptyState() {
    elements.grid.innerHTML = `
      <div class="doctors-empty" style="grid-column: 1 / -1;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="80" height="80">
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

    // Bind reset button in empty state
    const emptyResetBtn = elements.grid.querySelector('.filter-reset-btn');
    if (emptyResetBtn) {
      emptyResetBtn.addEventListener('click', resetFilters);
    }
  }

  /**
   * Update results count
   */
  function updateResultsCount() {
    if (elements.resultsCount) {
      elements.resultsCount.textContent = filteredDoctors.length;
    }
  }

  /**
   * Apply filters
   */
  function applyFilters() {
    filteredDoctors = allDoctors.filter(doctor => {
      // Specialty filter
      if (currentFilters.specialty && doctor.specialty_code !== currentFilters.specialty) {
        return false;
      }

      // Branch filter
      if (currentFilters.branch && doctor.branch_code !== currentFilters.branch) {
        return false;
      }

      // Type filter
      if (currentFilters.type && doctor.patient_type !== currentFilters.type) {
        return false;
      }

      // Search filter
      if (currentFilters.search) {
        const searchLower = currentFilters.search.toLowerCase();
        const matches = 
          doctor.name.toLowerCase().includes(searchLower) ||
          doctor.specialty.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }

      return true;
    });

    renderDoctors();
    updateResultsCount();
  }

  /**
   * Handle filter change
   */
  function handleFilterChange(e) {
    const filterType = e.target.dataset.filter;
    currentFilters[filterType] = e.target.value;
    applyFilters();
  }

  /**
   * Handle search
   */
  function handleSearch(e) {
    currentFilters.search = e.target.value.toLowerCase().trim();
    applyFilters();
  }

  /**
   * Toggle mobile filters
   */
  function toggleMobileFilters() {
    elements.filtersGrid?.classList.toggle('open');
    const isOpen = elements.filtersGrid?.classList.contains('open');
    if (elements.mobileFilterToggle) {
      elements.mobileFilterToggle.textContent = isOpen ? 'Скрыть фильтры' : 'Показать фильтры';
    }
  }

  /**
   * Reset all filters
   */
  function resetFilters() {
    currentFilters = { specialty: '', branch: '', type: '', date: '', search: '' };
    
    if (elements.specialtySelect) elements.specialtySelect.value = '';
    if (elements.branchSelect) elements.branchSelect.value = '';
    if (elements.typeSelect) elements.typeSelect.value = '';
    if (elements.dateSelect) elements.dateSelect.value = '';
    if (elements.searchInput) elements.searchInput.value = '';

    filteredDoctors = [...allDoctors];
    renderDoctors();
    updateResultsCount();
  }

  /**
   * Handle booking button click
   */
  function handleBookingClick(e) {
    const bookBtn = e.target.closest('[data-action="book-doctor"]');
    if (!bookBtn) return;

    e.preventDefault();
    const doctorId = parseInt(bookBtn.dataset.doctorId);
    const doctor = allDoctors.find(d => d.id === doctorId);
    
    if (!doctor) return;

    openBookingModal(doctor);
  }

  /**
   * Open booking modal
   */
  function openBookingModal(doctor) {
    // Create modal if not exists
    let modal = document.getElementById('booking-modal');
    if (!modal) {
      const modalHTML = `
        <div id="booking-modal" class="modal-content" style="max-width: 500px;">
          <div class="modal-header">
            <h3 class="modal-title">Запись к врачу</h3>
            <button class="modal-close" data-modal-close>&times;</button>
          </div>
          <div class="modal-body">
            <div id="booking-doctor-info"></div>
            <form id="booking-form" data-ajax-form data-endpoint="/api/appointments">
              <input type="hidden" name="doctor_id" id="booking-doctor-id">
              <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 6px; font-weight: 500;">Ваше имя</label>
                <input type="text" name="name" class="form-input" required placeholder="Введите имя">
              </div>
              <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 6px; font-weight: 500;">Телефон</label>
                <input type="tel" name="phone" class="form-input" required placeholder="+996 XXX XXX XXX">
              </div>
              <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 6px; font-weight: 500;">Желаемая дата</label>
                <input type="date" name="date" class="form-input" required>
              </div>
              <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 6px; font-weight: 500;">Комментарий</label>
                <textarea name="comment" class="form-input" rows="3" placeholder="Опишите симптомы или вопросы"></textarea>
              </div>
              <button type="submit" class="btn btn-primary" style="width: 100%;">Записаться</button>
            </form>
          </div>
        </div>
      `;
      
      const wrapper = document.createElement('div');
      wrapper.innerHTML = modalHTML;
      document.body.appendChild(wrapper.firstElementChild);
      modal = document.getElementById('booking-modal');
    }

    // Update modal content
    const infoDiv = document.getElementById('booking-doctor-info');
    if (infoDiv) {
      infoDiv.innerHTML = `
        <div style="display: flex; gap: 16px; margin-bottom: 20px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
          <img src="${doctor.photo}" alt="" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;">
          <div>
            <div style="font-weight: 600; color: #0F6B66;">${doctor.specialty}</div>
            <div style="font-weight: 600;">${doctor.name}</div>
            <div style="font-size: 14px; color: #6b7280;">${doctor.branch}</div>
          </div>
        </div>
      `;
    }

    // Set doctor ID
    const doctorIdInput = document.getElementById('booking-doctor-id');
    if (doctorIdInput) {
      doctorIdInput.value = doctor.id;
    }

    // Open modal
    if (window.MedikanaUI) {
      window.MedikanaUI.openModal('booking-modal');
    }
  }

  /**
   * Submit booking
   */
  async function submitBooking(formData) {
    try {
      const response = await window.MedikanaAPI.post('/api/appointments', formData);
      
      if (response.success) {
        window.MedikanaAPI.showNotification('Запись успешно создана! Мы свяжемся с вами для подтверждения.', 'success');
        
        // Close modal
        if (window.MedikanaUI) {
          window.MedikanaUI.closeModal('booking-modal');
        }
        
        return true;
      } else {
        showError(response.message || 'Ошибка при создании записи');
        return false;
      }
    } catch (error) {
      showError('Ошибка сети. Попробуйте позже.');
      return false;
    }
  }

  /**
   * Show error
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
  // Initialize on DOM ready - ONLY on doctors page
  // ============================================

  function shouldInitDoctors() {
    const path = window.location.pathname;
    const isDoctorsPage = path.includes('doctors') || 
                         document.querySelector('.doctors-grid') || 
                         document.querySelector('[data-page="doctors"]');
    return isDoctorsPage;
  }

  if (shouldInitDoctors()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initDoctorsPage);
    } else {
      initDoctorsPage();
    }
  }

  // ============================================
  // Export
  // ============================================

  window.MedikanaDoctors = {
    init: initDoctorsPage,
    loadDoctors: loadDoctorsData,
    applyFilters,
    resetFilters,
    bookDoctor: submitBooking,
    getDoctors: () => filteredDoctors
  };

})();
