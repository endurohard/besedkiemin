import { PrismaClient, ProductionStage, UserRole, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Создание задач для существующих продуктов...\n');

  // Получаем все продукты, которые не завершены
  const products = await prisma.product.findMany({
    where: {
      stage: {
        not: ProductionStage.COMPLETED,
      },
    },
    include: {
      order: true,
      tasks: true,
    },
  });

  console.log(`Найдено ${products.length} незавершенных продуктов\n`);

  for (const product of products) {
    // Пропускаем если у продукта уже есть активные задачи
    if (product.tasks.length > 0) {
      console.log(`⏭️  ${product.name} - уже есть задачи`);
      continue;
    }

    // Определяем роль для текущей стадии продукта
    const roleMapping = {
      [ProductionStage.PENDING]: UserRole.DESIGNER,
      [ProductionStage.DESIGN]: UserRole.DESIGNER,
      [ProductionStage.PREPARATION]: UserRole.PREPARER,
      [ProductionStage.PAINTING]: UserRole.PAINTER,
      [ProductionStage.QUALITY_CHECK]: UserRole.WAREHOUSE,
    };

    const role = roleMapping[product.stage];

    if (!role) {
      console.log(`⏭️  ${product.name} - стадия ${product.stage} не требует задачи`);
      continue;
    }

    // Находим первого доступного работника нужной роли
    const worker = await prisma.user.findFirst({
      where: {
        role: role,
        isActive: true,
      },
    });

    if (!worker) {
      console.log(`❌ ${product.name} - не найден работник для роли ${role}`);
      continue;
    }

    // Создаем задачу
    const task = await prisma.task.create({
      data: {
        title: `${product.name} - ${product.stage}`,
        description: `Задача для продукта. Заказ: ${product.order.orderNumber}`,
        stage: product.stage,
        status: TaskStatus.NEW,
        productId: product.id,
        assignedToId: worker.id,
      },
    });

    console.log(`✅ ${product.name} - создана задача для ${worker.email} (${role})`);
  }

  console.log('\n✨ Готово!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
