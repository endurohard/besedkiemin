import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

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
  sipServer?: string;

  @ApiProperty({ required: false })
  sipUser?: string;

  @ApiProperty({ required: false })
  sipPassword?: string;

  @ApiProperty({ required: false })
  sipPort?: number;

  @ApiProperty({ required: false })
  sipWsPort?: number;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
    // Удаляем секретные поля из ответа
    delete (this as any).password;
    delete (this as any).sipPassword;
    delete (this as any).pin;
  }
}
