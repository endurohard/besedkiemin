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
var TasksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const telegram_service_1 = require("../telegram/telegram.service");
const payroll_service_1 = require("../payroll/payroll.service");
const client_1 = require("@prisma/client");
const constants_1 = require("../common/constants");
const notifications_gateway_1 = require("../notifications/notifications.gateway");
let TasksService = TasksService_1 = class TasksService {
    constructor(prisma, telegramService, payrollService, notifications) {
        this.prisma = prisma;
        this.telegramService = telegramService;
        this.payrollService = payrollService;
        this.notifications = notifications;
        this.logger = new common_1.Logger(TasksService_1.name);
    }
    async getMyTasks(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!user) {
            throw new common_1.NotFoundException("Пользователь не найден");
        }
        const roleCode = user.role?.code;
        const stage = roleCode ? constants_1.ROLE_TO_STAGE[roleCode] : undefined;
        if (!stage) {
            if (roleCode === "MANAGER") {
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
                            role: { select: { code: true, name: true } },
                        },
                    },
                },
                orderBy: [
                    { priority: "desc" },
                    { createdAt: "desc" },
                ],
            });
        }
        const isDeptAccount = (0, constants_1.isDepartmentAccount)(user);
        const tasks = await this.prisma.task.findMany({
            where: {
                ...(isDeptAccount ? {} : { assignedToId: userId }),
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
                        role: { select: { code: true, name: true } },
                    },
                },
            },
            orderBy: [
                { priority: "desc" },
                { createdAt: "desc" },
            ],
        });
        const activeTasks = tasks.filter((task) => task.product?.stage === task.stage);
        if (isDeptAccount) {
            const tasksByProduct = new Map();
            for (const task of activeTasks) {
                const productId = task.productId;
                const existing = tasksByProduct.get(productId);
                if (!existing) {
                    tasksByProduct.set(productId, task);
                }
                else {
                    const isOwnTask = task.assignedToId === userId;
                    const isExistingOwn = existing.assignedToId === userId;
                    if (isOwnTask && !isExistingOwn) {
                        tasksByProduct.set(productId, task);
                    }
                }
            }
            return Array.from(tasksByProduct.values());
        }
        return activeTasks;
    }
    async getDepartmentTasks(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!user) {
            throw new common_1.NotFoundException("Пользователь не найден");
        }
        const roleCode = user.role?.code;
        const stage = roleCode ? constants_1.ROLE_TO_STAGE[roleCode] : undefined;
        if (!stage) {
            return [];
        }
        const departmentWorkers = await this.prisma.user.findMany({
            where: {
                roleId: user.roleId,
                isActive: true,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
            },
        });
        const tasks = await this.prisma.task.findMany({
            where: {
                assignedToId: { in: departmentWorkers.map((w) => w.id) },
                stage: stage,
                status: client_1.TaskStatus.ACCEPTED,
            },
            include: {
                product: {
                    include: {
                        productType: true,
                        order: {
                            select: {
                                id: true,
                                orderNumber: true,
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
                    },
                },
            },
            orderBy: [{ priority: "desc" }, { acceptedAt: "desc" }],
        });
        const filteredTasks = tasks.filter((task) => task.product?.stage === task.stage);
        const tasksByWorker = new Map();
        for (const task of filteredTasks) {
            const workerId = task.assignedToId;
            if (!tasksByWorker.has(workerId)) {
                tasksByWorker.set(workerId, []);
            }
            tasksByWorker.get(workerId).push(task);
        }
        const result = departmentWorkers
            .map((worker) => ({
            worker: {
                id: worker.id,
                firstName: worker.firstName,
                lastName: worker.lastName,
                isCurrentUser: worker.id === userId,
            },
            tasks: tasksByWorker.get(worker.id) || [],
        }))
            .filter((item) => item.tasks.length > 0);
        return result;
    }
    async getDepartmentWorkers(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!user) {
            throw new common_1.NotFoundException("Пользователь не найден");
        }
        return this.prisma.user.findMany({
            where: {
                roleId: user.roleId,
                isActive: true,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        });
    }
    async acceptTask(taskId, workerId, requesterId, acceptQuantity) {
        if (acceptQuantity !== undefined && acceptQuantity !== null) {
            if (!Number.isFinite(acceptQuantity) || acceptQuantity <= 0) {
                throw new common_1.BadRequestException("Количество должно быть положительным числом");
            }
        }
        const worker = await this.prisma.user.findUnique({
            where: { id: workerId },
            include: { role: true },
        });
        if (!worker) {
            throw new common_1.NotFoundException("Работник не найден");
        }
        if (requesterId && requesterId !== workerId) {
            const requester = await this.prisma.user.findUnique({
                where: { id: requesterId },
                include: { role: true },
            });
            if (!requester || requester.roleId !== worker.roleId) {
                throw new common_1.ForbiddenException("Вы не можете назначить задачу работнику из другого отдела");
            }
        }
        return this.prisma.$transaction(async (tx) => {
            const task = await tx.task.findUnique({
                where: { id: taskId },
                include: {
                    product: true,
                    assignedTo: { include: { role: true } },
                },
            });
            if (!task) {
                throw new common_1.NotFoundException("Задача не найдена");
            }
            if (task.status !== client_1.TaskStatus.NEW) {
                throw new common_1.BadRequestException("Задача уже принята или завершена");
            }
            if (task.assignedTo?.roleId !== worker.roleId) {
                throw new common_1.ForbiddenException("Работник не из этого отдела");
            }
            const isDefectTask = task.isDefect || !!task.title?.includes("БРАК");
            if (isDefectTask && task.assignedToId !== workerId) {
                throw new common_1.ForbiddenException("Задача брака может быть принята только назначенным работником");
            }
            const taskQuantity = task.quantity || task.product?.quantity || 1;
            if (acceptQuantity && acceptQuantity > taskQuantity) {
                throw new common_1.BadRequestException(`Нельзя принять ${acceptQuantity} шт. Доступно только ${taskQuantity} шт.`);
            }
            const quantityToAccept = acceptQuantity && acceptQuantity > 0 && acceptQuantity < taskQuantity
                ? acceptQuantity
                : taskQuantity;
            const remainingQuantity = taskQuantity - quantityToAccept;
            if (!isDefectTask) {
                await tx.task.deleteMany({
                    where: {
                        productId: task.productId,
                        stage: task.stage,
                        status: client_1.TaskStatus.NEW,
                        id: { not: taskId },
                    },
                });
            }
            if (remainingQuantity > 0 && !isDefectTask) {
                const departmentWorkers = await tx.user.findMany({
                    where: { roleId: worker.roleId },
                });
                for (const deptWorker of departmentWorkers) {
                    await tx.task.create({
                        data: {
                            title: task.title,
                            stage: task.stage,
                            quantity: remainingQuantity,
                            productId: task.productId,
                            assignedToId: deptWorker.id,
                            priority: task.priority,
                        },
                    });
                }
            }
            return tx.task.update({
                where: { id: taskId },
                data: {
                    status: client_1.TaskStatus.ACCEPTED,
                    acceptedAt: new Date(),
                    assignedToId: workerId,
                    quantity: quantityToAccept,
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
        });
    }
    async completeTask(taskId, userId, notes, quantity) {
        return this.prisma.$transaction(async (tx) => {
            const task = await tx.task.findUnique({
                where: { id: taskId },
                include: {
                    product: true,
                    assignedTo: { include: { role: true } },
                },
            });
            if (!task) {
                throw new common_1.NotFoundException("Задача не найдена");
            }
            if (task.assignedToId !== userId) {
                const currentUser = await tx.user.findUnique({
                    where: { id: userId },
                    include: { role: true },
                });
                if (!currentUser || currentUser.roleId !== task.assignedTo?.roleId) {
                    throw new common_1.ForbiddenException("Вы не можете завершить эту задачу - вы не из этого отдела");
                }
            }
            if (task.status !== client_1.TaskStatus.ACCEPTED) {
                throw new common_1.BadRequestException("Задача должна быть сначала принята в работу");
            }
            if (quantity !== undefined && quantity !== null) {
                if (!Number.isFinite(quantity) || quantity <= 0) {
                    throw new common_1.BadRequestException("Количество должно быть положительным числом");
                }
                if (quantity > task.quantity) {
                    throw new common_1.BadRequestException(`Нельзя завершить ${quantity} шт. В задаче только ${task.quantity} шт.`);
                }
            }
            const completedQuantity = quantity || task.quantity;
            const remainingQuantity = task.quantity - completedQuantity;
            if (remainingQuantity > 0) {
                await tx.task.create({
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
            return tx.task.update({
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
        });
    }
    async passTask(taskId, userId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: {
                product: { include: { productType: true } },
                assignedTo: { include: { role: true } },
            },
        });
        if (!task) {
            throw new common_1.NotFoundException("Задача не найдена");
        }
        if (task.assignedToId !== userId) {
            const currentUser = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { role: true },
            });
            if (!currentUser || currentUser.roleId !== task.assignedTo?.roleId) {
                throw new common_1.ForbiddenException("Вы не можете передать эту задачу - вы не из этого отдела");
            }
        }
        if (task.status !== client_1.TaskStatus.COMPLETED) {
            throw new common_1.BadRequestException("Задача должна быть сначала завершена");
        }
        const currentWorkflowStage = await this.prisma.workflowStage.findFirst({
            where: {
                legacyStage: task.stage,
                isActive: true,
            },
        });
        if (!currentWorkflowStage) {
            throw new common_1.BadRequestException("Текущая стадия workflow не найдена");
        }
        let nextWorkflowStage = await this.prisma.workflowStage.findFirst({
            where: {
                order: currentWorkflowStage.order + 1,
                isActive: true,
            },
            include: { roles: { include: { role: true } } },
        });
        if (!nextWorkflowStage) {
            throw new common_1.BadRequestException("Следующая стадия workflow не найдена");
        }
        const product = task.product;
        const productType = product.productType;
        const needsSewing = product.upholsteryMaterial
            ? true
            : product.requiresSewing !== null
                ? product.requiresSewing
                : (productType?.requiresSewing ?? false);
        if (nextWorkflowStage.legacyStage === client_1.ProductionStage.SEWING &&
            !needsSewing) {
            this.logger.log(`Skipping SEWING stage for product ${product.name} - requiresSewing is false`);
            const afterSewingStage = await this.prisma.workflowStage.findFirst({
                where: {
                    order: nextWorkflowStage.order + 1,
                    isActive: true,
                },
                include: { roles: { include: { role: true } } },
            });
            if (afterSewingStage) {
                nextWorkflowStage = afterSewingStage;
            }
        }
        const completedQuantity = task.quantity || task.product.quantity;
        const updatedTask = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.task.update({
                where: { id: taskId },
                data: {
                    status: client_1.TaskStatus.PASSED,
                    passedAt: new Date(),
                },
            });
            await tx.productHistory.create({
                data: {
                    productId: task.productId,
                    userId: userId,
                    stage: task.stage,
                    status: client_1.TaskStatus.PASSED,
                    completedAt: new Date(),
                    passedAt: new Date(),
                },
            });
            await tx.product.update({
                where: { id: task.productId },
                data: {
                    stage: nextWorkflowStage.legacyStage,
                },
            });
            return updated;
        });
        await this.updateOrderStatus(task.product.orderId);
        const nextStageRoleIds = nextWorkflowStage.roles?.map((r) => r.roleId) || [];
        if (nextStageRoleIds.length === 0) {
            this.logger.warn(`No roles assigned to workflow stage ${nextWorkflowStage.name}`);
        }
        const nextWorkers = await this.prisma.user.findMany({
            where: {
                roleId: { in: nextStageRoleIds },
                isActive: true,
            },
            include: { role: true },
        });
        if (nextWorkers.length === 0) {
            this.logger.warn(`No active workers found for stage ${nextWorkflowStage.name}. Product ${task.product.name} moved but no tasks created.`);
        }
        const stageAssignments = task.product.stageAssignments;
        const assignedId = stageAssignments && nextWorkflowStage.legacyStage
            ? stageAssignments[nextWorkflowStage.legacyStage]
            : undefined;
        const filteredWorkers = assignedId
            ? nextWorkers.filter((w) => w.id === assignedId)
            : nextWorkers;
        for (const worker of filteredWorkers) {
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
                    `*Продукт:* ${newTask.product?.name || "Н/Д"}\n` +
                    `*Тип:* ${newTask.product?.productType?.name || "Н/Д"}\n` +
                    `*Количество:* ${completedQuantity} шт.\n` +
                    `*Стадия:* ${nextWorkflowStage.name}\n` +
                    `*Заказ:* ${newTask.product?.order?.orderNumber || "Н/Д"}\n\n` +
                    `✅ Откройте раздел "Мои задачи" для выполнения`;
                try {
                    await this.telegramService.sendMessage(worker.telegramId, message);
                    this.logger.log(`Уведомление отправлено работнику ${worker.email}`);
                }
                catch (error) {
                    this.logger.error(`Ошибка отправки уведомления работнику ${worker.email}:`, error);
                }
            }
        }
        return updatedTask;
    }
    async rejectTask(taskId, userId, notes, quantity, defectPhotoUrl, requestPhoto, returnToStage, penaltyAmount) {
        this.logger.debug("rejectTask called", {
            taskId,
            userId,
            notes,
            quantity,
            defectPhotoUrl,
            requestPhoto,
            returnToStage,
        });
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        this.logger.debug("User found", {
            email: user?.email,
            role: user?.role?.code,
        });
        if (!user || user.role?.code !== "WAREHOUSE") {
            this.logger.warn("Attempted reject by non-warehouse user", { userId });
            throw new common_1.ForbiddenException("Только складист может браковать товар");
        }
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: {
                product: {
                    include: {
                        productType: true,
                        order: true,
                    },
                },
            },
        });
        this.logger.debug("Task found", {
            title: task?.title,
            status: task?.status,
            stage: task?.stage,
        });
        if (!task) {
            this.logger.warn("Task not found", { taskId });
            throw new common_1.NotFoundException("Задача не найдена");
        }
        if (task.assignedToId !== userId && !(0, constants_1.isDepartmentAccount)(user)) {
            this.logger.warn("Task not assigned to user", { taskId, userId });
            throw new common_1.ForbiddenException("Вы не можете забраковать эту задачу");
        }
        if (task.stage !== client_1.ProductionStage.QUALITY_CHECK) {
            this.logger.warn("Task not at QUALITY_CHECK stage", {
                taskId,
                stage: task.stage,
            });
            throw new common_1.BadRequestException("Браковать можно только на стадии проверки качества");
        }
        this.logger.debug("All validations passed, proceeding with rejection");
        if (quantity !== undefined && quantity !== null) {
            if (!Number.isFinite(quantity) || quantity <= 0) {
                throw new common_1.BadRequestException("Количество должно быть положительным числом");
            }
        }
        const availableQuantity = task.quantity - task.quantityProcessed;
        const rejectQuantity = quantity || availableQuantity;
        if (rejectQuantity > availableQuantity) {
            throw new common_1.BadRequestException(`Нельзя забраковать ${rejectQuantity} шт. Доступно только ${availableQuantity} шт.`);
        }
        this.logger.debug(`Rejecting ${rejectQuantity} out of ${availableQuantity} available (total: ${task.quantity})`);
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
        let returnStage;
        if (returnToStage &&
            Object.values(client_1.ProductionStage).includes(returnToStage)) {
            returnStage = returnToStage;
        }
        else {
            const currentWorkflowStage = await this.prisma.workflowStage.findFirst({
                where: { legacyStage: task.stage, isActive: true },
            });
            const productForSewing = task.product;
            const productTypeForSewing = productForSewing.productType;
            const needsSewing = productForSewing.upholsteryMaterial
                ? true
                : productForSewing.requiresSewing !== null
                    ? productForSewing.requiresSewing
                    : (productTypeForSewing?.requiresSewing ?? false);
            let previousStage = currentWorkflowStage
                ? await this.prisma.workflowStage.findFirst({
                    where: {
                        order: { lt: currentWorkflowStage.order },
                        isActive: true,
                    },
                    orderBy: { order: "desc" },
                })
                : null;
            if (previousStage?.legacyStage === client_1.ProductionStage.SEWING &&
                !needsSewing) {
                this.logger.log(`Skipping SEWING stage for return (product does not require sewing)`);
                previousStage = await this.prisma.workflowStage.findFirst({
                    where: { order: { lt: previousStage.order }, isActive: true },
                    orderBy: { order: "desc" },
                });
            }
            returnStage =
                previousStage?.legacyStage ||
                    client_1.ProductionStage.PAINTING;
        }
        const currentProduct = await this.prisma.product.findUnique({
            where: { id: task.productId },
            select: { stage: true },
        });
        if (!currentProduct ||
            currentProduct.stage !== client_1.ProductionStage.QUALITY_CHECK) {
            this.logger.warn("Product stage changed during reject processing", {
                taskId,
                expectedStage: client_1.ProductionStage.QUALITY_CHECK,
                actualStage: currentProduct?.stage,
            });
            throw new common_1.BadRequestException("Продукт уже перемещён на другую стадию. Повторите операцию.");
        }
        let rejectedProductId = task.productId;
        if (rejectQuantity < task.product.quantity) {
            const rejectedProduct = await this.prisma.product.create({
                data: {
                    name: `${task.product.name} (БРАК ${rejectQuantity} шт.)`,
                    productTypeId: task.product.productTypeId,
                    quantity: rejectQuantity,
                    stage: returnStage,
                    orderId: task.product.orderId,
                    dimensions: task.product.dimensions,
                    schemaImageUrl: task.product.schemaImageUrl,
                    deadline: task.product.deadline,
                    requiresSewing: task.product.requiresSewing,
                    upholsteryMaterial: task.product.upholsteryMaterial,
                },
            });
            rejectedProductId = rejectedProduct.id;
        }
        else {
            await this.prisma.product.update({
                where: { id: task.productId },
                data: {
                    stage: returnStage,
                },
            });
        }
        await this.updateOrderStatus(task.product.orderId);
        await this.prisma.qualityCheck.create({
            data: {
                productId: rejectedProductId,
                checkedById: userId,
                status: "REJECTED",
                notes,
                checkedAt: new Date(),
            },
        });
        if (requestPhoto && user.telegramId) {
            this.logger.log(`Requesting ${rejectQuantity} defect photos from warehouse ${user.email}`);
            const photoRequested = await this.telegramService.requestDefectPhoto(userId, taskId, notes, rejectQuantity);
            if (photoRequested) {
                this.logger.log(`Photo request sent to warehouse ${user.email}`);
            }
            else {
                this.logger.warn(`Failed to request photo from warehouse ${user.email}`);
            }
        }
        const targetStageName = constants_1.STAGE_TO_NAME[returnStage] || "Покраска";
        const originalTask = await this.prisma.task.findFirst({
            where: {
                productId: task.productId,
                stage: returnStage,
                status: client_1.TaskStatus.PASSED,
            },
            include: {
                assignedTo: true,
            },
            orderBy: {
                passedAt: "desc",
            },
        });
        if (originalTask && originalTask.assignedTo) {
            const originalWorker = originalTask.assignedTo;
            const defectTask = await this.prisma.task.create({
                data: {
                    title: `${task.product.name} - ${targetStageName} (БРАК)`,
                    description: `Доработка после контроля качества.\n\nПричина брака: ${notes}\n\nЗабраковал: ${user.firstName} ${user.lastName}`,
                    stage: returnStage,
                    productId: rejectedProductId,
                    assignedToId: originalWorker.id,
                    quantity: rejectQuantity,
                    status: client_1.TaskStatus.NEW,
                    isDefect: true,
                },
            });
            this.logger.log(`Defect task ${defectTask.id} created for original worker ${originalWorker.email} (${originalWorker.firstName} ${originalWorker.lastName})`);
            if (originalWorker.telegramId) {
                const message = `🚨 *БРАК - ТРЕБУЕТСЯ ДОРАБОТКА*\n\n` +
                    `*Продукт:* ${task.product.name}\n` +
                    `*Тип:* ${task.product.productType?.name || "Н/Д"}\n` +
                    `*Заказ:* ${task.product.order?.orderNumber || "Н/Д"}\n\n` +
                    `*Причина брака:*\n${notes}\n\n` +
                    `*Забраковал:* ${user.firstName} ${user.lastName}\n` +
                    `*Количество:* ${rejectQuantity} шт.\n` +
                    `*Стадия:* ${targetStageName}\n\n` +
                    `⚠️ Задача уже назначена вам. Откройте раздел "Мои задачи"`;
                await this.telegramService.sendMessage(originalWorker.telegramId, message);
            }
        }
        else {
            this.logger.warn(`Could not find original worker for product ${task.productId} at stage ${returnStage}. Searching for any available worker.`);
            const stageRoleCode = Object.entries(constants_1.ROLE_TO_STAGE).find(([, stage]) => stage === returnStage)?.[0];
            if (stageRoleCode) {
                const availableWorkers = await this.prisma.user.findMany({
                    where: {
                        role: { code: stageRoleCode },
                        isActive: true,
                    },
                });
                if (availableWorkers.length > 0) {
                    for (const worker of availableWorkers) {
                        await this.prisma.task.create({
                            data: {
                                title: `${task.product.name} - ${targetStageName} (БРАК)`,
                                description: `Доработка после контроля качества.\n\nПричина брака: ${notes}\n\nЗабраковал: ${user.firstName} ${user.lastName}`,
                                stage: returnStage,
                                productId: rejectedProductId,
                                assignedToId: worker.id,
                                quantity: rejectQuantity,
                                status: client_1.TaskStatus.NEW,
                                isDefect: true,
                            },
                        });
                    }
                    this.logger.log(`Defect tasks created for ${availableWorkers.length} workers at stage ${returnStage}`);
                }
                else {
                    this.logger.error(`No active workers found for stage ${returnStage}. Product ${task.productId} stuck without task!`);
                }
            }
            else {
                this.logger.error(`No role mapping found for stage ${returnStage}. Product ${task.productId} stuck without task!`);
            }
        }
        if (penaltyAmount && penaltyAmount > 0) {
            try {
                const lastHistory = await this.prisma.productHistory.findFirst({
                    where: {
                        productId: task.productId,
                        completedAt: { not: null },
                    },
                    orderBy: { completedAt: "desc" },
                    select: { userId: true },
                });
                const penaltyUserId = lastHistory?.userId;
                if (penaltyUserId) {
                    await this.prisma.penalty.create({
                        data: {
                            userId: penaltyUserId,
                            amount: penaltyAmount,
                            reason: notes || "Брак на контроле качества",
                            productId: task.productId,
                            createdById: userId,
                        },
                    });
                    const checkerName = user
                        ? `${user.lastName || ""} ${user.firstName || ""}`.trim()
                        : "Склад";
                    await this.telegramService.sendPenaltyNotification({
                        userId: penaltyUserId,
                        amount: penaltyAmount,
                        reason: notes || "Брак на контроле качества",
                        createdByName: checkerName,
                    });
                    this.logger.log("Penalty created during task rejection", {
                        penaltyUserId,
                        penaltyAmount,
                    });
                }
            }
            catch (error) {
                this.logger.error("Failed to create penalty during rejection", error);
            }
        }
        this.logger.log("Task rejected successfully", { taskId });
        return updatedTask;
    }
    async approveTask(taskId, userId, quantity) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!user || user.role?.code !== "WAREHOUSE") {
            throw new common_1.ForbiddenException("Только складист может принять товар");
        }
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: {
                product: {
                    include: {
                        productType: true,
                        order: true,
                    },
                },
            },
        });
        if (!task) {
            throw new common_1.NotFoundException("Задача не найдена");
        }
        if (task.status !== client_1.TaskStatus.NEW && task.status !== client_1.TaskStatus.PASSED) {
            throw new common_1.BadRequestException(`Нельзя принять задачу в статусе "${task.status}"`);
        }
        if (task.assignedToId !== userId && !(0, constants_1.isDepartmentAccount)(user)) {
            throw new common_1.ForbiddenException("Вы не можете принять эту задачу");
        }
        if (task.stage !== client_1.ProductionStage.QUALITY_CHECK) {
            throw new common_1.BadRequestException("Принять можно только на стадии проверки качества");
        }
        const workflowStages = await this.prisma.workflowStage.findMany({
            where: { isActive: true, legacyStage: { not: null } },
        });
        const workflowStageMap = new Map(workflowStages.map((ws) => [ws.legacyStage, ws]));
        const updatedTask = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.task.update({
                where: { id: taskId },
                data: {
                    status: client_1.TaskStatus.PASSED,
                    completedAt: new Date(),
                    passedAt: new Date(),
                    quantity,
                },
            });
            await tx.product.update({
                where: { id: task.productId },
                data: {
                    stage: client_1.ProductionStage.COMPLETED,
                    quantity,
                },
            });
            await tx.qualityCheck.create({
                data: {
                    productId: task.productId,
                    checkedById: userId,
                    status: "APPROVED",
                    checkedAt: new Date(),
                },
            });
            const nomenclatureId = task.product.nomenclatureId || null;
            const passedTasks = await tx.task.findMany({
                where: {
                    productId: task.productId,
                    status: client_1.TaskStatus.PASSED,
                    stage: { not: client_1.ProductionStage.QUALITY_CHECK },
                },
                include: { assignedTo: true },
            });
            const existingLogs = await tx.workLog.findMany({
                where: { taskId: { in: passedTasks.map((t) => t.id) } },
                select: { taskId: true },
            });
            const existingLogTaskIds = new Set(existingLogs.map((l) => l.taskId));
            for (const passedTask of passedTasks) {
                if (!existingLogTaskIds.has(passedTask.id)) {
                    const ws = workflowStageMap.get(passedTask.stage);
                    await this.payrollService.createWorkLog({
                        userId: passedTask.assignedToId,
                        productId: task.productId,
                        taskId: passedTask.id,
                        productTypeId: task.product.productTypeId,
                        nomenclatureId: nomenclatureId || undefined,
                        stage: passedTask.stage,
                        workflowStageId: ws?.id,
                        quantity: passedTask.quantity,
                        completedAt: passedTask.passedAt || new Date(),
                        notes: passedTask.notes || undefined,
                    });
                    this.logger.log(`WorkLog created for worker ${passedTask.assignedToId}, task ${passedTask.id}, stage ${passedTask.stage}`);
                }
            }
            const existingInventory = await tx.inventoryItem.findFirst({
                where: { productId: task.productId },
            });
            if (existingInventory) {
                await tx.inventoryItem.update({
                    where: { id: existingInventory.id },
                    data: { quantity: existingInventory.quantity + quantity },
                });
            }
            else {
                await tx.inventoryItem.create({
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
            await this.updateOrderStatus(task.product.orderId, tx);
            return updated;
        });
        return updatedTask;
    }
    async updateOrderStatus(orderId, tx) {
        const db = tx || this.prisma;
        const products = await db.product.findMany({
            where: { orderId },
        });
        const allCompleted = products.every((p) => p.stage === client_1.ProductionStage.COMPLETED);
        const hasStarted = products.some((p) => p.stage !== client_1.ProductionStage.PENDING);
        let newStatus = null;
        if (allCompleted && products.length > 0) {
            newStatus = "COMPLETED";
        }
        else if (hasStarted) {
            newStatus = "IN_PRODUCTION";
        }
        if (newStatus) {
            await db.order.update({
                where: { id: orderId },
                data: { status: newStatus },
            });
        }
    }
    async getDefectsWithPhotos(userId) {
        let user = null;
        if (userId) {
            user = (await this.prisma.user.findUnique({
                where: { id: userId },
                include: { role: true },
            }));
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
                        qualityChecks: {
                            where: {
                                status: "REJECTED",
                            },
                            include: {
                                checkedBy: true,
                            },
                            orderBy: {
                                checkedAt: "desc",
                            },
                            take: 1,
                        },
                    },
                },
                assignedTo: true,
            },
            orderBy: {
                rejectedAt: "desc",
            },
        });
        const defects = rejectedTasks
            .filter((task) => task.product.qualityChecks.length > 0)
            .map((task) => {
            const qualityCheck = task.product.qualityChecks[0];
            return {
                ...qualityCheck,
                product: {
                    ...task.product,
                    qualityChecks: undefined,
                },
                defectPhotos: task.defectPhotos,
            };
        });
        let filteredDefects = defects.filter((d) => d.id);
        if (user &&
            (user.role?.code === "OWNER" ||
                user.role?.code === "SUPER_ADMIN" ||
                user.role?.code === "MANAGER")) {
            return filteredDefects;
        }
        if (user) {
            const userStage = (user.role?.code ? constants_1.ROLE_TO_STAGE[user.role.code] : null) ||
                client_1.ProductionStage.PENDING;
            filteredDefects = filteredDefects.filter((d) => d.product?.stage === userStage);
        }
        return filteredDefects;
    }
    async acceptDefectRework(productId, userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!user) {
            throw new common_1.ForbiddenException("Пользователь не найден");
        }
        const roleCode = user.role?.code;
        let userStage;
        if (roleCode === "MANAGER") {
            userStage = client_1.ProductionStage.PENDING;
        }
        else if (roleCode && constants_1.ROLE_TO_STAGE[roleCode]) {
            userStage = constants_1.ROLE_TO_STAGE[roleCode];
        }
        else {
            throw new common_1.ForbiddenException("Ваша роль не может принимать браки на доработку");
        }
        const stageName = (constants_1.STAGE_TO_NAME[userStage] || userStage).toUpperCase();
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
            throw new common_1.BadRequestException("Вы уже приняли этот брак на доработку");
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
                rejectedAt: "desc",
            },
        });
        if (!rejectedTask) {
            throw new common_1.NotFoundException("Забракованная задача не найдена");
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
                isDefect: true,
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
        this.logger.log(`User ${user.email} accepted defect rework for product ${productId}`);
        return newTask;
    }
    async getUnacceptedDefectsCount(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!user) {
            return { count: 0 };
        }
        const userRoleCode = user.role?.code;
        let userStage = null;
        if (userRoleCode === "MANAGER") {
            userStage = client_1.ProductionStage.PENDING;
        }
        else if (userRoleCode &&
            constants_1.ROLE_TO_STAGE[userRoleCode] &&
            userRoleCode !== "WAREHOUSE") {
            userStage = constants_1.ROLE_TO_STAGE[userRoleCode];
        }
        else {
            const allDefectsCount = await this.prisma.task.count({
                where: { status: client_1.TaskStatus.REJECTED },
            });
            return { count: allDefectsCount };
        }
        const rejectedTasks = await this.prisma.task.findMany({
            where: {
                status: client_1.TaskStatus.REJECTED,
                product: {
                    stage: userStage,
                },
            },
            select: {
                productId: true,
            },
            distinct: ["productId"],
        });
        if (rejectedTasks.length === 0) {
            return { count: 0 };
        }
        const rejectedProductIds = rejectedTasks.map((t) => t.productId);
        const userActiveTasks = await this.prisma.task.findMany({
            where: {
                productId: { in: rejectedProductIds },
                assignedToId: userId,
                status: { in: [client_1.TaskStatus.NEW, client_1.TaskStatus.ACCEPTED] },
                stage: userStage,
            },
            select: {
                productId: true,
            },
        });
        const acceptedProductIds = new Set(userActiveTasks.map((t) => t.productId));
        const unacceptedCount = rejectedProductIds.filter((id) => !acceptedProductIds.has(id)).length;
        return { count: unacceptedCount };
    }
    async updateTaskQuantity(taskId, userId, quantity) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: { assignedTo: true, product: true },
        });
        if (!task) {
            throw new common_1.NotFoundException("Задача не найдена");
        }
        if (quantity < 1) {
            throw new common_1.BadRequestException("Количество должно быть не менее 1");
        }
        if (quantity > (task.product?.quantity || 0)) {
            throw new common_1.BadRequestException("Количество не может превышать количество в продукте");
        }
        const updated = await this.prisma.task.update({
            where: { id: taskId },
            data: { quantity },
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
                        role: { select: { code: true, name: true } },
                    },
                },
            },
        });
        this.logger.log(`Task ${taskId} quantity updated to ${quantity} by user ${userId}`);
        return updated;
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = TasksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_service_1.TelegramService,
        payroll_service_1.PayrollService,
        notifications_gateway_1.NotificationsGateway])
], TasksService);
//# sourceMappingURL=tasks.service.js.map