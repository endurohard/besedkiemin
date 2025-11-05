import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, IsOptional, IsInt, Min, Max } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Иван' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Иванов' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.MANAGER })
  @IsEnum(UserRole)
  role: UserRole;

  // SIP телефония (для менеджеров)
  @ApiProperty({ example: 'sip.example.com', required: false, description: 'SIP сервер (для менеджеров)' })
  @IsString()
  @IsOptional()
  sipServer?: string;

  @ApiProperty({ example: 'user123', required: false, description: 'Логин SIP (для менеджеров)' })
  @IsString()
  @IsOptional()
  sipUser?: string;

  @ApiProperty({ example: 'sippassword', required: false, description: 'Пароль SIP (для менеджеров)' })
  @IsString()
  @IsOptional()
  sipPassword?: string;

  @ApiProperty({ example: 5060, required: false, description: 'Порт SIP (по умолчанию 5060)' })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(65535)
  sipPort?: number;
}
