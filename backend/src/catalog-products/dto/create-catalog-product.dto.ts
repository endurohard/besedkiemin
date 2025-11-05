import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsNumber,
  IsArray,
  IsObject,
} from 'class-validator';

export class CreateCatalogProductDto {
  @ApiProperty({ description: 'Название товара' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'URL-slug для SEO' })
  @IsString()
  slug: string;

  @ApiProperty({ description: 'Полное описание товара', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Краткое описание', required: false })
  @IsOptional()
  @IsString()
  shortDesc?: string;

  @ApiProperty({
    description: 'Массив URL изображений',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'Размеры', required: false })
  @IsOptional()
  @IsString()
  dimensions?: string;

  @ApiProperty({ description: 'Материал', required: false })
  @IsOptional()
  @IsString()
  material?: string;

  @ApiProperty({ description: 'Цена', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ description: 'Примечание к цене', required: false })
  @IsOptional()
  @IsString()
  priceNote?: string;

  @ApiProperty({
    description: 'Дополнительные характеристики (JSON)',
    required: false,
  })
  @IsOptional()
  @IsObject()
  features?: any;

  @ApiProperty({ description: 'Meta title для SEO', required: false })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiProperty({ description: 'Meta description для SEO', required: false })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiProperty({ description: 'Meta keywords для SEO', required: false })
  @IsOptional()
  @IsString()
  metaKeywords?: string;

  @ApiProperty({ description: 'Порядок отображения', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ description: 'Активен ли товар', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Рекомендуемый товар', default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({ description: 'ID категории' })
  @IsString()
  categoryId: string;
}
