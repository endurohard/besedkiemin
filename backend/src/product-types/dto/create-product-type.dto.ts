import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateProductTypeDto {
  @ApiProperty({ example: "Стол" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "Столы различных типов", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
