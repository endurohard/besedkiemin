import { TaskStatus, ProductionStage, OrderStatus, ShipmentStatus } from '@/types';

export const taskStatusLabels: Record<string, string> = {
  [TaskStatus.NEW]: 'Новая',
  [TaskStatus.ACCEPTED]: 'В работе',
  [TaskStatus.COMPLETED]: 'Завершена',
  [TaskStatus.PASSED]: 'Передана',
  [TaskStatus.REJECTED]: 'Брак',
};

export const stageLabels: Record<string, string> = {
  [ProductionStage.PENDING]: 'Менеджер',
  [ProductionStage.DESIGN]: 'Проектирование',
  [ProductionStage.PREPARATION]: 'Заготовка',
  [ProductionStage.PAINTING]: 'Покраска',
  [ProductionStage.SEWING]: 'Пошив',
  [ProductionStage.ASSEMBLY]: 'Сборка',
  [ProductionStage.QUALITY_CHECK]: 'Склад',
  [ProductionStage.COMPLETED]: 'Завершено',
  [ProductionStage.REJECTED]: 'Брак',
};

export const orderStatusLabels: Record<string, string> = {
  [OrderStatus.NEW]: 'Новый',
  [OrderStatus.IN_PRODUCTION]: 'В производстве',
  [OrderStatus.COMPLETED]: 'Завершен',
  [OrderStatus.CANCELLED]: 'Отменен',
};

export const shipmentStatusLabels: Record<string, string> = {
  [ShipmentStatus.PENDING]: 'Ожидает',
  [ShipmentStatus.IN_TRANSIT]: 'В пути',
  [ShipmentStatus.DELIVERED]: 'Доставлено',
  [ShipmentStatus.CANCELLED]: 'Отменено',
};

export function getTaskStatusColor(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.NEW:
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case TaskStatus.ACCEPTED:
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case TaskStatus.COMPLETED:
      return 'bg-green-100 text-green-800 border-green-300';
    case TaskStatus.PASSED:
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case TaskStatus.REJECTED:
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

// Alias for backend compatibility
export const STAGE_TO_NAME = stageLabels;
