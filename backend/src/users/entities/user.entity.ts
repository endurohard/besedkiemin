import { ApiProperty } from '@nestjs/swagger';

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
  role?: any; // Role object

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

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
    // Удаляем пароль из ответа
    delete (this as any).password;
  }
}
