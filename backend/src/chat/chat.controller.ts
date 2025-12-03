import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Проверить, работает ли чат сейчас (публичный эндпоинт)
   */
  @Get('status')
  @ApiOperation({ summary: 'Проверить статус чата (онлайн/оффлайн)' })
  async getStatus() {
    return this.chatService.isOnline();
  }

  /**
   * Создать или получить комнату для заказа (публичный эндпоинт)
   */
  @Post('rooms/order/:catalogOrderId')
  @ApiOperation({ summary: 'Создать или получить комнату чата для заказа' })
  async getOrCreateRoom(@Param('catalogOrderId') catalogOrderId: string) {
    return this.chatService.getOrCreateRoom(catalogOrderId);
  }

  /**
   * Получить все активные комнаты (для менеджера)
   */
  @Get('rooms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить все активные комнаты чата (OWNER/MANAGER)' })
  async getAllRooms() {
    return this.chatService.getAllRooms();
  }

  /**
   * Получить комнату по ID
   */
  @Get('rooms/:roomId')
  @ApiOperation({ summary: 'Получить комнату чата по ID' })
  async getRoom(@Param('roomId') roomId: string) {
    return this.chatService.getRoom(roomId);
  }

  /**
   * Получить непрочитанные сообщения для комнаты
   */
  @Get('rooms/:roomId/unread')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить непрочитанные сообщения для комнаты (OWNER/MANAGER)' })
  async getUnreadMessages(@Param('roomId') roomId: string) {
    return this.chatService.getUnreadMessages(roomId);
  }

  /**
   * Получить общее количество непрочитанных сообщений
   */
  @Get('unread/total')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить общее количество непрочитанных сообщений (OWNER/MANAGER)' })
  async getTotalUnreadCount() {
    const total = await this.chatService.getTotalUnreadCount();
    return { total };
  }

  /**
   * Отметить сообщения как прочитанные
   */
  @Post('rooms/:roomId/mark-read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отметить сообщения как прочитанные (OWNER/MANAGER)' })
  async markAsRead(
    @Param('roomId') roomId: string,
    @Body() body: { messageIds?: string[] },
  ) {
    return this.chatService.markMessagesAsRead(roomId, body.messageIds);
  }

  /**
   * Закрыть комнату
   */
  @Post('rooms/:roomId/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Закрыть комнату чата (OWNER/MANAGER)' })
  async closeRoom(@Param('roomId') roomId: string) {
    return this.chatService.closeRoom(roomId);
  }
}
