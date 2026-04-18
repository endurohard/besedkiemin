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
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';


@Controller('nomenclature')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NomenclatureController {
  constructor(private readonly nomenclatureService: NomenclatureService) {}

  @Post()
  @RequirePermissions('nomenclature:manage')
  create(@Body() createDto: CreateNomenclatureDto) {
    return this.nomenclatureService.create(createDto);
  }

  @Get()
  @RequirePermissions('nomenclature:view')
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.nomenclatureService.findAll(includeInactive === 'true');
  }

  @Get('by-type/:productTypeId')
  @RequirePermissions('nomenclature:view')
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
  @RequirePermissions('nomenclature:view')
  findOne(@Param('id') id: string) {
    return this.nomenclatureService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('nomenclature:manage')
  update(@Param('id') id: string, @Body() updateDto: UpdateNomenclatureDto) {
    return this.nomenclatureService.update(id, updateDto);
  }

  @Patch(':id/toggle-active')
  @RequirePermissions('nomenclature:manage')
  toggleActive(@Param('id') id: string) {
    return this.nomenclatureService.toggleActive(id);
  }

  @Delete(':id')
  @RequirePermissions('nomenclature:manage')
  remove(@Param('id') id: string) {
    return this.nomenclatureService.remove(id);
  }
}
