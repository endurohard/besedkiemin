import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Если permissions не требуются - пропускаем
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.userId) {
      return false;
    }

    // Получаем роль пользователя с permissions
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        role: true,
      },
    });

    if (!dbUser || !dbUser.role) {
      return false;
    }

    const roleCode = dbUser.role.code;
    const userPermissions = (dbUser.role.permissions as string[]) || [];

    // SUPER_ADMIN и OWNER имеют полный доступ
    if (roleCode === "SUPER_ADMIN" || roleCode === "OWNER") {
      return true;
    }

    // Проверяем наличие всех требуемых permissions
    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}
