#!/bin/bash
# Ежедневный бэкап PostgreSQL Besedki EMIN → Yandex Disk
set -euo pipefail

# Загрузить конфигурацию
source /home/itadmin/besedkiemin/.env.backup

# Конфигурация
BACKUP_DIR="/home/itadmin/besedkiemin/backups"
DB_CONTAINER="besedki_postgres"
DB_NAME="besedki_emin"
DB_USER="postgres"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-7}"
DATE=$(date +%Y-%m-%d_%H-%M)
BACKUP_FILE="besedki_${DATE}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Yandex Disk WebDAV
YANDEX_WEBDAV="https://webdav.yandex.ru"
YANDEX_DIR="/besedki_backups"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"; }

# 1. Создать директорию
mkdir -p "$BACKUP_DIR"

# 2. Дамп БД через docker exec
log "Начало бэкапа..."
if ! docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/$BACKUP_FILE"; then
    log "ОШИБКА: не удалось создать дамп БД"
    exit 1
fi
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
log "Дамп создан: $BACKUP_FILE ($BACKUP_SIZE)"

# 3. Создать папку на Yandex Disk (если нет)
curl -s -X MKCOL -u "${YANDEX_LOGIN}:${YANDEX_PASSWORD}" "${YANDEX_WEBDAV}${YANDEX_DIR}/" 2>/dev/null || true

# 4. Загрузить на Yandex Disk
HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
  -T "$BACKUP_DIR/$BACKUP_FILE" \
  -u "${YANDEX_LOGIN}:${YANDEX_PASSWORD}" \
  "${YANDEX_WEBDAV}${YANDEX_DIR}/${BACKUP_FILE}")

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "204" ]; then
    log "Загружено на Yandex Disk: $BACKUP_FILE"
    UPLOAD_STATUS="Загружено на Yandex Disk"
else
    log "ОШИБКА загрузки на Yandex Disk: HTTP $HTTP_CODE"
    UPLOAD_STATUS="Ошибка загрузки (HTTP $HTTP_CODE)"
fi

# 5. Ротация — удалить локальные бэкапы старше KEEP_DAYS дней
find "$BACKUP_DIR" -name "besedki_*.sql.gz" -mtime +$KEEP_DAYS -delete 2>/dev/null || true
log "Ротация локальных бэкапов выполнена"

# 6. Ротация на Yandex Disk — удалить старые файлы
CUTOFF_DATE=$(date -d "-${KEEP_DAYS} days" +%Y-%m-%d)
curl -s -u "${YANDEX_LOGIN}:${YANDEX_PASSWORD}" \
  -X PROPFIND "${YANDEX_WEBDAV}${YANDEX_DIR}/" \
  -H "Depth: 1" 2>/dev/null | grep -oP 'besedki_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.sql\.gz' | while read fname; do
    FILE_DATE=$(echo "$fname" | grep -oP '\d{4}-\d{2}-\d{2}')
    if [[ "$FILE_DATE" < "$CUTOFF_DATE" ]]; then
        curl -s -X DELETE -u "${YANDEX_LOGIN}:${YANDEX_PASSWORD}" \
          "${YANDEX_WEBDAV}${YANDEX_DIR}/${fname}" 2>/dev/null
        log "Удалён с Yandex Disk: $fname"
    fi
done

# 7. Telegram уведомление (если токен настроен)
COUNT=$(find "$BACKUP_DIR" -name "besedki_*.sql.gz" | wc -l)
if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_ADMIN_ID" ]; then
    MSG=$(cat <<MSGEOF
🗄 *Бэкап Besedki EMIN*
📅 $(date '+%d.%m.%Y %H:%M')
📦 Файл: \`${BACKUP_FILE}\`
💾 Размер: ${BACKUP_SIZE}
☁️ ${UPLOAD_STATUS}
📁 Локальных копий: ${COUNT}
MSGEOF
)
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d chat_id="$TELEGRAM_ADMIN_ID" \
      -d text="$MSG" \
      -d parse_mode="Markdown" > /dev/null 2>&1 || true
    log "Telegram уведомление отправлено"
else
    log "Telegram не настроен — уведомление пропущено"
fi

log "Бэкап завершён: $BACKUP_FILE ($BACKUP_SIZE), $UPLOAD_STATUS, копий: $COUNT"
