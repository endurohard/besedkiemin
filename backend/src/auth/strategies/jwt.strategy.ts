import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { Role } from "@prisma/client";

export interface JwtPayload {
  email: string;
  sub: string;
  role: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role | null;
  roleCode: string | undefined;
  permissions: string[];
  firstName: string;
  lastName: string;
  telegramId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_SECRET"),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Пользователь не найден или неактивен");
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role, // Теперь это объект Role
      roleCode: user.role?.code, // Код роли для быстрого доступа
      permissions: (user.role?.permissions as string[]) || [], // Разрешения
      firstName: user.firstName,
      lastName: user.lastName,
      telegramId: user.telegramId,
    };
  }
}
