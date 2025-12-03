#!/bin/bash

echo "========================================"
echo "Установка Xray для VLESS/Reality VPN"
echo "========================================"
echo ""

# Проверка что скрипт запущен с правами root
if [ "$EUID" -ne 0 ]; then
    echo "Пожалуйста, запустите скрипт с правами root (sudo)"
    exit 1
fi

# Установка необходимых пакетов
echo "Установка необходимых пакетов..."
apt-get update
apt-get install -y curl wget unzip systemd

# Создание директории для Xray
echo "Создание директорий..."
mkdir -p /usr/local/etc/xray
mkdir -p /var/log/xray

# Скачивание последней версии Xray
echo "Скачивание Xray..."
XRAY_VERSION=$(curl -s https://api.github.com/repos/XTLS/Xray-core/releases/latest | grep -Po '"tag_name": "\K.*?(?=")')
if [ -z "$XRAY_VERSION" ]; then
    echo "Ошибка: не удалось получить версию Xray"
    exit 1
fi

echo "Скачивание Xray версии $XRAY_VERSION..."
wget "https://github.com/XTLS/Xray-core/releases/download/${XRAY_VERSION}/Xray-linux-64.zip" -O /tmp/xray.zip

# Распаковка Xray
echo "Установка Xray..."
unzip -o /tmp/xray.zip -d /usr/local/bin/
chmod +x /usr/local/bin/xray
rm /tmp/xray.zip

# Создание конфигурационного файла с VLESS ключом
echo "Создание конфигурации..."
cat > /usr/local/etc/xray/config.json << 'EOF'
{
  "log": {
    "loglevel": "warning",
    "access": "/var/log/xray/access.log",
    "error": "/var/log/xray/error.log"
  },
  "inbounds": [
    {
      "port": 10808,
      "protocol": "socks",
      "settings": {
        "auth": "noauth",
        "udp": true
      },
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls"]
      }
    },
    {
      "port": 10809,
      "protocol": "http",
      "settings": {
        "allowTransparent": false
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "vless",
      "settings": {
        "vnext": [
          {
            "address": "185.128.104.219",
            "port": 443,
            "users": [
              {
                "id": "01c1581e-dfbd-4497-bf81-0bcc378091b5",
                "encryption": "none",
                "flow": ""
              }
            ]
          }
        ]
      },
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "serverName": "mirror.yandex.ru",
          "fingerprint": "chrome",
          "show": false,
          "publicKey": "Nf4RWEpUDg5CA3KoCyMK3YGOXClt16zNjs3HN6QBAhQ",
          "shortId": "0e38db",
          "spiderX": "/"
        }
      },
      "tag": "proxy"
    },
    {
      "protocol": "freedom",
      "tag": "direct"
    },
    {
      "protocol": "blackhole",
      "tag": "block"
    }
  ],
  "routing": {
    "domainStrategy": "IPIfNonMatch",
    "rules": [
      {
        "type": "field",
        "ip": ["geoip:private"],
        "outboundTag": "direct"
      }
    ]
  }
}
EOF

# Создание systemd сервиса
echo "Создание systemd сервиса..."
cat > /etc/systemd/system/xray.service << 'EOF'
[Unit]
Description=Xray Service
Documentation=https://github.com/xtls
After=network.target nss-lookup.target

[Service]
Type=simple
User=root
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_ADMIN CAP_NET_BIND_SERVICE
NoNewPrivileges=true
ExecStart=/usr/local/bin/xray run -config /usr/local/etc/xray/config.json
Restart=on-failure
RestartPreventExitStatus=23

[Install]
WantedBy=multi-user.target
EOF

# Перезагрузка systemd
systemctl daemon-reload

# Запуск сервиса
echo "Запуск Xray..."
systemctl enable xray
systemctl start xray

# Проверка статуса
sleep 2
if systemctl is-active --quiet xray; then
    echo ""
    echo "========================================"
    echo "✓ Xray успешно установлен и запущен!"
    echo "========================================"
    echo ""
    echo "SOCKS5 прокси: 127.0.0.1:10808"
    echo "HTTP прокси:   127.0.0.1:10809"
    echo ""
    echo "Проверка статуса:"
    echo "  systemctl status xray"
    echo ""
    echo "Просмотр логов:"
    echo "  journalctl -u xray -f"
    echo "  tail -f /var/log/xray/error.log"
    echo ""
    echo "Проверка подключения:"
    echo "  curl --proxy socks5://127.0.0.1:10808 ifconfig.me"
    echo "  curl --proxy http://127.0.0.1:10809 ifconfig.me"
    echo ""
else
    echo ""
    echo "========================================"
    echo "✗ Ошибка при запуске Xray"
    echo "========================================"
    echo ""
    echo "Просмотр логов ошибок:"
    echo "  journalctl -u xray -n 50"
    echo "  tail -f /var/log/xray/error.log"
    echo ""
    exit 1
fi

echo "========================================"
echo "Настройка системного прокси"
echo "========================================"
echo ""
echo "Чтобы весь трафик сервера шел через VPN,"
echo "добавьте в /etc/environment:"
echo ""
echo "http_proxy=http://127.0.0.1:10809"
echo "https_proxy=http://127.0.0.1:10809"
echo "HTTP_PROXY=http://127.0.0.1:10809"
echo "HTTPS_PROXY=http://127.0.0.1:10809"
echo "no_proxy=localhost,127.0.0.1"
echo ""
echo "Или используйте прокси для конкретных команд:"
echo "  export https_proxy=http://127.0.0.1:10809"
echo "  curl ifconfig.me"
echo ""

echo "========================================"
echo "Настройка Docker для работы через VPN"
echo "========================================"
echo ""
echo "Добавьте в docker-compose.yml для сервисов:"
echo ""
echo "  environment:"
echo "    - http_proxy=http://host.docker.internal:10809"
echo "    - https_proxy=http://host.docker.internal:10809"
echo ""
echo "Или создайте /etc/systemd/system/docker.service.d/http-proxy.conf:"
echo ""
echo "[Service]"
echo "Environment=\"HTTP_PROXY=http://127.0.0.1:10809\""
echo "Environment=\"HTTPS_PROXY=http://127.0.0.1:10809\""
echo "Environment=\"NO_PROXY=localhost,127.0.0.1\""
echo ""
echo "Затем перезапустите Docker:"
echo "  systemctl daemon-reload"
echo "  systemctl restart docker"
echo ""

echo "========================================"
echo "Готово!"
echo "========================================"
