import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCatalogProductDto } from "./dto/create-catalog-product.dto";
import { UpdateCatalogProductDto } from "./dto/update-catalog-product.dto";

@Injectable()
export class CatalogProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateCatalogProductDto) {
    // Проверка на уникальность slug
    const existing = await this.prisma.catalogProduct.findUnique({
      where: { slug: createDto.slug },
    });

    if (existing) {
      throw new ConflictException(
        `Товар с slug "${createDto.slug}" уже существует`,
      );
    }

    // Проверка существования категории
    const category = await this.prisma.catalogCategory.findUnique({
      where: { id: createDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Категория с ID ${createDto.categoryId} не найдена`,
      );
    }

    return this.prisma.catalogProduct.create({
      data: {
        name: createDto.name,
        slug: createDto.slug,
        description: createDto.description,
        shortDesc: createDto.shortDesc,
        images: createDto.images || [],
        dimensions: createDto.dimensions,
        material: createDto.material,
        price: createDto.price,
        priceNote: createDto.priceNote,
        features: createDto.features,
        metaTitle: createDto.metaTitle,
        metaDescription: createDto.metaDescription,
        metaKeywords: createDto.metaKeywords,
        order: createDto.order ?? 0,
        isActive: createDto.isActive ?? true,
        isFeatured: createDto.isFeatured ?? false,
        categoryId: createDto.categoryId,
      },
      include: {
        category: true,
      },
    });
  }

  async findAll(filters?: {
    categoryId?: string;
    isFeatured?: boolean;
    includeInactive?: boolean;
  }) {
    const where: any = {};

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    if (!filters?.includeInactive) {
      where.isActive = true;
    }

    return this.prisma.catalogProduct.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        category: true,
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.catalogProduct.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Товар с ID ${id} не найден`);
    }

    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.catalogProduct.findUnique({
      where: { slug },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Товар с slug "${slug}" не найден`);
    }

    return product;
  }

  async update(id: string, updateDto: UpdateCatalogProductDto) {
    await this.findOne(id); // Проверка существования

    // Если обновляется slug, проверить уникальность
    if (updateDto.slug) {
      const existing = await this.prisma.catalogProduct.findUnique({
        where: { slug: updateDto.slug },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Товар с slug "${updateDto.slug}" уже существует`,
        );
      }
    }

    // Если обновляется категория, проверить её существование
    if (updateDto.categoryId) {
      const category = await this.prisma.catalogCategory.findUnique({
        where: { id: updateDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Категория с ID ${updateDto.categoryId} не найдена`,
        );
      }
    }

    return this.prisma.catalogProduct.update({
      where: { id },
      data: updateDto,
      include: {
        category: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Проверка существования

    return this.prisma.catalogProduct.delete({
      where: { id },
    });
  }

  async getFeatured(limit = 10) {
    return this.prisma.catalogProduct.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      orderBy: { order: "asc" },
      take: limit,
      include: {
        category: true,
      },
    });
  }
}
