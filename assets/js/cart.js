/**
 * MedikanaCart - Shopping cart functionality with localStorage persistence
 */

(function() {
  'use strict';

  // Cart storage key
  const STORAGE_KEY = 'medikana_cart_v1';

  // Private cart data
  let cart = [];

  /**
   * Load cart from localStorage
   */
  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        cart = JSON.parse(stored);
        emit('load', cart);
      }
    } catch (error) {
      console.error('[Cart] Failed to load from storage:', error);
      cart = [];
    }
  }

  /**
   * Save cart to localStorage
   */
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('[Cart] Failed to save to storage:', error);
    }
  }

  /**
   * Add item to cart
   * @param {Object} item - Item to add
   * @param {string} item.id - Unique item ID
   * @param {string} item.type - Item type (analysis, doctor, service)
 * @param {string} item.name - Item name
   * @param {number} item.price - Item price
   * @param {number} item.quantity - Quantity (default: 1)
   * @returns {Object} Added/updated item
   */
  function addItem(item) {
    if (!item || !item.id) {
      console.error('[Cart] Cannot add item without id');
      return null;
    }

    // Check if item already exists
    const existingIndex = cart.findIndex(i => i.id === item.id);

    if (existingIndex > -1) {
      // Update quantity
      cart[existingIndex].quantity += item.quantity || 1;
      emit('update', cart[existingIndex]);
    } else {
      // Add new item
      const newItem = {
        id: item.id,
        type: item.type || 'analysis',
        name: item.name || 'Unknown Item',
        price: parseFloat(item.price) || 0,
        quantity: item.quantity || 1,
        addedAt: new Date().toISOString(),
        ...item
      };
      cart.push(newItem);
      emit('add', newItem);
    }

    saveToStorage();
    emit('change', getCart());

    return cart[existingIndex > -1 ? existingIndex : cart.length - 1];
  }

  /**
   * Remove item from cart
   * @param {string} itemId - Item ID to remove
   * @returns {boolean} Success
   */
  function removeItem(itemId) {
    const index = cart.findIndex(i => i.id === itemId);

    if (index > -1) {
      const removed = cart.splice(index, 1)[0];
      saveToStorage();
      emit('remove', removed);
      emit('change', getCart());
      return true;
    }

    return false;
  }

  /**
   * Update item quantity
   * @param {string} itemId - Item ID
   * @param {number} quantity - New quantity
   * @returns {Object|null} Updated item
   */
  function updateQuantity(itemId, quantity) {
    const item = cart.find(i => i.id === itemId);

    if (!item) {
      console.error(`[Cart] Item ${itemId} not found`);
      return null;
    }

    if (quantity <= 0) {
      removeItem(itemId);
      return null;
    }

    item.quantity = quantity;
    saveToStorage();
    emit('update', item);
    emit('change', getCart());

    return item;
  }

  /**
   * Increment item quantity
   * @param {string} itemId - Item ID
   */
  function increment(itemId) {
    const item = cart.find(i => i.id === itemId);
    if (item) {
      updateQuantity(itemId, item.quantity + 1);
    }
  }

  /**
   * Decrement item quantity
   * @param {string} itemId - Item ID
   */
  function decrement(itemId) {
    const item = cart.find(i => i.id === itemId);
    if (item) {
      updateQuantity(itemId, item.quantity - 1);
    }
  }

  /**
   * Get cart contents
   * @returns {Object} Cart data with items, count, and total
   */
  function getCart() {
    const items = [...cart];
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
      items,
      count,
      total,
      isEmpty: items.length === 0
    };
  }

  /**
   * Get single item from cart
   * @param {string} itemId - Item ID
   * @returns {Object|null}
   */
  function getItem(itemId) {
    return cart.find(i => i.id === itemId) || null;
  }

  /**
   * Check if item exists in cart
   * @param {string} itemId - Item ID
   * @returns {boolean}
   */
  function hasItem(itemId) {
    return cart.some(i => i.id === itemId);
  }

  /**
   * Clear entire cart
   */
  function clear() {
    cart = [];
    saveToStorage();
    emit('clear', null);
    emit('change', getCart());
  }

  /**
   * Get cart summary for display
   * @returns {Object} Summary object
   */
  function getSummary() {
    const { count, total, isEmpty } = getCart();

    return {
      count,
      total: total.toLocaleString('ru-RU'),
      totalRaw: total,
      isEmpty,
      text: isEmpty ? 'Корзина пуста' : `${count} ${pluralize(count, 'товар', 'товара', 'товаров')}`
    };
  }

  /**
   * Apply promo code
   * @param {string} code - Promo code
   * @returns {Object} Result with success and discount
   */
  function applyPromo(code) {
    // Mock promo codes
    const promos = {
      'COMPLEX20': { discount: 0.20, type: 'percent', max: 5000 },
      'MEDICANA10': { discount: 0.10, type: 'percent', max: 3000 },
      'FIRST': { discount: 500, type: 'fixed' }
    };

    const promo = promos[code.toUpperCase()];

    if (!promo) {
      return { success: false, error: 'Промокод не найден' };
    }

    const { total } = getCart();

    let discount = 0;
    if (promo.type === 'percent') {
      discount = total * promo.discount;
      if (promo.max && discount > promo.max) {
        discount = promo.max;
      }
    } else {
      discount = promo.discount;
    }

    // Store applied promo
    if (window.AppStore) {
      window.AppStore.set('cartPromo', { code: code.toUpperCase(), discount });
    }

    return {
      success: true,
      code: code.toUpperCase(),
      discount: Math.round(discount),
      newTotal: Math.round(total - discount)
    };
  }

  /**
   * Remove applied promo code
   */
  function removePromo() {
    if (window.AppStore) {
      window.AppStore.remove('cartPromo');
    }
  }

  // Event system
  const listeners = {};

  function on(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
    return () => off(event, callback);
  }

  function off(event, callback) {
    if (!listeners[event]) return;
    const index = listeners[event].indexOf(callback);
    if (index > -1) listeners[event].splice(index, 1);
  }

  function emit(event, data) {
    if (!listeners[event]) return;
    listeners[event].forEach(cb => {
      try {
        cb(data);
      } catch (error) {
        console.error(`[Cart] Error in ${event} listener:`, error);
      }
    });
  }

  /**
   * Update cart badge in UI
   */
  function updateBadge() {
    const { count } = getCart();
    const badges = document.querySelectorAll('[data-cart-badge], .cart-badge, .cart-count');

    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  /**
   * Render cart contents to container
   * @param {string|HTMLElement} container - Container selector or element
   */
  function render(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    const { items, total, isEmpty } = getCart();

    if (isEmpty) {
      el.innerHTML = `
        <div class="cart-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <p>Ваша корзина пуста</p>
        </div>
      `;
      return;
    }

    const itemsHtml = items.map(item => `
      <div class="cart-item" data-item-id="${item.id}">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${item.price.toLocaleString('ru-RU')} ₽</div>
        </div>
        <div class="cart-item-controls">
          <button class="cart-btn-decrement" data-action="cart-decrement" data-item-id="${item.id}">−</button>
          <span class="cart-item-quantity">${item.quantity}</span>
          <button class="cart-btn-increment" data-action="cart-increment" data-item-id="${item.id}">+</button>
        </div>
        <button class="cart-item-remove" data-action="remove-from-cart" data-item-id="${item.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `).join('');

    el.innerHTML = `
      <div class="cart-items">${itemsHtml}</div>
      <div class="cart-footer">
        <div class="cart-total">
          <span>Итого:</span>
          <strong>${total.toLocaleString('ru-RU')} ₽</strong>
        </div>
        <button class="btn btn-primary btn-block" data-action="checkout">Оформить заказ</button>
      </div>
    `;
  }

  /**
   * Checkout cart
   * @returns {Promise<Object>} Checkout result
   */
  async function checkout() {
    const { items, total } = getCart();

    if (items.length === 0) {
      return { success: false, error: 'Корзина пуста' };
    }

    // Get promo discount if applied
    let discount = 0;
    if (window.AppStore) {
      const promo = window.AppStore.get('cartPromo');
      if (promo) discount = promo.discount;
    }

    const payload = {
      items: items.map(i => ({ id: i.id, quantity: i.quantity })),
      total: total - discount,
      discount: discount
    };

    // In real app, send to API
    console.log('[Cart] Checkout payload:', payload);

    // Simulate API call
    if (window.MedikanaAPI) {
      try {
        const response = await window.MedikanaAPI.post('/api/orders', payload);
        if (response.success) {
          clear();
          return { success: true, orderId: response.data?.orderId };
        }
        return { success: false, error: response.message };
      } catch (error) {
        return { success: false, error: 'Ошибка оформления заказа' };
      }
    }

    // Fallback
    clear();
    return { success: true, orderId: 'ORD-' + Date.now() };
  }

  // Helper: pluralization
  function pluralize(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;

    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
  }

  // Register cart actions with MedikanaActions
  if (window.MedikanaActions) {
    window.MedikanaActions.register('cart-increment', (el, e, data) => {
      increment(data.itemId);
      updateBadge();
    });

    window.MedikanaActions.register('cart-decrement', (el, e, data) => {
      decrement(data.itemId);
      updateBadge();
    });

    window.MedikanaActions.register('cart-clear', () => {
      clear();
      updateBadge();
    });

    window.MedikanaActions.register('checkout', () => {
      checkout().then(result => {
        if (result.success) {
          if (window.MedikanaAPI) {
            window.MedikanaAPI.showNotification(`Заказ ${result.orderId} оформлен!`, 'success');
          }
        } else {
          if (window.MedikanaAPI) {
            window.MedikanaAPI.showNotification(result.error, 'error');
          }
        }
      });
    });
  }

  // Update badge on any change
  on('change', updateBadge);

  // Initialize on load
  loadFromStorage();
  updateBadge();

  // ============================================
  // Export
  // ============================================

  window.MedikanaCart = {
    addItem,
    removeItem,
    updateQuantity,
    increment,
    decrement,
    getCart,
    getItem,
    hasItem,
    clear,
    getSummary,
    applyPromo,
    removePromo,
    checkout,
    render,
    updateBadge,
    on,
    off
  };

})();
