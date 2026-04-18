import { Controller, Get, Patch, Body, UseGuards } from "@nestjs/common";
import { CompanySettingsService } from "./company-settings.service";
import { UpdateCompanySettingsDto } from "./dto/update-company-settings.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("company-settings")
export class CompanySettingsController {
  constructor(
    private readonly companySettingsService: CompanySettingsService,
  ) {}

  // Публичный эндпоинт для получения настроек (для публичной страницы каталога)
  @Get("public")
  async getPublicSettings() {
    return this.companySettingsService.getSettings();
  }

  // Защищенный эндпоинт для авторизованных пользователей
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getSettings() {
    return this.companySettingsService.getSettings();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER")
  async update(@Body() updateDto: UpdateCompanySettingsDto) {
    return this.companySettingsService.update(updateDto);
  }
}
