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
exports.CreateContactRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateContactRequestDto {
}
exports.CreateContactRequestDto = CreateContactRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Имя клиента" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContactRequestDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Телефон клиента" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContactRequestDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Email клиента", required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateContactRequestDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Сообщение" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContactRequestDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "ID товара (если запрос о конкретном товаре)",
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContactRequestDto.prototype, "productId", void 0);
//# sourceMappingURL=create-contact-request.dto.js.map