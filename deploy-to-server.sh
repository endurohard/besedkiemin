#!/bin/bash

# Скрипт развертывания проекта Besedki EMIN на удаленном сервере
# Выполните этот скрипт на сервере: bash deploy-to-server.sh

set -e  # Остановка при ошибке

echo "=========================================="
echo "Развертывание проекта Besedki EMIN"
echo "=========================================="

# 1. Проверка и установка необходимых зависимостей
echo ""
echo "1. Проверка зависимостей..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Устанавливаем..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
    echo "✅ Docker установлен"
else
    echo "✅ Docker уже установлен"
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Устанавливаем..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose установлен"
else
    echo "✅ Docker Compose уже установлен"
fi

if ! command -v git &> /dev/null; then
    echo "❌ Git не установлен. Устанавливаем..."
    apt-get update
    apt-get install -y git
    echo "✅ Git установлен"
else
    echo "✅ Git уже установлен"
fi

# 2. Клонирование или обновление репозитория
echo ""
echo "2. Получение кода проекта..."

PROJECT_DIR="/root/besedkiemin"

if [ -d "$PROJECT_DIR" ]; then
    echo "Проект уже существует. Обновляем..."
    cd "$PROJECT_DIR"
    git fetch origin
    git checkout docker-deploy
    git pull origin docker-deploy
    echo "✅ Код обновлен"
else
    echo "Клонируем репозиторий..."
    cd /root
    git clone https://github.com/endurohard/besedkiemin.git
    cd besedkiemin
    git checkout docker-deploy
    echo "✅ Репозиторий клонирован"
fi

cd "$PROJECT_DIR"

# 3. Настройка переменных окружения
echo ""
echo "3. Настройка переменных окружения..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    echo "Создаем backend/.env..."
    cat > backend/.env << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/besedki_emin?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRATION="7d"
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
TELEGRAM_BOT_USERNAME="besedkiemin_bot"
NODE_ENV="production"
PORT=3000
EOF
    echo "⚠️  ВАЖНО: Обновите токен Telegram бота в backend/.env"
else
    echo "✅ backend/.env уже существует"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    echo "Создаем frontend/.env..."
    cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost/api
EOF
    echo "✅ frontend/.env создан"
else
    echo "✅ frontend/.env уже существует"
fi

# 4. Остановка старых контейнеров (если есть)
echo ""
echo "4. Остановка старых контейнеров..."
docker-compose down || true

# 5. Очистка старых образов (опционально)
echo ""
echo "5. Очистка неиспользуемых Docker ресурсов..."
docker system prune -f || true

# 6. Запуск проекта
echo ""
echo "6. Запуск Docker контейнеров..."
docker-compose up -d

# 7. Ожидание запуска PostgreSQL
echo ""
echo "7. Ожидание запуска базы данных..."
sleep 10

# 8. Проверка статуса контейнеров
echo ""
echo "8. Проверка статуса контейнеров..."
docker-compose ps

# 9. Применение миграций базы данных
echo ""
echo "9. Применение миграций базы данных..."
docker-compose exec -T backend npx prisma db push || echo "⚠️  Ошибка миграций, проверьте логи"

# 10. Инициализация Kong API Gateway
echo ""
echo "10. Инициализация Kong API Gateway..."
sleep 5
bash init-kong.sh || echo "⚠️  Ошибка инициализации Kong, проверьте логи"

# 11. Проверка логов
echo ""
echo "11. Последние логи контейнеров:"
echo ""
echo "=== Backend ==="
docker-compose logs --tail=20 backend
echo ""
echo "=== Frontend ==="
docker-compose logs --tail=20 frontend
echo ""
echo "=== Kong ==="
docker-compose logs --tail=20 kong

# 12. Финальная информация
echo ""
echo "=========================================="
echo "✅ Развертывание завершено!"
echo "=========================================="
echo ""
echo "📊 Статус контейнеров:"
docker-compose ps
echo ""
echo "🌐 Приложение доступно по адресу:"
echo "   http://77.221.151.105"
echo ""
echo "📝 Полезные команды:"
echo "   Просмотр логов:        docker-compose logs -f [service]"
echo "   Перезапуск:            docker-compose restart [service]"
echo "   Остановка:             docker-compose down"
echo "   Обновление кода:       git pull && docker-compose restart"
echo ""
echo "⚠️  Не забудьте:"
echo "   1. Настроить Telegram бота в backend/.env"
echo "   2. Открыть порты 80, 443 в firewall"
echo "   3. Настроить SSL сертификат для production"
echo ""
