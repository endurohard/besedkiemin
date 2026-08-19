import { useState } from 'react';
import { Task } from '@/types';
import { Button } from '../ui/Button';
import { tasksApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { User, Minus, Plus } from 'lucide-react';

interface TaskCardWorkerSelectModalProps {
  task: Task;
  currentUserId?: string;
  acceptQuantity: number;
  onAcceptQuantityChange: (qty: number) => void;
  isPending: boolean;
  onConfirm: (workerId: string, quantity: number, pin: string) => void;
  onClose: () => void;
}

export const TaskCardWorkerSelectModal = ({
  task,
  currentUserId,
  acceptQuantity,
  onAcceptQuantityChange,
  isPending,
  onConfirm,
  onClose,
}: TaskCardWorkerSelectModalProps) => {
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [pin, setPin] = useState('');

  const { data: departmentWorkers, isLoading: isLoadingWorkers } = useQuery({
    queryKey: ['department-workers'],
    queryFn: tasksApi.getDepartmentWorkers,
  });

  // Авто-выбор НЕ делаем: сотрудник обязан явно выбрать своё имя из списка,
  // иначе кнопка «Принять» остаётся заблокированной.

  const taskQuantity = task.quantity || task.product?.quantity || 1;

  const decrement = () => onAcceptQuantityChange(Math.max(1, acceptQuantity - 1));
  const increment = () => onAcceptQuantityChange(Math.min(taskQuantity, acceptQuantity + 1));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-4 w-full max-w-sm mx-4 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <User size={20} className="text-primary" />
          <h3 className="text-lg font-bold">Принять задачу</h3>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">
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
                className="w-full p-3 border border-border rounded-lg bg-card text-base mb-3"
              >
                <option value="">-- Выберите сотрудника --</option>
                {departmentWorkers?.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.lastName} {worker.firstName} {worker.id === currentUserId ? '(Я)' : ''}
                  </option>
                ))}
              </select>

              {taskQuantity > 1 && (
                <div className="mb-3">
                  <label className="text-sm text-muted-foreground block mb-2">
                    Количество (из {taskQuantity}):
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={decrement}
                      disabled={acceptQuantity <= 1}
                      className="w-11 h-11 flex items-center justify-center rounded-lg border border-border bg-muted hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus size={18} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={taskQuantity}
                      value={acceptQuantity}
                      onChange={(e) => onAcceptQuantityChange(Math.min(
                        Math.max(1, parseInt(e.target.value) || 1),
                        taskQuantity
                      ))}
                      className="flex-1 p-3 border border-border rounded-lg bg-card text-base text-center font-semibold text-lg"
                    />
                    <button
                      type="button"
                      onClick={increment}
                      disabled={acceptQuantity >= taskQuantity}
                      className="w-11 h-11 flex items-center justify-center rounded-lg border border-border bg-muted hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              )}

              {selectedWorkerId && (
                <div className="mb-1">
                  <label className="text-sm text-muted-foreground block mb-2">
                    PIN-код сотрудника (если установлен):
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full p-3 border border-border rounded-lg bg-card text-base text-center tracking-[0.5em] font-semibold"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onConfirm(selectedWorkerId, acceptQuantity, pin)}
            disabled={!selectedWorkerId || isPending}
            className="flex-1"
          >
            {isPending ? 'Принятие...' : `Принять ${acceptQuantity} шт.`}
          </Button>
          <Button onClick={onClose} variant="outline">
            Отмена
          </Button>
        </div>
      </div>
    </div>
  );
};
