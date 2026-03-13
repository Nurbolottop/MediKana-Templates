/**
 * Actions Dispatcher - Unified handler for all data-action buttons
 * Centralizes click handling to prevent chaos and enable scaling
 */

(function() {
  'use strict';

  // Action registry - maps action names to handlers
  const actionRegistry = {};

  /**
   * Register an action handler
   * @param {string} actionName - Name of the action (e.g., "book-doctor")
   * @param {Function} handler - Handler function (element, event, data) => {}
   */
  function register(actionName, handler) {
    if (typeof handler !== 'function') {
      console.error(`[Actions] Handler for "${actionName}" must be a function`);
      return;
    }
    actionRegistry[actionName] = handler;
  }

  /**
   * Unregister an action handler
   * @param {string} actionName - Name of the action to remove
   */
  function unregister(actionName) {
    delete actionRegistry[actionName];
  }

  /**
   * Execute an action programmatically
   * @param {string} actionName - Action to execute
   * @param {HTMLElement} element - Target element (optional)
   * @param {Object} data - Additional data (optional)
   */
  function execute(actionName, element = null, data = {}) {
    const handler = actionRegistry[actionName];
    if (!handler) {
      console.warn(`[Actions] No handler registered for action: "${actionName}"`);
      return false;
    }

    try {
      handler(element, null, data);
      return true;
    } catch (error) {
      console.error(`[Actions] Error executing "${actionName}":`, error);
      return false;
    }
  }

  /**
   * Parse data attributes from element
   * @param {HTMLElement} element - Element with data attributes
   * @returns {Object} Parsed data
   */
  function parseElementData(element) {
    const data = {};
    const attributes = element.attributes;

    for (let i = 0; i < attributes.length; i++) {
      const attr = attributes[i];
      if (attr.name.startsWith('data-') && attr.name !== 'data-action') {
        const key = attr.name
          .replace('data-', '')
          .replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
        let value = attr.value;

        // Try to parse JSON
        if (value.startsWith('{') || value.startsWith('[')) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // Keep as string if JSON parse fails
          }
        }

        // Convert numeric strings to numbers
        if (/^-?\d+$/.test(value)) {
          value = parseInt(value, 10);
        } else if (/^-?\d+\.\d+$/.test(value)) {
          value = parseFloat(value);
        }

        // Convert "true"/"false" strings to booleans
        if (value === 'true') value = true;
        if (value === 'false') value = false;

        data[key] = value;
      }
    }

    return data;
  }

  /**
   * Global click handler - dispatches to registered actions
   * @param {Event} event - Click event
   */
  function handleGlobalClick(event) {
    // Find closest element with data-action
    const actionElement = event.target.closest('[data-action]');
    if (!actionElement) return;

    const actionName = actionElement.dataset.action;
    if (!actionName) return;

    // Check for disabled state
    if (actionElement.disabled || actionElement.hasAttribute('disabled')) {
      event.preventDefault();
      return;
    }

    // Get additional data from element
    const data = parseElementData(actionElement);

    // Find and execute handler
    const handler = actionRegistry[actionName];

    if (handler) {
      event.preventDefault();

      try {
        handler(actionElement, event, data);
      } catch (error) {
        console.error(`[Actions] Error in handler "${actionName}":`, error);
      }
    } else {
      console.warn(`[Actions] No handler for action: "${actionName}"`);
    }
  }

  /**
   * Check if action is registered
   * @param {string} actionName - Action to check
   * @returns {boolean}
   */
  function has(actionName) {
    return !!actionRegistry[actionName];
  }

  /**
   * Get list of registered actions
   * @returns {string[]}
   */
  function list() {
    return Object.keys(actionRegistry);
  }

  // ============================================
  // Built-in Actions Registration
  // ============================================

  /**
   * Book doctor action
   */
  register('book-doctor', (element, event, data) => {
    const doctorId = data.doctorId || data.id;

    if (!doctorId) {
      console.error('[Actions] book-doctor: missing doctorId');
      return;
    }

    // Store selected doctor in AppStore
    if (window.AppStore) {
      window.AppStore.set('selectedDoctor', doctorId);
    }

    // Trigger booking modal if MedikanaDoctors exists
    if (window.MedikanaDoctors && window.MedikanaDoctors.openBookingModal) {
      window.MedikanaDoctors.openBookingModal(doctorId);
    } else {
      // Fallback: dispatch custom event
      document.dispatchEvent(new CustomEvent('medikana:book-doctor', {
        detail: { doctorId, data }
      }));
    }
  });

  /**
   * Add to cart action
   */
  register('add-to-cart', (element, event, data) => {
    const itemId = data.itemId || data.id || data.analysisId;
    const itemType = data.itemType || 'analysis';
    const itemName = data.itemName || data.name || element.textContent.trim();
    const itemPrice = data.itemPrice || data.price || 0;

    if (!itemId) {
      console.error('[Actions] add-to-cart: missing itemId');
      return;
    }

    // Add to cart if MedikanaCart exists
    if (window.MedikanaCart) {
      window.MedikanaCart.addItem({
        id: itemId,
        type: itemType,
        name: itemName,
        price: itemPrice,
        quantity: 1
      });

      // Show notification
      if (window.MedikanaAPI) {
        window.MedikanaAPI.showNotification(`${itemName} добавлен в корзину`, 'success');
      }
    } else {
      console.warn('[Actions] MedikanaCart not available');
    }

    // Dispatch event for other listeners
    document.dispatchEvent(new CustomEvent('medikana:add-to-cart', {
      detail: { itemId, itemType, itemName, itemPrice }
    }));
  });

  /**
   * Remove from cart action
   */
  register('remove-from-cart', (element, event, data) => {
    const itemId = data.itemId || data.id;

    if (!itemId) {
      console.error('[Actions] remove-from-cart: missing itemId');
      return;
    }

    if (window.MedikanaCart) {
      window.MedikanaCart.removeItem(itemId);
    }

    document.dispatchEvent(new CustomEvent('medikana:remove-from-cart', {
      detail: { itemId }
    }));
  });

  /**
   * Open modal action
   */
  register('open-modal', (element, event, data) => {
    const modalId = data.modalId || data.target || data.modal;

    if (!modalId) {
      console.error('[Actions] open-modal: missing modalId');
      return;
    }

    if (window.MedikanaUI && window.MedikanaUI.openModal) {
      window.MedikanaUI.openModal(modalId);
    } else {
      // Fallback: show modal by ID
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('modal-open');
        modal.style.display = 'block';
      }
    }

    document.dispatchEvent(new CustomEvent('medikana:modal-open', {
      detail: { modalId }
    }));
  });

  /**
   * Close modal action
   */
  register('close-modal', (element, event, data) => {
    const modalId = data.modalId || data.target;

    if (modalId && window.MedikanaUI && window.MedikanaUI.closeModal) {
      window.MedikanaUI.closeModal(modalId);
    } else {
      // Close closest modal
      const modal = element.closest('.modal, .modal-content, [class*="modal"]');
      if (modal) {
        modal.classList.remove('modal-open');
        modal.style.display = 'none';
      }
    }

    document.dispatchEvent(new CustomEvent('medikana:modal-close', {
      detail: { modalId }
    }));
  });

  /**
   * Download result action
   */
  register('download-result', (element, event, data) => {
    const orderId = data.orderId || data.order;

    if (!orderId) {
      console.error('[Actions] download-result: missing orderId');
      return;
    }

    // Simulate download
    if (window.MedikanaAPI) {
      window.MedikanaAPI.showNotification(`Загрузка результатов ${orderId}...`, 'info');
    }

    // In real app: trigger file download
    console.log(`[Actions] Downloading results for order: ${orderId}`);

    document.dispatchEvent(new CustomEvent('medikana:download-result', {
      detail: { orderId }
    }));
  });

  /**
   * Clear filters action
   */
  register('clear-filters', (element, event, data) => {
    const filterScope = data.scope || data.target || 'all';

    // Try to use page-specific reset function
    if (window.MedikanaCatalog && window.MedikanaCatalog.resetFilters) {
      window.MedikanaCatalog.resetFilters();
    } else if (window.MedikanaDoctors && window.MedikanaDoctors.resetFilters) {
      window.MedikanaDoctors.resetFilters();
    } else {
      // Fallback: reset all form inputs
      const forms = document.querySelectorAll('form[data-filters], [data-filter-form]');
      forms.forEach(form => form.reset());

      // Clear search inputs
      const searchInputs = document.querySelectorAll('input[type="search"], [data-filter="search"]');
      searchInputs.forEach(input => input.value = '');
    }

    if (window.MedikanaAPI) {
      window.MedikanaAPI.showNotification('Фильтры сброшены', 'success');
    }

    document.dispatchEvent(new CustomEvent('medikana:clear-filters', {
      detail: { scope: filterScope }
    }));
  });

  /**
   * Toggle mobile menu
   */
  register('toggle-menu', (element, event, data) => {
    const menuId = data.menuId || data.target || 'mobile-menu';
    const menu = document.getElementById(menuId) || document.querySelector('.mobile-menu, .nav-mobile');

    if (menu) {
      menu.classList.toggle('open');
      menu.classList.toggle('active');
    }

    // Toggle body scroll lock
    document.body.classList.toggle('menu-open');
  });

  /**
   * Scroll to element
   */
  register('scroll-to', (element, event, data) => {
    const targetId = data.target || data.to;
    const target = document.getElementById(targetId) || document.querySelector(targetId);

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  /**
   * Print page/element
   */
  register('print', (element, event, data) => {
    const targetId = data.target;

    if (targetId) {
      const target = document.getElementById(targetId);
      if (target) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(target.innerHTML);
        printWindow.document.close();
        printWindow.print();
      }
    } else {
      window.print();
    }
  });

  /**
   * Copy to clipboard
   */
  register('copy', (element, event, data) => {
    const text = data.text || data.value || element.textContent;

    if (text && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        if (window.MedikanaAPI) {
          window.MedikanaAPI.showNotification('Скопировано!', 'success');
        }
      });
    }
  });

  /**
   * Share action
   */
  register('share', (element, event, data) => {
    const url = data.url || window.location.href;
    const title = data.title || document.title;

    if (navigator.share) {
      navigator.share({
        title: title,
        url: url
      });
    } else {
      // Fallback: copy URL
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        if (window.MedikanaAPI) {
          window.MedikanaAPI.showNotification('Ссылка скопирована', 'success');
        }
      }
    }
  });

  // ============================================
  // Initialize
  // ============================================

  // Bind global click handler
  document.addEventListener('click', handleGlobalClick, true);

  // ============================================
  // Export
  // ============================================

  window.MedikanaActions = {
    register,
    unregister,
    execute,
    has,
    list,
    getRegistry: () => ({ ...actionRegistry })
  };

})();
