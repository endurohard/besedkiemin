import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { DepartmentPresetsService } from "./department-presets.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import {
  CreateDepartmentPresetDto,
  UpdateDepartmentPresetDto,
} from "./dto";

@ApiTags("DepartmentPresets")
@Controller("department-presets")
export class DepartmentPresetsController {
  constructor(private readonly service: DepartmentPresetsService) {}

  // Публичный endpoint — используется на странице входа
  @Get("public")
  findPublic() {
    return this.service.findPublic();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER", "SUPER_ADMIN", "MANAGER")
  @ApiBearerAuth()
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER", "SUPER_ADMIN", "MANAGER")
  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreateDepartmentPresetDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER", "SUPER_ADMIN", "MANAGER")
  @ApiBearerAuth()
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateDepartmentPresetDto,
  ) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER", "SUPER_ADMIN", "MANAGER")
  @ApiBearerAuth()
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
