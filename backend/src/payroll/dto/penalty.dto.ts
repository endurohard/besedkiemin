import { IsString, IsOptional, IsNumber, Min, IsDateString } from 'class-validator';

export class CreatePenaltyDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePenaltyDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelPenaltyDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
