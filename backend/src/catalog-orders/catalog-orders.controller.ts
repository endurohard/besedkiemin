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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить все заказы (SUPER_ADMIN/OWNER/MANAGER)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findAll({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить заказ по ID (SUPER_ADMIN/OWNER/MANAGER)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить заказ (SUPER_ADMIN/OWNER/MANAGER)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdateCatalogOrderDto) {
    return this.ordersService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить заказ (SUPER_ADMIN/OWNER)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.remove(id);
  }

  @Post(':id/mark-contacted')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отметить "Связались с клиентом"' })
  markContacted(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.ordersService.markContacted(id, req.user.userId);
  }

  @Post(':id/mark-processed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отметить "Оформили заказ" и создать производственный заказ' })
  markProcessed(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.ordersService.markProcessed(id, req.user.userId);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отменить заказ с указанием причины' })
  cancelOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('cancellationReason') cancellationReason: string,
    @Request() req
  ) {
    return this.ordersService.cancelOrder(id, cancellationReason, req.user.userId);
  }
}
