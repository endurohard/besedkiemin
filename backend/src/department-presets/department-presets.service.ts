import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateDepartmentPresetDto,
  UpdateDepartmentPresetDto,
} from "./dto";
import { AUTH } from "../common/constants";

@Injectable()
export class DepartmentPresetsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.departmentLoginPreset.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            role: { select: { code: true, name: true } },
          },
        },
      },
    });
  }

  // Публичный список (без пароля, только активные)
  async findPublic() {
    const presets = await this.prisma.departmentLoginPreset.findMany({
      where: {
        isActive: true,
        user: { isActive: true },
      },
      orderBy: { sortOrder: "asc" },
      select: {
        code: true,
        label: true,
        color: true,
        sortOrder: true,
      },
    });
    return presets;
  }

  async findByCodeActive(code: string) {
    return this.prisma.departmentLoginPreset.findFirst({
      where: { code, isActive: true },
      include: {
        user: { include: { role: true } },
      },
    });
  }

  async findOne(id: string) {
    const preset = await this.prisma.departmentLoginPreset.findUnique({
      where: { id },
    });
    if (!preset) {
      throw new NotFoundException("Пресет не найден");
    }
    return preset;
  }

  async create(dto: CreateDepartmentPresetDto) {
    const existing = await this.prisma.departmentLoginPreset.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Пресет с кодом "${dto.code}" уже существует`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException("Пользователь не найден");
    }

    // Если указан новый пароль — хешируем и применяем к пользователю
    if (dto.newPassword) {
      const hashed = await bcrypt.hash(
        dto.newPassword,
        AUTH.BCRYPT_SALT_ROUNDS,
      );
      await this.prisma.user.update({
        where: { id: dto.userId },
        data: { password: hashed },
      });
    }

    return this.prisma.departmentLoginPreset.create({
      data: {
        code: dto.code,
        label: dto.label,
        userId: dto.userId,
        color: dto.color ?? "blue",
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateDepartmentPresetDto) {
    const preset = await this.findOne(id);

    if (dto.code && dto.code !== preset.code) {
      const existing = await this.prisma.departmentLoginPreset.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException(
          `Пресет с кодом "${dto.code}" уже существует`,
        );
      }
    }

    if (dto.userId && dto.userId !== preset.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });
      if (!user) {
        throw new NotFoundException("Пользователь не найден");
      }
    }

    // Смена пароля пользователя
    const targetUserId = dto.userId ?? preset.userId;
    if (dto.newPassword) {
      const hashed = await bcrypt.hash(
        dto.newPassword,
        AUTH.BCRYPT_SALT_ROUNDS,
      );
      await this.prisma.user.update({
        where: { id: targetUserId },
        data: { password: hashed },
      });
    }

    const { newPassword, ...presetData } = dto;
    return this.prisma.departmentLoginPreset.update({
      where: { id },
      data: presetData,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.departmentLoginPreset.delete({ where: { id } });
    return { success: true };
  }
}
