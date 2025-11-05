import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsEmail } from 'class-validator';
import { CatalogOrderStatus } from '@prisma/client';

export class UpdateCatalogOrderDto {
  @ApiProperty({ description: 'Имя клиента', required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ description: 'Телефон клиента', required: false })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({ description: 'Email клиента', required: false })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiProperty({ description: 'Адрес доставки', required: false })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiProperty({ description: 'Комментарий', required: false })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ description: 'Причина отмены заказа', required: false })
  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @ApiProperty({ description: 'Статус заказа', enum: CatalogOrderStatus, required: false })
  @IsOptional()
  @IsEnum(CatalogOrderStatus)
  status?: CatalogOrderStatus;
}
