import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { CompanySettingsService } from './company-settings.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('company-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanySettingsController {
  constructor(private readonly companySettingsService: CompanySettingsService) {}

  @Get()
  async getSettings() {
    return this.companySettingsService.getSettings();
  }

  @Patch()
  @Roles(UserRole.OWNER)
  async update(@Body() updateDto: UpdateCompanySettingsDto) {
    return this.companySettingsService.update(updateDto);
  }
}
