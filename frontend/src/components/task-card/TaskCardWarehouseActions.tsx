import { useState } from 'react';
import { Task, TaskStatus } from '@/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { tasksApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle } from 'lucide-react';
import { handleMutationError } from '@/lib/error-handler';

interface TaskCardWarehouseActionsProps {
  task: Task;
}

export const TaskCardWarehouseActions = ({ task }: TaskCardWarehouseActionsProps) => {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(task.quantity || task.product?.quantity || 0);
  const [rejectNotes, setRejectNotes] = useState('');
  const [rejectQuantity, setRejectQuantity] = useState(1);
  const [requestPhotoViaTelegram, setRequestPhotoViaTelegram] = useState(false);
  const [returnToStage, setReturnToStage] = useState<string>('PAINTING');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [enablePenalty, setEnablePenalty] = useState(false);
  const [penaltyAmount, setPenaltyAmount] = useState(0);
  const [showApproveForm, setShowApproveForm] = useState(false);

  const availableQuantity = (task.quantity || task.product?.quantity || 0) - (task.quantityProcessed || 0);

  const rejectMutation = useMutation({
    mutationFn: async () => {
      return tasksApi.rejectTask(task.id, {
        notes: rejectNotes,
        quantity: rejectQuantity,
        requestPhoto: requestPhotoViaTelegram,
        returnToStage,
        ...(enablePenalty && penaltyAmount > 0 ? { penaltyAmount } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setRejectNotes('');
      setRejectQuantity(1);
      setRequestPhotoViaTelegram(false);
      setEnablePenalty(false);
      setPenaltyAmount(0);
      setShowRejectForm(false);
    },
    onError: (error: any) => handleMutationError(error, 'Ошибка при браковке'),
  });

  const approveMutation = useMutation({
    mutationFn: () => tasksApi.approveTask(task.id, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowApproveForm(false);
    },
  });

  if (task.status !== TaskStatus.NEW) return null;

  return (
    <>
      {!showRejectForm && !showApproveForm && (
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
            <Button onClick={() => setShowApproveForm(false)} variant="outline">
              Отмена
            </Button>
          </div>
        </div>
      )}

      {showRejectForm && (
        <div className="space-y-3 p-3 border rounded-md bg-red-50">
          <div className="text-sm text-gray-600 mb-2">
            Доступно для обработки: <strong>{availableQuantity} шт.</strong>
          </div>

          {availableQuantity > 1 && (
            <div>
              <label className="block text-sm font-medium mb-1">Количество брака</label>
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
            <label className="block text-sm font-medium mb-1">Причина браковки</label>
            <Input
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Опишите причину..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Вернуть на стадию</label>
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

          <div className="flex items-center gap-2 p-2 border border-blue-200 rounded-md bg-blue-50">
            <input
              type="checkbox"
              id="requestPhotoCheckbox"
              checked={requestPhotoViaTelegram}
              onChange={(e) => setRequestPhotoViaTelegram(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="requestPhotoCheckbox" className="text-sm font-medium text-blue-900 cursor-pointer">
              📸 Запросить {rejectQuantity} фото через Telegram
            </label>
          </div>

          <div className="p-2 border border-orange-200 rounded-md bg-orange-50">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="enablePenaltyCheckbox"
                checked={enablePenalty}
                onChange={(e) => {
                  setEnablePenalty(e.target.checked);
                  if (!e.target.checked) setPenaltyAmount(0);
                }}
                className="w-4 h-4"
              />
              <label htmlFor="enablePenaltyCheckbox" className="text-sm font-medium text-orange-900 cursor-pointer">
                ⚠️ Назначить штраф
              </label>
            </div>
            {enablePenalty && (
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-1">
                  {[200, 400, 600, 800, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPenaltyAmount(amt)}
                      className={`px-1 py-1.5 rounded text-xs font-medium border transition-colors ${
                        penaltyAmount === amt
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {amt} ₽
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPenaltyAmount(amt)}
                      className={`px-1 py-1.5 rounded text-xs font-medium border transition-colors ${
                        penaltyAmount === amt
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {amt} ₽
                    </button>
                  ))}
                </div>
                {penaltyAmount > 0 && (
                  <p className="text-xs text-red-700 font-medium">
                    💰 Штраф: {penaltyAmount} ₽
                  </p>
                )}
              </div>
            )}
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
                setEnablePenalty(false);
                setPenaltyAmount(0);
              }}
              variant="outline"
            >
              Отмена
            </Button>
          </div>

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

          {!rejectNotes && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              ℹ️ Заполните причину браковки
            </div>
          )}
        </div>
      )}
    </>
  );
};
