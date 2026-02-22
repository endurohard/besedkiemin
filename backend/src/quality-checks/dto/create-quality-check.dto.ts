import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { QualityStatus, ProductionStage } from '@prisma/client';

export class CreateQualityCheckDto {
  @ApiProperty({ example: 'uuid-product-id' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ enum: QualityStatus, example: QualityStatus.APPROVED })
  @IsEnum(QualityStatus)
  status: QualityStatus;

  @ApiProperty({ example: 'Царапина на поверхности', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ enum: ProductionStage, required: false, description: 'Этап для возврата при браке' })
  @IsEnum(ProductionStage)
  @IsOptional()
  returnToStage?: ProductionStage;
}
