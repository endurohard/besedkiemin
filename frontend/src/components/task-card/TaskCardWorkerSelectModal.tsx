import { useState, useEffect } from 'react';
import { Task } from '@/types';
import { Button } from '../ui/Button';
import { tasksApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { User } from 'lucide-react';

interface TaskCardWorkerSelectModalProps {
  task: Task;
  currentUserId?: string;
  acceptQuantity: number;
  onAcceptQuantityChange: (qty: number) => void;
  isPending: boolean;
  onConfirm: (workerId: string, quantity: number) => void;
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

  const { data: departmentWorkers, isLoading: isLoadingWorkers } = useQuery({
    queryKey: ['department-workers'],
    queryFn: tasksApi.getDepartmentWorkers,
  });

  useEffect(() => {
    if (departmentWorkers && selectedWorkerId === '' && currentUserId) {
      const currentWorker = departmentWorkers.find(w => w.id === currentUserId);
      if (currentWorker) {
        setSelectedWorkerId(currentUserId);
      }
    }
  }, [departmentWorkers, currentUserId, selectedWorkerId]);

  const taskQuantity = task.quantity || task.product?.quantity || 1;

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
                  <label className="text-sm text-muted-foreground block mb-1">
                    Количество (из {taskQuantity}):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={taskQuantity}
                    value={acceptQuantity}
                    onChange={(e) => onAcceptQuantityChange(Math.min(
                      Math.max(1, parseInt(e.target.value) || 1),
                      taskQuantity
                    ))}
                    className="w-full p-3 border border-border rounded-lg bg-card text-base"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onConfirm(selectedWorkerId, acceptQuantity)}
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
