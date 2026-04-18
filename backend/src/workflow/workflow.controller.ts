import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { WorkflowService } from "./workflow.service";
import { CreateWorkflowStageDto } from "./dto/create-workflow-stage.dto";
import { UpdateWorkflowStageDto } from "./dto/update-workflow-stage.dto";
import { ReorderWorkflowStagesDto } from "./dto/reorder-workflow-stages.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("workflow")
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  // Получить все этапы (доступно всем авторизованным)
  @Get()
  findAll() {
    return this.workflowService.findAll();
  }

  // Получить активные этапы
  @Get("active")
  findActive() {
    return this.workflowService.findActive();
  }

  // Получить один этап
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.workflowService.findOne(id);
  }

  // Создать этап (только для владельца)
  @Post()
  @Roles("OWNER")
  create(@Body() createWorkflowStageDto: CreateWorkflowStageDto) {
    return this.workflowService.create(createWorkflowStageDto);
  }

  // Обновить этап (только для владельца)
  @Patch(":id")
  @Roles("OWNER")
  update(
    @Param("id") id: string,
    @Body() updateWorkflowStageDto: UpdateWorkflowStageDto,
  ) {
    return this.workflowService.update(id, updateWorkflowStageDto);
  }

  // Удалить этап (только для владельца)
  @Delete(":id")
  @Roles("OWNER")
  remove(@Param("id") id: string) {
    return this.workflowService.remove(id);
  }

  // Изменить порядок этапов (только для владельца)
  @Post("reorder")
  @Roles("OWNER")
  reorder(@Body() reorderWorkflowStagesDto: ReorderWorkflowStagesDto) {
    return this.workflowService.reorder(reorderWorkflowStagesDto);
  }

  // Инициализировать workflow по умолчанию (только для владельца)
  @Post("initialize")
  @Roles("OWNER")
  initializeDefaultWorkflow() {
    return this.workflowService.initializeDefaultWorkflow();
  }

  // Получить следующий этап
  @Get(":id/next")
  getNextStage(@Param("id") id: string) {
    return this.workflowService.getNextStage(id);
  }

  // Получить предыдущий этап
  @Get(":id/previous")
  getPreviousStage(@Param("id") id: string) {
    return this.workflowService.getPreviousStage(id);
  }
}
