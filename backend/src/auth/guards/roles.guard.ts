import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // SUPER_ADMIN has full access to everything
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // OWNER has full access to everything except SUPER_ADMIN-only routes
    if (user.role === UserRole.OWNER && !requiredRoles.includes(UserRole.SUPER_ADMIN)) {
      return true;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
