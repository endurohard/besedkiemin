"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_ROLES = exports.ORDER = exports.RATE_LIMIT = exports.TELEGRAM = exports.AUTH = exports.FILE_UPLOAD = exports.PAGINATION = void 0;
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
//# sourceMappingURL=constants.js.map