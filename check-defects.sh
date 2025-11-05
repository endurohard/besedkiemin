#!/bin/bash

echo "Проверка счетчиков брака для всех ролей"
echo "========================================"

for email in "warehouse@example.com" "manager@example.com" "designer@example.com" "preparer@example.com" "painter@example.com"; do
  echo ""
  echo "=== $email ==="

  TOKEN=$(docker exec besedki_backend curl -s -X POST http://localhost:3000/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"$email\",\"password\":\"password123\"}" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

  echo "Счетчик непринятых браков:"
  docker exec besedki_backend curl -s http://localhost:3000/tasks/defects/unaccepted/count -H "Authorization: Bearer $TOKEN"

  echo ""
  echo "Список браков (первые 100 символов):"
  DEFECTS=$(docker exec besedki_backend curl -s http://localhost:3000/tasks/defects -H "Authorization: Bearer $TOKEN")
  echo "$DEFECTS" | head -c 100
  echo "..."
done
