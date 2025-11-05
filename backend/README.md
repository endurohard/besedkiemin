# Production Management System Backend

Система управления производством мебели - backend API

## 🚀 Функционал

### API Modules

1. **Auth API** - JWT аутентификация
   - Login, профиль пользователя

2. **Users API** - Управление пользователями
   - CRUD операции
   - 5 ролей: MANAGER, DESIGNER, PREPARER, PAINTER, WAREHOUSE

3. **Orders API** - Управление заказами
   - CRUD операции для заказов
   - Статистика по заказам
   - Excel экспорт

4. **Products API** - Управление продуктами
   - CRUD операции
   - Движение продуктов по этапам производства
   - История прохождения этапов
   - Фильтрация по этапам

5. **QualityChecks API** - Проверка качества
   - Создание проверок качества с фото
   - Браковка продуктов с возвратом на доработку
   - Telegram уведомления при браках

6. **Upload Service** - Загрузка файлов
   - Загрузка фото дефектов
   - Статическая раздача файлов

7. **Telegram Integration** - Уведомления
   - Автоматическая отправка уведомлений о браках в Telegram
   - Отправка фото дефектов

## 📋 Этапы производства

1. **PENDING** - Ожидает начала
2. **DESIGN** - Проектирование (Designer)
3. **PREPARATION** - Заготовка (Preparer)
4. **PAINTING** - Покраска (Painter)
5. **QUALITY_CHECK** - Проверка качества (Warehouse)
6. **COMPLETED** - Завершено
7. **REJECTED** - Брак (возврат на PAINTING)

## ⚙️ Установка и запуск

### 1. Установите зависимости
```bash
npm install
```

### 2. Настройте переменные окружения

Создайте `.env` файл:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/production"
JWT_SECRET="your-secret-key"
CORS_ORIGIN="http://localhost:5173"

# Telegram (опционально)
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"
BASE_URL="http://localhost:3000"
```

### 3. Примените миграции
```bash
npx prisma migrate dev
```

### 4. Заполните базу тестовыми данными
```bash
npx prisma db seed
```

Будут созданы пользователи:
- **manager@factory.com** - Менеджер
- **designer@factory.com** - Проектировщик
- **preparer@factory.com** - Заготовщик
- **painter@factory.com** - Маляр
- **warehouse@factory.com** - Складист

Пароль для всех: `password123`

### 5. Запустите сервер
```bash
npm run start:dev
```

Сервер запустится на http://localhost:3000

Swagger документация: http://localhost:3000/api

## 🔑 API Endpoints

### Auth
- `POST /auth/login` - Авторизация
- `GET /auth/profile` - Получить профиль

### Orders
- `POST /orders` - Создать заказ (MANAGER)
- `GET /orders` - Список заказов
- `GET /orders/statistics` - Статистика (MANAGER)
- `GET /orders/export` - Excel экспорт (MANAGER)
- `GET /orders/:id` - Детали заказа
- `PATCH /orders/:id` - Обновить заказ
- `DELETE /orders/:id` - Удалить заказ

### Products
- `POST /products` - Создать продукт (MANAGER)
- `GET /products` - Список продуктов с фильтрами
- `GET /products/stage/:stage` - Продукты на этапе
- `GET /products/:id` - Детали продукта
- `GET /products/:id/history` - История продукта
- `PATCH /products/:id` - Обновить продукт (MANAGER)
- `POST /products/:id/move` - Переместить на этап
- `DELETE /products/:id` - Удалить продукт (MANAGER)

### Quality Checks
- `POST /quality-checks` - Создать проверку (WAREHOUSE)
- `GET /quality-checks` - Список проверок
- `GET /quality-checks/rejected` - Забракованные
- `GET /quality-checks/product/:id` - Проверки продукта
- `GET /quality-checks/:id` - Детали проверки
- `PATCH /quality-checks/:id` - Обновить проверку (WAREHOUSE)
- `DELETE /quality-checks/:id` - Удалить проверку

## 📱 Настройка Telegram Bot

1. Создайте бота через @BotFather в Telegram
2. Получите токен бота
3. Узнайте Chat ID (через @userinfobot)
4. Добавьте в .env:
```env
TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
TELEGRAM_CHAT_ID="123456789"
```

При браковке продукта автоматически будет отправлено уведомление в Telegram с фото дефекта.

## 🐳 Docker

Для запуска через Docker Compose:
```bash
docker-compose up -d
```

## 📊 Тестирование API

Используйте Swagger UI: http://localhost:3000/api

1. Авторизуйтесь через `/auth/login`
2. Скопируйте JWT токен
3. Нажмите "Authorize" и вставьте токен
4. Тестируйте endpoints

## 🔄 Рабочий процесс

1. **Менеджер** создает заказ с продуктами
2. **Проектировщик** переводит продукт в DESIGN
3. **Заготовщик** переводит в PREPARATION
4. **Маляр** переводит в PAINTING
5. **Складист** проводит QUALITY_CHECK:
   - ✅ APPROVED → продукт завершен
   - ❌ REJECTED → возврат на PAINTING + уведомление в Telegram

## 🛠 Технологии

- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Swagger/OpenAPI
- Multer (file upload)
- Telegram Bot API
- ExcelJS (export)

## 📝 Примечания

- Все пароли хешируются через bcrypt
- Загруженные фото хранятся в `./uploads`
- Максимальный размер фото: 5MB
- Поддерживаемые форматы: jpg, jpeg, png, gif
