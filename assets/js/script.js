document.addEventListener('DOMContentLoaded', function() {
    // --- Основные переменные ---
    const body = document.body;
    const htmlElement = document.documentElement;
    const headerElement = document.querySelector('.header');
    
    // --- Инициализация всех компонентов ---
    initThemeSwitcher();
    initMobileMenu();
    initHeaderBehavior();
    initFaqAccordion();
    initScrollTriggers();
    initModalWindows();
    initFormHandling();
    initCookieConsent();

    /**
     * Плавная прокрутка к якорю на странице.
     * @param {string} targetId - ID элемента, к которому нужно прокрутить.
     */
    function smoothScrollTo(targetId) {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            let headerOffset = 0;
            // Учитываем высоту "липкой" шапки
            if (headerElement && getComputedStyle(headerElement).position === 'sticky') {
                headerOffset = headerElement.offsetHeight;
            }
            const offsetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerOffset - 20;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        } else {
            console.warn(`Элемент для прокрутки с ID "${targetId}" не найден.`);
        }
    }

    /**
     * Инициализация переключателя темы (светлая/темная).
     */
    function initThemeSwitcher() {
        const themeToggleButtons = document.querySelectorAll('.theme-toggle');
        if (themeToggleButtons.length === 0) return;

        const storedTheme = localStorage.getItem('theme');
        let currentTheme = storedTheme || 'dark';

        const applyTheme = (theme) => {
            htmlElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            currentTheme = theme;
            const label = theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему';
            themeToggleButtons.forEach(btn => {
                btn.setAttribute('aria-label', label);
                btn.setAttribute('title', label);
            });
        };

        themeToggleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                applyTheme(currentTheme === 'light' ? 'dark' : 'light');
            });
        });

        applyTheme(currentTheme);
    }

    /**
     * Инициализация мобильного меню.
     */
    function initMobileMenu() {
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const navMenu = document.getElementById('main-nav');

        if (!mobileMenuToggle || !navMenu) return;

        const closeMobileMenu = () => {
            if (!document.querySelector('.modal.is-active')) {
                htmlElement.classList.remove('modal-open');
                body.classList.remove('modal-open');
            }
            navMenu.classList.remove('is-active');
            mobileMenuToggle.classList.remove('is-active');
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
            mobileMenuToggle.setAttribute('aria-label', 'Открыть меню');
        };

        mobileMenuToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const isActive = navMenu.classList.toggle('is-active');
            mobileMenuToggle.classList.toggle('is-active', isActive);
            mobileMenuToggle.setAttribute('aria-expanded', isActive);
            mobileMenuToggle.setAttribute('aria-label', isActive ? 'Закрыть меню' : 'Открыть меню');
            
            if (isActive) {
                htmlElement.classList.add('modal-open');
                body.classList.add('modal-open');
            } else {
                closeMobileMenu();
            }
        });

        // Закрытие меню при клике на ссылку или вне меню
        document.addEventListener('click', (event) => {
            const isClickInsideMenu = navMenu.contains(event.target);
            const isClickOnToggle = mobileMenuToggle.contains(event.target);
            
            if (navMenu.classList.contains('is-active')) {
                 if (event.target.closest('a[href^="#"]') || event.target.closest('.theme-toggle')) {
                    closeMobileMenu();
                 } else if (!isClickInsideMenu && !isClickOnToggle) {
                    closeMobileMenu();
                 }
            }
        });
        
        // Закрытие по клавише Esc
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && navMenu.classList.contains('is-active')) {
                closeMobileMenu();
            }
        });
    }

    /**
     * Инициализация поведения шапки (скрытие при скролле).
     */
    function initHeaderBehavior() {
        if (!headerElement) return;
        let lastScrollTop = 0;

        window.addEventListener('scroll', () => {
            if (body.classList.contains('modal-open')) return;

            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 50) {
                headerElement.classList.add('header--scrolled');
            } else {
                headerElement.classList.remove('header--scrolled');
            }

            if (scrollTop > lastScrollTop && scrollTop > headerElement.offsetHeight) {
                headerElement.classList.add('header--hidden');
            } else {
                headerElement.classList.remove('header--hidden');
            }
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        }, false);
    }
    
    /**
     * Инициализация обработчиков для всех ссылок-якорей и кнопок прокрутки.
     */
    function initScrollTriggers() {
        // Кнопка "наверх"
        const scrollToTopBtn = document.getElementById('scroll-to-top');
        if (scrollToTopBtn) {
            window.addEventListener('scroll', () => {
                scrollToTopBtn.classList.toggle('show', window.pageYOffset > 300);
            });
            scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        }

        // Обработка всех кнопок, ведущих к форме заказа
        document.querySelectorAll('.order-scroll-trigger').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                smoothScrollTo('order-form'); 
                
                const serviceName = trigger.dataset.serviceName;
                const serviceSelect = document.getElementById('service-select');
                if (serviceName && serviceSelect) {
                    serviceSelect.value = serviceName;
                }
            });
        });
        
        // Обработка всех остальных якорных ссылок
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
             anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#' || this.classList.contains('order-scroll-trigger')) {
                     e.preventDefault();
                     if(href === '#') window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                    e.preventDefault();
                    smoothScrollTo(href.substring(1));
                }
            });
        });
    }

    /**
     * Инициализация аккордеона в секции FAQ.
     */
    function initFaqAccordion() {
        const faqItems = document.querySelectorAll('.faq__item');
        faqItems.forEach(item => {
            const question = item.querySelector('.faq__question');
            question.addEventListener('click', () => {
                const wasActive = item.classList.contains('is-active');
                faqItems.forEach(i => i.classList.remove('is-active'));
                if (!wasActive) {
                    item.classList.add('is-active');
                }
            });
        });
    }

    /**
     * Инициализация модальных окон (успешная отправка, лайтбокс).
     */
    function initModalWindows() {
        const modals = document.querySelectorAll('.modal');
        if (modals.length === 0) return;

        const openModal = (modal) => {
            if (modal) {
                modal.classList.add('is-active');
                htmlElement.classList.add('modal-open');
                body.classList.add('modal-open');
            }
        };

        const closeModal = (modal) => {
            if (modal) {
                modal.classList.remove('is-active');
                if (!document.querySelector('.modal.is-active') && !document.querySelector('.nav.is-active')) {
                    htmlElement.classList.remove('modal-open');
                    body.classList.remove('modal-open');
                }
            }
        };

        modals.forEach(modal => {
            modal.querySelectorAll('.close-modal-btn').forEach(btn => {
                btn.addEventListener('click', () => closeModal(modal));
            });
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    closeModal(modal);
                }
            });
        });
        
         document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                modals.forEach(modal => {
                    if(modal.classList.contains('is-active')) {
                        closeModal(modal);
                    }
                });
            }
        });

        // Логика лайтбокса для портфолио
        const imageLightbox = document.getElementById('image-lightbox');
        const lightboxImage = document.getElementById('lightbox-image');
        const lightboxCaption = document.getElementById('lightbox-caption');
        
        if (imageLightbox && lightboxImage && lightboxCaption) {
             document.querySelectorAll('.portfolio-item').forEach(item => {
                item.addEventListener('click', function() {
                    const src = this.dataset.fullsizeSrc;
                    const caption = this.dataset.caption;
                    if (src) {
                        lightboxImage.src = src;
                        lightboxImage.alt = caption || 'Пример работы';
                        lightboxCaption.textContent = caption;
                        openModal(imageLightbox);
                    }
                });
            });
        }
        
        window.openSuccessModal = () => openModal(document.getElementById('success-modal'));
    }

    /**
     * Инициализация обработки формы заказа.
     */
    function initFormHandling() {
        const orderForm = document.getElementById('order-form');
        if (!orderForm) return;

        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^\d\s\(\)\-\+]/g, '');
            });
        }
        
        orderForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const form = this;
            const submitButton = form.querySelector('button[type="submit"]');

            let isValid = true;
            form.querySelectorAll('.error-message-text').forEach(el => el.remove());
            form.querySelectorAll('input.error').forEach(el => el.classList.remove('error'));

            const nameField = form.querySelector('#name');
            const phoneField = form.querySelector('#phone');

            if (nameField.value.trim() === '') {
                displayError(nameField, 'Пожалуйста, введите ваше имя.');
                isValid = false;
            }
            if (phoneField.value.trim() === '') {
                displayError(phoneField, 'Пожалуйста, введите ваш телефон.');
                isValid = false;
            }
            
            if (!isValid) return;

            submitButton.disabled = true;
            submitButton.textContent = 'Отправка...';

            grecaptcha.ready(() => {
                grecaptcha.execute('6LdbRz0rAAAAANcGVE0I-3t82dtJ2elymdIxIi1j', { action: 'submit_form' }).then((token) => {
                    const formData = new FormData(form);
                    formData.append('recaptcha_response', token);
                    
                    fetch('includes/send_telegram.php', { method: 'POST', body: formData })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                window.openSuccessModal();
                                form.reset();
                            } else {
                                throw new Error(data.message || 'Произошла ошибка на сервере.');
                            }
                        })
                        .catch(error => {
                            alert(`Ошибка отправки: ${error.message}`);
                            console.error('Ошибка отправки формы:', error);
                        })
                        .finally(() => {
                            submitButton.disabled = false;
                            submitButton.textContent = 'Отправить заявку';
                        });
                }).catch(error => {
                     alert('Ошибка reCAPTCHA. Пожалуйста, попробуйте еще раз.');
                     submitButton.disabled = false;
                     submitButton.textContent = 'Отправить заявку';
                });
            });
        });

        function displayError(inputElement, message) {
            inputElement.classList.add('error');
            const errorElement = document.createElement('span');
            errorElement.className = 'error-message-text';
            errorElement.textContent = message;
            inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
        }
    }

    /**
     * Инициализация баннера о согласии на использование cookie.
     */
    function initCookieConsent() {
        const cookieBanner = document.getElementById('cookie-consent-banner');
        const acceptBtn = document.getElementById('accept-cookies');
        const COOKIE_CONSENT_KEY = 'av3d_cookie_consent';

        if (!cookieBanner || !acceptBtn) return;
        
        if (!localStorage.getItem(COOKIE_CONSENT_KEY)) {
            cookieBanner.classList.add('show');
        }

        acceptBtn.addEventListener('click', () => {
            localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
            cookieBanner.classList.remove('show');
        });
    }
});
