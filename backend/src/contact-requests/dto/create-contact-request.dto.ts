import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateContactRequestDto {
  @ApiProperty({ description: 'Имя клиента' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Телефон клиента' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Email клиента', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Сообщение' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'ID товара (если запрос о конкретном товаре)', required: false })
  @IsOptional()
  @IsString()
  productId?: string;
}
