import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Обеденный стол' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'uuid-product-type-id' })
  @IsUUID()
  @IsNotEmpty()
  productTypeId: string;

  @ApiProperty({ example: 'Стол из массива дуба 180x90см', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: '180x90x75 см', required: false })
  @IsString()
  @IsOptional()
  dimensions?: string;

  @ApiProperty({ example: '/uploads/schema-123456.jpg', required: false })
  @IsString()
  @IsOptional()
  schemaImageUrl?: string;

  @ApiProperty({ example: 'uuid-order-id' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: '2024-12-31', required: false })
  @IsOptional()
  deadline?: Date;

  @ApiProperty({ example: true, required: false, description: 'Требуется ли пошив (null = из типа продукта)' })
  @IsBoolean()
  @IsOptional()
  requiresSewing?: boolean | null;

  @ApiProperty({ example: 'Орех, код 906', required: false, description: 'Цвет/покрытие (для маляра)' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ example: 'Экокожа черная', required: false, description: 'Материал обшивки (ткань/кожа) - если указан, автоматически включается пошив' })
  @IsString()
  @IsOptional()
  upholsteryMaterial?: string;

  @ApiProperty({ example: 'uuid-nomenclature-id', required: false, description: 'ID номенклатуры (конкретная модель изделия)' })
  @IsUUID()
  @IsOptional()
  nomenclatureId?: string;
}
