"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateOrderSourceDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_order_source_dto_1 = require("./create-order-source.dto");
class UpdateOrderSourceDto extends (0, mapped_types_1.PartialType)(create_order_source_dto_1.CreateOrderSourceDto) {
}
exports.UpdateOrderSourceDto = UpdateOrderSourceDto;
//# sourceMappingURL=update-order-source.dto.js.map