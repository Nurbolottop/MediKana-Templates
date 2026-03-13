/**
 * Contacts AJAX - AJAX form handling for contact page
 */

(function() {
  'use strict';

  // DOM elements
  let elements = {};

  /**
   * Initialize contacts page
   */
  function initContactsPage() {
    cacheElements();
    bindEvents();
  }

  /**
   * Cache DOM elements
   */
  function cacheElements() {
    elements = {
      contactForm: document.querySelector('#contact-form'),
      feedbackForm: document.querySelector('#feedback-form'),
      mapContainer: document.querySelector('#map-container')
    };
  }

  /**
   * Bind events
   */
  function bindEvents() {
    // Form success/error handlers
    if (elements.contactForm) {
      elements.contactForm.addEventListener('form:success', handleContactSuccess);
      elements.contactForm.addEventListener('form:error', handleContactError);
    }

    if (elements.feedbackForm) {
      elements.feedbackForm.addEventListener('form:success', handleFeedbackSuccess);
      elements.feedbackForm.addEventListener('form:error', handleFeedbackError);
    }
  }

  /**
   * Handle contact form success
   */
  function handleContactSuccess(e) {
    console.log('Contact form submitted:', e.detail);
    
    // Track conversion
    if (typeof gtag !== 'undefined') {
      gtag('event', 'contact_form_submit', {
        event_category: 'engagement',
        event_label: 'contact'
      });
    }
  }

  /**
   * Handle contact form error
   */
  function handleContactError(e) {
    console.error('Contact form error:', e.detail);
  }

  /**
   * Handle feedback form success
   */
  function handleFeedbackSuccess(e) {
    console.log('Feedback form submitted:', e.detail);
    
    if (typeof gtag !== 'undefined') {
      gtag('event', 'feedback_submit', {
        event_category: 'engagement',
        event_label: 'feedback'
      });
    }
  }

  /**
   * Handle feedback form error
   */
  function handleFeedbackError(e) {
    console.error('Feedback form error:', e.detail);
  }

  /**
   * Submit contact form manually
   */
  async function submitContactForm(data) {
    try {
      const response = await window.MedikanaAPI.post('/api/contact', data);
      
      if (response.success) {
        window.MedikanaAPI.showNotification(
          'Сообщение отправлено! Мы ответим вам в ближайшее время.', 
          'success'
        );
        return true;
      } else {
        window.MedikanaAPI.showNotification(
          response.message || 'Ошибка при отправке сообщения', 
          'error'
        );
        return false;
      }
    } catch (error) {
      window.MedikanaAPI.showNotification('Ошибка сети. Попробуйте позже.', 'error');
      return false;
    }
  }

  /**
   * Load branches for map display
   */
  async function loadBranches() {
    try {
      const response = await window.MedikanaAPI.get('branches.json');
      
      if (response.success && response.data) {
        return response.data.branches || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading branches:', error);
      return [];
    }
  }

  // ============================================
  // Initialize
  // ============================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactsPage);
  } else {
    if (document.querySelector('#contact-form') || 
        document.querySelector('[data-page="contacts"]')) {
      initContactsPage();
    }
  }

  // ============================================
  // Export
  // ============================================

  window.MedikanaContacts = {
    init: initContactsPage,
    submit: submitContactForm,
    loadBranches
  };

})();
