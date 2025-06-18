require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const { URL } = require('url');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3000;

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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname)));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Слишком много запросов с вашего IP. Пожалуйста, попробуйте позже.' },
    standardHeaders: true,
    legacyHeaders: false,
});

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

const sanitize = (text) => {
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

app.post('/includes/send-telegram', apiLimiter, checkSecurity, async (req, res, next) => {
    try {
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

        const name = sanitize(req.body.name || 'Не указано');
        const phone = sanitize(req.body.phone || 'Не указано');
        const email = sanitize(req.body.email || '');
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
        next(error);
    }
});

app.use((err, req, res, next) => {
    console.error('Произошла внутренняя ошибка сервера:', err);
    res.status(500).json({
        success: false,
        message: 'Произошла внутренняя ошибка сервера. Мы уже работаем над этим.'
    });
});

app.listen(port, () => {
    console.log(`Сервер AV3D запущен на порту ${port}`);
    console.log(`Для локальной разработки сайт доступен по адресу: http://localhost:${port}`);
});
