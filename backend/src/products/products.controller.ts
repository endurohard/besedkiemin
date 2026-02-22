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
  Request,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProductionStage } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Создать новый продукт (только менеджер)' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все продукты с фильтрами' })
  @ApiQuery({ name: 'orderId', required: false, description: 'Фильтр по ID заказа' })
  @ApiQuery({ name: 'stage', required: false, enum: ProductionStage, description: 'Фильтр по этапу' })
  findAll(
    @Query('orderId') orderId?: string,
    @Query('stage') stage?: ProductionStage,
  ) {
    return this.productsService.findAll({ orderId, stage });
  }

  @Get('stage/:stage')
  @Roles('MANAGER', 'OWNER', 'SUPER_ADMIN', 'WAREHOUSE')
  @ApiOperation({ summary: 'Получить продукты на определенном этапе' })
  getByStage(@Param('stage') stage: ProductionStage) {
    return this.productsService.getProductsByStage(stage);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить продукт по ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/history')
  @Roles('MANAGER', 'OWNER', 'SUPER_ADMIN', 'WAREHOUSE')
  @ApiOperation({ summary: 'Получить историю прохождения продукта по этапам' })
  getHistory(@Param('id') id: string) {
    return this.productsService.getProductHistory(id);
  }

  @Patch(':id')
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Обновить продукт (только менеджер)' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Переместить продукт на следующий этап' })
  moveToStage(
    @Param('id') id: string,
    @Body() body: { stage: ProductionStage; notes?: string },
    @Request() req,
  ) {
    return this.productsService.moveToStage(
      id,
      body.stage,
      req.user.userId,
      body.notes,
    );
  }

  @Delete(':id')
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Удалить продукт (только менеджер)' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
