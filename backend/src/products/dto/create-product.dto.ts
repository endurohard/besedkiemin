import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

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
}
