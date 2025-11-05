# Kong API Gateway Configuration

Этот проект использует Kong API Gateway в **DB-less режиме** с декларативной YAML конфигурацией.

## Архитектура

Kong работает как единая точка входа для всего приложения:

```
Браузер/Клиент
    ↓
Kong Gateway :8000
    ↓
    ├─→ /api/** → Backend API :3000 (NestJS)
    └─→ /** → Frontend :5173 (Vite/React)
```

## Файлы конфигурации

### 1. `kong.yml` - Декларативная конфигурация Kong

Основной файл конфигурации, который описывает:
- **Services** - внутренние сервисы (backend, frontend)
- **Routes** - маршруты для проксирования запросов
- **Plugins** - плагины для каждого сервиса/route

```yaml
_format_version: "3.0"

services:
  - name: backend-service
    url: http://backend:3000
    routes:
      - name: backend-api-route
        paths: [/api]
        strip_path: true
    plugins:
      - name: cors
      - name: rate-limiting
        config:
          minute: 100
          hour: 1000

  - name: frontend-service
    url: http://frontend:5173
    routes:
      - name: frontend-route
        paths: [/]
        strip_path: false
        plugins:
          - name: request-transformer
            config:
              replace:
                headers:
                  - Host:localhost:5173
```

### 2. `docker-compose.yml` - Kong в DB-less режиме

Kong настроен без базы данных PostgreSQL:

```yaml
kong:
  image: kong:3.4
  environment:
    KONG_DATABASE: 'off'
    KONG_DECLARATIVE_CONFIG: /usr/local/kong/declarative/kong.yml
  volumes:
    - ./kong.yml:/usr/local/kong/declarative/kong.yml:ro
  ports:
    - '8000:8000'  # Proxy
    - '8001:8001'  # Admin API (read-only)
```

## Преимущества DB-less режима

1. ✅ **Простота** - нет необходимости в базе данных PostgreSQL для Kong
2. ✅ **Версионирование** - конфигурация в Git
3. ✅ **Декларативность** - конфигурация как код
4. ✅ **Быстрый старт** - Kong запускается мгновенно
5. ✅ **Надежность** - нет зависимости от состояния БД

## Как использовать

### Запуск

```bash
# Запустить все сервисы
docker-compose up -d

# Kong автоматически загрузит конфигурацию из kong.yml
```

### Проверка конфигурации

```bash
# Проверить статус Kong
curl http://localhost:8001/status

# Посмотреть загруженные сервисы
curl http://localhost:8001/services

# Посмотреть маршруты
curl http://localhost:8001/routes

# Посмотреть плагины
curl http://localhost:8001/plugins
```

### Доступ к приложению

- **Frontend**: http://localhost:8000/
- **Backend API**: http://localhost:8000/api
- **Swagger**: http://localhost:8000/api/api-json
- **Kong Admin API**: http://localhost:8001 (только чтение)

### Изменение конфигурации

1. Отредактируйте `kong.yml`
2. Перезапустите Kong:

```bash
docker-compose restart kong
```

Kong автоматически загрузит новую конфигурацию.

### Валидация конфигурации

Проверить корректность kong.yml перед запуском:

```bash
docker run --rm -v $(pwd)/kong.yml:/kong.yml kong:3.4 kong config parse /kong.yml
```

## Настроенные плагины

### 1. CORS (на backend-service)

Разрешает кросс-доменные запросы:
- Origins: `*`
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Headers: Authorization, Content-Type и др.
- Credentials: true

### 2. Rate Limiting (на backend-service)

Ограничивает количество запросов:
- **100 запросов в минуту**
- **1000 запросов в час**
- Policy: local (in-memory)

### 3. Request Transformer (на frontend-route)

Изменяет заголовок Host для совместимости с Vite dev server:
- Host: `localhost:5173`

## Troubleshooting

### Kong не запускается

```bash
# Проверить логи
docker logs kong_gateway

# Проверить корректность YAML
docker run --rm -v $(pwd)/kong.yml:/kong.yml kong:3.4 kong config parse /kong.yml
```

### 403 Forbidden при доступе к frontend

Проверьте, что:
1. Frontend контейнер запущен
2. Plugin request-transformer настроен для frontend-route
3. Vite dev server слушает на `0.0.0.0:5173`

### Backend API не работает

Проверьте:
```bash
# Прямой доступ к backend
curl http://localhost:3000/health

# Через Kong
curl http://localhost:8000/api/health
```

## Дополнительные плагины

Kong поддерживает множество плагинов. Добавить новый плагин в `kong.yml`:

```yaml
services:
  - name: backend-service
    plugins:
      - name: jwt
        config:
          # JWT конфигурация
      - name: ip-restriction
        config:
          allow:
            - 10.0.0.0/8
```

Полный список плагинов: https://docs.konghq.com/hub/

## Миграция на database режим

Если в будущем потребуется database режим:

1. Добавьте PostgreSQL для Kong в docker-compose.yml
2. Измените `KONG_DATABASE: 'off'` на `KONG_DATABASE: postgres`
3. Используйте Admin API для конфигурации вместо YAML

## Полезные команды

```bash
# Перезагрузить конфигурацию
docker-compose restart kong

# Посмотреть используемую конфигурацию
curl http://localhost:8001/config

# Проверить health Kong
curl http://localhost:8001/status

# Посмотреть версию Kong
docker exec kong_gateway kong version
```

## Ссылки

- [Kong Documentation](https://docs.konghq.com/)
- [Kong DB-less Mode](https://docs.konghq.com/gateway/latest/production/deployment-topologies/db-less-and-declarative-config/)
- [Kong Declarative Configuration](https://docs.konghq.com/gateway/latest/production/deployment-topologies/db-less-and-declarative-config/)
- [Kong Plugins](https://docs.konghq.com/hub/)
