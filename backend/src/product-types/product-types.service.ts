import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductTypeDto } from "./dto/create-product-type.dto";
import { UpdateProductTypeDto } from "./dto/update-product-type.dto";

@Injectable()
export class ProductTypesService {
  constructor(private prisma: PrismaService) {}

  async create(createProductTypeDto: CreateProductTypeDto) {
    // Проверяем, не существует ли уже тип с таким названием
    const existing = await this.prisma.productType.findUnique({
      where: { name: createProductTypeDto.name },
    });

    if (existing) {
      throw new ConflictException(
        "Тип продукта с таким названием уже существует",
      );
    }

    return this.prisma.productType.create({
      data: createProductTypeDto,
    });
  }

  async findAll(includeInactive = false) {
    return this.prisma.productType.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    const productType = await this.prisma.productType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!productType) {
      throw new NotFoundException("Тип продукта не найден");
    }

    return productType;
  }

  async update(id: string, updateProductTypeDto: UpdateProductTypeDto) {
    // Проверяем существование
    await this.findOne(id);

    // Если обновляется название, проверяем уникальность
    if (updateProductTypeDto.name) {
      const existing = await this.prisma.productType.findUnique({
        where: { name: updateProductTypeDto.name },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          "Тип продукта с таким названием уже существует",
        );
      }
    }

    return this.prisma.productType.update({
      where: { id },
      data: updateProductTypeDto,
    });
  }

  async remove(id: string) {
    // Проверяем существование
    const productType = await this.findOne(id);

    // Проверяем, есть ли продукты с этим типом
    const productsCount = await this.prisma.product.count({
      where: { productTypeId: id },
    });

    if (productsCount > 0) {
      throw new ConflictException(
        `Невозможно удалить тип продукта. Существует ${productsCount} продуктов с этим типом`,
      );
    }

    return this.prisma.productType.delete({
      where: { id },
    });
  }

  async toggleActive(id: string) {
    const productType = await this.findOne(id);

    return this.prisma.productType.update({
      where: { id },
      data: { isActive: !productType.isActive },
    });
  }
}
