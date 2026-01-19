import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  /**
   * Проверить, работает ли чат сейчас (по рабочим часам)
   */
  async isOnline(): Promise<{
    online: boolean;
    message?: string;
    workingHours?: { start: string; end: string };
  }> {
    const settings = await this.prisma.companySettings.findFirst();

    if (!settings || !settings.chatEnabled) {
      return {
        online: false,
        message: settings?.offlineMessage || 'Чат временно недоступен',
      };
    }

    const now = new Date();
    const currentDay = now.getDay() || 7; // 0 (воскресенье) -> 7, 1-6 остаются как есть
    const workingDays = settings.workingDays.split(',').map((d) => parseInt(d.trim()));

    // Проверяем, рабочий ли день
    if (!workingDays.includes(currentDay)) {
      return {
        online: false,
        message: settings.offlineMessage,
        workingHours: {
          start: settings.workingHoursStart,
          end: settings.workingHoursEnd,
        },
      };
    }

    // Проверяем рабочие часы
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const isWithinHours =
      currentTime >= settings.workingHoursStart && currentTime <= settings.workingHoursEnd;

    if (!isWithinHours) {
      return {
        online: false,
        message: settings.offlineMessage,
        workingHours: {
          start: settings.workingHoursStart,
          end: settings.workingHoursEnd,
        },
      };
    }

    return { online: true };
  }

  /**
   * Создать или получить комнату чата для заказа
   */
  async getOrCreateRoom(catalogOrderId: string) {
    // Проверить, существует ли заказ
    const order = await this.prisma.catalogOrder.findUnique({
      where: { id: catalogOrderId },
    });

    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }

    // Найти или создать комнату
    let room = await this.prisma.chatRoom.findUnique({
      where: { catalogOrderId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50, // Последние 50 сообщений
        },
      },
    });

    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: {
          catalogOrderId,
          customerName: order.customerName,
        },
        include: {
          messages: true,
        },
      });
    }

    return room;
  }

  /**
   * Создать или получить гостевую комнату чата (без заказа)
   */
  async getOrCreateGuestRoom(data: {
    guestSessionId: string;
    customerName: string;
    customerPhone?: string;
  }) {
    // Найти существующую комнату по сессии
    let room = await this.prisma.chatRoom.findUnique({
      where: { guestSessionId: data.guestSessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
    });

    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: {
          guestSessionId: data.guestSessionId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
        },
        include: {
          messages: true,
        },
      });
    }

    return room;
  }

  /**
   * Получить список всех активных комнат (для менеджера)
   */
  async getAllRooms() {
    const rooms = await this.prisma.chatRoom.findMany({
      where: { isActive: true },
      orderBy: [
        { unreadCount: 'desc' }, // Сначала с непрочитанными
        { lastMessageAt: 'desc' }, // Потом по времени последнего сообщения
        { createdAt: 'desc' },
      ],
      include: {
        catalogOrder: {
          select: {
            id: true,
            orderNumber: true,
            customerPhone: true,
            customerEmail: true,
            status: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Для гостевых комнат (без заказа) создаём виртуальный объект catalogOrder
    return rooms.map(room => ({
      ...room,
      catalogOrder: room.catalogOrder || {
        id: room.guestSessionId || room.id,
        orderNumber: room.guestSessionId ? `Гость #${room.guestSessionId.slice(-6)}` : 'Гостевой чат',
        customerPhone: room.customerPhone || '',
        customerEmail: room.customerEmail || '',
        status: 'GUEST',
      },
    }));
  }

  /**
   * Получить комнату по ID с сообщениями
   */
  async getRoom(roomId: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        catalogOrder: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Комната чата не найдена');
    }

    return room;
  }

  /**
   * Отправить сообщение
   */
  async sendMessage(data: {
    roomId: string;
    senderType: 'CUSTOMER' | 'MANAGER';
    senderId?: string;
    senderName: string;
    content: string;
  }) {
    // Проверить существование комнаты
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: data.roomId },
    });

    if (!room) {
      throw new NotFoundException('Комната чата не найдена');
    }

    // Создать сообщение
    const message = await this.prisma.chatMessage.create({
      data: {
        roomId: data.roomId,
        senderType: data.senderType,
        senderId: data.senderId || null,
        senderName: data.senderName,
        content: data.content,
      },
    });

    // Обновить комнату
    const updateData: any = {
      lastMessageAt: new Date(),
      lastMessageText: data.content,
    };

    // Если сообщение от клиента, увеличить счетчик непрочитанных для менеджера
    if (data.senderType === 'CUSTOMER') {
      updateData.unreadCount = { increment: 1 };
    }

    await this.prisma.chatRoom.update({
      where: { id: data.roomId },
      data: updateData,
    });

    return message;
  }

  /**
   * Отметить сообщения как прочитанные
   */
  async markMessagesAsRead(roomId: string, messageIds?: string[]) {
    const where: any = { roomId, isRead: false };

    if (messageIds && messageIds.length > 0) {
      where.id = { in: messageIds };
    }

    // Обновить сообщения
    await this.prisma.chatMessage.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Сбросить счетчик непрочитанных в комнате
    const unreadCount = await this.prisma.chatMessage.count({
      where: {
        roomId,
        isRead: false,
        senderType: 'CUSTOMER', // Считаем только непрочитанные от клиента
      },
    });

    await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: { unreadCount },
    });

    return { success: true };
  }

  /**
   * Получить непрочитанные сообщения для комнаты
   */
  async getUnreadMessages(roomId: string) {
    return this.prisma.chatMessage.findMany({
      where: {
        roomId,
        isRead: false,
        senderType: 'CUSTOMER',
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Получить общее количество непрочитанных сообщений для менеджера
   */
  async getTotalUnreadCount() {
    const rooms = await this.prisma.chatRoom.findMany({
      where: { isActive: true },
      select: { unreadCount: true },
    });

    return rooms.reduce((sum, room) => sum + room.unreadCount, 0);
  }

  /**
   * Закрыть комнату (деактивировать)
   */
  async closeRoom(roomId: string) {
    return this.prisma.chatRoom.update({
      where: { id: roomId },
      data: { isActive: false },
    });
  }
}
