import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrderSourceDto, UpdateOrderSourceDto } from "./dto";

@Injectable()
export class OrderSourcesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.orderSource.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });
  }

  async findActive() {
    return this.prisma.orderSource.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
  }

  async findOne(id: string) {
    const source = await this.prisma.orderSource.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!source) {
      throw new NotFoundException(`Источник заказа с ID ${id} не найден`);
    }

    return source;
  }

  async findByCode(code: string) {
    return this.prisma.orderSource.findUnique({
      where: { code },
    });
  }

  async create(dto: CreateOrderSourceDto) {
    // Проверяем уникальность name и code
    const existingByName = await this.prisma.orderSource.findUnique({
      where: { name: dto.name },
    });
    if (existingByName) {
      throw new ConflictException(
        `Источник с названием "${dto.name}" уже существует`,
      );
    }

    const existingByCode = await this.prisma.orderSource.findUnique({
      where: { code: dto.code },
    });
    if (existingByCode) {
      throw new ConflictException(
        `Источник с кодом "${dto.code}" уже существует`,
      );
    }

    return this.prisma.orderSource.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateOrderSourceDto) {
    const source = await this.findOne(id);

    // Проверяем уникальность name
    if (dto.name && dto.name !== source.name) {
      const existingByName = await this.prisma.orderSource.findUnique({
        where: { name: dto.name },
      });
      if (existingByName) {
        throw new ConflictException(
          `Источник с названием "${dto.name}" уже существует`,
        );
      }
    }

    // Проверяем уникальность code
    if (dto.code && dto.code !== source.code) {
      const existingByCode = await this.prisma.orderSource.findUnique({
        where: { code: dto.code },
      });
      if (existingByCode) {
        throw new ConflictException(
          `Источник с кодом "${dto.code}" уже существует`,
        );
      }
    }

    return this.prisma.orderSource.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const source = await this.findOne(id);

    if (source._count.orders > 0) {
      throw new BadRequestException(
        `Нельзя удалить источник, к которому привязаны заказы (${source._count.orders} шт.)`,
      );
    }

    await this.prisma.orderSource.delete({ where: { id } });

    return { success: true };
  }

  // Инициализация источников по умолчанию
  async initializeDefaultSources() {
    const defaultSources = [
      {
        name: "Авито",
        code: "AVITO",
        color: "#00AAFF",
        icon: "avito",
        order: 1,
      },
      {
        name: "Инстаграм",
        code: "INSTAGRAM",
        color: "#E4405F",
        icon: "instagram",
        order: 2,
      },
      {
        name: "Сайт",
        code: "WEBSITE",
        color: "#4CAF50",
        icon: "globe",
        order: 3,
      },
      {
        name: "Телефон",
        code: "PHONE",
        color: "#2196F3",
        icon: "phone",
        order: 4,
      },
      {
        name: "WhatsApp",
        code: "WHATSAPP",
        color: "#25D366",
        icon: "whatsapp",
        order: 5,
      },
      {
        name: "Telegram",
        code: "TELEGRAM",
        color: "#0088CC",
        icon: "telegram",
        order: 6,
      },
      {
        name: "Личный визит",
        code: "VISIT",
        color: "#FF9800",
        icon: "user",
        order: 7,
      },
      {
        name: "Рекомендация",
        code: "REFERRAL",
        color: "#9C27B0",
        icon: "users",
        order: 8,
      },
    ];

    for (const source of defaultSources) {
      const existing = await this.prisma.orderSource.findUnique({
        where: { code: source.code },
      });

      if (!existing) {
        await this.prisma.orderSource.create({ data: source });
      }
    }

    return { success: true, message: "Источники заказов инициализированы" };
  }
}
