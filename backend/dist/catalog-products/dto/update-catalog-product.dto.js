"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCatalogProductDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_catalog_product_dto_1 = require("./create-catalog-product.dto");
class UpdateCatalogProductDto extends (0, swagger_1.PartialType)(create_catalog_product_dto_1.CreateCatalogProductDto) {
}
exports.UpdateCatalogProductDto = UpdateCatalogProductDto;
//# sourceMappingURL=update-catalog-product.dto.js.map