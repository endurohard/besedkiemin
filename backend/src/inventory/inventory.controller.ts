import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { InventoryService } from './inventory.service';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Добавить товар на склад вручную' })
  createInventoryItem(
    @Body('name') name: string,
    @Body('productTypeId') productTypeId: string,
    @Body('quantity') quantity: number,
    @Body('notes') notes: string,
  ) {
    return this.inventoryService.createInventoryItem({
      name,
      productTypeId,
      quantity,
      notes,
    });
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Получить все складские остатки' })
  @ApiQuery({ name: 'productTypeId', required: false, type: String, description: 'Фильтр по типу продукта' })
  getAllInventory(
    @Query('productTypeId') productTypeId?: string,
  ) {
    return this.inventoryService.getAllInventory({
      productTypeId,
    });
  }

  @Get('summary')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Получить сводку по остаткам (группировка по типам)' })
  getInventorySummary() {
    return this.inventoryService.getInventorySummary();
  }

  @Get('type/:productTypeId')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Получить остатки по типу продукта' })
  getInventoryByType(@Param('productTypeId') productTypeId: string) {
    return this.inventoryService.getInventoryByType(productTypeId);
  }

  @Get('order/:orderId')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Получить остатки по заказу' })
  getInventoryByOrder(@Param('orderId') orderId: string) {
    return this.inventoryService.getInventoryByOrder(orderId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Получить детали складского остатка' })
  getInventoryItem(@Param('id') id: string) {
    return this.inventoryService.getInventoryItem(id);
  }
}
