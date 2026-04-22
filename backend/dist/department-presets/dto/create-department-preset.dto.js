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
exports.CreateDepartmentPresetDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateDepartmentPresetDto {
}
exports.CreateDepartmentPresetDto = CreateDepartmentPresetDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "PREPARATION" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^[A-Z0-9_]+$/u, {
        message: "Код должен состоять из заглавных латинских букв, цифр и _",
    }),
    __metadata("design:type", String)
], CreateDepartmentPresetDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Заготовка" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDepartmentPresetDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "ID пользователя, от имени которого будет вход" }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateDepartmentPresetDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "orange", required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDepartmentPresetDto.prototype, "color", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateDepartmentPresetDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateDepartmentPresetDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: "Новый пароль пользователя (если нужно переназначить)",
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MinLength)(4),
    __metadata("design:type", String)
], CreateDepartmentPresetDto.prototype, "newPassword", void 0);
//# sourceMappingURL=create-department-preset.dto.js.map