require('dotenv').config();

const express = require('express');
const fetch = require('node-fetch');
const { URL } = require('url');
const path = require('path');
const rateLimit = require('express-rate-limit');

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

const RECAPTCHA_THRESHOLD = parseFloat(process.env.RECAPTCHA_THRESHOLD || '0.5');

// --- Настройка Express ---
// Используем встроенные middleware вместо body-parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// --- Безопасность ---
const allowedDomainsList = ALLOWED_DOMAINS 
    ? ALLOWED_DOMAINS.split(',').map(d => d.trim()) 
    : ['av3d.by', 'www.av3d.by'];
if (process.env.NODE_ENV !== 'production') {
    allowedDomainsList.push('localhost');
}

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 20,
    message: { success: false, message: 'Слишком много запросов с вашего IP. Пожалуйста, попробуйте позже.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const checkSecurity = (req, res, next) => {
    // Проверка Referer
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

    // Проверка Honeypot
    if (req.body.website) {
        console.log('Honeypot сработал. Заявка от бота проигнорирована.');
        // Отправляем успешный ответ, чтобы не раскрывать боту наличие ловушки
        return res.json({ success: true, message: 'Ваша заявка успешно отправлена!' });
    }

    next();
};

const sanitize = (text) => {
    if (!text) return '';
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// --- Обработка POST-запроса ---
app.post('/includes/send-telegram', apiLimiter, checkSecurity, async (req, res, next) => {
    try {
        // Проверка reCAPTCHA
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

        if (!BOT_TOKEN || !CHAT_ID) {
            console.error('Ошибка конфигурации: BOT_TOKEN или CHAT_ID не определены.');
            return res.status(500).json({ success: false, message: 'Ошибка конфигурации сервера.' });
        }
        
        // --- Подготовка и отправка сообщения в Telegram ---
        const name = sanitize(req.body.name);
        const phone = sanitize(req.body.phone);
        const email = sanitize(req.body.email);
        const service = sanitize(req.body.service);
        const messageText = sanitize(req.body.message);

        const telegramMessage = [
            `📌 *Новая заявка с сайта AV3D*`,
            ``,
            `👤 *Имя:* \`${name || 'Не указано'}\``,
            `📱 *Телефон:* \`${phone || 'Не указано'}\``,
            email ? `📧 *Email:* \`${email}\`` : '',
            `🔧 *Услуга:* ${service || 'Не выбрана'}`,
            ``,
            `✉️ *Сообщение:*`,
            `${messageText || 'Нет сообщения'}`
        ].filter(Boolean).join('\n');
        
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
        next(error);
    }
});

// --- Обработка ошибок ---
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
