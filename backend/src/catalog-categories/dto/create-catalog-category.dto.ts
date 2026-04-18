import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsInt, Min } from "class-validator";

export class CreateCatalogCategoryDto {
  @ApiProperty({ description: "Название категории" })
  @IsString()
  name: string;

  @ApiProperty({ description: "URL-slug для SEO" })
  @IsString()
  slug: string;

  @ApiProperty({ description: "Описание категории", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "URL изображения категории", required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: "Порядок отображения", default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ description: "Активна ли категория", default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
