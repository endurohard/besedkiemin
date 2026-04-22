import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from "class-validator";

export class CreateDepartmentPresetDto {
  @ApiProperty({ example: "PREPARATION" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9_]+$/u, {
    message: "Код должен состоять из заглавных латинских букв, цифр и _",
  })
  code: string;

  @ApiProperty({ example: "Заготовка" })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: "ID пользователя, от имени которого будет вход" })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: "orange", required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    required: false,
    description: "Новый пароль пользователя (если нужно переназначить)",
  })
  @IsString()
  @IsOptional()
  @MinLength(4)
  newPassword?: string;
}
