<?php
// includes/config.php

// --- Функция для парсинга .env файла (упрощенная) ---
if (!function_exists('loadEnv')) {
    function loadEnv($path) {
        if (!file_exists($path)) {
            throw new \InvalidArgumentException(sprintf('%s does not exist', $path));
        }
        if (!is_readable($path)) {
            throw new \RuntimeException(sprintf('%s file is not readable', $path));
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) { // Игнорируем комментарии
                continue;
            }

            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);

            // Убираем кавычки (если есть) по краям значения
            if (strlen($value) > 1 && $value[0] === '"' && $value[strlen($value) - 1] === '"') {
                $value = substr($value, 1, -1);
            }
            if (strlen($value) > 1 && $value[0] === "'" && $value[strlen($value) - 1] === "'") {
                $value = substr($value, 1, -1);
            }

            if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                putenv(sprintf('%s=%s', $name, $value));
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
}
// --- Конец функции парсинга ---

// Загрузка переменных окружения из .env файла
// Убедись, что .env файл находится в корневой директории проекта (на один уровень выше, чем includes/)
try {
    loadEnv(__DIR__ . '/../.env'); // Путь к .env файлу
} catch (\Exception $e) {
    // В продакшене здесь можно die() или логировать ошибку.
    // Для отладки выводим сообщение.
    error_log('Could not load .env file: ' . $e->getMessage()); // Логируем ошибку
    // Можно раскомментировать die() если критично, что .env не загружен:
    // die('Error loading .env configuration. Please check server logs.'); 
}

// --- Теперь определяем константы, используя значения из .env ---

define('DEFAULT_TIMEZONE', getenv('DEFAULT_TIMEZONE') ?: 'Europe/Minsk'); 

// Telegram settings
define('BOT_TOKEN', getenv('BOT_TOKEN') ?: 'YOUR_DEFAULT_BOT_TOKEN_IF_ANY'); // Используем значение по умолчанию, если переменная не найдена
define('CHAT_ID', getenv('CHAT_ID') ?: 'YOUR_DEFAULT_CHAT_ID_IF_ANY');

$messageThreadIdEnv = getenv('MESSAGE_THREAD_ID');
define('MESSAGE_THREAD_ID', ($messageThreadIdEnv === false || $messageThreadIdEnv === '') ? null : (int)$messageThreadIdEnv);

// reCAPTCHA конфигурация
define('RECAPTCHA_SITE_KEY', getenv('RECAPTCHA_SITE_KEY') ?: 'YOUR_DEFAULT_SITE_KEY_IF_ANY'); // Ключ сайта тоже нужен для JS
define('RECAPTCHA_SECRET_KEY', getenv('RECAPTCHA_SECRET_KEY') ?: 'YOUR_DEFAULT_SECRET_KEY_IF_ANY');
define('RECAPTCHA_THRESHOLD', (float)(getenv('RECAPTCHA_THRESHOLD') ?: 0.5));

// Защита от спама
define('MIN_FORM_SUBMIT_TIME', (int)(getenv('MIN_FORM_SUBMIT_TIME') ?: 5));

// Настройки для логгирования
define('LOG_FILE', __DIR__ . '/../form_submissions.log'); // Путь относительно config.php
define('LOG_MAX_SIZE', 1048576); // 1MB

// Разрешенные домены для отправки форм (защита от CSRF)
$allowedDomainsEnv = getenv('ALLOWED_DOMAINS');
$allowedDomains = $allowedDomainsEnv ? array_map('trim', explode(',', $allowedDomainsEnv)) : ['artbyavp.xyz', 'www.artbyavp.xyz']; // Значения по умолчанию, если .env не загружен или переменная пуста

// ВАЖНО: Удаляем проверку реферера из config.php. Она должна быть в send_telegram.php
// // Проверка домена
// $referer = parse_url($_SERVER['HTTP_REFERER'] ?? '', PHP_URL_HOST);
// if (!in_array($referer, $allowedDomains)) {
//     http_response_code(403);
//     die('Access denied');
// }
?>