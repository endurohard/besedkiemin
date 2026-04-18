import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      this.logger.warn("RolesGuard: No user found in request");
      return false;
    }

    // Получаем код роли
    const userRoleCode = user.roleCode;

    if (!userRoleCode) {
      this.logger.warn(`RolesGuard: User ${user.userId} has no role assigned`);
      return false;
    }

    // SUPER_ADMIN has full access to everything
    if (userRoleCode === "SUPER_ADMIN") {
      return true;
    }

    // OWNER has full access to everything EXCEPT routes that are ONLY for SUPER_ADMIN
    // (i.e., routes where SUPER_ADMIN is the only allowed role)
    const isSuperAdminOnly =
      requiredRoles.length === 1 && requiredRoles[0] === "SUPER_ADMIN";
    if (userRoleCode === "OWNER" && !isSuperAdminOnly) {
      return true;
    }

    // Check if user's role is in the required roles list
    const hasAccess = requiredRoles.includes(userRoleCode);

    if (!hasAccess) {
      this.logger.debug(
        `RolesGuard: Access denied for user ${user.userId} with role ${userRoleCode}. Required: ${requiredRoles.join(", ")}`,
      );
    }

    return hasAccess;
  }
}
