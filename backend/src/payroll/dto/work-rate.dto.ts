import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, Min } from 'class-validator';
import { ProductionStage } from '@prisma/client';

export class CreateWorkRateDto {
  @IsString()
  productTypeId: string;

  @IsEnum(ProductionStage)
  stage: ProductionStage;

  @IsOptional()
  @IsString()
  workflowStageId?: string;

  @IsNumber()
  @Min(0)
  pricePerUnit: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateWorkRateDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerUnit?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
