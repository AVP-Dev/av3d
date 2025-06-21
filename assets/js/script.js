document.addEventListener('DOMContentLoaded', function() {

    // --- Утилиты ---
    const throttle = (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    // --- Кэширование DOM-элементов ---
    const body = document.body;
    const htmlElement = document.documentElement;
    const header = document.querySelector('.header');
    const navMenu = document.getElementById('main-nav');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const scrollToTopBtn = document.getElementById('scroll-to-top');

    // --- Инициализация всех модулей ---
    function init() {
        initTheme();
        initMobileMenu();
        initHeaderBehavior();
        initFaqAccordion();
        initModals();
        initSmoothScrolling();
        initForm();
        initCookieBanner();
        initAnimatedShapes();
        initScrollToTop();
    }

    // --- Модули ---

    function initTheme() {
        const themeToggles = document.querySelectorAll('.theme-toggle');
        if (!themeToggles.length) return;

        const applyTheme = (theme) => {
            htmlElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            const label = theme === 'dark' ? 'Сменить тему на светлую' : 'Сменить тему на темную';
            themeToggles.forEach(btn => btn.setAttribute('aria-label', label));
        };

        const toggleTheme = () => {
            const newTheme = htmlElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            applyTheme(newTheme);
        };

        themeToggles.forEach(btn => btn.addEventListener('click', toggleTheme));

        const storedTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(storedTheme);
    }

    function updateBodyScrollLock() {
        const isModalOpen = document.querySelector('.modal.is-active') || navMenu.classList.contains('is-active');
        htmlElement.classList.toggle('modal-open', isModalOpen);
        body.classList.toggle('modal-open', isModalOpen);
    }

    function initMobileMenu() {
        if (!mobileMenuToggle || !navMenu) return;

        const toggleMenu = (forceClose = false) => {
            const isActive = navMenu.classList.contains('is-active');
            const open = !isActive && !forceClose;
            navMenu.classList.toggle('is-active', open);
            mobileMenuToggle.classList.toggle('is-active', open);
            mobileMenuToggle.setAttribute('aria-expanded', open);
            mobileMenuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
            updateBodyScrollLock();
        };

        mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('is-active') && !navMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                toggleMenu(true);
            }
        });

        navMenu.addEventListener('click', (e) => {
            if (e.target.closest('a[href^="#"]') || e.target.closest('.theme-toggle')) {
                toggleMenu(true);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('is-active')) {
                toggleMenu(true);
            }
        });
    }

    function initHeaderBehavior() {
        if (!header) return;
        let lastScrollY = window.scrollY;
        
        const handleScroll = () => {
            if (body.classList.contains('modal-open')) return;
            const currentScrollY = window.scrollY;

            header.classList.toggle('header--scrolled', currentScrollY > 50);

            if (currentScrollY > lastScrollY && currentScrollY > header.offsetHeight) {
                header.classList.add('header--hidden');
            } else {
                header.classList.remove('header--hidden');
            }
            lastScrollY = currentScrollY < 0 ? 0 : currentScrollY;
        };

        window.addEventListener('scroll', throttle(handleScroll, 100), { passive: true });
    }
    
    function initScrollToTop() {
        if (!scrollToTopBtn) return;
        
        const handleScroll = () => {
            scrollToTopBtn.classList.toggle('show', window.scrollY > 300);
        };
        
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        
        window.addEventListener('scroll', throttle(handleScroll, 200), { passive: true });
    }

    function smoothScrollTo(targetElement) {
        if (!targetElement) return;
        const headerOffset = header?.offsetHeight || 0;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset - 20;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    function initSmoothScrolling() {
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('a[href^="#"], .order-scroll-trigger');
            if (!trigger) return;

            e.preventDefault();

            let targetId;

            if (trigger.tagName === 'A' && trigger.getAttribute('href')) {
                targetId = trigger.getAttribute('href');
            } else if (trigger.classList.contains('order-scroll-trigger')) {
                targetId = '#order';
            }

            if (!targetId) return;

            if (targetId === '#') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const targetElement = document.getElementById(targetId.substring(1));
            smoothScrollTo(targetElement);
            
            const serviceName = trigger.dataset.serviceName;
            const serviceSelect = document.getElementById('service-select');
            if(trigger.classList.contains('order-scroll-trigger') && serviceName && serviceSelect) {
                 serviceSelect.value = serviceName;
            }
        });
    }

    /**
     * ИСПРАВЛЕННЫЙ АККОРДЕОН
     * При открытии одного элемента, закрывает все остальные.
     */
    function initFaqAccordion() {
        const faqGrid = document.querySelector('.faq__grid');
        if (!faqGrid) return;

        const allItems = faqGrid.querySelectorAll('.faq__item');

        faqGrid.addEventListener('click', (e) => {
            const questionHeader = e.target.closest('.faq__question');
            if (!questionHeader) return;

            const currentItem = questionHeader.parentElement;
            const wasActive = currentItem.classList.contains('is-active');

            // Сначала закрываем все элементы
            allItems.forEach(item => {
                item.classList.remove('is-active');
            });

            // Если элемент не был активен, то открываем его
            // (это позволяет закрывать уже открытый элемент повторным кликом)
            if (!wasActive) {
                currentItem.classList.add('is-active');
            }
        });
    }

    function initModals() {
        const imageLightbox = document.getElementById('image-lightbox');
        const successModal = document.getElementById('success-modal');
        const modals = [imageLightbox, successModal].filter(Boolean);
        
        if (modals.length === 0) return;

        const openModal = (modal) => {
            if (modal) {
                modal.classList.add('is-active');
                updateBodyScrollLock();
            }
        };

        const closeModal = (modal) => {
            if (modal) {
                modal.classList.remove('is-active');
                updateBodyScrollLock();
            }
        };
        
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.closest('.close-modal-btn')) {
                    closeModal(modal);
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modals.forEach(modal => {
                    if (modal.classList.contains('is-active')) closeModal(modal);
                });
            }
        });

        const portfolioGrid = document.querySelector('.portfolio__grid');
        if (portfolioGrid && imageLightbox) {
             const lightboxImage = document.getElementById('lightbox-image');
             const lightboxCaption = document.getElementById('lightbox-caption');
             
             portfolioGrid.addEventListener('click', (e) => {
                const item = e.target.closest('.portfolio-item');
                if (!item) return;
                
                const src = item.dataset.fullsizeSrc;
                const caption = item.dataset.caption;
                
                if (src && lightboxImage && lightboxCaption) {
                    lightboxImage.src = src;
                    lightboxImage.alt = caption || 'Пример работы';
                    lightboxCaption.textContent = caption;
                    openModal(imageLightbox);
                }
             });
        }
        
        window.openSuccessModal = () => openModal(successModal);
    }
    
    function initForm() {
        const form = document.getElementById('order-form');
        if (!form) return;

        const submitButton = form.querySelector('button[type="submit"]');

        const validate = () => {
            let isValid = true;
            form.querySelectorAll('.error-message-text').forEach(el => el.remove());
            form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

            const displayError = (input, message) => {
                input.classList.add('error');
                const errorEl = document.createElement('span');
                errorEl.className = 'error-message-text';
                errorEl.textContent = message;
                input.parentElement.insertBefore(errorEl, input.nextSibling);
            };

            const name = form.querySelector('#name');
            const phone = form.querySelector('#phone');

            if (name.value.trim() === '') {
                displayError(name, 'Пожалуйста, введите ваше имя.');
                isValid = false;
            }
            if (phone.value.trim() === '') {
                displayError(phone, 'Пожалуйста, введите ваш телефон.');
                isValid = false;
            }
            return isValid;
        };
        
        const resetButton = () => {
            submitButton.disabled = false;
            submitButton.textContent = 'Отправить заявку';
        };

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!validate()) return;
            
            submitButton.disabled = true;
            submitButton.textContent = 'Отправка...';

            if (typeof grecaptcha === 'undefined' || !grecaptcha.execute) {
                console.error('Ошибка: reCAPTCHA не загружен.');
                resetButton();
                return;
            }

            grecaptcha.ready(() => {
                grecaptcha.execute('6LdbRz0rAAAAANcGVE0I-3t82dtJ2elymdIxIi1j', { action: 'submit_form' })
                    .then(token => {
                        const formData = new FormData(form);
                        formData.append('recaptcha_response', token);
                        const data = Object.fromEntries(formData.entries());

                        return fetch('/includes/send-telegram', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data),
                        });
                    })
                    .then(response => {
                        if (!response.ok) {
                            return response.json().then(err => { throw new Error(err.message || 'Ошибка сервера'); });
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.success) {
                            window.openSuccessModal();
                            form.reset();
                        } else {
                            throw new Error(data.message || 'Произошла неизвестная ошибка.');
                        }
                    })
                    .catch(error => console.error('Ошибка отправки формы:', error))
                    .finally(resetButton);
            });
        });
    }

    function initCookieBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (!banner) return;
        const acceptBtn = banner.querySelector('#accept-cookies');
        const COOKIE_KEY = 'av3d_cookie_consent_v1';

        if (!localStorage.getItem(COOKIE_KEY)) {
            banner.classList.add('show');
        }

        acceptBtn.addEventListener('click', () => {
            localStorage.setItem(COOKIE_KEY, 'accepted');
            banner.classList.remove('show');
        });
    }
    
    function initAnimatedShapes() {
        const container = document.querySelector('.shapes-container');
        if (!container) return;

        const config = {
            count: 15,
            minSize: 50,
            maxSize: 150,
            minDuration: 8,
            maxDuration: 15,
            minDelay: 0,
            maxDelay: 5
        };
        
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < config.count; i++) {
            const shape = document.createElement('div');
            shape.className = i % 2 === 0 ? 'shape square' : 'shape triangle';
            
            const size = `${Math.random() * (config.maxSize - config.minSize) + config.minSize}px`;
            const duration = `${Math.random() * (config.maxDuration - config.minDuration) + config.minDuration}s`;
            const delay = `${Math.random() * (config.maxDelay - config.minDelay) + config.minDelay}s`;

            shape.style.cssText = `
                width: ${size};
                height: ${size};
                --x-start: ${Math.random() * 140 - 20}vw;
                --y-start: ${Math.random() * 140 - 20}vh;
                --x-end: ${Math.random() * 140 - 20}vw;
                --y-end: ${Math.random() * 140 - 20}vh;
                --scale-start: ${Math.random() * 1 + 0.5};
                --scale-end: ${Math.random() * 1.2 + 0.8};
                --rotate-start: ${Math.random() * 360}deg;
                --rotate-end: ${Math.random() * 360 + 360}deg;
                --opacity-active: ${Math.random() * 0.3 + 0.3};
                animation-duration: ${duration};
                animation-delay: ${delay};
            `;
            
            fragment.appendChild(shape);
        }
        
        container.appendChild(fragment);
    }

    // --- Запуск ---
    init();
});
