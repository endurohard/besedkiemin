import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateContactRequestDto {
  @ApiProperty({ description: 'Обработан ли запрос', required: false })
  @IsOptional()
  @IsBoolean()
  isProcessed?: boolean;

  @ApiProperty({ description: 'Примечания менеджера', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
