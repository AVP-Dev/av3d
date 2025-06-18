# --- Этап 1: Сборка PHP-приложения с PHP-FPM ---
FROM php:8.1-fpm-alpine AS php_fpm_builder

RUN apk add --no-cache curl-dev \
    && docker-php-ext-install curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app
COPY . /app

# Если вы используете Composer, раскомментируйте эти строки
# COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer
# RUN composer install --no-dev --optimize-autoloader --no-interaction

# --- Этап 2: Финальный образ с Nginx и PHP-FPM ---
FROM nginx:stable-alpine

# Устанавливаем PHP-FPM и его зависимости во второй образ
# Этот шаг будет немного увеличивать размер финального образа, но гарантирует, что php-fpm доступен.
RUN apk add --no-cache php81-fpm php81-curl php81-json \
    && rm -rf /var/cache/apk/*

# Удаляем дефолтную конфигурацию Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Копируем ваш пользовательский nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем файлы PHP-приложения из первого этапа
COPY --from=php_fpm_builder /app /app

# Создаем директорию для PHP-FPM сокета, если она еще не существует
RUN mkdir -p /var/run/php

# Открываем порт 80 для Nginx
EXPOSE 80

# Команда для запуска Nginx и PHP-FPM.
# php-fpm теперь должен быть доступен, т.к. мы его установили.
# & делает php-fpm фоновым процессом, а nginx - основным (foreground)
CMD sh -c "php-fpm -D && nginx -g 'daemon off;'"
# -D означает запуск php-fpm в фоновом режиме
# -g 'daemon off;' запускает nginx в foreground