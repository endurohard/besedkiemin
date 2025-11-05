import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, ShipmentStatus } from '@prisma/client';
import { ShipmentsService } from './shipments.service';

@ApiTags('Shipments')
@Controller('shipments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Создать отгрузку (списать товары со склада)' })
  async createShipment(
    @Body('items') items: Array<{ inventoryItemId: string; quantity: number }>,
    @Body('customerName') customerName: string,
    @Body('customerPhone') customerPhone: string,
    @Body('deliveryAddress') deliveryAddress: string,
    @Body('deliveryDate') deliveryDate: Date,
    @Body('notes') notes: string,
    @Req() req
  ) {
    return this.shipmentsService.createShipment(req.user.userId, {
      items,
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryDate,
      notes,
    });
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Получить все отгрузки' })
  getAllShipments(@Req() req) {
    return this.shipmentsService.getAllShipments(req.user.userId);
  }

  @Get('status/:status')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Получить отгрузки по статусу' })
  getShipmentsByStatus(@Param('status') status: ShipmentStatus, @Req() req) {
    return this.shipmentsService.getShipmentsByStatus(req.user.userId, status);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Получить детали отгрузки' })
  getShipment(@Param('id') id: string) {
    return this.shipmentsService.getShipment(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Обновить статус отгрузки' })
  updateShipmentStatus(
    @Param('id') id: string,
    @Body('status') status: ShipmentStatus,
    @Req() req
  ) {
    return this.shipmentsService.updateShipmentStatus(id, req.user.userId, status);
  }

  @Post(':id/cancel')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Отменить отгрузку (вернуть товар на склад)' })
  cancelShipment(@Param('id') id: string, @Req() req) {
    return this.shipmentsService.cancelShipment(id, req.user.userId);
  }

  @Get(':id/waybill')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Получить данные для путевого листа' })
  getWaybillData(@Param('id') id: string) {
    return this.shipmentsService.getWaybillData(id);
  }
}
