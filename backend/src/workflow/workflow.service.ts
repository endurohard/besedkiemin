import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkflowStageDto } from './dto/create-workflow-stage.dto';
import { UpdateWorkflowStageDto } from './dto/update-workflow-stage.dto';
import { ReorderWorkflowStagesDto } from './dto/reorder-workflow-stages.dto';

@Injectable()
export class WorkflowService {
  constructor(private prisma: PrismaService) {}

  // Получить все этапы workflow
  async findAll() {
    return this.prisma.workflowStage.findMany({
      orderBy: {
        order: 'asc',
      },
    });
  }

  // Получить активные этапы workflow
  async findActive() {
    return this.prisma.workflowStage.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  // Получить один этап
  async findOne(id: string) {
    const stage = await this.prisma.workflowStage.findUnique({
      where: { id },
    });

    if (!stage) {
      throw new NotFoundException('Этап workflow не найден');
    }

    return stage;
  }

  // Создать этап
  async create(createWorkflowStageDto: CreateWorkflowStageDto) {
    // Проверяем, не занят ли order
    const existingStage = await this.prisma.workflowStage.findFirst({
      where: { order: createWorkflowStageDto.order },
    });

    if (existingStage) {
      throw new ConflictException(`Порядковый номер ${createWorkflowStageDto.order} уже занят`);
    }

    return this.prisma.workflowStage.create({
      data: createWorkflowStageDto,
    });
  }

  // Обновить этап
  async update(id: string, updateWorkflowStageDto: UpdateWorkflowStageDto) {
    await this.findOne(id); // Проверяем существование

    // Если меняется order, проверяем, не занят ли он
    if (updateWorkflowStageDto.order !== undefined) {
      const existingStage = await this.prisma.workflowStage.findFirst({
        where: {
          order: updateWorkflowStageDto.order,
          id: { not: id },
        },
      });

      if (existingStage) {
        throw new ConflictException(`Порядковый номер ${updateWorkflowStageDto.order} уже занят`);
      }
    }

    return this.prisma.workflowStage.update({
      where: { id },
      data: updateWorkflowStageDto,
    });
  }

  // Удалить этап
  async remove(id: string) {
    await this.findOne(id); // Проверяем существование

    // Проверяем, есть ли связанные задачи или история
    const relatedTasks = await this.prisma.task.count({
      where: { workflowStageId: id },
    });

    const relatedHistory = await this.prisma.productHistory.count({
      where: { workflowStageId: id },
    });

    if (relatedTasks > 0 || relatedHistory > 0) {
      throw new BadRequestException(
        'Нельзя удалить этап, так как с ним связаны задачи или история продуктов. Деактивируйте его вместо удаления.',
      );
    }

    return this.prisma.workflowStage.delete({
      where: { id },
    });
  }

  // Изменить порядок этапов
  async reorder(reorderWorkflowStagesDto: ReorderWorkflowStagesDto) {
    const { stageIds } = reorderWorkflowStagesDto;

    // Проверяем, что все ID существуют
    const stages = await this.prisma.workflowStage.findMany({
      where: {
        id: { in: stageIds },
      },
    });

    if (stages.length !== stageIds.length) {
      throw new BadRequestException('Некоторые этапы не найдены');
    }

    // Используем транзакцию с временными отрицательными значениями
    // чтобы избежать конфликта уникальности на поле order
    await this.prisma.$transaction(async (tx) => {
      // Сначала устанавливаем временные отрицательные значения
      for (let i = 0; i < stageIds.length; i++) {
        await tx.workflowStage.update({
          where: { id: stageIds[i] },
          data: { order: -(i + 1) },
        });
      }

      // Затем устанавливаем правильные положительные значения
      for (let i = 0; i < stageIds.length; i++) {
        await tx.workflowStage.update({
          where: { id: stageIds[i] },
          data: { order: i + 1 },
        });
      }
    });

    return this.findActive();
  }

  // Инициализировать workflow по умолчанию
  async initializeDefaultWorkflow() {
    const existingStages = await this.prisma.workflowStage.count();

    if (existingStages > 0) {
      throw new BadRequestException('Workflow уже настроен');
    }

    const defaultStages = [
      {
        name: 'Заготовка',
        description: 'Подготовка материалов и заготовок',
        order: 1,
        legacyStage: 'PREPARATION' as any,
      },
      {
        name: 'Сборка',
        description: 'Сборка изделий',
        order: 2,
        legacyStage: 'ASSEMBLY' as any,
      },
      {
        name: 'Покраска',
        description: 'Покраска и финишная обработка',
        order: 3,
        legacyStage: 'PAINTING' as any,
      },
      {
        name: 'Пошив',
        description: 'Пошив и обивка изделий',
        order: 4,
        legacyStage: 'SEWING' as any,
      },
      {
        name: 'Склад',
        description: 'Проверка качества, упаковка и отгрузка',
        order: 5,
        legacyStage: 'QUALITY_CHECK' as any,
      },
    ];

    for (const stage of defaultStages) {
      await this.prisma.workflowStage.create({ data: stage });
    }

    return this.findAll();
  }

  // Получить следующий этап в workflow
  async getNextStage(currentStageId: string) {
    const currentStage = await this.findOne(currentStageId);

    return this.prisma.workflowStage.findFirst({
      where: {
        order: { gt: currentStage.order },
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  // Получить предыдущий этап в workflow
  async getPreviousStage(currentStageId: string) {
    const currentStage = await this.findOne(currentStageId);

    return this.prisma.workflowStage.findFirst({
      where: {
        order: { lt: currentStage.order },
        isActive: true,
      },
      orderBy: {
        order: 'desc',
      },
    });
  }
}
