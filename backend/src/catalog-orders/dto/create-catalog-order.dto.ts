import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsInt,
} from "class-validator";
import { Type } from "class-transformer";

export class OrderItemDto {
  @ApiProperty({ description: "ID товара" })
  @IsString()
  productId: string;

  @ApiProperty({ description: "Количество", default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiProperty({ description: "Комментарий к позиции", required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class CreateCatalogOrderDto {
  @ApiProperty({ description: "Имя клиента" })
  @IsString()
  customerName: string;

  @ApiProperty({ description: "Телефон клиента" })
  @IsString()
  customerPhone: string;

  @ApiProperty({ description: "Email клиента", required: false })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiProperty({ description: "Комментарий к заказу", required: false })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ description: "Адрес доставки", required: false })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiProperty({ description: "Позиции заказа", type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
