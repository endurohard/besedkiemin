import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NomenclatureService } from './nomenclature.service';
import { CreateNomenclatureDto } from './dto/create-nomenclature.dto';
import { UpdateNomenclatureDto } from './dto/update-nomenclature.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('nomenclature')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NomenclatureController {
  constructor(private readonly nomenclatureService: NomenclatureService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  create(@Body() createDto: CreateNomenclatureDto) {
    return this.nomenclatureService.create(createDto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.nomenclatureService.findAll(includeInactive === 'true');
  }

  @Get('by-type/:productTypeId')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  findByProductType(
    @Param('productTypeId') productTypeId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.nomenclatureService.findByProductType(
      productTypeId,
      includeInactive === 'true',
    );
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.nomenclatureService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() updateDto: UpdateNomenclatureDto) {
    return this.nomenclatureService.update(id, updateDto);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  toggleActive(@Param('id') id: string) {
    return this.nomenclatureService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.nomenclatureService.remove(id);
  }
}
