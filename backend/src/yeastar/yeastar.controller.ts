import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { YeastarService } from './yeastar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('yeastar')
@Controller('yeastar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class YeastarController {
  constructor(
    private readonly yeastarService: YeastarService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('call')
  @ApiOperation({ summary: 'Совершить звонок через Yeastar API' })
  async makeCall(
    @Request() req,
    @Body() body: { phoneNumber: string }
  ) {
    // Получаем SIP настройки пользователя
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user?.sipServer || !user?.sipUser || !user?.sipPassword) {
      return {
        success: false,
        message: 'SIP настройки не настроены для пользователя',
      };
    }

    try {
      const config = {
        host: user.sipServer,
        username: 'admin', // Нужно добавить поле apiUsername в User
        password: 'admin', // Нужно добавить поле apiPassword в User
        extension: user.sipUser,
      };

      const result = await this.yeastarService.makeCall(config, body.phoneNumber);

      return {
        success: true,
        callid: result.callid,
        status: result.status,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Post('hangup')
  @ApiOperation({ summary: 'Завершить звонок' })
  async hangupCall(
    @Request() req,
    @Body() body: { callid: string }
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user?.sipServer) {
      return {
        success: false,
        message: 'SIP настройки не настроены',
      };
    }

    try {
      const config = {
        host: user.sipServer,
        username: 'admin',
        password: 'admin',
        extension: user.sipUser,
      };

      await this.yeastarService.hangupCall(config, body.callid);

      return {
        success: true,
        message: 'Звонок завершён',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get('active-calls')
  @ApiOperation({ summary: 'Получить активные звонки' })
  async getActiveCalls(@Request() req) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user?.sipServer) {
      return {
        success: false,
        calls: [],
      };
    }

    try {
      const config = {
        host: user.sipServer,
        username: 'admin',
        password: 'admin',
        extension: user.sipUser,
      };

      const calls = await this.yeastarService.getActiveCalls(config);

      return {
        success: true,
        calls: calls,
      };
    } catch (error: any) {
      return {
        success: false,
        calls: [],
        message: error.message,
      };
    }
  }
}
