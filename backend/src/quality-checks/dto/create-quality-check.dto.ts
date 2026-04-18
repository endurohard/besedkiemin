import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsIn,
} from "class-validator";
import { QualityStatus, ProductionStage } from "@prisma/client";
import { PENALTY_AMOUNTS } from "../../common/constants";

export class CreateQualityCheckDto {
  @ApiProperty({ example: "uuid-product-id" })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ enum: QualityStatus, example: QualityStatus.APPROVED })
  @IsEnum(QualityStatus)
  status: QualityStatus;

  @ApiProperty({ example: "Царапина на поверхности", required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    enum: ProductionStage,
    required: false,
    description: "Этап для возврата при браке",
  })
  @IsEnum(ProductionStage)
  @IsOptional()
  returnToStage?: ProductionStage;

  @ApiProperty({
    required: false,
    description: "Сумма штрафа при браке (из предопределённого списка)",
  })
  @IsOptional()
  @IsNumber()
  @IsIn(PENALTY_AMOUNTS, {
    message: "Сумма штрафа должна быть из предопределённого списка",
  })
  penaltyAmount?: number;
}
