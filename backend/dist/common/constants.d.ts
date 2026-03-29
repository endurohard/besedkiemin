import { ProductionStage } from '@prisma/client';
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_PAGE_SIZE: 50;
    readonly MAX_PAGE_SIZE: 100;
    readonly EXPORT_MAX_SIZE: 10000;
};
export declare const FILE_UPLOAD: {
    readonly MAX_FILE_SIZE: number;
    readonly ALLOWED_EXTENSIONS: RegExp;
    readonly UPLOAD_DIR: "./uploads";
};
export declare const AUTH: {
    readonly BCRYPT_SALT_ROUNDS: 10;
    readonly LOGIN_CODE_EXPIRY_MS: number;
    readonly LOGIN_CODE_LENGTH: 6;
};
export declare const TELEGRAM: {
    readonly PARSE_MODE: "HTML";
    readonly PHOTO_REQUEST_TIMEOUT_MS: number;
};
export declare const RATE_LIMIT: {
    readonly REQUESTS_PER_MINUTE: 100;
    readonly REQUESTS_PER_HOUR: 1000;
};
export declare const ORDER: {
    readonly PREFIX: "ORD";
    readonly WEB_PREFIX: "WEB";
    readonly NUMBER_PADDING: 3;
    readonly WEB_NUMBER_PADDING: 6;
};
export declare const SYSTEM_ROLES: {
    readonly SUPER_ADMIN: "SUPER_ADMIN";
    readonly OWNER: "OWNER";
    readonly MANAGER: "MANAGER";
    readonly DESIGNER: "DESIGNER";
    readonly PREPARER: "PREPARER";
    readonly PAINTER: "PAINTER";
    readonly SEWER: "SEWER";
    readonly ASSEMBLER: "ASSEMBLER";
    readonly WAREHOUSE: "WAREHOUSE";
};
export declare const ROLE_TO_STAGE: Record<string, ProductionStage>;
export declare const STAGE_TO_NAME: Record<string, string>;
export declare function isDepartmentAccount(user: {
    isDepartmentAccount?: boolean;
}): boolean;
export declare const PENALTY_AMOUNTS: number[];
