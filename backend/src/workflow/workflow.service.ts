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
    const existingStage = await this.prisma.workflowStage.findUnique({
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

    // Обновляем порядок в транзакции
    const updatePromises = stageIds.map((stageId, index) => {
      return this.prisma.workflowStage.update({
        where: { id: stageId },
        data: { order: index + 1 },
      });
    });

    await this.prisma.$transaction(updatePromises);

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
        name: 'Менеджер',
        description: 'Прием и оформление заказа',
        order: 1,
        role: 'MANAGER' as any,
        legacyStage: 'PENDING' as any,
      },
      {
        name: 'Проектировщик',
        description: 'Разработка проекта',
        order: 2,
        role: 'DESIGNER' as any,
        legacyStage: 'DESIGN' as any,
      },
      {
        name: 'Заготовка',
        description: 'Подготовка материалов и заготовок',
        order: 3,
        role: 'PREPARER' as any,
        legacyStage: 'PREPARATION' as any,
      },
      {
        name: 'Маляр',
        description: 'Покраска изделий',
        order: 4,
        role: 'PAINTER' as any,
        legacyStage: 'PAINTING' as any,
      },
      {
        name: 'Склад',
        description: 'Контроль качества и хранение',
        order: 5,
        role: 'WAREHOUSE' as any,
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
