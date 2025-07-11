// Используем 'dotenv' для загрузки переменных окружения из .env файла
require('dotenv').config();

const express = require('express');
const { URL } = require('url');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors'); // Импортируем модуль CORS

const app = express();
const port = process.env.PORT || 3000;

// --- Конфигурация из переменных окружения ---
const {
    BOT_TOKEN,
    CHAT_ID,
    RECAPTCHA_SECRET_KEY,
    ALLOWED_DOMAINS,
    MESSAGE_THREAD_ID,
    NODE_ENV
} = process.env;

// Проверяем наличие обязательных переменных
if (!BOT_TOKEN || !CHAT_ID || !RECAPTCHA_SECRET_KEY) {
    console.error("Ошибка: Необходимые переменные окружения (BOT_TOKEN, CHAT_ID, RECAPTCHA_SECRET_KEY) не установлены.");
    process.exit(1);
}

const RECAPTCHA_THRESHOLD = parseFloat(process.env.RECAPTCHA_THRESHOLD || '0.5');

// --- Настройка Express ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Парсим разрешенные домены для CORS и Referer
const allowedOrigins = ALLOWED_DOMAINS
    ? ALLOWED_DOMAINS.split(',').map(d => {
        let domain = d.trim().toLowerCase();
        if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
            // Добавляем протоколы для корректного сравнения с origin
            return [`http://${domain}`, `https://${domain}`];
        }
        return [domain];
    }).flat()
    : ['https://av3d.by', 'https://www.av3d.by']; // Дефолтные значения для продакшена

// Для разработки добавляем localhost в разрешенные домены и origins
if (NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000'); // Убедитесь, что порт совпадает
    console.log("Development mode detected. 'localhost' added to ALLOWED_DOMAINS and CORS Origins.");
}

console.log("Сервер запущен с ALLOWED_ORIGINS (CORS):", allowedOrigins);

// --- Настройка CORS ---
const corsOptions = {
    origin: (origin, callback) => {
        // Разрешаем запросы без Origin (например, с того же домена или прямые запросы из Postman/Curl)
        // ИЛИ если origin входит в список разрешенных
        if (!origin || allowedOrigins.includes(origin.toLowerCase())) {
            callback(null, true);
        } else {
            console.warn(`CORS Error: Origin '${origin}' not allowed by CORS policy.`);
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Разрешаем отправку куков, если требуется
    optionsSuccessStatus: 204 // Для некоторых старых браузеров (IE11, некоторых SmartTV)
};

app.use(cors(corsOptions)); // Применяем CORS middleware

// --- Безопасность (Helmet) ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            // ИЗМЕНЕНИЕ: Добавлен источник для скриптов Cloudflare
            "script-src": ["'self'", "https://mc.yandex.ru", "https://www.googletagmanager.com", "https://www.google.com", "https://www.gstatic.com", "https://static.cloudflareinsights.com", "'unsafe-inline'"],
            "img-src": ["'self'", "data:", "https://mc.yandex.ru", "https://www.google.com"],
            "connect-src": ["'self'", "https://mc.yandex.ru", "https://www.google.com/recaptcha/", "https://www.recaptcha.net", "https://www.recaptcha.net/recaptcha/api/"],
            "frame-src": ["'self'", "https://www.google.com", "https://mc.yandex.com/", "https://www.recaptcha.net", "https://www.recaptcha.net/recaptcha/api/"],
        },
    },
    dnsPrefetchControl: { allow: false }
}));

// Статичные файлы должны обслуживаться после настройки безопасности
app.use(express.static(path.join(__dirname)));


// Ограничение частоты запросов
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Слишком много запросов с вашего IP. Пожалуйста, попробуйте позже.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip;
    }
});

// Middleware для проверки безопасности (в дополнение к CORS)
const checkSecurity = (req, res, next) => {
    const referer = req.headers.referer;
    let refererHostname = '';
    
    console.log("Получен запрос на /includes/send-telegram");
    console.log("Referer header:", referer);

    try {
        if (referer) {
            refererHostname = new URL(referer).hostname.toLowerCase();
        }
    } catch (e) {
        console.warn('Некорректный Referer или ошибка парсинга:', referer, e.message);
        // Если Referer некорректен или отсутствует в production, продолжаем, но с предупреждением.
        // Основную проверку выполнит CORS. Если CORS уже пропустил, значит origin разрешен.
        if (NODE_ENV === 'production' && !refererHostname) {
             console.warn('Referer отсутствует в production, но запрос пропущен CORS.');
        }
    }
    
    // Дополнительная проверка referer, если origin отсутствует (например, для curl)
    // Если refererHostname есть и не соответствует явно разрешенным доменам
    // и если origin не был разрешен CORS (что маловероятно, если этот middleware
    // идет после CORS и запрос вообще дошел до сюда), то тогда блокируем.
    // В данном случае, CORS - основная защита. Эта проверка - лишь подстраховка.
    if (refererHostname && !allowedOrigins.some(origin => origin.includes(refererHostname))) {
        console.warn(`Доступ потенциально несанкционирован: Referer '${refererHostname}' не соответствует явно разрешенным доменам (но CORS возможно разрешил по Origin).`);
        // В продакшене можно усилить, но пока не будем блокировать, т.к. CORS уже отработал
        // if (NODE_ENV === 'production') {
        //     return res.status(403).json({ success: false, message: `Доступ запрещен: Referer не соответствует.` });
        // }
    }

    // Honeypot check
    const honeypotField = req.body.website;
    if (honeypotField && honeypotField.length > 0) {
        console.log('Honeypot сработал. Заявка от бота проигнорирована.');
        return res.json({ success: true, message: 'Ваша заявка успешно отправлена!' });
    }

    next();
};

// Функция для очистки вводимых данных
const sanitize = (text) => {
    if (typeof text !== 'string') return '';
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

// --- Маршрут для обработки формы ---
app.post('/includes/send-telegram', apiLimiter, checkSecurity, async (req, res, next) => {
    try {
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
            remoteip: req.ip
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
            const errorMessage = telegramResult.description || 'Не удалось отправить заявку. Попробуйте позже.';
            res.status(500).json({ success: false, message: errorMessage });
        }

    } catch (error) {
        console.error('Произошла ошибка в /includes/send-telegram:', error);
        next(error);
    }
});

// --- Обработка корневого маршрута ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Централизованный обработчик ошибок ---
app.use((err, req, res, next) => {
    console.error('Произошла внутренняя ошибка сервера:', err);
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
