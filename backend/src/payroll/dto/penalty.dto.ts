import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsDateString,
} from "class-validator";
import { PENALTY_AMOUNTS } from "../../common/constants";

export class CreatePenaltyDto {
  @IsString()
  userId: string;

  @IsNumber()
  @IsIn(PENALTY_AMOUNTS, {
    message: "Сумма штрафа должна быть из предопределённого списка",
  })
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
  @IsIn(PENALTY_AMOUNTS, {
    message: "Сумма штрафа должна быть из предопределённого списка",
  })
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
