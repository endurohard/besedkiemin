"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PENALTY_AMOUNTS = exports.STAGE_TO_NAME = exports.ROLE_TO_STAGE = exports.SYSTEM_ROLES = exports.ORDER = exports.RATE_LIMIT = exports.TELEGRAM = exports.AUTH = exports.FILE_UPLOAD = exports.PAGINATION = void 0;
exports.isDepartmentAccount = isDepartmentAccount;
const client_1 = require("@prisma/client");
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 100,
    EXPORT_MAX_SIZE: 10000,
};
exports.FILE_UPLOAD = {
    MAX_FILE_SIZE: 5 * 1024 * 1024,
    ALLOWED_EXTENSIONS: /\.(jpg|jpeg|png|gif)$/,
    UPLOAD_DIR: './uploads',
};
exports.AUTH = {
    BCRYPT_SALT_ROUNDS: 10,
    LOGIN_CODE_EXPIRY_MS: 5 * 60 * 1000,
    LOGIN_CODE_LENGTH: 6,
};
exports.TELEGRAM = {
    PARSE_MODE: 'HTML',
    PHOTO_REQUEST_TIMEOUT_MS: 30 * 60 * 1000,
};
exports.RATE_LIMIT = {
    REQUESTS_PER_MINUTE: 100,
    REQUESTS_PER_HOUR: 1000,
};
exports.ORDER = {
    PREFIX: 'ORD',
    WEB_PREFIX: 'WEB',
    NUMBER_PADDING: 3,
    WEB_NUMBER_PADDING: 6,
};
exports.SYSTEM_ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    OWNER: 'OWNER',
    MANAGER: 'MANAGER',
    DESIGNER: 'DESIGNER',
    PREPARER: 'PREPARER',
    PAINTER: 'PAINTER',
    SEWER: 'SEWER',
    ASSEMBLER: 'ASSEMBLER',
    WAREHOUSE: 'WAREHOUSE',
};
exports.ROLE_TO_STAGE = {
    DESIGNER: client_1.ProductionStage.DESIGN,
    PREPARER: client_1.ProductionStage.PREPARATION,
    PAINTER: client_1.ProductionStage.PAINTING,
    SEWER: client_1.ProductionStage.SEWING,
    ASSEMBLER: client_1.ProductionStage.ASSEMBLY,
    WAREHOUSE: client_1.ProductionStage.QUALITY_CHECK,
};
exports.STAGE_TO_NAME = {
    [client_1.ProductionStage.PENDING]: 'Ожидание',
    [client_1.ProductionStage.DESIGN]: 'Проектирование',
    [client_1.ProductionStage.PREPARATION]: 'Заготовка',
    [client_1.ProductionStage.ASSEMBLY]: 'Сборка',
    [client_1.ProductionStage.PAINTING]: 'Покраска',
    [client_1.ProductionStage.SEWING]: 'Пошив',
    [client_1.ProductionStage.QUALITY_CHECK]: 'Склад',
    [client_1.ProductionStage.COMPLETED]: 'Завершено',
};
function isDepartmentAccount(user) {
    return user.isDepartmentAccount === true;
}
exports.PENALTY_AMOUNTS = [200, 400, 600, 800, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];
//# sourceMappingURL=constants.js.map