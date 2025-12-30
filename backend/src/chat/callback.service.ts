import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class CallbackService {
  private readonly logger = new Logger(CallbackService.name);

  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
  ) {}

  /**
   * Создать заявку на обратный звонок
   */
  async create(data: {
    name: string;
    phone: string;
    message?: string;
    catalogOrderId?: string;
    preferredTime?: string;
  }) {
    // Создать заявку
    const request = await this.prisma.callbackRequest.create({
      data: {
        name: data.name,
        phone: data.phone,
        message: data.message || null,
        catalogOrderId: data.catalogOrderId || null,
        preferredTime: data.preferredTime || null,
        status: 'NEW',
      },
    });

    // Отправить уведомление в Telegram менеджерам
    try {
      let telegramMessage = `📞 <b>Заявка на обратный звонок</b>\n\n`;
      telegramMessage += `👤 <b>Клиент:</b> ${data.name}\n`;
      telegramMessage += `📱 <b>Телефон:</b> ${data.phone}\n`;

      if (data.message) {
        telegramMessage += `💬 <b>Сообщение:</b> ${data.message}\n`;
      }

      if (data.preferredTime) {
        telegramMessage += `⏰ <b>Предпочтительное время:</b> ${data.preferredTime}\n`;
      }

      if (data.catalogOrderId) {
        const order = await this.prisma.catalogOrder.findUnique({
          where: { id: data.catalogOrderId },
          select: { orderNumber: true },
        });
        if (order) {
          telegramMessage += `📋 <b>Заказ:</b> ${order.orderNumber}\n`;
        }
      }

      telegramMessage += `\n⏰ <b>Время заявки:</b> ${new Date().toLocaleString('ru-RU')}`;

      await this.telegramService.notifyAdmins(telegramMessage);
    } catch (error) {
      this.logger.error('Ошибка отправки уведомления в Telegram:', error);
      // Не прерываем создание заявки
    }

    return request;
  }

  /**
   * Получить все заявки
   */
  async findAll(status?: string) {
    const where = status ? { status } : {};

    return this.prisma.callbackRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Получить заявку по ID
   */
  async findOne(id: string) {
    const request = await this.prisma.callbackRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Заявка с ID ${id} не найдена`);
    }

    return request;
  }

  /**
   * Обновить статус заявки
   */
  async updateStatus(id: string, status: string, userId: string, notes?: string) {
    await this.findOne(id); // Проверка существования

    return this.prisma.callbackRequest.update({
      where: { id },
      data: {
        status,
        processedBy: userId,
        processedAt: new Date(),
        notes: notes || undefined,
      },
    });
  }

  /**
   * Отметить как связались
   */
  async markContacted(id: string, userId: string, notes?: string) {
    return this.updateStatus(id, 'CONTACTED', userId, notes);
  }

  /**
   * Отметить как завершено
   */
  async markCompleted(id: string, userId: string, notes?: string) {
    return this.updateStatus(id, 'COMPLETED', userId, notes);
  }

  /**
   * Отменить заявку
   */
  async cancel(id: string, userId: string, notes?: string) {
    return this.updateStatus(id, 'CANCELLED', userId, notes);
  }

  /**
   * Удалить заявку
   */
  async remove(id: string) {
    await this.findOne(id); // Проверка существования

    return this.prisma.callbackRequest.delete({
      where: { id },
    });
  }
}
