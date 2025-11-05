import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Проверка задач и пользователей...\n');

  // Проверяем пользователей
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
    orderBy: {
      role: 'asc',
    },
  });

  console.log('👥 Пользователи:');
  users.forEach((user) => {
    console.log(`  - ${user.email} (${user.role}) - ${user.isActive ? '✅ Активен' : '❌ Неактивен'}`);
  });

  // Проверяем задачи
  const tasks = await prisma.task.findMany({
    include: {
      product: {
        select: {
          name: true,
          stage: true,
        },
      },
      assignedTo: {
        select: {
          firstName: true,
          lastName: true,
          role: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`\n📋 Всего задач: ${tasks.length}\n`);

  if (tasks.length === 0) {
    console.log('❌ Нет задач в базе данных!');
    console.log('💡 Создайте заказ с продуктом через интерфейс для создания задач.\n');
  } else {
    console.log('Задачи по ролям:');
    const tasksByRole = tasks.reduce((acc, task) => {
      const role = task.assignedTo.role;
      if (!acc[role]) acc[role] = [];
      acc[role].push(task);
      return acc;
    }, {} as Record<string, typeof tasks>);

    Object.entries(tasksByRole).forEach(([role, roleTasks]) => {
      console.log(`\n  ${role} (${roleTasks.length} задач):`);
      roleTasks.forEach((task) => {
        console.log(`    - ${task.title}`);
        console.log(`      Статус: ${task.status} | Стадия: ${task.stage}`);
        console.log(`      Назначено: ${task.assignedTo.email}`);
        console.log(`      Продукт: ${task.product.name} (стадия: ${task.product.stage})`);
      });
    });
  }

  // Проверяем продукты
  const products = await prisma.product.findMany({
    include: {
      order: {
        select: {
          orderNumber: true,
          customerName: true,
        },
      },
      productType: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log(`\n📦 Всего продуктов: ${products.length}\n`);

  if (products.length === 0) {
    console.log('❌ Нет продуктов в базе данных!');
    console.log('💡 Создайте заказ с продуктом через интерфейс.\n');
  } else {
    console.log('Продукты по стадиям:');
    const productsByStage = products.reduce((acc, product) => {
      if (!acc[product.stage]) acc[product.stage] = [];
      acc[product.stage].push(product);
      return acc;
    }, {} as Record<string, typeof products>);

    Object.entries(productsByStage).forEach(([stage, stageProducts]) => {
      console.log(`\n  ${stage} (${stageProducts.length} продуктов):`);
      stageProducts.forEach((product) => {
        console.log(`    - ${product.name} (${product.productType?.name || 'Нет типа'})`);
        console.log(`      Заказ: ${product.order.orderNumber} - ${product.order.customerName}`);
      });
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
