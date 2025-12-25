import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Получаем код роли (теперь user.roleCode содержит код роли)
    const userRoleCode = user.roleCode;

    // SUPER_ADMIN has full access to everything
    if (userRoleCode === 'SUPER_ADMIN') {
      return true;
    }

    // OWNER has full access to everything except SUPER_ADMIN-only routes
    if (userRoleCode === 'OWNER' && !requiredRoles.includes('SUPER_ADMIN')) {
      return true;
    }

    return requiredRoles.some((role) => userRoleCode === role);
  }
}
