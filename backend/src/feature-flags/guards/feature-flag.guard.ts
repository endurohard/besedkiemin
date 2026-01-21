import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_FLAG_KEY } from '../decorators/feature-flag.decorator';
import { FeatureFlagsService } from '../feature-flags.service';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  private readonly logger = new Logger(FeatureFlagGuard.name);

  constructor(
    private reflector: Reflector,
    private featureFlagsService: FeatureFlagsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFlag = this.reflector.getAllAndOverride<string>(FEATURE_FLAG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Если декоратор не указан, разрешаем доступ
    if (!requiredFlag) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // SUPER_ADMIN всегда имеет доступ, даже если функция отключена
    if (user?.roleCode === 'SUPER_ADMIN') {
      return true;
    }

    // Проверяем, включена ли функция
    const isEnabled = await this.featureFlagsService.isEnabled(requiredFlag);

    if (!isEnabled) {
      this.logger.warn(
        `Feature "${requiredFlag}" is disabled. Access denied for user ${user?.userId || 'anonymous'}`,
      );
      throw new ForbiddenException(`Функция "${requiredFlag}" временно отключена`);
    }

    return true;
  }
}
