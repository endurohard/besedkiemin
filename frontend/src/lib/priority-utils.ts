import { OrderPriority } from '@/types';

export const getPriorityLabel = (priority: OrderPriority): string => {
  switch (priority) {
    case OrderPriority.LOW:
      return 'Низкий';
    case OrderPriority.NORMAL:
      return 'Обычный';
    case OrderPriority.HIGH:
      return 'Высокий';
    case OrderPriority.URGENT:
      return 'Срочный';
    default:
      return 'Обычный';
  }
};

export const getPriorityColor = (priority: OrderPriority): string => {
  switch (priority) {
    case OrderPriority.LOW:
      return 'bg-gray-100 text-gray-800 border-gray-300';
    case OrderPriority.NORMAL:
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case OrderPriority.HIGH:
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case OrderPriority.URGENT:
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-blue-100 text-blue-800 border-blue-300';
  }
};

export const getPrioritySortOrder = (priority: OrderPriority): number => {
  switch (priority) {
    case OrderPriority.URGENT:
      return 0;
    case OrderPriority.HIGH:
      return 1;
    case OrderPriority.NORMAL:
      return 2;
    case OrderPriority.LOW:
      return 3;
    default:
      return 2;
  }
};
