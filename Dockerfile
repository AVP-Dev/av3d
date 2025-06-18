# --- Этап 1: Сборка PHP-приложения с PHP-FPM ---
FROM php:8.1-fpm-alpine AS php_fpm_builder

# Устанавливаем необходимые PHP-расширения
# json уже встроен в PHP, так что его не нужно устанавливать отдельно.
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

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=php_fpm_builder /app /app

RUN mkdir -p /var/run/php

EXPOSE 80

CMD ["sh", "-c", "php-fpm && nginx -g 'daemon off;'"]