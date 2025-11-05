import { IsString, IsInt, IsEnum, IsOptional, IsBoolean, Min } from 'class-validator';
import { UserRole, ProductionStage } from '@prisma/client';

export class CreateWorkflowStageDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  order: number;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsEnum(ProductionStage)
  legacyStage?: ProductionStage;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
