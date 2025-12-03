document.addEventListener("DOMContentLoaded", () => {
    initBurgerMenu();
    initSmoothScroll();
    initCasesSlider();
    initModals();
});

/* Бургер-меню */

function initBurgerMenu() {
    const burger = document.querySelector(".header__burger");
    const mobileNav = document.querySelector(".nav-mobile");

    if (!burger || !mobileNav) return;

    const toggle = () => {
        const isOpen = mobileNav.classList.toggle("nav-mobile--open");
        burger.classList.toggle("header__burger--active", isOpen);
        burger.setAttribute("aria-expanded", String(isOpen));
    };

    burger.addEventListener("click", toggle);

    mobileNav.addEventListener("click", (event) => {
        if (event.target.closest(".nav-mobile__link")) {
            mobileNav.classList.remove("nav-mobile--open");
            burger.classList.remove("header__burger--active");
            burger.setAttribute("aria-expanded", "false");
        }
    });
}

/* Плавный скролл */

function initSmoothScroll() {
    const header = document.querySelector(".header");
    const getHeaderHeight = () => (header ? header.offsetHeight : 0);

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        const href = link.getAttribute("href");
        if (!href || href === "#") return;

        link.addEventListener("click", (event) => {
            const targetId = href.slice(1);
            const targetEl = document.getElementById(targetId);
            if (!targetEl) return;

            event.preventDefault();

            const rect = targetEl.getBoundingClientRect();
            const offsetTop = window.pageYOffset + rect.top - getHeaderHeight() - 10;

            window.scrollTo({
                top: offsetTop,
                behavior: "smooth",
            });

            const mobileNav = document.querySelector(".nav-mobile");
            const burger = document.querySelector(".header__burger");
            if (
                mobileNav &&
                burger &&
                mobileNav.classList.contains("nav-mobile--open")
            ) {
                mobileNav.classList.remove("nav-mobile--open");
                burger.classList.remove("header__burger--active");
                burger.setAttribute("aria-expanded", "false");
            }
        });
    });
}

/* Слайдер кейсов + видео (бесконечный + свайпы) */

function initCasesSlider() {
    const slider = document.querySelector("[data-cases-slider]");
    if (!slider) return;

    const track = slider.querySelector(".cases-slider__track");
    const slides = Array.from(slider.querySelectorAll(".case-card"));
    const prevBtn = slider.querySelector("[data-cases-prev]");
    const nextBtn = slider.querySelector("[data-cases-next]");
    const dotsContainer = slider.querySelector(".cases-slider__dots");

    if (!track || slides.length === 0) return;

    const videos = slides.map((slide) =>
        slide.querySelector(".case-card__video")
    );
    const playButtons = slides.map((slide) =>
        slide.querySelector(".case-card__play-btn")
    );

    let slidesPerView = getSlidesPerView();
    let maxIndex = Math.max(0, slides.length - slidesPerView);
    let currentIndex = 0;

    const SWIPE_THRESHOLD = 40; // px

    buildDots();
    updateSlider();

    /* ----- Кнопки ----- */

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            goToSlide(currentIndex - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            goToSlide(currentIndex + 1);
        });
    }

    /* ----- Свайпы (мышь + тач) ----- */

    let isPointerDown = false;
    let startX = 0;
    let startY = 0;

    function pointerDown(x, y) {
        isPointerDown = true;
        startX = x;
        startY = y;
    }

    function pointerUp(x, y) {
        if (!isPointerDown) return;
        isPointerDown = false;

        const dx = x - startX;
        const dy = y - startY;

        // интересует именно горизонтальный жест
        if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) {
                goToSlide(currentIndex + 1); // свайп влево -> следующая
            } else {
                goToSlide(currentIndex - 1); // свайп вправо -> предыдущая
            }
        }
    }

    // мышь
    slider.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        pointerDown(e.clientX, e.clientY);
    });

    slider.addEventListener("mouseup", (e) => {
        pointerUp(e.clientX, e.clientY);
    });

    slider.addEventListener("mouseleave", (e) => {
        if (!isPointerDown) return;
        pointerUp(e.clientX, e.clientY);
    });

    // тач
    slider.addEventListener(
        "touchstart",
        (e) => {
            if (!e.touches[0]) return;
            const t = e.touches[0];
            pointerDown(t.clientX, t.clientY);
        },
        { passive: true }
    );

    slider.addEventListener(
        "touchend",
        (e) => {
            if (!e.changedTouches[0]) return;
            const t = e.changedTouches[0];
            pointerUp(t.clientX, t.clientY);
        },
        { passive: true }
    );

    // свайп тачпадом / горизонтальный скролл
    slider.addEventListener(
        "wheel",
        (e) => {
            // интересует только горизонтальный жест,
            // и чтобы он был сильнее вертикального
            if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
            if (Math.abs(e.deltaX) < 10) return;

            e.preventDefault();

            if (e.deltaX > 0) {
                goToSlide(currentIndex + 1);
            } else {
                goToSlide(currentIndex - 1);
            }
        },
        { passive: false }
    );

    /* ----- Dots ----- */

    function buildDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = "";
        const dotsCount = maxIndex + 1;

        for (let i = 0; i < dotsCount; i++) {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = "cases-slider__dot";
            dot.dataset.index = String(i);
            dot.addEventListener("click", () => {
                goToSlide(i);
            });
            dotsContainer.appendChild(dot);
        }
    }

    function updateDots() {
        if (!dotsContainer) return;
        const dots = Array.from(
            dotsContainer.querySelectorAll(".cases-slider__dot")
        );
        dots.forEach((dot, index) => {
            dot.classList.toggle("cases-slider__dot--active", index === currentIndex);
        });
    }

    /* ----- Логика слайдов ----- */

    function getSlidesPerView() {
        const width = window.innerWidth;
        if (width >= 992) return 3;
        if (width >= 640) return 2;
        return 1;
    }

    function normalizeIndex(index) {
        const total = maxIndex + 1;
        if (total <= 0) return 0;
        let i = index % total;
        if (i < 0) i += total; // чтобы -1 → последний
        return i;
    }

    function goToSlide(index) {
        currentIndex = normalizeIndex(index);
        updateSlider();
    }

    function updateSlider() {
        const newSlidesPerView = getSlidesPerView();

        if (newSlidesPerView !== slidesPerView) {
            slidesPerView = newSlidesPerView;
            maxIndex = Math.max(0, slides.length - slidesPerView);
            currentIndex = normalizeIndex(currentIndex);
            buildDots();
        }

        slides.forEach((slide) => {
            slide.style.flex = `0 0 calc(100% / ${slidesPerView})`;
        });

        const targetSlide = slides[currentIndex];
        if (targetSlide) {
            const offset = targetSlide.offsetLeft;
            track.style.transform = `translateX(-${offset}px)`;
        }

        // в бесконечном режиме кнопки всегда активны
        if (prevBtn) prevBtn.disabled = false;
        if (nextBtn) nextBtn.disabled = false;

        updateDots();
        pauseAllVideos();
    }

    window.addEventListener(
        "resize",
        debounce(() => {
            // пересчёт слайдов при ресайзе
            maxIndex = Math.max(0, slides.length - getSlidesPerView());
            currentIndex = normalizeIndex(currentIndex);
            updateSlider();
        }, 150)
    );

    /* ----- Видео ----- */

    slides.forEach((slide, index) => {
        const video = videos[index];
        const btn = playButtons[index];
        if (!video || !btn) return;

        btn.addEventListener("click", () => {
            if (video.paused || video.ended) {
                pauseAllVideos(video);
                video.play().catch(() => {});
                slide.classList.add("case-card--playing");
                btn.textContent = "Пауза";
            } else {
                video.pause();
                slide.classList.remove("case-card--playing");
                btn.textContent = "Нажми";
            }
        });

        video.addEventListener("play", () => {
            slide.classList.add("case-card--playing");
            btn.textContent = "Пауза";
        });

        video.addEventListener("pause", () => {
            slide.classList.remove("case-card--playing");
            btn.textContent = "Нажми";
        });

        video.addEventListener("ended", () => {
            slide.classList.remove("case-card--playing");
            btn.textContent = "Нажми";
        });
    });

    function pauseAllVideos(exceptVideo) {
        videos.forEach((video, index) => {
            if (!video) return;
            if (exceptVideo && video === exceptVideo) return;
            if (!video.paused) video.pause();
            const slide = slides[index];
            const btn = playButtons[index];
            if (slide) slide.classList.remove("case-card--playing");
            if (btn) btn.textContent = "Нажми";
        });
    }

    window.addEventListener("blur", () => pauseAllVideos());
}

/* MODALS */

function initModals() {
    const openButtons = document.querySelectorAll("[data-modal-open]");
    const modals = document.querySelectorAll(".modal");
    if (!openButtons.length || !modals.length) return;

    let activeModal = null;

    function openModal(name) {
        const modal = document.querySelector(`.modal[data-modal="${name}"]`);
        if (!modal) return;

        closeModal();

        modal.classList.add("modal--open");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        activeModal = modal;
    }

    function closeModal() {
        if (!activeModal) return;
        activeModal.classList.remove("modal--open");
        activeModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        activeModal = null;
    }

    openButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-modal-open");
            if (target) openModal(target);
        });
    });

    modals.forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (event.target.hasAttribute("data-modal-close")) {
                closeModal();
            }
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeModal();
        }
    });
}

/* HELPERS */

function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}