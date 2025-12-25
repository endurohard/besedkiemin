import { IsString, IsInt, IsOptional, IsBoolean, Min, IsArray } from 'class-validator';
import { ProductionStage } from '@prisma/client';

export class CreateWorkflowStageDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  order: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[]; // Массив ID ролей для этапа

  @IsOptional()
  legacyStage?: ProductionStage;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
