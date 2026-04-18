import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CatalogCategoriesService } from "./catalog-categories.service";
import { CreateCatalogCategoryDto } from "./dto/create-catalog-category.dto";
import { UpdateCatalogCategoryDto } from "./dto/update-catalog-category.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";

@ApiTags("Catalog Categories")
@Controller("catalog-categories")
export class CatalogCategoriesController {
  constructor(private readonly categoriesService: CatalogCategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("catalog:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Создать категорию (нужно право catalog:manage)" })
  create(@Body() createDto: CreateCatalogCategoryDto) {
    return this.categoriesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Получить все категории (публичный доступ)" })
  findAll(@Query("includeInactive") includeInactive?: string) {
    return this.categoriesService.findAll(includeInactive === "true");
  }

  @Get(":id")
  @ApiOperation({ summary: "Получить категорию по ID (публичный доступ)" })
  findOne(@Param("id") id: string) {
    return this.categoriesService.findOne(id);
  }

  @Get("slug/:slug")
  @ApiOperation({ summary: "Получить категорию по slug (публичный доступ)" })
  findBySlug(@Param("slug") slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("catalog:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Обновить категорию (нужно право catalog:manage)" })
  update(@Param("id") id: string, @Body() updateDto: UpdateCatalogCategoryDto) {
    return this.categoriesService.update(id, updateDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Удалить категорию (только OWNER)" })
  remove(@Param("id") id: string) {
    return this.categoriesService.remove(id);
  }
}
