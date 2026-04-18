import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCatalogCategoryDto } from "./dto/create-catalog-category.dto";
import { UpdateCatalogCategoryDto } from "./dto/update-catalog-category.dto";

@Injectable()
export class CatalogCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateCatalogCategoryDto) {
    // Проверка на уникальность slug
    const existing = await this.prisma.catalogCategory.findUnique({
      where: { slug: createDto.slug },
    });

    if (existing) {
      throw new ConflictException(
        `Категория с slug "${createDto.slug}" уже существует`,
      );
    }

    return this.prisma.catalogCategory.create({
      data: {
        name: createDto.name,
        slug: createDto.slug,
        description: createDto.description,
        imageUrl: createDto.imageUrl,
        order: createDto.order ?? 0,
        isActive: createDto.isActive ?? true,
      },
    });
  }

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };

    return this.prisma.catalogCategory.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { order: "asc" },
          take: 10, // Только первые 10 товаров для списка категорий
        },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.catalogCategory.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Категория с ID ${id} не найдена`);
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.catalogCategory.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Категория с slug "${slug}" не найдена`);
    }

    return category;
  }

  async update(id: string, updateDto: UpdateCatalogCategoryDto) {
    await this.findOne(id); // Проверка существования

    // Если обновляется slug, проверить уникальность
    if (updateDto.slug) {
      const existing = await this.prisma.catalogCategory.findUnique({
        where: { slug: updateDto.slug },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Категория с slug "${updateDto.slug}" уже существует`,
        );
      }
    }

    return this.prisma.catalogCategory.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Проверка существования

    // Проверить, есть ли товары в категории
    const productsCount = await this.prisma.catalogProduct.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      throw new ConflictException(
        `Невозможно удалить категорию: в ней ${productsCount} товар(ов)`,
      );
    }

    return this.prisma.catalogCategory.delete({
      where: { id },
    });
  }
}
