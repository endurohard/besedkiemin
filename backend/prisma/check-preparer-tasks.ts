import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Проверка заготовщиков и их задач...\n');

  // Находим всех заготовщиков
  const preparers = await prisma.user.findMany({
    where: {
      role: 'PREPARER'
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true
    }
  });

  console.log(`👥 Найдено заготовщиков: ${preparers.length}`);
  preparers.forEach(p => {
    console.log(`   - ${p.firstName} ${p.lastName} (${p.email}) - ${p.isActive ? 'Активен' : 'Неактивен'}`);
  });

  console.log('\n📋 Задачи на стадии PREPARATION:');

  const preparationTasks = await prisma.task.findMany({
    where: {
      stage: 'PREPARATION'
    },
    include: {
      product: {
        include: {
          order: true
        }
      },
      assignedTo: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(`   Всего задач: ${preparationTasks.length}\n`);

  preparationTasks.forEach(task => {
    console.log(`   📦 ${task.title}`);
    console.log(`      ID: ${task.id}`);
    console.log(`      Статус: ${task.status}`);
    console.log(`      Продукт: ${task.product.name} (стадия: ${task.product.stage})`);
    console.log(`      Назначена: ${task.assignedTo.firstName} ${task.assignedTo.lastName}`);
    console.log(`      Создана: ${task.createdAt}`);
    console.log('');
  });

  // Проверим продукты на стадии PREPARATION
  console.log('\n🏭 Продукты на стадии PREPARATION:');
  const preparationProducts = await prisma.product.findMany({
    where: {
      stage: 'PREPARATION'
    },
    include: {
      order: true,
      productType: true
    }
  });

  console.log(`   Всего продуктов: ${preparationProducts.length}\n`);
  preparationProducts.forEach(p => {
    console.log(`   - ${p.name} (${p.productType?.name || 'N/A'})`);
    console.log(`     Заказ: ${p.order.orderNumber}`);
    console.log(`     Стадия: ${p.stage}`);
    console.log('');
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
