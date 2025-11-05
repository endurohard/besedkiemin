#!/bin/bash

echo "========================================"
echo "Исправление конфликта портов"
echo "========================================"

# Найти контейнеры, использующие порты 80, 443, 8001
echo ""
echo "Проверяем, какие контейнеры используют порты 80, 443, 8001..."
echo ""

docker ps -a | grep -E "80|443|8001" || echo "Контейнеров не найдено"

echo ""
echo "========================================"
echo "Поиск процессов на портах..."
echo "========================================"

# Проверяем, что слушает порты
echo "Порт 80:"
lsof -i :80 || netstat -tulpn | grep :80 || ss -tulpn | grep :80 || echo "Порт 80 свободен"

echo ""
echo "Порт 443:"
lsof -i :443 || netstat -tulpn | grep :443 || ss -tulpn | grep :443 || echo "Порт 443 свободен"

echo ""
echo "Порт 8001:"
lsof -i :8001 || netstat -tulpn | grep :8001 || ss -tulpn | grep :8001 || echo "Порт 8001 свободен"

echo ""
echo "========================================"
echo "Решения:"
echo "========================================"
echo ""
echo "Вариант 1: Остановить все Kong контейнеры"
echo "  docker ps -a | grep kong | awk '{print \$1}' | xargs docker rm -f"
echo ""
echo "Вариант 2: Остановить все контейнеры"
echo "  docker stop \$(docker ps -aq)"
echo "  docker rm \$(docker ps -aq)"
echo ""
echo "Вариант 3: Изменить порты в docker-compose.yml"
echo "  Например, использовать порты 8080 и 8443 вместо 80 и 443"
echo ""
echo "========================================"
echo ""
echo "Выберите действие:"
echo "1) Удалить все старые Kong контейнеры"
echo "2) Остановить и удалить ВСЕ контейнеры (осторожно!)"
echo "3) Показать подробную информацию о контейнерах"
echo "4) Выход (исправлю вручную)"
echo ""
read -p "Введите номер (1-4): " choice

case $choice in
  1)
    echo "Удаляем все Kong контейнеры..."
    docker ps -a | grep kong | awk '{print $1}' | xargs -r docker rm -f
    echo "Готово! Теперь запустите: docker-compose up -d"
    ;;
  2)
    echo "Останавливаем все контейнеры..."
    docker stop $(docker ps -aq) 2>/dev/null || true
    echo "Удаляем все контейнеры..."
    docker rm $(docker ps -aq) 2>/dev/null || true
    echo "Готово! Теперь запустите: docker-compose up -d"
    ;;
  3)
    echo "Все контейнеры:"
    docker ps -a
    echo ""
    echo "Процессы на портах:"
    lsof -i :80,443,8001 || netstat -tulpn | grep -E ":80|:443|:8001" || ss -tulpn | grep -E ":80|:443|:8001"
    ;;
  4)
    echo "Выход..."
    ;;
  *)
    echo "Неверный выбор"
    ;;
esac
