# Besedki EMIN

Система управления заказами на строительство беседок с двухуровневой доступностью.

## Функциональность

- **Kanban-доска** для управления заказами со статусами:
  - Поступила задача
  - Принята
  - Завершена

- **Двухуровневый доступ**:
  - **Менеджер**: просмотр канбан-доски, управление заказами
  - **Владелец**: полная аналитика, фильтрация по датам, экспорт в Excel

- **Методы оплаты**: наличные, перевод, безналичные
- **Отслеживание статусов работ**
- **Экспорт данных в Excel**

## Технологический стек

### Backend
- Node.js + NestJS (TypeScript)
- PostgreSQL + Prisma ORM
- JWT авторизация
- Swagger документация

### Frontend
- React + TypeScript + Vite
- TailwindCSS + shadcn/ui
- React Query
- Zustand
- React DnD (Kanban)

## Структура проекта

```
besedki-emin/
├── backend/          # NestJS API
├── frontend/         # React приложение
├── docker-compose.yml
└── README.md
```

## Установка и запуск

### Требования
- Node.js >= 18
- PostgreSQL >= 14
- Docker (опционально)

### Разработка

1. Установка зависимостей:
```bash
npm install
```

2. Настройка переменных окружения:
```bash
# В папке backend создайте .env файл
cp backend/.env.example backend/.env
```

3. Запуск базы данных:
```bash
docker-compose up -d postgres
```

4. Применение миграций:
```bash
cd backend
npm run prisma:migrate
```

5. Запуск в режиме разработки:
```bash
npm run dev
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- Swagger API: http://localhost:3000/api

## Docker

Запуск всего проекта в Docker:

```bash
docker-compose up
```

## Структура БД

- **Users**: пользователи системы (менеджеры, владельцы)
- **Orders**: заказы на беседки
- **Tasks**: задачи в рамках заказов
- **Payments**: платежи и оплаты

## API Документация

Swagger документация доступна по адресу: http://localhost:3000/api

## Лицензия

MIT
