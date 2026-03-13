/**
 * UI Helpers - Common UI functionality for AJAX interactions
 * Loading states, skeletons, notifications, modals
 */

(function() {
  'use strict';

  // Global notification container
  let notificationContainer = null;

  /**
   * Initialize notification container
   */
  function initNotificationContainer() {
    if (notificationContainer) return;
    
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
      pointer-events: none;
    `;
    document.body.appendChild(notificationContainer);

    // Add styles
    if (!document.querySelector('#ui-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'ui-notification-styles';
      style.textContent = `
        .ui-notification {
          padding: 16px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: notificationSlideIn 0.3s ease;
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ui-notification.info { background: #0F6B66; color: #fff; }
        .ui-notification.success { background: #10b981; color: #fff; }
        .ui-notification.error { background: #D72536; color: #fff; }
        .ui-notification.warning { background: #f59e0b; color: #fff; }
        
        .ui-notification.hiding {
          animation: notificationSlideOut 0.3s ease forwards;
        }
        
        @keyframes notificationSlideIn {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes notificationSlideOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(100%); }
        }
        
        .ui-loader {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .ui-loader::after {
          content: '';
          width: 16px;
          height: 16px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: loaderSpin 0.8s linear infinite;
        }
        @keyframes loaderSpin {
          to { transform: rotate(360deg); }
        }
        
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.5s infinite;
          border-radius: 4px;
        }
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        .skeleton-card {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e5e7eb;
        }
        .skeleton-title {
          height: 24px;
          width: 60%;
          margin-bottom: 12px;
        }
        .skeleton-text {
          height: 16px;
          width: 100%;
          margin-bottom: 8px;
        }
        .skeleton-text.short {
          width: 40%;
        }
        
        .inline-error {
          color: #D72536;
          font-size: 13px;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .inline-error::before {
          content: '⚠';
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s, visibility 0.3s;
        }
        .modal-overlay.active {
          opacity: 1;
          visibility: visible;
        }
        .modal-content {
          background: #fff;
          border-radius: 16px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          transform: scale(0.9) translateY(20px);
          transition: transform 0.3s;
        }
        .modal-overlay.active .modal-content {
          transform: scale(1) translateY(0);
        }
        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s;
        }
        .modal-close:hover {
          background: #f3f4f6;
        }
        .modal-body {
          padding: 24px;
        }
        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Show notification
   * @param {string} message - Notification text
   * @param {string} type - Type: 'info', 'success', 'error', 'warning'
   * @param {number} duration - Duration in ms (0 for persistent)
   */
  function showNotification(message, type = 'info', duration = 3000) {
    initNotificationContainer();

    const notification = document.createElement('div');
    notification.className = `ui-notification ${type}`;
    notification.innerHTML = `
      <span>${message}</span>
    `;

    notificationContainer.appendChild(notification);

    if (duration > 0) {
      setTimeout(() => {
        hideNotification(notification);
      }, duration);
    }

    return notification;
  }

  /**
   * Hide notification
   * @param {HTMLElement} notification - Notification element
   */
  function hideNotification(notification) {
    notification.classList.add('hiding');
    setTimeout(() => notification.remove(), 300);
  }

  /**
   * Show loader in target element
   * @param {HTMLElement|string} target - Element or selector
   * @param {string} text - Loading text
   */
  function showLoader(target, text = 'Загрузка...') {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;

    const loader = document.createElement('div');
    loader.className = 'ui-loader';
    loader.dataset.loader = 'true';
    loader.innerHTML = `<span>${text}</span>`;
    
    element.style.position = 'relative';
    element.appendChild(loader);

    // Store original content if needed
    if (element.tagName === 'BUTTON') {
      element.dataset.originalText = element.textContent;
      element.disabled = true;
    }

    return loader;
  }

  /**
   * Hide loader from target element
   * @param {HTMLElement|string} target - Element or selector
   */
  function hideLoader(target) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;

    const loader = element.querySelector('[data-loader="true"]');
    if (loader) {
      loader.remove();
    }

    // Restore button state
    if (element.tagName === 'BUTTON') {
      element.disabled = false;
      if (element.dataset.originalText) {
        element.textContent = element.dataset.originalText;
        delete element.dataset.originalText;
      }
    }
  }

  /**
   * Render skeleton loading placeholder
   * @param {HTMLElement|string} target - Container element or selector
   * @param {string} type - Skeleton type: 'card', 'list', 'text'
   * @param {number} count - Number of skeleton items
   */
  function renderSkeleton(target, type = 'card', count = 3) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;

    clearContainer(element);

    let skeletonHTML = '';
    
    for (let i = 0; i < count; i++) {
      if (type === 'card') {
        skeletonHTML += `
          <div class="skeleton-card">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text short"></div>
          </div>
        `;
      } else if (type === 'list') {
        skeletonHTML += `
          <div style="display: flex; gap: 12px; margin-bottom: 12px;">
            <div class="skeleton" style="width: 60px; height: 60px; border-radius: 8px;"></div>
            <div style="flex: 1;">
              <div class="skeleton skeleton-title" style="width: 40%;"></div>
              <div class="skeleton skeleton-text"></div>
            </div>
          </div>
        `;
      } else if (type === 'text') {
        skeletonHTML += `
          <div class="skeleton skeleton-text"></div>
        `;
      }
    }

    element.innerHTML = skeletonHTML;
    element.dataset.hasSkeleton = 'true';
  }

  /**
   * Clear container contents
   * @param {HTMLElement|string} target - Element or selector
   */
  function clearContainer(target) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;
    element.innerHTML = '';
    delete element.dataset.hasSkeleton;
  }

  /**
   * Toggle disabled state of element
   * @param {HTMLElement|string} target - Element or selector
   * @param {boolean} state - Disabled state
   */
  function toggleDisabled(target, state) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;

    element.disabled = state;
    
    if (state) {
      element.dataset.wasDisabled = 'true';
    } else {
      delete element.dataset.wasDisabled;
    }
  }

  /**
   * Show inline error message
   * @param {HTMLElement|string} target - Element or selector
   * @param {string} message - Error message
   */
  function showInlineError(target, message) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;

    clearInlineError(target);

    const errorEl = document.createElement('div');
    errorEl.className = 'inline-error';
    errorEl.textContent = message;
    errorEl.dataset.inlineError = 'true';

    element.parentNode.insertBefore(errorEl, element.nextSibling);
    element.classList.add('has-error');
  }

  /**
   * Clear inline error message
   * @param {HTMLElement|string} target - Element or selector
   */
  function clearInlineError(target) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;

    const parent = element.parentNode;
    const errorEl = parent.querySelector('[data-inline-error="true"]');
    if (errorEl) {
      errorEl.remove();
    }
    element.classList.remove('has-error');
  }

  /**
   * Open modal by ID
   * @param {string} id - Modal ID
   */
  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) {
      console.warn(`Modal #${id} not found`);
      return;
    }

    // Create overlay if needed
    let overlay = modal.closest('.modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      modal.parentNode.insertBefore(overlay, modal);
      overlay.appendChild(modal);
    }

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(id);
      }
    });

    // Close on escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal(id);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  /**
   * Close modal by ID
   * @param {string} id - Modal ID
   */
  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    const overlay = modal.closest('.modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
    
    document.body.style.overflow = '';
  }

  /**
   * Close all open modals
   */
  function closeAllModals() {
    document.querySelectorAll('.modal-overlay.active').forEach(overlay => {
      overlay.classList.remove('active');
    });
    document.body.style.overflow = '';
  }

  /**
   * Initialize modal close buttons
   */
  function initModalCloseButtons() {
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('.modal-close, [data-modal-close]');
      if (closeBtn) {
        const modal = closeBtn.closest('.modal-content, [id]');
        if (modal && modal.id) {
          closeModal(modal.id);
        }
      }
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModalCloseButtons);
  } else {
    initModalCloseButtons();
  }

  // ============================================
  // Export UI module
  // ============================================

  window.MedikanaUI = {
    showNotification,
    hideNotification,
    showLoader,
    hideLoader,
    renderSkeleton,
    clearContainer,
    toggleDisabled,
    showInlineError,
    clearInlineError,
    openModal,
    closeModal,
    closeAllModals,
    init: initNotificationContainer
  };

})();
