<?php
// includes/config.php

// --- Константы, использующие значения из getenv() ---

define('DEFAULT_TIMEZONE', getenv('DEFAULT_TIMEZONE') ?: 'Europe/Minsk');

// Telegram settings
define('BOT_TOKEN', getenv('BOT_TOKEN') ?: 'YOUR_DEFAULT_BOT_TOKEN_IF_ANY');
define('CHAT_ID', getenv('CHAT_ID') ?: 'YOUR_DEFAULT_CHAT_ID_IF_ANY');

$messageThreadIdEnv = getenv('MESSAGE_THREAD_ID');
define('MESSAGE_THREAD_ID', ($messageThreadIdEnv === false || $messageThreadIdEnv === '') ? null : (int)$messageThreadIdEnv);

// reCAPTCHA конфигурация
define('RECAPTCHA_SITE_KEY', getenv('RECAPTCHA_SITE_KEY') ?: 'YOUR_DEFAULT_SITE_KEY_IF_ANY');
define('RECAPTCHA_SECRET_KEY', getenv('RECAPTCHA_SECRET_KEY') ?: 'YOUR_DEFAULT_SECRET_KEY_IF_ANY');
define('RECAPTCHA_THRESHOLD', (float)(getenv('RECAPTCHA_THRESHOLD') ?: 0.5));

// Защита от спама
define('MIN_FORM_SUBMIT_TIME', (int)(getenv('MIN_FORM_SUBMIT_TIME') ?: 5));

// Настройки для логгирования
define('LOG_FILE', __DIR__ . '/../form_submissions.log');
define('LOG_MAX_SIZE', 1048576); // 1MB

// Разрешенные домены для отправки форм
$allowedDomainsEnv = getenv('ALLOWED_DOMAINS');
$allowedDomains = $allowedDomainsEnv ? array_map('trim', explode(',', $allowedDomainsEnv)) : ['artbyavp.xyz', 'www.artbyavp.xyz', 'av3d.by', 'www.av3d.by'];

?>