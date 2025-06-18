# Этап сборки PHP-приложения
FROM php:8.1-fpm-alpine AS builder

WORKDIR /app
COPY . /app
# Если нужно установить зависимости Composer
# RUN composer install --no-dev --optimize-autoloader

# Этап финального образа с Nginx
FROM nginx:stable-alpine

# Удаляем дефолтный конфиг Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Копируем свой конфиг Nginx (вы его создадите)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем файлы приложения из этапа builder
COPY --from=builder /app /app

# Копируем PHP-FPM конфиг (если нужен специфический)
# COPY php-fpm.conf /usr/local/etc/php-fpm.d/www.conf

WORKDIR /app

# Открываем порт 80 для Nginx
EXPOSE 80

# Запускаем Nginx и PHP-FPM
CMD sh -c "nginx && php-fpm"