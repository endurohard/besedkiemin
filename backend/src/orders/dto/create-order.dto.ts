import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, IsUUID } from 'class-validator';
import { OrderPriority } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty({ example: 'ORD-001', required: false, description: 'Номер заказа (если не указан - генерируется автоматически)' })
  @IsString()
  @IsOptional()
  orderNumber?: string;

  @ApiProperty({ example: 'Иван Иванов' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ example: '+7 999 123-45-67', required: false })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiProperty({ example: 'г. Москва, ул. Ленина, д. 10', required: false })
  @IsString()
  @IsOptional()
  customerAddress?: string;

  @ApiProperty({ example: 'Комплект мебели для столовой', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Клиент попросил особое внимание к качеству', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: OrderPriority.NORMAL,
    enum: OrderPriority,
    required: false,
    description: 'Приоритет заказа: LOW, NORMAL, HIGH, URGENT'
  })
  @IsEnum(OrderPriority)
  @IsOptional()
  priority?: OrderPriority;

  @ApiProperty({ example: 'uuid-источника', required: false, description: 'ID источника заказа' })
  @IsUUID()
  @IsOptional()
  sourceId?: string;

  @ApiProperty({ example: 50000, required: false, description: 'Общая сумма заказа' })
  @IsNumber()
  @IsOptional()
  totalAmount?: number;
}
