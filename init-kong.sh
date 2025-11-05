#!/bin/bash

echo "🚀 Инициализация Kong API Gateway..."

KONG_ADMIN_URL="http://localhost:8001"

# Ждем пока Kong будет готов
echo "⏳ Ожидание готовности Kong..."
until curl -s "${KONG_ADMIN_URL}/status" > /dev/null 2>&1; do
  echo "   Kong еще не готов, ждем..."
  sleep 2
done
echo "✅ Kong готов!"

# Функция для создания или обновления service
create_or_update_service() {
  local service_name=$1
  local service_url=$2

  echo "📦 Настройка service: ${service_name}"

  # Проверяем существует ли service
  existing_service=$(curl -s "${KONG_ADMIN_URL}/services/${service_name}")

  if echo "$existing_service" | grep -q "\"name\":\"${service_name}\""; then
    # Обновляем существующий service
    curl -s -X PATCH "${KONG_ADMIN_URL}/services/${service_name}" \
      -d "url=${service_url}" > /dev/null
    echo "   ✓ Service обновлен"
  else
    # Создаем новый service
    curl -s -X POST "${KONG_ADMIN_URL}/services" \
      -d "name=${service_name}" \
      -d "url=${service_url}" > /dev/null
    echo "   ✓ Service создан"
  fi
}

# Функция для создания или обновления route
create_or_update_route() {
  local service_name=$1
  local route_name=$2
  local paths=$3
  local strip_path=${4:-true}

  echo "🛣️  Настройка route: ${route_name}"

  # Проверяем существует ли route
  existing_route=$(curl -s "${KONG_ADMIN_URL}/routes/${route_name}")

  if echo "$existing_route" | grep -q "\"name\":\"${route_name}\""; then
    # Обновляем существующий route
    curl -s -X PATCH "${KONG_ADMIN_URL}/routes/${route_name}" \
      -d "paths[]=${paths}" \
      -d "strip_path=${strip_path}" > /dev/null
    echo "   ✓ Route обновлен"
  else
    # Создаем новый route
    curl -s -X POST "${KONG_ADMIN_URL}/services/${service_name}/routes" \
      -d "name=${route_name}" \
      -d "paths[]=${paths}" \
      -d "strip_path=${strip_path}" > /dev/null
    echo "   ✓ Route создан"
  fi
}

# ============================================
# Настройка Backend Service
# ============================================
create_or_update_service "backend-service" "http://backend:3000"

# Создаем routes для backend
create_or_update_route "backend-service" "backend-api-route" "/api" "true"

# ============================================
# Настройка Frontend Service
# ============================================
create_or_update_service "frontend-service" "http://frontend:5173"

# Создаем route для frontend (все остальное)
create_or_update_route "frontend-service" "frontend-route" "/" "false"

# Настройка Host header для Vite dev server
echo "🔧 Настройка Host header для frontend..."
existing_transformer=$(curl -s "${KONG_ADMIN_URL}/routes/frontend-route/plugins" | grep -o "request-transformer")

if [ -z "$existing_transformer" ]; then
  curl -s -X POST "${KONG_ADMIN_URL}/routes/frontend-route/plugins" \
    -d "name=request-transformer" \
    -d "config.replace.headers=Host:localhost:5173" > /dev/null
  echo "   ✓ Request Transformer plugin создан для frontend"
else
  echo "   ✓ Request Transformer plugin уже существует"
fi

# ============================================
# Включаем CORS plugin для backend
# ============================================
echo "🔌 Настройка CORS plugin..."

existing_cors=$(curl -s "${KONG_ADMIN_URL}/services/backend-service/plugins" | grep -o "cors")

if [ -z "$existing_cors" ]; then
  curl -s -X POST "${KONG_ADMIN_URL}/services/backend-service/plugins" \
    -d "name=cors" \
    -d "config.origins=*" \
    -d "config.methods=GET,POST,PUT,PATCH,DELETE,OPTIONS" \
    -d "config.headers=Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,Authorization" \
    -d "config.exposed_headers=X-Auth-Token" \
    -d "config.credentials=true" \
    -d "config.max_age=3600" > /dev/null
  echo "   ✓ CORS plugin создан"
else
  echo "   ✓ CORS plugin уже существует"
fi

# ============================================
# Включаем Rate Limiting (опционально)
# ============================================
echo "⏱️  Настройка Rate Limiting plugin..."

existing_rate_limit=$(curl -s "${KONG_ADMIN_URL}/services/backend-service/plugins" | grep -o "rate-limiting")

if [ -z "$existing_rate_limit" ]; then
  curl -s -X POST "${KONG_ADMIN_URL}/services/backend-service/plugins" \
    -d "name=rate-limiting" \
    -d "config.minute=100" \
    -d "config.hour=1000" \
    -d "config.policy=local" > /dev/null
  echo "   ✓ Rate Limiting plugin создан (100 req/min, 1000 req/hour)"
else
  echo "   ✓ Rate Limiting plugin уже существует"
fi

echo ""
echo "✅ Kong успешно настроен!"
echo ""
echo "📋 Информация о маршрутах:"
echo "   🌐 Frontend:  http://localhost:8000/"
echo "   🔌 Backend:   http://localhost:8000/api"
echo "   ⚙️  Kong Admin: http://localhost:8001"
echo ""
echo "🔍 Проверка конфигурации:"
curl -s "${KONG_ADMIN_URL}/services" | grep -o "\"name\":\"[^\"]*\"" || echo "Ошибка получения списка сервисов"
