#!/bin/bash
# Восстановление БД Besedki EMIN из бэкапа
set -euo pipefail

# Загрузить конфигурацию
source /home/itadmin/besedkiemin/.env.backup

BACKUP_DIR="/home/itadmin/besedkiemin/backups"
DB_CONTAINER="besedki_postgres"
DB_NAME="besedki_emin"
DB_USER="postgres"
YANDEX_WEBDAV="https://webdav.yandex.ru"
YANDEX_DIR="/besedki_backups"

# Без аргументов — показать справку и список бэкапов
if [ -z "${1:-}" ]; then
    echo "========================================"
    echo "  Восстановление БД Besedki EMIN"
    echo "========================================"
    echo ""
    echo "Использование:"
    echo "  ./restore.sh <файл>                  — из локального файла"
    echo "  ./restore.sh --cloud <имя_файла>     — скачать с Yandex Disk и восстановить"
    echo ""
    echo "Локальные бэкапы:"
    if ls "$BACKUP_DIR"/besedki_*.sql.gz 1>/dev/null 2>&1; then
        ls -lh "$BACKUP_DIR"/besedki_*.sql.gz | awk '{print "  " $9 " (" $5 ", " $6 " " $7 ")"}'
    else
        echo "  (нет)"
    fi
    echo ""
    echo "На Yandex Disk:"
    curl -s -u "${YANDEX_LOGIN}:${YANDEX_PASSWORD}" \
      -X PROPFIND "${YANDEX_WEBDAV}${YANDEX_DIR}/" -H "Depth: 1" 2>/dev/null \
      | grep -oP 'besedki_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.sql\.gz' | sort | while read f; do
        echo "  $f"
    done
    exit 0
fi

# Скачать с Yandex Disk если --cloud
if [ "$1" = "--cloud" ]; then
    if [ -z "${2:-}" ]; then
        echo "Укажите имя файла: ./restore.sh --cloud besedki_2026-03-29_02-00.sql.gz"
        exit 1
    fi
    FNAME="$2"
    echo "⬇️  Скачиваю $FNAME с Yandex Disk..."
    mkdir -p "$BACKUP_DIR"
    HTTP_CODE=$(curl -s -w "%{http_code}" -o "$BACKUP_DIR/$FNAME" \
      -u "${YANDEX_LOGIN}:${YANDEX_PASSWORD}" \
      "${YANDEX_WEBDAV}${YANDEX_DIR}/${FNAME}")
    if [ "$HTTP_CODE" != "200" ]; then
        echo "❌ Ошибка скачивания: HTTP $HTTP_CODE"
        rm -f "$BACKUP_DIR/$FNAME"
        exit 1
    fi
    echo "✅ Скачано: $BACKUP_DIR/$FNAME"
    RESTORE_FILE="$BACKUP_DIR/$FNAME"
else
    RESTORE_FILE="$1"
fi

# Проверить файл
if [ ! -f "$RESTORE_FILE" ]; then
    echo "❌ Файл не найден: $RESTORE_FILE"
    exit 1
fi

FILE_SIZE=$(du -h "$RESTORE_FILE" | cut -f1)
echo ""
echo "⚠️  ВНИМАНИЕ: Текущая база $DB_NAME будет ПОЛНОСТЬЮ ЗАМЕНЕНА!"
echo "   Файл: $RESTORE_FILE ($FILE_SIZE)"
echo ""
read -p "Продолжить? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Отменено."
    exit 0
fi

echo ""
echo "🔄 Останавливаю backend..."
cd /home/itadmin/besedkiemin
docker compose stop backend

echo "🗑  Пересоздаю базу данных..."
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS ${DB_NAME};"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "CREATE DATABASE ${DB_NAME};"

echo "📥 Восстанавливаю из бэкапа..."
gunzip -c "$RESTORE_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" "$DB_NAME" > /dev/null 2>&1

echo "🚀 Запускаю backend..."
docker compose start backend

echo ""
echo "✅ База $DB_NAME восстановлена из $RESTORE_FILE"
echo "   Проверьте работу: http://176.98.155.17/app/login"
