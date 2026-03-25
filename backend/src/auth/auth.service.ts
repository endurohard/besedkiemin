import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

type UserWithRole = User & { role: Role | null };
type UserWithoutPassword = Omit<UserWithRole, 'password'>;

// Минимальный интерфейс для login
interface LoginUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: Role | null;
  telegramId?: string | null;
  sipServer?: string | null;
  sipUser?: string | null;
  sipPassword?: string | null;
  sipPort?: number | null;
  sipWsPort?: number | null;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserWithoutPassword | null> {
    const user = await this.usersService.findByEmailWithRole(email);

    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: LoginUser) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role?.code, // Код роли для JWT
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role, // Полный объект роли
        telegramId: user.telegramId,
        sipServer: user.sipServer,
        sipUser: user.sipUser,
        sipPort: user.sipPort,
        sipWsPort: user.sipWsPort,
        // sipPassword убран из ответа для безопасности
      },
    };
  }

  async findUserById(userId: string) {
    return await this.usersService.findOne(userId);
  }

  async validatePin(pin: string) {
    return this.usersService.findByPin(pin);
  }
}
