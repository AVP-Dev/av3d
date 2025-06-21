// Файл: assets/js/script.js

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
        const isMenuOrModalOpen = document.querySelector('.modal.is-active') || (navMenu && navMenu.classList.contains('is-active'));
        htmlElement.classList.toggle('modal-open', isMenuOrModalOpen);
        body.classList.toggle('modal-open', isMenuOrModalOpen);
    }

    function initMobileMenu() {
        if (!mobileMenuToggle || !navMenu) return;

        const toggleMenu = (forceClose = false) => {
            const isActive = navMenu.classList.contains('is-active');
            const open = !isActive && !forceClose;
            
            // With the new HTML structure, we no longer need complex hacks.
            // We just toggle the classes.
            navMenu.classList.toggle('is-active', open);
            mobileMenuToggle.classList.toggle('is-active', open);
            mobileMenuToggle.setAttribute('aria-expanded', String(open));
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
                if (window.innerWidth < 769) {
                   toggleMenu(true);
                }
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
            // This logic is still useful to prevent the header from hiding
            // underneath the scroll-locked overlay.
            if (navMenu && navMenu.classList.contains('is-active')) {
                return;
            }

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
    
            const href = trigger.getAttribute('href');
            const isOrderTrigger = trigger.classList.contains('order-scroll-trigger');
            
            if (!href && !isOrderTrigger) return;
            
            e.preventDefault();
    
            const targetId = isOrderTrigger ? '#order' : href;
    
            if (targetId === '#') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
    
            const targetElement = document.getElementById(targetId.substring(1));
            smoothScrollTo(targetElement);
            
            const serviceName = trigger.dataset.serviceName;
            const serviceSelect = document.getElementById('service-select');
            if(isOrderTrigger && serviceName && serviceSelect) {
                 serviceSelect.value = serviceName;
            }
        });
    }
    
    function initFaqAccordion() {
        const faqGrid = document.querySelector('.faq__grid');
        if (!faqGrid) return;

        const allItems = faqGrid.querySelectorAll('.faq__item');
        const allButtons = faqGrid.querySelectorAll('.faq__button');

        faqGrid.addEventListener('click', (e) => {
            const questionHeader = e.target.closest('.faq__question');
            if (!questionHeader) return;
            
            const currentItem = questionHeader.parentElement;
            const currentButton = questionHeader.querySelector('.faq__button');
            const wasActive = currentItem.classList.contains('is-active');

            allItems.forEach(item => {
                item.classList.remove('is-active');
            });
            allButtons.forEach(button => {
                button.setAttribute('aria-expanded', 'false');
            });

            if (!wasActive) {
                currentItem.classList.add('is-active');
                currentButton.setAttribute('aria-expanded', 'true');
            }
        });
    }

    function initModals() {
        const modals = document.querySelectorAll('.modal');
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
                modals.forEach(closeModal);
            }
        });

        const portfolioGrid = document.querySelector('.portfolio__grid');
        const imageLightbox = document.getElementById('image-lightbox');
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
        
        window.openSuccessModal = () => {
            const successModal = document.getElementById('success-modal');
            openModal(successModal);
        };
    }

    function initForm() {
        const form = document.getElementById('order-form');
        if (!form) return;
    
        const nameField = form.querySelector('#name');
        const contactField = form.querySelector('#contact');
        const descriptionField = form.querySelector('#description');
        const serviceSelect = form.querySelector('#service-select');
        const submitButton = form.querySelector('#submit-button');
        const submitButtonText = form.querySelector('#submit-button-text');
        const loader = form.querySelector('#loader');
        const formStatus = form.querySelector('#form-status');
    
        let recaptchaLoaded = false;
        
        const loadRecaptcha = () => {
            if (recaptchaLoaded) return;
            const script = document.createElement('script');
            script.src = 'https://www.google.com/recaptcha/api.js?render=6LdbRz0rAAAAANcGVE0I-3t82dtJ2elymdIxIi1j';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
            recaptchaLoaded = true;
        };
    
        ['focus', 'input'].forEach(eventType => {
            form.addEventListener(eventType, loadRecaptcha, { once: true, passive: true });
        });
    
        const validateField = (field, message) => {
            const errorDiv = field.nextElementSibling;
            if (!field.value.trim()) {
                field.classList.add('error');
                errorDiv.textContent = message;
                errorDiv.style.display = 'block';
                return false;
            }
            field.classList.remove('error');
            errorDiv.style.display = 'none';
            return true;
        };
    
        const validateForm = () => {
            const isNameValid = validateField(nameField, 'Пожалуйста, введите ваше имя.');
            const isContactValid = validateField(contactField, 'Пожалуйста, введите ваши контактные данные.');
            const isServiceValid = validateField(serviceSelect, 'Пожалуйста, выберите услугу.');
            const isDescriptionValid = validateField(descriptionField, 'Пожалуйста, опишите ваш заказ.');
            return isNameValid && isContactValid && isServiceValid && isDescriptionValid;
        };
    
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validateForm()) return;
    
            submitButton.disabled = true;
            submitButtonText.style.display = 'none';
            loader.style.display = 'block';
            formStatus.textContent = '';
    
            grecaptcha.ready(function () {
                grecaptcha.execute('6LdbRz0rAAAAANcGVE0I-3t82dtJ2elymdIxIi1j', { action: 'submit' }).then(async function (token) {
                    const formData = new FormData(form);
                    formData.append('recaptcha_response', token);
    
                    const data = {};
                    formData.forEach((value, key) => { data[key] = value; });
                    
                    try {
                        const response = await fetch('/includes/send-telegram', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        });
    
                        const result = await response.json();
    
                        if (result.success) {
                            formStatus.textContent = result.message;
                            formStatus.className = 'form-status success';
                            form.reset();
                            window.openSuccessModal();
                        } else {
                            formStatus.textContent = result.message || 'Произошла ошибка.';
                            formStatus.className = 'form-status error';
                        }
                    } catch (error) {
                        console.error('Ошибка:', error);
                        formStatus.textContent = 'Ошибка сети. Попробуйте снова.';
                        formStatus.className = 'form-status error';
                    } finally {
                        submitButton.disabled = false;
                        submitButtonText.style.display = 'inline';
                        loader.style.display = 'none';
                    }
                });
            });
        });
    }

    function initCookieBanner() {
        const cookieBanner = document.getElementById('cookie-banner');
        const acceptButton = document.getElementById('cookie-accept');

        if (!cookieBanner || !acceptButton) return;

        if (!localStorage.getItem('cookieConsent')) {
            setTimeout(() => cookieBanner.classList.add('show'), 1500);
        }

        acceptButton.addEventListener('click', () => {
            cookieBanner.classList.remove('show');
            localStorage.setItem('cookieConsent', 'true');
        });
    }

    function initAnimatedShapes() {
        const container = document.querySelector('.shapes-container');
        if (!container) return;

        const config = {
            count: 12,
            minSize: 20,
            maxSize: 60,
            minDuration: 20,
            maxDuration: 40,
            minDelay: 0,
            maxDelay: 15,
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
                --x-start: ${Math.random() * 120 - 10}vw;
                --y-start: ${Math.random() * 120 - 10}vh;
                --x-end: ${Math.random() * 120 - 10}vw;
                --y-end: ${Math.random() * 120 - 10}vh;
                --scale-start: ${Math.random() * 0.8 + 0.2};
                --scale-end: ${Math.random() * 0.8 + 0.2};
                --rotate-start: ${Math.random() * 360}deg;
                --rotate-end: ${Math.random() * 360 + 360}deg;
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
