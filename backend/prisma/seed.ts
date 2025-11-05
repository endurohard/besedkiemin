import { PrismaClient, UserRole, OrderStatus, ProductionStage, QualityStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // Создание типов продуктов
  const tableType = await prisma.productType.upsert({
    where: { name: 'Стол' },
    update: {},
    create: {
      name: 'Стол',
      description: 'Столы различных размеров',
    },
  });

  const chairType = await prisma.productType.upsert({
    where: { name: 'Стул' },
    update: {},
    create: {
      name: 'Стул',
      description: 'Стулья и табуреты',
    },
  });

  const armchairType = await prisma.productType.upsert({
    where: { name: 'Кресло' },
    update: {},
    create: {
      name: 'Кресло',
      description: 'Кресла для отдыха и работы',
    },
  });

  console.log('✅ Типы продуктов созданы');

  // Создание пользователей
  const hashedPassword = await bcrypt.hash('password123', 10);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      password: hashedPassword,
      firstName: 'Владелец',
      lastName: 'Главный',
      role: UserRole.OWNER,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      password: hashedPassword,
      firstName: 'Иван',
      lastName: 'Менеджер',
      role: UserRole.MANAGER,
    },
  });

  const designer = await prisma.user.upsert({
    where: { email: 'designer@example.com' },
    update: {},
    create: {
      email: 'designer@example.com',
      password: hashedPassword,
      firstName: 'Анна',
      lastName: 'Проектировщик',
      role: UserRole.DESIGNER,
    },
  });

  const preparer = await prisma.user.upsert({
    where: { email: 'preparer@example.com' },
    update: {},
    create: {
      email: 'preparer@example.com',
      password: hashedPassword,
      firstName: 'Сергей',
      lastName: 'Заготовщик',
      role: UserRole.PREPARER,
    },
  });

  const painter = await prisma.user.upsert({
    where: { email: 'painter@example.com' },
    update: {},
    create: {
      email: 'painter@example.com',
      password: hashedPassword,
      firstName: 'Мария',
      lastName: 'Маляр',
      role: UserRole.PAINTER,
    },
  });

  const warehouse = await prisma.user.upsert({
    where: { email: 'warehouse@example.com' },
    update: {},
    create: {
      email: 'warehouse@example.com',
      password: hashedPassword,
      firstName: 'Петр',
      lastName: 'Складист',
      role: UserRole.WAREHOUSE,
    },
  });

  console.log('✅ Пользователи созданы');

  // Создание заказов
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-001',
      customerName: 'Алексей Иванов',
      customerPhone: '+7 999 123-45-67',
      customerAddress: 'г. Москва, ул. Ленина, д. 10',
      status: OrderStatus.IN_PRODUCTION,
      description: 'Комплект мебели для столовой',
      createdById: manager.id,
      products: {
        create: [
          {
            name: 'Обеденный стол дубовый',
            productTypeId: tableType.id,
            description: 'Стол 180x90см из дуба',
            quantity: 1,
            stage: ProductionStage.PAINTING,
            history: {
              create: [
                {
                  stage: ProductionStage.DESIGN,
                  userId: designer.id,
                  startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                  completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                  notes: 'Проект одобрен клиентом',
                },
                {
                  stage: ProductionStage.PREPARATION,
                  userId: preparer.id,
                  startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                  completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                  notes: 'Заготовка выполнена',
                },
                {
                  stage: ProductionStage.PAINTING,
                  userId: painter.id,
                  startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                  notes: 'В процессе покраски',
                },
              ],
            },
          },
          {
            name: 'Стул дубовый',
            productTypeId: chairType.id,
            description: 'Стул из дуба с мягкой обивкой',
            quantity: 6,
            stage: ProductionStage.PREPARATION,
            history: {
              create: [
                {
                  stage: ProductionStage.DESIGN,
                  userId: designer.id,
                  startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                  completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                  notes: 'Проект готов',
                },
                {
                  stage: ProductionStage.PREPARATION,
                  userId: preparer.id,
                  startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                  notes: 'Работа в процессе',
                },
              ],
            },
          },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-002',
      customerName: 'Мария Петрова',
      customerPhone: '+7 999 234-56-78',
      status: OrderStatus.NEW,
      description: 'Кресла для офиса',
      createdById: manager.id,
      products: {
        create: [
          {
            name: 'Офисное кресло',
            productTypeId: armchairType.id,
            description: 'Кресло с высокой спинкой',
            quantity: 10,
            stage: ProductionStage.PENDING,
          },
        ],
      },
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-003',
      customerName: 'ООО "Интерьер"',
      customerPhone: '+7 999 345-67-89',
      status: OrderStatus.COMPLETED,
      description: 'Завершенный заказ',
      createdById: manager.id,
      products: {
        create: [
          {
            name: 'Журнальный столик',
            productTypeId: tableType.id,
            description: 'Столик 60x60см',
            quantity: 1,
            stage: ProductionStage.COMPLETED,
            history: {
              create: [
                {
                  stage: ProductionStage.DESIGN,
                  userId: designer.id,
                  startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
                },
                {
                  stage: ProductionStage.PREPARATION,
                  userId: preparer.id,
                  startedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
                  completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                },
                {
                  stage: ProductionStage.PAINTING,
                  userId: painter.id,
                  startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                  completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                },
                {
                  stage: ProductionStage.QUALITY_CHECK,
                  userId: warehouse.id,
                  startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                  completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                },
              ],
            },
            qualityChecks: {
              create: [
                {
                  status: QualityStatus.APPROVED,
                  notes: 'Качество отличное',
                  checkedById: warehouse.id,
                  checkedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('✅ Заказы созданы:', {
    order1: order1.orderNumber,
    order2: order2.orderNumber,
    order3: order3.orderNumber,
  });

  console.log('\n🎉 База данных успешно заполнена!');
  console.log('\n📧 Учетные данные для входа:');
  console.log('   Владелец: owner@example.com / password123');
  console.log('   Менеджер: manager@example.com / password123');
  console.log('   Проектировщик: designer@example.com / password123');
  console.log('   Заготовщик: preparer@example.com / password123');
  console.log('   Маляр: painter@example.com / password123');
  console.log('   Складист: warehouse@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
