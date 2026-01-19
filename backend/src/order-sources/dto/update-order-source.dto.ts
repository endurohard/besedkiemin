import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderSourceDto } from './create-order-source.dto';

export class UpdateOrderSourceDto extends PartialType(CreateOrderSourceDto) {}
