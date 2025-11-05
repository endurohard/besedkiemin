import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import { TaskCard } from '@/components/TaskCard';
import { TaskStatus } from '@/types';
import { Loader2, Package } from 'lucide-react';

export const TasksPage = () => {
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksApi.getMyTasks,
    refetchInterval: 30000, // Обновлять каждые 30 секунд
  });

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

  // Группируем задачи по заказам
  const tasksByOrder = useMemo(() => {
    const grouped = new Map<string, typeof tasks>();

    tasks?.forEach((task) => {
      const orderId = task.product?.order?.id || 'unknown';
      if (!grouped.has(orderId)) {
        grouped.set(orderId, []);
      }
      grouped.get(orderId)!.push(task);
    });

    return Array.from(grouped.entries()).map(([orderId, orderTasks]) => ({
      orderId,
      order: orderTasks[0]?.product?.order,
      tasks: orderTasks,
    }));
  }, [tasks]);

  // Статистика по статусам
  const newTasks = tasks?.filter((t) => t.status === TaskStatus.NEW) || [];
  const acceptedTasks = tasks?.filter((t) => t.status === TaskStatus.ACCEPTED) || [];
  const completedTasks = tasks?.filter((t) => t.status === TaskStatus.COMPLETED) || [];
  const passedTasks = tasks?.filter((t) => t.status === TaskStatus.PASSED) || [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Мои задачи</h1>
        <p className="text-muted-foreground mt-2">
          Управляйте своими ежедневными задачами на производстве
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="text-blue-600 text-sm font-medium">Новые</div>
          <div className="text-3xl font-bold text-blue-900">{newTasks.length}</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="text-yellow-600 text-sm font-medium">В работе</div>
          <div className="text-3xl font-bold text-yellow-900">{acceptedTasks.length}</div>
        </div>
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="text-green-600 text-sm font-medium">Завершено</div>
          <div className="text-3xl font-bold text-green-900">{completedTasks.length}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
          <div className="text-purple-600 text-sm font-medium">Передано</div>
          <div className="text-3xl font-bold text-purple-900">{passedTasks.length}</div>
        </div>
      </div>

      {/* Задачи как Kanban - каждый заказ это колонка */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {tasksByOrder.length === 0 ? (
          <div className="flex-1 text-center p-12 bg-muted/50 rounded-lg">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">Нет активных задач</p>
          </div>
        ) : (
          tasksByOrder.map(({ orderId, order, tasks: orderTasks }) => {
            // Группируем задачи заказа по статусам
            const newOrderTasks = orderTasks.filter((t) => t.status === TaskStatus.NEW);
            const acceptedOrderTasks = orderTasks.filter((t) => t.status === TaskStatus.ACCEPTED);
            const completedOrderTasks = orderTasks.filter((t) => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PASSED);

            return (
              <div
                key={orderId}
                className="flex-shrink-0 w-72 bg-white border-2 border-gray-200 rounded-lg"
              >
                {/* Заголовок заказа */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-gray-200 rounded-t-lg">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    {order?.orderNumber || 'Заказ'}
                  </h2>
                  {order && (
                    <div className="mt-2 space-y-1 text-xs text-gray-700">
                      <div className="font-medium">{order.customerName}</div>
                      {order.customerPhone && <div>{order.customerPhone}</div>}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-600">
                    Всего задач: {orderTasks.length}
                  </div>
                </div>

                {/* Задачи по статусам (вертикально) */}
                <div className="p-3 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {/* Новые задачи */}
                  {newOrderTasks.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-blue-200">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <h3 className="text-xs font-semibold text-blue-700 uppercase">
                          Новые ({newOrderTasks.length})
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {newOrderTasks.map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Задачи в работе */}
                  {acceptedOrderTasks.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-yellow-200">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        <h3 className="text-xs font-semibold text-yellow-700 uppercase">
                          В работе ({acceptedOrderTasks.length})
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {acceptedOrderTasks.map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Завершенные задачи */}
                  {completedOrderTasks.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-green-200">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <h3 className="text-xs font-semibold text-green-700 uppercase">
                          Завершено ({completedOrderTasks.length})
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {completedOrderTasks.map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Если все колонки пустые */}
                  {newOrderTasks.length === 0 &&
                    acceptedOrderTasks.length === 0 &&
                    completedOrderTasks.length === 0 && (
                      <div className="text-center p-8 text-gray-400">
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
