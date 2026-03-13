/**
 * Analysis Detail Page JavaScript
 * Handles smooth scrolling, anchor navigation highlighting, and sticky behaviors
 */

(function() {
  'use strict';

  // DOM Elements
  const anchorNav = document.querySelector('.analysis-anchor-nav');
  const anchorLinks = document.querySelectorAll('.analysis-anchor-nav a[href^="#"]');
  const sections = document.querySelectorAll('section[id]');
  const summaryCard = document.querySelector('.analysis-summary');
  const header = document.querySelector('.header');
  const tabButtons = document.querySelectorAll('.analysis-tab-btn[data-tab]');

  /**
   * Initialize the analysis detail module
   */
  function init() {
    bindEvents();
    highlightActiveNavOnLoad();
    initTabs();
  }

  /**
   * Bind all event listeners
   */
  function bindEvents() {
    // Smooth scroll for anchor links
    anchorLinks.forEach(link => {
      link.addEventListener('click', handleAnchorClick);
    });

    // Scroll spy for highlighting active nav item
    window.addEventListener('scroll', debounce(handleScroll, 50), { passive: true });

    // Handle sticky summary card offset on mobile
    window.addEventListener('resize', debounce(handleResize, 100), { passive: true });

    // Tab clicks
    tabButtons.forEach(btn => {
      btn.addEventListener('click', handleTabClick);
    });
  }

  function initTabs() {
    if (!tabButtons.length) return;
    // Ensure only active tab section visible on load
    const activeBtn = document.querySelector('.analysis-tab-btn.is-active') || tabButtons[0];
    if (activeBtn) {
      showTab(activeBtn.dataset.tab, false);
    }
  }

  function handleTabClick(e) {
    e.preventDefault();
    const tab = this.dataset.tab;
    if (!tab) return;
    showTab(tab, true);
  }

  function showTab(tab, scrollIntoView) {
    const tabSets = {
      description: {
        firstId: 'description',
        showIds: ['description', 'indications', 'results', 'related', 'preparation']
      },
      composition: {
        firstId: 'composition',
        showIds: ['composition']
      },
      preparation: {
        firstId: 'preparation',
        showIds: ['preparation']
      }
    };

    const set = tabSets[tab];
    if (!set) return;
    const targetId = set.firstId;

    tabButtons.forEach(btn => btn.classList.toggle('is-active', btn.dataset.tab === tab));

    const allTabControlledIds = ['description', 'composition', 'preparation', 'indications', 'results', 'related'];
    allTabControlledIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.toggle('is-hidden', !set.showIds.includes(id));
    });

    const cta = document.querySelector('.analysis-cta');
    if (cta) {
      cta.classList.toggle('is-hidden', tab !== 'description');
    }

    // Hide anchor links for hidden sections
    anchorLinks.forEach(link => {
      const id = link.getAttribute('href')?.substring(1);
      if (!id) return;
      const section = document.getElementById(id);
      const hidden = section ? section.classList.contains('is-hidden') : false;
      link.classList.toggle('is-hidden-link', hidden);
    });

    // Reset anchor nav active state to the first visible section
    const firstVisibleLink = document.querySelector(`.analysis-anchor-nav a[href="#${targetId}"]`);
    if (firstVisibleLink) {
      updateActiveNavItem(firstVisibleLink);
    }

    if (scrollIntoView) {
      const section = document.getElementById(targetId);
      if (section) {
        const headerHeight = header ? header.offsetHeight : 0;
        const navHeight = anchorNav ? anchorNav.offsetHeight : 0;
        const targetPosition = section.offsetTop - headerHeight - navHeight - 16;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    }
  }

  /**
   * Handle anchor link click - smooth scroll to section
   */
  function handleAnchorClick(e) {
    e.preventDefault();

    const targetId = this.getAttribute('href').substring(1);
    const targetSection = document.getElementById(targetId);

    if (!targetSection) return;

    // Calculate offset considering sticky header and anchor nav
    const headerHeight = header ? header.offsetHeight : 0;
    const navHeight = anchorNav ? anchorNav.offsetHeight : 0;
    const totalOffset = headerHeight + navHeight;

    const targetPosition = targetSection.offsetTop - totalOffset - 20;

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });

    // Update active state immediately for better UX
    updateActiveNavItem(this);
  }

  /**
   * Handle scroll - highlight active nav item based on visible section
   */
  function handleScroll() {
    if (!sections.length || !anchorLinks.length) return;

    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    const headerHeight = header ? header.offsetHeight : 0;
    const navHeight = anchorNav ? anchorNav.offsetHeight : 0;
    const offset = headerHeight + navHeight + 50;

    // Find the current active section
    let currentSection = null;
    let minDistance = Infinity;

    sections.forEach(section => {
      const sectionTop = section.offsetTop - offset;
      const sectionBottom = sectionTop + section.offsetHeight;

      // Check if we're within this section
      if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
        const distance = Math.abs(scrollPosition - sectionTop);
        if (distance < minDistance) {
          minDistance = distance;
          currentSection = section;
        }
      }
    });

    // If no section found, find the closest one above
    if (!currentSection) {
      sections.forEach(section => {
        const sectionTop = section.offsetTop - offset;
        if (scrollPosition >= sectionTop) {
          const distance = Math.abs(scrollPosition - sectionTop);
          if (distance < minDistance) {
            minDistance = distance;
            currentSection = section;
          }
        }
      });
    }

    if (currentSection) {
      const activeLink = document.querySelector(
        `.analysis-anchor-nav a[href="#${currentSection.id}"]`
      );
      if (activeLink) {
        updateActiveNavItem(activeLink);
      }
    }
  }

  /**
   * Update active state of navigation items
   */
  function updateActiveNavItem(activeLink) {
    anchorLinks.forEach(link => link.classList.remove('active'));
    activeLink.classList.add('active');

    // Scroll the nav item into view if needed (for mobile horizontal scroll)
    if (anchorNav) {
      const navContainer = anchorNav.querySelector('.container');
      if (navContainer) {
        const linkRect = activeLink.getBoundingClientRect();
        const containerRect = navContainer.getBoundingClientRect();

        if (linkRect.left < containerRect.left || linkRect.right > containerRect.right) {
          activeLink.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
    }
  }

  /**
   * Highlight active nav on page load based on hash or first section
   */
  function highlightActiveNavOnLoad() {
    const hash = window.location.hash;

    if (hash) {
      const activeLink = document.querySelector(`.analysis-anchor-nav a[href="${hash}"]`);
      if (activeLink) {
        updateActiveNavItem(activeLink);
        // Small delay to let page settle before scrolling
        setTimeout(() => {
          const targetSection = document.getElementById(hash.substring(1));
          if (targetSection) {
            const headerHeight = header ? header.offsetHeight : 0;
            const navHeight = anchorNav ? anchorNav.offsetHeight : 0;
            const targetPosition = targetSection.offsetTop - headerHeight - navHeight - 20;
            window.scrollTo({ top: targetPosition, behavior: 'instant' });
          }
        }, 100);
      }
    } else {
      // Highlight first link by default
      const firstLink = anchorLinks[0];
      if (firstLink) {
        firstLink.classList.add('active');
      }
    }
  }

  /**
   * Handle window resize - adjust sticky behaviors if needed
   */
  function handleResize() {
    // Recalculate any dynamic positioning if needed
    // Currently CSS handles most responsive behaviors
  }

  /**
   * Handle order button clicks - show coming soon or trigger action
   */
  function handleOrderClick(e) {
    const button = e.target.closest('.analysis-summary__button, .btn-primary');
    if (!button) return;

    // Check if it's an order button
    if (button.textContent.includes('Заказать') || button.textContent.includes('Записаться')) {
      // Prevent default if it's a placeholder
      if (button.getAttribute('href') === '#' || !button.getAttribute('href')) {
        e.preventDefault();
        showNotification('Функция заказа будет доступна в ближайшее время');
      }
    }
  }

  /**
   * Show a temporary notification
   */
  function showNotification(message) {
    // Remove existing notification
    const existingNotification = document.querySelector('.analysis-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'analysis-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--color-primary);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideUp 0.3s ease;
    `;

    // Add animation styles if not present
    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(-50%) translateY(20px)';
      notification.style.transition = 'opacity 0.3s, transform 0.3s';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Debounce function for performance optimization
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

  // Bind order button clicks
  document.addEventListener('click', handleOrderClick);

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
