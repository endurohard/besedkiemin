import { PrismaClient, UserRole, ProductionStage } from '@prisma/client';

const prisma = new PrismaClient();

async function seedWorkflow() {
  console.log('🔄 Инициализация производственного цикла...');

  // Проверяем, есть ли уже этапы
  const existingStages = await prisma.workflowStage.count();

  if (existingStages > 0) {
    console.log('✅ Производственный цикл уже настроен');
    return;
  }

  const defaultStages = [
    {
      name: 'Менеджер',
      description: 'Прием и оформление заказа',
      order: 1,
      role: UserRole.MANAGER,
      legacyStage: ProductionStage.PENDING,
    },
    {
      name: 'Проектировщик',
      description: 'Разработка проекта',
      order: 2,
      role: UserRole.DESIGNER,
      legacyStage: ProductionStage.DESIGN,
    },
    {
      name: 'Заготовка',
      description: 'Подготовка материалов и заготовок',
      order: 3,
      role: UserRole.PREPARER,
      legacyStage: ProductionStage.PREPARATION,
    },
    {
      name: 'Маляр',
      description: 'Покраска изделий',
      order: 4,
      role: UserRole.PAINTER,
      legacyStage: ProductionStage.PAINTING,
    },
    {
      name: 'Склад',
      description: 'Контроль качества и хранение',
      order: 5,
      role: UserRole.WAREHOUSE,
      legacyStage: ProductionStage.QUALITY_CHECK,
    },
  ];

  for (const stage of defaultStages) {
    await prisma.workflowStage.create({ data: stage });
    console.log(`  ✓ Создан этап: ${stage.name}`);
  }

  console.log('✅ Производственный цикл успешно инициализирован');
}

seedWorkflow()
  .catch((e) => {
    console.error('❌ Ошибка при инициализации производственного цикла:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
