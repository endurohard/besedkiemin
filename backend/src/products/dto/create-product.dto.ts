import { ApiProperty } from "@nestjs/swagger";
import { ProductionStage } from "@prisma/client";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";

export class CreateProductDto {
  @ApiProperty({ example: "Обеденный стол" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "uuid-product-type-id" })
  @IsUUID()
  @IsNotEmpty()
  productTypeId: string;

  @ApiProperty({ example: "Стол из массива дуба 180x90см", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: "180x90x75 см", required: false })
  @IsString()
  @IsOptional()
  dimensions?: string;

  @ApiProperty({ example: "/uploads/schema-123456.jpg", required: false })
  @IsString()
  @IsOptional()
  schemaImageUrl?: string;

  @ApiProperty({
    type: [String],
    required: false,
    description: "Галерея фото схем (до 10 штук)",
  })
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsOptional()
  schemaImageUrls?: string[];

  @ApiProperty({ example: "uuid-order-id" })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: "2024-12-31", required: false })
  @IsOptional()
  deadline?: Date;

  @ApiProperty({
    example: true,
    required: false,
    description: "Требуется ли пошив (null = из типа продукта)",
  })
  @IsBoolean()
  @IsOptional()
  requiresSewing?: boolean | null;

  @ApiProperty({
    example: "Орех, код 906",
    required: false,
    description: "Цвет/покрытие (для маляра)",
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({
    example: "Экокожа черная",
    required: false,
    description:
      "Материал обшивки (ткань/кожа) - если указан, автоматически включается пошив",
  })
  @IsString()
  @IsOptional()
  upholsteryMaterial?: string;

  @ApiProperty({
    example: "uuid-nomenclature-id",
    required: false,
    description: "ID номенклатуры (конкретная модель изделия)",
  })
  @IsUUID()
  @IsOptional()
  nomenclatureId?: string;

  @ApiProperty({
    example: false,
    required: false,
    description: "Индивидуальный заказ (помечает позицию как сделанную под клиента)",
  })
  @IsBoolean()
  @IsOptional()
  isCustom?: boolean;

  @ApiProperty({
    example: false,
    required: false,
    description: "Требуется проектирование — позиция стартует на этапе DESIGN перед производством",
  })
  @IsBoolean()
  @IsOptional()
  needsDesign?: boolean;

  @ApiProperty({
    example: "uuid-worker-id",
    required: false,
    description: "ID работника для назначения на первый этап",
  })
  @IsUUID()
  @IsOptional()
  assignedWorkerId?: string;

  @ApiProperty({
    required: false,
    description:
      'Назначения работников на этапы: {"PREPARATION": "userId", "PAINTING": "userId", ...}',
  })
  @IsOptional()
  stageAssignments?: Record<string, string>;

  @ApiProperty({
    enum: ProductionStage,
    required: false,
    description:
      "Стартовая стадия (напр. PAINTING для готовых заготовок). По умолчанию — первая активная стадия workflow.",
  })
  @IsEnum(ProductionStage)
  @IsOptional()
  startStage?: ProductionStage;
}
