import { Controller, Post, Body, UseGuards, Request, Get, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { TelegramService } from '../telegram/telegram.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly telegramService: TelegramService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Вход в систему' })
  async login(@Body() loginDto: LoginDto, @Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить профиль текущего пользователя' })
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Post('telegram/request-code')
  @ApiOperation({ summary: 'Запросить код для авторизации через Telegram (публичный)' })
  async requestTelegramCode(@Body() body: { email: string; password: string }) {
    // Проверяем учетные данные
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Генерируем код авторизации
    const code = this.telegramService.generateLoginCode(user.id);

    return {
      code,
      expiresIn: 300, // 5 минут в секундах
      message: 'Отправьте команду /login ' + code + ' боту @besedkiemin_bot в Telegram'
    };
  }

  @Post('telegram/check-auth')
  @ApiOperation({ summary: 'Проверить статус авторизации через Telegram (для polling)' })
  async checkTelegramAuth(@Body() body: { code: string }) {
    const validation = this.telegramService.validateLoginCode(body.code);

    if (!validation.valid) {
      throw new UnauthorizedException('Код не найден или истёк');
    }

    // Проверяем, был ли использован код (привязан ли Telegram)
    const user = await this.authService.findUserById(validation.userId);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    // Если Telegram уже привязан, возвращаем токен
    if (user.telegramId) {
      this.telegramService.removeLoginCode(body.code);
      return this.authService.login(user);
    }

    // Код ещё не использован в Telegram
    return {
      status: 'pending',
      message: 'Ожидание подтверждения в Telegram'
    };
  }
}
