import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateContactRequestDto } from "./dto/create-contact-request.dto";
import { UpdateContactRequestDto } from "./dto/update-contact-request.dto";

@Injectable()
export class ContactRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateContactRequestDto) {
    return this.prisma.contactRequest.create({
      data: {
        name: createDto.name,
        phone: createDto.phone,
        email: createDto.email,
        message: createDto.message,
        productId: createDto.productId,
      },
    });
  }

  async findAll(onlyUnprocessed = false) {
    const where = onlyUnprocessed ? { isProcessed: false } : {};

    return this.prisma.contactRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const request = await this.prisma.contactRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Запрос с ID ${id} не найден`);
    }

    return request;
  }

  async update(id: string, updateDto: UpdateContactRequestDto) {
    await this.findOne(id); // Проверка существования

    const data: any = { ...updateDto };

    // Если помечается как обработанный, установить дату
    if (updateDto.isProcessed && updateDto.isProcessed === true) {
      data.processedAt = new Date();
    }

    return this.prisma.contactRequest.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Проверка существования

    return this.prisma.contactRequest.delete({
      where: { id },
    });
  }
}
