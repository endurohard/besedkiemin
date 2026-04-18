import { Controller, Get, Post, UseGuards, Request } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TelegramService } from "./telegram.service";
import { PrismaService } from "../prisma/prisma.service";

@Controller("telegram")
export class TelegramController {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("link")
  @UseGuards(JwtAuthGuard)
  getTelegramLink(@Request() req) {
    const userId = req.user.userId;
    return {
      link: this.telegramService.generateTelegramLink(userId),
      botUsername: "besedkiemin_bot",
    };
  }

  @Post("unlink")
  @UseGuards(JwtAuthGuard)
  async unlinkTelegram(@Request() req) {
    const userId = req.user.userId;
    await this.prisma.user.update({
      where: { id: userId },
      data: { telegramId: null },
    });
    return { success: true, message: "Telegram отвязан" };
  }
}
