/**
 * Results AJAX - Get test results via AJAX
 */

(function() {
  'use strict';

  // State
  let results = [];
  let currentResult = null;

  // DOM elements
  let elements = {};

  /**
   * Initialize results page
   */
  function initResultsPage() {
    cacheElements();
    bindEvents();
    loadResults();
  }

  /**
   * Cache DOM elements
   */
  function cacheElements() {
    elements = {
      searchForm: document.querySelector('#results-search-form'),
      orderInput: document.querySelector('[name="order_id"]'),
      dobInput: document.querySelector('[name="date_of_birth"]'),
      resultsContainer: document.querySelector('#results-container'),
      resultsEmpty: document.querySelector('#results-empty'),
      resultsError: document.querySelector('#results-error'),
      resultDetail: document.querySelector('#result-detail')
    };
  }

  /**
   * Bind events
   */
  function bindEvents() {
    elements.searchForm?.addEventListener('submit', handleResultsSearch);
  }

  /**
   * Load results from mock data
   */
  async function loadResults() {
    try {
      const response = await window.MedikanaAPI.get('results.json');
      if (response.success && response.data) {
        results = response.data.results || [];
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  }

  /**
   * Handle results search
   */
  async function handleResultsSearch(e) {
    e.preventDefault();

    const orderId = elements.orderInput?.value.trim().toUpperCase();
    const dob = elements.dobInput?.value;

    if (!orderId || !dob) {
      showError('Введите номер заказа и дату рождения');
      return;
    }

    // Show loading
    if (window.MedikanaUI && elements.resultsContainer) {
      window.MedikanaUI.showLoader(elements.resultsContainer, 'Поиск результатов...');
    }

    // Simulate API delay
    await window.MedikanaAPI.simulateDelay(800);

    // Search in mock data
    const result = results.find(r => 
      r.order_id === orderId && r.date_of_birth === dob
    );

    // Hide loading
    if (window.MedikanaUI && elements.resultsContainer) {
      window.MedikanaUI.hideLoader(elements.resultsContainer);
    }

    if (result) {
      currentResult = result;
      renderResultSuccess(result);
    } else {
      renderResultNotFound();
    }
  }

  /**
   * Render successful result
   */
  function renderResultSuccess(result) {
    hideAllStates();

    if (!elements.resultDetail) {
      // Create result detail container if not exists
      const container = document.createElement('div');
      container.id = 'result-detail';
      container.className = 'result-detail';
      elements.resultsContainer?.appendChild(container);
      elements.resultDetail = container;
    }

    const statusBadge = result.status === 'ready' 
      ? '<span class="badge badge-success">Готов</span>'
      : '<span class="badge badge-warning">В обработке</span>';

    let analysesHtml = '';
    if (result.analyses && result.analyses.length > 0) {
      analysesHtml = result.analyses.map(analysis => {
        const valuesHtml = analysis.values?.map(v => `
          <tr class="${v.status}">
            <td>${v.name}</td>
            <td><strong>${v.value}</strong></td>
            <td>${v.unit}</td>
            <td>${v.reference}</td>
          </tr>
        `).join('') || '';

        return `
          <div class="analysis-result-block">
            <h4>${analysis.name}</h4>
            <div class="result-status">${analysis.result}</div>
            ${valuesHtml ? `
              <table class="results-table">
                <thead>
                  <tr>
                    <th>Показатель</th>
                    <th>Результат</th>
                    <th>Ед. изм.</th>
                    <th>Референс</th>
                  </tr>
                </thead>
                <tbody>${valuesHtml}</tbody>
              </table>
            ` : '<p>Результаты в обработке...</p>'}
          </div>
        `;
      }).join('');
    }

    elements.resultDetail.innerHTML = `
      <div class="result-card">
        <div class="result-header">
          <h3>Результаты анализов</h3>
          ${statusBadge}
        </div>
        <div class="result-info">
          <p><strong>Пациент:</strong> ${result.patient_name}</p>
          <p><strong>Дата сдачи:</strong> ${formatDate(result.analysis_date)}</p>
          <p><strong>Номер заказа:</strong> ${result.order_id}</p>
        </div>
        <div class="analyses-list">
          ${analysesHtml}
        </div>
        <div class="result-actions">
          <button class="btn btn-primary" data-action="download-result" data-order-id="${result.order_id}">
            Скачать PDF
          </button>
          <button class="btn btn-outline" data-action="print-result">
            Печать
          </button>
        </div>
      </div>
    `;

    elements.resultDetail.classList.remove('hidden');

    // Add styles if needed
    addResultsStyles();
  }

  /**
   * Render not found state
   */
  function renderResultNotFound() {
    hideAllStates();

    if (!elements.resultsEmpty) {
      const empty = document.createElement('div');
      empty.id = 'results-empty';
      empty.className = 'results-empty';
      elements.resultsContainer?.appendChild(empty);
      elements.resultsEmpty = empty;
    }

    elements.resultsEmpty.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <h3>Результаты не найдены</h3>
        <p>Проверьте правильность введенного номера заказа и даты рождения.</p>
        <p class="hint">Номер заказа указан в чеке или SMS-сообщении.</p>
      </div>
    `;

    elements.resultsEmpty.classList.remove('hidden');
  }

  /**
   * Render error state
   */
  function renderResultError(message) {
    hideAllStates();

    if (!elements.resultsError) {
      const error = document.createElement('div');
      error.id = 'results-error';
      error.className = 'results-error';
      elements.resultsContainer?.appendChild(error);
      elements.resultsError = error;
    }

    elements.resultsError.innerHTML = `
      <div class="error-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#D72536" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3>Ошибка</h3>
        <p>${message}</p>
        <button class="btn btn-outline" onclick="location.reload()">Попробовать снова</button>
      </div>
    `;

    elements.resultsError.classList.remove('hidden');
  }

  /**
   * Hide all result states
   */
  function hideAllStates() {
    elements.resultDetail?.classList.add('hidden');
    elements.resultsEmpty?.classList.add('hidden');
    elements.resultsError?.classList.add('hidden');
  }

  /**
   * Add results styles
   */
  function addResultsStyles() {
    if (document.querySelector('#results-styles')) return;

    const style = document.createElement('style');
    style.id = 'results-styles';
    style.textContent = `
      .result-detail { margin-top: 24px; }
      .result-card {
        background: #fff;
        border-radius: 12px;
        padding: 24px;
        border: 1px solid #e5e7eb;
      }
      .result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e5e7eb;
      }
      .result-header h3 { margin: 0; font-size: 20px; }
      .result-info p { margin: 4px 0; color: #6b7280; }
      .analysis-result-block {
        margin: 24px 0;
        padding: 16px;
        background: #f9fafb;
        border-radius: 8px;
      }
      .analysis-result-block h4 {
        margin: 0 0 8px 0;
        font-size: 16px;
      }
      .result-status {
        color: #0F6B66;
        font-weight: 500;
        margin-bottom: 16px;
      }
      .results-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }
      .results-table th,
      .results-table td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
      }
      .results-table th {
        font-weight: 600;
        color: #374151;
      }
      .results-table tr.normal td { color: #10b981; }
      .results-table tr.high td,
      .results-table tr.low td { color: #D72536; }
      .result-actions {
        display: flex;
        gap: 12px;
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid #e5e7eb;
      }
      .empty-state, .error-state {
        text-align: center;
        padding: 48px 20px;
      }
      .empty-state h3, .error-state h3 {
        font-size: 20px;
        margin: 16px 0 8px;
        color: #374151;
      }
      .empty-state p, .error-state p {
        color: #6b7280;
        margin: 0;
      }
      .empty-state .hint {
        font-size: 14px;
        color: #9ca3af;
        margin-top: 8px;
      }
      .hidden { display: none !important; }
      .badge {
        display: inline-flex;
        padding: 4px 12px;
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 600;
      }
      .badge-success { background: #d1fae5; color: #065f46; }
      .badge-warning { background: #fef3c7; color: #92400e; }
    `;
    document.head.appendChild(style);
  }

  /**
   * Show error
   */
  function showError(message) {
    if (window.MedikanaAPI && window.MedikanaAPI.showNotification) {
      window.MedikanaAPI.showNotification(message, 'error');
    } else if (window.MedikanaUI && window.MedikanaUI.showNotification) {
      window.MedikanaUI.showNotification(message, 'error');
    }
  }

  /**
   * Format date
   */
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // ============================================
  // Initialize
  // ============================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResultsPage);
  } else {
    if (document.querySelector('#results-search-form') ||
        document.querySelector('[data-page="results"]')) {
      initResultsPage();
    }
  }

  // ============================================
  // Export
  // ============================================

  window.MedikanaResults = {
    init: initResultsPage,
    search: handleResultsSearch,
    getCurrentResult: () => currentResult
  };

})();
