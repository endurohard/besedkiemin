import { PartialType } from "@nestjs/swagger";
import { CreateDepartmentPresetDto } from "./create-department-preset.dto";

export class UpdateDepartmentPresetDto extends PartialType(
  CreateDepartmentPresetDto,
) {}
