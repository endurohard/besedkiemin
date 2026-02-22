/**
 * Application-wide constants
 */

import { ProductionStage } from '@prisma/client';

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  EXPORT_MAX_SIZE: 10000,
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_EXTENSIONS: /\.(jpg|jpeg|png|gif)$/,
  UPLOAD_DIR: './uploads',
} as const;

// Authentication
export const AUTH = {
  BCRYPT_SALT_ROUNDS: 10,
  LOGIN_CODE_EXPIRY_MS: 5 * 60 * 1000, // 5 minutes
  LOGIN_CODE_LENGTH: 6,
} as const;

// Telegram
export const TELEGRAM = {
  PARSE_MODE: 'HTML' as const,
  PHOTO_REQUEST_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
} as const;

// Rate Limiting (Kong handles this, but keeping for reference)
export const RATE_LIMIT = {
  REQUESTS_PER_MINUTE: 100,
  REQUESTS_PER_HOUR: 1000,
} as const;

// Order Number Generation
export const ORDER = {
  PREFIX: 'ORD',
  WEB_PREFIX: 'WEB',
  NUMBER_PADDING: 3,
  WEB_NUMBER_PADDING: 6,
} as const;

// System Role Codes
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  DESIGNER: 'DESIGNER',
  PREPARER: 'PREPARER',
  PAINTER: 'PAINTER',
  SEWER: 'SEWER',
  ASSEMBLER: 'ASSEMBLER',
  WAREHOUSE: 'WAREHOUSE',
} as const;

// Role code -> Production stage mapping
export const ROLE_TO_STAGE: Record<string, ProductionStage> = {
  DESIGNER: ProductionStage.DESIGN,
  PREPARER: ProductionStage.PREPARATION,
  PAINTER: ProductionStage.PAINTING,
  SEWER: ProductionStage.SEWING,
  ASSEMBLER: ProductionStage.ASSEMBLY,
  WAREHOUSE: ProductionStage.QUALITY_CHECK,
};

// Production stage -> display name mapping (fallback; prefer WorkflowStage.name from DB)
export const STAGE_TO_NAME: Record<string, string> = {
  [ProductionStage.PENDING]: 'Ожидание',
  [ProductionStage.DESIGN]: 'Проектирование',
  [ProductionStage.PREPARATION]: 'Заготовка',
  [ProductionStage.ASSEMBLY]: 'Сборка',
  [ProductionStage.PAINTING]: 'Покраска',
  [ProductionStage.SEWING]: 'Пошив',
  [ProductionStage.QUALITY_CHECK]: 'Склад',
  [ProductionStage.COMPLETED]: 'Завершено',
};

// Check if a user is a department account (sees all department tasks)
export function isDepartmentAccount(user: { isDepartmentAccount?: boolean }): boolean {
  return user.isDepartmentAccount === true;
}
