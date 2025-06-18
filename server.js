// server.js - Основной файл Node.js приложения для обработки обратной связи
require('dotenv').config();

// --- Импорт модулей ---
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const { URL } = require('url');
const path = require('path');
const rateLimit = require('express-rate-limit');

// --- Инициализация Express приложения ---
const app = express();
const port = process.env.PORT || 3000;

// --- Переменные окружения ---
const {
    BOT_TOKEN,
    CHAT_ID,
    RECAPTCHA_SECRET_KEY,
    ALLOWED_DOMAINS,
    MESSAGE_THREAD_ID,
} = process.env;

const RECAPTCHA_THRESHOLD = parseFloat(process.env.RECAPTCHA_THRESHOLD || '0.5');
const allowedDomainsList = ALLOWED_DOMAINS ? ALLOWED_DOMAINS.split(',').map(d => d.trim()) : ['av3d.by', 'www.av3d.by'];
if (process.env.NODE_ENV !== 'production') {
    allowedDomainsList.push('localhost');
}

// --- Middlewares (Промежуточное ПО) ---

// 1. Парсинг тела запроса (JSON и URL-encoded)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 2. Обслуживание статических файлов (HTML, CSS, JS, изображения)
// Все файлы из корневой директории будут доступны
app.use(express.static(path.join(__dirname)));

// 3. Rate Limiter: ограничение запросов для защиты от брутфорса
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 20, // Максимум 20 запросов с одного IP за 15 минут
    message: { success: false, message: 'Слишком много запросов с вашего IP. Пожалуйста, попробуйте позже.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// 4. Проверка Referer и Honeypot
const checkSecurity = (req, res, next) => {
    // Проверка Referer (защита от CSRF)
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

    // Honeypot (ловушка для простых ботов)
    if (req.body.website) {
        console.log('Honeypot сработал. Заявка от бота проигнорирована.');
        // Отправляем успешный ответ, чтобы сбить бота с толку
        return res.json({ success: true, message: 'Ваша заявка успешно отправлена!' });
    }

    next(); // Если все проверки пройдены, передаем управление дальше
};

// --- Функция для санитизации ввода ---
const sanitize = (text) => {
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// --- Основной маршрут для обработки формы ---
app.post('/includes/send-telegram', apiLimiter, checkSecurity, async (req, res, next) => {
    try {
        // 1. Проверка reCAPTCHA
        const recaptchaResponse = req.body.recaptcha_response;
        if (!recaptchaResponse) {
            return res.status(400).json({ success: false, message: 'reCAPTCHA токен не предоставлен.' });
        }

        const recaptchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaResponse}&remoteip=${req.ip}`;
        const recaptchaResult = await fetch(recaptchaVerifyUrl, { method: 'POST' });
        const recaptchaJson = await recaptchaResult.json();

        if (!recaptchaJson.success || recaptchaJson.score < RECAPTCHA_THRESHOLD) {
            console.error('Проверка reCAPTCHA не пройдена:', recaptchaJson);
            return res.status(400).json({ success: false, message: 'Проверка на робота не пройдена.' });
        }

        // 2. Подготовка и отправка сообщения в Telegram
        if (!BOT_TOKEN || !CHAT_ID) {
            console.error('Ошибка конфигурации: BOT_TOKEN или CHAT_ID не определены.');
            return res.status(500).json({ success: false, message: 'Ошибка конфигурации сервера.' });
        }

        // Получение и санитизация данных из формы
        const name = sanitize(req.body.name || 'Не указано');
        const phone = sanitize(req.body.phone || 'Не указано');
        const email = sanitize(req.body.email || ''); // Email необязателен, пустая строка ок
        const service = sanitize(req.body.service || 'Не выбрана');
        const messageText = sanitize(req.body.message || 'Нет сообщения');

        const telegramMessage = `
📌 *Новая заявка с сайта AV3D*

👤 *Имя:* \`${name}\`
📱 *Телефон:* \`${phone}\`
${email ? `📧 *Email:* \`${email}\`\n` : ''}
🔧 *Услуга:* ${service}

✉️ *Сообщение:*
${messageText}
        `.trim();

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
        next(error); // Передаем ошибку в глобальный обработчик
    }
});

// --- Глобальный обработчик ошибок ---
// Должен идти последним в цепочке app.use
app.use((err, req, res, next) => {
    console.error('Произошла внутренняя ошибка сервера:', err);
    res.status(500).json({
        success: false,
        message: 'Произошла внутренняя ошибка сервера. Мы уже работаем над этим.'
    });
});

// --- Запуск сервера ---
app.listen(port, () => {
    console.log(`Сервер AV3D запущен на порту ${port}`);
    console.log(`Для локальной разработки сайт доступен по адресу: http://localhost:${port}`);
});