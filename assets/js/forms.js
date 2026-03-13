/**
 * Forms Handler - Universal AJAX form submission
 * Automatically handles forms with data-ajax-form attribute
 */

(function() {
  'use strict';

  // Form configuration
  const FORM_CONFIG = {
    // Default success message
    defaultSuccessMessage: 'Заявка успешно отправлена!',
    // Default error message  
    defaultErrorMessage: 'Произошла ошибка. Попробуйте позже.',
    // Validation messages
    validationMessages: {
      required: 'Это поле обязательно для заполнения',
      phone: 'Введите корректный номер телефона',
      email: 'Введите корректный email адрес',
      minLength: (min) => `Минимум ${min} символов`
    }
  };

  /**
   * Initialize all AJAX forms on the page
   */
  function initAjaxForms() {
    const forms = document.querySelectorAll('[data-ajax-form]');
    forms.forEach(form => {
      if (form.dataset.ajaxFormBound) return; // Already bound
      
      form.addEventListener('submit', handleFormSubmit);
      form.dataset.ajaxFormBound = 'true';
    });
  }

  /**
   * Handle form submission
   * @param {Event} e - Submit event
   */
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('[type="submit"]');
    const endpoint = form.dataset.endpoint || form.action;
    const successMessage = form.dataset.successMessage || FORM_CONFIG.defaultSuccessMessage;
    const resetOnSuccess = form.dataset.resetOnSuccess !== 'false';

    // Clear previous errors
    clearFormErrors(form);

    // Validate form
    const validation = validateForm(form);
    if (!validation.valid) {
      showValidationErrors(form, validation.errors);
      return;
    }

    // Get form data
    const formData = getFormData(form);

    // Show loading state
    if (window.MedikanaUI && submitBtn) {
      window.MedikanaUI.showLoader(submitBtn, 'Отправка...');
      window.MedikanaUI.toggleDisabled(submitBtn, true);
    }

    try {
      // Send request via API
      const response = await window.MedikanaAPI.post(endpoint, formData);

      if (response.success) {
        // Success
        handleFormSuccess(form, successMessage, resetOnSuccess);
      } else {
        // API returned error
        handleFormError(form, response.message || FORM_CONFIG.defaultErrorMessage);
      }
    } catch (error) {
      // Network/JS error
      handleFormError(form, FORM_CONFIG.defaultErrorMessage);
    } finally {
      // Hide loading
      if (window.MedikanaUI && submitBtn) {
        window.MedikanaUI.hideLoader(submitBtn);
        window.MedikanaUI.toggleDisabled(submitBtn, false);
      }
    }
  }

  /**
   * Extract form data as object
   * @param {HTMLFormElement} form - Form element
   * @returns {Object} Form data
   */
  function getFormData(form) {
    const data = {};
    const formElements = form.querySelectorAll('input, select, textarea');

    formElements.forEach(el => {
      // Skip disabled, buttons, file inputs for now
      if (el.disabled || el.type === 'submit' || el.type === 'button' || el.type === 'file') {
        return;
      }

      // Skip unchecked checkboxes
      if (el.type === 'checkbox' && !el.checked) {
        return;
      }

      // Handle multiple checkboxes with same name
      if (el.type === 'checkbox') {
        if (!data[el.name]) {
          data[el.name] = [];
        }
        data[el.name].push(el.value);
        return;
      }

      // Handle radio buttons
      if (el.type === 'radio') {
        if (el.checked) {
          data[el.name] = el.value;
        }
        return;
      }

      // Regular fields
      if (el.name) {
        data[el.name] = el.value.trim();
      }
    });

    return data;
  }

  /**
   * Validate form fields
   * @param {HTMLFormElement} form - Form element
   * @returns {Object} Validation result
   */
  function validateForm(form) {
    const errors = {};
    const fields = form.querySelectorAll('input, select, textarea');

    fields.forEach(field => {
      const name = field.name;
      const value = field.value.trim();
      const required = field.required || field.dataset.required === 'true';

      // Required validation
      if (required && !value) {
        errors[name] = FORM_CONFIG.validationMessages.required;
        return;
      }

      // Skip other validations if empty and not required
      if (!value && !required) {
        return;
      }

      // Type-specific validations
      switch (field.type || field.dataset.validate) {
        case 'tel':
        case 'phone':
          if (value && !isValidPhone(value)) {
            errors[name] = FORM_CONFIG.validationMessages.phone;
          }
          break;

        case 'email':
          if (value && !isValidEmail(value)) {
            errors[name] = FORM_CONFIG.validationMessages.email;
          }
          break;

        case 'text':
        case 'textarea':
          const minLength = parseInt(field.dataset.minLength) || 0;
          if (value && minLength > 0 && value.length < minLength) {
            errors[name] = FORM_CONFIG.validationMessages.minLength(minLength);
          }
          break;
      }
    });

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate phone number (simple check)
   * @param {string} phone - Phone number
   * @returns {boolean} Is valid
   */
  function isValidPhone(phone) {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Check length (10-11 digits for most formats)
    return digits.length >= 10 && digits.length <= 11;
  }

  /**
   * Validate email
   * @param {string} email - Email address
   * @returns {boolean} Is valid
   */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Show validation errors
   * @param {HTMLFormElement} form - Form element
   * @param {Object} errors - Error messages by field name
   */
  function showValidationErrors(form, errors) {
    Object.entries(errors).forEach(([fieldName, message]) => {
      const field = form.querySelector(`[name="${fieldName}"]`);
      if (field) {
        if (window.MedikanaUI) {
          window.MedikanaUI.showInlineError(field, message);
        } else {
          // Fallback
          field.classList.add('has-error');
          field.style.borderColor = '#D72536';
        }
      }
    });

    // Focus first error field
    const firstError = form.querySelector('.has-error, [data-inline-error]');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstError.focus();
    }
  }

  /**
   * Clear all form errors
   * @param {HTMLFormElement} form - Form element
   */
  function clearFormErrors(form) {
    if (window.MedikanaUI) {
      form.querySelectorAll('.has-error, [data-inline-error]').forEach(el => {
        window.MedikanaUI.clearInlineError(el);
      });
    } else {
      form.querySelectorAll('.has-error').forEach(el => {
        el.classList.remove('has-error');
        el.style.borderColor = '';
      });
      form.querySelectorAll('[data-inline-error]').forEach(el => el.remove());
    }
  }

  /**
   * Handle form success
   * @param {HTMLFormElement} form - Form element
   * @param {string} message - Success message
   * @param {boolean} reset - Reset form after success
   */
  function handleFormSuccess(form, message, reset) {
    // Show success notification
    if (window.MedikanaAPI && window.MedikanaAPI.showNotification) {
      window.MedikanaAPI.showNotification(message, 'success');
    } else if (window.MedikanaUI && window.MedikanaUI.showNotification) {
      window.MedikanaUI.showNotification(message, 'success');
    } else {
      alert(message);
    }

    // Reset form
    if (reset) {
      form.reset();
    }

    // Trigger custom event
    form.dispatchEvent(new CustomEvent('form:success', { 
      detail: { form, message } 
    }));

    // Close modal if form is inside one
    const modal = form.closest('.modal-content, [id]');
    if (modal && modal.id) {
      setTimeout(() => {
        if (window.MedikanaUI) {
          window.MedikanaUI.closeModal(modal.id);
        }
      }, 1500);
    }
  }

  /**
   * Handle form error
   * @param {HTMLFormElement} form - Form element
   * @param {string} message - Error message
   */
  function handleFormError(form, message) {
    // Show error notification
    if (window.MedikanaAPI && window.MedikanaAPI.showNotification) {
      window.MedikanaAPI.showNotification(message, 'error');
    } else if (window.MedikanaUI && window.MedikanaUI.showNotification) {
      window.MedikanaUI.showNotification(message, 'error');
    } else {
      alert(message);
    }

    // Trigger custom event
    form.dispatchEvent(new CustomEvent('form:error', { 
      detail: { form, message } 
    }));
  }

  /**
   * Submit form programmatically
   * @param {string|HTMLFormElement} formRef - Form selector or element
   * @param {Object} extraData - Additional data to include
   */
  async function submitForm(formRef, extraData = {}) {
    const form = typeof formRef === 'string' ? document.querySelector(formRef) : formRef;
    if (!form) {
      console.error('Form not found:', formRef);
      return;
    }

    // Merge extra data into form
    if (extraData) {
      Object.entries(extraData).forEach(([key, value]) => {
        let input = form.querySelector(`[name="${key}"]`);
        if (!input) {
          input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          form.appendChild(input);
        }
        input.value = value;
      });
    }

    // Trigger submit
    return handleFormSubmit({ preventDefault: () => {}, target: form });
  }

  // ============================================
  // Initialize on DOM ready
  // ============================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAjaxForms);
  } else {
    initAjaxForms();
  }

  // Re-initialize on dynamic content changes (if needed)
  document.addEventListener('content:loaded', initAjaxForms);

  // ============================================
  // Export Forms module
  // ============================================

  window.MedikanaForms = {
    init: initAjaxForms,
    submit: submitForm,
    validate: validateForm,
    getData: getFormData,
    clearErrors: clearFormErrors,
    isValidPhone,
    isValidEmail,
    config: FORM_CONFIG
  };

})();
