# --- Этап 1: Сборка PHP-приложения с PHP-FPM ---
# Используем официальный образ PHP с FPM (например, php:8.1-fpm-alpine)
FROM php:8.1-fpm-alpine AS php_fpm_builder

# Устанавливаем необходимые PHP-расширения
# Вам могут понадобиться другие расширения, такие как pdo_mysql, gd, intl и т.д.
# Для Telegram бота и reCAPTCHA могут понадобиться curl, json.
RUN apk add --no-cache curl-dev \
    && docker-php-ext-install curl json \
    && rm -rf /var/cache/apk/*

WORKDIR /app
# Копируем все файлы вашего проекта в контейнер
COPY . /app

# Если вы используете Composer, раскомментируйте эти строки
# COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer
# RUN composer install --no-dev --optimize-autoloader --no-interaction

# --- Этап 2: Финальный образ с Nginx и PHP-FPM ---
# Используем образ Nginx как базовый для финального контейнера
FROM nginx:stable-alpine

# Удаляем дефолтную конфигурацию Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Копируем ваш пользовательский nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем файлы PHP-приложения из первого этапа
COPY --from=php_fpm_builder /app /app

# Настраиваем Nginx и PHP-FPM для одновременного запуска
# Создаем директорию для PHP-FPM сокета, если она еще не существует
RUN mkdir -p /var/run/php

# Открываем порт 80 для Nginx
EXPOSE 80

# Команда запускает Nginx на переднем плане и PHP-FPM на заднем фоне
# Используем exec для Nginx, чтобы он был основным процессом,
# и запускаем php-fpm как службу или в фоновом режиме.
# Наиболее надежный способ - использовать супервизор процессов, как supervisord,
# но для простоты Coolify давайте попробуем запустить их таким образом:
# Или же, если PHP-FPM должен запускаться как отдельный процесс,
# а Nginx как другой, то лучше использовать образ, который уже имеет такую настройку,
# или использовать CMD, который запускает скрипт, стартующий оба сервиса.
#
# Вариант 1 (простой, иногда работает):
# CMD sh -c "php-fpm --daemonize && nginx -g 'daemon off;'"
#
# Вариант 2 (лучше, с использованием bash):
# CMD ["bash", "-c", "php-fpm && nginx -g 'daemon off;'"]
#
# Или, что более надежно для Alpine-based образов (некоторые образы используют runit/s6-overlay):
# Но раз Coolify это Docker, то CMD sh -c "php-fpm && nginx -g 'daemon off;'"
# самый распространенный.

# Попробуем такой CMD:
CMD ["sh", "-c", "php-fpm && nginx -g 'daemon off;'"]