import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsDateString } from "class-validator";
import { OrderStatus } from "@prisma/client";
import { CreateOrderDto } from "./create-order.dto";

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiProperty({
    enum: OrderStatus,
    required: false,
    description: "Статус заказа (воронка): NEW, MEASUREMENT, DESIGN, WAITING, IN_PRODUCTION, COMPLETED, CANCELLED",
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiProperty({ required: false, description: "Дата подтверждения принятия заказа (ISO)" })
  @IsDateString()
  @IsOptional()
  acceptedAt?: string | null;

  @ApiProperty({ required: false, description: "Планируемая дата повторного обзвона (ISO)" })
  @IsDateString()
  @IsOptional()
  callbackAt?: string | null;

  @ApiProperty({ required: false, description: "Причина ожидания / отказа клиента" })
  @IsString()
  @IsOptional()
  callbackNote?: string | null;
}
