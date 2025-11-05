import { useState } from 'react';
import { Task, TaskStatus, UserRole } from '@/types';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { useAuthStore } from '@/store/authStore';
import { tasksApi, uploadApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, CheckCircle, XCircle, ArrowRight, Package } from 'lucide-react';
import { TaskTimer } from './TaskTimer';

interface TaskCardProps {
  task: Task;
}

export const TaskCard = ({ task }: TaskCardProps) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(task.product?.quantity || 0);
  const [completedQuantity, setCompletedQuantity] = useState(task.product?.quantity || 0);
  const [rejectNotes, setRejectNotes] = useState('');
  const [rejectQuantity, setRejectQuantity] = useState(1); // Количество брака
  const [requestPhotoViaTelegram, setRequestPhotoViaTelegram] = useState(false);
  const [returnToStage, setReturnToStage] = useState<string>('PAINTING'); // Стадия для возврата
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showApproveForm, setShowApproveForm] = useState(false);

  // Доступное количество для обработки
  const availableQuantity = (task.quantity || task.product?.quantity || 0) - (task.quantityProcessed || 0);

  const isWarehouse = user?.role === UserRole.WAREHOUSE;
  const isPreparer = user?.role === UserRole.PREPARER;
  const isPainter = user?.role === UserRole.PAINTER;
  const isSimplifiedRole = isPreparer || isPainter; // Упрощенный интерфейс для заготовщика и маляра

  // Мутации для действий с задачами
  const acceptMutation = useMutation({
    mutationFn: () => tasksApi.acceptTask(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => tasksApi.completeTask(task.id, { notes, quantity: completedQuantity }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNotes('');
      setShowNotesInput(false);

      // Если количество = 1, автоматически передаем дальше
      if (task.product && task.product.quantity === 1) {
        // Небольшая задержка чтобы дать серверу обновить статус
        setTimeout(() => {
          passMutation.mutate();
        }, 300);
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
      console.log('🚨 Starting reject mutation', { rejectNotes, rejectQuantity, requestPhoto: requestPhotoViaTelegram, returnToStage });

      const result = await tasksApi.rejectTask(task.id, {
        notes: rejectNotes,
        quantity: rejectQuantity,
        requestPhoto: requestPhotoViaTelegram,
        returnToStage: returnToStage
      });
      console.log('✅ Task rejected successfully:', result);
      return result;
    },
    onSuccess: () => {
      console.log('✅ Reject mutation success, updating UI...');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setRejectNotes('');
      setRejectQuantity(1);
      setRequestPhotoViaTelegram(false);
      setShowRejectForm(false);
    },
    onError: (error: any) => {
      console.error('❌ Reject mutation error:', error);
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
    <Card className="mb-3">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold truncate">{task.title}</CardTitle>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusColor(
              task.status
            )}`}
          >
            {getStatusText(task.status)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {/* Таймер задачи с приоритетом */}
        <TaskTimer
          createdAt={task.createdAt}
          acceptedAt={task.acceptedAt}
          productionTimeHours={task.product?.productType?.productionTimeHours}
          priority={task.priority}
        />

        {/* Информация о продукте и заказе */}
        {task.product && (
          <div className="mb-3 p-2 bg-muted/50 rounded-md">
            <div className="space-y-1 text-xs">
              <div>
                <span className="text-muted-foreground">Продукт:</span>
                <p className="font-medium truncate">{task.product.name}</p>
              </div>
              {task.product.productType && (
                <div>
                  <span className="text-muted-foreground">Тип:</span>
                  <p className="font-medium truncate">{task.product.productType.name}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Количество:</span>
                <span className="font-medium ml-1">{task.quantity || task.product.quantity} шт.</span>
              </div>
              {task.product.dimensions && (
                <div>
                  <span className="text-muted-foreground">Размеры:</span>
                  <p className="font-medium text-xs">{task.product.dimensions}</p>
                </div>
              )}
            </div>

            {/* Фото схемы - только ссылка */}
            {task.product.schemaImageUrl && (
              <div className="mt-2 pt-2 border-t">
                <a
                  href={`http://localhost:3000${task.product.schemaImageUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                >
                  <Package size={12} />
                  Схема продукта
                </a>
              </div>
            )}
          </div>
        )}

        {/* Временная информация - компактная */}
        {(task.acceptedAt || task.completedAt) && (
          <div className="flex flex-col gap-1 text-xs text-muted-foreground mb-3">
            {task.acceptedAt && (
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>Принято: {new Date(task.acceptedAt).toLocaleString('ru', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
            )}
            {task.completedAt && (
              <div className="flex items-center gap-1">
                <CheckCircle size={12} />
                <span>Завершено: {new Date(task.completedAt).toLocaleString('ru', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
            )}
          </div>
        )}

        {/* Примечания */}
        {task.notes && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <p className="font-medium text-yellow-900">Примечание:</p>
            <p className="text-yellow-800">{task.notes}</p>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="space-y-3">
          {/* Для складиста - особая логика */}
          {isWarehouse && task.status === TaskStatus.NEW && !showRejectForm && !showApproveForm && (
            <div className="flex gap-2">
              <Button
                onClick={() => setShowApproveForm(true)}
                className="flex-1 flex items-center justify-center gap-2"
                variant="default"
              >
                <CheckCircle size={16} />
                Принять на склад
              </Button>
              <Button
                onClick={() => setShowRejectForm(true)}
                className="flex-1 flex items-center justify-center gap-2"
                variant="destructive"
              >
                <XCircle size={16} />
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
                    min={0}
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
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Package size={16} />
                  {acceptMutation.isPending ? 'Принятие...' : 'Принять в работу'}
                </Button>
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
                  className="w-full flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} />
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
                  className="w-full flex items-center justify-center gap-2"
                  variant="default"
                >
                  <ArrowRight size={16} />
                  {passMutation.isPending ? 'Передача...' : 'Передать дальше'}
                </Button>
              )}
            </>
          )}

          {/* Статус завершенных задач */}
          {task.status === TaskStatus.PASSED && (
            <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded text-sm text-purple-800 font-medium">
              Задача передана на следующий этап
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
