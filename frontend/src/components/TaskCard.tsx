import { useState, useEffect } from 'react';
import { Task, TaskStatus } from '@/types';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { useAuthStore } from '@/store/authStore';
import { tasksApi } from '@/lib/api';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, ArrowRight, Package, User } from 'lucide-react';
import { TaskTimer } from './TaskTimer';

interface TaskCardProps {
  task: Task;
}

export const TaskCard = ({ task }: TaskCardProps) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(task.quantity || task.product?.quantity || 0);
  const [completedQuantity, setCompletedQuantity] = useState(task.quantity || task.product?.quantity || 0);
  const [rejectNotes, setRejectNotes] = useState('');
  const [rejectQuantity, setRejectQuantity] = useState(1); // Количество брака
  const [requestPhotoViaTelegram, setRequestPhotoViaTelegram] = useState(false);
  const [returnToStage, setReturnToStage] = useState<string>('PAINTING'); // Стадия для возврата
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showWorkerSelectModal, setShowWorkerSelectModal] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [acceptQuantity, setAcceptQuantity] = useState(task.quantity || task.product?.quantity || 1);

  // Загружаем сотрудников отдела когда открывается модальное окно
  const { data: departmentWorkers, isLoading: isLoadingWorkers } = useQuery({
    queryKey: ['department-workers'],
    queryFn: tasksApi.getDepartmentWorkers,
    enabled: showWorkerSelectModal,
  });

  const currentUserId = user?.id;

  // Автоматически выбираем текущего пользователя когда загрузились работники
  // Это нужно чтобы по умолчанию задача назначалась тому, кто её принимает
  useEffect(() => {
    if (departmentWorkers && selectedWorkerId === '' && currentUserId) {
      const currentWorker = departmentWorkers.find(w => w.id === currentUserId);
      if (currentWorker) {
        setSelectedWorkerId(currentUserId);
      }
    }
  }, [departmentWorkers, currentUserId, selectedWorkerId]);

  // Доступное количество для обработки
  const availableQuantity = (task.quantity || task.product?.quantity || 0) - (task.quantityProcessed || 0);

  const isWarehouse = user?.role?.code === 'WAREHOUSE';
  const isPreparer = user?.role?.code === 'PREPARER';
  const isPainter = user?.role?.code === 'PAINTER';
  const isAssembler = user?.role?.code === 'ASSEMBLER';
  const isSewer = user?.role?.code === 'SEWER'; // Пошив
  const isSimplifiedRole = isPreparer || isPainter || isAssembler || isSewer; // Упрощенный интерфейс
  // Роли которые выбирают сотрудника при принятии задачи
  const needsWorkerSelection = isPreparer || isPainter || isAssembler || isSewer;

  // Мутации для действий с задачами
  const acceptMutation = useMutation({
    mutationFn: (params?: { workerId?: string; quantity?: number }) =>
      tasksApi.acceptTask(task.id, params?.workerId, params?.quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowWorkerSelectModal(false);
      setSelectedWorkerId('');
      setAcceptQuantity(task.quantity || task.product?.quantity || 1);
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => tasksApi.completeTask(task.id, { notes, quantity: completedQuantity }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNotes('');
      setShowNotesInput(false);

      // Для упрощённых ролей (заготовщики, маляры, сборщики, швеи) - автоматически передаём дальше
      // Также для количества = 1 автоматически передаём
      if (isSimplifiedRole || (task.product && task.product.quantity === 1)) {
        try {
          await tasksApi.passTask(task.id);
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        } catch (e) {
          // Если auto-pass не удался — задача останется в COMPLETED, пользователь сможет нажать "Передать" вручную
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
      }
    },
  });

  const passMutation = useMutation({
    mutationFn: () => tasksApi.passTask(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const result = await tasksApi.rejectTask(task.id, {
        notes: rejectNotes,
        quantity: rejectQuantity,
        requestPhoto: requestPhotoViaTelegram,
        returnToStage: returnToStage
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setRejectNotes('');
      setRejectQuantity(1);
      setRequestPhotoViaTelegram(false);
      setShowRejectForm(false);
    },
    onError: (error: any) => {
      alert(`Ошибка при браковке: ${error?.response?.data?.message || error?.message || 'Неизвестная ошибка'}`);
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => tasksApi.approveTask(task.id, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowApproveForm(false);
    },
  });

  const getStatusColor = (status: TaskStatus) => {
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
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.NEW:
        return 'Новая';
      case TaskStatus.ACCEPTED:
        return 'В работе';
      case TaskStatus.COMPLETED:
        return 'Завершена';
      case TaskStatus.PASSED:
        return 'Передана';
      case TaskStatus.REJECTED:
        return 'Брак';
      default:
        return status;
    }
  };

  return (
    <Card className="mb-1.5">
      <CardHeader className="p-2 pb-1">
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xs font-semibold truncate">{task.title}</CardTitle>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border flex-shrink-0 ${getStatusColor(
              task.status
            )}`}
          >
            {getStatusText(task.status)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        {/* Таймер задачи с приоритетом заказа */}
        <TaskTimer
          createdAt={task.createdAt}
          acceptedAt={task.acceptedAt}
          productionTimeHours={task.product?.productType?.productionTimeHours}
          priority={task.product?.order?.priority || task.priority}
        />

        {/* Информация о браке - показываем кто должен исправить */}
        {task.title?.includes('БРАК') && task.assignedTo && (
          <div className="mb-2 p-2 bg-red-100 border-2 border-red-400 rounded text-[11px]">
            <div className="flex items-center gap-1 text-red-800 font-bold">
              <span>🚨 БРАК - Исполнитель:</span>
              <span className="text-red-900">{task.assignedTo.firstName} {task.assignedTo.lastName}</span>
            </div>
          </div>
        )}

        {/* Информация о продукте и заказе */}
        {task.product && (
          <div className="mb-2 p-1.5 bg-muted/50 rounded text-[11px]">
            <div className="space-y-0.5">
              <div className="flex gap-1">
                <span className="text-muted-foreground">Продукт:</span>
                <span className="font-medium truncate">{task.product.name}</span>
              </div>
              <div className="flex gap-1">
                <span className="text-muted-foreground">Кол-во:</span>
                <span className="font-medium">{task.quantity || task.product.quantity} шт.</span>
              </div>
            </div>

            {/* Цвет/покрытие - для маляра */}
            {isPainter && task.product.color && (
              <div className="mt-1 pt-1 border-t border-orange-200 bg-orange-50 p-1 rounded">
                <div className="flex gap-1 items-center">
                  <span className="text-orange-700 font-medium">🎨 Цвет:</span>
                  <span className="font-bold text-orange-900">{task.product.color}</span>
                </div>
              </div>
            )}

            {/* Материал обшивки - для швеи */}
            {isSewer && task.product.upholsteryMaterial && (
              <div className="mt-1 pt-1 border-t border-purple-200 bg-purple-50 p-1 rounded">
                <div className="flex gap-1 items-center">
                  <span className="text-purple-700 font-medium">🧵 Обшивка:</span>
                  <span className="font-bold text-purple-900">{task.product.upholsteryMaterial}</span>
                </div>
              </div>
            )}

            {/* Фото схемы - только ссылка */}
            {task.product.schemaImageUrl && (
              <div className="mt-1 pt-1 border-t">
                <a
                  href={task.product.schemaImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 hover:text-blue-800 underline flex items-center gap-0.5"
                >
                  <Package size={10} />
                  Схема
                </a>
              </div>
            )}
          </div>
        )}

        {/* Примечания */}
        {task.notes && (
          <div className="mb-2 p-1.5 bg-yellow-50 border border-yellow-200 rounded text-[10px]">
            <p className="font-medium text-yellow-900">Примечание:</p>
            <p className="text-yellow-800 truncate">{task.notes}</p>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="space-y-2">
          {/* Для складиста - особая логика */}
          {isWarehouse && task.status === TaskStatus.NEW && !showRejectForm && !showApproveForm && (
            <div className="flex gap-1.5">
              <Button
                onClick={() => setShowApproveForm(true)}
                className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5"
                variant="default"
                size="sm"
              >
                <CheckCircle size={12} />
                Принять
              </Button>
              <Button
                onClick={() => setShowRejectForm(true)}
                className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5"
                variant="destructive"
                size="sm"
              >
                <XCircle size={12} />
                Брак
              </Button>
            </div>
          )}

          {/* Форма принятия на склад */}
          {showApproveForm && (
            <div className="space-y-2 p-3 border rounded-md bg-green-50">
              {task.product && task.product.quantity > 1 && (
                <>
                  <label className="block text-sm font-medium">
                    Количество принятого товара
                  </label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min={1}
                    max={task.product?.quantity || undefined}
                  />
                </>
              )}
              {task.product && task.product.quantity === 1 && (
                <p className="text-sm font-medium text-green-800">
                  Принять на склад: {task.product.quantity} шт.
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending || quantity <= 0}
                  className="flex-1"
                >
                  {approveMutation.isPending ? 'Сохранение...' : 'Подтвердить'}
                </Button>
                <Button
                  onClick={() => setShowApproveForm(false)}
                  variant="outline"
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}

          {/* Форма браковки */}
          {showRejectForm && (
            <div className="space-y-3 p-3 border rounded-md bg-red-50">
              <div className="text-sm text-gray-600 mb-2">
                Доступно для обработки: <strong>{availableQuantity} шт.</strong>
              </div>

              {/* Поле количества брака */}
              {availableQuantity > 1 && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Количество брака
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={availableQuantity}
                    value={rejectQuantity}
                    onChange={(e) => setRejectQuantity(Math.min(availableQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    После брака {rejectQuantity} шт., останется {availableQuantity - rejectQuantity} шт. для приёма на склад
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Причина браковки
                </label>
                <Input
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Опишите причину..."
                />
              </div>

              {/* Выбор стадии для возврата брака */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Вернуть на стадию
                </label>
                <select
                  value={returnToStage}
                  onChange={(e) => setReturnToStage(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="PENDING">Менеджер</option>
                  <option value="DESIGN">Проектирование</option>
                  <option value="PREPARATION">Заготовка</option>
                  <option value="PAINTING">Покраска</option>
                  <option value="SEWING">Пошив</option>
                  <option value="ASSEMBLY">Сборка</option>
                </select>
              </div>

              {/* Чекбокс для запроса фото через бот */}
              <div className="flex items-center gap-2 p-2 border border-blue-200 rounded-md bg-blue-50">
                <input
                  type="checkbox"
                  id="requestPhotoCheckbox"
                  checked={requestPhotoViaTelegram}
                  onChange={(e) => setRequestPhotoViaTelegram(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="requestPhotoCheckbox" className="text-sm font-medium text-blue-900 cursor-pointer">
                  📸 Запросить {rejectQuantity} {rejectQuantity === 1 ? 'фото' : rejectQuantity < 5 ? 'фото' : 'фото'} через Telegram
                </label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => rejectMutation.mutate()}
                  disabled={rejectMutation.isPending || !rejectNotes}
                  variant="destructive"
                  className="flex-1"
                >
                  {rejectMutation.isPending ? 'Отправка...' : 'Забраковать'}
                </Button>
                <Button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectNotes('');
                    setRequestPhotoViaTelegram(false);
                  }}
                  variant="outline"
                >
                  Отмена
                </Button>
              </div>

              {/* Error message */}
              {rejectMutation.isError && (
                <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-800">
                  <p className="font-medium">Ошибка при браковке!</p>
                  <p className="text-xs mt-1">
                    {rejectMutation.error?.response?.data?.message ||
                     rejectMutation.error?.message ||
                     'Проверьте консоль браузера для подробностей'}
                  </p>
                </div>
              )}

              {/* Help text */}
              {!rejectNotes && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  ℹ️ Заполните причину браковки
                </div>
              )}
            </div>
          )}

          {/* Для остальных ролей - обычная последовательность */}
          {!isWarehouse && (
            <>
              {task.status === TaskStatus.NEW && (
                <Button
                  onClick={() => {
                    // Для задач с браком - сразу принимаем без выбора (брак адресован конкретному работнику)
                    const isDefectTask = task.title?.includes('БРАК');
                    if (needsWorkerSelection && !isDefectTask) {
                      setShowWorkerSelectModal(true);
                    } else {
                      // Для задач брака передаём ID назначенного работника
                      acceptMutation.mutate(isDefectTask ? { workerId: task.assignedTo?.id } : undefined);
                    }
                  }}
                  disabled={acceptMutation.isPending}
                  className="w-full flex items-center justify-center gap-1 text-xs py-1.5"
                  size="sm"
                >
                  <Package size={12} />
                  {acceptMutation.isPending ? 'Принятие...' : 'Принять'}
                </Button>
              )}

              {/* Модальное окно выбора сотрудника и количества */}
              {showWorkerSelectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-4 w-full max-w-sm mx-4 shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <User size={20} className="text-blue-600" />
                      <h3 className="text-lg font-bold">Принять задачу</h3>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Кто будет выполнять задачу "{task.title}"?
                      </p>

                      {isLoadingWorkers ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        <>
                          <select
                            value={selectedWorkerId}
                            onChange={(e) => setSelectedWorkerId(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-base mb-3"
                          >
                            <option value="">-- Выберите сотрудника --</option>
                            {departmentWorkers?.map((worker) => (
                              <option key={worker.id} value={worker.id}>
                                {worker.lastName} {worker.firstName} {worker.id === currentUserId ? '(Я)' : ''}
                              </option>
                            ))}
                          </select>

                          {/* Выбор количества */}
                          {(task.quantity || task.product?.quantity || 1) > 1 && (
                            <div className="mb-3">
                              <label className="text-sm text-gray-600 block mb-1">
                                Количество (из {task.quantity || task.product?.quantity}):
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={task.quantity || task.product?.quantity || 1}
                                value={acceptQuantity}
                                onChange={(e) => setAcceptQuantity(Math.min(
                                  Math.max(1, parseInt(e.target.value) || 1),
                                  task.quantity || task.product?.quantity || 1
                                ))}
                                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-base"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => acceptMutation.mutate({ workerId: selectedWorkerId, quantity: acceptQuantity })}
                        disabled={!selectedWorkerId || acceptMutation.isPending}
                        className="flex-1"
                      >
                        {acceptMutation.isPending ? 'Принятие...' : `Принять ${acceptQuantity} шт.`}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowWorkerSelectModal(false);
                          setSelectedWorkerId('');
                          setAcceptQuantity(task.quantity || task.product?.quantity || 1);
                        }}
                        variant="outline"
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {task.status === TaskStatus.ACCEPTED && !showNotesInput && (
                <Button
                  onClick={() => {
                    // Если количество = 1, сразу завершаем без формы
                    if (task.product && task.product.quantity === 1) {
                      completeMutation.mutate();
                    } else {
                      // Если количество > 1, показываем форму
                      setShowNotesInput(true);
                    }
                  }}
                  disabled={completeMutation.isPending}
                  className="w-full flex items-center justify-center gap-1 text-xs py-1.5"
                  size="sm"
                >
                  <CheckCircle size={12} />
                  {completeMutation.isPending ? 'Завершение...' : 'Завершить'}
                </Button>
              )}

              {showNotesInput && task.status === TaskStatus.ACCEPTED && (
                <div className="space-y-2 p-3 border rounded-md bg-blue-50">
                  {task.product && task.product.quantity > 1 && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Количество завершённых изделий
                      </label>
                      <Input
                        type="number"
                        value={completedQuantity}
                        onChange={(e) => setCompletedQuantity(Number(e.target.value))}
                        min={0}
                        max={task.product?.quantity || 0}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Всего в заказе: {task.product?.quantity || 0} шт.
                      </p>
                    </div>
                  )}
                  {task.product && task.product.quantity === 1 && (
                    <div className="p-2 bg-blue-100 border border-blue-300 rounded">
                      <p className="text-sm font-medium text-blue-800">
                        Завершить работу: {task.product.quantity} шт.
                      </p>
                    </div>
                  )}
                  {!isSimplifiedRole && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Примечания (необязательно)
                      </label>
                      <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Добавьте примечание..."
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => completeMutation.mutate()}
                      disabled={completeMutation.isPending || completedQuantity <= 0}
                      className="flex-1"
                    >
                      {completeMutation.isPending ? 'Сохранение...' : 'Подтвердить'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowNotesInput(false);
                        setNotes('');
                      }}
                      variant="outline"
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              )}

              {task.status === TaskStatus.COMPLETED && (
                <Button
                  onClick={() => passMutation.mutate()}
                  disabled={passMutation.isPending}
                  className="w-full flex items-center justify-center gap-1 text-xs py-1.5"
                  variant="default"
                  size="sm"
                >
                  <ArrowRight size={12} />
                  {passMutation.isPending ? 'Передача...' : 'Передать'}
                </Button>
              )}
            </>
          )}

          {/* Статус завершенных задач */}
          {task.status === TaskStatus.PASSED && (
            <div className="text-center p-1.5 bg-purple-50 border border-purple-200 rounded text-[10px] text-purple-800 font-medium">
              Передано
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
