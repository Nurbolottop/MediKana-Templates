document.addEventListener('DOMContentLoaded', () => {
  // Simple Slider/Carousel functionality
  const sliders = document.querySelectorAll('[data-slider]');

  sliders.forEach(slider => {
    const track = slider.querySelector('.slider-track');
    const slides = slider.querySelectorAll('.slide');
    const prevBtn = slider.querySelector('.slider-prev');
    const nextBtn = slider.querySelector('.slider-next');
    const dots = slider.querySelectorAll('.slider-dot');

    if (!slides.length) return;

    let currentIndex = 0;
    let autoplayInterval = null;

    const goToSlide = (index) => {
      if (index < 0) {
        currentIndex = slides.length - 1;
      } else if (index >= slides.length) {
        currentIndex = 0;
      } else {
        currentIndex = index;
      }

      if (track) {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
      }

      // Update dots
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
      });

      // Update slides
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === currentIndex);
      });
    };

    const nextSlide = () => {
      goToSlide(currentIndex + 1);
    };

    const prevSlide = () => {
      goToSlide(currentIndex - 1);
    };

    // Event listeners
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
        resetAutoplay();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prevSlide();
        resetAutoplay();
      });
    }

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        goToSlide(index);
        resetAutoplay();
      });
    });

    // Autoplay
    const startAutoplay = () => {
      if (slider.dataset.autoplay === 'true') {
        autoplayInterval = setInterval(nextSlide, 5000);
      }
    };

    const stopAutoplay = () => {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
      }
    };

    const resetAutoplay = () => {
      stopAutoplay();
      startAutoplay();
    };

    // Touch/swipe support
    let startX = 0;
    let diffX = 0;

    slider.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      stopAutoplay();
    }, { passive: true });

    slider.addEventListener('touchmove', (e) => {
      diffX = startX - e.touches[0].clientX;
    }, { passive: true });

    slider.addEventListener('touchend', () => {
      if (Math.abs(diffX) > 50) {
        if (diffX > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
      startAutoplay();
    }, { passive: true });

    // Initialize
    goToSlide(0);
    startAutoplay();

    // Pause on hover
    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);
  });
});
