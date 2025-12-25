import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength, IsBoolean, IsInt, Min, Max } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'newpassword123', required: false })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: 'Иван', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Иванов', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: 'role-manager', required: false, description: 'ID роли' })
  @IsString()
  @IsOptional()
  roleId?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: '123456789', required: false })
  @IsString()
  @IsOptional()
  telegramId?: string;

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
