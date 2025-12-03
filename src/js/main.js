// src/js/main.js

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initSmoothScroll();
  initCasesSlider();
  setCurrentYear();
});

/* ========================
   Моб. меню
   ======================== */
function initMobileMenu() {
  const burger = document.querySelector('.burger');
  const headerNav = document.querySelector('.header-nav');
  const body = document.body;

  if (!burger || !headerNav) return;

  burger.addEventListener('click', () => {
    burger.classList.toggle('is-active');
    headerNav.classList.toggle('is-open');
    body.classList.toggle('no-scroll');
  });

  // закрываем меню по клику по ссылке
  headerNav.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    burger.classList.remove('is-active');
    headerNav.classList.remove('is-open');
    body.classList.remove('no-scroll');
  });
}

/* ========================
   Плавный скролл
   ======================== */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const offset = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({
        top: offset,
        behavior: 'smooth',
      });
    });
  });
}

/* ========================
   Футер: текущий год
   ======================== */
function setCurrentYear() {
  const yearEl = document.querySelector('[data-current-year]');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}

/* ========================
   Слайдер кейсов (бесконечный + свайпы)
   ======================== */
function initCasesSlider() {
  const slider = document.querySelector('.cases-slider');
  if (!slider) return;

  const track = slider.querySelector('.cases-slider-track');
  const slides = Array.from(slider.querySelectorAll('.case-card'));
  const prevBtn = slider.querySelector('.cases-slider-prev');
  const nextBtn = slider.querySelector('.cases-slider-next');
  const dotsContainer = slider.querySelector('.cases-slider-dots');

  if (!track || slides.length === 0) return;

  // --- Настройки ---
  const SWIPE_THRESHOLD = 40; // px
  let slidesPerView = getSlidesPerView();
  let totalPages = Math.ceil(slides.length / slidesPerView);
  let currentPage = 0;

  // --- Dots (пересоздаём под количество страниц) ---
  let dots = [];
  function rebuildDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';

    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'cases-slider-dot';
      if (i === currentPage) dot.classList.add('is-active');
      dotsContainer.appendChild(dot);

      dot.addEventListener('click', () => goToPage(i));
    }

    dots = Array.from(dotsContainer.querySelectorAll('.cases-slider-dot'));
  }

  function updateDots() {
    if (!dots.length) return;
    dots.forEach((dot, index) => {
      dot.classList.toggle('is-active', index === currentPage);
    });
  }

  function getSlidesPerView() {
    const w = window.innerWidth;
    if (w >= 1200) return 3;
    if (w >= 768) return 2;
    return 1;
  }

  // --- Переход на страницу (бесконечный) ---
  function goToPage(page, { animate = true } = {}) {
    if (totalPages === 0) return;

    // нормализуем индекс (бесконечный круг)
    const total = totalPages;
    currentPage = ((page % total) + total) % total;

    if (!animate) {
      // убираем анимацию на момент пересчёта
      track.style.transition = 'none';
      track.style.transform = `translateX(-${currentPage * 100}%)`;
      // форсим reflow и возвращаем transition
      void track.offsetWidth;
      track.style.transition = '';
    } else {
      track.style.transform = `translateX(-${currentPage * 100}%)`;
    }

    updateDots();
  }

  // --- Кнопки ---
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      goToPage(currentPage - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      goToPage(currentPage + 1);
    });
  }

  // --- Свайпы (мышь + тач) ---
  let isPointerDown = false;
  let startX = 0;
  let startY = 0;

  function pointerDown(clientX, clientY) {
    isPointerDown = true;
    startX = clientX;
    startY = clientY;
  }

  function pointerUp(clientX, clientY) {
    if (!isPointerDown) return;
    isPointerDown = false;

    const dx = clientX - startX;
    const dy = clientY - startY;

    // горизонтальный свайп
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        // свайп влево -> следующая страница
        goToPage(currentPage + 1);
      } else {
        // свайп вправо -> предыдущая
        goToPage(currentPage - 1);
      }
    }
  }

  // мышь
  slider.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    pointerDown(e.clientX, e.clientY);
  });

  slider.addEventListener('mouseup', (e) => {
    pointerUp(e.clientX, e.clientY);
  });

  slider.addEventListener('mouseleave', (e) => {
    if (!isPointerDown) return;
    pointerUp(e.clientX, e.clientY);
  });

  // тач
  slider.addEventListener(
    'touchstart',
    (e) => {
      if (!e.touches[0]) return;
      const t = e.touches[0];
      pointerDown(t.clientX, t.clientY);
    },
    { passive: true }
  );

  slider.addEventListener(
    'touchend',
    (e) => {
      if (!e.changedTouches[0]) return;
      const t = e.changedTouches[0];
      pointerUp(t.clientX, t.clientY);
    },
    { passive: true }
  );

  // --- Свайпы/скролл на тачпаде (wheel) ---
  slider.addEventListener(
    'wheel',
    (e) => {
      // интересует только горизонтальный жест
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      if (Math.abs(e.deltaX) < 10) return;

      e.preventDefault();

      if (e.deltaX > 0) {
        goToPage(currentPage + 1);
      } else {
        goToPage(currentPage - 1);
      }
    },
    { passive: false }
  );

  // --- Плей/пауза видео по кнопке "Нажми" ---
  const videos = slides.map((slide) => slide.querySelector('video')).filter(Boolean);

  slides.forEach((slide) => {
    const btn = slide.querySelector('.case-card__btn'); // кнопка "Нажми"
    const video = slide.querySelector('video');
    if (!btn || !video) return;

    btn.addEventListener('click', () => {
      if (video.paused) {
        // стопаем все остальные
        videos.forEach((v) => {
          if (v !== video) v.pause();
        });
        video.play();
        btn.classList.add('is-playing');
      } else {
        video.pause();
        btn.classList.remove('is-playing');
      }
    });

    video.addEventListener('ended', () => {
      btn.classList.remove('is-playing');
    });
  });

  // --- Реакция на resize (меняется количество карточек на экране) ---
  function handleResize() {
    const newSpv = getSlidesPerView();
    if (newSpv === slidesPerView) return;

    slidesPerView = newSpv;
    totalPages = Math.ceil(slides.length / slidesPerView);
    if (currentPage >= totalPages) currentPage = totalPages - 1;
    rebuildDots();
    goToPage(currentPage, { animate: false });
  }

  window.addEventListener('resize', handleResize);

  // Инициализация
  rebuildDots();
  goToPage(0, { animate: false });
}