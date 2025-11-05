import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('production/overview')
  @ApiOperation({ summary: 'Общая статистика производства (только OWNER)' })
  getProductionOverview() {
    return this.analyticsService.getProductionOverview();
  }

  @Get('users/performance')
  @ApiOperation({ summary: 'Производительность сотрудников (только OWNER)' })
  getUserPerformance() {
    return this.analyticsService.getUserPerformance();
  }

  @Get('quality/stats')
  @ApiOperation({ summary: 'Статистика проверки качества (только OWNER)' })
  getQualityStats() {
    return this.analyticsService.getQualityStats();
  }

  @Get('products/types')
  @ApiOperation({ summary: 'Статистика по типам продуктов (только OWNER)' })
  getProductTypeStats() {
    return this.analyticsService.getProductTypeStats();
  }

  @Get('performance/summary')
  @ApiOperation({ summary: 'Сводка производительности за период (только OWNER)' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Дата начала периода (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Дата окончания периода (ISO 8601)' })
  getPerformanceSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getPerformanceSummary(start, end);
  }

  @Get('full-cycle')
  @ApiOperation({ summary: 'Полная аналитика цикла: от заказа до доставки (только OWNER)' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Дата начала периода (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Дата окончания периода (ISO 8601)' })
  getFullCycleAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getFullCycleAnalytics(start, end);
  }
}
