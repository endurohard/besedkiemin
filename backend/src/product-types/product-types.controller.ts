import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProductTypesService } from './product-types.service';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('product-types')
@ApiBearerAuth()
@Controller('product-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductTypesController {
  constructor(private readonly productTypesService: ProductTypesService) {}

  @Post()
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Создать новый тип продукта (только менеджер)' })
  create(@Body() createProductTypeDto: CreateProductTypeDto) {
    return this.productTypesService.create(createProductTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все типы продуктов' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.productTypesService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить тип продукта по ID' })
  findOne(@Param('id') id: string) {
    return this.productTypesService.findOne(id);
  }

  @Patch(':id')
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Обновить тип продукта (только менеджер)' })
  update(@Param('id') id: string, @Body() updateProductTypeDto: UpdateProductTypeDto) {
    return this.productTypesService.update(id, updateProductTypeDto);
  }

  @Post(':id/toggle-active')
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Переключить активность типа продукта (только менеджер)' })
  toggleActive(@Param('id') id: string) {
    return this.productTypesService.toggleActive(id);
  }

  @Delete(':id')
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Удалить тип продукта (только менеджер)' })
  remove(@Param('id') id: string) {
    return this.productTypesService.remove(id);
  }
}
