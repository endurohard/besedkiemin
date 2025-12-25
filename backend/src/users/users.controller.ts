import { Controller, Get, Post, Body, Param, UseGuards, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';


@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('OWNER')
  @ApiOperation({ summary: 'Создать нового пользователя (только OWNER)' })
  create(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('OWNER')
  @ApiOperation({ summary: 'Получить всех пользователей (только OWNER)' })
  findAll(): Promise<UserEntity[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Получить пользователя по ID (только OWNER)' })
  findOne(@Param('id') id: string): Promise<UserEntity> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Обновить пользователя (только OWNER)' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Удалить пользователя (только OWNER)' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.usersService.remove(id);
    return { message: 'Пользователь успешно удален' };
  }

  @Post(':id/toggle-active')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Переключить активность пользователя (только OWNER)' })
  toggleActive(@Param('id') id: string): Promise<UserEntity> {
    return this.usersService.toggleActive(id);
  }
}
