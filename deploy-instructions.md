# Инструкции по деплою "Финансовый Пульс"

## Проблема
Текущий GitHub репозиторий приватный, поэтому GitHub Pages недоступны. Токен не имеет прав на изменение настроек репозитория.

## Решения для деплоя:

### 1. GitHub Pages (рекомендуется)
1. Зайдите на https://github.com/creativefastfood/finance_pulse
2. Перейдите в Settings → General
3. Измените visibility на "Public"
4. Перейдите в Settings → Pages
5. В источнике выберите "Deploy from a branch"
6. Выберите ветку "main" и папку "/ (root)"
7. Нажмите Save

После этого сайт будет доступен по адресу:
**https://creativefastfood.github.io/finance_pulse/**

### 2. Vercel (альтернатива)
1. Зайдите на https://vercel.com
2. Подключите GitHub аккаунт
3. Импортируйте репозиторий finance_pulse
4. Deплой произойдет автоматически

### 3. Netlify (альтернатива)
1. Зайдите на https://netlify.com
2. Выберите "New site from Git"
3. Подключите GitHub и выберите репозиторий
4. Настройки деплоя оставьте по умолчанию

### 4. Локальное использование
Откройте файл `index.html` в браузере - приложение полностью работает локально.

## Файлы готовы к деплою:
- ✅ index.html - главная страница
- ✅ styles.css - стили
- ✅ script.js - функциональность
- ✅ README.md - документация
- ✅ .nojekyll - для GitHub Pages
- ✅ vercel.json - для Vercel деплоя

Все готово для запуска!