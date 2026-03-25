import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

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
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('NotificationsGateway');

  constructor(private jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token
      || client.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      this.logger.warn(`Notifications: rejected (no token): ${client.id}`);
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
      (client as any).userId = payload.sub;
      client.join(`user:${payload.sub}`);
      client.join('all'); // Общий канал для broadcast
      this.logger.log(`Notifications: connected ${payload.email} (${client.id})`);
    } catch {
      this.logger.warn(`Notifications: invalid token: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Notifications: disconnected ${client.id}`);
  }

  // Уведомить всех об изменении отгрузок
  notifyShipmentsChanged() {
    this.server?.to('all').emit('shipments:changed');
  }

  // Уведомить всех об изменении дефектов
  notifyDefectsChanged() {
    this.server?.to('all').emit('defects:changed');
  }

  // Уведомить об изменении задач конкретного пользователя
  notifyTasksChanged(userId?: string) {
    if (userId) {
      this.server?.to(`user:${userId}`).emit('tasks:changed');
    } else {
      this.server?.to('all').emit('tasks:changed');
    }
  }

  // Уведомить об изменении заказов
  notifyOrdersChanged() {
    this.server?.to('all').emit('orders:changed');
  }

  // Уведомить об изменении продуктов
  notifyProductsChanged() {
    this.server?.to('all').emit('products:changed');
  }

  // Уведомить об изменении инвентаря
  notifyInventoryChanged() {
    this.server?.to('all').emit('inventory:changed');
  }
}
