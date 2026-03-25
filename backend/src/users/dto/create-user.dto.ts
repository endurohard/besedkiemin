import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsInt, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { PaymentType } from '@prisma/client';

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

  @ApiProperty({ example: 'role-manager', description: 'ID роли' })
  @IsString()
  @IsNotEmpty()
  roleId: string;

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

  @ApiProperty({ enum: PaymentType, default: PaymentType.PIECE_RATE, required: false, description: 'Тип оплаты: PIECE_RATE (сдельная) или SALARY (оклад)' })
  @IsEnum(PaymentType)
  @IsOptional()
  paymentType?: PaymentType;

  @ApiProperty({ example: 50000, required: false, description: 'Оклад в рублях/мес (только для SALARY)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  monthlySalary?: number;
}
