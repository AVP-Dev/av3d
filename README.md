<div align="center">
  <a href="https://av3d.by" target="_blank">
    <img src="https://av3d.by/assets/img/logo.webp" alt="AV3D Logo" width="100"/>
  </a>
  <h1>AV3D | 3D-печать и моделирование</h1>
  <p>
    Профессиональные услуги 3D-печати и моделирования в Беларуси. Проект представляет собой адаптивный лендинг с формой заказа и портфолио работ.
  </p>
</div>

---

### ✨ Основные возможности (Features)

-   **Полностью адаптивный дизайн:** Отличный вид на мобильных устройствах, планшетах и десктопах.
-   **Интерактивность:**
    -   🎨 Переключатель светлой/темной темы.
    -   📝 Форма заказа с валидацией, **reCAPTCHA v3** и уведомлениями в **Telegram**.
    -   🖼️ Портфолио с лайтбоксом для просмотра изображений.
    -   ❓ FAQ-аккордеон для ответов на частые вопросы.
-   **SEO и аналитика:**
    -   📈 Интеграция с **Яндекс.Метрикой** и **Google Analytics**.
    -   🤖 Файлы `robots.txt` и `sitemap.xml` для лучшей индексации.
    -   📄 Микроразметка **Schema.org** для лучшего представления в поиске.

### 🛠️ Стек технологий

-   **Frontend:** `HTML5`, `CSS3`, `Vanilla JavaScript`
-   **Backend (для формы):** `Node.js` (`Express.js`)
-   **Интеграции:** `Telegram Bot API`, `Google reCAPTCHA v3`

### 🚀 Как запустить

#### 1. Клонируйте репозиторий

```bash
git clone https://github.com/AVP-Dev/av3d.git
cd av3d
```

#### 2. Настройка Backend (для формы)

1.  Установите [Node.js](https://nodejs.org/) (версия 14.x или выше).
2.  В корне проекта установите зависимости Node.js:
    ```bash
    npm install
    ```
3.  Создайте файл `.env` в корне проекта (рядом с `server.js`) и заполните его по примеру ниже, указав ваши ключи для **Telegram** и **reCAPTCHA**:

    ```dotenv
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
    ```

#### 3. Запуск локально

1.  Запустите Node.js сервер:
    ```bash
    npm start
    ```
2.  Откройте файл `index.html` в вашем браузере. Форма будет отправлять данные на `http://localhost:3000/includes/send-telegram`.

#### 4. Развертывание на Coolify

1.  Создайте новое приложение в Coolify.
2.  Укажите URL вашего репозитория.
3.  **Build Pack:** Выберите `Nixpacks`. Coolify автоматически обнаружит Node.js-проект по файлу `package.json`.
4.  **Port:** Установите `3000`.
5.  **Custom Nginx Configuration:** Оставьте это поле **ПУСТЫМ**. Coolify сам настроит проксирование.
6.  **Environment Variables:** Добавьте все переменные из вашего `.env` файла в Coolify (например, `BOT_TOKEN`, `CHAT_ID`, `RECAPTCHA_SECRET_KEY`, `ALLOWED_DOMAINS` и т.д.).

### 📫 Контакты

-   **Email:** [info@av3d.by](mailto:info@av3d.by)
-   **Telegram:** [@artbyavp](https://t.me/artbyavp)
-   **Телефон:** `+375 (29) 121-73-71`