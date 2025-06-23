// Используем 'dotenv' для загрузки переменных окружения из .env файла
require('dotenv').config();

const express = require('express');
const { URL } = require('url');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet'); // Добавляем Helmet для безопасности

const app = express();
const port = process.env.PORT || 3000;

// --- Конфигурация из переменных окружения ---
const {
    BOT_TOKEN,
    CHAT_ID,
    RECAPTCHA_SECRET_KEY,
    ALLOWED_DOMAINS,
    MESSAGE_THREAD_ID,
    NODE_ENV // Добавляем NODE_ENV
} = process.env;

// Проверяем наличие обязательных переменных
if (!BOT_TOKEN || !CHAT_ID || !RECAPTCHA_SECRET_KEY) {
    console.error("Ошибка: Необходимые переменные окружения (BOT_TOKEN, CHAT_ID, RECAPTCHA_SECRET_KEY) не установлены.");
    process.exit(1); // Завершаем процесс, если конфигурация неполная
}

const RECAPTCHA_THRESHOLD = parseFloat(process.env.RECAPTCHA_THRESHOLD || '0.5');

// --- Настройка Express ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Безопасность ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "https://mc.yandex.ru", "https://www.googletagmanager.com", "https://www.google.com", "https://www.gstatic.com", "'unsafe-inline'"], // Added 'unsafe-inline' for reCAPTCHA dynamic script loading
            "img-src": ["'self'", "data:", "https://mc.yandex.ru", "https://www.google.com"], // Added google.com for reCAPTCHA badge
            "connect-src": ["'self'", "https://mc.yandex.ru", "https://www.google.com/recaptcha/", "https://www.recaptcha.net/recaptcha/api/"], // Added recaptcha.net
            "frame-src": ["'self'", "https://www.google.com", "https://mc.yandex.com/", "https://www.recaptcha.net/recaptcha/api/"], // Added recaptcha.net
        },
    },
    // Disable DNS Prefetch Control to avoid potential issues with dynamic external scripts
    dnsPrefetchControl: { allow: false }
}));

// Статичные файлы должны обслуживаться после настройки безопасности
app.use(express.static(path.join(__dirname)));


const allowedDomainsList = ALLOWED_DOMAINS 
    ? ALLOWED_DOMAINS.split(',').map(d => d.trim()) 
    : ['av3d.by', 'www.av3d.by'];

if (NODE_ENV !== 'production') { // Use NODE_ENV for environment specific settings
    allowedDomainsList.push('localhost');
    console.log("Development mode detected. 'localhost' added to ALLOWED_DOMAINS.");
}

// Ограничение частоты запросов
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 20,
    message: { success: false, message: 'Слишком много запросов с вашего IP. Пожалуйста, попробуйте позже.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => { // Use IP from request for rate limiting
        return req.ip;
    }
});

// Middleware для проверки безопасности
const checkSecurity = (req, res, next) => {
    const referer = req.headers.referer;
    let refererHostname = '';
    
    try {
        if (referer) {
            refererHostname = new URL(referer).hostname;
        }
    } catch (e) {
        console.warn('Некорректный Referer:', referer, e.message);
    }
    
    // Allow requests without a referer if not in production, for easier testing.
    // In production, a missing referer should be treated with caution.
    if (NODE_ENV === 'production' && !refererHostname) {
        console.error('Доступ запрещен: Отсутствует Referer в Production режиме.');
        return res.status(403).json({ success: false, message: 'Доступ запрещен. Отсутствует Referer.' });
    }

    if (!allowedDomainsList.includes(refererHostname)) {
        console.error(`Доступ запрещен: Несанкционированный referer '${refererHostname}'`);
        return res.status(403).json({ success: false, message: `Доступ запрещен. Некорректный домен: ${refererHostname}` });
    }

    // Honeypot check
    if (req.body.website && req.body.website.length > 0) {
        console.log('Honeypot сработал. Заявка от бота проигнорирована.');
        // Return success to bot to avoid alerting it
        return res.json({ success: true, message: 'Ваша заявка успешно отправлена!' });
    }

    next();
};

// Функция для очистки вводимых данных
const sanitize = (text) => {
    if (typeof text !== 'string') return '';
    // Basic sanitization: encode HTML entities to prevent XSS
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

// --- Маршрут для обработки формы ---
app.post('/includes/send-telegram', apiLimiter, checkSecurity, async (req, res, next) => {
    try {
        // Динамический импорт node-fetch
        const fetch = (await import('node-fetch')).default;

        // Проверка reCAPTCHA
        const recaptchaResponse = req.body.recaptcha_response;
        if (!recaptchaResponse) {
            console.error('reCAPTCHA токен не предоставлен.');
            return res.status(400).json({ success: false, message: 'reCAPTCHA токен не предоставлен.' });
        }

        const recaptchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
        const recaptchaReqBody = new URLSearchParams({
            secret: RECAPTCHA_SECRET_KEY,
            response: recaptchaResponse,
            remoteip: req.ip // Pass the user's IP for better reCAPTCHA scoring
        });

        const recaptchaResult = await fetch(recaptchaVerifyUrl, { 
            method: 'POST',
            body: recaptchaReqBody
        });
        
        const recaptchaJson = await recaptchaResult.json();

        if (!recaptchaJson.success || recaptchaJson.score < RECAPTCHA_THRESHOLD) {
            console.error('Проверка reCAPTCHA не пройдена. Оценка:', recaptchaJson.score, 'Ошибки:', recaptchaJson['error-codes']);
            return res.status(401).json({ success: false, message: 'Проверка на робота не пройдена. Попробуйте обновить страницу или повторить попытку.' });
        }
        
        // Очистка и формирование сообщения
        const { name, contact, service, description } = req.body;

        // Ensure all fields are present and sanitized
        const sanitizedName = sanitize(name || 'Не указано');
        const sanitizedContact = sanitize(contact || 'Не указано');
        const sanitizedService = sanitize(service || 'Не указано');
        const sanitizedDescription = sanitize(description || 'Нет описания');

        const telegramMessage = `
*Новая заявка с сайта AV3D.BY*

*Имя:* ${sanitizedName}
*Контакт:* ${sanitizedContact}
*Услуга:* ${sanitizedService}

*Описание:*
\`\`\`
${sanitizedDescription}
\`\`\`
        `.trim();

        // Отправка в Telegram
        const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const telegramData = {
            chat_id: CHAT_ID,
            text: telegramMessage,
            parse_mode: 'Markdown',
        };

        if (MESSAGE_THREAD_ID && !isNaN(parseInt(MESSAGE_THREAD_ID))) {
            telegramData.message_thread_id = parseInt(MESSAGE_THREAD_ID);
        }

        const telegramResponse = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(telegramData)
        });

        const telegramResult = await telegramResponse.json();

        if (telegramResult.ok) {
            console.log('Сообщение успешно отправлено в Telegram.');
            res.json({ success: true, message: 'Ваша заявка успешно отправлена!' });
        } else {
            console.error('Ошибка Telegram API:', telegramResult);
            // Provide more specific error if possible without exposing sensitive info
            const errorMessage = telegramResult.description || 'Не удалось отправить заявку. Попробуйте позже.';
            res.status(500).json({ success: false, message: errorMessage });
        }

    } catch (error) {
        console.error('Произошла ошибка в /includes/send-telegram:', error);
        next(error); // Передаем ошибку в централизованный обработчик
    }
});

// --- Обработка корневого маршрута ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Централизованный обработчик ошибок ---
app.use((err, req, res, next) => {
    console.error('Произошла внутренняя ошибка сервера:', err);
    // Избегаем отправки стека ошибки клиенту в production
    const message = NODE_ENV === 'production' 
        ? 'Произошла внутренняя ошибка сервера. Мы уже работаем над этим.'
        : err.message;
    res.status(500).json({
        success: false,
        message: message
    });
});

// --- Запуск сервера ---
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
