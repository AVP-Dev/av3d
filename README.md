<div align="center">
  <a href="https://av3d.by" target="_blank">
    <img src="https://av3d.by/assets/img/logo.webp" alt="AV3D Logo" width="100"/>
  </a>
  <h1>AV3D | 3D-печать и моделирование</h1>
  <p>
    Исходный код официального сайта <a href="https://av3d.by/">av3d.by</a> — сервиса 3D-печати и моделирования в Беларуси. Проект представляет собой адаптивный лендинг, построенный на чистом HTML, CSS и JavaScript, с бэкендом на Node.js для обработки формы заказа.
  </p>
  <p>
    <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5"/>
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3"/>
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js"/>
    <img src="https://img.shields.io/github/license/AVP-Dev/av3d?style=for-the-badge" alt="License">
  </p>
</div>

---

### ✨ Основные возможности (Features)

-   **Полностью адаптивный дизайн:** Отличный вид на мобильных устройствах, планшетах и десктопах.
-   **Интерактивность:**
    -   🎨 Переключатель светлой/темной темы с сохранением выбора в `localStorage`.
    -   📝 Форма заказа с валидацией на клиенте, **Google reCAPTCHA v3** и отправкой уведомлений в **Telegram**.
    -   🖼️ Портфолио с лайтбоксом для просмотра изображений.
    -   ❓ FAQ-аккордеон для ответов на частые вопросы.
-   **SEO и производительность:**
    -   📈 Интеграция с **Яндекс.Метрикой** и **Google Analytics**.
    -   📄 Микроразметка **Schema.org** (`LocalBusiness`) для лучшего представления в поиске.
    -   ⚡ Оптимизация загрузки (preconnect, preload, lazy loading изображений).
-   **Безопасность:**
    -   🛡️ Защита от спама на бэкенде (проверка reCAPTCHA, honeypot).
    -   ⚙️ Защита от CSRF (проверка домена-отправителя).

### 🛠️ Стек технологий

-   **Frontend:** `HTML5`, `CSS3`, `Vanilla JavaScript` (без фреймворков).
-   **Backend (для формы):** `Node.js` + `Express.js`.
-   **Интеграции:** `Telegram Bot API`, `Google reCAPTCHA v3`.
-   **Хостинг/Деплой:** `Coolify` на собственном VPS.

### 🚀 Запуск проекта локально

Проект состоит из фронтенда (сам сайт) и бэкенда (сервер для формы).

#### 1. Фронтенд

Для просмотра визуальной части сайта достаточно открыть файл `index.html` в любом браузере. Бэкенд для этого не требуется.

#### 2. Бэкенд (для работы формы)

1.  **Клонируйте репозиторий:**
    ```bash
    git clone https://github.com/AVP-Dev/av3d.git
    cd av3d
    ```
2.  **Установите зависимости:**
    (Требуется [Node.js](https://nodejs.org/) v16+).
    ```bash
    npm install
    ```
3.  **Настройте переменные окружения:**
    Создайте файл `.env` в корне проекта и заполните его по примеру ниже:

    ```dotenv
    # Токен вашего Telegram бота (от @BotFather)
    BOT_TOKEN=ВАШ_ТОКЕН_БОТА

    # ID вашего чата или канала (от @userinfobot)
    CHAT_ID=ВАШ_ID_ЧАТА

    # ID темы в группе, если используется (опционально)
    MESSAGE_THREAD_ID=

    # Секретный ключ reCAPTCHA v3
    RECAPTCHA_SECRET_KEY=ВАШ_СЕКРЕТНЫЙ_КЛЮЧ_RECAPTCHA

    # Порог срабатывания reCAPTCHA (от 0.0 до 1.0). Рекомендуется 0.5
    RECAPTCHA_THRESHOLD=0.5

    # Порт для Node.js сервера
    PORT=3000

    # Домены, с которых разрешены запросы к форме (через запятую, без пробелов)
    # Для локальной разработки localhost добавляется автоматически
    ALLOWED_DOMAINS=av3d.by,www.av3d.by
    ```

4.  **Запустите сервер:**
    ```bash
    npm start
    ```
    Сервер будет доступен по адресу `http://localhost:3000`. Теперь форма в `index.html` будет успешно отправлять данные.

### 📫 Контакты

-   **Автор:** [Aliaksei Patskevich (AVP-Dev)](https://avpdev.com)
-   **Telegram:** [@avpdevcom](https://t.me/avpdevcom)