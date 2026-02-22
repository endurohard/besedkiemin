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
exports.WorkflowService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WorkflowService = class WorkflowService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.workflowStage.findMany({
            orderBy: {
                order: 'asc',
            },
        });
    }
    async findActive() {
        return this.prisma.workflowStage.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                order: 'asc',
            },
        });
    }
    async findOne(id) {
        const stage = await this.prisma.workflowStage.findUnique({
            where: { id },
        });
        if (!stage) {
            throw new common_1.NotFoundException('Этап workflow не найден');
        }
        return stage;
    }
    async create(createWorkflowStageDto) {
        const existingStage = await this.prisma.workflowStage.findFirst({
            where: { order: createWorkflowStageDto.order },
        });
        if (existingStage) {
            throw new common_1.ConflictException(`Порядковый номер ${createWorkflowStageDto.order} уже занят`);
        }
        return this.prisma.workflowStage.create({
            data: createWorkflowStageDto,
        });
    }
    async update(id, updateWorkflowStageDto) {
        await this.findOne(id);
        if (updateWorkflowStageDto.order !== undefined) {
            const existingStage = await this.prisma.workflowStage.findFirst({
                where: {
                    order: updateWorkflowStageDto.order,
                    id: { not: id },
                },
            });
            if (existingStage) {
                throw new common_1.ConflictException(`Порядковый номер ${updateWorkflowStageDto.order} уже занят`);
            }
        }
        return this.prisma.workflowStage.update({
            where: { id },
            data: updateWorkflowStageDto,
        });
    }
    async remove(id) {
        await this.findOne(id);
        const relatedTasks = await this.prisma.task.count({
            where: { workflowStageId: id },
        });
        const relatedHistory = await this.prisma.productHistory.count({
            where: { workflowStageId: id },
        });
        if (relatedTasks > 0 || relatedHistory > 0) {
            throw new common_1.BadRequestException('Нельзя удалить этап, так как с ним связаны задачи или история продуктов. Деактивируйте его вместо удаления.');
        }
        return this.prisma.workflowStage.delete({
            where: { id },
        });
    }
    async reorder(reorderWorkflowStagesDto) {
        const { stageIds } = reorderWorkflowStagesDto;
        const stages = await this.prisma.workflowStage.findMany({
            where: {
                id: { in: stageIds },
            },
        });
        if (stages.length !== stageIds.length) {
            throw new common_1.BadRequestException('Некоторые этапы не найдены');
        }
        await this.prisma.$transaction(async (tx) => {
            for (let i = 0; i < stageIds.length; i++) {
                await tx.workflowStage.update({
                    where: { id: stageIds[i] },
                    data: { order: -(i + 1) },
                });
            }
            for (let i = 0; i < stageIds.length; i++) {
                await tx.workflowStage.update({
                    where: { id: stageIds[i] },
                    data: { order: i + 1 },
                });
            }
        });
        return this.findActive();
    }
    async initializeDefaultWorkflow() {
        const existingStages = await this.prisma.workflowStage.count();
        if (existingStages > 0) {
            throw new common_1.BadRequestException('Workflow уже настроен');
        }
        const defaultStages = [
            {
                name: 'Заготовка',
                description: 'Подготовка материалов и заготовок',
                order: 1,
                legacyStage: 'PREPARATION',
            },
            {
                name: 'Сборка',
                description: 'Сборка изделий',
                order: 2,
                legacyStage: 'ASSEMBLY',
            },
            {
                name: 'Покраска',
                description: 'Покраска и финишная обработка',
                order: 3,
                legacyStage: 'PAINTING',
            },
            {
                name: 'Пошив',
                description: 'Пошив и обивка изделий',
                order: 4,
                legacyStage: 'SEWING',
            },
            {
                name: 'Склад',
                description: 'Проверка качества, упаковка и отгрузка',
                order: 5,
                legacyStage: 'QUALITY_CHECK',
            },
        ];
        for (const stage of defaultStages) {
            await this.prisma.workflowStage.create({ data: stage });
        }
        return this.findAll();
    }
    async getNextStage(currentStageId) {
        const currentStage = await this.findOne(currentStageId);
        return this.prisma.workflowStage.findFirst({
            where: {
                order: { gt: currentStage.order },
                isActive: true,
            },
            orderBy: {
                order: 'asc',
            },
        });
    }
    async getPreviousStage(currentStageId) {
        const currentStage = await this.findOne(currentStageId);
        return this.prisma.workflowStage.findFirst({
            where: {
                order: { lt: currentStage.order },
                isActive: true,
            },
            orderBy: {
                order: 'desc',
            },
        });
    }
};
exports.WorkflowService = WorkflowService;
exports.WorkflowService = WorkflowService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkflowService);
//# sourceMappingURL=workflow.service.js.map