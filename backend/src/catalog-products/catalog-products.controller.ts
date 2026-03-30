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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogProductsService } from './catalog-products.service';
import { CreateCatalogProductDto } from './dto/create-catalog-product.dto';
import { UpdateCatalogProductDto } from './dto/update-catalog-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';


@ApiTags('Catalog Products')
@Controller('catalog-products')
export class CatalogProductsController {
  constructor(private readonly productsService: CatalogProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать товар (только OWNER/MANAGER)' })
  create(@Body() createDto: CreateCatalogProductDto) {
    return this.productsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все товары (публичный доступ)' })
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.productsService.findAll({
      categoryId,
      isFeatured: isFeatured !== undefined ? isFeatured === 'true' : undefined,
      includeInactive: includeInactive === 'true',
    });
  }

  @Get('featured')
  @ApiOperation({ summary: 'Получить рекомендуемые товары (публичный доступ)' })
  getFeatured(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    return this.productsService.getFeatured(parsedLimit && !isNaN(parsedLimit) ? parsedLimit : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить товар по ID (публичный доступ)' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Получить товар по slug (публичный доступ)' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить товар (только OWNER/MANAGER)' })
  update(@Param('id') id: string, @Body() updateDto: UpdateCatalogProductDto) {
    return this.productsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить товар (только OWNER)' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
