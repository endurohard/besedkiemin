import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserEntity } from "./entities/user.entity";
import { AUTH, SYSTEM_ROLES } from "../common/constants";

// Deterministic lookup hash for PIN. HMAC (not plain hash) so that leaking the column
// without PIN_PEPPER still forces 10k^keyspace-scale bruteforce rather than a rainbow lookup.
// Falls back to JWT_SECRET if PIN_PEPPER unset — main.ts already requires one of them in prod.
function computePinLookup(pin: string): string {
  const pepper = process.env.PIN_PEPPER ?? process.env.JWT_SECRET ?? "";
  return crypto.createHmac("sha256", pepper).update(pin).digest("hex");
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    // Auto-generate email if not provided
    if (!createUserDto.email) {
      createUserDto.email = `worker_${Date.now()}@internal`;
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      AUTH.BCRYPT_SALT_ROUNDS,
    );

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        email: createUserDto.email!,
        password: hashedPassword,
      },
    });

    return new UserEntity(user);
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: {
          code: { not: SYSTEM_ROLES.SUPER_ADMIN }, // Скрываем SUPER_ADMIN из списка
        },
      },
      include: { role: true },
    });
    return users.map((user) => new UserEntity(user));
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }

    return new UserEntity(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByEmailWithRole(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    // Проверяем существование пользователя
    await this.findOne(id);

    // Если меняется email, проверяем уникальность
    if (updateUserDto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(
          "Пользователь с таким email уже существует",
        );
      }
    }

    const updateData: any = { ...updateUserDto };

    // Если есть пароль, хешируем его
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(
        updateUserDto.password,
        AUTH.BCRYPT_SALT_ROUNDS,
      );
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return new UserEntity(user);
  }

  async remove(id: string): Promise<void> {
    // Проверяем существование пользователя
    await this.findOne(id);

    await this.prisma.user.delete({
      where: { id },
    });
  }

  async toggleActive(id: string): Promise<UserEntity> {
    const user = await this.findOne(id);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    return new UserEntity(updatedUser);
  }

  // PIN management
  async setPin(id: string, pin: string): Promise<void> {
    await this.findOne(id);
    const hashedPin = await bcrypt.hash(pin, AUTH.BCRYPT_SALT_ROUNDS);
    const pinLookup = computePinLookup(pin);
    await this.prisma.user.update({
      where: { id },
      data: { pin: hashedPin, pinLookup },
    });
  }

  async findByPin(pin: string) {
    // Fast path: индекс по pin_lookup сужает выборку до нескольких кандидатов.
    const pinLookup = computePinLookup(pin);
    const candidates = await this.prisma.user.findMany({
      where: {
        isActive: true,
        pinLookup,
        pin: { not: null },
      },
      include: { role: true },
    });

    for (const user of candidates) {
      if (user.pin && (await bcrypt.compare(pin, user.pin))) {
        return user;
      }
    }

    // Legacy fallback: pin_lookup ещё не заполнен (PIN задан до миграции).
    // По мере того как работники переустанавливают PIN, таких строк не остаётся.
    const legacy = await this.prisma.user.findMany({
      where: {
        isActive: true,
        pinLookup: null,
        pin: { not: null },
      },
      include: { role: true },
    });

    for (const user of legacy) {
      if (user.pin && (await bcrypt.compare(pin, user.pin))) {
        return user;
      }
    }
    return null;
  }
}
