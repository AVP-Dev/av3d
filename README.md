✨ Основные возможности (Features)
Полностью адаптивный дизайн: Отличный вид на мобильных устройствах, планшетах и десктопах.

Интерактивность:

🎨 Переключатель светлой/темной темы.

📝 Форма заказа с валидацией, reCAPTCHA v3 и уведомлениями в Telegram.

🖼️ Портфолио с лайтбоксом для просмотра изображений.

❓ FAQ-аккордеон для ответов на частые вопросы.

SEO и аналитика:

📈 Интеграция с Яндекс.Метрикой и Google Analytics.

🤖 Файлы robots.txt и sitemap.xml для лучшей индексации.

Микроразметка Schema.org для лучшего представления в поиске.

🛠️ Стек технологий
Frontend: HTML5, CSS3, Vanilla JavaScript

Backend (для формы): Node.js (Express.js)

Интеграции: Telegram Bot API, Google reCAPTCHA v3

🚀 Как запустить
Для локальной разработки или развертывания:

Клонируйте репозиторий:

git clone https://github.com/AVP-Dev/av3d.git
cd av3d

Настройка Backend (для формы):

Установите Node.js (версия 14.x или выше).

В корне проекта установите зависимости Node.js:

npm install

Создайте файл .env в корне проекта (рядом с server.js) на основе примера. Укажите в нем ваши ключи для Telegram и reCAPTCHA:

# Telegram API
BOT_TOKEN=ВАШ_ТОКЕН_БОТА
CHAT_ID=ВАШ_ID_ЧАТА
MESSAGE_THREAD_ID=ID_ТЕМЫ_ЧАТА (опционально)

# Google reCAPTCHA v3
RECAPTCHA_SECRET_KEY=ВАШ_СЕКРЕТНЫЙ_КЛЮЧ_RECAPTCHA
RECAPTCHA_THRESHOLD=0.5

# Домены, с которых разрешены запросы к форме (разделяйте запятыми)
ALLOWED_DOMAINS=av3d.by,www.av3d.by,localhost

# Защита от спама: минимальное время отправки формы в секундах
MIN_FORM_SUBMIT_TIME=5

# Порт для Node.js сервера (Coolify будет использовать 3000 по умолчанию)
PORT=3000

Запуск локально:

Запустите Node.js сервер:

npm start

Откройте файл index.html в вашем браузере. Форма будет отправлять данные на http://localhost:3000/includes/send-telegram.

Развертывание на Coolify:

Создайте новое приложение в Coolify.

Укажите URL вашего репозитория.

Build Pack: Выберите Nixpacks. Coolify автоматически обнаружит Node.js-проект по package.json.

Port: Установите 3000.

Custom Nginx Configuration: Оставьте это поле ПУСТЫМ. Coolify сам настроит проксирование.

Environment Variables: Добавьте все переменные из вашего .env файла в Coolify (например, BOT_TOKEN, CHAT_ID, RECAPTCHA_SECRET_KEY, ALLOWED_DOMAINS и т.д.).

📫 Контакты
Email: info@av3d.by

Telegram: @artbyavp

Телефон: +375 (29) 121-73-71