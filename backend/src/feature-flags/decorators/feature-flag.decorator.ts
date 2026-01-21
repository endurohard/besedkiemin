import { SetMetadata } from '@nestjs/common';

export const FEATURE_FLAG_KEY = 'feature_flag';

/**
 * Декоратор для указания требуемого feature flag для endpoint
 * @param flagKey - ключ feature flag (например: 'catalog_orders', 'chat', 'analytics')
 */
export const RequireFeature = (flagKey: string) => SetMetadata(FEATURE_FLAG_KEY, flagKey);
