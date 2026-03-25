import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: [
      'http://176.98.155.17',
      'http://176.98.155.17:5173',
      'http://localhost',
      'http://localhost:5173',
    ],
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');

  // Отслеживание подключенных пользователей
  private connectedUsers = new Map<string, { socketId: string; roomId: string; userType: string }>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    // Для customer-типа (публичный чат) — пропускаем JWT
    const userType = client.handshake.query?.userType as string;
    if (userType === 'customer') {
      this.logger.log(`Customer connected: ${client.id}`);
      return;
    }

    // Для manager-типа — требуем JWT
    const token = client.handshake.auth?.token
      || client.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      this.logger.warn(`Connection rejected (no token): ${client.id}`);
      client.emit('error', { message: 'Требуется авторизация' });
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
      (client as any).userId = payload.sub;
      (client as any).userEmail = payload.email;
      this.logger.log(`Manager connected: ${client.id} (user: ${payload.email})`);
    } catch (error) {
      this.logger.warn(`Connection rejected (invalid token): ${client.id}`);
      client.emit('error', { message: 'Неверный токен авторизации' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Удалить из карты подключенных пользователей
    for (const [key, value] of this.connectedUsers.entries()) {
      if (value.socketId === client.id) {
        this.connectedUsers.delete(key);
        break;
      }
    }
  }

  /**
   * Клиент присоединяется к комнате
   */
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userType: 'customer' | 'manager'; userId?: string },
  ) {
    try {
      const { roomId, userType, userId } = data;

      // Менеджер должен быть аутентифицирован
      if (userType === 'manager' && !(client as any).userId) {
        client.emit('error', { message: 'Требуется авторизация для менеджера' });
        return { success: false, error: 'Unauthorized' };
      }

      // Проверить существование комнаты
      const room = await this.chatService.getRoom(roomId);

      // Присоединить к комнате Socket.IO
      client.join(roomId);

      // Сохранить информацию о подключении
      const userKey = userId || `customer-${roomId}`;
      this.connectedUsers.set(userKey, {
        socketId: client.id,
        roomId,
        userType,
      });

      this.logger.log(`${userType} joined room ${roomId}`);

      // Отправить историю сообщений
      client.emit('room_joined', {
        room,
        messages: room.messages,
      });

      // Если это менеджер, отметить сообщения как прочитанные
      if (userType === 'manager') {
        const unreadMessages = await this.chatService.getUnreadMessages(roomId);
        if (unreadMessages.length > 0) {
          await this.chatService.markMessagesAsRead(
            roomId,
            unreadMessages.map((m) => m.id),
          );

          // Уведомить всех в комнате об обновлении статуса
          this.server.to(roomId).emit('messages_read', {
            roomId,
            messageIds: unreadMessages.map((m) => m.id),
          });
        }
      }

      // Уведомить других участников комнаты о новом подключении
      client.to(roomId).emit('user_joined', {
        userType,
        userId,
      });

      return { success: true, room };
    } catch (error) {
      this.logger.error(`Error joining room: ${error.message}`);
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Отправка сообщения
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomId: string;
      content: string;
      senderType: 'CUSTOMER' | 'MANAGER';
      senderId?: string;
      senderName: string;
    },
  ) {
    try {
      const { roomId, content, senderType, senderId, senderName } = data;

      // Менеджер должен быть аутентифицирован
      if (senderType === 'MANAGER' && !(client as any).userId) {
        client.emit('error', { message: 'Требуется авторизация' });
        return { success: false, error: 'Unauthorized' };
      }

      // Сохранить сообщение в БД
      const message = await this.chatService.sendMessage({
        roomId,
        senderType,
        senderId,
        senderName,
        content,
      });

      // Отправить сообщение всем в комнате
      this.server.to(roomId).emit('new_message', message);

      // Если сообщение от клиента, уведомить менеджеров о новом непрочитанном сообщении
      if (senderType === 'CUSTOMER') {
        const totalUnread = await this.chatService.getTotalUnreadCount();
        this.server.emit('unread_count_updated', { total: totalUnread });
      }

      this.logger.log(`Message sent in room ${roomId} by ${senderType}`);

      return { success: true, message };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Индикатор набора текста
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userType: string; userName: string },
  ) {
    const { roomId, userType, userName } = data;
    client.to(roomId).emit('user_typing', { userType, userName });
  }

  /**
   * Остановка набора текста
   */
  @SubscribeMessage('stop_typing')
  handleStopTyping(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
    const { roomId } = data;
    client.to(roomId).emit('user_stopped_typing');
  }

  /**
   * Отметить сообщения как прочитанные
   */
  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; messageIds?: string[] },
  ) {
    try {
      const { roomId, messageIds } = data;

      await this.chatService.markMessagesAsRead(roomId, messageIds);

      this.server.to(roomId).emit('messages_read', {
        roomId,
        messageIds,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Error marking messages as read: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Покинуть комнату
   */
  @SubscribeMessage('leave_room')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
    const { roomId } = data;
    client.leave(roomId);
    this.logger.log(`Client ${client.id} left room ${roomId}`);
    client.to(roomId).emit('user_left');
    return { success: true };
  }

  /**
   * Проверить, онлайн ли чат (рабочие часы)
   */
  @SubscribeMessage('check_online')
  async handleCheckOnline(@ConnectedSocket() client: Socket) {
    try {
      const status = await this.chatService.isOnline();
      client.emit('online_status', status);
      return status;
    } catch (error) {
      this.logger.error(`Error checking online status: ${error.message}`);
      return { online: false, message: 'Ошибка проверки статуса' };
    }
  }
}
