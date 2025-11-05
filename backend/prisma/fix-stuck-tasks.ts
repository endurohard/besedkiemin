import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Исправление застрявших задач...\n');

  // Находим все задачи PREPARATION, где продукт еще на DESIGN
  const stuckTasks = await prisma.task.findMany({
    where: {
      stage: 'PREPARATION',
      status: 'NEW',
      product: {
        stage: 'DESIGN'
      }
    },
    include: {
      product: true
    }
  });

  console.log(`📦 Найдено застрявших задач: ${stuckTasks.length}\n`);

  for (const task of stuckTasks) {
    console.log(`   Исправляем задачу: ${task.title}`);
    console.log(`   Продукт: ${task.product.name}`);
    console.log(`   Старая стадия продукта: ${task.product.stage}`);

    // Обновляем стадию продукта на PREPARATION
    await prisma.product.update({
      where: { id: task.productId },
      data: {
        stage: 'PREPARATION'
      }
    });

    console.log(`   ✅ Новая стадия продукта: PREPARATION\n`);
  }

  console.log('✨ Готово! Теперь заготовщики увидят свои задачи.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
