# Инструкция по настройке Asterisk для Besedki EMIN

## ✅ Что было сделано

1. **Создан Docker контейнер с Asterisk 20**
   - Настроен WebRTC с поддержкой WebSocket
   - Включена поддержка PJSIP
   - Настроены RTP порты для медиа

2. **Созданы SIP аккаунты для пользователей:**
   - **7779** - Менеджер (manager@example.com)
   - **7780** - Менеджер 2 (резервный)
   - **7781** - Складист (warehouse@example.com)

3. **Настроен диалплан:**
   - Звонки между внутренними пользователями (77XX)
   - Тестовый эхо-тест (1000)
   - Голосовая почта (*97)

4. **Обновлены SIP настройки в базе данных:**
   - Сервер: localhost
   - WebSocket: ws://localhost:8088

## 📋 Как использовать

### 1. Проверка статуса сборки

```bash
# Проверьте логи сборки
docker logs -f besedki_asterisk
```

Подождите пока увидите сообщение:
```
Asterisk Ready.
```

### 2. Проверка работы Asterisk

```bash
# Подключитесь к консоли Asterisk
docker exec -it besedki_asterisk asterisk -rvvv
```

В консоли выполните:
```
pjsip show endpoints
```

Вы должны увидеть ваши эндпоинты (7779, 7780, 7781).

### 3. Тестирование WebSocket

Откройте браузер, перейдите в консоль (F12) и выполните:

```javascript
const ws = new WebSocket('ws://localhost:8088/ws');
ws.onopen = () => console.log('✓ WebSocket подключен');
ws.onerror = (e) => console.error('✗ Ошибка WebSocket:', e);
```

### 4. Проверка в приложении

1. Перезапустите frontend:
   ```bash
   # Ctrl+C на текущем процессе, затем:
   cd frontend && npm run dev
   ```

2. Войдите как менеджер:
   - Email: manager@example.com
   - Password: password123

3. В правом нижнем углу должна появиться кнопка телефона

4. Откройте виджет и проверьте статус:
   - Должен быть зеленый индикатор "Подключено"

### 5. Тестирование звонков

#### Тест 1: Echo Test
1. В виджете наберите: **1000**
2. Нажмите кнопку звонка
3. Примите звонок
4. Говорите что-нибудь - вы должны услышать эхо

#### Тест 2: Звонок между пользователями
1. Откройте два браузера (или окна инкогнито)
2. В первом войдите как manager@example.com
3. Во втором войдите как warehouse@example.com
4. Из первого наберите: **7781** (номер складиста)
5. Во втором должен появиться входящий звонок

## 🔧 Настройка

### Порты

Asterisk использует следующие порты:
- **5060** (UDP/TCP) - SIP сигнализация
- **8088** (TCP) - HTTP/WebSocket
- **10000-20000** (UDP) - RTP (медиа потоки)

### Конфигурационные файлы

Все конфиги находятся в `asterisk/config/`:
- `pjsip.conf` - SIP аккаунты и транспорты
- `http.conf` - HTTP/WebSocket сервер
- `extensions.conf` - Диалплан (маршрутизация звонков)
- `rtp.conf` - RTP настройки

## 🐛 Решение проблем

### Проблема: "Не подключено" в виджете

1. Проверьте что Asterisk запущен:
   ```bash
   docker ps | grep asterisk
   ```

2. Проверьте WebSocket:
   ```bash
   docker exec -it besedki_asterisk asterisk -rx "http show status"
   ```

3. Проверьте логи:
   ```bash
   docker logs besedki_asterisk | tail -50
   ```

### Проблема: "WebSocket connection failed"

1. Убедитесь что используется `ws://` а не `wss://`:
   - Frontend должен быть на `http://localhost:5173`
   - WebSocket должен быть `ws://localhost:8088`

2. Проверьте настройки в коде (frontend/src/hooks/usePhoneSIP.ts:47):
   ```typescript
   const wsUrl = `ws://${config.server}:${config.wsPort || 8088}`;
   ```

### Проблема: "Нет аудио"

1. Проверьте разрешения микрофона в браузере
2. Убедитесь что используется STUN сервер (уже настроен в rtp.conf)
3. Проверьте RTP порты:
   ```bash
   docker exec -it besedki_asterisk asterisk -rx "rtp show settings"
   ```

### Проблема: "401 Unauthorized"

1. Проверьте пароли в pjsip.conf
2. Проверьте данные в базе:
   ```sql
   SELECT email, sip_user, sip_password FROM users WHERE sip_user IS NOT NULL;
   ```

## 📊 Мониторинг

### Просмотр активных звонков

```bash
docker exec -it besedki_asterisk asterisk -rx "core show channels"
```

### Просмотр зарегистрированных пользователей

```bash
docker exec -it besedki_asterisk asterisk -rx "pjsip show contacts"
```

### Live логи

```bash
docker logs -f besedki_asterisk
```

## 🔐 Безопасность (для продакшена)

1. **Смените пароли:**
   - Отредактируйте `asterisk/config/pjsip.conf`
   - Обновите базу данных

2. **Включите TLS для WebSocket:**
   - Настройте SSL сертификаты
   - Измените `ws://` на `wss://`

3. **Настройте Firewall:**
   ```bash
   # Разрешите только нужные порты
   ufw allow 5060/udp
   ufw allow 8088/tcp
   ufw allow 10000:20000/udp
   ```

4. **Используйте fail2ban** для защиты от брутфорса

## 📝 Добавление новых пользователей

1. Добавьте в `asterisk/config/pjsip.conf`:
   ```ini
   [7782](webrtc_client)
   auth=7782
   aors=7782
   callerid="Designer" <7782>

   [7782](auth_userpass)
   password=secure_password_here
   username=7782

   [7782](aor_single)
   ```

2. Обновите базу данных:
   ```sql
   UPDATE users SET
     sip_server = 'localhost',
     sip_user = '7782',
     sip_password = 'secure_password_here',
     sip_port = 5060,
     sip_ws_port = 8088
   WHERE email = 'designer@example.com';
   ```

3. Перезапустите Asterisk:
   ```bash
   docker-compose restart asterisk
   ```

## 🎯 Следующие шаги

1. ✅ Asterisk установлен и настроен
2. ✅ SIP аккаунты созданы
3. ✅ Frontend обновлен для использования локального Asterisk
4. 🔄 Тестирование звонков
5. 📞 Настройка внешних звонков (если нужно)

## 💡 Полезные команды

```bash
# Перезапуск Asterisk
docker-compose restart asterisk

# Остановка
docker-compose stop asterisk

# Просмотр конфигурации
docker exec -it besedki_asterisk cat /etc/asterisk/pjsip.conf

# Перезагрузка конфигурации без перезапуска
docker exec -it besedki_asterisk asterisk -rx "pjsip reload"
docker exec -it besedki_asterisk asterisk -rx "dialplan reload"

# Включение детального дебага
docker exec -it besedki_asterisk asterisk -rx "core set verbose 5"
docker exec -it besedki_asterisk asterisk -rx "core set debug 5"
```

## 📚 Документация

- [Asterisk Official Docs](https://docs.asterisk.org/)
- [PJSIP Configuration](https://wiki.asterisk.org/wiki/display/AST/Configuring+res_pjsip)
- [WebRTC Support](https://wiki.asterisk.org/wiki/display/AST/WebRTC)
- [Dialplan Guide](https://wiki.asterisk.org/wiki/display/AST/Dialplan)

## 🆘 Поддержка

Если возникли проблемы:
1. Проверьте логи: `docker logs besedki_asterisk`
2. Проверьте консоль браузера (F12)
3. Проверьте консоль Asterisk: `docker exec -it besedki_asterisk asterisk -rvvv`

Удачи! 🚀
