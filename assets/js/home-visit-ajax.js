/**
 * Home Visit AJAX - AJAX form handling for home visit requests
 */

(function() {
  'use strict';

  // State
  let services = [];
  let selectedService = null;

  // DOM elements
  let elements = {};

  /**
   * Initialize home visit page
   */
  function initHomeVisitPage() {
    cacheElements();
    bindEvents();
    initFAQAccordion();
    loadServices();
    initHomeVisitActions();
  }

  /**
   * Initialize FAQ Accordion
   */
  function initFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close all other items
        faqItems.forEach(otherItem => {
          otherItem.classList.remove('active');
        });
        
        // Toggle current item
        item.classList.toggle('active', !isActive);
      });
    });
  }

  /**
   * Scroll to form smoothly
   */
  function scrollToForm() {
    const formSection = document.getElementById('home-visit-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Initialize home visit actions
   */
  function initHomeVisitActions() {
    // Bind scroll-to-form buttons
    const scrollButtons = document.querySelectorAll('[data-action="scroll-to"]');
    scrollButtons.forEach(btn => {
      if (btn.dataset.target === 'home-visit-form') {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          scrollToForm();
        });
      }
    });
  }

  /**
   * Cache DOM elements
   */
  function cacheElements() {
    elements = {
      form: document.querySelector('[data-ajax-form][data-endpoint*="home-visit"]'),
      serviceSelect: document.querySelector('[name="service"]'),
      priceDisplay: document.querySelector('[data-price-display]'),
      dateInput: document.querySelector('[name="date"]'),
      timeSelect: document.querySelector('[name="time"]'),
      addressInput: document.querySelector('[name="address"]'),
      phoneInput: document.querySelector('[name="phone"]'),
      nameInput: document.querySelector('[name="name"]'),
      commentInput: document.querySelector('[name="comment"]')
    };
  }

  /**
   * Bind events
   */
  function bindEvents() {
    // Service change - update price/info
    elements.serviceSelect?.addEventListener('change', handleServiceChange);

    // Form submission is handled by forms.js, but we can add extra logic
    if (elements.form) {
      elements.form.addEventListener('form:success', handleFormSuccess);
      elements.form.addEventListener('form:error', handleFormError);
    }
  }

  /**
   * Load services from API
   */
  async function loadServices() {
    try {
      // In real app, this would load from API
      // For now, use hardcoded services
      services = [
        { id: 'blood', name: 'Забор крови', price: 500, description: 'Венозная кровь из локтевой вены' },
        { id: 'urine', name: 'Забор мочи', price: 300, description: 'Сбор биоматериала в контейнер' },
        { id: 'smear', name: 'Мазок', price: 400, description: 'Вагинальный/уретральный мазок' },
        { id: 'doctor', name: 'Осмотр врача', price: 2500, description: 'Консультация и осмотр на дому' },
        { id: 'iv', name: 'Капельница', price: 1500, description: 'Внутривенное вливание' }
      ];

      // Populate service select
      if (elements.serviceSelect) {
        elements.serviceSelect.innerHTML = '<option value="">Выберите услугу</option>' +
          services.map(s => `<option value="${s.id}" data-price="${s.price}">${s.name} — ${s.price} ₽</option>`).join('');
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  }

  /**
   * Handle service selection change
   */
  function handleServiceChange(e) {
    const serviceId = e.target.value;
    selectedService = services.find(s => s.id === serviceId);

    if (selectedService && elements.priceDisplay) {
      elements.priceDisplay.innerHTML = `
        <div style="padding: 16px; background: #f0fdf4; border-radius: 8px; margin-top: 16px;">
          <div style="font-weight: 600; color: #0F6B66; margin-bottom: 4px;">${selectedService.name}</div>
          <div style="font-size: 24px; font-weight: 700; color: #0F6B66;">${selectedService.price.toLocaleString()} ₽</div>
          <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">${selectedService.description}</div>
          <div style="font-size: 13px; color: #9ca3af; margin-top: 8px;">+ стоимость анализов (при необходимости)</div>
        </div>
      `;
    } else if (elements.priceDisplay) {
      elements.priceDisplay.innerHTML = '';
    }
  }

  /**
   * Handle form success
   */
  function handleFormSuccess(e) {
    // Additional success handling specific to home visit
    console.log('Home visit request submitted:', e.detail);
    
    // Could track analytics here
    if (typeof gtag !== 'undefined') {
      gtag('event', 'home_visit_request', {
        service: selectedService?.name,
        value: selectedService?.price
      });
    }
  }

  /**
   * Handle form error
   */
  function handleFormError(e) {
    console.error('Home visit form error:', e.detail);
  }

  /**
   * Submit home visit request manually (if needed)
   */
  async function submitHomeVisitRequest(data) {
    try {
      // Show loading
      const submitBtn = elements.form?.querySelector('[type="submit"]');
      if (submitBtn && window.MedikanaUI) {
        window.MedikanaUI.showLoader(submitBtn, 'Отправка...');
      }

      const response = await window.MedikanaAPI.post('/api/home-visits', {
        ...data,
        service_price: selectedService?.price
      });

      // Hide loading
      if (submitBtn && window.MedikanaUI) {
        window.MedikanaUI.hideLoader(submitBtn);
      }

      if (response.success) {
        window.MedikanaAPI.showNotification(
          'Заявка на выезд принята! Мы свяжемся с вами для подтверждения.', 
          'success'
        );
        elements.form?.reset();
        if (elements.priceDisplay) elements.priceDisplay.innerHTML = '';
        return true;
      } else {
        window.MedikanaAPI.showNotification(
          response.message || 'Ошибка при отправке заявки', 
          'error'
        );
        return false;
      }
    } catch (error) {
      const submitBtn = elements.form?.querySelector('[type="submit"]');
      if (submitBtn && window.MedikanaUI) {
        window.MedikanaUI.hideLoader(submitBtn);
      }
      
      window.MedikanaAPI.showNotification('Ошибка сети. Попробуйте позже.', 'error');
      return false;
    }
  }

  // ============================================
  // Initialize
  // ============================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeVisitPage);
  } else {
    if (document.querySelector('[data-page="home-visit"]') || 
        document.querySelector('form[data-endpoint*="home-visit"]')) {
      initHomeVisitPage();
    }
  }

  // ============================================
  // Export
  // ============================================

  window.MedikanaHomeVisit = {
    init: initHomeVisitPage,
    submit: submitHomeVisitRequest,
    scrollToForm,
    initFAQAccordion,
    getSelectedService: () => selectedService
  };

})();
