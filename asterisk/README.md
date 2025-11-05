# Asterisk для Besedki EMIN

Локальный Asterisk сервер для WebRTC телефонии.

## Установка и запуск

### 1. Обновите SIP настройки пользователей в базе данных

```bash
cd backend
npx ts-node prisma/update-sip-to-asterisk.ts
```

### 2. Соберите и запустите Asterisk

```bash
# Из корневой директории проекта
docker-compose up -d asterisk
```

### 3. Проверьте статус Asterisk

```bash
# Подключитесь к консоли Asterisk
docker exec -it besedki_asterisk asterisk -rvvv

# В консоли Asterisk выполните:
pjsip show endpoints    # Показать SIP эндпоинты
pjsip show transports   # Показать транспорты
http show status        # Показать статус HTTP/WebSocket сервера
```

## Конфигурация

### SIP Accounts (pjsip.conf)

- **7779** - Менеджер (пароль: 90PQchO8DxW)
- **7780** - Менеджер 2 (пароль: password123)
- **7781** - Складист (пароль: password123)

### Порты

- **5060** - SIP (UDP/TCP)
- **8088** - HTTP/WebSocket
- **10000-20000** - RTP (медиа потоки)

### WebSocket URL

```
ws://localhost:8088/ws
```

## Диалплан (extensions.conf)

### Внутренние звонки

- **77XX** - Звонок между внутренними пользователями
  - Пример: набрать 7779 чтобы позвонить менеджеру

### Тестовые номера

- **1000** - Echo test (проверка аудио)
- **\*97** - Голосовая почта

## Примеры использования

### Проверка регистрации пользователя

```bash
docker exec -it besedki_asterisk asterisk -rx "pjsip show endpoint 7779"
```

### Просмотр активных звонков

```bash
docker exec -it besedki_asterisk asterisk -rx "core show channels"
```

### Просмотр логов

```bash
# Real-time логи
docker logs -f besedki_asterisk

# Логи в файле
docker exec -it besedki_asterisk tail -f /var/log/asterisk/messages
```

## Отладка WebRTC

### Проверка WebSocket соединения

Откройте браузер и в консоли выполните:

```javascript
const ws = new WebSocket('ws://localhost:8088/ws');
ws.onopen = () => console.log('WebSocket connected');
ws.onerror = (error) => console.error('WebSocket error:', error);
```

### Включение детального дебага в Asterisk

```bash
docker exec -it besedki_asterisk asterisk -rx "core set verbose 5"
docker exec -it besedki_asterisk asterisk -rx "core set debug 5"
```

## Решение проблем

### Asterisk не запускается

```bash
# Проверьте логи
docker logs besedki_asterisk

# Пересоберите контейнер
docker-compose down asterisk
docker-compose up -d --build asterisk
```

### WebSocket не подключается

1. Проверьте что порт 8088 открыт:
   ```bash
   netstat -an | grep 8088
   ```

2. Проверьте конфигурацию HTTP:
   ```bash
   docker exec -it besedki_asterisk cat /etc/asterisk/http.conf
   ```

### Нет аудио в звонках

1. Проверьте RTP порты:
   ```bash
   docker exec -it besedki_asterisk asterisk -rx "rtp show settings"
   ```

2. Убедитесь что используется STUN сервер для NAT traversal

## Добавление новых пользователей

1. Отредактируйте `asterisk/config/pjsip.conf`
2. Добавьте новую секцию:

```ini
[7782](webrtc_client)
auth=7782
aors=7782
callerid="New User" <7782>

[7782](auth_userpass)
password=your_password
username=7782

[7782](aor_single)
```

3. Перезапустите Asterisk:
   ```bash
   docker-compose restart asterisk
   ```

4. Обновите пользователя в базе данных:
   ```sql
   UPDATE users SET
     sip_server = 'localhost',
     sip_user = '7782',
     sip_password = 'your_password',
     sip_port = 5060,
     sip_ws_port = 8088
   WHERE email = 'user@example.com';
   ```

## Мониторинг

### Asterisk CLI команды

```bash
# Показать все активные каналы
core show channels

# Показать SIP эндпоинты
pjsip show endpoints

# Показать зарегистрированные контакты
pjsip show contacts

# Статистика звонков
core show uptime

# Использование памяти
core show sysinfo
```

## Безопасность

⚠️ **Важно для продакшена:**

1. Смените все пароли по умолчанию
2. Включите TLS/SSL для WebSocket (wss://)
3. Настройте firewall для ограничения доступа
4. Используйте fail2ban для защиты от брутфорса
5. Регулярно обновляйте Asterisk

## Полезные ссылки

- [Asterisk Documentation](https://docs.asterisk.org/)
- [PJSIP Configuration](https://wiki.asterisk.org/wiki/display/AST/Configuring+res_pjsip)
- [WebRTC Tutorial](https://wiki.asterisk.org/wiki/display/AST/WebRTC+tutorial+using+SIPML5)
