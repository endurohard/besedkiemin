import { PrismaClient, ProductionStage, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function updateOrderStatuses() {
  console.log('🔄 Начинаем обновление статусов заказов...');

  // Получаем все заказы с продуктами
  const orders = await prisma.order.findMany({
    include: {
      products: true,
    },
  });

  console.log(`📦 Найдено заказов: ${orders.length}`);

  let updatedCount = 0;

  for (const order of orders) {
    if (order.products.length === 0) {
      console.log(`⚠️  Заказ ${order.orderNumber} не имеет продуктов, пропускаем`);
      continue;
    }

    // Проверяем статус продуктов
    const allCompleted = order.products.every(
      (p) => p.stage === ProductionStage.COMPLETED,
    );

    const hasStarted = order.products.some(
      (p) => p.stage !== ProductionStage.PENDING,
    );

    let newStatus: OrderStatus | null = null;

    if (allCompleted) {
      newStatus = OrderStatus.COMPLETED;
    } else if (hasStarted) {
      newStatus = OrderStatus.IN_PRODUCTION;
    }

    // Обновляем только если статус должен измениться
    if (newStatus && order.status !== newStatus) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: newStatus },
      });
      console.log(`✅ Заказ ${order.orderNumber}: ${order.status} → ${newStatus}`);
      updatedCount++;
    } else if (newStatus) {
      console.log(`ℹ️  Заказ ${order.orderNumber}: статус уже ${newStatus}, обновление не требуется`);
    }
  }

  console.log(`\n✨ Обновлено заказов: ${updatedCount} из ${orders.length}`);
}

updateOrderStatuses()
  .then(() => {
    console.log('🎉 Скрипт завершен успешно');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ошибка при выполнении скрипта:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
