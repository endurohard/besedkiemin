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
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { OrderStatus } from '@prisma/client';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новый заказ' })
  create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.create(createOrderDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все заказы' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы (начиная с 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество записей на странице (макс. 100)' })
  findAll(
    @Query('status') status?: OrderStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = page ? parseInt(page, 10) : undefined;
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;

    return this.ordersService.findAll({
      status,
      startDate,
      endDate,
      page: parsedPage && !isNaN(parsedPage) ? parsedPage : undefined,
      limit: parsedLimit && !isNaN(parsedLimit) ? parsedLimit : undefined,
    });
  }

  @Get('statistics')
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Получить статистику (только для менеджера)' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ordersService.getStatistics({ startDate, endDate });
  }

  @Get('export')
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Экспорт заказов в Excel (только для менеджера)' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async exportToExcel(
    @Res() res: Response,
    @Query('status') status?: OrderStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ordersService.exportToExcel(res, { status, startDate, endDate });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить заказ по ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить заказ' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить заказ' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.remove(id);
  }
}
