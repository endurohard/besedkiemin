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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const analytics_service_1 = require("./analytics.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    getProductionOverview() {
        return this.analyticsService.getProductionOverview();
    }
    getUserPerformance() {
        return this.analyticsService.getUserPerformance();
    }
    getQualityStats() {
        return this.analyticsService.getQualityStats();
    }
    getProductTypeStats() {
        return this.analyticsService.getProductTypeStats();
    }
    getPerformanceSummary(startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.analyticsService.getPerformanceSummary(start, end);
    }
    getFullCycleAnalytics(startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.analyticsService.getFullCycleAnalytics(start, end);
    }
    getOrderProductionReport(startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.analyticsService.getOrderProductionReport(start, end);
    }
    getProductivityReport(startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.analyticsService.getProductivityReport(start, end);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)("production/overview"),
    (0, swagger_1.ApiOperation)({ summary: "Общая статистика производства (только OWNER)" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getProductionOverview", null);
__decorate([
    (0, common_1.Get)("users/performance"),
    (0, swagger_1.ApiOperation)({ summary: "Производительность сотрудников (только OWNER)" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getUserPerformance", null);
__decorate([
    (0, common_1.Get)("quality/stats"),
    (0, swagger_1.ApiOperation)({ summary: "Статистика проверки качества (только OWNER)" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getQualityStats", null);
__decorate([
    (0, common_1.Get)("products/types"),
    (0, swagger_1.ApiOperation)({ summary: "Статистика по типам продуктов (только OWNER)" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getProductTypeStats", null);
__decorate([
    (0, common_1.Get)("performance/summary"),
    (0, swagger_1.ApiOperation)({
        summary: "Сводка производительности за период (только OWNER)",
    }),
    (0, swagger_1.ApiQuery)({
        name: "startDate",
        required: false,
        type: String,
        description: "Дата начала периода (ISO 8601)",
    }),
    (0, swagger_1.ApiQuery)({
        name: "endDate",
        required: false,
        type: String,
        description: "Дата окончания периода (ISO 8601)",
    }),
    __param(0, (0, common_1.Query)("startDate")),
    __param(1, (0, common_1.Query)("endDate")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getPerformanceSummary", null);
__decorate([
    (0, common_1.Get)("full-cycle"),
    (0, swagger_1.ApiOperation)({
        summary: "Полная аналитика цикла: от заказа до доставки (только OWNER)",
    }),
    (0, swagger_1.ApiQuery)({
        name: "startDate",
        required: false,
        type: String,
        description: "Дата начала периода (ISO 8601)",
    }),
    (0, swagger_1.ApiQuery)({
        name: "endDate",
        required: false,
        type: String,
        description: "Дата окончания периода (ISO 8601)",
    }),
    __param(0, (0, common_1.Query)("startDate")),
    __param(1, (0, common_1.Query)("endDate")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getFullCycleAnalytics", null);
__decorate([
    (0, common_1.Get)("orders/production-report"),
    (0, swagger_1.ApiOperation)({
        summary: "Детальный отчёт по заказам: кто из сотрудников участвовал в производстве каждого этапа продукта (только OWNER)",
    }),
    (0, swagger_1.ApiQuery)({
        name: "startDate",
        required: false,
        type: String,
        description: "Дата начала периода (ISO 8601)",
    }),
    (0, swagger_1.ApiQuery)({
        name: "endDate",
        required: false,
        type: String,
        description: "Дата окончания периода (ISO 8601)",
    }),
    __param(0, (0, common_1.Query)("startDate")),
    __param(1, (0, common_1.Query)("endDate")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getOrderProductionReport", null);
__decorate([
    (0, common_1.Get)("productivity"),
    (0, swagger_1.ApiOperation)({
        summary: "Производительность сотрудников: коэффициент полезности, окладники vs сдельники (только OWNER)",
    }),
    (0, swagger_1.ApiQuery)({
        name: "startDate",
        required: false,
        type: String,
        description: "Дата начала (ISO 8601), по умолчанию начало месяца",
    }),
    (0, swagger_1.ApiQuery)({
        name: "endDate",
        required: false,
        type: String,
        description: "Дата окончания (ISO 8601), по умолчанию сегодня",
    }),
    __param(0, (0, common_1.Query)("startDate")),
    __param(1, (0, common_1.Query)("endDate")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getProductivityReport", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)("Analytics"),
    (0, common_1.Controller)("analytics"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("OWNER"),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map