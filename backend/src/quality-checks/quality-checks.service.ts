import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQualityCheckDto } from './dto/create-quality-check.dto';
import { UpdateQualityCheckDto } from './dto/update-quality-check.dto';
import { QualityStatus, ProductionStage } from '@prisma/client';
import { UploadService } from '../upload/upload.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class QualityChecksService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
    private telegramService: TelegramService,
  ) {}

  async create(
    createQualityCheckDto: CreateQualityCheckDto,
    userId: string,
    photoFile?: Express.Multer.File,
  ) {
    // Проверяем существование продукта
    const product = await this.prisma.product.findUnique({
      where: { id: createQualityCheckDto.productId },
      include: { productType: true },
    });

    if (!product) {
      throw new NotFoundException('Продукт не найден');
    }

    // Получаем URL фото если есть
    let photoUrl: string | undefined;
    if (photoFile) {
      photoUrl = `/uploads/${photoFile.filename}`;
    }

    // Создаем проверку качества
    const qualityCheck = await this.prisma.qualityCheck.create({
      data: {
        productId: createQualityCheckDto.productId,
        status: createQualityCheckDto.status,
        notes: createQualityCheckDto.notes,
        photoUrl,
        checkedById: userId,
        checkedAt: new Date(),
      },
      include: {
        product: {
          include: {
            order: true,
          },
        },
        checkedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Если брак - возвращаем продукт на указанный этап или предыдущий по workflow
    if (createQualityCheckDto.status === QualityStatus.REJECTED) {
      let returnStage: ProductionStage;

      if (createQualityCheckDto.returnToStage) {
        returnStage = createQualityCheckDto.returnToStage;
      } else {
        // Определяем предыдущий этап динамически из WorkflowStage
        const currentWorkflowStage = await this.prisma.workflowStage.findFirst({
          where: { legacyStage: product.stage, isActive: true },
        });
        const previousStage = currentWorkflowStage
          ? await this.prisma.workflowStage.findFirst({
              where: { order: { lt: currentWorkflowStage.order }, isActive: true },
              orderBy: { order: 'desc' },
            })
          : null;
        returnStage = (previousStage?.legacyStage as ProductionStage) || ProductionStage.PAINTING;
      }

      await this.prisma.product.update({
        where: { id: createQualityCheckDto.productId },
        data: { stage: returnStage },
      });

      // Создаем запись в истории
      await this.prisma.productHistory.create({
        data: {
          productId: createQualityCheckDto.productId,
          stage: returnStage,
          userId,
          notes: 'Возврат на доработку после браковки',
        },
      });

      // Отправляем уведомление в Telegram
      await this.telegramService.sendDefectNotification({
        productName: product.name,
        productType: product.productType?.name || 'Не указан',
        orderNumber: qualityCheck.product.order.orderNumber,
        customerName: qualityCheck.product.order.customerName,
        notes: createQualityCheckDto.notes,
        photoUrl,
      });

      // Создаём штраф если указана сумма
      if (createQualityCheckDto.penaltyAmount) {
        // Находим последнего исполнителя на этапе, с которого вернули
        const lastHistory = await this.prisma.productHistory.findFirst({
          where: {
            productId: createQualityCheckDto.productId,
            stage: returnStage,
            completedAt: { not: null },
          },
          orderBy: { completedAt: 'desc' },
          select: { userId: true },
        });

        const penaltyUserId = lastHistory?.userId;

        if (penaltyUserId) {
          const checkerName = qualityCheck.checkedBy
            ? `${qualityCheck.checkedBy.lastName} ${qualityCheck.checkedBy.firstName}`
            : 'Склад';

          await this.prisma.penalty.create({
            data: {
              userId: penaltyUserId,
              amount: createQualityCheckDto.penaltyAmount,
              reason: createQualityCheckDto.notes || 'Брак на контроле качества',
              productId: createQualityCheckDto.productId,
              createdById: userId,
            },
          });

          // Уведомление в Telegram о штрафе
          await this.telegramService.sendPenaltyNotification({
            userId: penaltyUserId,
            amount: createQualityCheckDto.penaltyAmount,
            reason: createQualityCheckDto.notes || 'Брак на контроле качества',
            createdByName: checkerName,
          });
        }
      }
    }

    // Если принято - переводим в завершенные
    if (createQualityCheckDto.status === QualityStatus.APPROVED) {
      await this.prisma.product.update({
        where: { id: createQualityCheckDto.productId },
        data: { stage: ProductionStage.COMPLETED },
      });

      // Создаем запись в истории
      await this.prisma.productHistory.create({
        data: {
          productId: createQualityCheckDto.productId,
          stage: ProductionStage.COMPLETED,
          userId,
          notes: 'Принято складом',
        },
      });
    }

    return qualityCheck;
  }

  async findAll(filters?: {
    productId?: string;
    status?: QualityStatus;
  }) {
    const where: any = {};

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.qualityCheck.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            productType: true,
            orderId: true,
          },
        },
        checkedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const qualityCheck = await this.prisma.qualityCheck.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            order: true,
          },
        },
        checkedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!qualityCheck) {
      throw new NotFoundException('Проверка качества не найдена');
    }

    return qualityCheck;
  }

  async update(
    id: string,
    updateQualityCheckDto: UpdateQualityCheckDto,
    photoFile?: Express.Multer.File,
  ) {
    const qualityCheck = await this.findOne(id);

    // Если есть новое фото - удаляем старое и загружаем новое
    let photoUrl = qualityCheck.photoUrl;
    if (photoFile) {
      if (qualityCheck.photoUrl) {
        await this.uploadService.deleteFile(`.${qualityCheck.photoUrl}`);
      }
      photoUrl = `/uploads/${photoFile.filename}`;
    }

    return this.prisma.qualityCheck.update({
      where: { id },
      data: {
        ...updateQualityCheckDto,
        photoUrl,
      },
      include: {
        product: true,
        checkedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const qualityCheck = await this.findOne(id);

    // Удаляем фото если есть
    if (qualityCheck.photoUrl) {
      await this.uploadService.deleteFile(`.${qualityCheck.photoUrl}`);
    }

    return this.prisma.qualityCheck.delete({
      where: { id },
    });
  }

  // Получить проверки по продукту
  async getByProduct(productId: string) {
    return this.findAll({ productId });
  }

  // Получить забракованные продукты
  async getRejected() {
    return this.findAll({ status: QualityStatus.REJECTED });
  }
}
