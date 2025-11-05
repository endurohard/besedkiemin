#!/bin/bash

# Тестируем полный производственный цикл

# Проходим этапы: Designer -> Preparer -> Painter -> Warehouse

echo "=== Этап 2: Дизайнер ==="
DESIGNER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRlc2lnbmVyQGV4YW1wbGUuY29tIiwic3ViIjoiNmQwZTBjY2YtOWZiMS00MjliLTlhNjYtYTY5ODNjNGU2MzJhIiwicm9sZSI6IkRFU0lHTkVSIiwiaWF0IjoxNzYyMzcyNzk4LCJleHAiOjE3NjI5Nzc1OTh9.1xGsMRvaG0DX1G22s9935B7wHORYALz-vOhEJyHHVHA"
TASK_ID="59e83bbe-4fb7-4fc8-b02c-7d415586da94"

docker exec besedki_backend curl -s -X POST http://localhost:3000/tasks/$TASK_ID/accept -H "Authorization: Bearer $DESIGNER_TOKEN" > /dev/null
docker exec besedki_backend curl -s -X POST http://localhost:3000/tasks/$TASK_ID/complete -H "Authorization: Bearer $DESIGNER_TOKEN" > /dev/null
docker exec besedki_backend curl -s -X POST http://localhost:3000/tasks/$TASK_ID/pass -H "Authorization: Bearer $DESIGNER_TOKEN" > /dev/null
echo "✓ Дизайнер завершил задачу"

echo "=== Этап 3: Заготовка ==="
PREPARER_TOKEN=$(docker exec besedki_backend curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"preparer@example.com","password":"password123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
TASK_ID=$(docker exec -e PGPASSWORD=postgres besedki_postgres psql -U postgres -d besedki_emin -t -c "SELECT id FROM tasks WHERE stage = 'PREPARATION' AND status = 'NEW' AND product_id = '8e092b8e-53ad-4f85-8048-1343ad53bd74' LIMIT 1" | xargs)

docker exec besedki_backend curl -s -X POST http://localhost:3000/tasks/$TASK_ID/accept -H "Authorization: Bearer $PREPARER_TOKEN" > /dev/null
docker exec besedki_backend curl -s -X POST http://localhost:3000/tasks/$TASK_ID/complete -H "Authorization: Bearer $PREPARER_TOKEN" > /dev/null
docker exec besedki_backend curl -s -X POST http://localhost:3000/tasks/$TASK_ID/pass -H "Authorization: Bearer $PREPARER_TOKEN" > /dev/null
echo "✓ Заготовщик завершил задачу"

echo "=== Этап 4: Маляр ==="
PAINTER_TOKEN=$(docker exec besedki_backend curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"painter@example.com","password":"password123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
TASK_ID=$(docker exec -e PGPASSWORD=postgres besedki_postgres psql -U postgres -d besedki_emin -t -c "SELECT id FROM tasks WHERE stage = 'PAINTING' AND status = 'NEW' AND product_id = '8e092b8e-53ad-4f85-8048-1343ad53bd74' LIMIT 1" | xargs)

docker exec besedki_backend curl -s -X POST http://localhost:3000/tasks/$TASK_ID/accept -H "Authorization: Bearer $PAINTER_TOKEN" > /dev/null
docker exec besedki_backend curl -s -X POST http://localhost:3000/tasks/$TASK_ID/complete -H "Authorization: Bearer $PAINTER_TOKEN" > /dev/null
docker exec besedki_backend curl -s -X POST http://localhost:3000/tasks/$TASK_ID/pass -H "Authorization: Bearer $PAINTER_TOKEN" > /dev/null
echo "✓ Маляр завершил задачу"

echo "=== Этап 5: Склад (Контроль качества) ==="
WAREHOUSE_TOKEN=$(docker exec besedki_backend curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"warehouse@example.com","password":"password123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
TASK_ID=$(docker exec -e PGPASSWORD=postgres besedki_postgres psql -U postgres -d besedki_emin -t -c "SELECT id FROM tasks WHERE stage = 'QUALITY_CHECK' AND status = 'NEW' AND product_id = '8e092b8e-53ad-4f85-8048-1343ad53bd74' LIMIT 1' | xargs)

echo "Задача на складе: $TASK_ID"
echo "Складист может:"
echo "  1. Принять качество (accept + complete + pass)"
echo "  2. Забраковать и отправить на доработку (reject)"

echo ""
echo "=== Финальные задачи ==="
docker exec -e PGPASSWORD=postgres besedki_postgres psql -U postgres -d besedki_emin -c "SELECT t.title, t.stage, t.status, u.email FROM tasks t JOIN users u ON t.assigned_to_id = u.id WHERE t.product_id = '8e092b8e-53ad-4f85-8048-1343ad53bd74' ORDER BY t.created_at;"
