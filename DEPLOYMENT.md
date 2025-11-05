# Инструкция по развертыванию на удаленном сервере

## Быстрый старт

### 1. Подключитесь к серверу
```bash
ssh root@77.221.151.105
# Пароль: xn7168vH9vB5
```

### 2. Скачайте и запустите скрипт развертывания
```bash
curl -sSL https://raw.githubusercontent.com/endurohard/besedkiemin/docker-deploy/deploy-to-server.sh -o deploy.sh
chmod +x deploy.sh
./deploy.sh
```

**ИЛИ** выполните команды вручную:

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установка Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Клонирование репозитория
cd /root
git clone https://github.com/endurohard/besedkiemin.git
cd besedkiemin
git checkout docker-deploy

# Создание .env файлов
cat > backend/.env << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/besedki_emin?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRATION="7d"
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
TELEGRAM_BOT_USERNAME="besedkiemin_bot"
NODE_ENV="production"
PORT=3000
EOF

cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost/api
EOF

# Запуск приложения
docker-compose up -d

# Ожидание запуска БД и применение миграций
sleep 15
docker-compose exec backend npx prisma db push

# Инициализация Kong
bash init-kong.sh
```

### 3. Проверка статуса

```bash
# Проверить запущенные контейнеры
docker-compose ps

# Просмотреть логи
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f kong

# Проверить доступность
curl http://localhost/api/health
```

## Структура проекта на сервере

```
/root/besedkiemin/
├── backend/           # Backend приложение (NestJS)
├── frontend/          # Frontend приложение (React + Vite)
├── docker-compose.yml # Конфигурация Docker
├── kong.yml          # Конфигурация Kong API Gateway
└── init-kong.sh      # Скрипт инициализации Kong
```

## Порты

- **80** - Kong API Gateway (HTTP)
- **443** - Kong API Gateway (HTTPS)
- **8001** - Kong Admin API
- **5432** - PostgreSQL (внутренний)
- **3000** - Backend API (внутренний)
- **5173** - Frontend (внутренний)

## Доступ к приложению

После успешного развертывания:
- **Публичная страница каталога**: http://77.221.151.105/
- **Система управления**: http://77.221.151.105/app
- **API**: http://77.221.151.105/api

## Учетные записи по умолчанию

- **Владелец**: owner@example.com / password123
- **Менеджер**: manager@example.com / password123
- **Дизайнер**: designer@example.com / password123
- **Заготовщик**: preparer@example.com / password123
- **Маляр**: painter@example.com / password123
- **Складист**: warehouse@example.com / password123

⚠️ **ВАЖНО**: Измените пароли после первого входа!

## Управление приложением

### Остановка
```bash
docker-compose down
```

### Перезапуск
```bash
docker-compose restart
```

### Обновление кода
```bash
git pull origin docker-deploy
docker-compose down
docker-compose up -d --build
```

### Просмотр логов
```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f kong
```

### Выполнение команд внутри контейнера
```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# База данных
docker-compose exec postgres psql -U postgres -d besedki_emin
```

## Настройка Telegram бота

1. Создайте бота через [@BotFather](https://t.me/botfather)
2. Получите токен бота
3. Обновите `backend/.env`:
   ```env
   TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN"
   TELEGRAM_BOT_USERNAME="your_bot_username"
   ```
4. Перезапустите backend:
   ```bash
   docker-compose restart backend
   ```

## Настройка SSL (HTTPS)

Для production рекомендуется настроить SSL сертификат:

### Вариант 1: Let's Encrypt с Certbot
```bash
# Установка Certbot
apt-get update
apt-get install -y certbot

# Получение сертификата
certbot certonly --standalone -d yourdomain.com

# Настройка Kong для использования сертификата
# (требуется обновление kong.yml)
```

### Вариант 2: Использование Nginx как reverse proxy
```bash
# Установка Nginx
apt-get install -y nginx certbot python3-certbot-nginx

# Получение сертификата
certbot --nginx -d yourdomain.com

# Настройка проксирования на Kong
```

## Резервное копирование

### Backup базы данных
```bash
docker-compose exec postgres pg_dump -U postgres besedki_emin > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Восстановление базы данных
```bash
docker-compose exec -T postgres psql -U postgres besedki_emin < backup_YYYYMMDD_HHMMSS.sql
```

## Мониторинг

### Проверка использования ресурсов
```bash
docker stats
```

### Проверка дискового пространства
```bash
df -h
docker system df
```

### Очистка неиспользуемых ресурсов
```bash
docker system prune -a
```

## Troubleshooting

### Контейнер не запускается
```bash
# Проверить логи
docker-compose logs [service_name]

# Проверить статус
docker-compose ps

# Пересоздать контейнер
docker-compose up -d --force-recreate [service_name]
```

### База данных недоступна
```bash
# Проверить, запущен ли PostgreSQL
docker-compose ps postgres

# Перезапустить PostgreSQL
docker-compose restart postgres

# Проверить логи
docker-compose logs postgres
```

### Kong не работает
```bash
# Проверить конфигурацию
docker-compose logs kong

# Переинициализировать Kong
bash init-kong.sh

# Проверить Kong Admin API
curl http://localhost:8001/
```

## Контакты и поддержка

При возникновении проблем проверьте:
1. Логи контейнеров
2. Переменные окружения в .env файлах
3. Доступность портов
4. Наличие свободного места на диске

---

**Версия документа**: 1.0
**Дата обновления**: 2025-11-05
