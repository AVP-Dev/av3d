// Используем 'dotenv' для загрузки переменных окружения из .env файла
require('dotenv').config();

const express = require('express');
const fetch = require('node-fetch');
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
            "script-src": ["'self'", "https://mc.yandex.ru", "https://www.googletagmanager.com", "https://www.google.com", "https://www.gstatic.com"],
            "img-src": ["'self'", "data:", "https://mc.yandex.ru"],
            "connect-src": ["'self'", "https://mc.yandex.ru", "https://www.google.com/recaptcha/"],
            "frame-src": ["'self'", "https://www.google.com", "https://mc.yandex.com/"],
        },
    },
}));

// Статичные файлы должны обслуживаться после настройки безопасности
app.use(express.static(path.join(__dirname)));


const allowedDomainsList = ALLOWED_DOMAINS 
    ? ALLOWED_DOMAINS.split(',').map(d => d.trim()) 
    : ['av3d.by', 'www.av3d.by'];

if (process.env.NODE_ENV !== 'production') {
    allowedDomainsList.push('localhost');
}

// Ограничение частоты запросов
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 20,
    message: { success: false, message: 'Слишком много запросов с вашего IP. Пожалуйста, попробуйте позже.' },
    standardHeaders: true,
    legacyHeaders: false,
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
        console.warn('Некорректный Referer:', referer);
    }
    
    if (!allowedDomainsList.includes(refererHostname)) {
        console.error(`Доступ запрещен: Несанкционированный referer '${refererHostname}'`);
        return res.status(403).json({ success: false, message: 'Доступ запрещен.' });
    }

    if (req.body.website) {
        console.log('Honeypot сработал. Заявка от бота проигнорирована.');
        return res.json({ success: true, message: 'Ваша заявка успешно отправлена!' });
    }

    next();
};

// Функция для очистки вводимых данных
const sanitize = (text) => {
    if (typeof text !== 'string') return '';
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// --- Маршрут для обработки формы ---
app.post('/includes/send-telegram', apiLimiter, checkSecurity, async (req, res, next) => {
    try {
        // Проверка reCAPTCHA
        const recaptchaResponse = req.body.recaptcha_response;
        if (!recaptchaResponse) {
            return res.status(400).json({ success: false, message: 'reCAPTCHA токен не предоставлен.' });
        }

        const recaptchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
        const recaptchaReqBody = new URLSearchParams({
            secret: RECAPTCHA_SECRET_KEY,
            response: recaptchaResponse,
            remoteip: req.ip
        });

        const recaptchaResult = await fetch(recaptchaVerifyUrl, { 
            method: 'POST',
            body: recaptchaReqBody
        });
        
        const recaptchaJson = await recaptchaResult.json();

        if (!recaptchaJson.success || recaptchaJson.score < RECAPTCHA_THRESHOLD) {
            console.error('Проверка reCAPTCHA не пройдена:', recaptchaJson['error-codes']);
            return res.status(401).json({ success: false, message: 'Проверка на робота не пройдена. Попробуйте обновить страницу.' });
        }
        
        // Очистка и формирование сообщения
        const { name, contact, service, description } = req.body;
        const telegramMessage = `
*Новая заявка с сайта AV3D.BY*

*Имя:* ${sanitize(name)}
*Контакт:* ${sanitize(contact)}
*Услуга:* ${sanitize(service)}

*Описание:*
\`\`\`
${sanitize(description)}
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
            res.status(500).json({ success: false, message: 'Не удалось отправить заявку. Попробуйте позже.' });
        }

    } catch (error) {
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
    const message = process.env.NODE_ENV === 'production' 
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
