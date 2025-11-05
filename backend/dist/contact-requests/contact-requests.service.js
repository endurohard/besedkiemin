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
exports.ContactRequestsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ContactRequestsService = class ContactRequestsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createDto) {
        return this.prisma.contactRequest.create({
            data: {
                name: createDto.name,
                phone: createDto.phone,
                email: createDto.email,
                message: createDto.message,
                productId: createDto.productId,
            },
        });
    }
    async findAll(onlyUnprocessed = false) {
        const where = onlyUnprocessed ? { isProcessed: false } : {};
        return this.prisma.contactRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const request = await this.prisma.contactRequest.findUnique({
            where: { id },
        });
        if (!request) {
            throw new common_1.NotFoundException(`Запрос с ID ${id} не найден`);
        }
        return request;
    }
    async update(id, updateDto) {
        await this.findOne(id);
        const data = { ...updateDto };
        if (updateDto.isProcessed && updateDto.isProcessed === true) {
            data.processedAt = new Date();
        }
        return this.prisma.contactRequest.update({
            where: { id },
            data,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.contactRequest.delete({
            where: { id },
        });
    }
};
exports.ContactRequestsService = ContactRequestsService;
exports.ContactRequestsService = ContactRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContactRequestsService);
//# sourceMappingURL=contact-requests.service.js.map