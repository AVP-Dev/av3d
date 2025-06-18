<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

$referer = parse_url($_SERVER['HTTP_REFERER'] ?? '', PHP_URL_HOST);
if (empty($allowedDomains) || !in_array($referer, $allowedDomains)) {
    http_response_code(403);
    die(json_encode(['success' => false, 'message' => 'Доступ запрещен.']));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Метод не разрешен.']));
}

if (defined('MIN_FORM_SUBMIT_TIME') && isset($_SERVER['HTTP_X_FORM_SUBMIT_TIME'])) {
    $submitTime = (int)$_SERVER['HTTP_X_FORM_SUBMIT_TIME']; 
    if (time() - $submitTime < MIN_FORM_SUBMIT_TIME) {
        http_response_code(429);
        die(json_encode(['success' => false, 'message' => 'Форма отправлена слишком быстро.']));
    }
}

if (!empty($_POST['website'])) { 
    die(json_encode(['success' => true, 'message' => 'Заявка обработана.']));
}

if (!defined('RECAPTCHA_SECRET_KEY') || !defined('RECAPTCHA_THRESHOLD')) {
    http_response_code(500); 
    error_log("Ошибка конфигурации: RECAPTCHA_SECRET_KEY или RECAPTCHA_THRESHOLD не определены.");
    die(json_encode(['success' => false, 'message' => 'Ошибка конфигурации сервера.']));
}

if (empty($_POST['recaptcha_response'])) {
    http_response_code(400); 
    die(json_encode(['success' => false, 'message' => 'Ошибка reCAPTCHA: Токен не предоставлен.']));
}

$recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
$recaptchaData = [
    'secret'   => RECAPTCHA_SECRET_KEY,
    'response' => $_POST['recaptcha_response'],
    'remoteip' => $_SERVER['REMOTE_ADDR'] ?? null 
];

$ch = curl_init($recaptchaUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($recaptchaData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$recaptchaResultJson = curl_exec($ch);
$curlError = curl_error($ch);
curl_close($ch);

if ($recaptchaResultJson === false) {
    http_response_code(503); 
    error_log("Не удалось связаться с сервером reCAPTCHA. Ошибка: " . $curlError);
    die(json_encode(['success' => false, 'message' => 'Ошибка reCAPTCHA: Не удалось связаться с сервером проверки.']));
}

$recaptchaResponse = json_decode($recaptchaResultJson);

if (!$recaptchaResponse || !isset($recaptchaResponse->success)) {
    http_response_code(500); 
    error_log("Неверный ответ от сервера reCAPTCHA: " . $recaptchaResultJson);
    die(json_encode(['success' => false, 'message' => 'Ошибка reCAPTCHA: Неверный ответ от сервера.']));
}

if (!$recaptchaResponse->success || (isset($recaptchaResponse->score) && $recaptchaResponse->score < RECAPTCHA_THRESHOLD)) {
    http_response_code(400); 
    error_log("Проверка reCAPTCHA не пройдена. Успех: " . ($recaptchaResponse->success ? 'true' : 'false') . ". Оценка: " . ($recaptchaResponse->score ?? 'N/A') . ". Ошибки: " . (isset($recaptchaResponse->{'error-codes'}) ? implode(', ', $recaptchaResponse->{'error-codes'}) : 'Нет'));
    die(json_encode(['success' => false, 'message' => 'Проверка reCAPTCHA не пройдена. Пожалуйста, попробуйте еще раз.']));
}

echo json_encode(['success' => true, 'message' => 'Ваша заявка успешно отправлена!']);

if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request(); 
} else {
    ob_end_flush();
    flush();
}

if (!defined('BOT_TOKEN') || !defined('CHAT_ID')) {
    error_log("Ошибка конфигурации: BOT_TOKEN или CHAT_ID не определены.");
    exit();
}

$name = htmlspecialchars(trim($_POST['name'] ?? 'Не указано'), ENT_QUOTES, 'UTF-8');
$phone = htmlspecialchars(trim($_POST['phone'] ?? 'Не указано'), ENT_QUOTES, 'UTF-8');
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $email = "Некорректный email: " . htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
}
$message = htmlspecialchars(trim($_POST['message'] ?? 'Нет сообщения'), ENT_QUOTES, 'UTF-8');
$formType = htmlspecialchars(trim($_POST['form_type'] ?? 'Заказ'), ENT_QUOTES, 'UTF-8');

$telegramMessage = "📌 *Новая заявка*\n\n"; 
$telegramMessage .= "👤 *Имя:* " . $name . "\n";
$telegramMessage .= "📱 *Телефон:* " . $phone . "\n";

if (!empty($email)) {
    $telegramMessage .= "📧 *Email:* " . $email . "\n";
}

if (trim($_POST['message'] ?? '') !== '') { 
    $telegramMessage .= "✉️ *Сообщение:*\n" . $message . "\n";
}

$telegramApiUrl = 'https://api.telegram.org/bot' . BOT_TOKEN . '/sendMessage';
$telegramData = [
    'chat_id' => CHAT_ID,
    'text' => $telegramMessage,
    'parse_mode' => 'Markdown', 
    'disable_web_page_preview' => true
];

if (defined('MESSAGE_THREAD_ID') && MESSAGE_THREAD_ID !== null) {
    $telegramData['message_thread_id'] = MESSAGE_THREAD_ID;
}

$chTelegram = curl_init($telegramApiUrl);
curl_setopt($chTelegram, CURLOPT_POST, true);
curl_setopt($chTelegram, CURLOPT_POSTFIELDS, json_encode($telegramData));
curl_setopt($chTelegram, CURLOPT_RETURNTRANSFER, true);
curl_setopt($chTelegram, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($chTelegram, CURLOPT_TIMEOUT, 5);
$telegramResultJson = curl_exec($chTelegram);
$telegramCurlError = curl_error($chTelegram);
curl_close($chTelegram);

if ($telegramResultJson === false) {
    error_log("Не удалось отправить сообщение в Telegram. Ошибка: " . $telegramCurlError . ". Данные: " . json_encode($telegramData));
} else {
    $telegramResponse = json_decode($telegramResultJson);
    if (!$telegramResponse || !$telegramResponse->ok) {
        error_log("Ошибка Telegram API. Ответ: " . $telegramResultJson);
    }
}

if (defined('LOG_FILE')) {
    $logData = [
        'timestamp' => date('Y-m-d H:i:s'),
        'form_type' => $formType, 
        'name' => $name,
        'phone' => $phone,
        'email' => $email,
        'message' => $message,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'N/A',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'N/A',
        'telegram_sent' => ($telegramResultJson !== false && isset(json_decode($telegramResultJson)->ok) && json_decode($telegramResultJson)->ok)
    ];
    $logEntry = json_encode($logData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n---\n";

    if (defined('LOG_MAX_SIZE') && file_exists(LOG_FILE) && filesize(LOG_FILE) > LOG_MAX_SIZE) {
        @file_put_contents(LOG_FILE, $logEntry, LOCK_EX);
    } else {
        @file_put_contents(LOG_FILE, $logEntry, FILE_APPEND | LOCK_EX);
    }
}

exit();
