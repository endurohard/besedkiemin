import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get('link')
  @UseGuards(JwtAuthGuard)
  getTelegramLink(@Request() req) {
    const userId = req.user.sub;
    return {
      link: this.telegramService.generateTelegramLink(userId),
      botUsername: 'BesedkiEminBot',
    };
  }
}
