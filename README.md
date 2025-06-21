<div align="center">
  <a href="https://av3d.by" target="_blank">
    <img src="https://av3d.by/assets/img/logo.webp" alt="AV3D Logo" width="100"/>
  </a>
  <h1>AV3D | 3D-печать и моделирование</h1>
  <p>
    Профессиональные услуги 3D-печати и моделирования в Беларуси. Проект представляет собой адаптивный лендинг с формой заказа и портфолио работ, построенный на Vanilla JS и Node.js.
  </p>
  <p>
    <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5"/>
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3"/>
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js"/>
  </p>
</div>

---

### ✨ Основные возможности (Features)

-   **Полностью адаптивный дизайн:** Отличный вид на мобильных устройствах, планшетах и десктопах.
-   **Интерактивность:**
    -   🎨 Переключатель светлой/темной темы с сохранением выбора.
    -   📝 Форма заказа с валидацией, **reCAPTCHA v3** и уведомлениями в **Telegram**.
    -   🖼️ Портфолио с лайтбоксом для просмотра изображений.
    -   ❓ FAQ-аккордеон для ответов на частые вопросы.
-   **SEO и аналитика:**
    -   📈 Интеграция с **Яндекс.Метрикой** и **Google Analytics**.
    -   📄 Микроразметка **Schema.org** для лучшего представления в поиске.
-   **Безопасность:**
    -   🛡️ Защита от спама (reCAPTCHA, Honeypot).
    -   ⚙️ Защита от CSRF и ограничение запросов по домену на стороне сервера.

### 🛠️ Стек технологий

-   **Frontend:** `HTML5`, `CSS3`, `Vanilla JavaScript`
-   **Backend (для формы):** `Node.js` (`Express.js`)
-   **Интеграции:** `Telegram Bot API`, `Google reCAPTCHA v3`
-   **Хостинг/Деплой:** `Coolify`

### 🚀 Запуск проекта

#### 1. Клонирование репозитория

```bash
git clone https://github.com/AVP-Dev/av3d.git
cd av3d
```

#### 2. Настройка Backend

1.  Установите [Node.js](https://nodejs.org/) (версия 16.x или выше).
2.  В корне проекта установите зависимости Node.js:
    ```bash
    npm install
    ```
3.  Создайте файл `.env` в корне проекта (рядом с `server.js`) и заполните его по примеру ниже. **Никогда не добавляйте этот файл в Git!**

    ```dotenv
    # --- Telegram API ---
    # Токен вашего Telegram бота, полученный от @BotFather
    BOT_TOKEN=ВАШ_ТОКЕН_БОТА
    # ID вашего чата или канала. Чтобы узнать, используйте бота @userinfobot
    CHAT_ID=ВАШ_ID_ЧАТА
    # ID темы (topic) в группе, если вы используете темы (опционально)
    MESSAGE_THREAD_ID=

    # --- Google reCAPTCHA v3 ---
    # Секретный ключ reCAPTCHA v3 с консоли Google
    RECAPTCHA_SECRET_KEY=ВАШ_СЕКРЕТНЫЙ_КЛЮЧ_RECAPTCHA
    # Порог срабатывания (от 0.0 до 1.0). 0.5 - хороший старт.
    RECAPTCHA_THRESHOLD=0.5

    # --- Настройки сервера ---
    # Порт для Node.js сервера (Coolify по умолчанию использует 3000)
    PORT=3000
    # Домены, с которых разрешены запросы к форме (через запятую, без пробелов)
    # Для локальной разработки localhost добавляется автоматически
    ALLOWED_DOMAINS=av3d.by,www.av3d.by
    ```

#### 3. Запуск в режиме разработки

1.  Для удобной разработки рекомендуется использовать `nodemon`. Если он не установлен, выполните: `npm install -g nodemon`.
2.  Добавьте в `package.json` в раздел `scripts` строку: `"dev": "nodemon server.js"`.
3.  Запустите сервер в режиме разработки:
    ```bash
    npm run dev
    ```
    Или используйте стандартный запуск:
    ```bash
    npm start
    ```
4.  **Откройте браузер и перейдите по адресу:** `http://localhost:3000`. Весь сайт, включая форму, будет работать корректно.

#### 4. Развертывание на Coolify

1.  Создайте новое приложение в Coolify и укажите URL вашего Git-репозитория.
2.  **Build Pack:** Выберите `Nixpacks`. Coolify автоматически обнаружит Node.js проект.
3.  **Port:** Установите `3000` (или тот порт, что указан в `PORT` в переменных окружения).
4.  **Install Command:** `npm install` (обычно определяется автоматически).
5.  **Start Command:** `npm start` (обычно определяется автоматически).
6.  **Environment Variables:** Перейдите в раздел "Environment Variables" и добавьте все переменные из вашего `.env` файла (`BOT_TOKEN`, `CHAT_ID`, `RECAPTCHA_SECRET_KEY`, `ALLOWED_DOMAINS` и т.д.).

### 📫 Контакты

-   **Автор:** [AVP-Dev](https://github.com/AVP-Dev)
-   **Email:** [info@av3d.by](mailto:info@av3d.by)
-   **Telegram:** [@avpdevcom](https://t.me/avpdevcom)
-   **Телефон:** `+375 (29) 121-73-71`
```