import { ApiProperty } from "@nestjs/swagger";
import { Role, PaymentType } from "@prisma/client";

export class UserEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  roleId: string;

  @ApiProperty()
  role?: Role;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  telegramId?: string | null;

  // SIP телефония (для менеджеров)
  @ApiProperty({ required: false })
  sipServer?: string | null;

  @ApiProperty({ required: false })
  sipUser?: string | null;

  @ApiProperty({ required: false })
  sipPassword?: string | null;

  @ApiProperty({ required: false })
  sipPort?: number | null;

  @ApiProperty({ required: false })
  sipWsPort?: number | null;

  @ApiProperty({ enum: PaymentType, default: PaymentType.PIECE_RATE })
  paymentType: PaymentType;

  @ApiProperty({ required: false, description: "Оклад руб/мес (для SALARY)" })
  monthlySalary?: number | null;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
    // Удаляем секретные поля из ответа
    delete (this as any).password;
    delete (this as any).sipPassword;
    delete (this as any).pin;
  }
}
