import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { tasksApi } from '@/lib/api';
import { TaskCard } from '@/components/TaskCard';
import { SchemaImageViewer } from '@/components/SchemaImageViewer';
import { TaskStatus, OrderPriority, Task, ProductionStage } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { stageLabels } from '@/lib/labels';
import { Loader2, Package, AlertTriangle, Flame, User, CheckCircle, ArrowRight, Image as ImageIcon, ChevronRight, Calendar, X } from 'lucide-react';

const getNextStageName = (stage: ProductionStage, requiresSewing?: boolean | null): string => {
  switch (stage) {
    case ProductionStage.DESIGN: return stageLabels[ProductionStage.PREPARATION];
    case ProductionStage.PREPARATION: return stageLabels[ProductionStage.PAINTING];
    case ProductionStage.PAINTING: return requiresSewing ? stageLabels[ProductionStage.SEWING] : stageLabels[ProductionStage.ASSEMBLY];
    case ProductionStage.SEWING: return stageLabels[ProductionStage.ASSEMBLY];
    case ProductionStage.ASSEMBLY: return stageLabels[ProductionStage.QUALITY_CHECK];
    default: return 'Следующий отдел';
  }
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const TasksPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const selectedWorkerId = searchParams.get('worker');

  // Открытый заказ (выпадающее окно с позициями); по умолчанию все свёрнуты
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const toggleOrder = (orderId: string) =>
    setOpenOrderId((prev) => (prev === orderId ? null : orderId));

  // Текущий пользователь — для скрытия чужих принятых задач на общей доске
  const currentUserId = user?.id;
  const isManagerView =
    user?.role?.code === 'MANAGER' ||
    user?.role?.code === 'OWNER' ||
    user?.role?.code === 'SUPER_ADMIN' ||
    user?.role?.code === 'LOGIST';

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

    const activeTasks = (tasks?.filter((task) =>
      task.status === TaskStatus.NEW ||
      task.status === TaskStatus.ACCEPTED ||
      task.status === TaskStatus.COMPLETED
    ) || [])
      // На общей доске отдела не показываем задачи, которые уже принял другой мастер —
      // они остаются только в его учётке (?worker=). Менеджер/владелец видит всё.
      .filter((task) => {
        if (isManagerView) return true;
        if (task.status === TaskStatus.NEW) return true;
        const assignee = task.assignedTo?.id || task.assignedToId;
        return !assignee || assignee === currentUserId;
      });

    activeTasks.forEach((task) => {
      const orderId = task.product?.order?.id || 'unknown';
      if (!grouped.has(orderId)) {
        grouped.set(orderId, []);
      }
      grouped.get(orderId)!.push(task);
    });

    // Ранг типа заказа для сортировки: индивидуальные → клиентские → внутренние
    const getOrderRank = (order: any, orderTasks?: Task[]) => {
      const isInternal = order?.customerName === 'Внутренний заказ';
      if (isInternal) return 2;
      const isCustom = (orderTasks || []).some((t) => t.product?.isCustom);
      if (isCustom) return 0; // индивидуальный
      return 1; // клиентский
    };

    return Array.from(grouped.entries())
      .map(([orderId, orderTasks]) => ({
        orderId,
        order: orderTasks?.[0]?.product?.order,
        tasks: orderTasks,
        // Когда заявка поступила в отдел = самая ранняя дата создания задачи по заказу
        arrivedAt: (orderTasks || [])
          .map((t) => t.createdAt)
          .filter(Boolean)
          .sort()[0],
      }))
      .sort((a, b) => {
        // 1) тип заказа: индивидуальные и клиентские первыми, внутренние после
        const rankA = getOrderRank(a.order, a.tasks);
        const rankB = getOrderRank(b.order, b.tasks);
        if (rankA !== rankB) return rankA - rankB;
        // 2) внутри группы — по дате принятия заказа (старые выше: 04 → 05 → 06)
        return (a.order?.createdAt || '').localeCompare(b.order?.createdAt || '');
      });
  }, [tasks, isManagerView, currentUserId]);

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
  const openData = openOrderId ? tasksByOrder.find((o) => o.orderId === openOrderId) : null;

  return (
    <div>
      <div className="flex flex-wrap items-start gap-3 pb-2">
        {tasksByOrder.length === 0 ? (
          <div className="flex-1 text-center p-8 bg-muted/50 rounded-lg">
            <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Нет активных задач</p>
          </div>
        ) : (
          tasksByOrder.map(({ orderId, order, tasks: orderTasks, arrivedAt }) => {
            const newOrderTasks = orderTasks?.filter((t) => t.status === TaskStatus.NEW) || [];
            const acceptedOrderTasks = orderTasks?.filter((t) => t.status === TaskStatus.ACCEPTED) || [];
            const completedOrderTasks = orderTasks?.filter((t) => t.status === TaskStatus.COMPLETED) || [];

            const styles = getOrderStyles(order?.priority);
            const priorityLabel = getPriorityLabel(order?.priority);

            const hasNew = newOrderTasks.length > 0;
            const isOpen = openOrderId === orderId;
            // Свёрнутая колонка с непринятыми задачами — мигает, чтобы привлечь внимание
            const blink = hasNew && !isOpen;

            return (
              <div
                key={orderId}
                className={`flex-shrink-0 w-64 bg-white rounded-lg ${styles.border} ${
                  blink ? 'ring-2 ring-primary animate-blink' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleOrder(orderId)}
                  className={`w-full text-left p-2 rounded-lg ${styles.header} cursor-pointer hover:brightness-95 transition`}
                  title="Нажмите, чтобы посмотреть состав"
                >
                  <div className="flex items-center justify-between">
                    <h2 className={`text-sm font-bold flex items-center gap-1.5 min-w-0 ${styles.text}`}>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                      {styles.icon}
                      <span className="truncate">{order?.orderNumber || 'Заказ'}</span>
                    </h2>
                    {priorityLabel && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${styles.badge}`}>
                        {priorityLabel}
                      </span>
                    )}
                  </div>
                  {/* Счётчики задач — видны всегда, даже в свёрнутом виде */}
                  <div className="mt-1 flex items-center gap-2 text-[10px] font-semibold">
                    {hasNew && (
                      <span className="flex items-center gap-1 text-primary">
                        <span className="w-1.5 h-1.5 bg-primary/100 rounded-full"></span>
                        Новые {newOrderTasks.length}
                      </span>
                    )}
                    {acceptedOrderTasks.length > 0 && (
                      <span className="flex items-center gap-1 text-yellow-700">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                        В работе {acceptedOrderTasks.length}
                      </span>
                    )}
                    {completedOrderTasks.length > 0 && (
                      <span className="flex items-center gap-1 text-green-700">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        Готово {completedOrderTasks.length}
                      </span>
                    )}
                  </div>
                  {/* Даты: создание заказа и поступление в отдел */}
                  <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Заказ от {formatDate(order?.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" /> В отдел {formatDate(arrivedAt)}
                    </span>
                  </div>
                  {order && (user?.role?.code === 'MANAGER' || user?.role?.code === 'LOGIST') && (
                    <div className="mt-1 text-xs text-gray-700">
                      <span className="font-medium">{order.customerName}</span>
                      {order.customerPhone && <span className="ml-2">{order.customerPhone}</span>}
                    </div>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Выпадающее окно с позициями заказа (сетка) */}
      {openData && (() => {
        const { order, tasks: orderTasks, arrivedAt } = openData;
        const newOrderTasks = orderTasks?.filter((t) => t.status === TaskStatus.NEW) || [];
        const acceptedOrderTasks = orderTasks?.filter((t) => t.status === TaskStatus.ACCEPTED) || [];
        const completedOrderTasks = orderTasks?.filter((t) => t.status === TaskStatus.COMPLETED) || [];
        const styles = getOrderStyles(order?.priority);
        const priorityLabel = getPriorityLabel(order?.priority);

        const Section = ({
          title,
          color,
          dot,
          items,
        }: {
          title: string;
          color: string;
          dot: string;
          items: Task[];
        }) =>
          items.length === 0 ? null : (
            <div>
              <div className={`flex items-center gap-1.5 mb-2 pb-1 border-b ${color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
                <h3 className="text-xs font-semibold uppercase">
                  {title} ({items.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {items.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          );

        return (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto"
            onClick={() => setOpenOrderId(null)}
          >
            <div
              className={`bg-white rounded-lg shadow-2xl w-full max-w-5xl my-8 ${styles.border}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Шапка окна */}
              <div className={`p-3 border-b rounded-t-lg ${styles.header}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className={`text-base font-bold flex items-center gap-2 ${styles.text}`}>
                      {styles.icon}
                      <span className="truncate">{order?.orderNumber || 'Заказ'}</span>
                      {priorityLabel && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${styles.badge}`}>
                          {priorityLabel}
                        </span>
                      )}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Заказ от {formatDate(order?.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <ArrowRight className="w-3.5 h-3.5" /> Поступил в отдел {formatDate(arrivedAt)}
                      </span>
                    </div>
                    {order && (user?.role?.code === 'MANAGER' || user?.role?.code === 'LOGIST') && (
                      <div className="mt-1 text-xs text-gray-700">
                        <span className="font-medium">{order.customerName}</span>
                        {order.customerPhone && <span className="ml-2">{order.customerPhone}</span>}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenOrderId(null)}
                    className="shrink-0 p-1.5 rounded-md hover:bg-black/10 transition"
                    title="Закрыть"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Позиции сеткой */}
              <div className="p-3 space-y-4 max-h-[75vh] overflow-y-auto">
                <Section title="Новые" color="border-blue-200 text-primary" dot="bg-primary/100" items={newOrderTasks} />
                <Section title="В работе" color="border-yellow-200 text-yellow-700" dot="bg-yellow-500" items={acceptedOrderTasks} />
                <Section title="Завершено" color="border-green-200 text-green-700" dot="bg-green-500" items={completedOrderTasks} />
                {newOrderTasks.length === 0 &&
                  acceptedOrderTasks.length === 0 &&
                  completedOrderTasks.length === 0 && (
                    <div className="text-center p-8 text-gray-400 text-sm">Нет задач</div>
                  )}
              </div>
            </div>
          </div>
        );
      })()}
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
  const [showConfirm, setShowConfirm] = useState(false);
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

      {/* Кнопка завершить или блок подтверждения */}
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isCompleting}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 ${
            isCurrentUser
              ? 'bg-green-500 hover:bg-green-600 disabled:bg-green-300'
              : 'bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300'
          } text-white font-medium rounded-lg transition-colors`}
        >
          <CheckCircle className="w-4 h-4" />
          Завершить
          <ArrowRight className="w-4 h-4" />
          Передать
        </button>
      ) : (
        <div className="space-y-2 p-3 border border-green-200 rounded-lg bg-green-50">
          <p className="text-sm font-semibold text-green-900">Завершить и передать далее?</p>
          <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
            <span>{stageLabels[task.stage] || task.stage}</span>
            <ArrowRight className="w-3 h-3" />
            <span className="font-medium">{getNextStageName(task.stage, task.product?.requiresSewing)}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onComplete}
              disabled={isCompleting}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 ${
                isCurrentUser
                  ? 'bg-green-500 hover:bg-green-600 disabled:bg-green-300'
                  : 'bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300'
              } text-white font-medium rounded-lg transition-colors text-sm`}
            >
              {isCompleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Завершение...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Подтвердить
                </>
              )}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isCompleting}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
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
