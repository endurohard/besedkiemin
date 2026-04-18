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
exports.TasksController = void 0;
const common_1 = require("@nestjs/common");
const tasks_service_1 = require("./tasks.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
let TasksController = class TasksController {
    constructor(tasksService) {
        this.tasksService = tasksService;
    }
    async getMyTasks(req) {
        return this.tasksService.getMyTasks(req.user.userId);
    }
    async getDefects(req) {
        return this.tasksService.getDefectsWithPhotos(req.user.userId);
    }
    async getUnacceptedDefectsCount(req) {
        return this.tasksService.getUnacceptedDefectsCount(req.user.userId);
    }
    async acceptDefectRework(productId, req) {
        return this.tasksService.acceptDefectRework(productId, req.user.userId);
    }
    async getDepartmentWorkers(req) {
        return this.tasksService.getDepartmentWorkers(req.user.userId);
    }
    async getDepartmentTasks(req) {
        return this.tasksService.getDepartmentTasks(req.user.userId);
    }
    async acceptTask(id, selectedUserId, quantity, req) {
        const workerId = selectedUserId || req.user.userId;
        return this.tasksService.acceptTask(id, workerId, req.user.userId, quantity);
    }
    async completeTask(id, notes, quantity, req) {
        return this.tasksService.completeTask(id, req.user.userId, notes, quantity);
    }
    async passTask(id, req) {
        return this.tasksService.passTask(id, req.user.userId);
    }
    async rejectTask(id, notes, quantity, defectPhotoUrl, requestPhoto, returnToStage, penaltyAmount, req) {
        return this.tasksService.rejectTask(id, req.user.userId, notes, quantity, defectPhotoUrl, requestPhoto, returnToStage, penaltyAmount);
    }
    async approveTask(id, quantity, req) {
        return this.tasksService.approveTask(id, req.user.userId, quantity);
    }
    async updateTaskQuantity(id, quantity, req) {
        return this.tasksService.updateTaskQuantity(id, req.user.userId, quantity);
    }
};
exports.TasksController = TasksController;
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить мои ежедневные задачи' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "getMyTasks", null);
__decorate([
    (0, common_1.Get)('defects'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить все браки с фото' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "getDefects", null);
__decorate([
    (0, common_1.Get)('defects/unaccepted/count'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить количество непринятых браков (для маляра)' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "getUnacceptedDefectsCount", null);
__decorate([
    (0, common_1.Post)('defects/:productId/accept'),
    (0, swagger_1.ApiOperation)({ summary: 'Принять брак на доработку (для маляра)' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "acceptDefectRework", null);
__decorate([
    (0, common_1.Get)('department-workers'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить сотрудников своего отдела' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "getDepartmentWorkers", null);
__decorate([
    (0, common_1.Get)('department-tasks'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить задачи отдела (принятые другими сотрудниками)' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "getDepartmentTasks", null);
__decorate([
    (0, common_1.Post)(':id/accept'),
    (0, swagger_1.ApiOperation)({ summary: 'Принять задачу в работу' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('selectedUserId')),
    __param(2, (0, common_1.Body)('quantity')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "acceptTask", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Завершить задачу' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('notes')),
    __param(2, (0, common_1.Body)('quantity')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "completeTask", null);
__decorate([
    (0, common_1.Post)(':id/pass'),
    (0, swagger_1.ApiOperation)({ summary: 'Передать задачу дальше' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "passTask", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Забраковать задачу (только для складиста)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('notes')),
    __param(2, (0, common_1.Body)('quantity')),
    __param(3, (0, common_1.Body)('defectPhotoUrl')),
    __param(4, (0, common_1.Body)('requestPhoto')),
    __param(5, (0, common_1.Body)('returnToStage')),
    __param(6, (0, common_1.Body)('penaltyAmount')),
    __param(7, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, String, Boolean, String, Number, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "rejectTask", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Принять товар на склад (только для складиста)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('quantity')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "approveTask", null);
__decorate([
    (0, common_1.Patch)(':id/quantity'),
    (0, swagger_1.ApiOperation)({ summary: 'Изменить количество в принятой задаче' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('quantity')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "updateTaskQuantity", null);
exports.TasksController = TasksController = __decorate([
    (0, swagger_1.ApiTags)('tasks'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('tasks'),
    __metadata("design:paramtypes", [tasks_service_1.TasksService])
], TasksController);
//# sourceMappingURL=tasks.controller.js.map