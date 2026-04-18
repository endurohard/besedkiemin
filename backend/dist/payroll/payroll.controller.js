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
exports.PayrollController = void 0;
const common_1 = require("@nestjs/common");
const payroll_service_1 = require("./payroll.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const constants_1 = require("../common/constants");
let PayrollController = class PayrollController {
    constructor(payrollService) {
        this.payrollService = payrollService;
    }
    async getMyEarnings(user, startDate, endDate) {
        return this.payrollService.getWorkerEarnings(user.userId, startDate, endDate);
    }
    async getMyEarningsToday(user) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this.payrollService.getWorkerEarnings(user.userId, today.toISOString(), tomorrow.toISOString());
    }
    findAllWorkRates() {
        return this.payrollService.findAllWorkRates();
    }
    findActiveWorkRates() {
        return this.payrollService.findActiveWorkRates();
    }
    findWorkRate(productTypeId, stage) {
        return this.payrollService.findWorkRate(productTypeId, stage);
    }
    createWorkRate(dto) {
        return this.payrollService.createWorkRate(dto);
    }
    updateWorkRate(id, dto) {
        return this.payrollService.updateWorkRate(id, dto);
    }
    deleteWorkRate(id) {
        return this.payrollService.deleteWorkRate(id);
    }
    getPenaltyAmounts() {
        return { amounts: constants_1.PENALTY_AMOUNTS };
    }
    findAllPenalties(userId, startDate, endDate, includeCancelled) {
        return this.payrollService.findAllPenalties({
            userId,
            startDate,
            endDate,
            includeCancelled: includeCancelled === 'true',
        });
    }
    createPenalty(dto, req) {
        return this.payrollService.createPenalty(dto, req.user.userId);
    }
    updatePenalty(id, dto) {
        return this.payrollService.updatePenalty(id, dto);
    }
    cancelPenalty(id, dto, req) {
        return this.payrollService.cancelPenalty(id, req.user.userId, dto.notes);
    }
    findAllManagerCommissions() {
        return this.payrollService.findAllManagerCommissions();
    }
    findManagerCommission(userId) {
        return this.payrollService.findManagerCommission(userId);
    }
    createManagerCommission(dto) {
        return this.payrollService.createManagerCommission(dto);
    }
    updateManagerCommission(id, dto) {
        return this.payrollService.updateManagerCommission(id, dto);
    }
    deleteManagerCommission(id) {
        return this.payrollService.deleteManagerCommission(id);
    }
    findAllPayrollPeriods(userId, status, periodStart, periodEnd) {
        return this.payrollService.findAllPayrollPeriods({
            userId,
            status,
            periodStart,
            periodEnd,
        });
    }
    findPayrollPeriod(id) {
        return this.payrollService.findPayrollPeriod(id);
    }
    calculatePayroll(dto) {
        return this.payrollService.calculatePayrollForAll(dto);
    }
    approvePayrollPeriod(id, body, req) {
        return this.payrollService.approvePayrollPeriod(id, req.user.userId, body.notes);
    }
    markPayrollAsPaid(id, body, req) {
        return this.payrollService.markPayrollAsPaid(id, req.user.userId, body.notes);
    }
    cancelPayrollPeriod(id) {
        return this.payrollService.cancelPayrollPeriod(id);
    }
    deletePayrollPeriod(id) {
        return this.payrollService.deletePayrollPeriod(id);
    }
    findWorkLogs(userId, productTypeId, stage, startDate, endDate, unassigned) {
        return this.payrollService.findWorkLogs({
            userId,
            productTypeId,
            stage,
            startDate,
            endDate,
            unassigned: unassigned === 'true',
        });
    }
    getPayrollSummary(periodStart, periodEnd) {
        return this.payrollService.getPayrollSummary(periodStart, periodEnd);
    }
    getWorkerStats(startDate, endDate) {
        return this.payrollService.getWorkerStats(startDate, endDate);
    }
};
exports.PayrollController = PayrollController;
__decorate([
    (0, common_1.Get)('my-earnings'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getMyEarnings", null);
__decorate([
    (0, common_1.Get)('my-earnings/today'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getMyEarningsToday", null);
__decorate([
    (0, common_1.Get)('work-rates'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "findAllWorkRates", null);
__decorate([
    (0, common_1.Get)('work-rates/active'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "findActiveWorkRates", null);
__decorate([
    (0, common_1.Get)('work-rates/:productTypeId/:stage'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Param)('productTypeId')),
    __param(1, (0, common_1.Param)('stage')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "findWorkRate", null);
__decorate([
    (0, common_1.Post)('work-rates'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateWorkRateDto]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "createWorkRate", null);
__decorate([
    (0, common_1.Put)('work-rates/:id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateWorkRateDto]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "updateWorkRate", null);
__decorate([
    (0, common_1.Delete)('work-rates/:id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "deleteWorkRate", null);
__decorate([
    (0, common_1.Get)('penalties/amounts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "getPenaltyAmounts", null);
__decorate([
    (0, common_1.Get)('penalties'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER', 'WAREHOUSE'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('includeCancelled')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "findAllPenalties", null);
__decorate([
    (0, common_1.Post)('penalties'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER', 'WAREHOUSE'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreatePenaltyDto, Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "createPenalty", null);
__decorate([
    (0, common_1.Put)('penalties/:id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdatePenaltyDto]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "updatePenalty", null);
__decorate([
    (0, common_1.Post)('penalties/:id/cancel'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CancelPenaltyDto, Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "cancelPenalty", null);
__decorate([
    (0, common_1.Get)('commissions'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "findAllManagerCommissions", null);
__decorate([
    (0, common_1.Get)('commissions/user/:userId'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "findManagerCommission", null);
__decorate([
    (0, common_1.Post)('commissions'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateManagerCommissionDto]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "createManagerCommission", null);
__decorate([
    (0, common_1.Put)('commissions/:id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateManagerCommissionDto]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "updateManagerCommission", null);
__decorate([
    (0, common_1.Delete)('commissions/:id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "deleteManagerCommission", null);
__decorate([
    (0, common_1.Get)('periods'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('periodStart')),
    __param(3, (0, common_1.Query)('periodEnd')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "findAllPayrollPeriods", null);
__decorate([
    (0, common_1.Get)('periods/:id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "findPayrollPeriod", null);
__decorate([
    (0, common_1.Post)('calculate'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CalculatePayrollDto]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "calculatePayroll", null);
__decorate([
    (0, common_1.Post)('periods/:id/approve'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "approvePayrollPeriod", null);
__decorate([
    (0, common_1.Post)('periods/:id/pay'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "markPayrollAsPaid", null);
__decorate([
    (0, common_1.Post)('periods/:id/cancel'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "cancelPayrollPeriod", null);
__decorate([
    (0, common_1.Delete)('periods/:id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "deletePayrollPeriod", null);
__decorate([
    (0, common_1.Get)('work-logs'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('productTypeId')),
    __param(2, (0, common_1.Query)('stage')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __param(5, (0, common_1.Query)('unassigned')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "findWorkLogs", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Query)('periodStart')),
    __param(1, (0, common_1.Query)('periodEnd')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "getPayrollSummary", null);
__decorate([
    (0, common_1.Get)('worker-stats'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "getWorkerStats", null);
exports.PayrollController = PayrollController = __decorate([
    (0, common_1.Controller)('payroll'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService])
], PayrollController);
//# sourceMappingURL=payroll.controller.js.map