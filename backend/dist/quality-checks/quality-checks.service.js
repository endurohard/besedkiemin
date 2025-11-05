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
exports.QualityChecksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const upload_service_1 = require("../upload/upload.service");
const telegram_service_1 = require("../telegram/telegram.service");
let QualityChecksService = class QualityChecksService {
    constructor(prisma, uploadService, telegramService) {
        this.prisma = prisma;
        this.uploadService = uploadService;
        this.telegramService = telegramService;
    }
    async create(createQualityCheckDto, userId, photoFile) {
        const product = await this.prisma.product.findUnique({
            where: { id: createQualityCheckDto.productId },
            include: { productType: true },
        });
        if (!product) {
            throw new common_1.NotFoundException('Продукт не найден');
        }
        let photoUrl;
        if (photoFile) {
            photoUrl = `/uploads/${photoFile.filename}`;
        }
        const qualityCheck = await this.prisma.qualityCheck.create({
            data: {
                productId: createQualityCheckDto.productId,
                status: createQualityCheckDto.status,
                notes: createQualityCheckDto.notes,
                photoUrl,
                checkedById: userId,
                checkedAt: new Date(),
            },
            include: {
                product: {
                    include: {
                        order: true,
                    },
                },
                checkedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
        });
        if (createQualityCheckDto.status === client_1.QualityStatus.REJECTED) {
            await this.prisma.product.update({
                where: { id: createQualityCheckDto.productId },
                data: { stage: client_1.ProductionStage.PAINTING },
            });
            await this.prisma.productHistory.create({
                data: {
                    productId: createQualityCheckDto.productId,
                    stage: client_1.ProductionStage.PAINTING,
                    userId,
                    notes: 'Возврат на доработку после браковки',
                },
            });
            await this.telegramService.sendDefectNotification({
                productName: product.name,
                productType: product.productType?.name || 'Не указан',
                orderNumber: qualityCheck.product.order.orderNumber,
                customerName: qualityCheck.product.order.customerName,
                notes: createQualityCheckDto.notes,
                photoUrl,
            });
        }
        if (createQualityCheckDto.status === client_1.QualityStatus.APPROVED) {
            await this.prisma.product.update({
                where: { id: createQualityCheckDto.productId },
                data: { stage: client_1.ProductionStage.COMPLETED },
            });
            await this.prisma.productHistory.create({
                data: {
                    productId: createQualityCheckDto.productId,
                    stage: client_1.ProductionStage.COMPLETED,
                    userId,
                    notes: 'Принято складом',
                },
            });
        }
        return qualityCheck;
    }
    async findAll(filters) {
        const where = {};
        if (filters?.productId) {
            where.productId = filters.productId;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        return this.prisma.qualityCheck.findMany({
            where,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        productType: true,
                        orderId: true,
                    },
                },
                checkedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findOne(id) {
        const qualityCheck = await this.prisma.qualityCheck.findUnique({
            where: { id },
            include: {
                product: {
                    include: {
                        order: true,
                    },
                },
                checkedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
        });
        if (!qualityCheck) {
            throw new common_1.NotFoundException('Проверка качества не найдена');
        }
        return qualityCheck;
    }
    async update(id, updateQualityCheckDto, photoFile) {
        const qualityCheck = await this.findOne(id);
        let photoUrl = qualityCheck.photoUrl;
        if (photoFile) {
            if (qualityCheck.photoUrl) {
                await this.uploadService.deleteFile(`.${qualityCheck.photoUrl}`);
            }
            photoUrl = `/uploads/${photoFile.filename}`;
        }
        return this.prisma.qualityCheck.update({
            where: { id },
            data: {
                ...updateQualityCheckDto,
                photoUrl,
            },
            include: {
                product: true,
                checkedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
        });
    }
    async remove(id) {
        const qualityCheck = await this.findOne(id);
        if (qualityCheck.photoUrl) {
            await this.uploadService.deleteFile(`.${qualityCheck.photoUrl}`);
        }
        return this.prisma.qualityCheck.delete({
            where: { id },
        });
    }
    async getByProduct(productId) {
        return this.findAll({ productId });
    }
    async getRejected() {
        return this.findAll({ status: client_1.QualityStatus.REJECTED });
    }
};
exports.QualityChecksService = QualityChecksService;
exports.QualityChecksService = QualityChecksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        upload_service_1.UploadService,
        telegram_service_1.TelegramService])
], QualityChecksService);
//# sourceMappingURL=quality-checks.service.js.map