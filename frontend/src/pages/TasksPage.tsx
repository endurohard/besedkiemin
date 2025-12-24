import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import { TaskCard } from '@/components/TaskCard';
import { TaskStatus, OrderPriority } from '@/types';
import { Loader2, Package, AlertTriangle, Flame } from 'lucide-react';

export const TasksPage = () => {
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksApi.getMyTasks,
    refetchInterval: 30000, // Обновлять каждые 30 секунд
  });

  // Группируем задачи по заказам
  // Показываем только активные задачи (NEW и ACCEPTED)
  const tasksByOrder = useMemo(() => {
    const grouped = new Map<string, typeof tasks>();

    // Фильтруем только активные задачи
    const activeTasks = tasks?.filter((task) =>
      task.status === TaskStatus.NEW || task.status === TaskStatus.ACCEPTED
    ) || [];

    activeTasks.forEach((task) => {
      const orderId = task.product?.order?.id || 'unknown';
      if (!grouped.has(orderId)) {
        grouped.set(orderId, []);
      }
      grouped.get(orderId)!.push(task);
    });

    // Сортируем заказы по приоритету (URGENT первым)
    const priorityOrder = {
      [OrderPriority.URGENT]: 0,
      [OrderPriority.HIGH]: 1,
      [OrderPriority.NORMAL]: 2,
      [OrderPriority.LOW]: 3,
    };

    return Array.from(grouped.entries())
      .map(([orderId, orderTasks]) => ({
        orderId,
        order: orderTasks?.[0]?.product?.order,
        tasks: orderTasks,
      }))
      .sort((a, b) => {
        const priorityA = priorityOrder[a.order?.priority as OrderPriority] ?? 2;
        const priorityB = priorityOrder[b.order?.priority as OrderPriority] ?? 2;
        return priorityA - priorityB;
      });
  }, [tasks]);

  // Функция для получения стилей заказа по приоритету
  const getOrderStyles = (priority?: string) => {
    switch (priority) {
      case OrderPriority.URGENT:
        return {
          border: 'border-red-400 border-2',
          header: 'bg-gradient-to-r from-red-100 to-red-200 border-red-300',
          icon: <Flame className="w-4 h-4 text-red-600" />,
          text: 'text-red-900',
          badge: 'bg-red-500 text-white',
        };
      case OrderPriority.HIGH:
        return {
          border: 'border-orange-400 border-2',
          header: 'bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300',
          icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
          text: 'text-orange-900',
          badge: 'bg-orange-500 text-white',
        };
      case OrderPriority.LOW:
        return {
          border: 'border-gray-200',
          header: 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200',
          icon: <Package className="w-4 h-4 text-gray-500" />,
          text: 'text-gray-700',
          badge: 'bg-gray-400 text-white',
        };
      default: // NORMAL
        return {
          border: 'border-gray-200',
          header: 'bg-gradient-to-r from-blue-50 to-blue-100 border-gray-200',
          icon: <Package className="w-4 h-4 text-blue-600" />,
          text: 'text-gray-900',
          badge: 'bg-blue-500 text-white',
        };
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case OrderPriority.URGENT: return 'СРОЧНО';
      case OrderPriority.HIGH: return 'Высокий';
      case OrderPriority.LOW: return 'Низкий';
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
          Ошибка загрузки задач: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Задачи как Kanban - каждый заказ это колонка */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {tasksByOrder.length === 0 ? (
          <div className="flex-1 text-center p-8 bg-muted/50 rounded-lg">
            <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Нет активных задач</p>
          </div>
        ) : (
          tasksByOrder.map(({ orderId, order, tasks: orderTasks }) => {
            // Группируем задачи заказа по статусам
            // Показываем только активные задачи (NEW и ACCEPTED), без завершенных
            const newOrderTasks = orderTasks?.filter((t) => t.status === TaskStatus.NEW) || [];
            const acceptedOrderTasks = orderTasks?.filter((t) => t.status === TaskStatus.ACCEPTED) || [];
            const completedOrderTasks = []; // Не показываем завершенные задачи

            const styles = getOrderStyles(order?.priority);
            const priorityLabel = getPriorityLabel(order?.priority);

            return (
              <div
                key={orderId}
                className={`flex-shrink-0 w-64 bg-white rounded-lg ${styles.border}`}
              >
                {/* Заголовок заказа */}
                <div className={`p-2 border-b rounded-t-lg ${styles.header}`}>
                  <div className="flex items-center justify-between">
                    <h2 className={`text-sm font-bold flex items-center gap-1.5 ${styles.text}`}>
                      {styles.icon}
                      {order?.orderNumber || 'Заказ'}
                    </h2>
                    {priorityLabel && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${styles.badge}`}>
                        {priorityLabel}
                      </span>
                    )}
                  </div>
                  {order && (
                    <div className="mt-1 text-xs text-gray-700">
                      <span className="font-medium">{order.customerName}</span>
                      {order.customerPhone && <span className="ml-2">{order.customerPhone}</span>}
                    </div>
                  )}
                </div>

                {/* Задачи по статусам (вертикально) */}
                <div className="p-2 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto">
                  {/* Новые задачи */}
                  {newOrderTasks.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-blue-200">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        <h3 className="text-[10px] font-semibold text-blue-700 uppercase">
                          Новые ({newOrderTasks.length})
                        </h3>
                      </div>
                      <div className="space-y-1.5">
                        {newOrderTasks.map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Задачи в работе */}
                  {acceptedOrderTasks.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-yellow-200">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                        <h3 className="text-[10px] font-semibold text-yellow-700 uppercase">
                          В работе ({acceptedOrderTasks.length})
                        </h3>
                      </div>
                      <div className="space-y-1.5">
                        {acceptedOrderTasks.map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Если все колонки пустые */}
                  {newOrderTasks.length === 0 &&
                    acceptedOrderTasks.length === 0 &&
                    completedOrderTasks.length === 0 && (
                      <div className="text-center p-4 text-gray-400 text-xs">
                        Нет задач
                      </div>
                    )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
