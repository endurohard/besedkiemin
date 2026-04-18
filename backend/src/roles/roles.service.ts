import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      where: {
        code: { not: 'SUPER_ADMIN' }, // Скрываем SUPER_ADMIN из списка
      },
      orderBy: { order: 'asc' },
      include: {
        workflowStages: {
          include: {
            workflowStage: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        workflowStages: {
          include: {
            workflowStage: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Роль с ID ${id} не найдена`);
    }

    return role;
  }

  async findByCode(code: string) {
    return this.prisma.role.findUnique({
      where: { code },
      include: {
        workflowStages: {
          include: {
            workflowStage: true,
          },
        },
      },
    });
  }

  async create(dto: CreateRoleDto) {
    // Проверяем уникальность name и code
    const existingByName = await this.prisma.role.findUnique({ where: { name: dto.name } });
    if (existingByName) {
      throw new ConflictException(`Роль с названием "${dto.name}" уже существует`);
    }

    const existingByCode = await this.prisma.role.findUnique({ where: { code: dto.code } });
    if (existingByCode) {
      throw new ConflictException(`Роль с кодом "${dto.code}" уже существует`);
    }

    const { workflowStageIds, ...roleData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          ...roleData,
          permissions: roleData.permissions || [],
          isSystem: false, // Пользовательские роли не системные
        },
      });

      // Связываем с этапами workflow
      if (workflowStageIds && workflowStageIds.length > 0) {
        await tx.roleWorkflowStage.createMany({
          data: workflowStageIds.map((stageId) => ({
            roleId: role.id,
            workflowStageId: stageId,
          })),
        });
      }

      return this.findOne(role.id);
    });
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.findOne(id);

    // Проверяем уникальность name
    if (dto.name && dto.name !== role.name) {
      const existingByName = await this.prisma.role.findUnique({ where: { name: dto.name } });
      if (existingByName) {
        throw new ConflictException(`Роль с названием "${dto.name}" уже существует`);
      }
    }

    // Проверяем уникальность code
    if (dto.code && dto.code !== role.code) {
      const existingByCode = await this.prisma.role.findUnique({ where: { code: dto.code } });
      if (existingByCode) {
        throw new ConflictException(`Роль с кодом "${dto.code}" уже существует`);
      }
    }

    // Системные роли нельзя изменять (кроме permissions и workflowStages)
    if (role.isSystem && (dto.name || dto.code)) {
      throw new BadRequestException('Нельзя изменять name и code системной роли');
    }

    const { workflowStageIds, ...roleData } = dto;

    return this.prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: roleData,
      });

      // Обновляем связи с этапами workflow
      if (workflowStageIds !== undefined) {
        // Удаляем старые связи
        await tx.roleWorkflowStage.deleteMany({
          where: { roleId: id },
        });

        // Создаём новые связи
        if (workflowStageIds.length > 0) {
          await tx.roleWorkflowStage.createMany({
            data: workflowStageIds.map((stageId) => ({
              roleId: id,
              workflowStageId: stageId,
            })),
          });
        }
      }

      return this.findOne(id);
    });
  }

  async remove(id: string) {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new BadRequestException('Нельзя удалить системную роль');
    }

    if (role._count.users > 0) {
      throw new BadRequestException(
        `Нельзя удалить роль, к которой привязаны пользователи (${role._count.users} чел.)`,
      );
    }

    await this.prisma.role.delete({ where: { id } });

    return { success: true };
  }

  // Получить все доступные разрешения
  getAllPermissions() {
    return [
      // Пользователи
      { code: 'users:view', name: 'Просмотр пользователей', group: 'Пользователи' },
      { code: 'users:create', name: 'Создание пользователей', group: 'Пользователи' },
      { code: 'users:edit', name: 'Редактирование пользователей', group: 'Пользователи' },
      { code: 'users:delete', name: 'Удаление пользователей', group: 'Пользователи' },

      // Заказы
      { code: 'orders:view', name: 'Просмотр заказов', group: 'Заказы' },
      { code: 'orders:create', name: 'Создание заказов', group: 'Заказы' },
      { code: 'orders:edit', name: 'Редактирование заказов', group: 'Заказы' },
      { code: 'orders:delete', name: 'Удаление заказов', group: 'Заказы' },

      // Канбан
      { code: 'kanban:view', name: 'Просмотр канбан-доски', group: 'Канбан' },

      // Аналитика
      { code: 'analytics:view', name: 'Просмотр аналитики', group: 'Аналитика' },

      // Склад
      { code: 'inventory:view', name: 'Просмотр склада', group: 'Склад' },
      { code: 'inventory:manage', name: 'Управление складом', group: 'Склад' },

      // Отгрузки
      { code: 'shipments:view', name: 'Просмотр отгрузок', group: 'Отгрузки' },
      { code: 'shipments:create', name: 'Создание отгрузок', group: 'Отгрузки' },

      // Задачи
      { code: 'tasks:view_own', name: 'Просмотр своих задач', group: 'Задачи' },
      { code: 'tasks:manage', name: 'Управление задачами', group: 'Задачи' },

      // Дефекты
      { code: 'defects:view', name: 'Просмотр дефектов', group: 'Дефекты' },
      { code: 'defects:manage', name: 'Управление дефектами', group: 'Дефекты' },

      // Качество
      { code: 'quality:manage', name: 'Контроль качества', group: 'Качество' },

      // Настройки
      { code: 'settings:view', name: 'Просмотр настроек', group: 'Настройки' },
      { code: 'settings:manage', name: 'Управление настройками', group: 'Настройки' },

      // Workflow
      { code: 'workflow:manage', name: 'Управление workflow', group: 'Workflow' },

      // Роли
      { code: 'roles:view', name: 'Просмотр ролей', group: 'Роли' },
      { code: 'roles:manage', name: 'Управление ролями', group: 'Роли' },

      // Чат
      { code: 'chat:view', name: 'Просмотр чатов', group: 'Чат' },
      { code: 'chat:manage', name: 'Управление чатами', group: 'Чат' },

      // Каталог
      { code: 'catalog:view', name: 'Просмотр каталога', group: 'Каталог' },
      { code: 'catalog:manage', name: 'Управление каталогом', group: 'Каталог' },

      // Номенклатура
      { code: 'nomenclature:view', name: 'Просмотр номенклатуры', group: 'Номенклатура' },
      { code: 'nomenclature:manage', name: 'Управление номенклатурой', group: 'Номенклатура' },
    ];
  }
}
