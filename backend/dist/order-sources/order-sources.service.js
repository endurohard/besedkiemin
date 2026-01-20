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
exports.OrderSourcesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OrderSourcesService = class OrderSourcesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.orderSource.findMany({
            orderBy: { order: 'asc' },
            include: {
                _count: {
                    select: { orders: true },
                },
            },
        });
    }
    async findActive() {
        return this.prisma.orderSource.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });
    }
    async findOne(id) {
        const source = await this.prisma.orderSource.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { orders: true },
                },
            },
        });
        if (!source) {
            throw new common_1.NotFoundException(`Источник заказа с ID ${id} не найден`);
        }
        return source;
    }
    async findByCode(code) {
        return this.prisma.orderSource.findUnique({
            where: { code },
        });
    }
    async create(dto) {
        const existingByName = await this.prisma.orderSource.findUnique({ where: { name: dto.name } });
        if (existingByName) {
            throw new common_1.ConflictException(`Источник с названием "${dto.name}" уже существует`);
        }
        const existingByCode = await this.prisma.orderSource.findUnique({ where: { code: dto.code } });
        if (existingByCode) {
            throw new common_1.ConflictException(`Источник с кодом "${dto.code}" уже существует`);
        }
        return this.prisma.orderSource.create({
            data: dto,
        });
    }
    async update(id, dto) {
        const source = await this.findOne(id);
        if (dto.name && dto.name !== source.name) {
            const existingByName = await this.prisma.orderSource.findUnique({ where: { name: dto.name } });
            if (existingByName) {
                throw new common_1.ConflictException(`Источник с названием "${dto.name}" уже существует`);
            }
        }
        if (dto.code && dto.code !== source.code) {
            const existingByCode = await this.prisma.orderSource.findUnique({ where: { code: dto.code } });
            if (existingByCode) {
                throw new common_1.ConflictException(`Источник с кодом "${dto.code}" уже существует`);
            }
        }
        return this.prisma.orderSource.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id) {
        const source = await this.findOne(id);
        if (source._count.orders > 0) {
            throw new common_1.BadRequestException(`Нельзя удалить источник, к которому привязаны заказы (${source._count.orders} шт.)`);
        }
        await this.prisma.orderSource.delete({ where: { id } });
        return { success: true };
    }
    async initializeDefaultSources() {
        const defaultSources = [
            { name: 'Авито', code: 'AVITO', color: '#00AAFF', icon: 'avito', order: 1 },
            { name: 'Инстаграм', code: 'INSTAGRAM', color: '#E4405F', icon: 'instagram', order: 2 },
            { name: 'Сайт', code: 'WEBSITE', color: '#4CAF50', icon: 'globe', order: 3 },
            { name: 'Телефон', code: 'PHONE', color: '#2196F3', icon: 'phone', order: 4 },
            { name: 'WhatsApp', code: 'WHATSAPP', color: '#25D366', icon: 'whatsapp', order: 5 },
            { name: 'Telegram', code: 'TELEGRAM', color: '#0088CC', icon: 'telegram', order: 6 },
            { name: 'Личный визит', code: 'VISIT', color: '#FF9800', icon: 'user', order: 7 },
            { name: 'Рекомендация', code: 'REFERRAL', color: '#9C27B0', icon: 'users', order: 8 },
        ];
        for (const source of defaultSources) {
            const existing = await this.prisma.orderSource.findUnique({
                where: { code: source.code },
            });
            if (!existing) {
                await this.prisma.orderSource.create({ data: source });
            }
        }
        return { success: true, message: 'Источники заказов инициализированы' };
    }
};
exports.OrderSourcesService = OrderSourcesService;
exports.OrderSourcesService = OrderSourcesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrderSourcesService);
//# sourceMappingURL=order-sources.service.js.map