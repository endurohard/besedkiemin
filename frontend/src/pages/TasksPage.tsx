import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { tasksApi } from '@/lib/api';
import { TaskCard } from '@/components/TaskCard';
import { SchemaImageViewer } from '@/components/SchemaImageViewer';
import { TaskStatus, OrderPriority, Task } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Package, AlertTriangle, Flame, User, CheckCircle, ArrowRight, Image as ImageIcon } from 'lucide-react';

export const TasksPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const selectedWorkerId = searchParams.get('worker');

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksApi.getMyTasks,
    refetchInterval: 15000,
  });

  // Загружаем задачи отдела (для отображения задач выбранного сотрудника)
  const { data: departmentTasks } = useQuery({
    queryKey: ['department-tasks'],
    queryFn: tasksApi.getDepartmentTasks,
    enabled: !!selectedWorkerId,
  });

  // Мутация для завершения задачи
  const completeMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await tasksApi.completeTask(taskId, {});
      // После завершения автоматически передаём дальше
      await tasksApi.passTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['department-tasks'] });
    },
    onError: (error: any) => {
      alert(`Ошибка: ${error?.response?.data?.message || error?.message || 'Неизвестная ошибка'}`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['department-tasks'] });
    },
  });

  // Получаем данные выбранного сотрудника
  const selectedWorkerData = useMemo(() => {
    if (!selectedWorkerId || !departmentTasks) return null;
    return departmentTasks.find(item => item.worker.id === selectedWorkerId);
  }, [selectedWorkerId, departmentTasks]);

  // Группируем задачи по заказам
  const tasksByOrder = useMemo(() => {
    const grouped = new Map<string, typeof tasks>();

    const activeTasks = tasks?.filter((task) =>
      task.status === TaskStatus.NEW ||
      task.status === TaskStatus.ACCEPTED ||
      task.status === TaskStatus.COMPLETED
    ) || [];

    activeTasks.forEach((task) => {
      const orderId = task.product?.order?.id || 'unknown';
      if (!grouped.has(orderId)) {
        grouped.set(orderId, []);
      }
      grouped.get(orderId)!.push(task);
    });

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
      default:
        return {
          border: 'border-gray-200',
          header: 'bg-gradient-to-r from-blue-50 to-blue-100 border-gray-200',
          icon: <Package className="w-4 h-4 text-primary" />,
          text: 'text-gray-900',
          badge: 'bg-primary/100 text-white',
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

  // Если выбран сотрудник - показываем только его задачи
  if (selectedWorkerId && selectedWorkerData) {
    const workerTasks = selectedWorkerData.tasks.filter(t => t.status === TaskStatus.ACCEPTED);
    const isCurrentUser = selectedWorkerData.worker.isCurrentUser;

    return (
      <div className="space-y-4">
        {/* Заголовок с именем сотрудника */}
        <div className={`p-4 rounded-lg ${isCurrentUser ? 'bg-primary/10 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCurrentUser ? 'bg-primary/100' : 'bg-gray-400'}`}>
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-lg font-bold ${isCurrentUser ? 'text-blue-800' : 'text-gray-800'}`}>
                {selectedWorkerData.worker.lastName} {selectedWorkerData.worker.firstName}
                {isCurrentUser && <span className="ml-2 text-sm font-normal">(Это вы)</span>}
              </h1>
              <p className="text-sm text-gray-500">
                {workerTasks.length} {workerTasks.length === 1 ? 'задача' : workerTasks.length < 5 ? 'задачи' : 'задач'} в работе
              </p>
            </div>
          </div>
        </div>

        {/* Список задач */}
        {workerTasks.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500">Нет задач в работе</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {workerTasks.map((task) => (
              <WorkerTaskCard
                key={task.id}
                task={task}
                isCurrentUser={isCurrentUser}
                onComplete={() => completeMutation.mutate(task.id)}
                isCompleting={completeMutation.isPending && completeMutation.variables === task.id}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Обычный вид - все задачи
  return (
    <div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {tasksByOrder.length === 0 ? (
          <div className="flex-1 text-center p-8 bg-muted/50 rounded-lg">
            <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Нет активных задач</p>
          </div>
        ) : (
          tasksByOrder.map(({ orderId, order, tasks: orderTasks }) => {
            const newOrderTasks = orderTasks?.filter((t) => t.status === TaskStatus.NEW) || [];
            const acceptedOrderTasks = orderTasks?.filter((t) => t.status === TaskStatus.ACCEPTED) || [];
            const completedOrderTasks = orderTasks?.filter((t) => t.status === TaskStatus.COMPLETED) || [];

            const styles = getOrderStyles(order?.priority);
            const priorityLabel = getPriorityLabel(order?.priority);

            return (
              <div
                key={orderId}
                className={`flex-shrink-0 w-64 bg-white rounded-lg ${styles.border}`}
              >
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
                  {order && (user?.role?.code === 'MANAGER' || user?.role?.code === 'LOGIST') && (
                    <div className="mt-1 text-xs text-gray-700">
                      <span className="font-medium">{order.customerName}</span>
                      {order.customerPhone && <span className="ml-2">{order.customerPhone}</span>}
                    </div>
                  )}
                </div>

                <div className="p-2 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto">
                  {newOrderTasks.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-blue-200">
                        <span className="w-1.5 h-1.5 bg-primary/100 rounded-full"></span>
                        <h3 className="text-[10px] font-semibold text-primary uppercase">
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

                  {completedOrderTasks.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-green-200">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        <h3 className="text-[10px] font-semibold text-green-700 uppercase">
                          Завершено ({completedOrderTasks.length})
                        </h3>
                      </div>
                      <div className="space-y-1.5">
                        {completedOrderTasks.map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    </div>
                  )}

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

// Компонент карточки задачи для выбранного сотрудника
const WorkerTaskCard = ({
  task,
  isCurrentUser,
  onComplete,
  isCompleting
}: {
  task: Task;
  isCurrentUser: boolean;
  onComplete: () => void;
  isCompleting: boolean;
}) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const schemaGallery = task.product?.schemaImageUrls && task.product.schemaImageUrls.length > 0
    ? task.product.schemaImageUrls
    : task.product?.schemaImageUrl
      ? [task.product.schemaImageUrl]
      : [];
  const schemaUrl = schemaGallery[0];

  const isCustom = !!task.product?.isCustom;

  return (
    <div
      className={`p-4 rounded-lg border ${
        isCustom
          ? 'bg-pink-50 border-pink-400 ring-1 ring-pink-300'
          : isCurrentUser
            ? 'bg-primary/10 border-blue-200'
            : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-semibold text-gray-800">{task.title}</h3>
          {isCustom && (
            <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-pink-500 text-white text-[10px] font-semibold uppercase">
              ★ Индивидуальный
            </span>
          )}
        </div>
        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
          В работе
        </span>
      </div>

      {task.product && (
        <div className="space-y-1 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            <span>{task.product.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Заказ:</span>
            <span className="font-medium">{task.product.order?.orderNumber || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Кол-во:</span>
            <span className="font-medium">{task.quantity || task.product.quantity} шт.</span>
          </div>
          {task.product.dimensions && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Размеры:</span>
              <span className="font-medium">{task.product.dimensions}</span>
            </div>
          )}
        </div>
      )}

      {task.product?.description && (
        <div className="mb-3 p-2 bg-muted/50 border-l-4 border-primary rounded text-xs">
          <div className="font-medium text-muted-foreground mb-0.5">Комментарий к товару:</div>
          <p className="whitespace-pre-wrap text-gray-700">{task.product.description}</p>
        </div>
      )}

      {schemaUrl && (
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          className="mb-3 w-full flex items-center gap-2 rounded-md border border-border bg-card p-2 hover:border-primary transition-colors cursor-zoom-in"
        >
          <img
            src={schemaUrl}
            alt="Схема"
            className="w-14 h-14 object-cover rounded border border-border"
          />
          <div className="flex items-center gap-1 text-xs text-primary">
            <ImageIcon className="w-4 h-4" />
            <span>Посмотреть схему</span>
          </div>
        </button>
      )}

      {task.notes && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          {task.notes}
        </div>
      )}

      {/* Кнопка завершить - доступна для всех сотрудников отдела */}
      <button
        onClick={onComplete}
        disabled={isCompleting}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 ${
          isCurrentUser
            ? 'bg-green-500 hover:bg-green-600 disabled:bg-green-300'
            : 'bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300'
        } text-white font-medium rounded-lg transition-colors`}
      >
        {isCompleting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Завершение...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4" />
            Завершить
            <ArrowRight className="w-4 h-4" />
            Передать
          </>
        )}
      </button>
      {!isCurrentUser && (
        <div className="text-center text-[10px] text-gray-400 mt-1">
          Задача сотрудника отдела
        </div>
      )}

      {viewerOpen && schemaGallery.length > 0 && (
        <SchemaImageViewer images={schemaGallery} onClose={() => setViewerOpen(false)} />
      )}
    </div>
  );
};
