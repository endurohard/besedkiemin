"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentPresetsService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
const constants_1 = require("../common/constants");
let DepartmentPresetsService = class DepartmentPresetsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.departmentLoginPreset.findMany({
            orderBy: { sortOrder: "asc" },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        isActive: true,
                        role: { select: { code: true, name: true } },
                    },
                },
            },
        });
    }
    async findPublic() {
        const presets = await this.prisma.departmentLoginPreset.findMany({
            where: {
                isActive: true,
                user: { isActive: true },
            },
            orderBy: { sortOrder: "asc" },
            select: {
                code: true,
                label: true,
                color: true,
                sortOrder: true,
            },
        });
        return presets;
    }
    async findByCodeActive(code) {
        return this.prisma.departmentLoginPreset.findFirst({
            where: { code, isActive: true },
            include: {
                user: { include: { role: true } },
            },
        });
    }
    async findOne(id) {
        const preset = await this.prisma.departmentLoginPreset.findUnique({
            where: { id },
        });
        if (!preset) {
            throw new common_1.NotFoundException("Пресет не найден");
        }
        return preset;
    }
    async create(dto) {
        const existing = await this.prisma.departmentLoginPreset.findUnique({
            where: { code: dto.code },
        });
        if (existing) {
            throw new common_1.ConflictException(`Пресет с кодом "${dto.code}" уже существует`);
        }
        const user = await this.prisma.user.findUnique({
            where: { id: dto.userId },
        });
        if (!user) {
            throw new common_1.NotFoundException("Пользователь не найден");
        }
        if (dto.newPassword) {
            const hashed = await bcrypt.hash(dto.newPassword, constants_1.AUTH.BCRYPT_SALT_ROUNDS);
            await this.prisma.user.update({
                where: { id: dto.userId },
                data: { password: hashed },
            });
        }
        return this.prisma.departmentLoginPreset.create({
            data: {
                code: dto.code,
                label: dto.label,
                userId: dto.userId,
                color: dto.color ?? "blue",
                sortOrder: dto.sortOrder ?? 0,
                isActive: dto.isActive ?? true,
            },
        });
    }
    async update(id, dto) {
        const preset = await this.findOne(id);
        if (dto.code && dto.code !== preset.code) {
            const existing = await this.prisma.departmentLoginPreset.findUnique({
                where: { code: dto.code },
            });
            if (existing) {
                throw new common_1.ConflictException(`Пресет с кодом "${dto.code}" уже существует`);
            }
        }
        if (dto.userId && dto.userId !== preset.userId) {
            const user = await this.prisma.user.findUnique({
                where: { id: dto.userId },
            });
            if (!user) {
                throw new common_1.NotFoundException("Пользователь не найден");
            }
        }
        const targetUserId = dto.userId ?? preset.userId;
        if (dto.newPassword) {
            const hashed = await bcrypt.hash(dto.newPassword, constants_1.AUTH.BCRYPT_SALT_ROUNDS);
            await this.prisma.user.update({
                where: { id: targetUserId },
                data: { password: hashed },
            });
        }
        const { newPassword, ...presetData } = dto;
        return this.prisma.departmentLoginPreset.update({
            where: { id },
            data: presetData,
        });
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.departmentLoginPreset.delete({ where: { id } });
        return { success: true };
    }
};
exports.DepartmentPresetsService = DepartmentPresetsService;
exports.DepartmentPresetsService = DepartmentPresetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepartmentPresetsService);
//# sourceMappingURL=department-presets.service.js.map