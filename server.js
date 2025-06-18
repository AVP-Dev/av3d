// server.js - Основной файл вашего Node.js приложения для обработки обратной связи

// Загружает переменные окружения из файла .env (если он есть локально для разработки)
// В Coolify эти переменные нужно будет добавить в разделе "Environment Variables"
require('dotenv').config(); 

// Импортируем необходимые модули
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch'); // Для выполнения HTTP-запросов (Node.js 18+ может использовать нативный fetch)
const { URL } = require('url'); // Для парсинга URL referer

const app = express();
// Порт, на котором будет слушать ваше Node.js приложение.
// Coolify будет проксировать внешний трафик на этот порт.
const port = process.env.PORT || 3000; 

// Middleware для парсинга JSON и URL-encoded данных из POST-запросов
// maxBytesLimit - увеличен для потенциально больших форм или reCAPTCHA ответов
app.use(bodyParser.json({ limit: '10mb' })); 
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// --- Переменные окружения для Telegram и reCAPTCHA ---
// В Coolify эти переменные нужно будет добавить в разделе "Environment Variables"
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

// RECAPTCHA_THRESHOLD может быть строкой, поэтому преобразуем в число
const RECAPTCHA_THRESHOLD = parseFloat(process.env.RECAPTCHA_THRESHOLD || '0.5'); 

// Разрешенные домены для проверки referer
// В Coolify это должна быть строка, разделенная запятыми, например: "av3d.by,www.av3d.by"
const ALLOWED_DOMAINS_ENV = process.env.ALLOWED_DOMAINS;
const ALLOWED_DOMAINS = ALLOWED_DOMAINS_ENV 
    ? ALLOWED_DOMAINS_ENV.split(',').map(d => d.trim()) 
    : ['av3d.by', 'www.av3d.by']; // Здесь явно указаны ваши домены 'av3d.by' и 'www.av3d.by'

// MIN_FORM_SUBMIT_TIME для защиты от спама
const MIN_FORM_SUBMIT_TIME = parseInt(process.env.MIN_FORM_SUBMIT_TIME || '5', 10);

// --- Главный маршрут для обработки POST-запроса с формы обратной связи ---
// Убедитесь, что ваш фронтенд отправляет запросы именно на этот путь!
app.post('/includes/send-telegram', async (req, res) => {
    // Устанавливаем заголовок Content-Type для JSON-ответа
    res.setHeader('Content-Type', 'application/json');

    // 1. Проверка Referer (защита от CSRF и нежелательных источников)
    const refererHeader = req.headers.referer;
    let refererHostname = '';
    try {
        if (refererHeader) {
            refererHostname = new URL(refererHeader).hostname;
        }
    } catch (e) {
        console.warn('Некорректный URL в заголовке Referer:', refererHeader);
        // Если referer некорректен, можно либо запретить, либо пропустить проверку
        // В данном случае, если парсинг не удался, refererHostname останется пустым и не будет в списке.
    }
    
    // Добавляем 'localhost' для локальной разработки, если его нет в ALLOWED_DOMAINS
    const currentAllowedDomains = [...ALLOWED_DOMAINS];
    if (process.env.NODE_ENV !== 'production' && !currentAllowedDomains.includes('localhost')) {
        currentAllowedDomains.push('localhost');
    }

    if (!currentAllowedDomains.includes(refererHostname)) {
        console.error(`Доступ запрещен: Несанкционированный referer '${refererHostname}' из '${refererHeader}'`);
        return res.status(403).json({ success: false, message: 'Доступ запрещен.' });
    }

    // 2. Honeypot (защита от простых ботов)
    // Если поле 'website' заполнено, это, вероятно, бот.
    if (req.body.website) { 
        console.log('Honeypot сработал. Заявка от бота.');
        // Возвращаем успешный ответ, чтобы боты думали, что все ок
        return res.json({ success: true, message: 'Заявка обработана.' });
    }

    // 3. Защита от спама: проверка времени отправки формы
    if (MIN_FORM_SUBMIT_TIME && req.headers['x-form-submit-time']) {
        const submitTime = parseInt(req.headers['x-form-submit-time'], 10); 
        if (isNaN(submitTime) || (Date.now() / 1000) - submitTime < MIN_FORM_SUBMIT_TIME) {
            console.warn(`Форма отправлена слишком быстро (${(Date.now() / 1000) - submitTime} сек).`);
            return res.status(429).json({ success: false, message: 'Форма отправлена слишком быстро. Пожалуйста, подождите.' });
        }
    }


    // 4. Проверка reCAPTCHA
    const recaptchaResponse = req.body.recaptcha_response;
    if (!recaptchaResponse) {
        console.error('Ошибка reCAPTCHA: Токен не предоставлен.');
        return res.status(400).json({ success: false, message: 'Ошибка reCAPTCHA: Токен не предоставлен.' });
    }

    if (!RECAPTCHA_SECRET_KEY || isNaN(RECAPTCHA_THRESHOLD)) {
        console.error('Ошибка конфигурации: RECAPTCHA_SECRET_KEY или RECAPTCHA_THRESHOLD не определены/некорректны.');
        return res.status(500).json({ success: false, message: 'Ошибка конфигурации сервера.' });
    }

    try {
        const recaptchaVerifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
        const recaptchaData = new URLSearchParams({
            secret: RECAPTCHA_SECRET_KEY,
            response: recaptchaResponse,
            remoteip: req.ip || req.connection.remoteAddress // IP пользователя
        });

        const recaptchaResult = await fetch(recaptchaVerifyUrl, {
            method: 'POST',
            body: recaptchaData
        });
        const recaptchaJson = await recaptchaResult.json();

        if (!recaptchaJson.success || (typeof recaptchaJson.score === 'number' && recaptchaJson.score < RECAPTCHA_THRESHOLD)) {
            console.error('Проверка reCAPTCHA не пройдена:', JSON.stringify(recaptchaJson, null, 2));
            const errorCodes = recaptchaJson['error-codes'] ? `Ошибки: ${recaptchaJson['error-codes'].join(', ')}` : '';
            return res.status(400).json({ 
                success: false, 
                message: `Проверка reCAPTCHA не пройдена. Пожалуйста, попробуйте еще раз. ${errorCodes}` 
            });
        }

        // --- 5. Отправка сообщения в Telegram ---
        if (!BOT_TOKEN || !CHAT_ID) {
            console.error('Ошибка конфигурации: BOT_TOKEN или CHAT_ID не определены.');
            return res.status(500).json({ success: false, message: 'Ошибка конфигурации сервера (Telegram).' });
        }

        // Очистка и получение данных из формы
        const name = req.body.name ? String(req.body.name).trim() : 'Не указано';
        const phone = req.body.phone ? String(req.body.phone).trim() : 'Не указано';
        let email = req.body.email ? String(req.body.email).trim() : '';
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { // Простая валидация email
            email = `Некорректный email: ${email}`;
        }
        const message = req.body.message ? String(req.body.message).trim() : 'Нет сообщения';
        const formType = req.body.form_type ? String(req.body.form_type).trim() : 'Заказ';

        const telegramMessage = `📌 *Новая заявка (${formType})*\n\n` +
                                `👤 *Имя:* ${name}\n` +
                                `📱 *Телефон:* ${phone}\n` +
                                (email ? `📧 *Email:* ${email}\n` : '') +
                                (message && message !== 'Нет сообщения' ? `✉️ *Сообщение:*\n${message}\n` : '');

        const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const telegramData = {
            chat_id: CHAT_ID,
            text: telegramMessage,
            parse_mode: 'Markdown', // Или 'HTML', в зависимости от ваших предпочтений
            disable_web_page_preview: true
        };

        // Добавляем message_thread_id, если он есть
        if (process.env.MESSAGE_THREAD_ID) {
            const messageThreadId = parseInt(process.env.MESSAGE_THREAD_ID, 10);
            if (!isNaN(messageThreadId)) {
                telegramData.message_thread_id = messageThreadId;
            }
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
            console.error('Ошибка Telegram API:', JSON.stringify(telegramResult, null, 2));
            res.status(500).json({ success: false, message: `Ошибка при отправке сообщения в Telegram: ${telegramResult.description || 'Неизвестная ошибка'}` });
        }

    } catch (error) {
        console.error('Внутренняя ошибка сервера:', error);
        res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера.' });
    }
});

// --- Маршрут для обслуживания статических файлов ---
// Это позволит вашему Node.js приложению отдавать index.html и другие статические файлы.
// Учитывая ваш скриншот файловой структуры, все ваши статические файлы
// (index.html, assets/, includes/ - которые не являются PHP-скриптами)
// находятся прямо в корне репозитория, который в контейнере будет /app.
app.use(express.static(__dirname)); // Отдаем статические файлы из текущей директории (/app)

// Слушаем указанный порт
app.listen(port, () => {
    console.log(`Node.js Server listening on port ${port}`);
    console.log(`Access at http://localhost:${port}`); // Только для локальной разработки
});
