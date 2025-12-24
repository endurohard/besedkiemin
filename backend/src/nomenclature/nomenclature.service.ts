import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNomenclatureDto } from './dto/create-nomenclature.dto';
import { UpdateNomenclatureDto } from './dto/update-nomenclature.dto';

@Injectable()
export class NomenclatureService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateNomenclatureDto) {
    return this.prisma.nomenclature.create({
      data: createDto,
      include: {
        productType: true,
      },
    });
  }

  async findAll(includeInactive = false) {
    return this.prisma.nomenclature.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        productType: true,
      },
      orderBy: [
        { productType: { name: 'asc' } },
        { name: 'asc' },
      ],
    });
  }

  async findByProductType(productTypeId: string, includeInactive = false) {
    return this.prisma.nomenclature.findMany({
      where: {
        productTypeId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        productType: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const nomenclature = await this.prisma.nomenclature.findUnique({
      where: { id },
      include: {
        productType: true,
      },
    });

    if (!nomenclature) {
      throw new NotFoundException(`Номенклатура с ID "${id}" не найдена`);
    }

    return nomenclature;
  }

  async update(id: string, updateDto: UpdateNomenclatureDto) {
    await this.findOne(id);

    return this.prisma.nomenclature.update({
      where: { id },
      data: updateDto,
      include: {
        productType: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.nomenclature.delete({
      where: { id },
    });
  }

  async toggleActive(id: string) {
    const nomenclature = await this.findOne(id);

    return this.prisma.nomenclature.update({
      where: { id },
      data: { isActive: !nomenclature.isActive },
      include: {
        productType: true,
      },
    });
  }
}
