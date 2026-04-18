import { useState } from 'react';
import { Task, TaskStatus } from '@/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { tasksApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, ArrowRight, Package, Pencil } from 'lucide-react';
import { TaskCardWorkerSelectModal } from './TaskCardWorkerSelectModal';

interface TaskCardWorkerActionsProps {
  task: Task;
  currentUserId?: string;
  isSimplifiedRole: boolean;
  needsWorkerSelection: boolean;
}

export const TaskCardWorkerActions = ({
  task,
  currentUserId,
  isSimplifiedRole,
  needsWorkerSelection,
}: TaskCardWorkerActionsProps) => {
  // Если задача принята другим работником — показываем только статус
  const isAssignedToOther = task.status !== TaskStatus.NEW && task.assignedTo?.id && task.assignedTo.id !== currentUserId;
  if (isAssignedToOther) {
    const statusText = task.status === TaskStatus.ACCEPTED ? 'В работе' : task.status === TaskStatus.COMPLETED ? 'Завершено' : '';
    const workerName = `${task.assignedTo?.firstName || ''} ${task.assignedTo?.lastName || ''}`.trim();
    return (
      <div className="text-center p-1.5 bg-muted/50 border border-gray-200 rounded text-[10px] text-muted-foreground">
        {statusText} — {workerName}
      </div>
    );
  }
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [completedQuantity, setCompletedQuantity] = useState(task.quantity || task.product?.quantity || 0);
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [showWorkerSelectModal, setShowWorkerSelectModal] = useState(false);
  const [acceptQuantity, setAcceptQuantity] = useState(task.quantity || task.product?.quantity || 1);
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [editQuantity, setEditQuantity] = useState(task.quantity || task.product?.quantity || 0);

  const acceptMutation = useMutation({
    mutationFn: (params?: { workerId?: string; quantity?: number }) =>
      tasksApi.acceptTask(task.id, params?.workerId, params?.quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowWorkerSelectModal(false);
      setAcceptQuantity(task.quantity || task.product?.quantity || 1);
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => tasksApi.completeTask(task.id, { notes, quantity: completedQuantity }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNotes('');
      setShowNotesInput(false);

      if (isSimplifiedRole || (task.product && task.product.quantity === 1)) {
        try {
          await tasksApi.passTask(task.id);
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        } catch {
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

  const updateQuantityMutation = useMutation({
    mutationFn: (qty: number) => tasksApi.updateTaskQuantity(task.id, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['department-tasks'] });
      setIsEditingQuantity(false);
    },
  });

  return (
    <>
      {task.status === TaskStatus.NEW && (
        <Button
          onClick={() => {
            const isDefectTask = task.title?.includes('БРАК');
            if (needsWorkerSelection && !isDefectTask) {
              setShowWorkerSelectModal(true);
            } else {
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

      {showWorkerSelectModal && (
        <TaskCardWorkerSelectModal
          task={task}
          currentUserId={currentUserId}
          acceptQuantity={acceptQuantity}
          onAcceptQuantityChange={setAcceptQuantity}
          isPending={acceptMutation.isPending}
          onConfirm={(workerId, qty) => acceptMutation.mutate({ workerId, quantity: qty })}
          onClose={() => {
            setShowWorkerSelectModal(false);
            setAcceptQuantity(task.quantity || task.product?.quantity || 1);
          }}
        />
      )}

      {task.status === TaskStatus.ACCEPTED && !showNotesInput && (
        <div className="space-y-1">
          <Button
            onClick={() => {
              if (task.product && task.product.quantity === 1) {
                completeMutation.mutate();
              } else {
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
          {!isEditingQuantity ? (
            <button
              onClick={() => { setEditQuantity(task.quantity || task.product?.quantity || 0); setIsEditingQuantity(true); }}
              className="w-full flex items-center justify-center gap-1 text-[10px] py-1 text-muted-foreground hover:text-primary transition-colors"
            >
              <Pencil size={10} />
              Изменить кол-во
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={1}
                max={task.product?.quantity || 999}
                value={editQuantity}
                onChange={(e) => setEditQuantity(Number(e.target.value))}
                className="h-7 text-xs flex-1"
              />
              <button
                onClick={() => updateQuantityMutation.mutate(editQuantity)}
                disabled={updateQuantityMutation.isPending}
                className="px-2 py-1 bg-primary/100 text-white rounded text-[10px] hover:bg-primary/80"
              >
                OK
              </button>
              <button
                onClick={() => setIsEditingQuantity(false)}
                className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px] hover:bg-gray-300"
              >
                X
              </button>
            </div>
          )}
        </div>
      )}

      {showNotesInput && task.status === TaskStatus.ACCEPTED && (
        <div className="space-y-2 p-3 border rounded-md bg-primary/10">
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
            <div className="p-2 bg-primary/20 border border-blue-300 rounded">
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
              onClick={() => { setShowNotesInput(false); setNotes(''); }}
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
  );
};
