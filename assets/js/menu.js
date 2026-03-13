document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const body = document.body;

  // Toggle mobile menu
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      nav.classList.toggle('active');
      body.classList.toggle('menu-open');
    });
  }

  // Close menu on link click
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (menuToggle) {
        menuToggle.classList.remove('active');
        nav.classList.remove('active');
        body.classList.remove('menu-open');
      }
    });
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.header') && nav.classList.contains('active')) {
      if (menuToggle) {
        menuToggle.classList.remove('active');
        nav.classList.remove('active');
        body.classList.remove('menu-open');
      }
    }
  });

  // Dropdown functionality (if needed in future)
  const dropdownTriggers = document.querySelectorAll('.has-dropdown');
  dropdownTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const dropdown = trigger.querySelector('.dropdown');
      if (dropdown) {
        dropdown.classList.toggle('active');
      }
    });
  });
});
