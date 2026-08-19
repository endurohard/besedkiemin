import { PrismaClient, OrderStatus, ProductionStage, QualityStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // =============================================
  // СОЗДАНИЕ СИСТЕМНЫХ РОЛЕЙ
  // =============================================

  const allPermissions = [
    'users:view', 'users:create', 'users:edit', 'users:delete',
    'orders:view', 'orders:create', 'orders:edit', 'orders:delete',
    'kanban:view',
    'analytics:view',
    'inventory:view', 'inventory:manage',
    'shipments:view', 'shipments:create',
    'tasks:view_own', 'tasks:manage',
    'defects:view', 'defects:manage',
    'quality:manage',
    'settings:view', 'settings:manage',
    'workflow:manage',
    'roles:view', 'roles:manage',
    'chat:view', 'chat:manage',
    'catalog:view', 'catalog:manage',
    'nomenclature:view', 'nomenclature:manage',
  ];

  const superAdminRole = await prisma.role.upsert({
    where: { code: 'SUPER_ADMIN' },
    update: {},
    create: {
      id: 'role-super-admin',
      name: 'Супер-администратор',
      code: 'SUPER_ADMIN',
      description: 'Полный доступ ко всем функциям системы',
      color: '#EF4444',
      isSystem: true,
      order: 0,
      permissions: allPermissions,
    },
  });

  const ownerRole = await prisma.role.upsert({
    where: { code: 'OWNER' },
    update: {},
    create: {
      id: 'role-owner',
      name: 'Владелец',
      code: 'OWNER',
      description: 'Владелец бизнеса с полным доступом',
      color: '#8B5CF6',
      isSystem: true,
      order: 1,
      permissions: allPermissions.filter(p => !p.includes('feature_flags')),
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { code: 'MANAGER' },
    update: {},
    create: {
      id: 'role-manager',
      name: 'Менеджер',
      code: 'MANAGER',
      description: 'Менеджер по работе с клиентами и заказами',
      color: '#3B82F6',
      isSystem: true,
      order: 2,
      permissions: [
        'orders:view', 'orders:create', 'orders:edit',
        'kanban:view',
        'chat:view', 'chat:manage',
        'tasks:view_own',
        'shipments:view', 'shipments:create',
        'inventory:view',
        'catalog:view', 'catalog:manage',
        'nomenclature:view', 'nomenclature:manage',
      ],
    },
  });

  const measurerRole = await prisma.role.upsert({
    where: { code: 'MEASURER' },
    update: {},
    create: {
      id: 'role-measurer',
      name: 'Замерщик',
      code: 'MEASURER',
      description: 'Выезжает на замеры перед производством',
      color: '#06B6D4',
      isSystem: true,
      order: 3,
      permissions: [
        'kanban:view',
        'orders:view',
        'tasks:view_own',
      ],
    },
  });

  const installerRole = await prisma.role.upsert({
    where: { code: 'INSTALLER' },
    update: {},
    create: {
      id: 'role-installer',
      name: 'Установщик',
      code: 'INSTALLER',
      description: 'Выезжает на монтаж/установку после отгрузки',
      color: '#F59E0B',
      isSystem: true,
      order: 3,
      permissions: [
        'kanban:view',
        'orders:view',
        'tasks:view_own',
      ],
    },
  });

  const designerRole = await prisma.role.upsert({
    where: { code: 'DESIGNER' },
    update: {},
    create: {
      id: 'role-designer',
      name: 'Проектировщик',
      code: 'DESIGNER',
      description: 'Проектировщик изделий',
      color: '#10B981',
      isSystem: true,
      order: 3,
      permissions: [
        'tasks:view_own',
        'kanban:view',
        'defects:view', 'defects:manage',
      ],
    },
  });

  const preparerRole = await prisma.role.upsert({
    where: { code: 'PREPARER' },
    update: {},
    create: {
      id: 'role-preparer',
      name: 'Заготовщик',
      code: 'PREPARER',
      description: 'Заготовщик материалов',
      color: '#F59E0B',
      isSystem: true,
      order: 4,
      permissions: [
        'tasks:view_own',
        'kanban:view',
        'defects:view', 'defects:manage',
      ],
    },
  });

  const painterRole = await prisma.role.upsert({
    where: { code: 'PAINTER' },
    update: {},
    create: {
      id: 'role-painter',
      name: 'Маляр',
      code: 'PAINTER',
      description: 'Маляр по покраске изделий',
      color: '#EC4899',
      isSystem: true,
      order: 5,
      permissions: [
        'tasks:view_own',
        'kanban:view',
        'defects:view', 'defects:manage',
      ],
    },
  });

  const sewerRole = await prisma.role.upsert({
    where: { code: 'SEWER' },
    update: {},
    create: {
      id: 'role-sewer',
      name: 'Швея',
      code: 'SEWER',
      description: 'Швея - пошив и обивка изделий',
      color: '#FB923C',
      isSystem: true,
      order: 6,
      permissions: [
        'tasks:view_own',
        'kanban:view',
        'defects:view', 'defects:manage',
      ],
    },
  });

  const assemblerRole = await prisma.role.upsert({
    where: { code: 'ASSEMBLER' },
    update: {},
    create: {
      id: 'role-assembler',
      name: 'Сборщик',
      code: 'ASSEMBLER',
      description: 'Сборщик изделий',
      color: '#14B8A6',
      isSystem: true,
      order: 7,
      permissions: [
        'tasks:view_own',
        'kanban:view',
        'defects:view', 'defects:manage',
      ],
    },
  });

  const warehouseRole = await prisma.role.upsert({
    where: { code: 'WAREHOUSE' },
    update: {},
    create: {
      id: 'role-warehouse',
      name: 'Складист',
      code: 'WAREHOUSE',
      description: 'Работник склада, контроль качества и отгрузки',
      color: '#6366F1',
      isSystem: true,
      order: 8,
      permissions: [
        'tasks:view_own',
        'kanban:view',
        'inventory:view', 'inventory:manage',
        'shipments:view', 'shipments:create',
        'quality:manage',
      ],
    },
  });

  console.log('✅ Системные роли созданы');

  // =============================================
  // СОЗДАНИЕ ТИПОВ ПРОДУКТОВ
  // =============================================

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
    update: { requiresSewing: true },
    create: {
      name: 'Кресло',
      description: 'Кресла для отдыха и работы',
      requiresSewing: true,
    },
  });

  console.log('✅ Типы продуктов созданы');

  // =============================================
  // СОЗДАНИЕ ЭТАПОВ WORKFLOW
  // =============================================

  const stage1 = await prisma.workflowStage.upsert({
    where: { order: 1 },
    update: {},
    create: {
      name: 'Заготовка',
      description: 'Подготовка материалов и заготовок',
      order: 1,
      legacyStage: ProductionStage.PREPARATION,
      isActive: true,
    },
  });

  const stage2 = await prisma.workflowStage.upsert({
    where: { order: 2 },
    update: {},
    create: {
      name: 'Покраска',
      description: 'Покраска и финишная обработка',
      order: 2,
      legacyStage: ProductionStage.PAINTING,
      isActive: true,
    },
  });

  const stage3 = await prisma.workflowStage.upsert({
    where: { order: 3 },
    update: {},
    create: {
      name: 'Пошив',
      description: 'Пошив и обивка изделий',
      order: 3,
      legacyStage: ProductionStage.SEWING,
      isActive: true,
    },
  });

  const stage4 = await prisma.workflowStage.upsert({
    where: { order: 4 },
    update: {},
    create: {
      name: 'Сборка',
      description: 'Сборка изделий',
      order: 4,
      legacyStage: ProductionStage.ASSEMBLY,
      isActive: true,
    },
  });

  const stage5 = await prisma.workflowStage.upsert({
    where: { order: 5 },
    update: {},
    create: {
      name: 'Склад',
      description: 'Проверка качества, упаковка и отгрузка',
      order: 5,
      legacyStage: ProductionStage.QUALITY_CHECK,
      isActive: true,
    },
  });

  console.log('✅ Этапы производственного цикла созданы');

  // =============================================
  // СВЯЗЬ РОЛЕЙ С ЭТАПАМИ WORKFLOW
  // =============================================

  // Заготовщик -> Заготовка
  await prisma.roleWorkflowStage.upsert({
    where: {
      roleId_workflowStageId: {
        roleId: preparerRole.id,
        workflowStageId: stage1.id,
      },
    },
    update: {},
    create: {
      roleId: preparerRole.id,
      workflowStageId: stage1.id,
    },
  });

  // Сборщик -> Сборка
  await prisma.roleWorkflowStage.upsert({
    where: {
      roleId_workflowStageId: {
        roleId: assemblerRole.id,
        workflowStageId: stage2.id,
      },
    },
    update: {},
    create: {
      roleId: assemblerRole.id,
      workflowStageId: stage2.id,
    },
  });

  // Маляр -> Покраска
  await prisma.roleWorkflowStage.upsert({
    where: {
      roleId_workflowStageId: {
        roleId: painterRole.id,
        workflowStageId: stage3.id,
      },
    },
    update: {},
    create: {
      roleId: painterRole.id,
      workflowStageId: stage3.id,
    },
  });

  // Швея -> Пошив
  await prisma.roleWorkflowStage.upsert({
    where: {
      roleId_workflowStageId: {
        roleId: sewerRole.id,
        workflowStageId: stage4.id,
      },
    },
    update: {},
    create: {
      roleId: sewerRole.id,
      workflowStageId: stage4.id,
    },
  });

  // Складист -> Склад
  await prisma.roleWorkflowStage.upsert({
    where: {
      roleId_workflowStageId: {
        roleId: warehouseRole.id,
        workflowStageId: stage5.id,
      },
    },
    update: {},
    create: {
      roleId: warehouseRole.id,
      workflowStageId: stage5.id,
    },
  });

  console.log('✅ Связи ролей с этапами созданы');

  // =============================================
  // СОЗДАНИЕ ПОЛЬЗОВАТЕЛЕЙ
  // =============================================

  const hashedPassword = await bcrypt.hash('password123', 10);

  // SUPER_ADMIN user
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Супер',
      lastName: 'Администратор',
      roleId: superAdminRole.id,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      password: hashedPassword,
      firstName: 'Владелец',
      lastName: 'Главный',
      roleId: ownerRole.id,
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
      roleId: managerRole.id,
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
      roleId: designerRole.id,
    },
  });

  const measurer = await prisma.user.upsert({
    where: { email: 'measurer@example.com' },
    update: {},
    create: {
      email: 'measurer@example.com',
      password: hashedPassword,
      firstName: 'Ахмед',
      lastName: 'Замерщик',
      roleId: measurerRole.id,
    },
  });

  const installer = await prisma.user.upsert({
    where: { email: 'installer@example.com' },
    update: {},
    create: {
      email: 'installer@example.com',
      password: hashedPassword,
      firstName: 'Руслан',
      lastName: 'Установщик',
      roleId: installerRole.id,
    },
  });

  // =============================================
  // УЧЁТНЫЕ ЗАПИСИ ОТДЕЛОВ (общий вход для цеха)
  // =============================================

  const preparerDept = await prisma.user.upsert({
    where: { email: 'preparer@example.com' },
    update: { isDepartmentAccount: true, firstName: 'Отдел', lastName: 'Заготовка' },
    create: {
      email: 'preparer@example.com',
      password: hashedPassword,
      firstName: 'Отдел',
      lastName: 'Заготовка',
      roleId: preparerRole.id,
      isDepartmentAccount: true,
    },
  });

  const painterDept = await prisma.user.upsert({
    where: { email: 'painter@example.com' },
    update: { isDepartmentAccount: true, firstName: 'Отдел', lastName: 'Малярка' },
    create: {
      email: 'painter@example.com',
      password: hashedPassword,
      firstName: 'Отдел',
      lastName: 'Малярка',
      roleId: painterRole.id,
      isDepartmentAccount: true,
    },
  });

  const sewerDept = await prisma.user.upsert({
    where: { email: 'sewer@example.com' },
    update: { isDepartmentAccount: true, firstName: 'Отдел', lastName: 'Пошив' },
    create: {
      email: 'sewer@example.com',
      password: hashedPassword,
      firstName: 'Отдел',
      lastName: 'Пошив',
      roleId: sewerRole.id,
      isDepartmentAccount: true,
    },
  });

  const assemblerDept = await prisma.user.upsert({
    where: { email: 'assembler@example.com' },
    update: { isDepartmentAccount: true, firstName: 'Отдел', lastName: 'Сборка' },
    create: {
      email: 'assembler@example.com',
      password: hashedPassword,
      firstName: 'Отдел',
      lastName: 'Сборка',
      roleId: assemblerRole.id,
      isDepartmentAccount: true,
    },
  });

  const warehouseDept = await prisma.user.upsert({
    where: { email: 'warehouse@example.com' },
    update: { isDepartmentAccount: true, firstName: 'Отдел', lastName: 'Склад' },
    create: {
      email: 'warehouse@example.com',
      password: hashedPassword,
      firstName: 'Отдел',
      lastName: 'Склад',
      roleId: warehouseRole.id,
      isDepartmentAccount: true,
    },
  });

  // =============================================
  // ИНДИВИДУАЛЬНЫЕ СОТРУДНИКИ ЦЕХА
  // =============================================

  const createWorker = async (
    email: string,
    firstName: string,
    lastName: string,
    roleId: string,
  ) =>
    prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        roleId,
        isDepartmentAccount: false,
      },
    });

  const preparer1 = await createWorker('111@mail.ru', 'Ариф', 'Махкомов', preparerRole.id);
  const preparer2 = await createWorker('112@mail.ru', 'Нариман', 'Гасанов', preparerRole.id);
  const preparer3 = await createWorker('113@mail.ru', 'Альберт', 'Алиев', preparerRole.id);

  const painter1 = await createWorker('117@mail.ru', 'Диля', 'Таирова', painterRole.id);
  const painter2 = await createWorker('124@mail.ru', 'Ханум', 'Алиева', painterRole.id);

  const sewer1 = await createWorker('123@mail.ru', 'Магомед', 'Магомедов', sewerRole.id);

  const assembler1 = await createWorker('118@mail.ru', 'Мурад', 'Алигаджиев', assemblerRole.id);
  const assembler2 = await createWorker('119@mail.ru', 'Хасбулла', 'Ибрагимов', assemblerRole.id);

  // Алиасы для обратной совместимости со сценариями ниже
  const preparer = preparer1;
  const painter = painter1;
  const sewer = sewer1;
  const assembler = assembler1;
  const warehouse = warehouseDept;

  console.log('✅ Пользователи созданы (отделы + сотрудники)');

  // =============================================
  // СОЗДАНИЕ ЗАКАЗОВ
  // =============================================

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

  // =============================================
  // СОЗДАНИЕ НАЧАЛЬНЫХ ЗАДАЧ НА ОТДЕЛЫ
  // Товар в стадии PAINTING/PREPARATION/... требует Task для отдела,
  // чтобы сотрудник, войдя под учёткой отдела, увидел работу и принял её.
  // =============================================

  const stageToDeptId: Record<string, string> = {
    [ProductionStage.PREPARATION]: preparerDept.id,
    [ProductionStage.PAINTING]: painterDept.id,
    [ProductionStage.SEWING]: sewerDept.id,
    [ProductionStage.ASSEMBLY]: assemblerDept.id,
    [ProductionStage.QUALITY_CHECK]: warehouseDept.id,
  };

  const stageLabels: Record<string, string> = {
    [ProductionStage.PREPARATION]: 'Заготовка',
    [ProductionStage.PAINTING]: 'Покраска',
    [ProductionStage.SEWING]: 'Пошив',
    [ProductionStage.ASSEMBLY]: 'Сборка',
    [ProductionStage.QUALITY_CHECK]: 'Приёмка',
  };

  const inProgressProducts = await prisma.product.findMany({
    where: {
      stage: {
        in: [
          ProductionStage.PREPARATION,
          ProductionStage.PAINTING,
          ProductionStage.SEWING,
          ProductionStage.ASSEMBLY,
          ProductionStage.QUALITY_CHECK,
        ],
      },
      tasks: { none: { status: { in: ['NEW', 'ACCEPTED'] } } },
    },
  });

  for (const product of inProgressProducts) {
    const deptId = stageToDeptId[product.stage];
    if (!deptId) continue;
    await prisma.task.create({
      data: {
        productId: product.id,
        stage: product.stage,
        status: 'NEW',
        assignedToId: deptId,
        title: `${stageLabels[product.stage] ?? product.stage}: ${product.name}`,
        quantity: product.quantity,
      },
    });
  }

  console.log(`✅ Задачи для отделов созданы: ${inProgressProducts.length}`);

  // =============================================
  // СОЗДАНИЕ КАТЕГОРИЙ КАТАЛОГА
  // =============================================

  const besedkiCategory = await prisma.catalogCategory.upsert({
    where: { slug: 'besedki' },
    update: {},
    create: {
      name: 'Беседки',
      slug: 'besedki',
      description: 'Красивые и прочные беседки для вашего участка',
      order: 1,
      isActive: true,
    },
  });

  const arkiCategory = await prisma.catalogCategory.upsert({
    where: { slug: 'arki-i-navesy' },
    update: {},
    create: {
      name: 'Арки и навесы',
      slug: 'arki-i-navesy',
      description: 'Арки, перголы и навесы для сада',
      order: 2,
      isActive: true,
    },
  });

  const kacheliCategory = await prisma.catalogCategory.upsert({
    where: { slug: 'kacheli' },
    update: {},
    create: {
      name: 'Качели',
      slug: 'kacheli',
      description: 'Парковые качели для отдыха',
      order: 3,
      isActive: true,
    },
  });

  const mebelCategory = await prisma.catalogCategory.upsert({
    where: { slug: 'mebel' },
    update: {},
    create: {
      name: 'Мебель',
      slug: 'mebel',
      description: 'Садовая мебель для дома и террас',
      order: 4,
      isActive: true,
    },
  });

  const vazonyCategory = await prisma.catalogCategory.upsert({
    where: { slug: 'vazony' },
    update: {},
    create: {
      name: 'Вазоны',
      slug: 'vazony',
      description: 'Декоративные вазоны и цветочницы',
      order: 5,
      isActive: true,
    },
  });

  console.log('✅ Категории каталога созданы');

  // =============================================
  // СОЗДАНИЕ ТОВАРОВ КАТАЛОГА
  // =============================================

  await prisma.catalogProduct.upsert({
    where: { slug: 'besedka-vosmigrannik' },
    update: {},
    create: {
      name: 'Беседка восьмигранник',
      slug: 'besedka-vosmigrannik',
      description: 'Классическая восьмигранная беседка из натурального дерева. Размер 3.5x3.5 м.',
      price: 285000,
      categoryId: besedkiCategory.id,
      images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],
      isActive: true,
      isFeatured: true,
      order: 1,
    },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'besedka-standartnaya' },
    update: {},
    create: {
      name: 'Беседка стандартная',
      slug: 'besedka-standartnaya',
      description: 'Просторная беседка для семейного отдыха. Размер 3x4 м.',
      price: 195000,
      categoryId: besedkiCategory.id,
      images: ['https://images.unsplash.com/photo-1600607686527-6fb886090705?w=800'],
      isActive: true,
      order: 2,
    },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'besedka-s-mangalnoy-zonoy' },
    update: {},
    create: {
      name: 'Беседка с мангальной зоной',
      slug: 'besedka-s-mangalnoy-zonoy',
      description: 'Беседка с встроенной зоной для приготовления шашлыка. Размер 4x5 м.',
      price: 345000,
      categoryId: besedkiCategory.id,
      images: ['https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=800'],
      isActive: true,
      isFeatured: true,
      order: 3,
    },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'arka-sadovaya' },
    update: {},
    create: {
      name: 'Арка садовая',
      slug: 'arka-sadovaya',
      description: 'Декоративная арка для сада из массива дерева. Размер 2.5x1.2 м.',
      price: 35000,
      categoryId: arkiCategory.id,
      images: ['https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800'],
      isActive: true,
      order: 1,
    },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'pergola' },
    update: {},
    create: {
      name: 'Пергола',
      slug: 'pergola',
      description: 'Элегантная пергола для создания тени. Размер 3x3 м.',
      price: 125000,
      categoryId: arkiCategory.id,
      images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800'],
      isActive: true,
      order: 2,
    },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'naves-dlya-avtomobilya' },
    update: {},
    create: {
      name: 'Навес для автомобиля',
      slug: 'naves-dlya-avtomobilya',
      description: 'Прочный деревянный навес для машины. Размер 6x3 м.',
      price: 185000,
      categoryId: arkiCategory.id,
      images: ['https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800'],
      isActive: true,
      order: 3,
    },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'kachelya-lavochka' },
    update: {},
    create: {
      name: 'Качеля-лавочка',
      slug: 'kachelya-lavochka',
      description: 'Удобные парковые качели на 3 человека. Размер 2x1.5 м.',
      price: 45000,
      categoryId: kacheliCategory.id,
      images: ['https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800'],
      isActive: true,
      isFeatured: true,
      order: 1,
    },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'tahta-sadovaya' },
    update: {},
    create: {
      name: 'Тахта садовая',
      slug: 'tahta-sadovaya',
      description: 'Удобная тахта для отдыха на свежем воздухе. Размер 180x80 см.',
      price: 28500,
      categoryId: mebelCategory.id,
      images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'],
      isActive: true,
      order: 1,
    },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'kreslo-kachalka-lord' },
    update: {},
    create: {
      name: 'Кресло-качалка Лорд',
      slug: 'kreslo-kachalka-lord',
      description: 'Классическое кресло-качалка из массива. Размер 70x90 см.',
      price: 18500,
      categoryId: mebelCategory.id,
      images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'],
      isActive: true,
      order: 2,
    },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'stol-kafelnyy' },
    update: {},
    create: {
      name: 'Стол кафельный',
      slug: 'stol-kafelnyy',
      description: 'Прочный стол с керамической плиткой. Размер 120x80 см.',
      price: 22000,
      categoryId: mebelCategory.id,
      images: ['https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800'],
      isActive: true,
      order: 3,
    },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'lezhak-parkovyy' },
    update: {},
    create: {
      name: 'Лежак парковый',
      slug: 'lezhak-parkovyy',
      description: 'Комфортный лежак для отдыха у бассейна. Размер 180x60 см.',
      price: 15900,
      categoryId: mebelCategory.id,
      images: ['https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800'],
      isActive: true,
      order: 4,
    },
  });

  await prisma.catalogProduct.upsert({
    where: { slug: 'vazon-sadovyy' },
    update: {},
    create: {
      name: 'Вазон садовый',
      slug: 'vazon-sadovyy',
      description: 'Декоративный вазон для цветов из дерева. Размер 50x50 см.',
      price: 8500,
      categoryId: vazonyCategory.id,
      images: ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800'],
      isActive: true,
      order: 1,
    },
  });

  console.log('✅ Товары каталога созданы');

  console.log('\n🎉 База данных успешно заполнена!');
  console.log('\n📧 Учетные данные для входа:');
  console.log('   Супер-админ: admin@example.com / password123');
  console.log('   Владелец:    owner@example.com / password123');
  console.log('   Менеджер:    manager@example.com / password123');
  console.log('   Проектировщик: designer@example.com / password123');
  console.log('\n🏭 Учётные записи отделов (общий вход цеха):');
  console.log('   Заготовка: preparer@example.com / password123');
  console.log('   Малярка:   painter@example.com / password123');
  console.log('   Пошив:     sewer@example.com / password123');
  console.log('   Сборка:    assembler@example.com / password123');
  console.log('   Склад:     warehouse@example.com / password123');
  console.log('\n👷 Индивидуальные сотрудники (пароль: password123):');
  console.log('   Заготовка: 111@mail.ru, 112@mail.ru, 113@mail.ru');
  console.log('   Малярка:   117@mail.ru, 124@mail.ru');
  console.log('   Пошив:     123@mail.ru');
  console.log('   Сборка:    118@mail.ru, 119@mail.ru');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
