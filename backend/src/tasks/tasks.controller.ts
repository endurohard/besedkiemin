import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { ApiBearerAuth, ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("tasks")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get("my")
  @ApiOperation({ summary: "Получить мои ежедневные задачи" })
  async getMyTasks(@Req() req) {
    return this.tasksService.getMyTasks(req.user.userId);
  }

  @Get("defects")
  @ApiOperation({ summary: "Получить все браки с фото" })
  async getDefects(@Req() req) {
    return this.tasksService.getDefectsWithPhotos(req.user.userId);
  }

  @Get("defects/unaccepted/count")
  @ApiOperation({
    summary: "Получить количество непринятых браков (для маляра)",
  })
  async getUnacceptedDefectsCount(@Req() req) {
    return this.tasksService.getUnacceptedDefectsCount(req.user.userId);
  }

  @Post("defects/:productId/accept")
  @ApiOperation({ summary: "Принять брак на доработку (для маляра)" })
  async acceptDefectRework(@Param("productId") productId: string, @Req() req) {
    return this.tasksService.acceptDefectRework(productId, req.user.userId);
  }

  @Get("department-workers")
  @ApiOperation({ summary: "Получить сотрудников своего отдела" })
  async getDepartmentWorkers(@Req() req) {
    return this.tasksService.getDepartmentWorkers(req.user.userId);
  }

  @Get("department-tasks")
  @ApiOperation({
    summary: "Получить задачи отдела (принятые другими сотрудниками)",
  })
  async getDepartmentTasks(@Req() req) {
    return this.tasksService.getDepartmentTasks(req.user.userId);
  }

  @Post(":id/accept")
  @ApiOperation({ summary: "Принять задачу в работу" })
  async acceptTask(
    @Param("id") id: string,
    @Body("selectedUserId") selectedUserId: string,
    @Body("quantity") quantity: number,
    @Req() req,
  ) {
    // Если selectedUserId передан - используем его, иначе текущего пользователя
    const workerId = selectedUserId || req.user.userId;
    return this.tasksService.acceptTask(
      id,
      workerId,
      req.user.userId,
      quantity,
    );
  }

  @Post(":id/complete")
  @ApiOperation({ summary: "Завершить задачу" })
  async completeTask(
    @Param("id") id: string,
    @Body("notes") notes: string,
    @Body("quantity") quantity: number,
    @Req() req,
  ) {
    return this.tasksService.completeTask(id, req.user.userId, notes, quantity);
  }

  @Post(":id/pass")
  @ApiOperation({ summary: "Передать задачу дальше (опц. частичное количество)" })
  async passTask(
    @Param("id") id: string,
    @Body("quantity") quantity: number,
    @Req() req,
  ) {
    return this.tasksService.passTask(id, req.user.userId, quantity);
  }

  @Post(":id/reject")
  @ApiOperation({ summary: "Забраковать задачу (только для складиста)" })
  async rejectTask(
    @Param("id") id: string,
    @Body("notes") notes: string,
    @Body("quantity") quantity: number,
    @Body("defectPhotoUrl") defectPhotoUrl: string,
    @Body("requestPhoto") requestPhoto: boolean,
    @Body("returnToStage") returnToStage: string,
    @Body("penaltyAmount") penaltyAmount: number,
    @Req() req,
  ) {
    return this.tasksService.rejectTask(
      id,
      req.user.userId,
      notes,
      quantity,
      defectPhotoUrl,
      requestPhoto,
      returnToStage,
      penaltyAmount,
    );
  }

  @Post(":id/approve")
  @ApiOperation({ summary: "Принять товар на склад (только для складиста)" })
  async approveTask(
    @Param("id") id: string,
    @Body("quantity") quantity: number,
    @Req() req,
  ) {
    return this.tasksService.approveTask(id, req.user.userId, quantity);
  }

  @Patch(":id/quantity")
  @ApiOperation({ summary: "Изменить количество в принятой задаче" })
  async updateTaskQuantity(
    @Param("id") id: string,
    @Body("quantity") quantity: number,
    @Req() req,
  ) {
    return this.tasksService.updateTaskQuantity(id, req.user.userId, quantity);
  }

  @Get(":id/reassignable-workers")
  @UseGuards(RolesGuard)
  @Roles("MANAGER")
  @ApiOperation({
    summary: "Получить сотрудников, которым можно переназначить задачу",
  })
  async getReassignableWorkers(@Param("id") id: string) {
    return this.tasksService.getReassignableWorkers(id);
  }

  @Patch(":id/reassign")
  @UseGuards(RolesGuard)
  @Roles("MANAGER")
  @ApiOperation({
    summary: "Переназначить задачу другому сотруднику того же отдела",
  })
  async reassignTask(
    @Param("id") id: string,
    @Body("workerId") workerId: string,
    @Req() req,
  ) {
    return this.tasksService.reassignTask(id, workerId, req.user.userId);
  }

  @Post("product/:productId/return-stage")
  @UseGuards(RolesGuard)
  @Roles("OWNER")
  @ApiOperation({
    summary:
      "Вернуть изделие на выбранный этап (OWNER/SUPER_ADMIN). Для исправления ошибочной передачи отделом.",
  })
  async returnProductToStage(
    @Param("productId") productId: string,
    @Body("targetStage") targetStage: string,
    @Req() req,
  ) {
    return this.tasksService.returnProductToStage(
      productId,
      targetStage,
      req.user.userId,
    );
  }
}
