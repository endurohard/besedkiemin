import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CallbackService } from "./callback.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Callback Requests")
@Controller("callback-requests")
export class CallbackController {
  constructor(private readonly callbackService: CallbackService) {}

  /**
   * Создать заявку на обратный звонок (публичный эндпоинт)
   */
  @Post()
  @ApiOperation({
    summary: "Создать заявку на обратный звонок (публичный доступ)",
  })
  async create(
    @Body()
    body: {
      name: string;
      phone: string;
      message?: string;
      catalogOrderId?: string;
      preferredTime?: string;
    },
  ) {
    return this.callbackService.create(body);
  }

  /**
   * Получить все заявки (для менеджера)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER", "MANAGER")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Получить все заявки на звонок (OWNER/MANAGER)" })
  async findAll(@Query("status") status?: string) {
    return this.callbackService.findAll(status);
  }

  /**
   * Получить заявку по ID
   */
  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER", "MANAGER")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Получить заявку по ID (OWNER/MANAGER)" })
  async findOne(@Param("id") id: string) {
    return this.callbackService.findOne(id);
  }

  /**
   * Отметить "Связались с клиентом"
   */
  @Post(":id/contacted")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER", "MANAGER")
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отметить "Связались с клиентом" (OWNER/MANAGER)' })
  async markContacted(
    @Param("id") id: string,
    @Body() body: { notes?: string },
    @Request() req,
  ) {
    return this.callbackService.markContacted(id, req.user.userId, body.notes);
  }

  /**
   * Отметить "Завершено"
   */
  @Post(":id/completed")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER", "MANAGER")
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отметить "Завершено" (OWNER/MANAGER)' })
  async markCompleted(
    @Param("id") id: string,
    @Body() body: { notes?: string },
    @Request() req,
  ) {
    return this.callbackService.markCompleted(id, req.user.userId, body.notes);
  }

  /**
   * Отменить заявку
   */
  @Post(":id/cancel")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER", "MANAGER")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Отменить заявку (OWNER/MANAGER)" })
  async cancel(
    @Param("id") id: string,
    @Body() body: { notes?: string },
    @Request() req,
  ) {
    return this.callbackService.cancel(id, req.user.userId, body.notes);
  }

  /**
   * Удалить заявку
   */
  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Удалить заявку (OWNER)" })
  async remove(@Param("id") id: string) {
    return this.callbackService.remove(id);
  }
}
