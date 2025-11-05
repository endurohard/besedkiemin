import { Controller, Get, Query, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('public')
export class PublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('order-status')
  async getOrderStatus(@Query('orderNumber') orderNumber: string) {
    if (!orderNumber) {
      throw new NotFoundException('Номер заказа не указан');
    }

    const order = await this.prisma.order.findFirst({
      where: { orderNumber },
      include: {
        products: {
          include: {
            productType: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }

    // Определяем текущий статус заказа
    let statusText = '';
    let statusEmoji = '';
    let detailedStatus = '';

    if (order.status === 'NEW') {
      statusText = 'Новый заказ';
      statusEmoji = '📝';
      detailedStatus = 'Ваш заказ принят и ожидает начала производства';
    } else if (order.status === 'IN_PRODUCTION') {
      statusText = 'В производстве';
      statusEmoji = '⚙️';

      // Подсчитываем прогресс
      const totalProducts = order.products.length;
      const completedProducts = order.products.filter(
        p => p.stage === 'COMPLETED' || p.stage === 'QUALITY_CHECK'
      ).length;

      detailedStatus = `Изготовление: ${completedProducts} из ${totalProducts} изделий готово`;
    } else if (order.status === 'COMPLETED') {
      // Проверяем, отгружен ли заказ
      const shipment = await this.prisma.shipment.findFirst({
        where: {
          items: {
            some: {
              inventoryItem: {
                orderId: order.id,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (shipment) {
        if (shipment.status === 'PENDING') {
          statusText = 'Готов к отгрузке';
          statusEmoji = '📦';
          detailedStatus = 'Заказ готов и ожидает отправки';
        } else if (shipment.status === 'IN_TRANSIT') {
          statusText = 'В пути';
          statusEmoji = '🚚';
          detailedStatus = shipment.deliveryDate
            ? `Заказ в пути, ожидаемая дата доставки: ${new Date(shipment.deliveryDate).toLocaleDateString('ru-RU')}`
            : 'Заказ в пути к вам';
        } else if (shipment.status === 'DELIVERED') {
          statusText = 'Доставлен';
          statusEmoji = '✅';
          detailedStatus = 'Заказ успешно доставлен';
        }
      } else {
        statusText = 'Готов';
        statusEmoji = '✅';
        detailedStatus = 'Заказ изготовлен и находится на складе';
      }
    } else if (order.status === 'CANCELLED') {
      statusText = 'Отменен';
      statusEmoji = '❌';
      detailedStatus = 'Заказ отменен';
    }

    return {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: order.status,
      statusText,
      statusEmoji,
      detailedStatus,
      createdAt: order.createdAt,
      products: order.products.map(p => ({
        name: p.name,
        typeName: p.productType.name,
        quantity: p.quantity,
        stage: p.stage,
      })),
    };
  }
}
