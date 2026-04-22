import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { ThrottlerGuard, Throttle } from "@nestjs/throttler";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { PinLoginDto } from "./dto/pin-login.dto";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { Roles } from "./decorators/roles.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import { TelegramService } from "../telegram/telegram.service";
import { UsersService } from "../users/users.service";
import { DepartmentPresetsService } from "../department-presets/department-presets.service";
import { AuthenticatedUser } from "./strategies/jwt.strategy";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly telegramService: TelegramService,
    private readonly usersService: UsersService,
    private readonly departmentPresetsService: DepartmentPresetsService,
  ) {}

  @UseGuards(ThrottlerGuard, LocalAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post("login")
  @ApiOperation({ summary: "Вход в систему" })
  async login(@Body() loginDto: LoginDto, @Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post("quick-login")
  @ApiOperation({
    summary: "Быстрый вход по коду кнопки отдела (публичный)",
  })
  async quickLogin(@Body() body: { code: string }) {
    if (!body?.code) {
      throw new BadRequestException("Код пресета обязателен");
    }
    const preset = await this.departmentPresetsService.findByCodeActive(
      body.code,
    );
    if (!preset || !preset.user || !preset.user.isActive) {
      throw new UnauthorizedException(
        "Быстрый вход для этого отдела недоступен",
      );
    }
    return this.authService.login(preset.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Получить профиль текущего пользователя" })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("telegram/request-code")
  @ApiOperation({
    summary: "Запросить код для авторизации через Telegram (публичный)",
  })
  async requestTelegramCode(@Body() body: { email: string; password: string }) {
    // Проверяем учетные данные
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException("Неверный email или пароль");
    }

    // Генерируем код авторизации
    const code = this.telegramService.generateLoginCode(user.id);

    return {
      code,
      expiresIn: 300, // 5 минут в секундах
      message:
        "Отправьте команду /login " +
        code +
        " боту @besedkiemin_bot в Telegram",
    };
  }

  @Post("telegram/check-auth")
  @ApiOperation({
    summary: "Проверить статус авторизации через Telegram (для polling)",
  })
  async checkTelegramAuth(@Body() body: { code: string }) {
    const validation = this.telegramService.validateLoginCode(body.code);

    if (!validation.valid) {
      throw new UnauthorizedException("Код не найден или истёк");
    }

    // Проверяем, был ли использован код (привязан ли Telegram)
    const user = await this.authService.findUserById(validation.userId!);
    if (!user) {
      throw new UnauthorizedException("Пользователь не найден");
    }

    // Если Telegram уже привязан, возвращаем токен
    if (user.telegramId) {
      this.telegramService.removeLoginCode(body.code);
      return this.authService.login(user);
    }

    // Код ещё не использован в Telegram
    return {
      status: "pending",
      message: "Ожидание подтверждения в Telegram",
    };
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("pin-login")
  @ApiOperation({
    summary: "Вход по PIN-коду (для производственных работников)",
  })
  async pinLogin(@Body() pinLoginDto: PinLoginDto) {
    const user = await this.authService.validatePin(pinLoginDto.pin);
    if (!user) {
      throw new UnauthorizedException("Неверный PIN-код");
    }
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post("set-pin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Установить PIN-код для текущего пользователя" })
  async setMyPin(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { pin: string },
  ) {
    if (!body.pin || body.pin.length < 4 || body.pin.length > 6) {
      throw new BadRequestException("PIN-код должен содержать от 4 до 6 цифр");
    }
    if (!/^\d+$/.test(body.pin)) {
      throw new BadRequestException("PIN-код должен содержать только цифры");
    }
    await this.usersService.setPin(user.userId, body.pin);
    return { success: true, message: "PIN-код установлен" };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER", "SUPER_ADMIN")
  @Post("set-pin/:userId")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Установить PIN-код для работника (только владелец)",
  })
  async setUserPin(
    @Param("userId") userId: string,
    @Body() body: { pin: string },
  ) {
    if (!body.pin || body.pin.length < 4 || body.pin.length > 6) {
      throw new BadRequestException("PIN-код должен содержать от 4 до 6 цифр");
    }
    if (!/^\d+$/.test(body.pin)) {
      throw new BadRequestException("PIN-код должен содержать только цифры");
    }
    await this.usersService.setPin(userId, body.pin);
    return { success: true, message: "PIN-код установлен" };
  }
}
