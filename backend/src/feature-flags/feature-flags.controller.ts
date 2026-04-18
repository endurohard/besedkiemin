import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { FeatureFlagsService } from "./feature-flags.service";
import { UpdateFeatureFlagDto } from "./dto/update-feature-flag.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("feature-flags")
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  // Публичный эндпоинт - получить состояние всех флагов
  // Используется фронтендом для определения доступных функций
  @Get("public")
  async getPublicFlags() {
    return this.featureFlagsService.getEnabledFlags();
  }

  // Получить все feature flags (только для SUPER_ADMIN)
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN")
  async findAll() {
    return this.featureFlagsService.findAll();
  }

  // Получить конкретный флаг по ключу
  @Get(":key")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN")
  async findByKey(@Param("key") key: string) {
    return this.featureFlagsService.findByKey(key);
  }

  // Обновить флаг
  @Patch(":key")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN")
  async update(
    @Param("key") key: string,
    @Body() updateDto: UpdateFeatureFlagDto,
  ) {
    return this.featureFlagsService.update(key, updateDto);
  }

  // Переключить состояние флага (toggle)
  @Post(":key/toggle")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN")
  async toggle(@Param("key") key: string) {
    return this.featureFlagsService.toggle(key);
  }

  // Массовое обновление флагов
  @Post("bulk-update")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN")
  async bulkUpdate(@Body() updates: { key: string; isEnabled: boolean }[]) {
    return this.featureFlagsService.bulkUpdate(updates);
  }
}
