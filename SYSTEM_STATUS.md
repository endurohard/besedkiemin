# Статус системы Besedki EMIN

Дата обновления: 30 октября 2025

## ✅ Все сервисы работают

### 1. Backend API
- **URL**: http://localhost:3000
- **Swagger**: http://localhost:3000/api
- **Статус**: ✅ Работает
- **Процесс**: Background ID 73269e

### 2. Frontend
- **URL**: http://localhost:5173
- **Статус**: ✅ Работает
- **Процесс**: Background ID 1aeb28

### 3. PostgreSQL
- **Container**: besedki_postgres
- **Port**: 5432
- **Статус**: ✅ Healthy (работает 4 дня)

### 4. Prisma Studio
- **URL**: http://localhost:5555
- **Статус**: ✅ Работает
- **Процесс**: Background ID 7cafda

### 5. Asterisk PBX
- **Container**: besedki_asterisk
- **Порты**:
  - 5060 (SIP UDP/TCP)
  - 8088 (WebSocket)
  - 10000-20000 (RTP)
- **Статус**: ✅ Ready
- **Регистрация на Yeastar**: ✅ Registered (истекает через 3582 сек)

## 📞 Конфигурация Asterisk

### Внутренние пользователи (WebRTC)
- **7779** - Менеджер 1 (manager@example.com, пароль: 90PQchO8DxW)
- **7780** - Менеджер 2 (резервный, пароль: password123)
- **7781** - Складист (warehouse@example.com, пароль: password123)

### Внешний транк (Yeastar)
- **Сервер**: www.it005.ru:5060
- **Протокол**: UDP
- **Пользователь**: 7779
- **Пароль**: 90PQchO8DxW
- **Статус**: ✅ Registered
- **RTT**: ~165ms

## 🔄 Маршрутизация звонков

### Исходящие звонки
- **77XX** → Внутренние звонки между пользователями
- **1000** → Echo Test (тестирование аудио)
- **Любые другие номера** → Через Yeastar транк

### Входящие звонки
- Все звонки от Yeastar направляются на внутренний номер **7779** (менеджер)

## 🧪 Тестирование

### 1. Проверка регистрации Asterisk
```bash
docker exec besedki_asterisk asterisk -rx "pjsip show registrations"
```

Ожидаемый результат:
```
yeastar-registration/sip:www.it005.ru:5060   yeastar-trunk   Registered
```

### 2. Проверка эндпоинтов
```bash
docker exec besedki_asterisk asterisk -rx "pjsip show endpoints"
```

Должны быть видны: 7779, 7780, 7781, yeastar-trunk

### 3. Проверка активных звонков
```bash
docker exec besedki_asterisk asterisk -rx "core show channels"
```

### 4. Тест WebSocket подключения (в браузере)
```javascript
const ws = new WebSocket('ws://localhost:8088/ws');
ws.onopen = () => console.log('✓ WebSocket подключен');
ws.onerror = (e) => console.error('✗ Ошибка WebSocket:', e);
```

### 5. Тест Echo (аудио)
1. Войдите как менеджер (manager@example.com / password123)
2. Откройте виджет телефона (правый нижний угол)
3. Наберите **1000** и позвоните
4. Говорите - должны слышать эхо

### 6. Тест внутреннего звонка
1. Откройте два браузера/окна инкогнито
2. В первом войдите как manager@example.com
3. Во втором войдите как warehouse@example.com
4. Из первого наберите **7781**
5. Во втором должен появиться входящий звонок

## 🐛 Известные безопасные ошибки

Следующие ошибки в логах Asterisk безопасны (модули нам не нужны):
- res_calendar declined to load
- app_confbridge declined to load
- cel_manager declined to load
- cdr_manager declined to load
- и другие "declined to load"

Эти модули не используются в нашей конфигурации.

## 🔧 Управление сервисами

### Перезапуск Backend
```bash
# Найти процесс
ps aux | grep "nest start"

# Или перезапустить через background ID
# (см. статус выше)
```

### Перезапуск Frontend
```bash
cd /Users/bagamedovyusup/work/besedkiemin/frontend
npm run dev
```

### Перезапуск Asterisk
```bash
docker-compose restart asterisk
```

### Проверка логов Asterisk
```bash
# Real-time
docker logs -f besedki_asterisk

# Последние 50 строк
docker logs besedki_asterisk 2>&1 | tail -50
```

## 📊 Мониторинг

### Asterisk CLI
```bash
# Подключение к консоли
docker exec -it besedki_asterisk asterisk -rvvv

# Команды в консоли:
pjsip show endpoints        # Показать все эндпоинты
pjsip show registrations    # Показать регистрации
core show channels          # Показать активные звонки
rtp show settings           # Показать настройки RTP
http show status            # Показать статус HTTP/WebSocket
exit                        # Выход
```

### Проверка портов
```bash
# Проверка что порты открыты
lsof -i :3000   # Backend
lsof -i :5173   # Frontend
lsof -i :5432   # PostgreSQL
lsof -i :8088   # Asterisk WebSocket
```

## 🔐 База данных

### SIP настройки пользователей
Обновлены на localhost Asterisk:

```sql
-- Менеджер
email: manager@example.com
sipServer: localhost
sipUser: 7779
sipPassword: 90PQchO8DxW
sipPort: 5060
sipWsPort: 8088

-- Складист
email: warehouse@example.com
sipServer: localhost
sipUser: 7781
sipPassword: password123
sipPort: 5060
sipWsPort: 8088
```

## 📝 Конфигурационные файлы

Все конфиги Asterisk находятся в `/Users/bagamedovyusup/work/besedkiemin/asterisk/config/`:

- **pjsip.conf** - SIP аккаунты, транспорты, транк к Yeastar
- **extensions.conf** - Диалплан (маршрутизация звонков)
- **http.conf** - HTTP/WebSocket сервер
- **rtp.conf** - RTP настройки
- **asterisk.conf** - Основные настройки Asterisk
- **modules.conf** - Модули для загрузки
- **logger.conf** - Настройки логирования

## 🚀 Следующие шаги

1. ✅ Asterisk установлен и работает
2. ✅ Транк к Yeastar зарегистрирован
3. ✅ Внутренние пользователи настроены
4. ✅ База данных обновлена
5. ✅ Все сервисы перезапущены
6. 🔄 Требуется тестирование звонков с фронтенда

## 💡 Полезные команды

```bash
# Полная перезагрузка Asterisk
docker-compose down asterisk
docker-compose up -d asterisk

# Перезагрузка конфигурации без перезапуска
docker exec besedki_asterisk asterisk -rx "pjsip reload"
docker exec besedki_asterisk asterisk -rx "dialplan reload"

# Включение детального дебага
docker exec besedki_asterisk asterisk -rx "core set verbose 5"
docker exec besedki_asterisk asterisk -rx "core set debug 5"

# Отключение дебага
docker exec besedki_asterisk asterisk -rx "core set verbose 3"
docker exec besedki_asterisk asterisk -rx "core set debug 0"
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи Backend: процесс 73269e
2. Проверьте логи Frontend: процесс 1aeb28
3. Проверьте логи Asterisk: `docker logs besedki_asterisk`
4. Проверьте консоль браузера (F12) для ошибок WebSocket
5. Убедитесь что все порты свободны и доступны

---

**Система готова к использованию!** 🎉
