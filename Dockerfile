# Используем официальный образ PHP-FPM, например, 8.3-fpm-alpine
FROM php:8.3-fpm-alpine

# Устанавливаем Nginx
RUN apk add --no-cache nginx

# Копируем вашу настроенную конфигурацию Nginx
# Важно: этот nginx.conf должен быть в папке .nixpacks в вашем репозитории
COPY .nixpacks/nginx.conf /etc/nginx/conf.d/default.conf

# Удаляем дефолтный конфиг Nginx, если он есть
RUN rm -f /etc/nginx/http.d/default.conf

# Создаем директории и устанавливаем права, если необходимо
RUN mkdir -p /var/www/html /var/log/nginx /var/cache/nginx && \
    chown -R www-data:www-data /var/www/html /var/cache/nginx /var/log/nginx

# Копируем весь ваш код из репозитория в директорию веб-сервера
COPY . /var/www/html

# Устанавливаем правильные права на файлы для Nginx и PHP
RUN chown -R www-data:www-data /var/www/html

# Открываем порт 80 для Nginx
EXPOSE 80

# Определяем команду запуска: Nginx и PHP-FPM
CMD php-fpm && nginx -g "daemon off;"