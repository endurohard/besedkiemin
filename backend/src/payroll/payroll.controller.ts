import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { PayrollService } from "./payroll.service";
import {
  CreateWorkRateDto,
  UpdateWorkRateDto,
  CreatePenaltyDto,
  UpdatePenaltyDto,
  CancelPenaltyDto,
  CalculatePayrollDto,
  CreateManagerCommissionDto,
  UpdateManagerCommissionDto,
} from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { PayrollStatus, ProductionStage } from "@prisma/client";
import { PENALTY_AMOUNTS } from "../common/constants";

@Controller("payroll")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  // ==================== МОИ ЗАРАБОТКИ (для работников) ====================

  @Get("my-earnings")
  async getMyEarnings(
    @CurrentUser() user: AuthenticatedUser,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.payrollService.getWorkerEarnings(
      user.userId,
      startDate,
      endDate,
    );
  }

  @Get("my-earnings/today")
  async getMyEarningsToday(@CurrentUser() user: AuthenticatedUser) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.payrollService.getWorkerEarnings(
      user.userId,
      today.toISOString(),
      tomorrow.toISOString(),
    );
  }

  // ==================== РАСЦЕНКИ ====================

  @Get("work-rates")
  @Roles("SUPER_ADMIN", "OWNER")
  findAllWorkRates() {
    return this.payrollService.findAllWorkRates();
  }

  @Get("work-rates/active")
  @Roles("SUPER_ADMIN", "OWNER")
  findActiveWorkRates() {
    return this.payrollService.findActiveWorkRates();
  }

  @Get("work-rates/:productTypeId/:stage")
  @Roles("SUPER_ADMIN", "OWNER")
  findWorkRate(
    @Param("productTypeId") productTypeId: string,
    @Param("stage") stage: ProductionStage,
  ) {
    return this.payrollService.findWorkRate(productTypeId, stage);
  }

  @Post("work-rates")
  @Roles("SUPER_ADMIN", "OWNER")
  createWorkRate(@Body() dto: CreateWorkRateDto) {
    return this.payrollService.createWorkRate(dto);
  }

  @Put("work-rates/:id")
  @Roles("SUPER_ADMIN", "OWNER")
  updateWorkRate(@Param("id") id: string, @Body() dto: UpdateWorkRateDto) {
    return this.payrollService.updateWorkRate(id, dto);
  }

  @Delete("work-rates/:id")
  @Roles("SUPER_ADMIN", "OWNER")
  deleteWorkRate(@Param("id") id: string) {
    return this.payrollService.deleteWorkRate(id);
  }

  // ==================== ШТРАФЫ ====================

  @Get("penalties/amounts")
  getPenaltyAmounts() {
    return { amounts: PENALTY_AMOUNTS };
  }

  @Get("penalties")
  @Roles("SUPER_ADMIN", "OWNER", "WAREHOUSE")
  findAllPenalties(
    @Query("userId") userId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("includeCancelled") includeCancelled?: string,
  ) {
    return this.payrollService.findAllPenalties({
      userId,
      startDate,
      endDate,
      includeCancelled: includeCancelled === "true",
    });
  }

  @Post("penalties")
  @Roles("SUPER_ADMIN", "OWNER", "WAREHOUSE")
  createPenalty(@Body() dto: CreatePenaltyDto, @Request() req: any) {
    return this.payrollService.createPenalty(dto, req.user.userId);
  }

  @Put("penalties/:id")
  @Roles("SUPER_ADMIN", "OWNER")
  updatePenalty(@Param("id") id: string, @Body() dto: UpdatePenaltyDto) {
    return this.payrollService.updatePenalty(id, dto);
  }

  @Post("penalties/:id/cancel")
  @Roles("SUPER_ADMIN", "OWNER")
  cancelPenalty(
    @Param("id") id: string,
    @Body() dto: CancelPenaltyDto,
    @Request() req: any,
  ) {
    return this.payrollService.cancelPenalty(id, req.user.userId, dto.notes);
  }

  // ==================== НАСТРОЙКИ КОМИССИИ МЕНЕДЖЕРА ====================

  @Get("commissions")
  @Roles("SUPER_ADMIN", "OWNER")
  findAllManagerCommissions() {
    return this.payrollService.findAllManagerCommissions();
  }

  @Get("commissions/user/:userId")
  @Roles("SUPER_ADMIN", "OWNER")
  findManagerCommission(@Param("userId") userId: string) {
    return this.payrollService.findManagerCommission(userId);
  }

  @Post("commissions")
  @Roles("SUPER_ADMIN", "OWNER")
  createManagerCommission(@Body() dto: CreateManagerCommissionDto) {
    return this.payrollService.createManagerCommission(dto);
  }

  @Put("commissions/:id")
  @Roles("SUPER_ADMIN", "OWNER")
  updateManagerCommission(
    @Param("id") id: string,
    @Body() dto: UpdateManagerCommissionDto,
  ) {
    return this.payrollService.updateManagerCommission(id, dto);
  }

  @Delete("commissions/:id")
  @Roles("SUPER_ADMIN", "OWNER")
  deleteManagerCommission(@Param("id") id: string) {
    return this.payrollService.deleteManagerCommission(id);
  }

  // ==================== РАСЧЕТНЫЕ ПЕРИОДЫ ====================

  @Get("periods")
  @Roles("SUPER_ADMIN", "OWNER")
  findAllPayrollPeriods(
    @Query("userId") userId?: string,
    @Query("status") status?: PayrollStatus,
    @Query("periodStart") periodStart?: string,
    @Query("periodEnd") periodEnd?: string,
  ) {
    return this.payrollService.findAllPayrollPeriods({
      userId,
      status,
      periodStart,
      periodEnd,
    });
  }

  @Get("periods/:id")
  @Roles("SUPER_ADMIN", "OWNER")
  findPayrollPeriod(@Param("id") id: string) {
    return this.payrollService.findPayrollPeriod(id);
  }

  @Post("calculate")
  @Roles("SUPER_ADMIN", "OWNER")
  calculatePayroll(@Body() dto: CalculatePayrollDto) {
    return this.payrollService.calculatePayrollForAll(dto);
  }

  @Post("periods/:id/approve")
  @Roles("SUPER_ADMIN", "OWNER")
  approvePayrollPeriod(
    @Param("id") id: string,
    @Body() body: { notes?: string },
    @Request() req: any,
  ) {
    return this.payrollService.approvePayrollPeriod(
      id,
      req.user.userId,
      body.notes,
    );
  }

  @Post("periods/:id/pay")
  @Roles("SUPER_ADMIN", "OWNER")
  markPayrollAsPaid(
    @Param("id") id: string,
    @Body() body: { notes?: string },
    @Request() req: any,
  ) {
    return this.payrollService.markPayrollAsPaid(
      id,
      req.user.userId,
      body.notes,
    );
  }

  @Post("periods/:id/cancel")
  @Roles("SUPER_ADMIN", "OWNER")
  cancelPayrollPeriod(@Param("id") id: string) {
    return this.payrollService.cancelPayrollPeriod(id);
  }

  @Delete("periods/:id")
  @Roles("SUPER_ADMIN", "OWNER")
  deletePayrollPeriod(@Param("id") id: string) {
    return this.payrollService.deletePayrollPeriod(id);
  }

  // ==================== ЖУРНАЛ РАБОТ ====================

  @Post("work-logs/recalculate-zero")
  @Roles("SUPER_ADMIN", "OWNER")
  recalculateZeroWorkLogs() {
    return this.payrollService.recalculateZeroWorkLogs();
  }

  @Get("work-logs")
  @Roles("SUPER_ADMIN", "OWNER")
  findWorkLogs(
    @Query("userId") userId?: string,
    @Query("productTypeId") productTypeId?: string,
    @Query("stage") stage?: ProductionStage,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("unassigned") unassigned?: string,
  ) {
    return this.payrollService.findWorkLogs({
      userId,
      productTypeId,
      stage,
      startDate,
      endDate,
      unassigned: unassigned === "true",
    });
  }

  // ==================== СВОДКА ====================

  @Get("summary")
  @Roles("SUPER_ADMIN", "OWNER")
  getPayrollSummary(
    @Query("periodStart") periodStart: string,
    @Query("periodEnd") periodEnd: string,
    @Query("userId") userId?: string,
  ) {
    return this.payrollService.getPayrollSummary(periodStart, periodEnd, userId);
  }

  // ==================== СТАТИСТИКА РАБОТНИКОВ ====================

  @Get("worker-stats")
  @Roles("SUPER_ADMIN", "OWNER")
  getWorkerStats(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.payrollService.getWorkerStats(startDate, endDate);
  }
}
