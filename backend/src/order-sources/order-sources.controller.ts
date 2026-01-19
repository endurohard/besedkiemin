import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OrderSourcesService } from './order-sources.service';
import { CreateOrderSourceDto, UpdateOrderSourceDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('order-sources')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderSourcesController {
  constructor(private readonly orderSourcesService: OrderSourcesService) {}

  // Получить все источники (для настроек)
  @Get()
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER')
  findAll() {
    return this.orderSourcesService.findAll();
  }

  // Получить только активные источники (для формы заказа)
  @Get('active')
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER')
  findActive() {
    return this.orderSourcesService.findActive();
  }

  // Инициализировать источники по умолчанию
  @Post('initialize')
  @Roles('SUPER_ADMIN', 'OWNER')
  initialize() {
    return this.orderSourcesService.initializeDefaultSources();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'OWNER', 'MANAGER')
  findOne(@Param('id') id: string) {
    return this.orderSourcesService.findOne(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'OWNER')
  create(@Body() dto: CreateOrderSourceDto) {
    return this.orderSourcesService.create(dto);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'OWNER')
  update(@Param('id') id: string, @Body() dto: UpdateOrderSourceDto) {
    return this.orderSourcesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'OWNER')
  remove(@Param('id') id: string) {
    return this.orderSourcesService.remove(id);
  }
}
