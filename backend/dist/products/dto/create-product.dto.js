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
exports.CreateProductDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateProductDto {
}
exports.CreateProductDto = CreateProductDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Обеденный стол" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-product-type-id" }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "productTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Стол из массива дуба 180x90см", required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "180x90x75 см", required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "dimensions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "/uploads/schema-123456.jpg", required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "schemaImageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-order-id" }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2024-12-31", required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], CreateProductDto.prototype, "deadline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: true,
        required: false,
        description: "Требуется ли пошив (null = из типа продукта)",
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateProductDto.prototype, "requiresSewing", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "Орех, код 906",
        required: false,
        description: "Цвет/покрытие (для маляра)",
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "color", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "Экокожа черная",
        required: false,
        description: "Материал обшивки (ткань/кожа) - если указан, автоматически включается пошив",
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "upholsteryMaterial", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "uuid-nomenclature-id",
        required: false,
        description: "ID номенклатуры (конкретная модель изделия)",
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "nomenclatureId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "uuid-worker-id",
        required: false,
        description: "ID работника для назначения на первый этап",
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "assignedWorkerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Назначения работников на этапы: {"PREPARATION": "userId", "PAINTING": "userId", ...}',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateProductDto.prototype, "stageAssignments", void 0);
//# sourceMappingURL=create-product.dto.js.map