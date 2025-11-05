# Настройка производственного цикла

## Что реализовано

Теперь владелец может настраивать производственный цикл (последовательность этапов) через API.

### Основные возможности:

1. **Просмотр этапов** - все сотрудники могут видеть этапы
2. **Создание этапов** - только владелец (OWNER)
3. **Изменение порядка** - только владелец может менять последовательность
4. **Активация/деактивация** - временно отключать этапы без удаления
5. **Удаление** - только если нет связанных задач или истории

### Структура этапа workflow:

```typescript
{
  id: string;              // UUID этапа
  name: string;            // Название (например, "Заготовка")
  description?: string;    // Описание этапа
  order: number;           // Порядковый номер (1, 2, 3...)
  role: UserRole;          // Роль, которая работает на этом этапе
  isActive: boolean;       // Активен ли этап
  legacyStage?: ProductionStage; // Старое значение для совместимости
}
```

## API Endpoints

### 1. Получить все этапы
```bash
GET /workflow
Authorization: Bearer <token>
```

### 2. Получить активные этапы
```bash
GET /workflow/active
Authorization: Bearer <token>
```

### 3. Создать этап (только OWNER)
```bash
POST /workflow
Authorization: Bearer <owner_token>
Content-Type: application/json

{
  "name": "Упаковка",
  "description": "Упаковка готовых изделий",
  "order": 6,
  "role": "WAREHOUSE",
  "isActive": true
}
```

### 4. Обновить этап (только OWNER)
```bash
PATCH /workflow/:id
Authorization: Bearer <owner_token>
Content-Type: application/json

{
  "name": "Новое название",
  "description": "Новое описание",
  "isActive": false
}
```

### 5. Изменить порядок этапов (только OWNER)
```bash
POST /workflow/reorder
Authorization: Bearer <owner_token>
Content-Type: application/json

{
  "stageIds": ["id1", "id2", "id3", "id4", "id5"]
}
```
*Порядок ID в массиве определяет новый порядок этапов (1, 2, 3...)*

### 6. Удалить этап (только OWNER)
```bash
DELETE /workflow/:id
Authorization: Bearer <owner_token>
```

### 7. Инициализировать workflow по умолчанию (только OWNER)
```bash
POST /workflow/initialize
Authorization: Bearer <owner_token>
```
*Создает стандартный workflow: Менеджер → Проектировщик → Заготовка → Маляр → Склад*

### 8. Получить следующий этап
```bash
GET /workflow/:id/next
Authorization: Bearer <token>
```

### 9. Получить предыдущий этап
```bash
GET /workflow/:id/previous
Authorization: Bearer <token>
```

## Примеры использования

### Пример 1: Создать новый производственный цикл

```bash
# 1. Получить токен владельца
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. Создать этапы в нужном порядке
curl -X POST http://localhost:3000/workflow \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Менеджер",
    "description": "Прием заказа",
    "order": 1,
    "role": "MANAGER"
  }'

curl -X POST http://localhost:3000/workflow \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Заготовка",
    "description": "Подготовка материалов",
    "order": 2,
    "role": "PREPARER"
  }'

# ... и так далее
```

### Пример 2: Изменить порядок этапов

```bash
# Получаем текущие этапы
curl http://localhost:3000/workflow \
  -H "Authorization: Bearer $TOKEN"

# Меняем порядок (например, поменять местами Заготовку и Маляра)
curl -X POST http://localhost:3000/workflow/reorder \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stageIds": [
      "manager-id",
      "designer-id",
      "painter-id",    // Маляр теперь 3-й
      "preparer-id",   // Заготовка теперь 4-я
      "warehouse-id"
    ]
  }'
```

### Пример 3: Деактивировать этап

```bash
# Временно отключить этап "Проектировщик"
curl -X PATCH http://localhost:3000/workflow/designer-id \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

## Инициализация workflow

Если вы только запустили систему, выполните:

```bash
npx ts-node prisma/seed-workflow.ts
```

Это создаст стандартный workflow:
1. Менеджер (PENDING)
2. Проектировщик (DESIGN)
3. Заготовка (PREPARATION)
4. Маляр (PAINTING)
5. Склад (QUALITY_CHECK)

## База данных

### Таблица workflow_stages

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Уникальный идентификатор |
| name | String | Название этапа |
| description | String? | Описание |
| order | Int | Порядковый номер (уникальный) |
| role | UserRole | Роль исполнителя |
| is_active | Boolean | Активен ли этап |
| legacy_stage | ProductionStage? | Старое значение для совместимости |
| created_at | DateTime | Дата создания |
| updated_at | DateTime | Дата обновления |

## Миграция

Миграция уже применена. Если нужно применить заново:

```bash
cd backend
npx prisma migrate dev --name add_workflow_stages
```

## Следующие шаги

1. **Frontend UI** - создать интерфейс для владельца
   - Drag & Drop для изменения порядка
   - Формы создания/редактирования этапов

2. **Интеграция с продуктами** - обновить логику прохождения продуктов
   - Использовать workflowStageId вместо жестко закодированных enum
   - Динамически определять следующий этап

3. **Валидация** - добавить проверки
   - Минимум 2 этапа
   - Обязательно наличие финального этапа (Склад)

## Примечания

- Старые этапы (ProductionStage enum) сохранены для обратной совместимости
- В ProductHistory и Task добавлено поле workflowStageId
- Порядковый номер (order) уникален и определяет последовательность
- Нельзя удалить этап, если есть связанные задачи или история
