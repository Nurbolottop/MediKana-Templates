/**
 * AppStore - Simple global state management
 * Provides reactive state with get/set and event notifications
 */

(function() {
  'use strict';

  // Private state storage
  const state = {
    // Cart state
    cart: [],
    cartTotal: 0,

    // Selection state
    selectedBranch: null,
    selectedDoctor: null,
    selectedSlot: null,

    // User state
    user: null,
    isAuthenticated: false,

    // UI state
    currentPage: window.location.pathname,
    mobileMenuOpen: false,
    activeModal: null
  };

  // Event listeners storage
  const listeners = {};

  /**
   * Get value from state
   * @param {string} key - State key (supports dot notation: 'cart.items')
   * @returns {any} Value or undefined
   */
  function get(key) {
    if (!key) return { ...state };

    const keys = key.split('.');
    let value = state;

    for (const k of keys) {
      if (value === null || value === undefined) return undefined;
      value = value[k];
    }

    // Return deep copy for objects to prevent direct mutation
    if (typeof value === 'object' && value !== null) {
      return JSON.parse(JSON.stringify(value));
    }

    return value;
  }

  /**
   * Set value in state
   * @param {string} key - State key (supports dot notation)
   * @param {any} value - Value to set
   * @param {boolean} silent - If true, don't trigger events
   */
  function set(key, value, silent = false) {
    const keys = key.split('.');
    let target = state;

    // Navigate to the parent of the target key
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in target) || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }

    const finalKey = keys[keys.length - 1];
    const oldValue = target[finalKey];

    // Set new value
    target[finalKey] = value;

    // Trigger events unless silent
    if (!silent) {
      emit(key, value, oldValue);
      emit('change', { key, value, oldValue });
    }
  }

  /**
   * Update nested object (shallow merge)
   * @param {string} key - State key
   * @param {Object} partial - Partial object to merge
   */
  function update(key, partial) {
    const current = get(key);
    if (typeof current === 'object' && current !== null) {
      set(key, { ...current, ...partial });
    } else {
      set(key, partial);
    }
  }

  /**
   * Remove key from state
   * @param {string} key - State key to remove
   */
  function remove(key) {
    const keys = key.split('.');
    let target = state;

    for (let i = 0; i < keys.length - 1; i++) {
      target = target[keys[i]];
      if (!target) return;
    }

    const finalKey = keys[keys.length - 1];
    const oldValue = target[finalKey];
    delete target[finalKey];

    emit(key, undefined, oldValue);
    emit('change', { key, value: undefined, oldValue });
  }

  /**
   * Subscribe to state changes
   * @param {string} key - State key to watch (or 'change' for all)
   * @param {Function} callback - Handler function (value, oldValue, key) => {}
   * @returns {Function} Unsubscribe function
   */
  function subscribe(key, callback) {
    if (!listeners[key]) {
      listeners[key] = [];
    }

    listeners[key].push(callback);

    // Return unsubscribe function
    return () => {
      const index = listeners[key].indexOf(callback);
      if (index > -1) {
        listeners[key].splice(index, 1);
      }
    };
  }

  /**
   * Emit event to subscribers
   * @param {string} key - Event key
   * @param {any} value - New value
   * @param {any} oldValue - Previous value
   */
  function emit(key, value, oldValue) {
    // Emit for specific key
    if (listeners[key]) {
      listeners[key].forEach(cb => {
        try {
          cb(value, oldValue, key);
        } catch (error) {
          console.error(`[AppStore] Error in subscriber for "${key}":`, error);
        }
      });
    }

    // Emit for parent keys (for nested updates)
    const keyParts = key.split('.');
    for (let i = 1; i < keyParts.length; i++) {
      const parentKey = keyParts.slice(0, i).join('.');
      if (listeners[parentKey]) {
        const parentValue = get(parentKey);
        listeners[parentKey].forEach(cb => {
          try {
            cb(parentValue, null, parentKey);
          } catch (error) {
            console.error(`[AppStore] Error in subscriber for "${parentKey}":`, error);
          }
        });
      }
    }
  }

  /**
   * Toggle boolean value
   * @param {string} key - State key
   */
  function toggle(key) {
    const current = get(key);
    if (typeof current === 'boolean') {
      set(key, !current);
    }
  }

  /**
   * Push to array
   * @param {string} key - Array state key
   * @param {any} item - Item to add
   */
  function push(key, item) {
    const arr = get(key) || [];
    if (Array.isArray(arr)) {
      set(key, [...arr, item]);
    }
  }

  /**
   * Remove from array by predicate
   * @param {string} key - Array state key
   * @param {Function|string} predicate - Function or id to match
   */
  function filter(key, predicate) {
    const arr = get(key) || [];
    if (!Array.isArray(arr)) return;

    let newArr;
    if (typeof predicate === 'function') {
      newArr = arr.filter(predicate);
    } else {
      // Assume it's an id
      newArr = arr.filter(item => item && item.id !== predicate);
    }

    set(key, newArr);
  }

  /**
   * Find item in array state
   * @param {string} key - Array state key
   * @param {Function} predicate - Match function
   * @returns {any} Found item or undefined
   */
  function find(key, predicate) {
    const arr = get(key) || [];
    if (!Array.isArray(arr)) return undefined;
    return arr.find(predicate);
  }

  /**
   * Reset state to initial values
   * @param {boolean} confirm - Must pass true to proceed
   */
  function reset(confirm = false) {
    if (!confirm) {
      console.warn('[AppStore] Pass true to confirm reset');
      return;
    }

    // Clear all state
    Object.keys(state).forEach(key => {
      if (Array.isArray(state[key])) {
        state[key] = [];
      } else if (typeof state[key] === 'object' && state[key] !== null) {
        state[key] = {};
      } else if (typeof state[key] === 'boolean') {
        state[key] = false;
      } else {
        state[key] = null;
      }
    });

    emit('change', { key: '*', value: null, oldValue: null });
  }

  /**
   * Get state snapshot (for debugging)
   * @returns {Object} Deep copy of state
   */
  function snapshot() {
    return JSON.parse(JSON.stringify(state));
  }

  /**
   * Initialize state from localStorage
   * @param {string[]} keys - Keys to hydrate
   */
  function hydrate(keys) {
    keys.forEach(key => {
      try {
        const stored = localStorage.getItem(`appstore_${key}`);
        if (stored) {
          set(key, JSON.parse(stored), true);
        }
      } catch (error) {
        console.error(`[AppStore] Failed to hydrate "${key}":`, error);
      }
    });
  }

  /**
   * Persist state to localStorage
   * @param {string[]} keys - Keys to persist
   */
  function persist(keys) {
    keys.forEach(key => {
      try {
        const value = get(key);
        localStorage.setItem(`appstore_${key}`, JSON.stringify(value));
      } catch (error) {
        console.error(`[AppStore] Failed to persist "${key}":`, error);
      }
    });
  }

  // Auto-persist cart changes
  subscribe('cart', (cart) => {
    try {
      localStorage.setItem('medikana_cart', JSON.stringify(cart));
    } catch (error) {
      console.error('[AppStore] Failed to persist cart:', error);
    }
  });

  // Auto-hydrate cart on init
  try {
    const savedCart = localStorage.getItem('medikana_cart');
    if (savedCart) {
      state.cart = JSON.parse(savedCart);
    }
  } catch (error) {
    console.error('[AppStore] Failed to hydrate cart:', error);
  }

  // ============================================
  // Export
  // ============================================

  window.AppStore = {
    get,
    set,
    update,
    remove,
    toggle,
    push,
    filter,
    find,
    subscribe,
    reset,
    snapshot,
    hydrate,
    persist
  };

})();
