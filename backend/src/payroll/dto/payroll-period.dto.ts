import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
} from "class-validator";

export class CreatePayrollPeriodDto {
  @IsString()
  userId: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePayrollPeriodDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CalculatePayrollDto {
  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;

  @IsOptional()
  @IsString()
  userId?: string; // Если не указан - расчет для всех активных пользователей
}

export class ApprovePayrollDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PayPayrollDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
