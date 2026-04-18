"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RolesService = class RolesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.role.findMany({
            where: {
                code: { not: "SUPER_ADMIN" },
            },
            orderBy: { order: "asc" },
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
    async findOne(id) {
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
            throw new common_1.NotFoundException(`Роль с ID ${id} не найдена`);
        }
        return role;
    }
    async findByCode(code) {
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
    async create(dto) {
        const existingByName = await this.prisma.role.findUnique({
            where: { name: dto.name },
        });
        if (existingByName) {
            throw new common_1.ConflictException(`Роль с названием "${dto.name}" уже существует`);
        }
        const existingByCode = await this.prisma.role.findUnique({
            where: { code: dto.code },
        });
        if (existingByCode) {
            throw new common_1.ConflictException(`Роль с кодом "${dto.code}" уже существует`);
        }
        const { workflowStageIds, ...roleData } = dto;
        return this.prisma.$transaction(async (tx) => {
            const role = await tx.role.create({
                data: {
                    ...roleData,
                    permissions: roleData.permissions || [],
                    isSystem: false,
                },
            });
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
    async update(id, dto) {
        const role = await this.findOne(id);
        if (dto.name && dto.name !== role.name) {
            const existingByName = await this.prisma.role.findUnique({
                where: { name: dto.name },
            });
            if (existingByName) {
                throw new common_1.ConflictException(`Роль с названием "${dto.name}" уже существует`);
            }
        }
        if (dto.code && dto.code !== role.code) {
            const existingByCode = await this.prisma.role.findUnique({
                where: { code: dto.code },
            });
            if (existingByCode) {
                throw new common_1.ConflictException(`Роль с кодом "${dto.code}" уже существует`);
            }
        }
        if (role.isSystem && (dto.name || dto.code)) {
            throw new common_1.BadRequestException("Нельзя изменять name и code системной роли");
        }
        const { workflowStageIds, ...roleData } = dto;
        return this.prisma.$transaction(async (tx) => {
            await tx.role.update({
                where: { id },
                data: roleData,
            });
            if (workflowStageIds !== undefined) {
                await tx.roleWorkflowStage.deleteMany({
                    where: { roleId: id },
                });
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
    async remove(id) {
        const role = await this.findOne(id);
        if (role.isSystem) {
            throw new common_1.BadRequestException("Нельзя удалить системную роль");
        }
        if (role._count.users > 0) {
            throw new common_1.BadRequestException(`Нельзя удалить роль, к которой привязаны пользователи (${role._count.users} чел.)`);
        }
        await this.prisma.role.delete({ where: { id } });
        return { success: true };
    }
    getAllPermissions() {
        return [
            {
                code: "users:view",
                name: "Просмотр пользователей",
                group: "Пользователи",
            },
            {
                code: "users:create",
                name: "Создание пользователей",
                group: "Пользователи",
            },
            {
                code: "users:edit",
                name: "Редактирование пользователей",
                group: "Пользователи",
            },
            {
                code: "users:delete",
                name: "Удаление пользователей",
                group: "Пользователи",
            },
            { code: "orders:view", name: "Просмотр заказов", group: "Заказы" },
            { code: "orders:create", name: "Создание заказов", group: "Заказы" },
            { code: "orders:edit", name: "Редактирование заказов", group: "Заказы" },
            { code: "orders:delete", name: "Удаление заказов", group: "Заказы" },
            { code: "kanban:view", name: "Просмотр канбан-доски", group: "Канбан" },
            {
                code: "analytics:view",
                name: "Просмотр аналитики",
                group: "Аналитика",
            },
            { code: "inventory:view", name: "Просмотр склада", group: "Склад" },
            { code: "inventory:manage", name: "Управление складом", group: "Склад" },
            { code: "shipments:view", name: "Просмотр отгрузок", group: "Отгрузки" },
            {
                code: "shipments:create",
                name: "Создание отгрузок",
                group: "Отгрузки",
            },
            { code: "tasks:view_own", name: "Просмотр своих задач", group: "Задачи" },
            { code: "tasks:manage", name: "Управление задачами", group: "Задачи" },
            { code: "defects:view", name: "Просмотр дефектов", group: "Дефекты" },
            {
                code: "defects:manage",
                name: "Управление дефектами",
                group: "Дефекты",
            },
            { code: "quality:manage", name: "Контроль качества", group: "Качество" },
            { code: "settings:view", name: "Просмотр настроек", group: "Настройки" },
            {
                code: "settings:manage",
                name: "Управление настройками",
                group: "Настройки",
            },
            {
                code: "workflow:manage",
                name: "Управление workflow",
                group: "Workflow",
            },
            { code: "roles:view", name: "Просмотр ролей", group: "Роли" },
            { code: "roles:manage", name: "Управление ролями", group: "Роли" },
            { code: "chat:view", name: "Просмотр чатов", group: "Чат" },
            { code: "chat:manage", name: "Управление чатами", group: "Чат" },
            { code: "catalog:view", name: "Просмотр каталога", group: "Каталог" },
            {
                code: "catalog:manage",
                name: "Управление каталогом",
                group: "Каталог",
            },
            {
                code: "nomenclature:view",
                name: "Просмотр номенклатуры",
                group: "Номенклатура",
            },
            {
                code: "nomenclature:manage",
                name: "Управление номенклатурой",
                group: "Номенклатура",
            },
        ];
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map