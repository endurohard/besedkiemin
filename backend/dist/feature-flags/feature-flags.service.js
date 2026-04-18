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
exports.FeatureFlagsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const DEFAULT_FEATURE_FLAGS = [
    {
        key: "chat",
        name: "Онлайн-чат",
        description: "Чат с клиентами на сайте",
        category: "sales",
    },
    {
        key: "catalog",
        name: "Публичный каталог",
        description: "Витрина товаров на сайте для клиентов",
        category: "sales",
    },
    {
        key: "catalog_orders",
        name: "Заказы с сайта",
        description: "Страница заказов из публичного каталога",
        category: "sales",
    },
    {
        key: "product_types",
        name: "Каталог",
        description: "Производственный каталог типов товаров",
        category: "production",
    },
    {
        key: "analytics",
        name: "Аналитика",
        description: "Аналитика и отчеты",
        category: "general",
    },
    {
        key: "orders",
        name: "Заказы",
        description: "Управление заказами",
        category: "production",
    },
    {
        key: "inventory",
        name: "Склад",
        description: "Складской учет",
        category: "production",
    },
    {
        key: "shipments",
        name: "Отгрузки",
        description: "Управление отгрузками",
        category: "production",
    },
    {
        key: "tasks",
        name: "Задачи",
        description: "Канбан-доска задач",
        category: "production",
    },
    {
        key: "quality_checks",
        name: "Контроль качества",
        description: "Проверка качества продукции",
        category: "production",
    },
    {
        key: "telegram_notifications",
        name: "Telegram уведомления",
        description: "Отправка уведомлений в Telegram",
        category: "notifications",
    },
    {
        key: "sip_telephony",
        name: "SIP телефония",
        description: "Интеграция с IP-телефонией",
        category: "communications",
    },
    {
        key: "contact_requests",
        name: "Заявки с сайта",
        description: "Обработка заявок обратной связи",
        category: "sales",
    },
    {
        key: "callback_requests",
        name: "Обратный звонок",
        description: "Заявки на обратный звонок",
        category: "sales",
    },
];
let FeatureFlagsService = class FeatureFlagsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async initializeDefaults() {
        for (const flag of DEFAULT_FEATURE_FLAGS) {
            const existing = await this.prisma.featureFlag.findUnique({
                where: { key: flag.key },
            });
            if (!existing) {
                await this.prisma.featureFlag.create({
                    data: {
                        ...flag,
                        isEnabled: true,
                    },
                });
            }
        }
    }
    async findAll() {
        await this.initializeDefaults();
        return this.prisma.featureFlag.findMany({
            orderBy: [{ category: "asc" }, { name: "asc" }],
        });
    }
    async findByKey(key) {
        const flag = await this.prisma.featureFlag.findUnique({
            where: { key },
        });
        if (!flag) {
            throw new common_1.NotFoundException(`Feature flag "${key}" не найден`);
        }
        return flag;
    }
    async isEnabled(key) {
        try {
            const flag = await this.findByKey(key);
            return flag.isEnabled;
        }
        catch {
            return true;
        }
    }
    async getEnabledFlags() {
        const flags = await this.findAll();
        const result = {};
        for (const flag of flags) {
            result[flag.key] = flag.isEnabled;
        }
        return result;
    }
    async update(key, updateDto) {
        const flag = await this.findByKey(key);
        return this.prisma.featureFlag.update({
            where: { id: flag.id },
            data: updateDto,
        });
    }
    async toggle(key) {
        const flag = await this.findByKey(key);
        return this.prisma.featureFlag.update({
            where: { id: flag.id },
            data: { isEnabled: !flag.isEnabled },
        });
    }
    async bulkUpdate(updates) {
        const results = [];
        for (const update of updates) {
            try {
                const result = await this.prisma.featureFlag.update({
                    where: { key: update.key },
                    data: { isEnabled: update.isEnabled },
                });
                results.push(result);
            }
            catch {
            }
        }
        return results;
    }
};
exports.FeatureFlagsService = FeatureFlagsService;
exports.FeatureFlagsService = FeatureFlagsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FeatureFlagsService);
//# sourceMappingURL=feature-flags.service.js.map