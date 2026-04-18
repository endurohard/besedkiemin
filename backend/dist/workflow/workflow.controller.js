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
exports.WorkflowController = void 0;
const common_1 = require("@nestjs/common");
const workflow_service_1 = require("./workflow.service");
const create_workflow_stage_dto_1 = require("./dto/create-workflow-stage.dto");
const update_workflow_stage_dto_1 = require("./dto/update-workflow-stage.dto");
const reorder_workflow_stages_dto_1 = require("./dto/reorder-workflow-stages.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let WorkflowController = class WorkflowController {
    constructor(workflowService) {
        this.workflowService = workflowService;
    }
    findAll() {
        return this.workflowService.findAll();
    }
    findActive() {
        return this.workflowService.findActive();
    }
    findOne(id) {
        return this.workflowService.findOne(id);
    }
    create(createWorkflowStageDto) {
        return this.workflowService.create(createWorkflowStageDto);
    }
    update(id, updateWorkflowStageDto) {
        return this.workflowService.update(id, updateWorkflowStageDto);
    }
    remove(id) {
        return this.workflowService.remove(id);
    }
    reorder(reorderWorkflowStagesDto) {
        return this.workflowService.reorder(reorderWorkflowStagesDto);
    }
    initializeDefaultWorkflow() {
        return this.workflowService.initializeDefaultWorkflow();
    }
    getNextStage(id) {
        return this.workflowService.getNextStage(id);
    }
    getPreviousStage(id) {
        return this.workflowService.getPreviousStage(id);
    }
};
exports.WorkflowController = WorkflowController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WorkflowController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("active"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WorkflowController.prototype, "findActive", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkflowController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)("OWNER"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_workflow_stage_dto_1.CreateWorkflowStageDto]),
    __metadata("design:returntype", void 0)
], WorkflowController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, roles_decorator_1.Roles)("OWNER"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_workflow_stage_dto_1.UpdateWorkflowStageDto]),
    __metadata("design:returntype", void 0)
], WorkflowController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, roles_decorator_1.Roles)("OWNER"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkflowController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)("reorder"),
    (0, roles_decorator_1.Roles)("OWNER"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reorder_workflow_stages_dto_1.ReorderWorkflowStagesDto]),
    __metadata("design:returntype", void 0)
], WorkflowController.prototype, "reorder", null);
__decorate([
    (0, common_1.Post)("initialize"),
    (0, roles_decorator_1.Roles)("OWNER"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WorkflowController.prototype, "initializeDefaultWorkflow", null);
__decorate([
    (0, common_1.Get)(":id/next"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkflowController.prototype, "getNextStage", null);
__decorate([
    (0, common_1.Get)(":id/previous"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkflowController.prototype, "getPreviousStage", null);
exports.WorkflowController = WorkflowController = __decorate([
    (0, common_1.Controller)("workflow"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [workflow_service_1.WorkflowService])
], WorkflowController);
//# sourceMappingURL=workflow.controller.js.map