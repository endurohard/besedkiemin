INSERT INTO workflow_stages (id, name, description, "order", role, legacy_stage, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Менеджер', 'Прием и оформление заказа', 1, 'MANAGER', 'PENDING', true, NOW(), NOW()),
  (gen_random_uuid(), 'Проектировщик', 'Разработка проекта', 2, 'DESIGNER', 'DESIGN', true, NOW(), NOW()),
  (gen_random_uuid(), 'Заготовка', 'Подготовка материалов и заготовок', 3, 'PREPARER', 'PREPARATION', true, NOW(), NOW()),
  (gen_random_uuid(), 'Маляр', 'Покраска изделий', 4, 'PAINTER', 'PAINTING', true, NOW(), NOW()),
  (gen_random_uuid(), 'Склад', 'Контроль качества и хранение', 5, 'WAREHOUSE', 'QUALITY_CHECK', true, NOW(), NOW());
