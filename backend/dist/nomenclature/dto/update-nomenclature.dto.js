"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateNomenclatureDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_nomenclature_dto_1 = require("./create-nomenclature.dto");
class UpdateNomenclatureDto extends (0, mapped_types_1.PartialType)(create_nomenclature_dto_1.CreateNomenclatureDto) {
}
exports.UpdateNomenclatureDto = UpdateNomenclatureDto;
//# sourceMappingURL=update-nomenclature.dto.js.map