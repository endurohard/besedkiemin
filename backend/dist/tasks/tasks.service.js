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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const telegram_service_1 = require("../telegram/telegram.service");
const client_1 = require("@prisma/client");
let TasksService = class TasksService {
    constructor(prisma, telegramService) {
        this.prisma = prisma;
        this.telegramService = telegramService;
    }
    async getMyTasks(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        const stageMapping = {
            [client_1.UserRole.DESIGNER]: client_1.ProductionStage.DESIGN,
            [client_1.UserRole.PREPARER]: client_1.ProductionStage.PREPARATION,
            [client_1.UserRole.PAINTER]: client_1.ProductionStage.PAINTING,
            [client_1.UserRole.WAREHOUSE]: client_1.ProductionStage.QUALITY_CHECK,
        };
        const stage = stageMapping[user.role];
        if (!stage) {
            if (user.role === client_1.UserRole.MANAGER) {
                return [];
            }
            return this.prisma.task.findMany({
                include: {
                    product: {
                        include: {
                            productType: true,
                            order: {
                                select: {
                                    id: true,
                                    orderNumber: true,
                                    customerName: true,
                                    priority: true,
                                },
                            },
                        },
                    },
                    assignedTo: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                        },
                    },
                },
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'desc' },
                ],
            });
        }
        const tasks = await this.prisma.task.findMany({
            where: {
                assignedToId: userId,
                stage: stage,
            },
            include: {
                product: {
                    include: {
                        productType: true,
                        order: {
                            select: {
                                id: true,
                                orderNumber: true,
                                customerName: true,
                                customerPhone: true,
                                customerAddress: true,
                                status: true,
                                priority: true,
                                description: true,
                                createdById: true,
                                createdAt: true,
                                updatedAt: true,
                            },
                        },
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' },
            ],
        });
        return tasks.filter(task => task.product.stage === task.stage);
    }
    async acceptTask(taskId, userId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: { product: true },
        });
        if (!task) {
            throw new common_1.NotFoundException('Задача не найдена');
        }
        if (task.assignedToId !== userId) {
            throw new common_1.ForbiddenException('Вы не можете принять эту задачу');
        }
        if (task.status !== client_1.TaskStatus.NEW) {
            throw new common_1.BadRequestException('Задача уже принята или завершена');
        }
        await this.prisma.task.deleteMany({
            where: {
                productId: task.productId,
                stage: task.stage,
                status: client_1.TaskStatus.NEW,
                id: { not: taskId },
            },
        });
        return this.prisma.task.update({
            where: { id: taskId },
            data: {
                status: client_1.TaskStatus.ACCEPTED,
                acceptedAt: new Date(),
            },
            include: {
                product: {
                    include: {
                        productType: true,
                        order: true,
                    },
                },
            },
        });
    }
    async completeTask(taskId, userId, notes, quantity) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: { product: true },
        });
        if (!task) {
            throw new common_1.NotFoundException('Задача не найдена');
        }
        if (task.assignedToId !== userId) {
            throw new common_1.ForbiddenException('Вы не можете завершить эту задачу');
        }
        if (task.status !== client_1.TaskStatus.ACCEPTED) {
            throw new common_1.BadRequestException('Задача должна быть сначала принята в работу');
        }
        const completedQuantity = quantity || task.quantity;
        const remainingQuantity = task.quantity - completedQuantity;
        if (remainingQuantity > 0) {
            await this.prisma.task.create({
                data: {
                    title: task.title,
                    description: task.description,
                    stage: task.stage,
                    productId: task.productId,
                    assignedToId: task.assignedToId,
                    quantity: remainingQuantity,
                    priority: task.priority,
                    status: client_1.TaskStatus.NEW,
                },
            });
        }
        return this.prisma.task.update({
            where: { id: taskId },
            data: {
                status: client_1.TaskStatus.COMPLETED,
                completedAt: new Date(),
                notes,
                quantity: completedQuantity,
            },
            include: {
                product: {
                    include: {
                        productType: true,
                        order: true,
                    },
                },
            },
        });
    }
    async passTask(taskId, userId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: { product: true },
        });
        if (!task) {
            throw new common_1.NotFoundException('Задача не найдена');
        }
        if (task.assignedToId !== userId) {
            throw new common_1.ForbiddenException('Вы не можете передать эту задачу');
        }
        if (task.status !== client_1.TaskStatus.COMPLETED) {
            throw new common_1.BadRequestException('Задача должна быть сначала завершена');
        }
        const currentWorkflowStage = await this.prisma.workflowStage.findFirst({
            where: {
                legacyStage: task.stage,
                isActive: true,
            },
        });
        if (!currentWorkflowStage) {
            throw new common_1.BadRequestException('Текущая стадия workflow не найдена');
        }
        const nextWorkflowStage = await this.prisma.workflowStage.findFirst({
            where: {
                order: currentWorkflowStage.order + 1,
                isActive: true,
            },
        });
        if (!nextWorkflowStage) {
            throw new common_1.BadRequestException('Следующая стадия workflow не найдена');
        }
        const completedQuantity = task.quantity || task.product.quantity;
        const updatedTask = await this.prisma.task.update({
            where: { id: taskId },
            data: {
                status: client_1.TaskStatus.PASSED,
                passedAt: new Date(),
            },
        });
        await this.prisma.productHistory.create({
            data: {
                productId: task.productId,
                userId: userId,
                stage: task.stage,
                status: client_1.TaskStatus.PASSED,
                completedAt: new Date(),
                passedAt: new Date(),
            },
        });
        await this.prisma.product.update({
            where: { id: task.productId },
            data: {
                stage: nextWorkflowStage.legacyStage,
            },
        });
        await this.updateOrderStatus(task.product.orderId);
        const nextWorkers = await this.prisma.user.findMany({
            where: {
                role: nextWorkflowStage.role,
                isActive: true,
            },
        });
        for (const worker of nextWorkers) {
            const newTask = await this.prisma.task.create({
                data: {
                    title: `${task.product.name} - ${nextWorkflowStage.name}`,
                    description: `Количество: ${completedQuantity} шт.`,
                    stage: nextWorkflowStage.legacyStage,
                    productId: task.productId,
                    assignedToId: worker.id,
                    quantity: completedQuantity,
                },
                include: {
                    product: {
                        include: {
                            productType: true,
                            order: true,
                        },
                    },
                },
            });
            if (worker.telegramId) {
                const message = `🆕 *НОВАЯ ЗАДАЧА*\n\n` +
                    `*Продукт:* ${newTask.product.name}\n` +
                    `*Тип:* ${newTask.product.productType?.name || 'Н/Д'}\n` +
                    `*Количество:* ${completedQuantity} шт.\n` +
                    `*Стадия:* ${nextWorkflowStage.name}\n` +
                    `*Заказ:* ${newTask.product.order?.orderNumber || 'Н/Д'}\n` +
                    `*Клиент:* ${newTask.product.order?.customerName || 'Н/Д'}\n\n` +
                    `✅ Откройте раздел "Мои задачи" для выполнения`;
                try {
                    await this.telegramService.sendMessage(worker.telegramId, message);
                    console.log(`📲 Уведомление отправлено работнику ${worker.email} (${worker.role})`);
                }
                catch (error) {
                    console.error(`❌ Ошибка отправки уведомления работнику ${worker.email}:`, error);
                }
            }
        }
        return updatedTask;
    }
    async rejectTask(taskId, userId, notes, quantity, defectPhotoUrl, requestPhoto, returnToStage) {
        console.log('🚨 rejectTask called:', { taskId, userId, notes, quantity, defectPhotoUrl, requestPhoto, returnToStage });
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        console.log('👤 User found:', user ? `${user.email} (${user.role})` : 'NOT FOUND');
        if (!user || user.role !== client_1.UserRole.WAREHOUSE) {
            console.error('❌ User is not warehouse');
            throw new common_1.ForbiddenException('Только складист может браковать товар');
        }
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: {
                product: {
                    include: {
                        productType: true,
                        order: true,
                    }
                }
            },
        });
        console.log('📋 Task found:', task ? `${task.title} (status: ${task.status}, stage: ${task.stage})` : 'NOT FOUND');
        if (!task) {
            console.error('❌ Task not found');
            throw new common_1.NotFoundException('Задача не найдена');
        }
        if (task.assignedToId !== userId) {
            console.error('❌ Task not assigned to user');
            throw new common_1.ForbiddenException('Вы не можете забраковать эту задачу');
        }
        if (task.stage !== client_1.ProductionStage.QUALITY_CHECK) {
            console.error('❌ Task is not at QUALITY_CHECK stage:', task.stage);
            throw new common_1.BadRequestException('Браковать можно только на стадии проверки качества');
        }
        console.log('✅ All validations passed, proceeding with rejection...');
        const availableQuantity = task.quantity - task.quantityProcessed;
        const rejectQuantity = quantity || availableQuantity;
        if (rejectQuantity > availableQuantity) {
            throw new common_1.BadRequestException(`Нельзя забраковать ${rejectQuantity} шт. Доступно только ${availableQuantity} шт.`);
        }
        console.log(`🔢 Rejecting ${rejectQuantity} out of ${availableQuantity} available (total: ${task.quantity})`);
        const newQuantityProcessed = task.quantityProcessed + rejectQuantity;
        const isFullyProcessed = newQuantityProcessed >= task.quantity;
        const updatedTask = await this.prisma.task.update({
            where: { id: taskId },
            data: {
                status: isFullyProcessed ? client_1.TaskStatus.REJECTED : task.status,
                rejectedAt: isFullyProcessed ? new Date() : task.rejectedAt,
                notes,
                quantityProcessed: newQuantityProcessed,
            },
        });
        if (rejectQuantity < task.product.quantity) {
            await this.prisma.product.create({
                data: {
                    name: `${task.product.name} (БРАК ${rejectQuantity} шт.)`,
                    productTypeId: task.product.productTypeId,
                    quantity: rejectQuantity,
                    stage: client_1.ProductionStage.PAINTING,
                    orderId: task.product.orderId,
                    dimensions: task.product.dimensions,
                    schemaImageUrl: task.product.schemaImageUrl,
                    deadline: task.product.deadline,
                },
            });
        }
        else {
            await this.prisma.product.update({
                where: { id: task.productId },
                data: {
                    stage: client_1.ProductionStage.PAINTING,
                },
            });
        }
        await this.updateOrderStatus(task.product.orderId);
        await this.prisma.qualityCheck.create({
            data: {
                productId: task.productId,
                checkedById: userId,
                status: 'REJECTED',
                notes,
                checkedAt: new Date(),
            },
        });
        if (requestPhoto && user.telegramId) {
            console.log(`📸 Requesting ${rejectQuantity} defect photos from warehouse ${user.email} via Telegram...`);
            const photoRequested = await this.telegramService.requestDefectPhoto(userId, taskId, notes, rejectQuantity);
            if (photoRequested) {
                console.log(`✅ Photo request sent to warehouse ${user.email}`);
            }
            else {
                console.log(`⚠️ Failed to request photo from warehouse ${user.email}`);
            }
        }
        let targetRole = client_1.UserRole.PAINTER;
        let targetStageName = 'Покраска';
        if (returnToStage) {
            switch (returnToStage) {
                case client_1.ProductionStage.PENDING:
                    targetRole = client_1.UserRole.MANAGER;
                    targetStageName = 'Менеджер';
                    break;
                case client_1.ProductionStage.DESIGN:
                    targetRole = client_1.UserRole.DESIGNER;
                    targetStageName = 'Проектирование';
                    break;
                case client_1.ProductionStage.PREPARATION:
                    targetRole = client_1.UserRole.PREPARER;
                    targetStageName = 'Заготовка';
                    break;
                case client_1.ProductionStage.PAINTING:
                    targetRole = client_1.UserRole.PAINTER;
                    targetStageName = 'Покраска';
                    break;
                default:
                    targetRole = client_1.UserRole.PAINTER;
                    targetStageName = 'Покраска';
            }
        }
        const targetWorkers = await this.prisma.user.findMany({
            where: {
                role: targetRole,
                isActive: true,
            },
        });
        if (targetWorkers.length > 0 && rejectQuantity > 0) {
            for (const worker of targetWorkers) {
                if (worker.telegramId) {
                    const message = `🚨 *НОВЫЙ БРАК В СИСТЕМЕ*\n\n` +
                        `*Продукт:* ${task.product.name}\n` +
                        `*Тип:* ${task.product.productType?.name || 'Н/Д'}\n` +
                        `*Заказ:* ${task.product.order?.orderNumber || 'Н/Д'}\n\n` +
                        `*Причина брака:*\n${notes}\n\n` +
                        `*Забраковал:* ${user.firstName} ${user.lastName}\n` +
                        `*Количество брака:* ${rejectQuantity} шт.\n` +
                        `*Вернуть на стадию:* ${targetStageName}\n\n` +
                        `⚠️ Откройте раздел "Брак" в системе чтобы принять на доработку`;
                    await this.telegramService.sendMessage(worker.telegramId, message);
                }
            }
        }
        console.log('✅ Task rejected successfully');
        return updatedTask;
    }
    async approveTask(taskId, userId, quantity) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || user.role !== client_1.UserRole.WAREHOUSE) {
            throw new common_1.ForbiddenException('Только складист может принять товар');
        }
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: {
                product: {
                    include: {
                        productType: true,
                        order: true,
                    }
                }
            },
        });
        if (!task) {
            throw new common_1.NotFoundException('Задача не найдена');
        }
        if (task.assignedToId !== userId) {
            throw new common_1.ForbiddenException('Вы не можете принять эту задачу');
        }
        if (task.stage !== client_1.ProductionStage.QUALITY_CHECK) {
            throw new common_1.BadRequestException('Принять можно только на стадии проверки качества');
        }
        const updatedTask = await this.prisma.task.update({
            where: { id: taskId },
            data: {
                status: client_1.TaskStatus.PASSED,
                completedAt: new Date(),
                passedAt: new Date(),
                quantity,
            },
        });
        await this.prisma.product.update({
            where: { id: task.productId },
            data: {
                stage: client_1.ProductionStage.COMPLETED,
                quantity,
            },
        });
        await this.prisma.qualityCheck.create({
            data: {
                productId: task.productId,
                checkedById: userId,
                status: 'APPROVED',
                checkedAt: new Date(),
            },
        });
        const existingInventory = await this.prisma.inventoryItem.findFirst({
            where: {
                productId: task.productId,
            },
        });
        if (existingInventory) {
            await this.prisma.inventoryItem.update({
                where: { id: existingInventory.id },
                data: {
                    quantity: existingInventory.quantity + quantity,
                },
            });
        }
        else {
            await this.prisma.inventoryItem.create({
                data: {
                    name: task.product.name,
                    quantity,
                    productId: task.productId,
                    productTypeId: task.product.productTypeId,
                    orderId: task.product.orderId,
                    notes: `Принято на склад из заказа ${task.product.order.orderNumber}`,
                },
            });
        }
        await this.updateOrderStatus(task.product.orderId);
        return updatedTask;
    }
    async updateOrderStatus(orderId) {
        const products = await this.prisma.product.findMany({
            where: { orderId },
        });
        const allCompleted = products.every((p) => p.stage === client_1.ProductionStage.COMPLETED);
        const hasStarted = products.some((p) => p.stage !== client_1.ProductionStage.PENDING);
        let newStatus = null;
        if (allCompleted && products.length > 0) {
            newStatus = 'COMPLETED';
        }
        else if (hasStarted) {
            newStatus = 'IN_PRODUCTION';
        }
        if (newStatus) {
            await this.prisma.order.update({
                where: { id: orderId },
                data: { status: newStatus },
            });
        }
    }
    async getDefectsWithPhotos(userId) {
        let user = null;
        if (userId) {
            user = await this.prisma.user.findUnique({ where: { id: userId } });
        }
        const rejectedTasks = await this.prisma.task.findMany({
            where: {
                status: client_1.TaskStatus.REJECTED,
            },
            include: {
                product: {
                    include: {
                        productType: true,
                        order: true,
                    },
                },
                assignedTo: true,
            },
            orderBy: {
                rejectedAt: 'desc',
            },
        });
        const defects = await Promise.all(rejectedTasks.map(async (task) => {
            const qualityCheck = await this.prisma.qualityCheck.findFirst({
                where: {
                    productId: task.productId,
                    status: 'REJECTED',
                },
                include: {
                    checkedBy: true,
                    product: {
                        include: {
                            productType: true,
                            order: true,
                        },
                    },
                },
                orderBy: {
                    checkedAt: 'desc',
                },
            });
            return {
                ...qualityCheck,
                defectPhotos: task.defectPhotos,
            };
        }));
        let filteredDefects = defects.filter((d) => d.id);
        if (user && (user.role === client_1.UserRole.OWNER || user.role === client_1.UserRole.MANAGER)) {
            return filteredDefects;
        }
        if (user) {
            let userStage = null;
            switch (user.role) {
                case client_1.UserRole.DESIGNER:
                    userStage = client_1.ProductionStage.DESIGN;
                    break;
                case client_1.UserRole.PREPARER:
                    userStage = client_1.ProductionStage.PREPARATION;
                    break;
                case client_1.UserRole.PAINTER:
                    userStage = client_1.ProductionStage.PAINTING;
                    break;
                case client_1.UserRole.WAREHOUSE:
                    userStage = client_1.ProductionStage.QUALITY_CHECK;
                    break;
                default:
                    userStage = client_1.ProductionStage.PENDING;
            }
            filteredDefects = filteredDefects.filter((d) => d.product?.stage === userStage);
        }
        return filteredDefects;
    }
    async acceptDefectRework(productId, userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.ForbiddenException('Пользователь не найден');
        }
        let userStage;
        let stageName;
        switch (user.role) {
            case client_1.UserRole.MANAGER:
                userStage = client_1.ProductionStage.PENDING;
                stageName = 'ПРОВЕРКА (МЕНЕДЖЕР)';
                break;
            case client_1.UserRole.DESIGNER:
                userStage = client_1.ProductionStage.DESIGN;
                stageName = 'ПРОЕКТИРОВАНИЕ';
                break;
            case client_1.UserRole.PREPARER:
                userStage = client_1.ProductionStage.PREPARATION;
                stageName = 'ЗАГОТОВКА';
                break;
            case client_1.UserRole.PAINTER:
                userStage = client_1.ProductionStage.PAINTING;
                stageName = 'ПОКРАСКА';
                break;
            default:
                throw new common_1.ForbiddenException('Ваша роль не может принимать браки на доработку');
        }
        const existingTask = await this.prisma.task.findFirst({
            where: {
                productId,
                assignedToId: userId,
                status: {
                    in: [client_1.TaskStatus.NEW, client_1.TaskStatus.ACCEPTED],
                },
                stage: userStage,
            },
        });
        if (existingTask) {
            throw new common_1.BadRequestException('Вы уже приняли этот брак на доработку');
        }
        const rejectedTask = await this.prisma.task.findFirst({
            where: {
                productId,
                status: client_1.TaskStatus.REJECTED,
            },
            include: {
                product: {
                    include: {
                        productType: true,
                        order: true,
                    },
                },
            },
            orderBy: {
                rejectedAt: 'desc',
            },
        });
        if (!rejectedTask) {
            throw new common_1.NotFoundException('Забракованная задача не найдена');
        }
        const newTask = await this.prisma.task.create({
            data: {
                title: `${rejectedTask.product.name} - ${stageName} (БРАК)`,
                description: `Доработка после контроля качества. Причина: ${rejectedTask.notes}\n\n⚠️ Фото брака в разделе "Брак"`,
                stage: userStage,
                productId,
                assignedToId: userId,
                quantity: rejectedTask.quantity,
                status: client_1.TaskStatus.ACCEPTED,
                acceptedAt: new Date(),
            },
            include: {
                product: {
                    include: {
                        productType: true,
                        order: true,
                    },
                },
            },
        });
        console.log(`✅ Painter ${user.email} accepted defect rework for product ${productId}`);
        return newTask;
    }
    async getUnacceptedDefectsCount(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return { count: 0 };
        }
        let userStage = null;
        switch (user.role) {
            case client_1.UserRole.MANAGER:
                userStage = client_1.ProductionStage.PENDING;
                break;
            case client_1.UserRole.DESIGNER:
                userStage = client_1.ProductionStage.DESIGN;
                break;
            case client_1.UserRole.PREPARER:
                userStage = client_1.ProductionStage.PREPARATION;
                break;
            case client_1.UserRole.PAINTER:
                userStage = client_1.ProductionStage.PAINTING;
                break;
            default:
                const allDefects = await this.prisma.task.findMany({
                    where: {
                        status: client_1.TaskStatus.REJECTED,
                    },
                });
                return { count: allDefects.length };
        }
        const rejectedTasks = await this.prisma.task.findMany({
            where: {
                status: client_1.TaskStatus.REJECTED,
            },
            select: {
                productId: true,
            },
        });
        let unacceptedCount = 0;
        for (const rejectedTask of rejectedTasks) {
            const existingTask = await this.prisma.task.findFirst({
                where: {
                    productId: rejectedTask.productId,
                    assignedToId: userId,
                    status: {
                        in: [client_1.TaskStatus.NEW, client_1.TaskStatus.ACCEPTED],
                    },
                    stage: userStage,
                },
            });
            if (!existingTask) {
                unacceptedCount++;
            }
        }
        return { count: unacceptedCount };
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_service_1.TelegramService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map