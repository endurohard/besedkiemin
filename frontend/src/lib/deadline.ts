import { Order, OrderStatus } from '@/types';

export type DeadlineLevel = 'none' | 'ok' | 'soon' | 'overdue';

export interface DeadlineInfo {
  level: DeadlineLevel;
  daysLeft: number | null; // целое число дней до дедлайна (отрицательное = просрочено)
  label: string; // человекочитаемая подпись
  /** Требуется ли визуальное мигание красным (<= 4 дня или просрочено) */
  blink: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;
// За сколько дней до дедлайна заказ начинает мигать красным
export const DEADLINE_WARNING_DAYS = 4;

/**
 * Рассчитывает статус срока заказа по плановой дате завершения.
 * Сравнение по календарным дням (без учёта времени).
 */
export function getDeadlineInfo(order: Pick<Order, 'deadline' | 'status'>): DeadlineInfo {
  if (!order.deadline) {
    return { level: 'none', daysLeft: null, label: '', blink: false };
  }

  // Завершённые/отменённые заказы не мигают
  const isClosed = order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(order.deadline);
  due.setHours(0, 0, 0, 0);

  const daysLeft = Math.round((due.getTime() - today.getTime()) / DAY_MS);

  let level: DeadlineLevel;
  let label: string;
  if (daysLeft < 0) {
    level = 'overdue';
    label = `Просрочен на ${Math.abs(daysLeft)} дн.`;
  } else if (daysLeft === 0) {
    level = 'soon';
    label = 'Срок сегодня';
  } else if (daysLeft <= DEADLINE_WARNING_DAYS) {
    level = 'soon';
    label = `Осталось ${daysLeft} дн.`;
  } else {
    level = 'ok';
    label = `Осталось ${daysLeft} дн.`;
  }

  return {
    level,
    daysLeft,
    label,
    blink: !isClosed && (level === 'soon' || level === 'overdue'),
  };
}
