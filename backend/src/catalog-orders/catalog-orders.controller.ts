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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogOrdersService } from './catalog-orders.service';
import { CreateCatalogOrderDto } from './dto/create-catalog-order.dto';
import { UpdateCatalogOrderDto } from './dto/update-catalog-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';


@ApiTags('Catalog Orders')
@Controller('catalog-orders')
export class CatalogOrdersController {
  constructor(private readonly ordersService: CatalogOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Создать заказ (публичный доступ)' })
  create(@Body() createDto: CreateCatalogOrderDto) {
    return this.ordersService.create(createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить все заказы (только OWNER/MANAGER)' })
  findAll(@Query('status') status?: string) {
    return this.ordersService.findAll(status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить заказ по ID (только OWNER/MANAGER)' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить заказ (только OWNER/MANAGER)' })
  update(@Param('id') id: string, @Body() updateDto: UpdateCatalogOrderDto) {
    return this.ordersService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить заказ (только OWNER)' })
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  @Post(':id/mark-contacted')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отметить "Связались с клиентом"' })
  markContacted(@Param('id') id: string, @Request() req) {
    return this.ordersService.markContacted(id, req.user.userId);
  }

  @Post(':id/mark-processed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отметить "Оформили заказ" и создать производственный заказ' })
  markProcessed(@Param('id') id: string, @Request() req) {
    return this.ordersService.markProcessed(id, req.user.userId);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отменить заказ с указанием причины' })
  cancelOrder(
    @Param('id') id: string,
    @Body('cancellationReason') cancellationReason: string,
    @Request() req
  ) {
    return this.ordersService.cancelOrder(id, cancellationReason, req.user.userId);
  }
}
