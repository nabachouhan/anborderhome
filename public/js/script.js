document.addEventListener('DOMContentLoaded', () => {
  // 1. Metric Counter Animation
  const counters = document.querySelectorAll('.metric-number, .onboarded-number');
  const speed = 40;

  const animateCounter = (counter) => {
    const target = +counter.getAttribute('data-counter');
    let count = 0;
    const increment = Math.max(1, Math.ceil(target / speed));

    const updateCount = () => {
      count += increment;
      if (count < target) {
        counter.innerText = count;
        setTimeout(updateCount, 25);
      } else {
        counter.innerText = target;
      }
    };
    updateCount();
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));

  // 2. High-Performance Hardware-Accelerated Swipe Engine
  const viewport = document.getElementById('swipeViewport');
  const clippedLayer = document.getElementById('clippedLayer');
  const dragDivider = document.getElementById('dragDivider');
  const resetBtn = document.getElementById('resetSwipeBtn');

  let isDragging = false;
  let targetPercentage = 50;
  let rafId = null;

  function renderSwipe() {
    clippedLayer.style.clipPath = `inset(0 0 0 ${targetPercentage}%)`;
    dragDivider.style.left = `${targetPercentage}%`;
    rafId = null;
  }

  function scheduleUpdate(clientX) {
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    let offsetX = clientX - rect.left;

    if (offsetX < 0) offsetX = 0;
    if (offsetX > rect.width) offsetX = rect.width;

    targetPercentage = (offsetX / rect.width) * 100;

    if (!rafId) {
      rafId = requestAnimationFrame(renderSwipe);
    }
  }

  const onPointerStart = (e) => {
    isDragging = true;
    if (viewport) viewport.style.cursor = 'ew-resize';
    scheduleUpdate(e.clientX || (e.touches && e.touches[0].clientX));
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
    if (clientX !== undefined) scheduleUpdate(clientX);
  };

  const onPointerEnd = () => {
    isDragging = false;
    if (viewport) viewport.style.cursor = 'ew-resize';
  };

  if (viewport) {
    viewport.addEventListener('mousedown', onPointerStart);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerEnd);

    viewport.addEventListener('touchstart', onPointerStart, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerEnd);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      targetPercentage = 50;
      renderSwipe();
    });
  }

  // 3. Tab Navigation inside Technical Framework Modal
  const modalTabs = document.querySelectorAll('.modal-tab-btn');
  const tabPanels = document.querySelectorAll('.tab-content-panel');

  modalTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      modalTabs.forEach(t => t.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const activePanel = document.getElementById(targetId);
      if (activePanel) activePanel.classList.add('active');
    });
  });

  // 4. Auto-Changing Hero Satellite Slideshow
  const heroSlides = document.querySelectorAll('.hero-slide-item');
  const slideIndicator = document.getElementById('slideIndicator');
  let currentSlide = 0;

  if (heroSlides.length > 0) {
    setInterval(() => {
      heroSlides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % heroSlides.length;
      heroSlides[currentSlide].classList.add('active');
      if (slideIndicator) {
        slideIndicator.innerText = `${currentSlide + 1} / ${heroSlides.length}`;
      }
    }, 4000);
  }
});
