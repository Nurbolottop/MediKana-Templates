/**
 * Medikana API Module - with inline data for file:// protocol
 * Embeds data directly to avoid CORS issues when opening files locally
 */

(function() {
  'use strict';

  // ============================================
  // INLINE DATA (embedded to avoid CORS issues)
  // ============================================

  const ANALYSES_DATA = {
    success: true,
    data: {
      analyses: [
        { id: "A-001", code: "CBC", name: "Общий анализ крови", category: "gematology", price: 1500, old_price: 1800, duration: "1-2 часа", duration_hours: 2, description: "Полная картина крови: лейкоциты, эритроциты, гемоглобин, тромбоциты, СОЭ", is_popular: true, is_available_home: true },
        { id: "A-002", code: "VIT-D", name: "Витамин D", category: "vitamins", price: 3200, duration: "1 день", duration_hours: 24, description: "Определение уровня витамина D в организме", is_popular: true, is_available_home: false },
        { id: "A-003", code: "FERR", name: "Ферритин", category: "vitamins", price: 2800, duration: "1 день", duration_hours: 24, description: "Оценка запасов железа в организме", is_popular: true, is_available_home: false },
        { id: "A-004", code: "TSH", name: "ТТГ (тиреотропный гормон)", category: "hormones", price: 1900, duration: "1 день", duration_hours: 24, description: "Основной тест для оценки функции щитовидной железы", is_popular: true, is_available_home: false },
        { id: "A-005", code: "GLUC", name: "Глюкоза", category: "biochemistry", price: 650, duration: "1-2 часа", duration_hours: 2, description: "Определение уровня сахара в крови", is_popular: false, is_available_home: true },
        { id: "A-006", code: "UA", name: "Общий анализ мочи", category: "urine", price: 1200, duration: "1-2 часа", duration_hours: 2, description: "Комплексная оценка состояния мочевыделительной системы", is_popular: false, is_available_home: true },
        { id: "A-007", code: "CRP", name: "С-реактивный белок", category: "biochemistry", price: 1800, duration: "1-2 часа", duration_hours: 2, description: "Маркер воспаления", is_popular: false, is_available_home: false },
        { id: "A-008", code: "ESR", name: "Скорость оседания эритроцитов (СОЭ)", category: "gematology", price: 450, duration: "1-2 часа", duration_hours: 2, description: "Неспецифический маркер воспаления", is_popular: false, is_available_home: true },
        { id: "A-009", code: "T4", name: "Свободный Т4", category: "hormones", price: 2100, duration: "1 день", duration_hours: 24, description: "Гормон щитовидной железы", is_popular: false, is_available_home: false },
        { id: "A-010", code: "LH", name: "ЛГ (лютеинизирующий гормон)", category: "hormones", price: 1900, duration: "1 день", duration_hours: 24, description: "Гормон репродуктивной системы", is_popular: false, is_available_home: false },
        { id: "A-011", code: "ALT", name: "АЛТ (аланинаминотрансфераза)", category: "biochemistry", price: 750, duration: "1-2 часа", duration_hours: 2, description: "Фермент печени", is_popular: false, is_available_home: true },
        { id: "A-012", code: "CREA", name: "Креатинин", category: "biochemistry", price: 850, duration: "1-2 часа", duration_hours: 2, description: "Основной показатель функции почек", is_popular: false, is_available_home: true }
      ],
      categories: [
        { code: "all", name: "Все анализы", count: 12 },
        { code: "gematology", name: "Гематология", count: 2 },
        { code: "biochemistry", name: "Биохимия", count: 4 },
        { code: "hormones", name: "Гормоны", count: 4 },
        { code: "vitamins", name: "Витамины", count: 2 },
        { code: "urine", name: "Анализы мочи", count: 1 }
      ],
      durations: [
        { code: "fast", name: "Экспресс (до 2 часов)", hours_max: 2 },
        { code: "day", name: "1 день", hours_max: 24 },
        { code: "week", name: "3 дня", hours_max: 72 }
      ]
    },
    message: "",
    errors: null
  };

  const DOCTORS_DATA = {
    success: true,
    data: {
      doctors: [
        { id: "D-001", name: "Айтиева Назгуль", specialty: "терапевт", experience: 15, rating: 4.9, reviews: 234, price: 1500, image: "doctor1.jpg", about: "Врач высшей категории", schedule: {"пн": "09:00-17:00", "вт": "09:00-17:00", "ср": "09:00-17:00", "чт": "09:00-17:00", "пт": "09:00-16:00"} },
        { id: "D-002", name: "Ким Алексей", specialty: "кардиолог", experience: 12, rating: 4.8, reviews: 189, price: 2000, image: "doctor2.jpg", about: "Кандидат медицинских наук", schedule: {"пн": "10:00-18:00", "вт": "10:00-18:00", "ср": "10:00-18:00", "чт": "10:00-18:00", "пт": "10:00-17:00"} },
        { id: "D-003", name: "Исмаилова Саида", specialty: "гинеколог", experience: 18, rating: 4.9, reviews: 312, price: 1800, image: "doctor3.jpg", about: "Врач высшей категории", schedule: {"пн": "09:00-17:00", "вт": "09:00-17:00", "ср": "09:00-17:00", "чт": "09:00-17:00", "пт": "09:00-16:00"} },
        { id: "D-004", name: "Петров Иван", specialty: "эндокринолог", experience: 10, rating: 4.7, reviews: 156, price: 1700, image: "doctor4.jpg", about: "Врач первой категории", schedule: {"пн": "10:00-18:00", "вт": "10:00-18:00", "ср": "10:00-18:00", "чт": "10:00-18:00", "пт": "10:00-17:00"} }
      ],
      specialties: [
        { code: "all", name: "Все специальности", count: 4 },
        { code: "therapist", name: "Терапевт", count: 1 },
        { code: "cardiologist", name: "Кардиолог", count: 1 },
        { code: "gynecologist", name: "Гинеколог", count: 1 },
        { code: "endocrinologist", name: "Эндокринолог", count: 1 }
      ],
      addresses: [
        { id: 1, name: "ул. Байтик Баатыра 126" },
        { id: 2, name: "ул. Токтогула 123" },
        { id: 3, name: "ул. Киевская 62" }
      ]
    },
    message: "",
    errors: null
  };

  const HOME_VISIT_DATA = {
    success: true,
    data: {
      services: [
        { id: "HV-001", name: "Взятие крови", price: 1500, duration: "20 мин", description: "Профессиональное взятие венозной или капиллярной крови" },
        { id: "HV-002", name: "ЭКГ", price: 2000, duration: "15 мин", description: "Электрокардиография на дому" },
        { id: "HV-003", name: "Консультация врача", price: 3500, duration: "45 мин", description: "Осмотр и консультация терапевта на дому" }
      ],
      pricing: [
        { zone: "Зона 1 (центр)", price: 500, time: "до 30 мин" },
        { zone: "Зона 2 (спальный р-н)", price: 800, time: "30-60 мин" },
        { zone: "Зона 3 (пригород)", price: 1500, time: "60+ мин" }
      ]
    },
    message: "",
    errors: null
  };

  // Configuration
  const API_CONFIG = {
    // Base URL for API endpoints - change this when connecting to real backend
    baseUrl: window.location.origin,
    // Mock data folder path (relative to site root)
    mockPath: '/assets/data/',
    // Enable mock mode for development (set to false when using real API)
    mockMode: true,
    // Default headers
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    // Request timeout in ms
    timeout: 10000
  };

  // Interceptors storage
  const interceptors = {
    request: [],
    response: []
  };

  /**
   * Build query string from params object
   * @param {Object} params - URL parameters
   * @returns {string} Query string
   */
  function buildQueryString(params = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? '?' + queryString : '';
  }

  /**
   * Handle API errors consistently
   * @param {Error|Response} error - Error object or fetch Response
   * @returns {Object} Standardized error object
   */
  function handleApiError(error) {
    console.error('API Error:', error);
    
    let errorData = {
      success: false,
      message: 'Произошла ошибка. Попробуйте позже.',
      status: null,
      details: null
    };

    if (error instanceof Response) {
      errorData.status = error.status;
      
      switch (error.status) {
        case 400:
          errorData.message = 'Некорректный запрос. Проверьте данные.';
          break;
        case 401:
          errorData.message = 'Требуется авторизация.';
          break;
        case 403:
          errorData.message = 'Доступ запрещен.';
          break;
        case 404:
          errorData.message = 'Запрашиваемые данные не найдены.';
          break;
        case 422:
          errorData.message = 'Ошибка валидации данных.';
          break;
        case 500:
          errorData.message = 'Ошибка сервера. Попробуйте позже.';
          break;
        default:
          errorData.message = `Ошибка ${error.status}: ${error.statusText}`;
      }
    } else if (error.name === 'AbortError') {
      errorData.message = 'Запрос отменен из-за таймаута.';
      errorData.status = 'timeout';
    } else if (error.message) {
      errorData.message = error.message;
    }

    return errorData;
  }

  /**
   * Add request interceptor
   * @param {Function} fn - Interceptor function (config) => config
   * @returns {Function} Remove interceptor function
   */
  function addRequestInterceptor(fn) {
    interceptors.request.push(fn);
    return () => {
      const index = interceptors.request.indexOf(fn);
      if (index > -1) interceptors.request.splice(index, 1);
    };
  }

  /**
   * Add response interceptor
   * @param {Function} fn - Interceptor function (response) => response
   * @returns {Function} Remove interceptor function
   */
  function addResponseInterceptor(fn) {
    interceptors.response.push(fn);
    return () => {
      const index = interceptors.response.indexOf(fn);
      if (index > -1) interceptors.response.splice(index, 1);
    };
  }

  /**
   * Run request interceptors
   * @param {Object} config - Request config
   * @returns {Object} Modified config
   */
  async function runRequestInterceptors(config) {
    let result = config;
    for (const interceptor of interceptors.request) {
      try {
        result = await interceptor(result);
      } catch (error) {
        console.error('[API] Request interceptor error:', error);
        throw error;
      }
    }
    return result;
  }

  /**
   * Run response interceptors
   * @param {Object} response - Response data
   * @returns {Object} Modified response
   */
  async function runResponseInterceptors(response) {
    let result = response;
    for (const interceptor of interceptors.response) {
      try {
        result = await interceptor(result);
      } catch (error) {
        console.error('[API] Response interceptor error:', error);
        throw error;
      }
    }
    return result;
  }

  /**
   * Handle API response with new standardized format
   * @param {Object} response - API response
   * @returns {Object} Normalized response
   */
  function normalizeResponse(response) {
    // If already in standard format
    if (response && typeof response.success === 'boolean') {
      return {
        success: response.success,
        data: response.data || null,
        message: response.message || '',
        errors: response.errors || null
      };
    }

    // Wrap raw data in standard format
    return {
      success: true,
      data: response,
      message: '',
      errors: null
    };
  }

  /**
   * Show global notification
   * @param {string} message - Notification text
   * @param {string} type - Notification type: 'info', 'success', 'error', 'warning'
   * @param {number} duration - Duration in ms (0 for persistent)
   */
  function showGlobalNotification(message, type = 'info', duration = 3000) {
    // Use UI module if available
    if (window.MedikanaUI && window.MedikanaUI.showNotification) {
      window.MedikanaUI.showNotification(message, type, duration);
      return;
    }

    // Fallback notification
    const notification = document.createElement('div');
    notification.className = `global-notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideInRight 0.3s ease;
    `;

    // Type-specific colors
    const colors = {
      info: { bg: '#0F6B66', text: '#fff' },
      success: { bg: '#10b981', text: '#fff' },
      error: { bg: '#D72536', text: '#fff' },
      warning: { bg: '#f59e0b', text: '#fff' }
    };

    const color = colors[type] || colors.info;
    notification.style.background = color.bg;
    notification.style.color = color.text;

    // Add animation styles
    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOutRight {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(100%); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    if (duration > 0) {
      setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
      }, duration);
    }

    return notification;
  }

  /**
   * Build full URL (handles mock mode)
   * @param {string} url - Endpoint URL or path
   * @returns {string} Full URL
   */
  function buildUrl(url) {
    // If it's already a full URL, return it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // If mock mode and url ends with .json, use mock path
    if (API_CONFIG.mockMode && url.endsWith('.json')) {
      return API_CONFIG.mockPath + url.replace(/^\//, '');
    }

    // Otherwise, prepend base URL
    return API_CONFIG.baseUrl + (url.startsWith('/') ? '' : '/') + url;
  }

  /**
   * Make HTTP request with timeout and interceptors
   * @param {string} url - Endpoint URL
   * @param {Object} options - Fetch options
   * @returns {Promise} Response data
   */
  async function makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    try {
      let fullUrl = buildUrl(url);
      let fetchOptions = {
        ...options,
        signal: controller.signal,
        headers: {
          ...API_CONFIG.headers,
          ...options.headers
        }
      };

      // Run request interceptors
      const config = await runRequestInterceptors({
        url: fullUrl,
        options: fetchOptions
      });

      const response = await fetch(config.url, config.options);

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        throw response;
      }

      // Parse response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Run response interceptors
      data = await runResponseInterceptors(data);

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // ============================================
  // Public API Methods
  // ============================================

  /**
   * GET request
   * @param {string} url - Endpoint URL
   * @param {Object} params - Query parameters
   * @returns {Promise} Response data
   */
  async function apiGet(url, params = {}) {
    try {
      // Check if using file:// protocol - use inline data
      if (window.location.protocol === 'file:') {
        const filename = url.split('/').pop();
        let inlineData = null;
        
        if (filename === 'analyses.json') {
          inlineData = ANALYSES_DATA;
        } else if (filename === 'doctors.json') {
          inlineData = DOCTORS_DATA;
        } else if (filename === 'home-visit.json') {
          inlineData = HOME_VISIT_DATA;
        }
        
        if (inlineData) {
          await simulateDelay(300); // Simulate network delay
          return { success: true, data: inlineData.data };
        }
      }
      
      const queryString = buildQueryString(params);
      const data = await makeRequest(url + queryString, { method: 'GET' });
      return { success: true, data };
    } catch (error) {
      // Fallback to inline data on error
      const filename = url.split('/').pop();
      if (filename === 'analyses.json') {
        return { success: true, data: ANALYSES_DATA.data };
      } else if (filename === 'doctors.json') {
        return { success: true, data: DOCTORS_DATA.data };
      } else if (filename === 'home-visit.json') {
        return { success: true, data: HOME_VISIT_DATA.data };
      }
      return handleApiError(error);
    }
  }

  /**
   * POST request
   * @param {string} url - Endpoint URL
   * @param {Object} data - Request body
   * @returns {Promise} Response data
   */
  async function apiPost(url, data = {}) {
    try {
      const response = await makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return { success: true, data: response };
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * PUT request
   * @param {string} url - Endpoint URL
   * @param {Object} data - Request body
   * @returns {Promise} Response data
   */
  async function apiPut(url, data = {}) {
    try {
      const response = await makeRequest(url, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return { success: true, data: response };
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * DELETE request
   * @param {string} url - Endpoint URL
   * @returns {Promise} Response data
   */
  async function apiDelete(url) {
    try {
      const response = await makeRequest(url, { method: 'DELETE' });
      return { success: true, data: response };
    } catch (error) {
      return handleApiError(error);
    }
  }

  // ============================================
  // Mock Data Helpers
  // ============================================

  /**
   * Load mock data from JSON file
   * @param {string} filename - JSON filename (e.g., 'doctors.json')
   * @returns {Promise} Parsed JSON data
   */
  async function loadMockData(filename) {
    return await apiGet(filename);
  }

  /**
   * Simulate API delay for realistic UX
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise} Resolves after delay
   */
  function simulateDelay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================
  // Export API
  // ============================================

  window.MedikanaAPI = {
    get: apiGet,
    post: apiPost,
    put: apiPut,
    delete: apiDelete,
    buildQueryString,
    handleApiError,
    showNotification: showGlobalNotification,
    loadMockData,
    simulateDelay,
    config: API_CONFIG,
    // Interceptors
    addRequestInterceptor,
    addResponseInterceptor,
    // Response normalization
    normalizeResponse
  };

})();
